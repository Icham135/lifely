# Lifely – digitaler Vorsorgeordner (Prototyp)

Studienprojekt EBDS, HS 2026. Eine Web-App (PWA) für ältere Menschen, mit der sie wichtige Unterlagen fotografieren, in Kategorien ablegen und für Vertrauenspersonen im Notfall zugänglich machen können.

## Starten

Die App braucht einen kleinen lokalen Webserver. Im Terminal im Projektordner:

```bash
ruby -run -e httpd . -p 5173
```

Danach im Browser öffnen: http://localhost:5173

## Funktionen

- Ladescreen mit Logo
- Anmeldung mit Google oder per E-Mail mit 6-stelligem Code (simuliert, der Code wird im Demo-Modus angezeigt)
- Startseite mit grossen Kacheln
- Dokument fotografieren oder hochladen (Bild/PDF), dann Kategorie wählen (2 Schritte)
- Dokumentenliste mit Filter nach Kategorie, Detailansicht, Löschen
- Vertrauenspersonen verwalten (Konzept: Notfallzugang mit 7 Tagen Wartefrist)
- Notfall-Ansicht: so sehen Angehörige die Unterlagen (nur lesen)
- Einstellungen: Schriftgrösse (Normal / Gross / Sehr gross), Abmelden, alle Daten löschen

## Technik und Grenzen des Prototyps

- Reines HTML, CSS und JavaScript, ohne Frameworks und ohne Build-Schritt
- Daten nur lokal im Browser (IndexedDB für Dokumente, localStorage für Konto und Kontakte)
- Anmeldung und Notfallzugang sind simuliert; die echte Umsetzung (Verschlüsselung, Server in der Schweiz, DSG) beschreibt das Sicherheitskonzept in der Dokumentation
- Nur mit Testdokumenten verwenden

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Grundgerüst |
| `styles.css` | Gestaltung (seniorengerecht: grosse Schrift, hohe Kontraste, grosse Buttons) |
| `app.js` | Logik und alle Bildschirme |
| `manifest.json`, `sw.js` | PWA: installierbar, Offline-Cache |
| `icons/logo.svg` | Logo |
