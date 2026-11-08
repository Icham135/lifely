/* Lifely – Inhalt der Geführten Vorsorge: Themen, Schritte, Zeitmodi (Format siehe CONTRACT.md).
   Alles freiwillig und in einfacher Sprache. Keine Passwörter, PINs oder Kontonummern abfragen. */
window.LF = window.LF || {};
(() => {
  // Gemeinsamer Ablauf für Dokument-Bereiche (Vorlage, erzeugt nur Daten)
  const docSteps = (info, q, nein, wo, copyQ) => [
    { type: 'info', text: info },
    { type: 'yesno', q, field: 'has', explain: 'Damit wir wissen, ob Ihre Angehörigen das Dokument finden müssen oder ob noch etwas offen ist.' },
    { type: 'text', q: wo, field: 'where', ph: 'z. B. Ordner «Vorsorge» im Wohnzimmerschrank', showIf: { field: 'has', equals: 'ja' }, explain: 'Das Original ist wichtig. Im Ernstfall muss man es schnell finden.' },
    { type: 'info', text: nein, showIf: { field: 'has', equals: 'nein' } },
    { type: 'text', q: copyQ, field: 'copy', ph: 'z. B. Tochter Anna, Hausarzt', optional: true, showIf: { field: 'has', equals: 'ja' } },
    { type: 'upload', q: 'Möchten Sie ein Foto oder PDF dazulegen? Das ist freiwillig, wichtiger ist der Fundort.', optional: true, showIf: { field: 'has', equals: 'ja' } },
  ];

  LF.TOPICS = [
    { id: 'persoenlich', section: 'persoenlich', title: 'Persönliches', minutes: 2,
      intro: 'Wir beginnen mit ein paar Angaben über Sie. So finden sich Ihre Angehörigen im Ernstfall schnell zurecht. Alles ist freiwillig, Sie können jede Frage überspringen.',
      steps: [
        { type: 'choice', q: 'Wie ist Ihr Zivilstand?', field: 'values.zivilstand', options: ['ledig', 'verheiratet', 'eingetragene Partnerschaft', 'verwitwet', 'geschieden'], explain: 'Der Zivilstand bestimmt oft, wer im Ernstfall zuständig ist.' },
        { type: 'text', q: 'Wann sind Sie geboren?', field: 'values.geburt', ph: 'z. B. 12.03.1948', optional: true },
        { type: 'text', q: 'Wo wohnen Sie?', field: 'values.wohnort', ph: 'z. B. Bernstrasse 12, 3000 Bern', optional: true },
        { type: 'text', q: 'Wer ist Ihr Hausarzt oder Ihre Hausärztin?', field: 'values.hausarzt', ph: 'z. B. Dr. Anna Meier, 031 123 45 67', optional: true, explain: 'Ärzte und Rettungsdienste brauchen im Notfall rasch Auskunft.' },
        { type: 'text', q: 'Gibt es etwas, das man über Sie wissen sollte? Zum Beispiel Allergien oder Medikamente.', field: 'values.notiz', ph: 'z. B. Allergie gegen Penicillin', area: true, optional: true },
      ],
      outro: 'Danke, das Wichtigste über Sie ist festgehalten.' },

    { id: 'personen', section: 'personen', title: 'Vertrauenspersonen', minutes: 2,
      intro: 'Im Ernstfall sollen die richtigen Menschen angerufen werden. Hier halten wir fest, wer das ist. Wir fragen nur nach Namen und Telefon. Eine rechtlich gültige Vertretung regeln Sie im Vorsorgeauftrag (siehe später).',
      steps: [
        { type: 'people', q: 'Wer ist Ihre Vertrauensperson? Das ist jemand, der im Notfall als Erstes angerufen wird.', role: 'Vertrauensperson', explain: 'So wissen Spital und Angehörige sofort, wen sie anrufen können.' },
        { type: 'people', q: 'Wer soll für Sie entscheiden, wenn Sie es selbst nicht mehr können?', role: 'Wer für mich entscheidet', optional: true, explain: 'Das kann dieselbe Person sein wie oben. Sie müssen sie nur nennen, hier entsteht noch keine Vollmacht.' },
        { type: 'people', q: 'Möchten Sie Ihren Hausarzt oder Ihre Hausärztin als Kontakt eintragen?', role: 'Hausarzt / Hausärztin', optional: true },
        { type: 'people', q: 'Gibt es eine Notarin, einen Notar oder eine Treuhandperson, die Ihre Angelegenheiten kennt?', role: 'Notar / Notarin', optional: true },
      ],
      outro: 'Gut, jetzt wissen Ihre Liebsten, wen sie anrufen können.' },

    { id: 'patvf', section: 'patvf', title: 'Patientenverfügung', minutes: 3,
      intro: 'Eine Patientenverfügung hält fest, welche medizinische Behandlung Sie wünschen oder nicht wünschen, falls Sie sich nicht mehr äussern können. Wir fragen nur, ob es eine gibt und wo sie liegt. Wie Sie entscheiden, bleibt ganz Ihre Sache.',
      steps: docSteps(
        'Eine Patientenverfügung muss schriftlich sein, ein Datum tragen und von Ihnen unterschrieben sein (Art. 371 ZGB). Sie können sie jederzeit ändern oder widerrufen.',
        'Haben Sie eine Patientenverfügung?',
        'Das ist ganz normal, viele haben das noch nicht. Pro Senectute und Ihr Hausarzt oder Ihre Hausärztin helfen Ihnen gerne dabei. Wir halten fest, dass es noch offen ist.',
        'Wo liegt das Original?',
        'Wer hat eine Kopie?'),
      outro: 'Danke, der Fundort ist festgehalten.' },

    { id: 'vorsorgeauftrag', section: 'vorsorgeauftrag', title: 'Vorsorgeauftrag', minutes: 4,
      intro: 'Mit einem Vorsorgeauftrag bestimmen Sie, wer für Sie entscheidet und Ihre Geschäfte erledigt, wenn Sie es selbst nicht mehr können. Wir fragen nur, ob es einen gibt und wo er liegt.',
      steps: docSteps(
        'Ein Vorsorgeauftrag muss ganz von Hand geschrieben, datiert und unterschrieben sein, oder öffentlich beurkundet werden, also bei einer Notarin oder einem Notar (Art. 361 ZGB). Man kann ihn beim Zivilstandsamt eintragen lassen.',
        'Haben Sie einen Vorsorgeauftrag?',
        'Das ist ganz normal, viele haben das noch nicht. Pro Senectute und eine Notarin oder ein Notar helfen Ihnen gerne dabei. Wir halten fest, dass es noch offen ist.',
        'Wo liegt das Original?',
        'Wer hat eine Kopie?'),
      outro: 'Danke, damit ist dieser Punkt festgehalten.' },

    { id: 'testament', section: 'testament', title: 'Testament', minutes: 4,
      intro: 'Im Testament halten Sie fest, wer nach Ihrem Tod was erhalten soll. Wir fragen nicht nach dem Inhalt, nur ob es eines gibt und wo das Original liegt.',
      steps: docSteps(
        'Ein Testament schreiben Sie von Hand, mit Ort, Datum und Ihrer Unterschrift (Art. 505 ZGB). Das Original zählt, eine Kopie genügt nicht.',
        'Haben Sie ein Testament?',
        'Das ist ganz normal, viele haben das noch nicht. Eine Notarin, ein Notar oder Pro Senectute helfen Ihnen gerne dabei. Wir halten fest, dass es noch offen ist.',
        'Wo liegt das Original?',
        'Wer weiss davon oder hat eine Kopie?'),
      outro: 'Danke, der Fundort ist festgehalten.' },

    { id: 'versicherungen', section: 'versicherungen', title: 'Versicherungen', minutes: 4,
      intro: 'Versicherungen laufen nach einem Todesfall oft weiter, und Angehörige wissen meist nicht, welche es gibt. Nennen Sie uns einfach, wo Sie versichert sind. Policennummern brauchen wir nicht.',
      steps: [
        { type: 'info', text: 'Gemeint sind zum Beispiel Krankenkasse, Haftpflicht, Hausrat, Unfall, Auto oder Lebensversicherung.' },
        { type: 'list', q: 'Bei welchen Gesellschaften sind Sie versichert?', example: 'z. B. Krankenkasse CSS, Hausrat und Haftpflicht bei der Mobiliar', none: 'Ich habe keine', explain: 'So können Angehörige alles melden oder kündigen.' },
        { type: 'upload', q: 'Möchten Sie ein Foto einer Police dazulegen? Das ist freiwillig.', optional: true },
      ],
      outro: 'Gut, Ihre Versicherungen sind erfasst.' },

    { id: 'konten', section: 'konten', title: 'Konten und Banken', minutes: 4,
      intro: 'Ihre Angehörigen sollen wissen, bei welchen Banken Sie Konten haben. Wir fragen nur nach dem Namen der Bank. Bitte nennen Sie nie Kontonummern, Passwörter oder PINs.',
      steps: [
        { type: 'info', text: 'Zum Beispiel Privatkonto, Sparkonto, Säule 3a oder Wertschriften. Nur der Name der Bank genügt.' },
        { type: 'list', q: 'Bei welchen Banken oder Instituten haben Sie Konten?', example: 'z. B. Privatkonto bei der Berner Kantonalbank, Säule 3a bei der PostFinance', none: 'Ich habe keine', explain: 'Ohne diese Angabe kann man Konten nach einem Todesfall nur mühsam finden.' },
        { type: 'upload', q: 'Möchten Sie ein Foto eines Bankbelegs ohne Kontonummer dazulegen? Das ist freiwillig.', optional: true },
      ],
      outro: 'Danke, Ihre Banken sind festgehalten, ohne geheime Angaben.' },

    { id: 'vertraege', section: 'vertraege', title: 'Verträge und Abos', minutes: 4,
      intro: 'Verträge und Abos laufen nach einem Todesfall weiter und kosten Geld. Wenn Ihre Angehörigen wissen, welche es gibt, können sie diese rasch kündigen oder übernehmen.',
      steps: [
        { type: 'info', text: 'Gemeint sind zum Beispiel Handy, Internet, Miete, Zeitung, Streaming, Vereine oder regelmässige Spenden.' },
        { type: 'list', q: 'Welche Verträge und Abos haben Sie?', example: 'z. B. Handy bei Swisscom, Zeitung «Der Bund», Verein Turnverein Bern', none: 'Ich habe keine', explain: 'So wird nichts vergessen und es laufen keine unnötigen Kosten weiter.' },
        { type: 'upload', q: 'Möchten Sie ein Foto eines Vertrags dazulegen? Das ist freiwillig.', optional: true },
      ],
      outro: 'Gut, Ihre Verträge sind erfasst.' },

    { id: 'wohnen', section: 'wohnen', title: 'Wohnen', minutes: 6,
      intro: 'Wer weiss, wo Ihre Wohnungsunterlagen sind und wer einen Schlüssel hat, kann im Ernstfall schnell helfen. Wir fragen kurz nach Ihrer Wohnsituation.',
      steps: [
        { type: 'choice', q: 'Wie wohnen Sie?', field: 'values.art', options: ['Mietwohnung', 'Eigentumswohnung', 'Haus', 'Wohnung im Heim / betreut'] },
        { type: 'text', q: 'Wer ist Ihr Vermieter oder Ihre Verwaltung?', field: 'values.vermieter', ph: 'z. B. Immo AG, 031 …', optional: true, explain: 'Bei einem Todesfall muss die Wohnung gekündigt oder übergeben werden.' },
        { type: 'text', q: 'Wer hat einen Schlüssel zu Ihrer Wohnung?', field: 'values.schluessel', ph: 'z. B. Nachbarin Frau Huber, Nr. 5', optional: true, explain: 'Im Notfall kommt so jemand schnell hinein.' },
        { type: 'text', q: 'Wo liegen Mietvertrag oder Grundbuchauszug? Gibt es sonst etwas zu wissen?', field: 'values.notiz', ph: 'z. B. Ordner «Wohnen» im Büro', area: true, optional: true },
      ],
      outro: 'Danke, damit ist Ihr Zuhause geregelt.' },

    { id: 'bestattung', section: 'bestattung', title: 'Bestattungswünsche', minutes: 3,
      intro: 'Manche Menschen wissen schon, wie ihr Abschied sein soll, andere nicht. Beides ist in Ordnung. Alle Angaben sind freiwillig, und es gibt keine richtige oder falsche Antwort.',
      steps: [
        { type: 'info', text: 'Sie können jede Frage überspringen. Wenn Sie etwas festhalten, entlastet das Ihre Angehörigen in einer schweren Zeit.' },
        { type: 'choice', q: 'Welche Art der Bestattung kommt für Sie infrage?', field: 'values.art', options: ['Erdbestattung (Sarg)', 'Kremation (Urne)', 'Noch offen'] },
        { type: 'choice', q: 'Wie soll die Abdankung sein?', field: 'values.feier', options: ['Kirchlich', 'Weltlich', 'Im engsten Kreis', 'Keine Feier'] },
        { type: 'text', q: 'Gibt es einen Ort, der Ihnen wichtig ist?', field: 'values.ort', ph: 'z. B. Friedhof Bremgarten, Bern', optional: true },
        { type: 'text', q: 'Haben Sie weitere Wünsche?', field: 'values.notiz', ph: 'z. B. Lieblingslied, Spenden statt Blumen', area: true, optional: true },
      ],
      outro: 'Danke, Sie haben das in Ihrem Tempo festgehalten.' },

    { id: 'alltag', section: 'alltag', title: 'Alltag', minutes: 5,
      intro: 'Tiere, Pflanzen und das Auto brauchen auch dann Pflege, wenn Sie einmal ausfallen. Hier halten wir fest, wer sich worum kümmern kann.',
      steps: [
        { type: 'text', q: 'Haben Sie Haustiere? Was brauchen sie?', field: 'values.tiere', ph: 'z. B. Katze Minou, Futter im Keller', area: true, optional: true, explain: 'Tiere dürfen nicht vergessen gehen, wenn Sie plötzlich im Spital sind.' },
        { type: 'text', q: 'Gibt es Pflanzen, die Pflege brauchen?', field: 'values.pflanzen', ph: 'z. B. Orchideen einmal pro Woche giessen', area: true, optional: true },
        { type: 'text', q: 'Haben Sie ein Auto? Wo sind Schlüssel und Papiere?', field: 'values.auto', ph: 'z. B. VW Golf, Schlüssel in der Kommode', area: true, optional: true },
      ],
      outro: 'Gut, so ist der Alltag abgedeckt.' },

    { id: 'wuensche', section: 'wuensche', title: 'Das ist mir wichtig', minutes: 12,
      intro: 'Hier geht es um Ihre Haltung und Ihre Worte. Das ist eine Gesprächsgrundlage für Familie und Hausarzt, keine Verfügung. Alles ist freiwillig, und Sie können jederzeit aufhören.',
      steps: [
        { type: 'info', text: 'Es gibt keine richtigen oder falschen Antworten. Schreiben Sie nur, was Sie mitteilen möchten. Rechtlich verbindlich ist dieser Teil nicht.' },
        { type: 'text', q: 'Wenn ich schwer krank bin, ist mir wichtig …', field: 'values.krank', area: true, optional: true, explain: 'Ihre Liebsten verstehen so besser, was Ihnen am Herzen liegt.' },
        { type: 'text', q: 'Wo ich leben möchte, wenn ich Hilfe brauche …', field: 'values.wohnen', area: true, optional: true },
        { type: 'text', q: 'Das möchte ich meinen Liebsten sagen …', field: 'values.sagen', area: true, optional: true },
      ],
      outro: 'Danke für Ihr Vertrauen, diese Worte bleiben bei Ihnen.' },

    { id: 'digital', section: 'digital', title: 'Digitales', minutes: 7,
      intro: 'E-Mail, Social Media und Online-Konten gehören auch zu Ihrem Leben. Damit Angehörige sie finden, notieren wir nur, wo etwas ist. Passwörter und PINs gehören nicht hierher.',
      steps: [
        { type: 'info', text: 'Bitte schreiben Sie hier nie ein Passwort oder eine PIN auf. Es genügt zu sagen, wo diese liegen.' },
        { type: 'text', q: 'Welche Online-Konten haben Sie?', field: 'values.konten', ph: 'z. B. Gmail, Facebook', area: true, optional: true, explain: 'Sonst bleiben Konten und Abos unbemerkt bestehen.' },
        { type: 'text', q: 'Wo liegen Ihre Zugangsdaten?', field: 'values.pw', ph: 'z. B. Passwort-Manager, Zettel im Safe', optional: true },
        { type: 'text', q: 'Was soll mit den Konten geschehen?', field: 'values.wunsch', ph: 'z. B. Konten löschen', area: true, optional: true },
      ],
      outro: 'Gut, Ihre digitale Welt ist geordnet.' },
  ];

  LF.MODES = [
    { id: 'kurz', label: 'Schnell', minutes: 15, tagline: 'Für zwischendurch: die fünf wichtigsten Punkte in einer Viertelstunde.',
      topics: ['persoenlich', 'personen', 'patvf', 'vorsorgeauftrag', 'testament'] },
    { id: 'standard', label: 'Standard', minutes: 30, tagline: 'Für einen ruhigen Nachmittag: dazu Versicherungen, Konten, Verträge und Bestattung.',
      topics: ['persoenlich', 'personen', 'patvf', 'vorsorgeauftrag', 'testament', 'versicherungen', 'konten', 'vertraege', 'bestattung'] },
    { id: 'gruendlich', label: 'Gründlich', minutes: 60, tagline: 'Wenn Sie sich Zeit nehmen möchten: alle 13 Bereiche, auch Wohnen, Alltag, Wünsche und Digitales.',
      topics: ['persoenlich', 'personen', 'patvf', 'vorsorgeauftrag', 'testament', 'versicherungen', 'konten', 'vertraege', 'wohnen', 'bestattung', 'alltag', 'wuensche', 'digital'] },
  ];
})();
