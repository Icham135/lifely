/* Lifely – Mein Dossier: Übersicht und Bearbeiten der Bereiche (doc, list, people, form).
   Alles wird automatisch gespeichert (LF.dossier.set ist entprellt), beim Verlassen der Seite sofort (LF.dossier.flush). */
(() => {
  const t = (s, v) => LF.t(s, v), esc = (s) => LF.esc(s);
  const ic = (n, c) => LF.svg(n, c);
  // Kleine, wiederverwendbare Hinweis-Komponente (Stil .note)
  const hintNote = (txt, icon = 'info') => `<p class="note dhint">${ic(icon)}<span>${esc(txt)}</span></p>`;
  // Speicherstand-Anzeige über Dokument-Ereignisse (core-data.js); findet #saved bei jedem Ereignis neu
  const savedEl = () => document.getElementById('saved');
  const setSaved = (txt, bad) => { const el = savedEl(); if (!el) return; el.textContent = txt; el.classList.add('on'); el.classList.toggle('bad', !!bad); };
  document.addEventListener('lf:saving', () => setSaved(t('Speichert …')));
  document.addEventListener('lf:saved', () => setSaved(t('Gespeichert ✓')));
  document.addEventListener('lf:saveerror', () => setSaved(t('Nicht gespeichert, wir versuchen es nochmals'), true));
  const CHIP = { ok: 'ok', warn: 'warn', due: 'due' };
  const emptyOf = (s, d) => s.kind === 'doc' ? !d.has && !d.where && !d.copy && !d.note && !(d.files || []).length
    : s.kind === 'list' ? !(d.items || []).length && !d.none
    : s.kind === 'people' ? !(d.items || []).length
    : !Object.values(d.values || {}).some(Boolean) && !(d.files || []).length;

  /* Beim Seitenwechsel oder Schliessen sofort speichern */
  const flush = () => { try { LF.dossier.flush(); } catch (e) {} };
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

  /* ---------- Übersicht ---------- */
  function overview() {
    const all = LF.dossier.all(), p = LF.dossier.progress();
    const blank = SECTIONS.every(s => emptyOf(s, all[s.id] || {}));
    const rows = SECTIONS.map(s => {
      const st = LF.dossier.status(s.id);
      return `<button type="button" class="row" data-go="dossier/${s.id}"><span class="ico">${ic(s.icon)}</span>
        <span class="m"><b>${esc(t(s.title))}</b><small>${esc(st.sub || '')}</small></span>
        <span class="chip ${CHIP[st.state] || ''}">${esc(t(st.label))}</span></button>`;
    }).join('');
    LF.app.innerHTML = `<section class="screen dossier">
      <h1>${t('Mein Dossier')}</h1>
      <p class="lead">${t('Das ist Ihr Dossier. Sie können jederzeit alles selbst ergänzen oder ändern.')}</p>
      <div class="card mint dprog"><div class="spread"><b>${t('{done} von {total} Bereichen geregelt', { done: p.done, total: p.total })}</b><span class="teal">${p.percent}%</span></div>
        <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p.percent}"><i style="width:${p.percent}%"></i></div></div>
      ${blank ? `<div class="card sun dblank"><div class="qt small">${t('Noch nichts eingetragen')}</div>
        <p>${t('Kein Problem. Wir führen Sie Schritt für Schritt und Sie bestimmen das Tempo.')}</p>
        <button type="button" class="btn primary" data-go="guide" style="margin-top:14px">${t('Geführte Vorsorge starten')}</button></div>` : ''}
      <div class="list dlist">${rows}</div></section>`;
  }

  /* ---------- Bearbeiten ---------- */
  function edit(id) {
    const s = SECTION(id);
    const state = { mode: 'list', eid: null, draft: null };
    const doc = (n) => LF.dossier.get(id)[n];
    LF.app.innerHTML = `<section class="screen dossier dedit">
      <div class="top">${LF.back('dossier', t('Mein Dossier'))}<span class="saved" id="saved" role="status" aria-live="polite"></span></div>
      <h1>${esc(t(s.title))}</h1><p class="lead">${esc(t(s.hint || ''))}</p>
      ${id === 'konten' || id === 'digital' ? `<p class="note warn">${ic('lock')}<span>${t('Tragen Sie nie Passwörter, PINs oder Kontonummern ein. Nur, wo etwas ist.')}</span></p>` : ''}
      <div id="body"></div>
      ${['patvf', 'vorsorgeauftrag', 'testament'].includes(id) ? hintNote(t('Lifely gibt keine Rechtsberatung. Bei Fragen helfen Notariat, Pro Senectute oder Ihr Hausarzt.')) : ''}
      <div class="bottom"><button type="button" class="btn primary" data-go="dossier">${t('Fertig')}</button></div></section>`;
    const $ = (q) => LF.app.querySelector(q);
    const body = $('#body');
    /* Anzeige «Gespeichert ✓» */
    // Ehrlich: «Gespeichert» erst nach dem Ereignis 'lf:saved' (siehe unten)
    const save = (fnOrPatch) => { LF.dossier.set(id, fnOrPatch); const el = $('#saved'); if (el) { el.textContent = t('Speichert …'); el.classList.remove('bad'); el.classList.add('on'); } };
    const filesUi = (host, files, onChange) => {
      if (!host) return;
      if (LF.ui && LF.ui.files) LF.ui.files(host, { sectionId: id, files, onChange: (f) => onChange(Array.isArray(f) ? f : files) });
      else host.innerHTML = `<p class="tiny">${t('Fotos und PDFs sind gleich verfügbar.')}</p>`;
    };
    const filesBlock = `<div class="dfiles"><b>${t('Fotos und PDFs')}</b><div id="ff"></div></div>`;

    /* Auswahl als Segment (kurze Listen) oder Auswahlfeld */
    const choiceHtml = (fid, label, opts, val) => {
      const useSeg = opts.length <= 3 && opts.every(o => o.length <= 14);
      return useSeg
        ? `<fieldset class="field"><legend>${esc(t(label))}</legend><div class="seg" role="group" data-fid="${fid}">${opts.map(o => `<button type="button" aria-pressed="${val === o}" data-v="${esc(o)}">${esc(t(o))}</button>`).join('')}</div></fieldset>`
        : `<label class="field">${esc(t(label))}<select class="in" data-fid="${fid}"><option value="">${t('Bitte wählen')}</option>${opts.map(o => `<option value="${esc(o)}" ${val === o ? 'selected' : ''}>${esc(t(o))}</option>`).join('')}</select></label>`;
    };

    /* --- doc --- */
    function renderDoc() {
      const d = LF.dossier.get(id);
      const seg = [['ja', 'Ja'], ['nein', 'Nein'], ['?', 'Weiss nicht']];
      body.innerHTML = `<div class="stack">
        <fieldset class="field"><legend>${t('Gibt es das bei Ihnen?')}</legend><div class="seg" role="group" id="has">${seg.map(([v, l]) => `<button type="button" aria-pressed="${d.has === v}" data-v="${v}">${t(l)}</button>`).join('')}</div></fieldset>
        <div class="stack dyes" ${d.has === 'ja' ? '' : 'hidden'}>
          <label class="field">${t('Wo liegt das Original?')}<input class="in" data-f="where" value="${esc(d.where || '')}" placeholder="${esc(t('z. B. Schublade im Büro'))}" autocomplete="off"></label>
          <label class="field">${t('Wer hat eine Kopie?')} <span class="opt">${t('freiwillig')}</span><input class="in" data-f="copy" value="${esc(d.copy || '')}" placeholder="${esc(t('z. B. meine Tochter Anna'))}" autocomplete="off"></label>
          <label class="field">${t('Notiz')} <span class="opt">${t('freiwillig')}</span><textarea class="in" rows="3" data-f="note">${esc(d.note || '')}</textarea></label>
          ${filesBlock}
          <button type="button" class="btn ghost" id="chk">${ic('check')}${t('Heute geprüft, alles stimmt')}</button>
          <p class="tiny" id="chkt">${d.checked ? t('Zuletzt geprüft: {d}', { d: LF.fmt(d.checked) }) : ''}</p>
        </div>
        <p class="note dno" ${d.has === 'nein' ? '' : 'hidden'}>${ic('pen')}<span>${t('Kein Problem. Sie können das später in Ruhe nachholen. Die Geführte Vorsorge hilft dabei.')}</span></p></div>`;
      const yes = body.querySelector('.dyes'), no = body.querySelector('.dno');
      body.querySelector('#has').onclick = (e) => {
        const b = e.target.closest('button'); if (!b) return;
        body.querySelectorAll('#has button').forEach(x => x.setAttribute('aria-pressed', x === b));
        yes.hidden = b.dataset.v !== 'ja'; no.hidden = b.dataset.v !== 'nein';
        save({ has: b.dataset.v });
      };
      body.querySelectorAll('[data-f]').forEach(el => el.addEventListener('input', () => save({ [el.dataset.f]: el.value })));
      body.querySelector('#chk').onclick = () => {
        const c = LF.dossier.get(id);
        if (c.has !== 'ja' || !c.where) return LF.toast(t('Bitte zuerst eintragen, wo das Original liegt.'));
        const ts = Date.now(); save({ checked: ts }); body.querySelector('#chkt').textContent = t('Zuletzt geprüft: {d}', { d: LF.fmt(ts) });
        LF.toast(t('Danke! Als geprüft eingetragen.'));
      };
      filesUi(body.querySelector('#ff'), (d.files || []).slice(), (f) => save({ files: f.slice() }));
    }

    /* --- form --- */
    function renderForm() {
      const d = LF.dossier.get(id), v = d.values || {};
      body.innerHTML = `<div class="stack">${s.fields.map(f => f.options ? choiceHtml(f.k, f.label, f.options, v[f.k])
        : `<label class="field">${esc(t(f.label))}${f.area ? `<textarea class="in" rows="4" data-k="${f.k}" placeholder="${esc(t(f.ph || ''))}">${esc(v[f.k] || '')}</textarea>`
          : `<input class="in" data-k="${f.k}" value="${esc(v[f.k] || '')}" placeholder="${esc(t(f.ph || ''))}" autocomplete="off">`}</label>`).join('')}${filesBlock}</div>`;
      const setV = (k, val) => save((x) => { x.values = x.values || {}; x.values[k] = val; });
      body.querySelectorAll('input[data-k],textarea[data-k]').forEach(el => el.addEventListener('input', () => setV(el.dataset.k, el.value)));
      body.querySelectorAll('select[data-fid]').forEach(el => el.addEventListener('change', () => setV(el.dataset.fid, el.value)));
      body.querySelectorAll('.seg[data-fid]').forEach(g => g.onclick = (e) => {
        const b = e.target.closest('button'); if (!b) return;
        g.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); setV(g.dataset.fid, b.dataset.v);
      });
      filesUi(body.querySelector('#ff'), (d.files || []).slice(), (f) => save({ files: f.slice() }));
    }

    /* --- Einträge: list und people --- */
    const itemsOf = () => (LF.dossier.get(id).items || []);
    function toList() { state.mode = 'list'; state.eid = null; state.draft = null; scrollTo(0, 0); s.kind === 'list' ? renderList() : renderPeople(); }
    function openForm(eid) {
      const cur = eid ? itemsOf().find(x => x.id === eid) : null;
      state.mode = 'form'; state.eid = eid || null;
      state.draft = cur ? JSON.parse(JSON.stringify(cur)) : { id: LF.uid(), files: [] };
      scrollTo(0, 0); s.kind === 'list' ? formList() : formPeople();
    }
    function commit() {
      const dr = state.draft;
      save((x) => { x.items = x.items || []; const i = x.items.findIndex(y => y.id === dr.id); if (i >= 0) x.items[i] = dr; else x.items.push(dr); if (s.kind === 'list') x.none = false; });
      LF.toast(t('Gespeichert')); toList();
    }
    async function remove(eid, name) {
      if (!(await LF.confirm(t('Eintrag löschen?'), t('«{n}» wird aus Ihrem Dossier entfernt.', { n: name || t('Eintrag') }), t('Löschen')))) return;
      save((x) => { x.items = (x.items || []).filter(y => y.id !== eid); }); toList();
    }
    const bindCards = () => {
      body.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openForm(b.dataset.edit));
      body.querySelectorAll('[data-del]').forEach(b => b.onclick = () => remove(b.dataset.del, b.dataset.name));
      const add = body.querySelector('#add'); if (add) add.onclick = () => openForm();
    };
    const formButtons = () => `<div class="bottom"><button type="button" class="btn primary" id="ok">${t('Speichern')}</button><button type="button" class="btn ghost" id="cancel">${t('Abbrechen')}</button></div>`;
    const bindInputs = () => {
      body.querySelectorAll('[data-d]').forEach(el => el.addEventListener('input', () => { state.draft[el.dataset.d] = el.value; el.classList.remove('bad'); }));
      body.querySelector('#cancel').onclick = toList;
    };

    function renderList() {
      const d = LF.dossier.get(id), items = d.items || [];
      const unit = s.unit || ['Eintrag', 'Einträge'];
      body.innerHTML = `${items.length ? `<div class="list dcards">${items.map(x => `<div class="card dcard plain"><div class="spread left"><span class="ico">${ic(s.icon)}</span><span class="m"><b>${esc(x.name || '')}</b><small>${esc(t(x.type || ''))}</small></span></div>
          ${x.note ? `<p class="dnote">${esc(x.note)}</p>` : ''}${(x.files || []).length ? `<p class="tiny">${ic('file', 'mini-ic')} ${t('{n} Datei(en)', { n: x.files.length })}</p>` : ''}
          <div class="dacts"><button type="button" class="btn ghost small" data-edit="${x.id}">${ic('pen')}${t('Bearbeiten')}</button><button type="button" class="btn danger small" data-del="${x.id}" data-name="${esc(x.name || '')}">${ic('trash')}${t('Löschen')}</button></div></div>`).join('')}</div>`
        : `<div class="empty">${ic(s.icon)}<p>${d.none ? t('Sie haben angegeben, dass Sie hier nichts haben.') : t('Noch kein Eintrag.')}</p></div>`}
        <div class="bottom"><button type="button" class="btn primary" id="add">${ic('plus')}${t('Hinzufügen')}</button></div>
        ${items.length ? '' : `<label class="row switch"><span class="m"><b>${t('Ich habe keine')}</b><small>${esc(t('Dann gilt dieser Bereich als geregelt.'))}</small></span><input type="checkbox" id="none" ${d.none ? 'checked' : ''}><span class="sw" aria-hidden="true"></span></label>`}`;
      bindCards();
      const n = body.querySelector('#none'); if (n) n.onchange = () => { save({ none: n.checked }); renderList(); };
    }
    function formList() {
      const dr = state.draft, nl = s.nameLabel || ['Name', ''], tl = s.noteLabel || ['Notiz', ''];
      body.innerHTML = `<div class="card plain dform"><h2>${state.eid ? t('Eintrag bearbeiten') : t('Neuer Eintrag')}</h2><div class="stack">
        <label class="field">${t('Art')}<select class="in" data-d="type"><option value="">${t('Bitte wählen')}</option>${s.types.map(o => `<option value="${esc(o)}" ${dr.type === o ? 'selected' : ''}>${esc(t(o))}</option>`).join('')}</select></label>
        <label class="field">${esc(t(nl[0]))}<input class="in" id="nm" data-d="name" value="${esc(dr.name || '')}" placeholder="${esc(t(nl[1] || ''))}" autocomplete="off"></label>
        <label class="field">${esc(t(tl[0]))} <span class="opt">${t('freiwillig')}</span><input class="in" data-d="note" value="${esc(dr.note || '')}" placeholder="${esc(t(tl[1] || ''))}" autocomplete="off"></label>
        ${filesBlock}</div>${formButtons()}</div>`;
      bindInputs();
      filesUi(body.querySelector('#ff'), (dr.files || []).slice(), (f) => { dr.files = f.slice(); });
      body.querySelector('#ok').onclick = () => {
        if (!(dr.name || '').trim()) { const el = body.querySelector('#nm'); el.classList.add('bad'); el.focus(); return LF.toast(t('Bitte tragen Sie einen Namen ein.')); }
        dr.name = dr.name.trim(); commit();
      };
    }
    function renderPeople() {
      const items = itemsOf();
      body.innerHTML = `${items.length ? `<div class="list dcards">${items.map(x => {
        const tel = String(x.phone || '').replace(/[^\d+]/g, '');
        return `<div class="card dcard plain"><div class="spread left"><span class="ico av">${esc(LF.initial(x.name))}</span><span class="m"><b>${esc(x.name || '')}</b><small>${esc([x.rel, x.role].filter(Boolean).join(' · '))}</small></span></div>
          ${x.phone ? `<p class="dnote">${esc(x.phone)}</p>` : ''}${x.note ? `<p class="dnote">${esc(x.note)}</p>` : ''}
          <div class="dacts">${tel ? `<a class="btn primary small" href="tel:${tel}">${ic('phone')}${t('Anrufen')}</a>` : ''}<button type="button" class="btn ghost small" data-edit="${x.id}">${ic('pen')}${t('Bearbeiten')}</button><button type="button" class="btn danger small" data-del="${x.id}" data-name="${esc(x.name || '')}">${ic('trash')}${t('Löschen')}</button></div></div>`;
      }).join('')}</div>` : `<div class="empty">${ic(s.icon)}<p>${t('Noch niemand eingetragen.')}</p></div>`}
        <div class="bottom"><button type="button" class="btn primary" id="add">${ic('plus')}${t('Person hinzufügen')}</button></div>`;
      bindCards();
    }
    function formPeople() {
      const dr = state.draft;
      body.innerHTML = `<div class="card plain dform"><h2>${state.eid ? t('Person bearbeiten') : t('Neue Person')}</h2><div class="stack">
        <label class="field">${t('Name')}<input class="in" id="nm" data-d="name" value="${esc(dr.name || '')}" placeholder="${esc(t('z. B. Anna Muster'))}" autocomplete="off"></label>
        <label class="field">${t('Beziehung')} <span class="opt">${t('freiwillig')}</span><input class="in" data-d="rel" value="${esc(dr.rel || '')}" placeholder="${esc(t('z. B. Tochter'))}" autocomplete="off"></label>
        <label class="field">${t('Rolle')}<select class="in" data-d="role"><option value="">${t('Bitte wählen')}</option>${s.roles.map(o => `<option value="${esc(o)}" ${dr.role === o ? 'selected' : ''}>${esc(t(o))}</option>`).join('')}</select></label>
        <label class="field">${t('Telefon')} <span class="opt">${t('freiwillig')}</span><input class="in" type="tel" data-d="phone" value="${esc(dr.phone || '')}" placeholder="079 123 45 67" autocomplete="off"></label>
        <label class="field">${t('Notiz')} <span class="opt">${t('freiwillig')}</span><textarea class="in" rows="3" data-d="note">${esc(dr.note || '')}</textarea></label></div>${formButtons()}</div>`;
      bindInputs();
      body.querySelector('#ok').onclick = () => {
        if (!(dr.name || '').trim()) { const el = body.querySelector('#nm'); el.classList.add('bad'); el.focus(); return LF.toast(t('Bitte tragen Sie einen Namen ein.')); }
        dr.name = dr.name.trim(); commit();
      };
    }

    ({ doc: renderDoc, form: renderForm, list: renderList, people: renderPeople })[s.kind]();
  }

  LF.routes.dossier = (arg) => {
    flush(); // offene Änderungen der vorherigen Seite sichern
    const id = (arg || '').split('/')[0];
    if (!id) return overview();
    if (!SECTION(id)) return LF.go('dossier');
    edit(id);
  };
})();
