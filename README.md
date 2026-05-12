# EcoHub SAF Client

EcoHub SAF Client ist eine lokale Electron/React/TypeScript-App fuer Developer- und Support-Aufgaben rund um EcoHub SAF Kafka-Integrationen.

Die aktuelle Projektbasis stellt UI-Struktur, TypeScript-Models, Beispielprofile und Mockdaten bereit. Eine echte Kafka-Integration ist bewusst nicht enthalten.

## Ziele

- Profile fuer Service Consumer und Service Provider verwalten
- Kafka-Konfigurationen und Topics lokal modellieren
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
- `src/renderer/models`: TypeScript Models
- `src/renderer/data`: Lokale Beispielprofile, Mock Events und Mock Logs
- `docs/architecture.md`: Architekturuebersicht

## Sicherheit

- Keine Secrets committen.
- Keine echten Broker, Zertifikate, Benutzernamen, Passwoerter oder Tokens verwenden.
- Beispielwerte muessen lokal und nicht produktiv bleiben.
- Kafka ist in dieser Basis nur modelliert, nicht angebunden.
