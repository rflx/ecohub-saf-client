# Architekturuebersicht

EcoHub SAF Client ist als lokale Desktop-App auf Basis von Electron, React und TypeScript aufgebaut.

## Schichten

- Electron Main Process: startet das Browserfenster und kapselt Desktop-spezifische Funktionen.
- Preload Script: definierter Uebergang zwischen Main Process und Renderer.
- React Renderer: stellt Seiten, Navigation und spaetere Support-Workflows dar.
- Models: beschreiben Profile, Kafka-Konfigurationen, Topics, SAF Events und Logs.
- Mock Data: liefert lokal testbare Beispielprofile, Events und Logs ohne externe Abhaengigkeiten.

## Datenfluss

Die aktuelle Basis arbeitet ausschliesslich mit lokalen Mockdaten. Profile, Kafka-Konfigurationen, Topic-Konfigurationen, Events und Logs werden als TypeScript-Objekte im Renderer bereitgestellt.

Eine spaetere Kafka-Anbindung sollte hinter einer klaren Service-Schicht liegen und nicht direkt in UI-Komponenten implementiert werden.

## Grenzen der aktuellen Basis

- Keine echte Kafka-Verbindung
- Keine Persistenz
- Keine Secrets oder produktiven Konfigurationen
- Keine Backend- oder Cloud-Abhaengigkeiten
