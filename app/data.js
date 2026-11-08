/* Lifely – Bereiche des Dossiers (Daten und Beschriftung). Gemeinsame Grundlage für Geführte Vorsorge, Dossier und Ansicht.
   kind: doc   = Gibt es das? + Fundort + Kopie + Dateien        → { has:'ja'|'nein'|'?', where, copy, note, files:[] }
         list  = Liste von Einträgen (Art, Name, Notiz, Dateien) → { items:[{id,type,name,note,files:[]}], none:bool }
         people= Personen                                        → { items:[{id,name,rel,role,phone,note}] }
         form  = Felder mit freiem Text                          → { values:{key:text}, files:[] }
   Dateiverweis (fileRef): { path, name, type, size } – path = «<userId>/<bereich>/<zufall>-<name>» im Speicher «dossier-files». */
const SECTIONS = [
  { id: 'persoenlich', kind: 'form', icon: 'user', title: 'Persönliches', hint: 'Wer Sie sind und was man über Sie wissen muss.',
    fields: [{ k: 'zivilstand', label: 'Zivilstand', options: ['ledig', 'verheiratet', 'eingetragene Partnerschaft', 'verwitwet', 'geschieden'] },
      { k: 'wohnort', label: 'Wohnadresse', ph: 'z. B. Bernstrasse 12, 3000 Bern' },
      { k: 'geburt', label: 'Geburtsdatum', ph: 'z. B. 12.03.1948' },
      { k: 'hausarzt', label: 'Hausarzt / Hausärztin', ph: 'z. B. Dr. Anna Meier, 031 123 45 67' },
      { k: 'notiz', label: 'Weiteres, das man wissen sollte', ph: 'z. B. Allergien, Medikamente', area: true }] },
  { id: 'personen', kind: 'people', icon: 'people', title: 'Vertrauenspersonen und Kontakte', hint: 'Wen man im Ernstfall anrufen soll.',
    roles: ['Vertrauensperson', 'Wer für mich entscheidet', 'Angehörige/r', 'Hausarzt / Hausärztin', 'Notar / Notarin', 'Treuhänder/in', 'Nachbar/in mit Schlüssel', 'Andere'] },
  { id: 'patvf', kind: 'doc', icon: 'heart', title: 'Patientenverfügung', hint: 'Was Sie medizinisch wünschen, falls Sie nicht mehr selbst entscheiden können.', review: 24 },
  { id: 'vorsorgeauftrag', kind: 'doc', icon: 'pen', title: 'Vorsorgeauftrag', hint: 'Wer für Sie entscheidet, wenn Sie es selbst nicht mehr können.', review: 36 },
  { id: 'testament', kind: 'doc', icon: 'file', title: 'Testament', hint: 'Ihr letzter Wille. Das Original zählt.', review: 60 },
  { id: 'versicherungen', kind: 'list', icon: 'shield', title: 'Versicherungen', hint: 'Jede Versicherung einzeln.', unit: ['Versicherung', 'Versicherungen'],
    types: ['Krankenkasse', 'Haftpflicht & Hausrat', 'Lebensversicherung', 'Unfall', 'Auto', 'Rechtsschutz', 'Andere'], nameLabel: ['Gesellschaft', 'z. B. CSS'], noteLabel: ['Wo liegt die Police?', 'z. B. grüner Ordner'] },
  { id: 'konten', kind: 'list', icon: 'bank', title: 'Konten und Banken', hint: 'Nur wo Sie Konten haben. Nie Kontonummern, Passwörter oder PINs.', unit: ['Konto', 'Konten'],
    types: ['Privatkonto', 'Sparkonto', 'Säule 3a', 'Wertschriften', 'Freizügigkeitskonto', 'Andere'], nameLabel: ['Bank oder Institut', 'z. B. Berner Kantonalbank'], noteLabel: ['Bemerkung', 'z. B. Filiale Bümpliz'] },
  { id: 'vertraege', kind: 'list', icon: 'contract', title: 'Verträge und Abos', hint: 'Was Angehörige kündigen oder übernehmen müssen.', unit: ['Vertrag', 'Verträge'],
    types: ['Handy', 'Internet & TV', 'Miete', 'Zeitung / Zeitschrift', 'Streaming', 'Verein', 'Spende / Dauerauftrag', 'Andere'], nameLabel: ['Anbieter', 'z. B. Swisscom'], noteLabel: ['Bemerkung', 'z. B. monatlich, Kundennummer'] },
  { id: 'wohnen', kind: 'form', icon: 'home', title: 'Wohnen', hint: 'Wohnung oder Haus.',
    fields: [{ k: 'art', label: 'Ich wohne in', options: ['Mietwohnung', 'Eigentumswohnung', 'Haus', 'Wohnung im Heim / betreut'] },
      { k: 'vermieter', label: 'Vermieter / Verwaltung', ph: 'z. B. Immo AG, 031 …' },
      { k: 'schluessel', label: 'Wer hat einen Schlüssel?', ph: 'z. B. Nachbarin Frau Huber, Nr. 5' },
      { k: 'notiz', label: 'Weiteres', ph: 'z. B. Mietvertrag liegt im Ordner «Wohnen»', area: true }] },
  { id: 'bestattung', kind: 'form', icon: 'flower', title: 'Bestattungswünsche', hint: 'Alle Angaben sind freiwillig.',
    fields: [{ k: 'art', label: 'Art der Bestattung', options: ['Erdbestattung (Sarg)', 'Kremation (Urne)', 'Noch offen'] },
      { k: 'ort', label: 'Ort', ph: 'z. B. Friedhof Bremgarten, Bern' },
      { k: 'feier', label: 'Abdankung', options: ['Kirchlich', 'Weltlich', 'Im engsten Kreis', 'Keine Feier'] },
      { k: 'notiz', label: 'Weitere Wünsche', ph: 'z. B. Lieblingslied, Spenden statt Blumen', area: true }] },
  { id: 'alltag', kind: 'form', icon: 'paw', title: 'Alltag', hint: 'Wer kümmert sich um Tiere, Pflanzen und Auto?',
    fields: [{ k: 'tiere', label: 'Haustiere', ph: 'z. B. Katze Minou, Futter im Keller', area: true },
      { k: 'pflanzen', label: 'Pflanzen', ph: 'z. B. Orchideen einmal pro Woche giessen', area: true },
      { k: 'auto', label: 'Auto', ph: 'z. B. VW Golf, Schlüssel in der Kommode', area: true }] },
  { id: 'wuensche', kind: 'form', icon: 'spark', title: 'Das ist mir wichtig', hint: 'Eine Gesprächsgrundlage für Familie und Hausarzt, keine Verfügung.',
    fields: [{ k: 'krank', label: 'Wenn ich schwer krank bin, ist mir wichtig …', area: true },
      { k: 'wohnen', label: 'Wo ich leben möchte, wenn ich Hilfe brauche …', area: true },
      { k: 'sagen', label: 'Das möchte ich meinen Liebsten sagen …', area: true }] },
  { id: 'digital', kind: 'form', icon: 'lock', title: 'Digitales', hint: 'Nur wo etwas ist. Nie Passwörter oder PINs.',
    fields: [{ k: 'konten', label: 'Online-Konten (E-Mail, Social Media …)', ph: 'z. B. Gmail, Facebook', area: true },
      { k: 'pw', label: 'Wo liegen meine Zugangsdaten?', ph: 'z. B. Passwort-Manager, Zettel im Safe' },
      { k: 'wunsch', label: 'Was soll damit geschehen?', ph: 'z. B. Konten löschen', area: true }] },
];
const SECTION = (id) => SECTIONS.find(s => s.id === id);
const REVIEW_MONTHS = (id) => SECTION(id)?.review || 0;
