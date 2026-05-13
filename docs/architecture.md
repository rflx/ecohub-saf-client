# Architekturuebersicht

EcoHub SAF Client ist als lokale Desktop-App auf Basis von Electron, React und TypeScript aufgebaut.

## Schichten

- Electron Main Process: startet das Browserfenster und kapselt Desktop-spezifische Funktionen.
- Preload Script: definierter Uebergang zwischen Main Process und Renderer.
- React Renderer: stellt Seiten, Navigation und spaetere Support-Workflows dar.
- SAF Domain: enthaelt fachliche SAF-Regeln wie die Aufloesung von Input- und Output-Topics sowie Runtime-Aufloesung von API-Operationen.
- Models: beschreiben SAF Profile, TechUser Auth und Enrollment, SAF Environments, API Management, Kafka-Konfigurationen, Topics, SAF Events und Logs.
- Services: kapseln lokalen ProfileStorage, TechUser Enrollment, SecretStore sowie Platzhalter-Clients fuer General API, Public Key Store API und Kafka.
- SAF OpenAPI Layer: verwaltet die zentrale SAF API Registry, lokal versionierte OpenAPI Specs, Synchronisation aus externen GitHub Raw URLs und generierte TypeScript-Typen fuer SAF APIs.
- Kafka Transport: markiert die technische Grenze fuer eine spaetere echte Kafka-Implementierung.
- Mock Data: liefert lokal testbare Beispielprofile, Events und Logs ohne externe Abhaengigkeiten.

## Datenfluss

Die aktuelle Basis arbeitet ausschliesslich mit lokalen Daten. Beispielprofile mit SAF Identity inklusive `licenceKey`, TechUser-Auth-Referenzen, Key-Referenzen, Topic-Konfigurationen, Events und Logs werden als TypeScript-Objekte im Renderer bereitgestellt. SAF Environments enthalten einen gemeinsamen Service Host als API Base URL und aktive API-Versionen. Profile und zugehoerige Kafka-Konfigurationen koennen ueber die Profiles-Seite angelegt und bearbeitet werden.

Der `ProfileStorageService` haelt SAF Profile, Kafka-Konfigurationen, SAF Environments und die aktive Profilauswahl im Renderer. Initial werden die Beispielprofile `Service Consumer DEV` mit OAuth2-TechUser-Referenz und `Service Provider DEV` mit mTLS-TechUser-Referenz geladen; nach GUI-Aenderungen persistiert der Service den Snapshot im Renderer-`localStorage`. Die Profiles-Seite liest daraus die Profile, erlaubt die Auswahl des aktiven Profils und bietet Formulare fuer Neu-Anlage, Bearbeitung und Loeschen. Die Settings-Seite pflegt im ersten Bereich `API Environments` Service Host, Timeout und aktive API-Versionen getrennt nach `prod`, `iat`, `test` und `dev`; Host- und Timeout-Felder speichern beim Verlassen des Feldes. Alte lokale API-Konfigurationsformate werden nicht mehr migriert; Environments koennen in der GUI neu gesetzt werden.

Die zentrale API-Registry verwaltet verfuegbare API-Familien, Versionen, versionierte API Base Paths, Spec-Source-URLs, lokale Spec-Pfade, generierte TypeScript-Pfade und Support-Status. Operation-Metadaten werden beim Codegen aus den lokalen OpenAPI-YAML-Dateien extrahiert und in `src/saf/generated/apiOperationRegistry.ts` abgelegt. Daraus werden sowohl die OpenAPI-Spec-Konfiguration fuer Sync/Codegen als auch das Renderer-API-Management abgeleitet. Die Settings-Seite rendert die aktiven Versionen dynamisch pro registrierter API-Familie und zeigt Detailinformationen pro Version absteigend sortiert in Accordions; die neueste Version je API-Familie ist geoeffnet. Fehlende aktive Versionen und deprecated aktive Versionen werden als Warnung dargestellt.

Der `ApiRuntimeResolver` loest spaetere API Calls ohne Netzwerklogik ueber `profileId` oder `environmentId`, `apiId` und `operationId` auf. Der Ablauf ist `Profile -> Environment -> Active API Version Mapping -> API Base Path -> Operation Resolver`. Das Ergebnis enthaelt `baseUrl`, `apiVersion`, `apiBasePath`, `operationPath` und `resolvedUrl`. Das Active-Version-Mapping verwendet die Registry-`apiId` als Key, damit neue API-Familien ohne weitere Runtime-Verzweigung aufgeloest werden koennen.

TechUser Auth ist pro Profil als `TechUserAuthConfig` modelliert. Die Konfiguration enthaelt `availableMethods`, `preferredMethod`, TechUser IDP Number, optionale Secret-Referenzen fuer mTLS- und OAuth2-Material, OpenID- und Token-Endpunkte sowie Enrollment-Status. Mindestens eine Authentifizierungsmethode muss fuer ein Profil gespeichert werden.

Der `TechUserEnrollmentService` ist aktuell eine Mock-Implementierung. Er simuliert den spaeteren General-API-Endpunkt `techUserEnrolment` und liefert mockbasierte mTLS- und OAuth2-Daten zurueck. Es gibt noch keine echte General-API-Verbindung, keine echte OAuth-Token-Anfrage und keine Zertifikatsdatei.

Der `LocalMockSecretStore` kapselt Secret-Zugriffe ueber `setSecret(profileId, secretType, value)`, `getSecret(...)` und `deleteSecret(...)`. Profile speichern nur `SecretRef`-Objekte. Die Service-Grenze ist bewusst so gehalten, dass spaeter eine macOS-Keychain-Implementierung hinter demselben Interface ergaenzt werden kann.

Der SAF Topic Resolver verwendet standardmaessig `eh.saf.in.v1` als Input Topic und `eh.saf.{ecoHubId}.{standard}.out.v1` als Output Topic Pattern. Output Topics koennen ueber `outputTopicOverride` in der Kafka-Topic-Konfiguration ueberschrieben werden.

Eine spaetere Kafka- oder API-Anbindung sollte hinter den vorhandenen Platzhalter-Clients liegen und nicht direkt in UI-Komponenten implementiert werden.

## SAF OpenAPI Layer

Lokale OpenAPI Specs liegen unter `specs/`. Die zentrale API-Registry steht in `src/saf/apiRegistry.ts` und enthaelt ID, API-ID, Anzeigenamen, SemVer-Version, API Base Path, GitHub Raw Source URL, lokalen Spec-Pfad, TypeScript-Output-Pfad und Support-Status. Versionen werden als `1.0.0`, `1.2.0` oder `2.0.0` gepflegt; URL-Pfade wie `/general/v2` bleiben separat im `basePath`. `src/saf/specs/specConfig.ts` leitet daraus die reine Spec-Konfiguration fuer Sync und Codegen ab. Neue API-Familien und neue Versionen werden nur dort registriert; Operationen werden aus der jeweiligen OpenAPI-YAML extrahiert. Die Settings-Seite und der Runtime-Resolver arbeiten mit den Registry-`apiId`s dynamisch.

`scripts/sync-specs.ts` synchronisiert die konfigurierten YAML-Specs. Pro Spec werden Name, Source URL, Output Path und HTTP Status geloggt. Netzwerkfehler, 404-Antworten, leere Responses und Responses ohne OpenAPI-YAML-Signatur werden als Fehler behandelt; lokale Specs werden nur nach erfolgreichem Download ueberschrieben.

Generierte TypeScript-Typen liegen unter `src/saf/generated/`. `scripts/generate-api.ts` iteriert ueber die aus der API-Registry abgeleiteten Specs und erzeugt per `npm run generate:api` die passenden TypeScript-Dateien, darunter `general-api-2.0.0.ts` und `public-key-store-api-2.0.0.ts`. Danach parst das Script die lokalen YAML-Dateien und schreibt `src/saf/generated/apiOperationRegistry.ts` mit `operationId`, Anzeigename, HTTP-Methode und Pfad. Runtime-Clients und Services sind unter `src/saf/clients` und `src/saf/services` vorbereitet. Der `GeneralApiService` beschreibt die Operationen `EnrolTechUser`, `SafReceivers` und `SafInsurers`, fuehrt aber bewusst noch keine echten HTTP-Requests aus.

## Konfigurationsgrenzen

- SAF Domain: Profile mit SAF Identity inklusive `licenceKey`, Receiver, TechUser Auth und Enrollment-Referenzen, Key-Referenzen und Topic-Resolver.
- API Environments: gemeinsamer Service Host als Base URL und Timeout pro Environment.
- Kafka Transport: Broker-, Security-, Consumer-Group- und Topic-Konfiguration.
- UI: Profilanzeige, aktive Profilauswahl und lokale Konfiguration fuer SAF Identity, Tech User Enrollment, TechUser Auth, Kafka Topics, API Environments und Key References.
- API Clients: Platzhalter fuer General API und Public Key Store API ohne Netzwerkaufrufe.
- API Registry: Single Source of Truth fuer verfuegbare APIs, Versionen, versionierte API Base Paths, Spec-Source-URLs, lokale Spec-Pfade, generierte TypeScript-Pfade und Support-Status. Operation-Metadaten werden aus OpenAPI generiert.
- OpenAPI Specs: Lokal versionierte YAML-Dateien unter `specs/`, synchronisierbar aus externen GitHub Raw URLs.

## Grenzen der aktuellen Basis

- Keine echte Kafka-Verbindung
- Keine echte API-Verbindung
- Keine echte OAuth-Token-Verbindung
- Keine echte OpenAPI-basierte Runtime-Client-Verbindung
- Keine echte Zertifikatsdatei oder Keychain-Persistenz
- Keine Persistenz ausserhalb des Renderer-`localStorage`
- Keine Secrets oder produktiven Konfigurationen
- Keine Backend- oder Cloud-Abhaengigkeiten
