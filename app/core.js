/* Lifely – Kern: Hilfsfunktionen, Symbole, Router, Tableiste, Start.
   Rechenlogik (Status/Fortschritt) steht in core-status.js, Server/Daten in core-data.js. */
(() => {
  const LF = window.LF = window.LF || {};
  Object.assign(LF, { routes: {}, ui: LF.ui || {}, auth: LF.auth || {}, keys: LF.keys || {}, ai: LF.ai || {}, dossier: LF.dossier || {}, guide: LF.guide || {}, I18N: LF.I18N || {} });
  LF.S = { user: null, ready: false };
  LF.viewer = null;
  LF.app = document.getElementById('app');

  /* ---------- Einstellungen (Sprache und Schrift gelten auch vor der Anmeldung) ---------- */
  const ls = { get(k) { try { return localStorage.getItem(k); } catch { return null; } } };
  LF.settings = { lang: ls.get('lifely_lang') || 'de', size: ls.get('lifely_size') || 'normal', name: '', setupDone: false, tourDone: false, consented: false };
  const LOCALES = { de: 'de-CH', fr: 'fr-CH', en: 'en-GB', it: 'it-CH' };
  LF.applyLook = () => { document.documentElement.dataset.size = LF.settings.size; document.documentElement.lang = LOCALES[LF.settings.lang] || 'de-CH'; };

  /* ---------- Hilfsfunktionen ---------- */
  LF.t = (s, vars) => {
    let r = (LF.settings.lang !== 'de' && LF.I18N[LF.settings.lang]?.[s]) || s;
    if (vars) r = r.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    return r;
  };
  window.t = LF.t;
  const t = LF.t;
  LF.esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const esc = LF.esc;
  LF.uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  LF.sleep = (ms) => new Promise(r => setTimeout(r, ms));
  LF.debounce = (fn, ms) => { let h; return (...a) => { clearTimeout(h); h = setTimeout(() => fn(...a), ms); }; };
  LF.fmt = (ts) => new Date(ts).toLocaleDateString(LOCALES[LF.settings.lang] || 'de-CH', { day: 'numeric', month: 'long', year: 'numeric' });
  LF.initial = (n) => (String(n || '?').trim()[0] || '?').toUpperCase();

  /* ---------- Symbole (Sprite wird einmal in die Seite gesetzt) ---------- */
  const ICONS = {
    back: '<path d="M15 18l-6-6 6-6"/>', plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>', download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 18v2h16v-2"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 0 1 5.5 5.8"/>',
    sos: '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M12 8v5M12 16.5v.01"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>', shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    bank: '<path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>', home: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
    pen: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>', edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    id: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 16.5a3.5 3.5 0 0 1 7 0M15 10h3M15 14h3"/>',
    dots: '<circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>',
    logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    chev: '<path d="M9 6l6 6-6 6"/>', chevDown: '<path d="M6 9l6 6 6-6"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', contract: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>', phoneDev: '<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M11 18.5h2"/>',
    flower: '<circle cx="12" cy="8" r="3"/><path d="M12 11v10M12 16c-3 0-5-2-5-4 2 0 4 1 5 4zM12 18c3 0 5-2 5-4-2 0-4 1-5 4z"/>',
    paw: '<circle cx="7" cy="10" r="1.8"/><circle cx="17" cy="10" r="1.8"/><circle cx="10" cy="6" r="1.8"/><circle cx="14" cy="6" r="1.8"/><path d="M12 12c-3 0-5 3.5-5 5.5S9 20 12 20s5-.5 5-2.500-2-5.500-5-5.500z"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', note: '<path d="M4 5h16v11H9l-5 4z"/>',
    send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/>', coins: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.700 3.100 3 7 3s7-1.300 7-3V6M5 12v6c0 1.700 3.100 3 7 3s7-1.300 7-3v-6"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>', medical: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>',
    pin: '<path d="M12 21s-7-6.200-7-11.500a7 7 0 0 1 14 0C19 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/>', book: '<path d="M4 5.500A2.500 2.500 0 0 1 6.500 3H20v15H6.500A2.500 2.500 0 0 0 4 20.500z"/><path d="M4 20.500A2.500 2.500 0 0 0 6.500 23H20v-5"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>', chat: '<path d="M4 5h16v11H9l-5 4z"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>', copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h2"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    share: '<circle cx="18" cy="5" r="2.500"/><circle cx="6" cy="12" r="2.500"/><circle cx="18" cy="19" r="2.500"/><path d="M8.200 10.800l7.600-4.400M8.200 13.200l7.600 4.400"/>', pause: '<path d="M8 5v14M16 5v14"/>', play: '<path d="M7 4l13 8-13 8z"/>',
  };
  LF.svg = (name, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${ICONS[name] ? name : 'dots'}"/></svg>`;
  const svg = LF.svg;
  document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${Object.entries(ICONS).map(([n, p]) => `<symbol id="i-${n}" viewBox="0 0 24 24">${p}</symbol>`).join('')}</svg>`);

  /* ---------- Meldung, Dialog ---------- */
  let toastT;
  LF.toast = (msg) => {
    const el = document.getElementById('toast'); if (!el) return;
    el.textContent = msg; el.hidden = false; el.onclick = () => (el.hidden = true);
    clearTimeout(toastT); toastT = setTimeout(() => (el.hidden = true), 5500);
  };
  LF.sheet = (html, onClick) => {
    const el = document.createElement('div'); el.className = 'backdrop';
    el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
    const prev = document.activeElement;
    const key = (e) => { if (!el.isConnected) return document.removeEventListener('keydown', key); if (e.key === 'Escape') el.remove(); };
    document.addEventListener('keydown', key);
    el.addEventListener('click', (e) => { if (e.target === el || e.target.closest('[data-close]')) return el.remove(); onClick?.(e, el); });
    document.body.appendChild(el);
    el.querySelector('input, textarea, button, a')?.focus();
    new MutationObserver((_, o) => { if (!el.isConnected) { o.disconnect(); prev?.focus?.({ preventScroll: true }); } }).observe(document.body, { childList: true });
    return el;
  };
  LF.confirm = (title, text, ok, danger = true) => new Promise(res => {
    let done = false;
    const el = LF.sheet(`<h2>${esc(title)}</h2><p class="lead">${esc(text)}</p><div class="stack"><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(ok)}</button><button class="btn ghost" data-close>${t('Abbrechen')}</button></div>`,
      (e, box) => { if (e.target.closest('[data-ok]')) { done = true; box.remove(); res(true); } });
    new MutationObserver((_, o) => { if (!el.isConnected) { o.disconnect(); if (!done) res(false); } }).observe(document.body, { childList: true });
  });
  LF.back = (to, label) => `<button class="back" data-go="${esc(to)}">${svg('back')}${esc(label)}</button>`;
  LF.sizeSeg = () => `<div class="seg" role="group" aria-label="${esc(t('Schriftgrösse'))}">${[['normal', 'Normal'], ['gross', 'Gross'], ['sehr-gross', 'Sehr gross']].map(([v, l]) => `<button type="button" data-size="${v}" aria-pressed="${LF.settings.size === v}">${t(l)}</button>`).join('')}</div>`;
  LF.bindSize = (root) => root.querySelectorAll('[data-size]').forEach(b => b.onclick = () => {
    LF.settings.size = b.dataset.size; LF.applyLook(); LF.saveSettings?.();
    root.querySelectorAll('[data-size]').forEach(x => x.setAttribute('aria-pressed', x === b));
  });

  /* ---------- Router ---------- */
  const TABS = [['guide', 'spark', 'Geführte Vorsorge'], ['dossier', 'folder', 'Mein Dossier'], ['profile', 'user', 'Profil']];
  LF.go = (p) => { if (location.hash.slice(1) === p) LF.render(); else location.hash = p; };
  function gate(name, arg) { // entscheidet, was gezeigt wird (angemeldet? eingerichtet? Ansicht mit Key?)
    if (LF.viewer) return ['view'];
    if (!LF.S.user) { if (name === 'key' || name === 'language') return [name]; return [ls.get('lifely_lang') ? 'login' : 'language']; }
    if (!LF.S.ready) return ['loading'];
    if (!LF.settings.setupDone) { // Einrichten nur der Reihe nach: ohne Zustimmung immer Schritt 1, ungültige Schritte → 1
      const n = Number(arg);
      return ['setup', name === 'setup' && LF.settings.consented && n >= 1 && n <= 3 ? String(n) : '1'];
    }
    if (!LF.routes[name] || ['setup', 'login', 'key', 'language', 'loading', 'view'].includes(name)) return ['guide'];
    return [name, arg];
  }
  function renderTabs(active) {
    let bar = document.getElementById('tabbar');
    document.body.classList.toggle('has-tabs', !!active);
    if (!active) return bar?.remove();
    if (!bar) { bar = document.createElement('nav'); bar.id = 'tabbar'; document.body.appendChild(bar); }
    bar.setAttribute('aria-label', t('Hauptnavigation'));
    bar.innerHTML = TABS.map(([id, icon, label]) => `<button data-go="${id}" data-tab="${id}" ${active === id ? 'aria-current="page"' : ''}>${svg(icon)}<span>${t(label)}</span></button>`).join('');
  }
  LF.render = () => {
    const parts = location.hash.slice(1).split('/');
    const [name, arg] = gate(decodeURIComponent(parts[0] || ''), parts.slice(1).join('/') || undefined);
    const want = name + (arg ? '/' + arg : '');
    if (location.hash.slice(1) !== want) history.replaceState(null, '', '#' + want);
    document.body.classList.remove('no-tabs');
    renderTabs(['guide', 'dossier', 'profile'].includes(name) ? name : null);
    const fn = LF.routes[name];
    try {
      if (fn) fn(arg ? decodeURIComponent(arg) : undefined);
      else LF.app.innerHTML = `<section class="screen"><div class="boot"><img src="icons/logo.svg" alt=""><p>${t('Einen Moment bitte …')}</p></div></section>`;
    } catch (e) {
      console.error(e);
      LF.app.innerHTML = `<section class="screen"><h1>${t('Hoppla')}</h1><p class="lead">${t('Das hat nicht geklappt. Bitte laden Sie die Seite neu.')}</p><button class="btn primary" onclick="location.reload()">${t('Neu laden')}</button></section>`;
    }
    window.scrollTo(0, 0);
    const h = LF.app.querySelector('h1'); if (h && !LF.app.contains(document.activeElement)) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  };
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]');
    if (g) { e.preventDefault(); LF.go(g.dataset.go); }
  });

  /* ---------- Start ---------- */
  LF.boot = async () => {
    LF.applyLook();
    // Alte App-Version (Service Worker) entfernen, damit nichts Veraltetes aus dem Zwischenspeicher kommt
    try { navigator.serviceWorker?.getRegistrations().then(rs => rs.forEach(r => r.unregister())); window.caches?.keys().then(ks => ks.forEach(k => caches.delete(k))); } catch {}
    addEventListener('hashchange', LF.render);
    LF.app.innerHTML = `<section class="screen"><div class="boot"><img src="icons/logo.svg" alt="Lifely"></div></section>`;
    try {
      if (!LF.data) throw new Error('Datenschicht fehlt');
      await LF.data.init();
      LF.data.onChange(() => LF.render());
    } catch (e) {
      console.error(e);
      LF.app.innerHTML = `<section class="screen"><div class="boot"><img src="icons/logo.svg" alt=""><h1>${t('Keine Verbindung')}</h1><p class="lead">${t('Bitte prüfen Sie das Internet und versuchen Sie es nochmals.')}</p><button class="btn primary" onclick="location.reload()">${t('Neu laden')}</button></div></section>`;
      return;
    }
    LF.render();
  };
})();
