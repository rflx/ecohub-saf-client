# Architekturuebersicht

EcoHub SAF Client ist als lokale Desktop-App auf Basis von Electron, React und TypeScript aufgebaut.

## Schichten

- Electron Main Process: startet das Browserfenster und kapselt Desktop-spezifische Funktionen.
- Preload Script: definierter Uebergang zwischen Main Process und Renderer.
- React Renderer: stellt Seiten, Navigation und spaetere Support-Workflows dar.
- SAF Domain: enthaelt fachliche SAF-Regeln wie die Aufloesung von Input- und Output-Topics.
- Models: beschreiben SAF Profile, TechUser Auth und Enrollment, Environment-API-Konfigurationen, Kafka-Konfigurationen, Topics, SAF Events und Logs.
- Services: kapseln lokalen ProfileStorage, TechUser Enrollment, SecretStore sowie Platzhalter-Clients fuer General API, Public Key Store API und Kafka.
- Kafka Transport: markiert die technische Grenze fuer eine spaetere echte Kafka-Implementierung.
- Mock Data: liefert lokal testbare Beispielprofile, Events und Logs ohne externe Abhaengigkeiten.

## Datenfluss

Die aktuelle Basis arbeitet ausschliesslich mit lokalen Daten. Beispielprofile mit SAF Identity inklusive `licenceKey`, TechUser-Auth-Referenzen, Key-Referenzen, Topic-Konfigurationen, Events und Logs werden als TypeScript-Objekte im Renderer bereitgestellt. API-Endpunkte werden als separate Environment-Konfigurationen bereitgestellt. Profile und zugehoerige Kafka-Konfigurationen koennen ueber die Profiles-Seite angelegt und bearbeitet werden.

Der `ProfileStorageService` haelt SAF Profile, Kafka-Konfigurationen, API-Konfigurationen pro Environment und die aktive Profilauswahl im Renderer. Initial werden die Beispielprofile `Service Consumer DEV` mit OAuth2-TechUser-Referenz und `Service Provider DEV` mit mTLS-TechUser-Referenz geladen; nach GUI-Aenderungen persistiert der Service den Snapshot im Renderer-`localStorage`. Die Profiles-Seite liest daraus die Profile, erlaubt die Auswahl des aktiven Profils und bietet Formulare fuer Neu-Anlage, Bearbeitung und Loeschen. Die Seite `API Environments` pflegt General API, Public Key Store / PKI API und Timeout getrennt nach `prod`, `iat`, `test` und `dev`.

TechUser Auth ist pro Profil als `TechUserAuthConfig` modelliert. Die Konfiguration enthaelt `availableMethods`, `preferredMethod`, TechUser IDP Number, optionale Secret-Referenzen fuer mTLS- und OAuth2-Material, OpenID- und Token-Endpunkte sowie Enrollment-Status. Mindestens eine Authentifizierungsmethode muss fuer ein Profil gespeichert werden.

Der `TechUserEnrollmentService` ist aktuell eine Mock-Implementierung. Er simuliert den spaeteren General-API-Endpunkt `techUserEnrolment` und liefert mockbasierte mTLS- und OAuth2-Daten zurueck. Es gibt noch keine echte General-API-Verbindung, keine echte OAuth-Token-Anfrage und keine Zertifikatsdatei.

Der `LocalMockSecretStore` kapselt Secret-Zugriffe ueber `setSecret(profileId, secretType, value)`, `getSecret(...)` und `deleteSecret(...)`. Profile speichern nur `SecretRef`-Objekte. Die Service-Grenze ist bewusst so gehalten, dass spaeter eine macOS-Keychain-Implementierung hinter demselben Interface ergaenzt werden kann.

Der SAF Topic Resolver verwendet standardmaessig `eh.saf.in.v1` als Input Topic und `eh.saf.{ecoHubId}.{standard}.out.v1` als Output Topic Pattern. Output Topics koennen ueber `outputTopicOverride` in der Kafka-Topic-Konfiguration ueberschrieben werden.

Eine spaetere Kafka- oder API-Anbindung sollte hinter den vorhandenen Platzhalter-Clients liegen und nicht direkt in UI-Komponenten implementiert werden.

## Konfigurationsgrenzen

- SAF Domain: Profile mit SAF Identity inklusive `licenceKey`, Receiver, TechUser Auth und Enrollment-Referenzen, Key-Referenzen und Topic-Resolver.
- API Environments: General API, Public Key Store / PKI API und Timeout pro Environment.
- Kafka Transport: Broker-, Security-, Consumer-Group- und Topic-Konfiguration.
- UI: Profilanzeige, aktive Profilauswahl und lokale Konfiguration fuer SAF Identity, Tech User Enrollment, TechUser Auth, Kafka Topics, API Environments und Key References.
- API Clients: Platzhalter fuer General API und Public Key Store API ohne Netzwerkaufrufe.

## Grenzen der aktuellen Basis

- Keine echte Kafka-Verbindung
- Keine echte API-Verbindung
- Keine echte OAuth-Token-Verbindung
- Keine echte Zertifikatsdatei oder Keychain-Persistenz
- Keine Persistenz ausserhalb des Renderer-`localStorage`
- Keine Secrets oder produktiven Konfigurationen
- Keine Backend- oder Cloud-Abhaengigkeiten
