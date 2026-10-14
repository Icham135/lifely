/* Erzeugt Apps-Script-Code, der das Google-Formular zur Umfrage baut (Quelle: umfrage/fragen.js).
   Aufruf: node tools/make-gform.cjs > /tmp/form.gs  – dann in script.google.com einfügen und «lifelyForm» ausführen.
   Das Skript schreibt am Ende die Formular-Adresse und die entry-IDs (JSON) ins Protokoll. */
const S = require('../umfrage/fragen.js');
const code = `const S = ${JSON.stringify(S)};
function lifelyForm() {
  const f = FormApp.create(S.title);
  f.setDescription(S.intro).setConfirmationMessage(S.thanks).setProgressBar(true).setCollectEmail(false).setAllowResponseEdits(false);
  const pages = {}, items = [], branch = [];
  S.sections.forEach((sec, i) => {
    if (i) pages[sec.id] = f.addPageBreakItem().setTitle(sec.title).setHelpText(sec.desc || '');
    else f.addSectionHeaderItem().setTitle(sec.title);
    sec.questions.forEach(q => {
      let it;
      if (q.type === 'radio') it = f.addMultipleChoiceItem().setChoiceValues(q.opts);
      if (q.type === 'check') {
        it = f.addCheckboxItem().setChoiceValues(q.opts);
        if (q.max) it.setValidation(FormApp.createCheckboxValidation().requireSelectAtMost(q.max).build());
      }
      if (q.type === 'text') it = f.addParagraphTextItem();
      if (q.type === 'short') it = f.addTextItem();
      if (q.type === 'scale') it = f.addScaleItem().setBounds(1, 5).setLabels(q.low, q.high);
      it.setTitle(q.t).setRequired(!!q.req);
      if (q.max) it.setHelpText('Höchstens ' + q.max + ' auswählen');
      if (q.hint) it.setHelpText(q.hint);
      if (q.other) it.showOtherOption(true);
      if (q.next) branch.push([it, q]);
      items.push([q, it]);
    });
  });
  branch.forEach(([it, q]) => it.setChoices(q.opts.map(o => it.createChoice(o, pages[q.next[o]]))));
  // Antworten zusätzlich in eine Tabelle
  const ss = SpreadsheetApp.create('Lifely Umfrage – Antworten');
  f.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  // entry-IDs über vorausgefüllte Links herausfinden
  const ids = {};
  items.forEach(([q, it]) => {
    let r;
    if (q.type === 'radio') r = it.createResponse(q.opts[0]);
    if (q.type === 'check') r = it.createResponse([q.opts[0]]);
    if (q.type === 'text') r = it.createResponse('x');
    if (q.type === 'short') r = it.createResponse('x');
    if (q.type === 'scale') r = it.createResponse(1);
    ids[q.k] = f.createResponse().withItemResponse(r).toPrefilledUrl().match(/entry\\.(\\d+)/)[1];
  });
  Logger.log('LIFELY_RESULT ' + JSON.stringify({ id: f.getId(), view: f.getPublishedUrl(), edit: f.getEditUrl(), sheet: ss.getUrl(), ids }));
}`;
process.stdout.write(code);
