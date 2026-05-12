# AGENTS.md

Regeln fuer Codex und andere Coding Agents in diesem Repository.

## Grundsaetze

- Bestehende Electron/React/TypeScript-Struktur beibehalten.
- Kleine, nachvollziehbare Aenderungen bevorzugen.
- Keine echte Kafka-Integration einbauen, bis sie explizit angefordert wird.
- Keine Secrets, echten Zugangsdaten, Zertifikate, Tokens oder produktiven Broker-Adressen hinzufuegen.
- Never commit secrets, certificates, private keys, passwords, tokens or real Kafka credentials.
- Use .env.example and example profile files with placeholders only.
- Mockdaten muessen klar als Mock oder lokal erkennbar sein.

## Code-Konventionen

- TypeScript-Typen unter `src/renderer/models` pflegen.
- Lokale Beispieldaten unter `src/renderer/data` ablegen.
- UI-Komponenten im Renderer halten.
- Electron Main und Preload nur anfassen, wenn es fuer die Aufgabe erforderlich ist.
- Bestehende Exporte nicht unnoetig brechen.

## Dokumentation

- Nach fachlichen, architektonischen, Setup- oder UI-Flow-Aenderungen immer pruefen, ob `README.md` und `docs/architecture.md` aktualisiert werden muessen.
- Wenn eine Aenderung Verhalten, Bedienung, Konfiguration, Datenmodell, Prozessfluss oder Komponentenstruktur betrifft, `README.md` und/oder `docs/architecture.md` im selben Arbeitsschritt aktualisieren.
- Reine interne Refactorings oder kosmetische Korrekturen muessen nur dokumentiert werden, wenn sie dokumentierte Konzepte, Befehle oder Architekturentscheidungen veraendern.

## Verifikation

- Nach TypeScript-Aenderungen mindestens `npx tsc --noEmit` oder einen passenden vorhandenen Check ausfuehren.
- Bei UI-Aenderungen die App lokal mit `npm start` pruefen, wenn praktikabel.
