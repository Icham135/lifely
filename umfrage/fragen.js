/* Lifely – Fragen der Umfrage (Projektarbeit BFH). Einzige Quelle für die Umfrage-Seite und das Google-Formular.
   Typen: radio (eine Antwort), check (mehrere, max = höchstens), text (offene Antwort), scale (1–5).
   other: true = Feld «Sonstiges». next: Verzweigung je nach Antwort (Abschnitt-ID). */
const SURVEY = {
  title: 'Lifely – Umfrage zur Vorsorge',
  intro: 'Im Rahmen einer Projektarbeit an der Berner Fachhochschule BFH untersuchen wir, wie Menschen für den Ernstfall vorsorgen und welche Schwierigkeiten Angehörige dabei erleben.\n\nZiel ist die Entwicklung der Web-App «Lifely». Darin können wichtige Dokumente, Verträge und persönliche Wünsche an einem Ort abgelegt werden. Ausgewählte Vertrauenspersonen erhalten Zugriff.\n\nDie Umfrage dauert ca. 6–10 Minuten. Die Antworten werden anonym ausgewertet und ausschliesslich für unsere Projektarbeit verwendet.\n\nBei Fragen erreichen Sie uns unter michele.roux@students.bfh.ch',
  contact: 'michele.roux@students.bfh.ch',
  thanks: 'Vielen Dank für Ihre Teilnahme!',
  sections: [
    { id: 's1', title: 'Zu Ihrer Person', questions: [
      { k: 'alter', t: 'Wie alt sind Sie?', type: 'radio', req: true, opts: ['Unter 30', '30–44', '45–59', '60–69', '70–79', '80 oder älter'] },
      { k: 'rolle', t: 'Welche Aussage trifft am besten auf Sie zu?', type: 'radio', req: true, opts: ['Ich möchte für mich selbst vorsorgen.', 'Ich kümmere mich um die Vorsorge einer anderen Person (z. B. Eltern, Partnerin oder Partner).', 'Beides.', 'Keines davon.'] },
      { k: 'nutzung', t: 'Wie oft nutzen Sie Computer, Tablet oder Smartphone?', type: 'radio', req: true, opts: ['Täglich', 'Mehrmals pro Woche', 'Selten', 'Nie'] },
      { k: 'geraete', t: 'Welche Geräte nutzen Sie?', type: 'check', opts: ['Smartphone', 'Tablet', 'Computer oder Laptop', 'Keines davon'] },
    ] },
    { id: 's2', title: 'Ihre Erfahrungen', questions: [
      { k: 'erfahrung', t: 'Mussten Sie schon einmal die Angelegenheiten einer schwer kranken oder verstorbenen Person regeln?', type: 'radio', req: true,
        opts: ['Ja', 'Nein', 'Möchte ich nicht beantworten'], next: { 'Ja': 's3', 'Nein': 's4', 'Möchte ich nicht beantworten': 's4' } },
    ] },
    { id: 's3', title: 'Ihre Erfahrung im Ernstfall', desc: 'Diese Fragen beziehen sich auf Ihre Erfahrung.', questions: [
      { k: 'woher', t: 'Woher wussten Sie, was in einer solchen Angelegenheit zu tun ist?', type: 'text' },
      { k: 'schwierig', t: 'Was war dabei schwierig?', type: 'check', other: true, opts: ['Wichtige Dokumente finden', 'Verträge und Abos kennen und kündigen', 'Wissen, was sich die Person gewünscht hat', 'Wissen, was zu tun ist', 'Fristen einhalten', 'Zugang zu Online-Konten (z. B. E-Mail, Bank)', 'Kontakt mit Behörden und Versicherungen', 'Absprachen in der Familie', 'Nichts davon'] },
      { k: 'geholfen', t: 'Was hätte Ihnen damals am meisten geholfen?', type: 'text' },
    ] },
    { id: 's4', title: 'Ihre Vorsorge heute', questions: [
      { k: 'wissen', t: 'Wissen Sie, welche Unterlagen Sie für Ihre Vorsorge oder einen Ernstfall bereit haben sollten?', type: 'radio', opts: ['Ja', 'Teilweise', 'Nein'] },
      { k: 'erstellt', t: 'Welche dieser Unterlagen haben Sie für sich selbst schon erstellt?', type: 'check', opts: ['Patientenverfügung', 'Vorsorgeauftrag', 'Testament', 'Bestattungswünsche (schriftlich)', 'Liste mit Verträgen und Abos', 'Liste mit wichtigen Kontakten', 'Keine davon', 'Weiss nicht'] },
      { k: 'ort', t: 'Wo bewahren Sie wichtige Unterlagen auf?', type: 'check', other: true, opts: ['In einem Ordner zu Hause', 'Verteilt an verschiedenen Orten zu Hause', 'Im Bankschliessfach', 'Bei einer Notarin oder einem Notar', 'Auf dem Computer oder Handy', 'In einem Online-Speicher (Cloud)', 'Bei Angehörigen'] },
      { k: 'finden', t: 'Wüssten Ihre Angehörigen im Ernstfall, wo sie diese Unterlagen finden?', type: 'radio', req: true, opts: ['Ja', 'Teilweise', 'Nein', 'Weiss nicht'] },
      { k: 'hilfsmittel', t: 'Nutzen Sie bereits ein Hilfsmittel oder Angebot für Ihre Vorsorge?', type: 'check', other: true, opts: ['Vorsorgemappe oder Notfallordner auf Papier', 'Website oder App', 'Beratung (z. B. Pro Senectute, Bank, Notariat)', 'Nein'] },
      { k: 'hindernis', t: 'Was hält Sie davon ab, (mehr) vorzusorgen?', type: 'check', max: 3, other: true, opts: ['Ich habe bereits alles geregelt.', 'Das ist noch nicht nötig.', 'Das Thema ist mir unangenehm.', 'Ich weiss nicht, wo ich anfangen soll.', 'Es ist zu kompliziert.', 'Mir fehlt die Zeit.', 'Es kostet zu viel.'] },
    ] },
    { id: 's5', title: 'Eine digitale Vorsorgemappe', desc: 'Stellen Sie sich eine Website vor, auf der Sie wichtige Dokumente, Verträge und persönliche Wünsche an einem Ort ablegen können. Sie bestimmen Vertrauenspersonen, die Zugriff erhalten. Die folgenden Fragen beziehen sich auf ein solches Angebot.', questions: [
      { k: 'interesse', t: 'Wie interessant wäre ein solches Angebot für Sie?', type: 'scale', req: true, low: 'gar nicht interessant', high: 'sehr interessant' },
      { k: 'funktionen', t: 'Welche dieser Funktionen wären Ihnen am wichtigsten?', type: 'check', req: true, max: 3, opts: ['Dokumente hochladen und nach Themen ordnen', 'Notizen zu Dokumenten (z. B. wo das Original liegt)', 'Anzeige, wie vollständig die Vorsorgedokumente sind', 'Erinnerung, die Unterlagen zu aktualisieren', 'Vertrauenspersonen bestimmen', 'Checkliste für Angehörige: Was ist im Ernstfall zu tun?', 'Bestattungswünsche festhalten', 'Übersicht über Verträge und Abos'] },
      { k: 'bedenken', t: 'Welche Bedenken hätten Sie bei einem solchen Angebot?', type: 'check', other: true, shuffle: true, opts: ['Die Daten könnten gestohlen werden.', 'Es ist unklar, wer Zugriff hat.', 'Die Bedienung ist zu kompliziert.', 'Die Kosten.', 'Ich möchte Gesundheitsdaten nicht online speichern.', 'Keine Bedenken'] },
      { k: 'vertrauen', t: 'Was würde Ihr Vertrauen in ein solches Angebot stärken?', type: 'check', max: 3, other: true, opts: ['Die Daten werden in der Schweiz gespeichert.', 'Eine bekannte Organisation empfiehlt das Angebot.', 'Starke Verschlüsselung und sichere Anmeldung', 'Klare Regeln, wer was sehen darf', 'Das Angebot ist kostenlos.'] },
      { k: 'preis', t: 'Wie viel wären Sie bereit, dafür zu bezahlen?', type: 'short', hint: 'z. B. 3 Fr. monatlich oder 40 Fr. einmalig' },
    ] },
  ],
};
if (typeof module !== 'undefined') module.exports = SURVEY;
