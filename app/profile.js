/* Lifely – Profil: Key für Angehörige, Einstellungen, Konto, Datenschutz */
(() => {
  const LF = window.LF, t = (s, v) => LF.t(s, v), esc = (s) => LF.esc(s);
  const APP_URL = 'https://icham135.github.io/lifely/app/';
  let fresh = null; // frisch erstellter Key (nur bis zum Verlassen der Seite sichtbar)
  let keys = null, keysErr = false;

  // Key in Vierergruppen gut lesbar
  const keyHtml = (k) => String(k).split('-').map((g) => `<span>${esc(g)}</span>`).join('');
  const ago = (ts) => {
    const d = Math.floor((Date.now() - new Date(ts)) / 86400000);
    return d <= 0 ? t('heute') : d === 1 ? t('gestern') : t('vor {x} Tagen', { x: d });
  };
  const shareText = (k) => t('Mit diesem Key sehen Sie mein Lifely-Dossier: {k} – Öffnen Sie {u} und tippen Sie auf «Ich habe einen Key».', { k, u: APP_URL });

  function keyRow(k) {
    const off = !!k.revoked_at;
    const seen = k.last_used_at ? t('zuletzt angesehen {x}', { x: ago(k.last_used_at) }) : t('noch nie angesehen');
    const n = k.uses || 0;
    return `<div class="card plain keyrow${off ? ' off' : ''}">
      <div class="keyhead"><b>${esc(k.label || t('Key'))}</b><span class="chip ${off ? 'due' : 'ok'}">${off ? t('widerrufen') : t('aktiv')}</span></div>
      <small>${t('erstellt am {x}', { x: LF.fmt(k.created_at) })}</small>
      <small>${seen} · ${n === 1 ? t('1 Ansicht') : t('{x} Ansichten', { x: n })}</small>
      ${off ? '' : `<button class="btn ghost small" data-revoke="${esc(k.id)}" data-label="${esc(k.label || '')}">${t('Widerrufen')}</button>`}
    </div>`;
  }

  function freshHtml() {
    if (!fresh) return '';
    return `<div class="card sun keyfresh" role="status">
      <p class="eb">${t('Neuer Key für {x}', { x: esc(fresh.label) })}</p>
      <div class="keybig" aria-label="${esc(fresh.key)}">${keyHtml(fresh.key)}</div>
      <div class="stack"><button class="btn primary" data-copy>${t('Kopieren')}</button><button class="btn ghost" data-share>${t('Senden')}</button></div>
      <p class="note warn">${t('Dieser Key wird nur jetzt angezeigt. Notieren Sie ihn oder senden Sie ihn gleich.')}</p>
      <p class="note">${t('Senden Sie den Key nicht öffentlich, zum Beispiel nicht in einer Gruppe. Am besten persönlich oder per SMS an die Person.')}</p>
    </div>`;
  }

  function listHtml() {
    if (keysErr) return `<p class="note warn">${t('Die Keys konnten nicht geladen werden.')}</p><button class="btn ghost" data-reload>${t('Nochmals versuchen')}</button>`;
    if (!keys) return `<p class="tiny">${t('Wird geladen …')}</p>`;
    if (!keys.length) return `<p class="empty">${t('Noch kein Key erstellt.')}</p>`;
    return keys.map(keyRow).join('');
  }

  async function load(root) {
    try { keys = await LF.keys.list(); keysErr = false; } catch (e) { keysErr = true; }
    const box = root.querySelector('#keylist'); if (box) box.innerHTML = listHtml();
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* Rückfall */ }
    try {
      const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0';
      document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, 99); const ok = document.execCommand('copy'); ta.remove(); return ok;
    } catch (e) { return false; }
  }

  function closeSheet(el) { (el.closest ? el.closest('.backdrop') || el : el).remove(); }

  function nameSheet() {
    const el = LF.sheet(`<h2>${t('Name ändern')}</h2>
      <label class="field">${t('Ihr Name')}<input class="in" id="pname" maxlength="60" autocomplete="name" value="${esc(LF.settings.name || '')}"></label>
      <div class="bottom"><button class="btn primary" data-ok>${t('Speichern')}</button><button class="btn ghost" data-no>${t('Abbrechen')}</button></div>`, (e) => {
      if (e.target.closest('[data-no]')) closeSheet(el);
      if (e.target.closest('[data-ok]')) {
        LF.settings.name = el.querySelector('#pname').value.trim().slice(0, 60); LF.saveSettings(); closeSheet(el); LF.render(); LF.toast(t('Gespeichert'));
      }
    });
  }

  function langSheet() {
    const L = [['de', 'Deutsch'], ['fr', 'Français'], ['it', 'Italiano'], ['en', 'English']];
    const el = LF.sheet(`<h2>${t('Sprache')}</h2><div class="stack">${L.map(([id, n]) => `<button class="choice" role="radio" aria-checked="${LF.settings.lang === id}" data-lang="${id}">${n}</button>`).join('')}</div>
      <div class="bottom"><button class="btn ghost" data-no>${t('Schliessen')}</button></div>`, (e) => {
      if (e.target.closest('[data-no]')) return closeSheet(el);
      const b = e.target.closest('[data-lang]'); if (!b) return;
      LF.settings.lang = b.dataset.lang; LF.saveSettings(); closeSheet(el); LF.render(); LF.toast(t('Gespeichert'));
    });
  }

  async function deleteFlow() {
    if (!(await LF.confirm(t('Konto und alle Daten löschen?'), t('Ihr Dossier, alle Dateien und alle Keys werden gelöscht. Angehörige mit einem Key können Ihr Dossier danach nicht mehr ansehen. Das kann nicht rückgängig gemacht werden.'), t('Weiter')))) return;
    const el = LF.sheet(`<h2>${t('Zur Sicherheit')}</h2><p>${t('Schreiben Sie das Wort löschen (Gross- oder Kleinschreibung ist egal).')}</p>
      <label class="field">${t('Wort eingeben')}<input class="in" id="delw" autocomplete="off" autocapitalize="none"></label>
      <div class="bottom"><button class="btn danger" data-ok disabled>${t('Alles endgültig löschen')}</button><button class="btn ghost" data-no>${t('Abbrechen')}</button></div>`, async (e) => {
      if (e.target.closest('[data-no]')) return closeSheet(el);
      const ok = e.target.closest('[data-ok]'); if (!ok || ok.disabled) return;
      ok.disabled = true; ok.textContent = t('Wird gelöscht …');
      try { await LF.deleteAccount(); closeSheet(el); fresh = null; keys = null; LF.go('login'); LF.toast(t('Ihr Konto und alle Daten wurden gelöscht.')); }
      catch (err) { ok.disabled = false; ok.textContent = t('Alles endgültig löschen'); LF.toast(err.message || t('Das hat leider nicht geklappt.')); }
    });
    const inp = el.querySelector('#delw'), okb = el.querySelector('[data-ok]');
    inp.addEventListener('input', () => { okb.disabled = !['LÖSCHEN', 'LOESCHEN', 'LOSCHEN'].includes(inp.value.trim().toUpperCase()); });
    inp.focus();
  }

  const row = (act, icon, title, sub) => `<button class="row" data-act="${act}"><span class="ico">${LF.svg(icon)}</span><span class="m"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span><span class="chev">${LF.svg('chev')}</span></button>`;

  LF.routes.profile = (arg) => {
    if (arg === 'privacy') return privacy();
    const u = LF.S.user || {}, name = LF.settings.name || '';
    const langName = { de: 'Deutsch', fr: 'Français', it: 'Italiano', en: 'English' }[LF.settings.lang] || 'Deutsch';
    LF.app.innerHTML = `<section class="screen profile">
      <div class="phead"><span class="ico av big">${esc(LF.initial(name || u.email || '?'))}</span><div class="m"><h1>${esc(name || t('Profil'))}</h1><small>${esc(u.email || '')}</small></div></div>

      <h2>${t('Key für Angehörige')}</h2>
      <p class="lead">${t('Mit einem Key (Zugangscode) kann eine Person Ihr Dossier ansehen, aber nichts ändern. Geben Sie ihn nur Menschen, denen Sie vertrauen.')}</p>
      <form class="card plain keyform" id="keyform">
        <label class="field">${t('Für wen ist der Key?')}<input class="in" id="klabel" maxlength="40" placeholder="${t('z. B. Anna')}" autocomplete="off" enterkeyhint="done"></label>
        <button class="btn primary" type="submit">${LF.svg('key')} ${t('Key erstellen')}</button>
      </form>
      <div id="keyfresh">${freshHtml()}</div>
      <h3 class="keyh">${t('Ihre Keys')}</h3>
      <div id="keylist" class="stack">${listHtml()}</div>

      <h2>${t('Schriftgrösse')}</h2>
      ${LF.sizeSeg()}
      <h2>${t('Einstellungen')}</h2>
      <div class="list">
        ${row('lang', 'globe', t('Sprache'), langName)}
        ${row('tour', 'info', t('Rundgang nochmals ansehen'), '')}
        ${row('privacy', 'lock', t('Datenschutz'), t('Auf einen Blick'))}
        ${row('name', 'user', t('Name ändern'), esc(name))}
      </div>
      <div class="bottom">
        <button class="btn ghost" data-act="out">${LF.svg('logout')} ${t('Abmelden')}</button>
        <button class="btn danger" data-act="del">${LF.svg('trash')} ${t('Konto und alle Daten löschen')}</button>
      </div>
      <p class="tiny pfoot">${t('Lifely 2026 · Prototyp einer Projektarbeit der BFH')}</p>
    </section>`;
    const root = LF.app.firstElementChild;
    LF.bindSize(root);
    root.querySelector('#keyform').addEventListener('submit', async (e) => {
      e.preventDefault();
      const inp = root.querySelector('#klabel'), btn = e.target.querySelector('button[type=submit]');
      const label = inp.value.trim();
      if (!label) { fresh = null; root.querySelector('#keyfresh').innerHTML = ''; LF.toast(t('Bitte schreiben Sie, für wen der Key ist.')); inp.focus(); return; }
      btn.disabled = true;
      try {
        const r = await LF.keys.create(label); fresh = { key: r.key, label };
        inp.value = ''; root.querySelector('#keyfresh').innerHTML = freshHtml();
        root.querySelector('.keyfresh').scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        load(root);
      } catch (err) { LF.toast(err.message || t('Der Key konnte nicht erstellt werden.')); }
      btn.disabled = false;
    });
    root.addEventListener('click', async (e) => {
      const rv = e.target.closest('[data-revoke]');
      if (rv) {
        if (await LF.confirm(t('Key widerrufen?'), t('{x} kann Ihr Dossier danach nicht mehr ansehen.', { x: rv.dataset.label || t('Diese Person') }), t('Widerrufen'))) {
          try { await LF.keys.revoke(rv.dataset.revoke); LF.toast(t('Key widerrufen')); await load(root); } catch (err) { LF.toast(err.message || t('Das hat leider nicht geklappt.')); }
        }
        return;
      }
      if (e.target.closest('[data-reload]')) { keys = null; root.querySelector('#keylist').innerHTML = listHtml(); return load(root); }
      if (e.target.closest('[data-copy]') && fresh) { LF.toast((await copy(fresh.key)) ? t('Key kopiert') : t('Kopieren nicht möglich. Bitte notieren Sie den Key.')); return; }
      if (e.target.closest('[data-share]') && fresh) {
        const text = shareText(fresh.key);
        if (navigator.share) { try { await navigator.share({ text }); } catch (err) { /* abgebrochen */ } }
        else location.href = 'sms:?&body=' + encodeURIComponent(text);
        return;
      }
      const a = e.target.closest('[data-act]'); if (!a) return;
      ({ lang: langSheet, name: nameSheet, del: deleteFlow,
        tour: () => LF.tour && LF.tour.start(0),
        privacy: () => LF.go('profile/privacy'),
        out: async () => { try { await LF.auth.signOut(); } catch (err) { /* trotzdem weiter */ } fresh = null; keys = null; LF.go('login'); } })[a.dataset.act]();
    });
    load(root);
  };

  function privacy() {
    const blk = (icon, h, txt) => `<div class="card plain"><div class="ph"><span class="ico">${LF.svg(icon)}</span><h3>${h}</h3></div><p>${txt}</p></div>`;
    LF.app.innerHTML = `<section class="screen">
      <div class="top">${LF.back('profile', t('Profil'))}</div>
      <h1>${t('Datenschutz auf einen Blick')}</h1>
      <p class="lead">${t('Kurz und einfach erklärt, was mit Ihren Angaben geschieht.')}</p>
      ${blk('lock', t('Wo liegen Ihre Daten?'), t('Ihre Daten liegen verschlüsselt auf einem Server in der Schweiz (Zürich).'))}
      ${blk('people', t('Wer sieht sie?'), t('Andere sehen Ihre Daten nur, wenn Sie einen Key weitergeben. Mit einem Key kann eine Person lesen, aber nichts ändern.'))}
      ${blk('info', t('Was geht an die KI?'), t('Wenn Sie die KI (künstliche Intelligenz, ein Computerprogramm, das Fragen beantwortet) um Hilfe bitten, geht nur der Text Ihrer Frage an einen KI-Dienst in den USA (Groq), nie Ihre Dokumente oder Fotos.'))}
      ${blk('check', t('Was wir nie speichern'), t('Passwörter, PINs und Kontonummern. Bitte schreiben Sie diese auch nicht ins Dossier. Notieren Sie stattdessen, wo sie aufbewahrt sind.'))}
      ${blk('user', t('Ihre Rechte'), t('Sie können Ihre Angaben jederzeit ändern, Keys widerrufen und Ihr Konto samt allen Daten löschen.'))}
      <p class="lead"><a class="link" href="../datenschutz.html" target="_blank" rel="noopener">${t('Vollständige Datenschutzerklärung lesen')}</a></p>
      <p class="note sunbg">${t('Das ist ein Prototyp. Bitte tragen Sie nur Testdaten ein.')} ${t('Lifely ist ein Prototyp einer Projektarbeit. Diese Seite ist eine einfache Erklärung und kein Rechtsdokument.')}</p>
      <div class="bottom"><button class="btn ghost" data-go="profile">${t('Zurück zum Profil')}</button></div>
    </section>`;
  }
})();
