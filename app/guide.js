/* Lifely – Geführte Vorsorge: Startseite (Zeitwahl, Fortschritt) und Chat-Durchlauf (guide/run).
   Liest LF.TOPICS/LF.MODES (topics.js), speichert jede Antwort sofort ins Dossier und den Verlauf in LF.guide. */
(() => {
  const L = window.LF, t = (s, v) => L.t(s, v), esc = (s) => L.esc(s == null ? '' : s);
  const G = { tok: 0, busy: false, echoed: false, rows: [] };
  const ic = (n, c) => { try { return L.svg(n, c) || ''; } catch { return ''; } };
  const gs = () => L.guide.get() || {};
  const sec = (id) => (typeof SECTION === 'function' ? SECTION(id) : null) || { id, title: id, kind: 'form' };
  const nl = (s) => esc(s).replace(/\n/g, '<br>');
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const topicsOf = (mode) => { const m = (L.MODES || []).find(x => x.id === mode); return m ? m.topics.map(id => (L.TOPICS || []).find(x => x.id === id)).filter(Boolean) : []; };
  const noTabs = (on) => document.body.classList.toggle('no-tabs', on);
  const inRun = () => /^#?\/?guide\/run/.test(location.hash);
  addEventListener('hashchange', () => { if (!inRun()) { G.tok++; noTabs(false); } });

  // Restzeit in Minuten ab Thema ti, Schritt si
  const restRaw = (tops, ti, si) => tops.reduce((m, tp, i) => i > ti ? m + (tp.minutes || 0) : i === ti ? m + (tp.minutes || 0) * (1 - (tp.steps.length ? Math.min(si, tp.steps.length) / tp.steps.length : 0)) : m, 0);
  const restMin = (tops, ti, si) => { const r = restRaw(tops, ti, si); return r > 0 ? Math.max(1, Math.round(r)) : 0; };

  // Feldzugriff ('has', 'where', 'values.key' …)
  const getVal = (d, f) => f.startsWith('values.') ? (d.values || {})[f.slice(7)] : d[f];
  const setVal = (s, f, v) => L.dossier.set(s, d => { if (f.startsWith('values.')) { d.values = d.values || {}; d.values[f.slice(7)] = v; } else d[f] = v; });
  const visible = (st, d) => !st.showIf || getVal(d, st.showIf.field) === st.showIf.equals;

  /* ---------- Startseite ---------- */
  function openAreas() { return (typeof SECTIONS !== 'undefined' ? SECTIONS : []).filter(s => L.dossier.status(s.id).state !== 'ok'); }
  function doneCard() {
    const p = L.dossier.progress(), open = openAreas();
    return `<div class="card mint g-done"><div class="eb teal">${t('Geschafft')}</div>
      <div class="qt small">${t('Ihr Dossier ist zu {x} % gefüllt', { x: p.percent })}</div>
      <div class="bar" role="progressbar" aria-valuenow="${p.percent}" aria-valuemin="0" aria-valuemax="100"><i style="width:${p.percent}%"></i></div>
      ${open.length ? `<p class="tiny">${t('Noch offen')}:</p><div class="chips">${open.map(s => `<button class="chip" data-act="go" data-to="dossier/${s.id}">${esc(t(s.title))}</button>`).join('')}</div>` : `<p class="tiny">${t('Alle Bereiche sind geregelt. Wunderbar.')}</p>`}
      <div class="note">${ic('lock')}<span>${t('Unter «Mein Dossier» können Sie alles jederzeit ergänzen. Unter «Profil → Key erstellen» geben Sie einer Vertrauensperson einen Zugang zum Nachschauen.')}</span></div></div>`;
  }
  function home() {
    G.tok++; noTabs(false);
    const g = gs(), tops = topicsOf(g.mode), name = (L.settings.name || '').trim();
    const p = L.dossier.progress();
    let body;
    if (!tops.length) {
      body = `<h2>${t('Wie viel Zeit haben Sie heute?')}</h2><p class="lead">${t('Wählen Sie, wie ausführlich wir vorgehen. Sie können jederzeit pausieren.')}</p>
        <div class="stack" data-tour="guide-modes">${(L.MODES || []).map(m => {
          const ts = m.topics.map(id => (L.TOPICS || []).find(x => x.id === id)).filter(Boolean);
          return `<button class="card g-mode" data-act="mode" data-id="${esc(m.id)}"><span class="g-min">${t('ca. {n} Minuten', { n: m.minutes })}</span>
            <b class="qt small">${esc(t(m.label))}</b><span class="tiny">${t('{n} Themen', { n: ts.length })}</span>
            <span class="g-tl">${ts.map(x => esc(t(x.title))).join(' · ')}</span></button>`; }).join('')}</div>`;
    } else if (g.ti >= tops.length) {
      body = `${doneCard()}<div class="bottom"><button class="btn primary" data-act="go" data-to="dossier">${t('Mein Dossier ansehen')}</button><button class="btn ghost" data-act="reset">${t('Anderen Zeitrahmen wählen')}</button></div>`;
    } else {
      const cur = tops[g.ti], min = restMin(tops, g.ti, g.si || 0);
      body = `<button class="card dark g-cont" data-act="cont"><span class="eb light">${t('Weitermachen')}</span><b class="qt small light" style="color:#fff">${esc(t(cur.title))}</b>
          <span>${t('Noch ca. {n} Minuten', { n: min })}</span><span class="btn white">${t('Weiter im Gespräch')}</span></button>
        <h2>${t('Ihre Themen')}</h2><div class="list">${tops.map((tp, i) => {
          const done = (g.doneTopics || []).includes(tp.id), skip = (g.skippedTopics || []).includes(tp.id), now = i === g.ti;
          return `<button class="row" data-act="jump" data-i="${i}"><span class="ico ${done ? '' : skip ? 'sun' : 'av'}">${done ? ic('check') : i + 1}</span>
            <span class="m"><b>${esc(t(tp.title))}</b><small>${t('ca. {n} Min.', { n: tp.minutes || 1 })}</small></span>
            <span class="chip ${done ? 'ok' : skip ? 'warn' : ''}">${done ? '✓ ' + t('Erledigt') : skip ? t('Übersprungen') : now ? t('Aktuell') : t('Offen')}</span></button>`; }).join('')}</div>
        <div class="bottom"><button class="btn ghost" data-act="reset">${t('Anderen Zeitrahmen wählen')}</button><button class="link" data-act="go" data-to="dossier">${t('Mein Dossier ansehen')}</button></div>
        <p class="tiny">${t('Ihre bisherigen Angaben im Dossier bleiben erhalten.')}</p>`;
    }
    L.app.innerHTML = `<section class="screen g-home"><div class="top"><div class="wm"><img src="icons/logo.svg" alt="">Lifely</div></div>
      <h1 class="hello">${name ? t('Grüezi, {name}', { name: esc(name) }) : t('Grüezi')}</h1>
      <div class="card sun g-prog"><div class="spread"><b>${t('Ihre Vorsorge')}</b><b>${p.percent} %</b></div>
        <div class="bar" role="progressbar" aria-valuenow="${p.percent}" aria-valuemin="0" aria-valuemax="100"><i style="width:${p.percent}%"></i></div>
        <p class="tiny">${t('{done} von {total} Bereichen geregelt', { done: p.done, total: p.total })}</p></div>${body}</section>`;
  }
  function homeClick(e) {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act, g = gs();
    if (a === 'go') return L.go(b.dataset.to);
    if (a === 'mode') { L.guide.set({ mode: b.dataset.id, ti: 0, si: 0, ph: 'intro', shown: '', log: [], startedAt: Date.now(), doneTopics: [], skippedTopics: [] }); return L.go('guide/run'); }
    if (a === 'cont') return L.go('guide/run');
    if (a === 'reset') { L.guide.set({ mode: '', ti: 0, si: 0, ph: 'intro', shown: '', log: [], doneTopics: [], skippedTopics: [] }); return L.render(); }
    if (a === 'jump') { L.guide.set({ ti: +b.dataset.i, si: 0, ph: 'intro', shown: '' }); return L.go('guide/run'); }
  }

  /* ---------- Chat ---------- */
  const $ = (id) => document.getElementById(id);
  const toEnd = (el) => { try { el.scrollIntoView({ block: 'end', behavior: reduced() ? 'auto' : 'smooth' }); } catch { } };
  // Letzte Frage und Antwortzone sichtbar machen (sofort, ohne Animation; beachtet die feste Kopfzeile)
  function reveal() {
    const z = $('gz'); if (!z) return;
    try {
      z.scrollIntoView({ block: 'end', behavior: 'auto' });
      const bs = document.querySelectorAll('#gc .g-b.bot:not(.g-typing)'), lb = bs[bs.length - 1], hd = document.querySelector('.g-head');
      if (lb && hd) {
        const hh = hd.offsetHeight, r = lb.getBoundingClientRect();
        // Frage unter die Kopfzeile holen; ist die Zone sehr hoch, bleibt die Frage trotzdem sichtbar (Zone darunter)
        if (r.top < hh + 8) scrollBy(0, r.top - hh - 8);
      }
    } catch { }
  }
  // Fokus auf das erste Antwortfeld bzw. den ersten Antwortknopf; die Frage dient als Beschriftung
  function focusZone(q) {
    const g = $('gz') && $('gz').querySelector('.g-in'); if (!g) return;
    if (q) { g.setAttribute('role', 'group'); g.setAttribute('aria-label', q); }
    const f = g.querySelector('input:not([type=file]), textarea, select, button:not([disabled])');
    if (f) { try { f.focus({ preventScroll: true }); } catch { } }
  }
  function bubbleHtml(e) {
    if (e.who === 'ok') return `✓ ${t('Im Dossier gespeichert')}: <b>${esc(t(e.text))}</b> <button class="link g-see" data-act="go" data-to="dossier/${esc(e.sec)}">${t('Ansehen')}</button>`;
    return (e.title ? `<b class="g-bt">${esc(e.title)}</b>` : '') + nl(e.text) + (e.hint ? `<div class="g-hint">${esc(e.hint)}</div>` : '');
  }
  function addBubble(e, anim) {
    const c = $('gc'); if (!c) return;
    const d = document.createElement('div');
    d.className = 'g-b ' + (e.who === 'me' ? 'me' : e.who === 'ok' ? 'ok' : 'bot') + (anim ? ' new' : '');
    d.innerHTML = bubbleHtml(e); c.appendChild(d); if (anim) toEnd(d);
  }
  function push(e) {
    e.ts = Date.now();
    L.guide.set({ log: (gs().log || []).concat(e).slice(-60) });
    addBubble(e, true);
  }
  function typing() {
    const c = $('gc'), d = document.createElement('div');
    d.className = 'g-b bot g-typing new'; d.setAttribute('aria-label', t('Lifely schreibt …'));
    d.innerHTML = '<i></i><i></i><i></i>'; c && c.appendChild(d); toEnd(d); return d;
  }
  async function say(tok, text, extra) {
    if (tok !== G.tok) return false;
    const ty = typing(); await L.sleep(reduced() ? 80 : 500 + Math.random() * 400);
    ty.remove(); if (tok !== G.tok) return false;
    push(Object.assign({ who: 'bot', text }, extra)); return true;
  }
  function updHead() {
    const g = gs(), tops = topicsOf(g.mode), tp = tops[g.ti];
    const total = tops.reduce((m, x) => m + (x.minutes || 0), 0) || 1, r = restRaw(tops, g.ti, g.si || 0);
    if (!$('gt')) return;
    $('gt').textContent = tp ? t(tp.title) : t('Geschafft');
    $('gbar').style.width = Math.max(4, Math.round((1 - r / total) * 100)) + '%';
    const m = restMin(tops, g.ti, g.si || 0);
    $('gmin').textContent = m ? t('noch ca. {n} Min.', { n: m }) : t('Fertig');
  }

  // Eingabezone: Inhalt + dezente Werkzeuge
  function ctrl(html, o = {}) {
    const z = $('gz'); if (!z) return;
    z.innerHTML = `<div class="g-in">${html}</div><div class="g-tools">
      <button class="link" data-act="ask">${t('Frage stellen')}</button>
      ${o.skip === false ? '' : `<button class="link" data-act="skipmenu">${t('Thema überspringen …')}</button>`}
      ${o.why ? `<button class="link" data-act="why">${t('Warum fragen wir das?')}</button>` : ''}</div><div id="gx"></div>`;
    z.classList.remove('g-pop'); void z.offsetWidth; z.classList.add('g-pop'); reveal();
  }
  const panel = (html) => { const x = $('gx'); if (x) { x.innerHTML = html; toEnd(x); } };

  async function step(tok) {
    if (tok !== G.tok) return;
    const g = gs(), tops = topicsOf(g.mode);
    if (!tops.length) return L.go('guide');
    if (g.ti >= tops.length) return finish(tok);
    const tp = tops[g.ti]; updHead(); G.echoed = false;
    let ph = g.ph || (g.si ? 'step' : 'intro');
    if (ph === 'intro') {
      const done = (gs().log || []).length;
      const txt = (tp.intro ? t(tp.intro) : '') + ' ' + t('Das dauert etwa {n} Minuten.', { n: tp.minutes || 1 });
      if (!await say(tok, txt.trim(), { title: t(tp.title) })) return;
      L.guide.set({ ph: 'step', shown: 'I' + g.ti }); ph = 'step';
    }
    if (ph === 'step') {
      let si = g.si || 0; const d = L.dossier.get(tp.section);
      while (si < tp.steps.length && !visible(tp.steps[si], d)) si++;
      if (si >= tp.steps.length) { L.guide.set({ si, ph: 'outro' }); ph = 'outro'; }
      else {
        const st = tp.steps[si], key = g.ti + ':' + si;
        L.guide.set({ si }); updHead();
        if (gs().shown !== key) { if (!await say(tok, t(st.q || st.text))) return; L.guide.set({ shown: key }); }
        zone(tok, tp, st); if (tok === G.tok) { reveal(); focusZone(t(st.q || st.text)); } return;
      }
    }
    // Ende eines Themas
    const key = 'O' + g.ti;
    if (gs().shown !== key) {
      if (tp.outro && !await say(tok, t(tp.outro))) return;
      const s = L.dossier.summary(tp.section);
      if (s && !await say(tok, t('Das haben wir festgehalten') + ': ' + s)) return;
      const dt = (gs().doneTopics || []).filter(x => x !== tp.id).concat(tp.id);
      L.guide.set({ shown: key, doneTopics: dt, skippedTopics: (gs().skippedTopics || []).filter(x => x !== tp.id) });
    }
    const nx = tops[g.ti + 1];
    G.cur = { tp, st: null };
    ctrl(`<button class="btn primary" data-act="next">${nx ? t('Weiter zum nächsten Thema: {x}', { x: esc(t(nx.title)) }) : t('Abschliessen')}</button>`, { skip: false });
    focusZone(t('Dieses Thema ist abgeschlossen.'));
  }

  function finish(tok) {
    const run = async () => {
      L.guide.set({ ph: 'end' }); updHead(); $('gbar') && ($('gbar').style.width = '100%');
      if (gs().shown !== 'END') {
        if (!await say(tok, t('Wir sind am Ende angekommen. Vielen Dank für Ihre Zeit.'))) return;
        L.guide.set({ shown: 'END' });
      }
      const z = $('gz'); if (!z) return;
      z.innerHTML = `${doneCard()}<div class="bottom"><button class="btn primary" data-act="go" data-to="dossier">${t('Mein Dossier ansehen')}</button><button class="btn ghost" data-act="go" data-to="guide">${t('Zurück zum Start')}</button></div>`;
      reveal();
    };
    return run();
  }

  function zone(tok, tp, st) {
    G.cur = { tp, st }; const sc = sec(tp.section), d = L.dossier.get(tp.section), o = { why: !!st.explain };
    const ph = esc(st.ph ? t(st.ph) : '');
    if (st.type === 'info') return ctrl(`<button class="btn primary" data-act="info">${t('Weiter')}</button>`, Object.assign(o, { skip: false }));
    if (st.type === 'yesno') return ctrl(`<div class="g-yn"><button class="btn primary" data-act="yn" data-v="ja">${t('Ja')}</button><button class="btn ghost" data-act="yn" data-v="nein">${t('Nein')}</button><button class="btn ghost" data-act="yn" data-v="?">${t('Weiss nicht')}</button></div>`, o);
    if (st.type === 'choice') return ctrl(`<div class="g-chips">${(st.options || []).map((x, i) => `<button class="g-chip" data-act="ch" data-i="${i}">${esc(t(x))}</button>`).join('')}</div>`, o);
    if (st.type === 'text') {
      const cur = getVal(d, st.field) || '';
      return ctrl(`<label class="sr" for="gi">${esc(t(st.q))}</label>${st.area ? `<textarea id="gi" class="in" rows="4" placeholder="${ph}">${esc(cur)}</textarea>` : `<input id="gi" class="in" type="text" placeholder="${ph}" value="${esc(cur)}" autocomplete="off">`}
        <div id="gq"></div><div class="g-btns"><button class="btn primary" data-act="send">${t('Senden')}</button>${st.optional ? `<button class="btn ghost" data-act="later">${t('Diese Frage überspringen')}</button>` : ''}</div>`, o);
    }
    if (st.type === 'upload') {
      ctrl(`<div id="gf"></div><div class="g-btns"><button class="btn primary" data-act="fertig">${t('Fertig')}</button><button class="btn ghost" data-act="later">${t('Später')}</button></div>`, o);
      const c = $('gf'); if (c && L.ui && L.ui.files) L.ui.files(c, { sectionId: tp.section, files: d.files || [], onChange: (f) => { if (Array.isArray(f)) L.dossier.set(tp.section, { files: f }); } });
      return;
    }
    if (st.type === 'list' || st.type === 'people') {
      const ppl = st.type === 'people';
      return ctrl(`<label class="sr" for="gi">${esc(t(st.q))}</label><textarea id="gi" class="in" rows="3" placeholder="${esc(st.example ? t('z. B.') + ' ' + st.example.replace(/^z\. ?B\. ?/, '') : ppl ? t('z. B. Meine Tochter Anna Muster, 079 123 45 67') : t('z. B. CSS Krankenkasse und Mobiliar Hausrat'))}"></textarea>
        <div id="gq"></div><div class="g-btns"><button class="btn primary" data-act="extract">${t('Weiter')}</button>
        <button class="btn ghost" data-act="manual">${t('Lieber selbst eintragen')}</button>
        ${ppl ? `<button class="btn ghost" data-act="later">${t('Später')}</button>` : `<button class="btn ghost" data-act="none">${esc(t(st.none || 'Ich habe keine'))}</button>`}</div>`, o);
    }
    // unbekannte Schrittart: überspringen
    L.guide.set({ si: (gs().si || 0) + 1 }); return step(tok);
  }

  // Antwort verarbeiten: Sprechblase, Speichern, Bestätigung, nächster Schritt
  async function answer(tok, text, save, o = {}) {
    if (G.busy) return; G.busy = true;
    const { tp } = G.cur;
    try {
      const z = $('gz'); z && (z.innerHTML = '');
      if (text && !o.noMe) push({ who: 'me', text });
      if (save) { await save(); }
      if (save || o.ok) push({ who: 'ok', text: sec(tp.section).title, sec: tp.section });
      if (o.react && !await say(tok, o.react)) return;
      L.guide.set({ si: (gs().si || 0) + 1 });
      await step(tok);
    } finally { G.busy = false; }
  }
  const skipStep = (tok) => { if (G.busy) return; G.busy = true; L.guide.set({ si: (gs().si || 0) + 1 }); const z = $('gz'); z && (z.innerHTML = ''); return step(tok).finally(() => { G.busy = false; }); };

  // Einträge prüfen/erfassen (list und people)
  const rowHtml = (r, i, st, sc) => {
    const ppl = sc.kind === 'people';
    const opt = (arr, v) => arr.map(x => `<option${x === v ? ' selected' : ''}>${esc(x)}</option>`).join('');
    return `<div class="g-ent" data-r="${i}"><div class="spread"><b>${t('Eintrag {n}', { n: i + 1 })}</b><button class="link" data-act="rm" data-i="${i}" aria-label="${t('Eintrag entfernen')}">${t('Entfernen')}</button></div>
      ${ppl ? `<label class="field">${t('Name')}<input class="in" data-f="name" value="${esc(r.name)}" autocomplete="off"></label>
        <label class="field">${t('Beziehung')}<input class="in" data-f="rel" value="${esc(r.rel)}" placeholder="${t('z. B. Tochter')}" autocomplete="off"></label>
        <label class="field">${t('Rolle')}<select class="in" data-f="role"><option value=""></option>${opt(sc.roles || [], r.role)}</select></label>
        <label class="field">${t('Telefon')}<input class="in" data-f="phone" type="tel" value="${esc(r.phone)}" autocomplete="off"></label>
        <label class="field">${t('Notiz')}<input class="in" data-f="note" value="${esc(r.note)}" autocomplete="off"></label>`
      : `<label class="field">${t('Art')}<select class="in" data-f="type">${opt(sc.types || [], r.type)}</select></label>
        <label class="field">${esc(t((sc.nameLabel || ['Name'])[0]))}<input class="in" data-f="name" value="${esc(r.name)}" placeholder="${esc(sc.nameLabel ? t(sc.nameLabel[1]) : '')}" autocomplete="off"></label>
        <label class="field">${esc(t((sc.noteLabel || ['Notiz'])[0]))}<input class="in" data-f="note" value="${esc(r.note)}" placeholder="${esc(sc.noteLabel ? t(sc.noteLabel[1]) : '')}" autocomplete="off"></label>`}</div>`;
  };
  const blank = (sc, st) => sc.kind === 'people' ? { name: '', rel: '', role: st.role || '', phone: '', note: '' } : { type: (sc.types || [''])[0], name: '', note: '' };
  function collect() { return [...document.querySelectorAll('.g-ent')].map((el, i) => { const r = Object.assign({}, G.rows[i]); el.querySelectorAll('[data-f]').forEach(f => { r[f.dataset.f] = f.value; }); return r; }); }
  function editor(msg) {
    const { tp, st } = G.cur, sc = sec(tp.section);
    ctrl(`${msg ? `<p class="g-msg">${esc(msg)}</p>` : ''}<div class="g-ents">${G.rows.map((r, i) => rowHtml(r, i, st, sc)).join('')}</div>
      <div class="g-btns"><button class="btn ghost" data-act="addrow">${t('Noch einer')}</button><button class="btn primary" data-act="okrows">${t('Stimmt so')}</button></div>`, { why: !!st.explain });
  }
  const toRows = (arr, sc, st) => arr.map(x => Object.assign(blank(sc, st), x)).map(r => { if (sc.kind !== 'people' && sc.types && !sc.types.includes(r.type)) r.type = sc.types.includes('Andere') ? 'Andere' : sc.types[0]; return r; });

  async function extract(tok) {
    const { tp, st } = G.cur, sc = sec(tp.section), txt = ($('gi') || {}).value || '';
    if (!txt.trim()) { L.toast(t('Bitte schreiben Sie kurz, was Sie haben.')); return; }
    if (G.busy) return; G.busy = true;
    try {
      push({ who: 'me', text: txt.trim() }); G.echoed = true;
      const z = $('gz'); z && (z.innerHTML = ''); const ty = typing(); let items = [], fail = false;
      try { items = await L.ai.extract(sc.kind === 'people' ? 'people' : 'list', txt, { types: sc.types, roles: sc.roles }); } catch { fail = true; }
      ty.remove(); if (tok !== G.tok) return;
      items = Array.isArray(items) ? items.filter(x => x && x.name) : [];
      if (!items.length) {
        G.rows = [Object.assign(blank(sc, st), { name: '' })];
        await say(tok, fail || true ? t('Das konnte ich nicht automatisch ordnen. Bitte tragen Sie es kurz selbst ein.') : '');
        return editor();
      }
      G.rows = toRows(items, sc, st);
      if (sc.kind === 'people') G.rows.forEach(r => { if (!r.role && st.role) r.role = st.role; });
      await say(tok, t('Habe ich das richtig verstanden? Bitte prüfen Sie die Einträge.'));
      editor();
    } finally { G.busy = false; }
  }

  async function askAi(tok) {
    const q = (($('gq2') || {}).value || '').trim(); if (!q) return;
    const { tp, st } = G.cur; const log = gs().log || [];
    const msgs = log.filter(e => e.qa).slice(-6).map(e => ({ role: e.who === 'me' ? 'user' : 'assistant', content: e.text }));
    msgs.push({ role: 'user', content: q });
    const x = $('gx'); x && (x.innerHTML = '');
    push({ who: 'me', text: q, qa: true });
    const ty = typing(); let reply = '';
    try { reply = await L.ai.ask(msgs, t(tp.title)); } catch { reply = ''; }
    ty.remove(); if (tok !== G.tok) return;
    const cont = st ? t(st.q || st.text || '') : '';
    if (reply) push({ who: 'bot', text: reply, qa: true, hint: cont ? t('Weiter geht es mit: {x}', { x: cont }) : '' });
    else push({ who: 'bot', text: t('Die Antwort klappt gerade leider nicht. Bitte versuchen Sie es später nochmals. Sie können hier ganz normal weiterfahren.') });
    reveal();
  }

  function runClick(e) {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act, tok = G.tok, { tp, st } = G.cur || {};
    if (a === 'go') return L.go(b.dataset.to);
    if (a === 'pause') return L.go('guide');
    if (a === 'next') { if (G.busy) return; G.busy = true; L.guide.set({ ti: gs().ti + 1, si: 0, ph: 'intro' }); $('gz').innerHTML = ''; return step(tok).finally(() => { G.busy = false; }); }
    if (a === 'ask') return panel(`<div class="g-ask"><label class="sr" for="gq2">${t('Ihre Frage')}</label><textarea id="gq2" class="in" rows="2" placeholder="${t('Ihre Frage')}"></textarea><button class="btn primary" data-act="askgo">${t('Frage senden')}</button><p class="tiny">${t('Bitte keine Passwörter oder Kontonummern eingeben.')}</p></div>`) || $('gq2') && $('gq2').focus();
    if (a === 'askgo') return askAi(tok);
    if (a === 'why') return panel(`<div class="note">${esc(st && st.explain ? t(st.explain) : '')}</div>`);
    if (a === 'skipmenu') return panel(`<div class="g-ask"><button class="btn ghost" data-act="skipstep">${t('Diese Frage überspringen')}</button><button class="btn ghost" data-act="skiptopic">${t('Ganzes Thema überspringen')}</button></div>`);
    if (a === 'skipstep' || a === 'later') return skipStep(tok);
    if (a === 'skiptopic') {
      if (G.busy) return; const g = gs(), id = tp.id;
      L.guide.set({ skippedTopics: (g.skippedTopics || []).filter(x => x !== id).concat(id), ti: g.ti + 1, si: 0, ph: 'intro' });
      push({ who: 'bot', text: t('Kein Problem, wir überspringen «{x}». Im Dossier bleibt dieser Bereich offen.', { x: t(tp.title) }) });
      return step(tok);
    }
    if (!st) return;
    if (a === 'info') return skipStep(tok);
    if (a === 'yn') {
      const v = b.dataset.v, lab = v === 'ja' ? t('Ja') : v === 'nein' ? t('Nein') : t('Weiss nicht');
      return answer(tok, lab, () => setVal(tp.section, st.field || 'has', v), { react: v === 'ja' ? '' : v === 'nein' ? t('Kein Problem. Wir halten fest, dass es noch offen ist. Sie können das später nachholen.') : t('Auch das ist in Ordnung. Wir merken es als offen vor.') });
    }
    if (a === 'ch') { const v = st.options[+b.dataset.i]; return answer(tok, t(v), () => setVal(tp.section, st.field, v)); }
    if (a === 'send' || a === 'sendq') {
      const inp = $('gi'), v = (inp.value || '').trim();
      if (!v) return L.toast(st.optional ? t('Bitte schreiben Sie etwas oder tippen Sie auf «Überspringen».') : t('Bitte schreiben Sie kurz etwas.'));
      if (a === 'send' && /\?\s*$/.test(v)) return ($('gq').innerHTML = `<div class="note sunbg g-qq"><b>${t('Das ist eine Frage – an Lifely stellen?')}</b><div class="g-btns"><button class="btn primary" data-act="qyes">${t('Ja, Frage stellen')}</button><button class="btn ghost" data-act="sendq">${t('Nein, so speichern')}</button></div></div>`);
      return answer(tok, t(v), () => setVal(tp.section, st.field, v));
    }
    if (a === 'qyes') { const v = ($('gi').value || '').trim(); panel(`<div class="g-ask"><textarea id="gq2" class="in" rows="2">${esc(v)}</textarea><button class="btn primary" data-act="askgo">${t('Frage senden')}</button></div>`); $('gq').innerHTML = ''; return; }
    if (a === 'fertig') {
      const n = (L.dossier.get(tp.section).files || []).length;
      if (!n) return L.toast(t('Es wurde noch nichts hochgeladen. Tippen Sie auf «Später», wenn Sie das nachholen möchten.'));
      return answer(tok, t('{n} Datei(en) hinzugefügt', { n }), null, { ok: true });
    }
    if (a === 'none') return answer(tok, t(st.none || 'Ich habe keine'), () => L.dossier.set(tp.section, d => { d.none = true; }));
    if (a === 'extract') return extract(tok);
    if (a === 'manual') { G.rows = [blank(sec(tp.section), st)]; return editor(); }
    if (a === 'addrow') { G.rows = collect(); G.rows.push(blank(sec(tp.section), st)); return editor(); }
    if (a === 'rm') { G.rows = collect(); G.rows.splice(+b.dataset.i, 1); if (!G.rows.length) return zone(tok, tp, st); return editor(); }
    if (a === 'okrows') {
      const sc = sec(tp.section), rows = collect().filter(r => (r.name || '').trim());
      if (!rows.length) return L.toast(t('Bitte tragen Sie mindestens einen Namen ein.'));
      const names = rows.map(r => r.name.trim()).join(', ');
      return answer(tok, names, () => L.dossier.set(tp.section, d => {
        d.items = (d.items || []).concat(rows.map(r => sc.kind === 'people'
          ? { id: L.uid(), name: r.name.trim(), rel: (r.rel || '').trim(), role: r.role || '', phone: (r.phone || '').trim(), note: (r.note || '').trim() }
          : { id: L.uid(), type: r.type, name: r.name.trim(), note: (r.note || '').trim(), files: [] }));
        if (sc.kind !== 'people') d.none = false;
      }), { noMe: G.echoed });
    }
  }
  function runKey(e) {
    if (e.key === 'Enter' && !e.shiftKey && e.target.id === 'gi' && e.target.tagName === 'INPUT') { e.preventDefault(); document.querySelector('[data-act="send"]')?.click(); }
  }

  function run() {
    const g = gs(), tops = topicsOf(g.mode);
    if (!tops.length) { noTabs(false); return home(); }
    noTabs(true); const tok = ++G.tok; G.busy = false;
    L.app.innerHTML = `<section class="screen g-run"><header class="g-head"><button class="back" data-act="pause">${ic('back')}${t('Pause')}</button>
      <div class="g-ht"><b id="gt"></b><div class="bar"><i id="gbar"></i></div><small id="gmin"></small></div></header>
      <div class="g-chat" id="gc" aria-live="polite"></div><div class="g-zone" id="gz"></div></section>`;
    L.app.onclick = runClick; L.app.onkeydown = runKey;
    (g.log || []).slice(-60).forEach(e => addBubble(e, false));
    updHead(); reveal();
    // Router setzt den Scroll evtl. nach dem Zeichnen zurück: danach nochmals ans Ende
    [120, 450].forEach(ms => setTimeout(() => { if (tok === G.tok && inRun() && !G.busy) reveal(); }, ms));
    step(tok);
  }

  L.routes.guide = (arg) => {
    L.app.onclick = null; L.app.onkeydown = null;
    if (arg === 'run') return run();
    home(); L.app.onclick = homeClick;
  };
})();
