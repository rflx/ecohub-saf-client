# EcoHub SAF Client

EcoHub SAF Client ist eine lokale Electron/React/TypeScript-App fuer Developer- und Support-Aufgaben rund um EcoHub SAF Kafka-Integrationen.

Die aktuelle Projektbasis stellt UI-Struktur, TypeScript-Models, SAF-Konfigurationsmodelle, lokale Profilverwaltung und Mockdaten bereit. Eine echte Kafka- oder API-Integration ist bewusst nicht enthalten.

## Ziele

- Profile fuer Service Consumer und Service Provider verwalten
- Kafka-Konfigurationen und Topics lokal modellieren
- SAF General API und Public Key Store API lokal konfigurieren
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

## Projektstruktur

- `src/main.ts`: Electron Main Process
- `src/preload.ts`: Preload Entry Point
- `src/renderer`: React Renderer App
- `src/renderer/domain/saf`: SAF-Domainlogik, aktuell Topic Resolver
- `src/renderer/models`: TypeScript Models
- `src/renderer/data`: Lokale Beispielprofile, Mock Events und Mock Logs
- `src/renderer/services`: Lokaler ProfileStorage und Platzhalter-Clients
- `src/renderer/transport/kafka`: Kafka-Transportgrenze fuer spaetere Implementierungen
- `docs/architecture.md`: Architekturuebersicht

## SAF-Konfiguration

- Beispielprofile: `Service Consumer DEV` und `Service Provider DEV`
- Profile koennen in der App unter `Profile` ueber `Neu` angelegt und ueber `Bearbeiten` konfiguriert werden.
- Die lokale Profilverwaltung speichert Profile, API-Lizenzschluessel und Kafka-Konfigurationen im Renderer-`localStorage`.
- Default Input Topic: `eh.saf.in.v1`
- Default Output Topic Pattern: `eh.saf.{ecoHubId}.{standard}.out.v1`
- Topic-Namen bleiben ueber die Kafka-Konfiguration ueberschreibbar.
- Credentials werden nur als `credentialsRef` modelliert und nicht gespeichert.
- Lizenzschluessel werden pro Profil als gemeinsamer Wert fuer General API und Public Key Store API gepflegt; Beispielwerte bleiben Mockdaten.

## Sicherheit

- Keine Secrets committen.
- Keine echten Broker, Zertifikate, Benutzernamen, Passwoerter oder Tokens verwenden.
- Beispielwerte muessen lokal und nicht produktiv bleiben.
- Kafka und APIs sind in dieser Basis nur modelliert, nicht angebunden.
