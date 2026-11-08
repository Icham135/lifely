/* Lifely – Ansicht mit Key: Dossier einer anderen Person, nur lesen. Eigene Darstellung, unabhängig von dossier.js. */
(() => {
  const LF = window.LF, t = (s, v) => LF.t(s, v), esc = (s) => LF.esc(s == null ? '' : String(s));
  const has = (s) => typeof s === 'string' ? s.trim() !== '' : s != null;
  const urlFn = (ref) => Promise.resolve(((LF.viewer || {}).urls || {})[ref.path]);
  const ico = (name) => { try { return LF.svg(name, 'ic') || ''; } catch (e) { return ''; } };

  // Ist der Bereich gefüllt? (eigene Prüfung, unabhängig vom Status)
  const filled = (s, d) => {
    if (!d) return false;
    const f = (d.files || []).length > 0;
    if (s.kind === 'doc') return !!d.has || has(d.where) || has(d.copy) || has(d.note) || f;
    if (s.kind === 'list') return (d.items || []).length > 0 || !!d.none;
    if (s.kind === 'people') return (d.items || []).length > 0;
    return Object.values(d.values || {}).some(has) || f;
  };
  const status = (s, d) => { try { return LF.dossier.status(s.id, d); } catch (e) { return null; } };
  const chip = (st) => st ? `<span class="chip ${esc(st.state)}">${esc(t(st.label))}</span>` : '';
  const phoneHref = (p) => 'tel:' + String(p).replace(/[^\d+]/g, '');

  const line = (label, val) => has(val) ? `<div class="vw-line"><span class="vw-k">${esc(t(label))}</span><span class="vw-v">${esc(val)}</span></div>` : '';
  const files = (arr) => (arr || []).length
    ? `<div class="vw-files">${LF.ui && LF.ui.filesHtml ? LF.ui.filesHtml(arr, { urlFn }) : arr.map(f => `<p>${esc(f.name)}</p>`).join('')}</div>` : '';
  const call = (p) => has(p.phone) ? `<a class="btn primary small vw-call" href="${esc(phoneHref(p.phone))}">${ico('phone')}<span>${esc(t('Anrufen'))} ${esc(p.phone)}</span></a>` : '';

  const person = (p) => `<div class="vw-item">
    <b>${esc(p.name)}</b>
    ${[p.rel, p.role].filter(has).length ? `<div class="vw-sub">${esc([p.rel, p.role].filter(has).join(' · '))}</div>` : ''}
    ${has(p.note) ? `<p class="vw-note">${esc(p.note)}</p>` : ''}${call(p)}</div>`;

  // Inhalt je Art
  const body = (s, d) => {
    if (s.kind === 'doc') {
      const h = d.has === 'ja' ? 'Ja' : d.has === 'nein' ? 'Nein' : d.has === '?' ? 'Weiss nicht' : '';
      return line('Gibt es', h && t(h)) + line('Fundort', d.where) + line('Kopie bei', d.copy) + line('Notiz', d.note)
        + (d.checked ? line('Zuletzt geprüft am', LF.fmt(d.checked)) : '') + files(d.files);
    }
    if (s.kind === 'list') {
      const it = (d.items || []).map(i => `<div class="vw-item"><b>${esc(i.name || i.type)}</b>${has(i.type) && has(i.name) ? `<div class="vw-sub">${esc(i.type)}</div>` : ''}${has(i.note) ? `<p class="vw-note">${esc(i.note)}</p>` : ''}${files(i.files)}</div>`).join('');
      return it || `<p class="vw-note">${esc(t('Keine vorhanden.'))}</p>`;
    }
    if (s.kind === 'people') return (d.items || []).map(person).join('');
    return (s.fields || []).map(f => line(f.label, (d.values || {})[f.k])).join('') + files(d.files);
  };

  const card = (s, d, extra = '') => {
    const st = status(s, d);
    return `<section class="card vw-card" aria-labelledby="vw-${esc(s.id)}">
      <div class="spread vw-head"><div class="ico">${ico(s.icon)}</div><h2 id="vw-${esc(s.id)}">${esc(t(s.title))}</h2>${chip(st)}</div>${extra}${body(s, d)}</section>`;
  };

  // Datum des letzten Stands
  const stand = (v, data) => {
    let ts = v.updated || v.updated_at || (data && data._updated) || 0;
    if (typeof ts === 'string') ts = Date.parse(ts) || 0;
    if (!ts) Object.values(data || {}).forEach(d => { if (d && d.checked && d.checked > ts) ts = d.checked; });
    return ts;
  };

  LF.routes.view = () => {
    const v = LF.viewer;
    if (!v) return LF.go('login');
    const data = v.data?.sections || v.data || {}, name = v.name || t('einer Person'); // Server liefert { sections: {…} }
    const get = (s) => data[s.id] || null;
    const all = SECTIONS.map(s => ({ s, d: get(s) }));
    const done = all.filter(x => filled(x.s, x.d)), empty = all.filter(x => !filled(x.s, x.d));
    // Zuoberst: Kontakte; davor «Wer entscheidet», falls Personen mit dieser Rolle da sind
    const first = done.filter(x => x.s.id === 'personen'), rest = done.filter(x => x.s.id !== 'personen');
    const decide = ((data.personen || {}).items || []).filter(p => p.role === 'Wer für mich entscheidet');
    const decideCard = decide.length ? `<section class="card mint vw-card" aria-labelledby="vw-decide">
      <div class="spread vw-head"><div class="ico sun">${ico('pen')}</div><h2 id="vw-decide">${esc(t('Wer entscheidet'))}</h2></div>${decide.map(person).join('')}</section>` : '';
    const ts = stand(v, data);

    LF.app.innerHTML = `<div class="screen vw">
      <div class="top"><div class="wm"><img src="icons/logo.svg" alt="">Lifely</div></div>
      <div class="card dark vw-hero">
        <span class="chip vw-badge">${ico('lock')} ${esc(t('Nur lesen'))}</span>
        <h1 tabindex="-1" class="light">${esc(t('Dossier von {name}', { name }))}</h1>
        <p>${esc(t('Sie sehen, was {name} hinterlegt hat. Sie können nichts ändern.', { name }))}</p>
        ${ts ? `<p class="vw-stand">${esc(t('Stand: {datum}', { datum: LF.fmt(ts) }))}</p>` : ''}
      </div>
      ${decideCard}
      ${first.concat(rest).map(x => card(x.s, x.d)).join('')}
      ${done.length ? '' : `<div class="empty">${esc(t('Es ist noch nichts hinterlegt.'))}</div>`}
      ${empty.length ? `<details class="card plain vw-empty"><summary>${esc(t('Noch nicht ausgefüllt ({n})', { n: empty.length }))}</summary>
        <ul class="vw-ul">${empty.map(x => `<li><span>${esc(t(x.s.title))}</span><span class="chip">${esc(t('Offen'))}</span></li>`).join('')}</ul></details>` : ''}
      <p class="note vw-safe">${ico('shield')}<span>${esc(t('Es wird nur angezeigt, was im Dossier steht. Passwörter gibt es hier nicht.'))}</span></p>
      <div class="bottom vw-end">
        <button class="btn ghost" data-end>${esc(t('Ansicht beenden'))}</button>
        <p class="tiny center">${esc(t('Diese Ansicht endet, wenn Sie die Seite schliessen.'))}</p>
      </div></div>`;

    // Karten sanft einblenden (gestaffelt)
    LF.app.querySelectorAll('.vw-card').forEach((c, i) => c.style.animationDelay = Math.min(i, 8) * 45 + 'ms');
    if (LF.ui && LF.ui.bindFiles) LF.ui.bindFiles(LF.app, { urlFn });
    LF.app.querySelector('[data-end]').onclick = () => {
      LF.viewerClose(); LF.viewer = null; LF.app.innerHTML = ''; LF.go('login');
    };
  };
})();
