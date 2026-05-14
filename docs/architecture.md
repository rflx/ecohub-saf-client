# Architekturuebersicht

EcoHub SAF Client ist als lokale Desktop-App auf Basis von Electron, React und TypeScript aufgebaut.

## Schichten

- Electron Main Process: startet das Browserfenster und kapselt Desktop-spezifische Funktionen.
- Preload Script: definierter Uebergang zwischen Main Process und Renderer, aktuell mit einer schmalen SAF-API-Bridge fuer JSON-Requests.
- React Renderer: stellt Seiten, Navigation und spaetere Support-Workflows dar.
- SAF Domain: enthaelt fachliche SAF-Regeln wie die Aufloesung von Input- und Output-Topics sowie Runtime-Aufloesung von API-Operationen.
- Models: beschreiben SAF Profile, TechUser Auth und Enrollment, SAF Environments, API Management, Kafka-Konfigurationen, Topics, SAF Events und Logs.
- Services: kapseln lokalen ProfileStorage, TechUser Enrollment, SecretStore und die vorbereitete Kafka-Grenze.
- SAF OpenAPI Layer: verwaltet die zentrale SAF API Registry, lokal versionierte OpenAPI Specs, Synchronisation aus externen GitHub Raw URLs und generierte TypeScript-Typen fuer SAF APIs.
- Kafka Transport: markiert die technische Grenze fuer eine spaetere echte Kafka-Implementierung.

## Datenfluss

Die aktuelle Basis arbeitet mit lokalen Profil-, Environment- und Secret-Daten und fuehrt fuer Tech User Enrollment einen echten General-API-POST ueber den Electron Main Process aus. Kafka, OAuth2 Token Retrieval und mTLS Runtime sind nicht angebunden. SAF Environments enthalten einen leeren Service Host als API Base URL, aktive API-Versionen und Timeouts. Profile koennen ueber die Profiles-Seite angelegt und bearbeitet werden; die Profilmaske zeigt aktuell reduzierte SAF Identity und Tech User Enrollment. Bei der Neuanlage entsteht die Profil-ID live aus Profilname und Environment im Format `profilname-environment`.

Der `ProfileStorageService` haelt SAF Profile, Kafka-Konfigurationen, SAF Environments und die aktive Profilauswahl im Renderer. Initial wird ein leerer Profil- und Kafka-Snapshot mit Environment-Defaults geladen; nach GUI-Aenderungen persistiert der Service den Snapshot im Renderer-`localStorage`. Beim Laden alter lokaler Snapshots entfernt der Service fruehere Beispielprofile und deren Kafka-Konfigurationen; der lokale Secret-Store entfernt den frueheren Mock-Secret-Speicherkey. Beim Loeschen eines Profils entfernt der Service auch die profilgebundenen Eintraege aus dem lokalen Secret-Store. Unter macOS liegt die zugehoerige Electron-Persistenz standardmaessig unter `~/Library/Application Support/EcoHub SAF Client/`. Der Main-Prozess setzt den Chromium-Disk-Cache unter macOS auf `~/Library/Caches/EcoHub SAF Client/` und migriert beim Start den alten Cache-Ordner `~/Library/Caches/ecohub-saf-client/`, sofern der neue Ordner noch nicht existiert. Die Profiles-Seite liest daraus die Profile, erlaubt die Auswahl des aktiven Profils und bietet reduzierte Formulare fuer Neu-Anlage, Bearbeitung und Loeschen. Die Settings-Seite pflegt im ersten Bereich `API Environments` Service Host, Timeout und aktive API-Versionen getrennt nach `prod`, `iat`, `test` und `dev`; Host- und Timeout-Felder speichern beim Verlassen des Feldes. Alte lokale API-Konfigurationsformate werden nicht mehr migriert; Environments koennen in der GUI neu gesetzt werden.

Die zentrale API-Registry verwaltet verfuegbare API-Familien, Versionen, versionierte API Base Paths, Spec-Source-URLs, lokale Spec-Pfade, generierte TypeScript-Pfade und Support-Status. Operation-Metadaten werden beim Codegen aus den lokalen OpenAPI-YAML-Dateien extrahiert und in `src/saf/generated/apiOperationRegistry.ts` abgelegt. Daraus werden sowohl die OpenAPI-Spec-Konfiguration fuer Sync/Codegen als auch das Renderer-API-Management abgeleitet. Die Settings-Seite rendert die aktiven Versionen dynamisch pro registrierter API-Familie und zeigt Detailinformationen pro Version absteigend sortiert in Accordions; die neueste Version je API-Familie ist initial geoeffnet und danach normal ein- und ausklappbar. Fehlende aktive Versionen und deprecated aktive Versionen werden als Warnung dargestellt.

Der `ApiRuntimeResolver` loest spaetere API Calls ohne Netzwerklogik ueber `profileId` oder `environmentId`, `apiId` und `operationId` auf. Der Ablauf ist `Profile -> Environment -> Active API Version Mapping -> API Base Path -> Operation Resolver`. Das Ergebnis enthaelt `apiId`, `apiName`, `baseUrl`, `apiVersion`, `apiBasePath`, `operationId`, `operationName`, `operationPath` und `resolvedUrl`. Wenn ein Environment versehentlich bereits mit dem aktiven API Base Path endet, wird dieser Pfad nicht erneut angehaengt. Das Active-Version-Mapping verwendet die Registry-`apiId` als Key, damit neue API-Familien ohne weitere Runtime-Verzweigung aufgeloest werden koennen.

TechUser Auth ist pro Profil als `TechUserAuthConfig` modelliert. Die Konfiguration enthaelt `availableMethods`, `preferredMethod`, TechUser IDP Number, optionale Secret-Referenzen fuer mTLS- und OAuth2-Material, OpenID- und Token-Endpunkte sowie Enrollment-Status. Profile koennen ohne gespeicherte Authentifizierungsmethode als `not-enrolled` gespeichert werden.

Der `TechUserEnrollmentService` baut den OpenAPI-konformen Payload fuer `EnrolTechUser` mit `idpUserId`, `password`, `iak`, `licenceKey`, UUID-`requestId`, aktuellem UTC-`requestTime` und App-`userAgent` als Objekt aus Name und Version. Runtime-URL und API-Version werden ueber `Profile/Environment -> activeApiVersions['general-api'] -> ApiRuntimeResolver -> Operation techUserEnrolment` aufgeloest. Der `GeneralApiService` nutzt diese aufgeloeste Version, um den Enrollment-POST gegen den passenden versionierten General-API-Typ aus `src/saf/generated/` auszufuehren; unbekannte General-API-Versionen werden fuer Enrollment explizit abgelehnt. Der Service nutzt den gemeinsamen `SafApiHttpService` und sendet den echten POST ausschliesslich ueber `window.safApi.requestJson`; diese Preload-Bridge ruft einen IPC-Handler im Main Process auf, der Node `https.request` bzw. `http.request` verwendet und damit nicht im Renderer-Browser-Kontext laeuft. Die Bridge akzeptiert JSON-Requests mit `GET`, `POST`, `PUT`, `PATCH` und `DELETE`, sodass spaetere Calls fuer General API, Public Key Store API oder weitere registrierte APIs auf derselben technischen Basis implementiert werden koennen. Ein direkter Renderer-`fetch`-Fallback ist absichtlich nicht vorhanden, weil der Service Host keinen CORS-Preflight fuer Browser-Requests beantworten muss. Fehlt die Bridge, bricht der Call mit einer Diagnose zur Preload/Main-Bridge ab. Die Profilmaske zeigt fuer den Call eine Output-Konsole mit Start-, Fehler- und Response-Zustand inklusive API-ID, API-Name, API-Version, API-Base-Path, Operation-ID und aufgeloester Request-URL; API-Fehler werden mit HTTP-Status, `errorCode`, `errorMessage` und rohem API-Body angezeigt. Netzwerkfehler werden als SAF-API-Netzwerkfehler mit Hinweisen auf Host, Netzwerk, TLS/Zertifikat und Erreichbarkeit ausgegeben; `ERR_SSL_CLIENT_AUTH_CERT_NEEDED` erhaelt einen spezifischen Hinweis, dass der Node-HTTPS-Request fuer diesen Verbindungsversuch Client-Auth meldet. Wenn derselbe Endpoint in anderen Clients ohne Zertifikat erreichbar ist, verweist die Diagnose auf Host, Pfad, Proxy, DNS/SNI, VPN und Trust-/Zertifikatseinstellungen als Vergleichspunkte. Secrets und Zertifikate werden dort maskiert. Nach erfolgreicher Response speichert die Profilmaske `techUserCert`, OAuth2 Client-ID und OAuth2 Client-Secret im lokalen SecretStore und schreibt Secret-Referenzen, OpenID-Konfigurationsendpoint, `enrolled=true` ueber den Status `enrolled` sowie den Enrollment-Zeitpunkt ins Profil. Bei Validierungs-, Resolver- oder API-Fehlern wird das Profil nicht gespeichert.

Der `LocalSecretStore` kapselt Secret-Zugriffe ueber `setSecret(profileId, secretType, value)`, `getSecret(...)` und `deleteSecret(...)`. Profile speichern nur `SecretRef`-Objekte. Die Service-Grenze ist bewusst so gehalten, dass spaeter eine macOS-Keychain-Implementierung hinter demselben Interface ergaenzt werden kann.

Der SAF Topic Resolver verwendet standardmaessig `eh.saf.in.v1` als Input Topic und `eh.saf.{ecoHubId}.{standard}.out.v1` als Output Topic Pattern. Output Topics koennen ueber `outputTopicOverride` in der Kafka-Topic-Konfiguration ueberschrieben werden.

Weitere Kafka- oder API-Anbindungen sollten hinter den vorhandenen Service- und Client-Grenzen liegen und nicht direkt in UI-Komponenten implementiert werden.

## SAF OpenAPI Layer

Lokale OpenAPI Specs liegen unter `specs/`. Die zentrale API-Registry steht in `src/saf/apiRegistry.ts` und enthaelt ID, API-ID, Anzeigenamen, SemVer-Version, API Base Path, GitHub Raw Source URL, lokalen Spec-Pfad, TypeScript-Output-Pfad und Support-Status. Versionen werden als `1.0.0`, `1.2.0` oder `2.0.0` gepflegt; URL-Pfade wie `/general/v2` bleiben separat im `basePath`. `src/saf/specs/specConfig.ts` leitet daraus die reine Spec-Konfiguration fuer Sync und Codegen ab. Neue API-Familien und neue Versionen werden nur dort registriert; Operationen werden aus der jeweiligen OpenAPI-YAML extrahiert. Die Settings-Seite und der Runtime-Resolver arbeiten mit den Registry-`apiId`s dynamisch.

`scripts/sync-specs.ts` synchronisiert die konfigurierten YAML-Specs. Pro Spec werden Name, Source URL, Output Path und HTTP Status geloggt. Netzwerkfehler, 404-Antworten, leere Responses und Responses ohne OpenAPI-YAML-Signatur werden als Fehler behandelt; lokale Specs werden nur nach erfolgreichem Download ueberschrieben.

Generierte TypeScript-Typen liegen unter `src/saf/generated/`. `scripts/generate-api.ts` iteriert ueber die aus der API-Registry abgeleiteten Specs und erzeugt per `npm run generate:api` die passenden TypeScript-Dateien, darunter `general-api-1.2.0.ts`, `general-api-2.0.0.ts` und `public-key-store-api-2.0.0.ts`. Danach parst das Script die lokalen YAML-Dateien und schreibt `src/saf/generated/apiOperationRegistry.ts` mit `operationId`, Anzeigename, HTTP-Methode und Pfad. Der `SafApiHttpService` stellt die gemeinsame Runtime-Basis fuer JSON-Requests bereit; der `GeneralApiService` fuehrt darauf den echten POST fuer `EnrolTechUser` gegen die vom Resolver gelieferte URL und General-API-Version aus und delegiert den HTTP-Transport in Electron an den Main Process. Weitere General-API-Operationen und Public-Key-Store-Operationen bleiben aktuell reine OpenAPI-/API-Management-Metadaten ohne konkrete Service-Methode.

## Konfigurationsgrenzen

- SAF Domain: Profile mit SAF Identity inklusive `licenceKey`, TechUser Auth und Enrollment-Referenzen; EcoHub ID, Standard, Receiver, Key-Referenzen und Topic-Konfigurationen bleiben aktuell interne Platzhalter fuer spaetere Ausbaustufen.
- API Environments: gemeinsamer Service Host als Base URL und Timeout pro Environment.
- Kafka Transport: Broker-, Security-, Consumer-Group- und Topic-Konfiguration.
- UI: Profilanzeige, aktive Profilauswahl und lokale Konfiguration fuer SAF Identity, Tech User Enrollment, TechUser Auth und API Environments.
- API Runtime: General API Enrollment mit Netzwerkaufruf; Public Key Store API sowie weitere General-API-Operationen bleiben ohne Runtime-Client.
- API Registry: Single Source of Truth fuer verfuegbare APIs, Versionen, versionierte API Base Paths, Spec-Source-URLs, lokale Spec-Pfade, generierte TypeScript-Pfade und Support-Status. Operation-Metadaten werden aus OpenAPI generiert.
- OpenAPI Specs: Lokal versionierte YAML-Dateien unter `specs/`, synchronisierbar aus externen GitHub Raw URLs.

## Grenzen der aktuellen Basis

- Keine echte Kafka-Verbindung
- Keine echte API-Verbindung ausser Tech User Enrollment ueber die General API
- Keine echte OAuth-Token-Verbindung
- Keine echte OpenAPI-basierte Runtime-Client-Verbindung
- Keine echte Zertifikatsdatei oder Keychain-Persistenz
- Keine Persistenz ausserhalb des Renderer-`localStorage`
- Keine Secrets oder produktiven Konfigurationen
- Keine Backend- oder Cloud-Abhaengigkeiten
