# Übergabe Lifely (Stand 9.11.2026, alles pausiert)

Lies zuerst CLAUDE.md und die Memory-Datei lifely-projekt.md. Antworten auf Deutsch (Schweiz, kein ß), kurz, ohne Fachjargon. Der User ist kein Entwickler und will Ergebnisse statt Rückfragen. Geheimnisse (keys/…) nie ausgeben.

## Ort und Ablauf
- Ordner: ~/Desktop/Projekte/Vorsorgeordner-App (Repo Icham135/lifely, live https://icham135.github.io/lifely/, App unter /app/).
- Arbeitsquelle der App: app-neu/ (gitignored, nur lokal!). Veröffentlichen: `tools/cache-version.sh`, `tools/uebernehmen.sh`, `git add -A`, Commit (deutsch, Zeile "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"), `git push`. Live prüfen: `LF_URL="https://icham135.github.io/lifely/app/index.html" node tests/e2e.mjs` (35 PASS).
- Lokal: `ruby -run -e httpd . -p <Port>`, `http://localhost:<Port>/app-neu/index.html`. Playwright: `import { chromium } from '/Users/ilies/Desktop/Brained/node_modules/playwright/index.mjs'`. Testkonto test+xyz<zufall>@example.com / Lifely-Test-2026, am Ende `await LF.deleteAccount()`.

## Fertig und online
App V3 (Tabs Start, Geführte Vorsorge, Mein Dossier, Profil; Bereich «Dokumente und Unterlagen»; Thema «Dokumente» im Gespräch; eine Schrift Figtree; 35 Tests grün). Landingpage mit V3-Bildern, datenschutz.html (KI über Groq in den USA), Footer-Link «Datenschutz».

## Offen 1: PDF-Bericht (Englisch, höchstens 20 Seiten A4)
- Entwurf liegt vor: ~/Desktop/Projekte/Lifely/Lifely-Appendix-Report-ENTWURF.pdf (ca. 22 Seiten, also zu lang, ohne die neue Landingpage). Bauskripte und Quellen: ~/Desktop/Projekte/Lifely/Bericht/entwurf/ (build.mjs erzeugt report.html und out.pdf, base.css/extra.css, land-d-*.png und land-m-*.png = Screenshots der neuen Landingpage).
- Zu tun: auf ≤ 20 Seiten kürzen (mehrere Screenshots pro Seite), neue Landingpage in Abschnitt A4 aufnehmen (alt und neu), Datenschutzerklärung kurz erwähnen (Supabase Zürich, KI Groq USA, keine Fotos/PDFs an die KI), Sprachen als «in Arbeit» schreiben solange nicht veröffentlicht, PDF prüfen (Seiten rendern, nichts abgeschnitten), Ausgabe als ~/Desktop/Projekte/Lifely/Lifely-Appendix-Report.pdf.
- Inhalt: Summary/Methode; Teil A (V1, V2, Umfrage, Landing); Teil B (V3: Ziel, Architektur Vanilla JS + GitHub Pages + Supabase Zürich + Groq nur über Server-Funktion, Datenschutz/Sicherheit, 35 E2E-Tests, Grenzen, Worklog aus git log). Ton menschlich und sachlich, nichts erfinden, Claude Code als Hilfsmittel nennen. Bilder: Bericht/img/ und Bericht/img/v3/.

## Offen 2: Übersetzungen FR/IT/EN (nichts davon veröffentlicht)
- Lokal vorhanden, ungeprüft: app-neu/i18n.js (je 581 Texte fr/it/en, früher leer), app-neu/core-data.js (schickt lang an den Server). Server-Änderung server/functions/fuehrung/index.ts ist uncommitted, ob deployed unklar (`git diff`, Deploy mit server/deploy.mjs).
- Zu tun: Lückenprüfung per Skript (jeder t('…')-Schlüssel aus app-neu/*.js inkl. topics.js, data.js, tour.js in allen 3 Sprachen, Variablen {x} gleich); Texte ohne t() ergänzen; «Übersetzung folgt» in profile.js (langSheet) und auth.js entfernen; in der App den Link zu datenschutz.html (Profil → Datenschutz) und die KI-Sätze (profile.js privacy(), auth.js POINTS) auf «KI-Dienst in den USA (Groq)» ändern, mit Übersetzung; alle Hauptseiten in fr/it/en bei 320 px und Schrift «sehr gross» prüfen; e2e lokal 35 PASS; veröffentlichen; live prüfen; Landingpage-Kachel «Heute Deutsch, bald mehr» (index.html ca. Zeile 184) anpassen; Bericht aktualisieren.
- Begriffe: Patientenverfügung = directives anticipées / disposizioni del paziente; Vorsorgeauftrag = mandat pour cause d'inaptitude / mandato precauzionale; AHV = AVS; Säule 3a = 3e pilier a / terzo pilastro 3a. Fr vouvoiement, It Lei-Form, En British English.

## Weitere offene Punkte
Design des Users («nicht clean», braucht Screenshots der störenden Stellen); kein Passwort-Reset/keine E-Mail-Bestätigung; rechtliche Prüfung der Datenschutzerklärung; Foto-Aufnahme nicht auf echtem Handy getestet.
User-Aufgaben: alten Gemini-Key widerrufen, Supabase-Token «claude» löschen, Google-Form-Reste löschen, evtl. London-Projekt hxmmwltnturdbuvejlju löschen. V2-Ordner (~/Desktop/Projekte/Lifely/Website-2.0) erst nach dem fertigen PDF löschen.
