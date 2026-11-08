# Lifely – digitaler Vorsorgeordner

Studienprojekt EBDS, HS 2026. Web-App (PWA) für ältere Menschen: geführte Vorsorge, Dossier mit Dokumenten und Angaben, Vertrauenspersonen mit Nur-lesen-Zugang per Key.

## Links (bleiben immer gleich)

- Landingpage: https://icham135.github.io/lifely/
- App (Version 3): https://icham135.github.io/lifely/app/
- Umfrage: https://icham135.github.io/lifely/umfrage/ (Antworten im Google-Formular von learn.brained@gmail.com)

## Aufbau

| Ordner / Datei | Inhalt |
|---|---|
| `index.html`, `landing.css`, `landing.js`, `img/` | Landingpage |
| `umfrage/` | Umfrage |
| `app-neu/` | Quelle der App Version 3 (Vanilla JS, ohne Build-Schritt, Supabase als Server) |
| `app/` | ausgelieferte App; wird aus `app-neu/` erzeugt (nicht von Hand ändern) |
| `server/` | `schema.sql` (Datenbank mit Zugriffsregeln), `functions/` (Edge Functions), `deploy.mjs` (Funktionen hochladen) |
| `tests/e2e.mjs` | durchgängiger Test mit Playwright |
| `tools/` | `uebernehmen.sh`, `cache-version.sh`, Screenshots, Formular |

Die App speichert Daten bei Supabase (Konto, Dossier, Dateien). `app-neu/config.js` enthält nur den öffentlichen anon-Schlüssel; geschützt wird über die Zugriffsregeln in der Datenbank. Nur mit Testdokumenten verwenden (Prototyp).

## Lokal starten

```bash
ruby -run -e httpd . -p 5215
```

App: http://localhost:5215/app-neu/index.html, Landingpage: http://localhost:5215/

Test: `LF_URL=http://localhost:5215/app-neu/index.html node tests/e2e.mjs`

## Aktualisieren

1. Änderungen in `app-neu/` machen.
2. `tools/cache-version.sh` (setzt `?v=` auf Datum und Stunde, damit Browser nichts Altes zeigen).
3. `tools/uebernehmen.sh` (ersetzt `app/` durch `app-neu/` und prüft die Verweise).
4. Committen und `git push`; nach ca. 1 Minute online.

## Server (`server/`)

`schema.sql` im Supabase-SQL-Editor ausführen (idempotent). Funktionen: `node server/deploy.mjs` (Token über die Umgebungsvariable `LIFELY_TOKEN` oder eine Datei ausserhalb des Repos).

**Der Zugangstoken (Access Token) gehört nie ins Repo**, nie in eine Webseite und nie in den Chat.
