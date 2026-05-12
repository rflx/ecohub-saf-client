# Architekturuebersicht

EcoHub SAF Client ist als lokale Desktop-App auf Basis von Electron, React und TypeScript aufgebaut.

## Schichten

- Electron Main Process: startet das Browserfenster und kapselt Desktop-spezifische Funktionen.
- Preload Script: definierter Uebergang zwischen Main Process und Renderer.
- React Renderer: stellt Seiten, Navigation und spaetere Support-Workflows dar.
- SAF Domain: enthaelt fachliche SAF-Regeln wie die Aufloesung von Input- und Output-Topics.
- Models: beschreiben SAF Profile, API-Konfigurationen, Kafka-Konfigurationen, Topics, SAF Events und Logs.
- Services: kapseln lokalen ProfileStorage sowie Platzhalter-Clients fuer General API, Public Key Store API und Kafka.
- Kafka Transport: markiert die technische Grenze fuer eine spaetere echte Kafka-Implementierung.
- Mock Data: liefert lokal testbare Beispielprofile, Events und Logs ohne externe Abhaengigkeiten.

## Datenfluss

Die aktuelle Basis arbeitet ausschliesslich mit lokalen Daten. Beispielprofile, API-Lizenzschluessel, Topic-Konfigurationen, Events und Logs werden als TypeScript-Objekte im Renderer bereitgestellt. Profile und zugehoerige API- und Kafka-Konfigurationen koennen zusaetzlich ueber die Profiles-Seite angelegt und bearbeitet werden.

Der `ProfileStorageService` haelt Profile, API-Lizenzschluessel, Kafka-Konfigurationen und die aktive Profilauswahl im Renderer. Initial werden die Beispielprofile `Service Consumer DEV` und `Service Provider DEV` geladen; nach GUI-Aenderungen persistiert der Service den Snapshot im Renderer-`localStorage`. Die Profiles-Seite liest daraus die Profile, erlaubt die Auswahl des aktiven Profils und bietet Formulare fuer Neu-Anlage, Bearbeitung und Loeschen.

Der SAF Topic Resolver verwendet standardmaessig `eh.saf.in.v1` als Input Topic und `eh.saf.{ecoHubId}.{standard}.out.v1` als Output Topic Pattern. Topic-Namen bleiben ueber die Kafka-Konfiguration ueberschreibbar.

Eine spaetere Kafka- oder API-Anbindung sollte hinter den vorhandenen Platzhalter-Clients liegen und nicht direkt in UI-Komponenten implementiert werden.

## Konfigurationsgrenzen

- SAF Domain: Profile, Receiver, API-Lizenzschluessel, Credentials-Referenzen und Topic-Resolver.
- Kafka Transport: Broker-, Security-, Consumer-Group- und Topic-Konfiguration.
- UI: Profilanzeige, aktive Profilauswahl und lokale Profil-/Kafka-Konfiguration.
- API Clients: Platzhalter fuer General API und Public Key Store API ohne Netzwerkaufrufe.

## Grenzen der aktuellen Basis

- Keine echte Kafka-Verbindung
- Keine echte API-Verbindung
- Keine Persistenz ausserhalb des Renderer-`localStorage`
- Keine Secrets oder produktiven Konfigurationen
- Keine Backend- oder Cloud-Abhaengigkeiten
