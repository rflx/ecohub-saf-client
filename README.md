# EcoHub SAF Client

EcoHub SAF Client ist eine lokale Electron/React/TypeScript-App fuer Developer- und Support-Aufgaben rund um EcoHub SAF Kafka-Integrationen.

Die aktuelle Projektbasis stellt UI-Struktur, TypeScript-Models, SAF-Konfigurationsmodelle, lokale Profilverwaltung und den echten Tech User Enrollment Call ueber die General API bereit. Eine echte Kafka-Integration und OAuth2-/mTLS-Runtime sind bewusst nicht enthalten.

## Ziele

- Profile mit SAF Identity und Tech User Enrollment verwalten
- Kafka-Konfigurationen und Topics lokal modellieren
- SAF Service Host zentral pro Environment lokal konfigurieren
- SAF API Management fuer verfuegbare Specs, Versionen und aktive Versionen pro Environment pflegen
- Tech User Enrollment pro Profil ueber die aktive General-API-Version des gewaehlten Environments ausfuehren
- SAF Input- und Output-Topics aus Profil- und Kafka-Konfigurationen aufloesen
- SAF Events und technische Logs als spaetere lokale Ansichten vorbereiten
- Support- und Entwicklungsablaeufe ohne Secrets und ohne externe Systeme vorbereiten

## Tech Stack

- Electron Forge
- React
- TypeScript
- Vite

## Lokale Entwicklung

```bash
npm install
npm start
```

## OpenAPI Specs und Codegen

SAF OpenAPI Specs werden lokal unter `specs/` versioniert. Die aktuelle Basis enthaelt Specs fuer:

- `specs/general-api-2.0.0.yaml`
- `specs/public-key-store-api-2.0.0.yaml`

Die GitHub Raw URLs, API Base Paths und API-Management-Metadaten werden zentral in `src/saf/apiRegistry.ts` gepflegt. API-Versionen werden dort als SemVer-Strings wie `1.0.0`, `1.2.0` oder `2.0.0` angegeben; URL-Pfade wie `/general/v2` bleiben separat im `basePath`. Operation-Metadaten werden beim Codegen aus den lokalen OpenAPI-YAML-Dateien extrahiert und nach `src/saf/generated/apiOperationRegistry.ts` geschrieben. `src/saf/specs/specConfig.ts` und `src/renderer/data/apiManagement.ts` werden daraus abgeleitet. Specs koennen synchronisiert und daraus TypeScript-Typen generiert werden:

```bash
npm run sync:specs
npm run generate:api
```

`sync:specs` ueberschreibt lokale Specs nur nach einem erfolgreichen Download mit nicht-leerer OpenAPI-YAML-Response. `generate:api` erzeugt fuer alle in der API-Registry konfigurierten Specs TypeScript-Typen unter `src/saf/generated/` und aktualisiert die generierte Operation-Registry.

## Projektstruktur

- `src/main.ts`: Electron Main Process
- `src/preload.ts`: Preload Entry Point mit SAF-API-Bridge fuer JSON-Requests
- `src/renderer`: React Renderer App
- `src/renderer/domain/saf`: SAF-Domainlogik, aktuell Topic Resolver
- `src/renderer/domain/saf/apiRuntimeResolver.ts`: loest Profile oder Environments auf Service Host, aktiven API-Prefix und Operation-Pfad auf
- `src/renderer/models`: TypeScript Models
- `src/renderer/data`: Lokales API-Management und Environment-Defaults ohne Beispielprofile
- `src/renderer/services`: Lokaler ProfileStorage, Tech User Enrollment und SecretStore
- `src/renderer/transport/kafka`: Kafka-Transportgrenze fuer spaetere Implementierungen
- `src/saf`: Zentrale SAF API Registry, OpenAPI-basierte SAF-Spec-, Codegen- und General-API-Service-Struktur
- `specs`: Lokal versionierte SAF OpenAPI Specs
- `scripts/sync-specs.ts`: Spec-Synchronisation von GitHub Raw URLs
- `docs/architecture.md`: Architekturuebersicht

## SAF-Konfiguration

- Profile koennen in der App unter `Profile` ueber `Neu` angelegt und ueber `Bearbeiten` konfiguriert werden.
- Bei neuen Profilen wird die Profil-ID automatisch aus Profilname und Environment gebildet, zum Beispiel `service-consumer-dev`; Leerzeichen und Sonderzeichen werden durch Bindestriche ersetzt und der Wert wird kleingeschrieben.
- Die Profilmaske ist aktuell bewusst auf reduzierte `SAF Identity`-Basisdaten und `Tech User Enrollment` reduziert. EcoHub ID, Standard, General API Receiver, Kafka Topics und Key References werden dort nicht mehr angezeigt.
- Die lokale Profilverwaltung startet ohne Beispielprofile und speichert Profile mit SAF Identity inklusive `licenceKey` und optionalen TechUser-Auth-Referenzen im Renderer-`localStorage`. Neue Profile koennen vor dem Enrollment als `not-enrolled` gespeichert werden. Beim Laden alter lokaler Snapshots werden fruehere Beispielprofile und fruehere lokale Mock-Secrets entfernt. Beim Loeschen eines Profils werden auch die profilgebundenen lokalen Secrets entfernt. Interne Default-Konfigurationen fuer EcoHub ID, Standard, Kafka, Receiver und Key-Referenzen bleiben als technische Platzhalter erhalten, bis diese Bereiche spaeter fachlich ausgebaut werden.
- Unter macOS liegt diese lokale Electron-Persistenz im App-Support-Ordner `~/Library/Application Support/EcoHub SAF Client/`.
- Chromium-Disk-Cache wird unter macOS explizit in `~/Library/Caches/EcoHub SAF Client/` abgelegt; ein alter Ordner `~/Library/Caches/ecohub-saf-client/` wird beim App-Start migriert, wenn der neue Ordner noch nicht existiert.
- API Hosts werden nicht im Profil gespeichert, sondern unter `Einstellungen` im Bereich `API Environments` zentral pro Environment (`prod`, `iat`, `test`, `dev`) gepflegt.
- API-Environment-Felder speichern automatisch, sobald der Fokus das jeweilige Feld verlaesst.
- Pro Environment wird ein gemeinsamer Service Host als Base URL gepflegt; API-spezifische Pfade und Versionen werden nicht im Environment gespeichert. Falls versehentlich eine OpenAPI-Server-URL inklusive API Base Path wie `/general/v2` eingetragen wird, dupliziert die Runtime-Aufloesung diesen Base Path nicht.
- API-Familien, API-Versionen, versionierte API Base Paths, lokale Spec-Pfade, generierte TypeScript-Pfade und Support-Status kommen aus der zentralen API-Registry; Operation-Metadaten kommen aus der generierten Operation-Registry und werden im API Management unter `Einstellungen` pro Version absteigend sortiert in Accordions angezeigt, wobei die neueste Version pro API-Familie initial geoeffnet ist und danach normal ein- und ausgeklappt werden kann.
- Neue API-Familien und neue API-Versionen werden in `src/saf/apiRegistry.ts` eingetragen; Settings, Spec-Sync, Codegen und Runtime-Aufloesung uebernehmen sie daraus.
- Profile referenzieren weiterhin nur ein Environment. Spaetere API Calls sollen ueber `Profile -> Environment -> Active API Version -> ApiRuntimeResolver -> Operation` aufgeloest werden.
- Alle SAF API Calls sind fachlich einem SAF TechUser zugeordnet.
- TechUser Auth wird pro Profil mit `availableMethods`, `preferredMethod`, TechUser IDP Number, optionaler Passwort-Secret-Referenz und Enrollment-Status modelliert.
- Das Tech User Enrollment Formular fuehrt den echten General-API-Call `techUserEnrolment` / `EnrolTechUser` aus. Die aktive General-API-Version wird ueber das Profil-Environment und dessen Active-Version-Mapping aufgeloest; Endpoint und versionierte General-API-Typen fuer den Service-Call folgen dieser aufgeloesten Version und werden nicht im Formular hartcodiert. API-Requests laufen zwingend in Electron ueber eine schmale Preload/Main-Bridge, damit der Renderer nicht direkt aus dem Browser-Kontext gegen den Service Host fetches ausfuehren muss und kein CORS-Preflight den Call blockiert. Im Main Process werden JSON-Requests mit Node `https.request` bzw. `http.request` ausgefuehrt und unterstuetzen `GET`, `POST`, `PUT`, `PATCH` und `DELETE`. Ist diese Bridge nicht verfuegbar, bricht die App mit einer klaren Diagnose ab, statt auf Renderer-`fetch` zurueckzufallen. Der Enrollment-Bereich zeigt eine kleine Output-Konsole fuer Start-, Fehler- und Response-Daten inklusive API-ID, API-Name, API-Version, API-Base-Path, Operation-ID und aufgeloester Request-URL; API-Fehler enthalten dort HTTP-Status, `errorCode`, `errorMessage` und den rohen API-Body. TLS-Fehler mit `ERR_SSL_CLIENT_AUTH_CERT_NEEDED` erhalten einen gesonderten Hinweis, dass der Node-HTTPS-Request fuer diesen Verbindungsversuch Client-Auth meldet; falls der Endpoint in anderen Clients ohne Zertifikat erreichbar ist, sollen Host, Pfad, Proxy, DNS/SNI, VPN und Trust-/Zertifikatseinstellungen verglichen werden. Sensible Werte wie Passwort, Identification Code, Zertifikat und Client Secret werden maskiert.
- OAuth2 Enrollment-Daten werden lokal modelliert: `openIdConfigurationEndpoint`, optionaler `tokenEndpoint` und Scope `https://graph.microsoft.com/.default`.
- Das in der Profilmaske eingegebene TechUser-Passwort wird profilgebunden als `tech-user-password` im lokalen SecretStore gespeichert; das Profil speichert nur die Secret-Referenz. Bei erfolgreichem Enrollment werden zusaetzlich TechUser-Zertifikat, OAuth2 Client-ID und OAuth2 Client-Secret im lokalen SecretStore gespeichert. Das Profil speichert nur Secret-Referenzen, `openIdConfigurationEndpoint`, Enrollment-Status und Enrollment-Zeitpunkt. Identification Codes werden nicht gespeichert.
- `LocalSecretStore` kapselt lokale Secret-Zugriffe getrennt vom Profilmodell und kann spaeter durch eine macOS-Keychain-Implementierung ersetzt werden.
- General API und Public Key Store API bleiben im API Management und in den generierten OpenAPI-Typen sichtbar; echte Runtime-Aufrufe sind aktuell auf Tech User Enrollment begrenzt.
- SAF API Types werden aus lokalen OpenAPI Specs generiert. `SafApiHttpService` unter `src/saf/services` bildet die gemeinsame JSON-Request-Basis fuer Runtime-Services ueber die `window.safApi`-Bridge zum Electron Main Process. Der `GeneralApiService` nutzt diese Basis aktuell fuer den Enrollment-POST `EnrolTechUser` und waehlt dabei anhand der vom Runtime-Resolver gelieferten General-API-Version zwischen den generierten Typen; weitere Calls koennen spaeter pro API-Familie darauf aufbauen.
- Der `ApiRuntimeResolver` unter `src/renderer/domain/saf` bindet die General-API-Operationen `saf-receivers`, `saf-insurers` und `techUserEnrolment` an die aktive Version eines Environments und erzeugt aus Environment-`baseUrl`, API-`basePath` und Operation-Pfad eine `resolvedUrl` ohne Netzwerkaufruf. Die Runtime-Aufloesung liefert zusaetzlich API-ID, API-Name, API-Version und Operation-Metadaten fuer UI-Diagnosen.
- SAF Profile fuehren getrennte Referenzen fuer Encryption- und Signing-Keypairs.
- Default Input Topic: `eh.saf.in.v1`
- Default Output Topic Pattern: `eh.saf.{ecoHubId}.{standard}.out.v1`
- Output Topics bleiben ueber `outputTopicOverride` in der Kafka-Topic-Konfiguration ueberschreibbar.
- Secrets, Zertifikate, Private Keys, Passwoerter, Tokens und Client Secrets werden nicht im Profil gespeichert.

## Sicherheit

- Keine Secrets committen.
- Keine echten Broker, Zertifikate, Benutzernamen, Passwoerter oder Tokens verwenden.
- Lokale Secret-, Zertifikats- und `.env`-Dateien sind in `.gitignore` ausgeschlossen; `.env.example` bleibt fuer Platzhalter erlaubt.
- Platzhalterwerte muessen lokal und nicht produktiv bleiben.
- Kafka und API-Runtime sind ausser dem Tech User Enrollment Call nur modelliert, nicht angebunden.
