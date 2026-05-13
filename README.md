# EcoHub SAF Client

EcoHub SAF Client ist eine lokale Electron/React/TypeScript-App fuer Developer- und Support-Aufgaben rund um EcoHub SAF Kafka-Integrationen.

Die aktuelle Projektbasis stellt UI-Struktur, TypeScript-Models, SAF-Konfigurationsmodelle, lokale Profilverwaltung und Mockdaten bereit. Eine echte Kafka- oder API-Integration ist bewusst nicht enthalten.

## Ziele

- Profile fuer Service Consumer und Service Provider verwalten
- Kafka-Konfigurationen und Topics lokal modellieren
- SAF General API und Public Key Store API zentral pro Environment lokal konfigurieren
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

- `specs/general-api-v2.yaml`
- `specs/public-key-store-api-v2.yaml`

Die GitHub Raw URLs werden zentral in `src/saf/specs/specConfig.ts` gepflegt. Specs koennen synchronisiert und daraus TypeScript-Typen generiert werden:

```bash
npm run sync:specs
npm run generate:api
```

`sync:specs` ueberschreibt lokale Specs nur nach einem erfolgreichen Download mit nicht-leerer OpenAPI-YAML-Response. `generate:api` erzeugt fuer alle in `specConfig.ts` konfigurierten Specs TypeScript-Typen unter `src/saf/generated/`.

## Projektstruktur

- `src/main.ts`: Electron Main Process
- `src/preload.ts`: Preload Entry Point
- `src/renderer`: React Renderer App
- `src/renderer/domain/saf`: SAF-Domainlogik, aktuell Topic Resolver
- `src/renderer/models`: TypeScript Models
- `src/renderer/data`: Lokale Beispielprofile, Mock Events und Mock Logs
- `src/renderer/services`: Lokaler ProfileStorage und Platzhalter-Clients
- `src/renderer/transport/kafka`: Kafka-Transportgrenze fuer spaetere Implementierungen
- `src/saf`: OpenAPI-basierte SAF-Spec-, Codegen- und Service-Struktur ohne Runtime-Netzwerklogik
- `specs`: Lokal versionierte SAF OpenAPI Specs
- `scripts/sync-specs.ts`: Spec-Synchronisation von GitHub Raw URLs
- `docs/architecture.md`: Architekturuebersicht

## SAF-Konfiguration

- Beispielprofile: `Service Consumer DEV` und `Service Provider DEV`
- Profile koennen in der App unter `Profile` ueber `Neu` angelegt und ueber `Bearbeiten` konfiguriert werden.
- Die lokale Profilverwaltung speichert Profile mit SAF Identity inklusive `licenceKey`, TechUser-Auth-Referenzen, Key-Referenzen und Kafka-Konfigurationen im Renderer-`localStorage`.
- API-Endpunkte werden nicht im Profil gespeichert, sondern auf der Seite `API Environments` zentral pro Environment (`prod`, `iat`, `test`, `dev`) gepflegt.
- Alle SAF API Calls sind fachlich einem SAF TechUser zugeordnet.
- TechUser Auth wird pro Profil mit `availableMethods`, `preferredMethod`, TechUser IDP Number und Enrollment-Status modelliert.
- Das Tech User Enrollment Formular ruft aktuell nur einen Mock-Service auf. Es simuliert mTLS-Zertifikat und OAuth2 Client Credentials, ohne eine echte General API Verbindung aufzubauen.
- OAuth2 ist fuer spaetere Client-Credentials-Flows vorbereitet: `openIdConfigurationEndpoint`, optionaler `tokenEndpoint` und Scope `https://graph.microsoft.com/.default` sind modelliert.
- Zertifikate, Bearer Tokens, Client Secrets, Passwoerter und Identification Codes werden nicht in Profilen gespeichert. Profile enthalten nur Secret-Referenzen.
- `LocalMockSecretStore` kapselt lokale Mock-Secrets getrennt vom Profilmodell und kann spaeter durch eine macOS-Keychain-Implementierung ersetzt werden.
- General API Endpoints dienen der Abfrage von Receiver / Service Agreements und werden pro Environment konfiguriert.
- Public Key Store / PKI API Endpoints dienen dem Abruf fremder Public Keys und der Verwaltung eigener Public Keys und werden pro Environment konfiguriert.
- SAF API Types werden aus lokalen OpenAPI Specs generiert. Der `GeneralApiService` unter `src/saf/services` bereitet die General-API-Operationen `EnrolTechUser`, `SafReceivers` und `SafInsurers` vor, fuehrt aber noch keine echten Requests aus.
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
