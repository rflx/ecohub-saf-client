# EcoHub SAF Client

EcoHub SAF Client ist eine lokale Electron/React/TypeScript-App fuer Developer- und Support-Aufgaben rund um EcoHub SAF Kafka-Integrationen.

Die aktuelle Projektbasis stellt UI-Struktur, TypeScript-Models, SAF-Konfigurationsmodelle, lokale Profilverwaltung und Mockdaten bereit. Eine echte Kafka- oder API-Integration ist bewusst nicht enthalten.

## Ziele

- Profile fuer Service Consumer und Service Provider verwalten
- Kafka-Konfigurationen und Topics lokal modellieren
- SAF Service Host zentral pro Environment lokal konfigurieren
- SAF API Management fuer verfuegbare Specs, Versionen und aktive Versionen pro Environment pflegen
- Tech User Enrollment pro Profil mit Mock-Service vorbereiten
- SAF Input- und Output-Topics aus Profil- und Kafka-Konfigurationen aufloesen
- SAF Events und technische Logs mit Mockdaten anzeigen oder testen
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
- `src/preload.ts`: Preload Entry Point
- `src/renderer`: React Renderer App
- `src/renderer/domain/saf`: SAF-Domainlogik, aktuell Topic Resolver
- `src/renderer/domain/saf/apiRuntimeResolver.ts`: loest Profile oder Environments auf Service Host, aktiven API-Prefix und Operation-Pfad auf
- `src/renderer/models`: TypeScript Models
- `src/renderer/data`: Lokale Beispielprofile, Mock Events und Mock Logs
- `src/renderer/services`: Lokaler ProfileStorage und Platzhalter-Clients
- `src/renderer/transport/kafka`: Kafka-Transportgrenze fuer spaetere Implementierungen
- `src/saf`: Zentrale SAF API Registry, OpenAPI-basierte SAF-Spec-, Codegen- und Service-Struktur ohne Runtime-Netzwerklogik
- `specs`: Lokal versionierte SAF OpenAPI Specs
- `scripts/sync-specs.ts`: Spec-Synchronisation von GitHub Raw URLs
- `docs/architecture.md`: Architekturuebersicht

## SAF-Konfiguration

- Beispielprofile: `Service Consumer DEV` und `Service Provider DEV`
- Profile koennen in der App unter `Profile` ueber `Neu` angelegt und ueber `Bearbeiten` konfiguriert werden.
- Die lokale Profilverwaltung speichert Profile mit SAF Identity inklusive `licenceKey`, TechUser-Auth-Referenzen, Key-Referenzen und Kafka-Konfigurationen im Renderer-`localStorage`.
- API Hosts werden nicht im Profil gespeichert, sondern unter `Einstellungen` im Bereich `API Environments` zentral pro Environment (`prod`, `iat`, `test`, `dev`) gepflegt.
- API-Environment-Felder speichern automatisch, sobald der Fokus das jeweilige Feld verlaesst.
- Pro Environment wird ein gemeinsamer Service Host als Base URL gepflegt; API-spezifische Pfade und Versionen werden nicht im Environment gespeichert.
- API-Familien, API-Versionen, versionierte API Base Paths, lokale Spec-Pfade, generierte TypeScript-Pfade und Support-Status kommen aus der zentralen API-Registry; Operation-Metadaten kommen aus der generierten Operation-Registry und werden im API Management unter `Einstellungen` pro Version absteigend sortiert in Accordions angezeigt, wobei die neueste Version pro API-Familie geoeffnet ist.
- Neue API-Familien und neue API-Versionen werden in `src/saf/apiRegistry.ts` eingetragen; Settings, Spec-Sync, Codegen und Runtime-Aufloesung uebernehmen sie daraus.
- Profile referenzieren weiterhin nur ein Environment. Spaetere API Calls sollen ueber `Profile -> Environment -> Active API Version -> ApiRuntimeResolver -> Operation` aufgeloest werden.
- Alle SAF API Calls sind fachlich einem SAF TechUser zugeordnet.
- TechUser Auth wird pro Profil mit `availableMethods`, `preferredMethod`, TechUser IDP Number und Enrollment-Status modelliert.
- Das Tech User Enrollment Formular ruft aktuell nur einen Mock-Service auf. Es simuliert mTLS-Zertifikat und OAuth2 Client Credentials, ohne eine echte General API Verbindung aufzubauen.
- OAuth2 ist fuer spaetere Client-Credentials-Flows vorbereitet: `openIdConfigurationEndpoint`, optionaler `tokenEndpoint` und Scope `https://graph.microsoft.com/.default` sind modelliert.
- Zertifikate, Bearer Tokens, Client Secrets, Passwoerter und Identification Codes werden nicht in Profilen gespeichert. Profile enthalten nur Secret-Referenzen.
- `LocalMockSecretStore` kapselt lokale Mock-Secrets getrennt vom Profilmodell und kann spaeter durch eine macOS-Keychain-Implementierung ersetzt werden.
- General API Endpoints dienen der Abfrage von Receiver / Service Agreements und werden ueber den Environment Host plus API-Management Base Path aufgeloest.
- Public Key Store / PKI API Endpoints dienen dem Abruf fremder Public Keys und der Verwaltung eigener Public Keys und werden ueber den Environment Host plus API-Management Base Path aufgeloest.
- SAF API Types werden aus lokalen OpenAPI Specs generiert. Der `GeneralApiService` unter `src/saf/services` bereitet die General-API-Operationen `EnrolTechUser`, `SafReceivers` und `SafInsurers` vor, fuehrt aber noch keine echten Requests aus.
- Der `ApiRuntimeResolver` unter `src/renderer/domain/saf` bindet die General-API-Operationen `saf-receivers`, `saf-insurers` und `techUserEnrolment` an die aktive Version eines Environments und erzeugt aus Environment-`baseUrl`, API-`basePath` und Operation-Pfad eine `resolvedUrl` ohne Netzwerkaufruf.
- SAF Profile fuehren getrennte Referenzen fuer Encryption- und Signing-Keypairs.
- Default Input Topic: `eh.saf.in.v1`
- Default Output Topic Pattern: `eh.saf.{ecoHubId}.{standard}.out.v1`
- Output Topics bleiben ueber `outputTopicOverride` in der Kafka-Topic-Konfiguration ueberschreibbar.
- Secrets, Zertifikate, Private Keys, Passwoerter, Tokens und Client Secrets werden nicht im Profil gespeichert.

## Sicherheit

- Keine Secrets committen.
- Keine echten Broker, Zertifikate, Benutzernamen, Passwoerter oder Tokens verwenden.
- Lokale Secret-, Zertifikats- und `.env`-Dateien sind in `.gitignore` ausgeschlossen; `.env.example` bleibt fuer Platzhalter erlaubt.
- Beispielwerte muessen lokal und nicht produktiv bleiben.
- Kafka und APIs sind in dieser Basis nur modelliert, nicht angebunden.
