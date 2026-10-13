/* Lifely – Prototyp eines digitalen Vorsorgeordners für ältere Menschen.
   Alle Daten bleiben lokal im Browser (localStorage + IndexedDB). Die Anmeldung ist simuliert. */

const $app = document.getElementById('app');

/* ---------- Icons ---------- */
const ic = {
  back: '<path d="M15 18l-6-6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 0 1 5.5 5.8"/>',
  sos: '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M12 8v5M12 16.5v.01"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  bank: '<path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',
  home: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  pen: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  id: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 16.5a3.5 3.5 0 0 1 7 0M15 10h3M15 14h3"/>',
  dots: '<circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>',
  logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  chevDown: '<path d="M6 9l6 6 6-6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  gift: '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13M12 8S10.5 3 8 4s-1 4 4 4c5 0 6.5-3 4-4s-4 4-4 4"/>',
  phoneDevice: '<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M11 18.5h2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  contract: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  flower: '<circle cx="12" cy="8" r="3"/><path d="M12 11v10M12 16c-3 0-5-2-5-4 2 0 4 1 5 4zM12 18c3 0 5-2 5-4-2 0-4 1-5 4z"/><path d="M9 6.5a3 3 0 0 1 6 0"/>',
  paw: '<circle cx="7" cy="10" r="1.8"/><circle cx="17" cy="10" r="1.8"/><circle cx="10" cy="6" r="1.8"/><circle cx="14" cy="6" r="1.8"/><path d="M12 12c-3 0-5 3.5-5 5.5S9 20 12 20s5-.5 5-2.5-2-5.5-5-5.5z"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  note: '<path d="M4 5h16v11H9l-5 4z"/>',
  send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/>',
  coins: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  medical: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>',
};
const svg = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ic[name]}</svg>`;
const googleG = `<svg class="google-g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.9 6.2C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-16.7z"/><path fill="#FBBC05" d="M10.6 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.2A24 24 0 0 0 0 24c0 3.9.9 7.5 2.7 10.8z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.2-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>`;

/* ---------- Kategorien ---------- */
const CATEGORIES = [
  { id: 'versicherung', name: 'Versicherungen', hint: 'Policen, Krankenkasse', icon: 'shield', color: '#2f6fb0', bg: '#e3edf8', review: 12 },
  { id: 'ahv', name: 'AHV & Pensionskasse', hint: 'Rentenbescheid, Vorsorgeausweis PK', icon: 'coins', color: '#8a6a12', bg: '#f8efd6' },
  { id: 'steuern', name: 'Steuern', hint: 'Steuererklärung, Veranlagung', icon: 'receipt', color: '#56625f', bg: '#ecebe7' },
  { id: 'wohnen', name: 'Miete & Grundbuch', hint: 'Mietvertrag, Grundbuchauszug', icon: 'home', color: '#5d7a2c', bg: '#eaf2dc' },
  { id: 'gesundheit', name: 'Arzt & Gesundheit', hint: 'Arztberichte, Medikamente', icon: 'heart', color: '#e2573f', bg: '#fbe7e2' },
  { id: 'patvf', name: 'Patientenverfügung', hint: 'Medizinische Wünsche', icon: 'medical', color: '#b1406b', bg: '#f8e4ec', review: 12 },
  { id: 'vorsorge', name: 'Vollmachten & Testament', hint: 'Vorsorgeauftrag, Testament', icon: 'pen', color: '#6d4aa8', bg: '#eee7f8', review: 24 },
  { id: 'sonstiges', name: 'Sonstiges', hint: 'Alles andere', icon: 'dots', color: '#1f625b', bg: '#e3efed' },
];
const cat = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES.at(-1);

/* ---------- Hilfsfunktionen ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem('lifely_' + key)) ?? fallback; } catch { return fallback; } },
  set(key, val) { try { localStorage.setItem('lifely_' + key, JSON.stringify(val)); } catch {} },
  del(key) { try { localStorage.removeItem('lifely_' + key); } catch {} },
};
const fmtDate = (ts) => new Date(ts).toLocaleDateString(LOCALE(), { day: 'numeric', month: 'long', year: 'numeric' });
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (el.hidden = true), 2800);
}
function applySize() { document.documentElement.dataset.size = store.get('size', 'normal'); }

/* ---------- Dokumente in IndexedDB ---------- */
const db = {
  _db: null,
  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((res, rej) => {
      const req = indexedDB.open('lifely', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('docs', { keyPath: 'id' });
      req.onsuccess = () => res(this._db = req.result);
      req.onerror = () => rej(req.error);
    });
  },
  async tx(mode, fn) {
    const d = await this.open();
    return new Promise((res, rej) => {
      const t = d.transaction('docs', mode);
      const r = fn(t.objectStore('docs'));
      t.oncomplete = () => res(r?.result);
      t.onerror = () => rej(t.error);
    });
  },
  all() { return this.tx('readonly', s => s.getAll()).then(list => (list || []).sort((a, b) => b.created - a.created)); },
  get(id) { return this.tx('readonly', s => s.get(id)); },
  put(doc) { return this.tx('readwrite', s => s.put(doc)); },
  remove(id) { return this.tx('readwrite', s => s.delete(id)); },
  clear() { return this.tx('readwrite', s => s.clear()); },
};

// Fotos verkleinern, damit der Speicher im Browser reicht
function compressImage(file, max = 1600) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(b => resolve(b || file), 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

const urls = new Set();
function blobUrl(blob) { const u = URL.createObjectURL(blob); urls.add(u); return u; }
function releaseUrls() { urls.forEach(u => URL.revokeObjectURL(u)); urls.clear(); }



/* ---------- Navigation ---------- */
const state = { draft: null, filter: 'alle', chat: [], guideTab: 'chat' };
const routes = {};
const PRE_AUTH = ['language', 'intro', 'login', 'code'];
const NO_TABS = ['language', 'intro', 'login', 'code', 'privacy', 'onboarding', 'add', 'add2'];
const TAB_OF = {
  home: 'home', docs: 'docs', doc: 'docs', assistant: 'assistant',
  vorsorge: 'vorsorge', section: 'vorsorge', contacts: 'vorsorge', reminders: 'vorsorge', emergency: 'vorsorge',
  profile: 'profile', help: 'profile', privacyInfo: 'profile',
};
function go(name, params = {}) {
  releaseUrls();
  const user = store.get('user', null);
  if (!store.get('lang', null) && name !== 'language') name = 'language';
  else if (!store.get('intro_seen', false) && !user && name !== 'language') name = 'intro';
  else if (!user && !PRE_AUTH.includes(name)) name = 'login';
  else if (user && !user.consented && name !== 'privacy') name = 'privacy';
  else if (user && user.consented && !user.onboarded && name !== 'onboarding') name = 'onboarding';
  if (['home', 'docs', 'vorsorge', 'assistant', 'profile'].includes(name)) state.lastMain = name;
  history.replaceState(null, '', '#' + name);
  const showTabs = !NO_TABS.includes(name);
  document.body.classList.toggle('has-tabs', showTabs);
  renderTabbar(showTabs ? TAB_OF[name] : null);
  routes[name](params);
  window.scrollTo(0, 0);
  const h = $app.querySelector('h1'); if (h && !$app.contains(document.activeElement)) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
}
function renderTabbar(active) {
  let bar = document.getElementById('tabbar');
  if (!active) { bar?.remove(); return; }
  if (!bar) {
    bar = document.createElement('nav');
    bar.id = 'tabbar'; bar.className = 'tabbar';
    document.body.appendChild(bar);
    bar.addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) go(b.dataset.tab); });
  }
  bar.setAttribute('aria-label', t('Hauptnavigation'));
  const tab = (id, icon, label) => `<button class="tab" data-tab="${id}" ${active === id ? 'aria-current="page"' : ''}>${svg(icon)}<span>${label}</span></button>`;
  bar.innerHTML = `${tab('home', 'home', t('Start'))}${tab('docs', 'folder', t('Dokumente'))}
    <button class="tab ai" data-tab="assistant" ${active === 'assistant' ? 'aria-current="page"' : ''}><span class="orb">${svg('spark')}</span><span>${t('Assistent')}</span></button>
    ${tab('vorsorge', 'list', t('Vorsorge'))}${tab('profile', 'user', t('Profil'))}`;
}
const topbar = (backTo = 'home', label = t('Zurück')) => `
  <header class="topbar">
    <button class="back" data-go="${backTo}">${svg('back')}${label}</button>
    <div class="wordmark"><img src="icons/logo.svg" alt="">Lifely</div>
  </header>`;
$app.addEventListener('click', (e) => {
  const b = e.target.closest('[data-go]');
  if (b) go(b.dataset.go, b.dataset.id ? { id: b.dataset.id } : {});
});
const initials = (name) => (name || '?').split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();
const catName = (c) => t(c.name);
const plural = (n, one, many) => n === 1 ? t(one) : t(many, { n });

function confirmSheet({ title, text, ok, danger = true }) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'sheet-backdrop';
    el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="cs-t">
      <h2 id="cs-t">${esc(title)}</h2><p class="lead">${esc(text)}</p>
      <div class="stack"><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-r="1">${esc(ok)}</button>
      <button class="btn btn-outline" data-r="0">${t('Abbrechen')}</button></div></div>`;
    el.addEventListener('click', (e) => {
      const r = e.target.closest('[data-r]');
      if (r || e.target === el) { el.remove(); resolve(r?.dataset.r === '1'); }
    });
    document.body.appendChild(el);
    el.querySelector('[data-r="0"]').focus();
  });
}

/* ---------- Splash ---------- */
function splash() {
  const el = document.createElement('div');
  el.className = 'splash';
  el.innerHTML = `<img src="icons/logo.svg" alt=""><h1>Lifely</h1><p>${t('Ihr digitaler Vorsorgeordner')}</p><div class="dots"><span></span><span></span><span></span></div>`;
  document.body.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 500); }, 2200);
}

/* ---------- Sprache wählen ---------- */
routes.language = ({ from } = {}) => {
  const cur = store.get('lang', null);
  $app.innerHTML = `<section class="screen auth">
    ${from ? topbar(from) : `<div class="login-hero" style="padding-bottom:0"><img src="icons/logo.svg" alt="Lifely"></div>`}
    <h1 class="${from ? '' : 'center'}">Sprache · Langue · Language · Lingua</h1>
    <p class="lead ${from ? '' : 'center'}">Bitte wählen · Veuillez choisir · Please choose · Si prega di scegliere</p>
    <div class="stack" role="radiogroup">
      ${LANGS.map(l => `<button class="choice lang" role="radio" data-lang="${l.id}" aria-checked="${cur === l.id}" lang="${l.id}"><span class="lang-code">${l.id.toUpperCase()}</span>${l.name}</button>`).join('')}
    </div>
  </section>`;
  $app.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => {
    if (b.dataset.lang !== lang()) state.chat = []; // Chatverlauf gehört zur alten Sprache
    setLang(b.dataset.lang);
    if (from) { toast(t('Sprache geändert')); go(from); } else go('intro');
  });
};

/* ---------- Einführung (3 Folien) ---------- */
const catDot = (id) => { const c = cat(id); return `<span class="ph-dot" style="background:${c.bg};color:${c.color}">${svg(c.icon)}</span>`; };
const INTRO = () => [
  {
    title: t('Alle wichtigen Unterlagen an einem Ort'),
    text: t('Fotografieren Sie Policen, Verträge und Vollmachten – Lifely ordnet sie für Sie.'),
    phone: `<div class="ph-card">${catDot('versicherung')}<span>${t('Krankenkasse Police')}<small>${t('Versicherungen')}</small></span></div>
      <div class="ph-card">${catDot('patvf')}<span>${t('Patientenverfügung')}<small>${t('Geprüft 2026')}</small></span></div>
      <div class="ph-card">${catDot('wohnen')}<span>${t('Mietvertrag')}<small>${t('Miete & Grundbuch')}</small></span></div>`,
  },
  {
    title: t('Ihr persönlicher Assistent'),
    text: t('Fragen Sie jederzeit – zu Patientenverfügung, Testament oder was im Ernstfall zu tun ist.'),
    phone: `<div class="ph-bubble me">${t('Was gehört in eine Patientenverfügung?')}</div>
      <div class="ph-bubble bot">${t('Sie legen fest, welche Behandlungen Sie wünschen. Wichtig: schriftlich, mit Datum und Unterschrift.')}</div>`,
  },
  {
    title: t('Im Notfall ist alles bereit'),
    text: t('Ihre Vertrauensperson findet sofort, was sie braucht. Und alles bleibt auf Ihrem Gerät.'),
    phone: `<div class="ph-shield">${svg('shield')}</div>
      <div class="ph-card"><span class="ph-dot" style="background:#fbeec2;color:#7a5a06">${svg('people')}</span><span>${t('Tochter Anna')}<small>${t('Notfallzugang aktiv')}</small></span></div>`,
  },
];
routes.intro = ({ slide = 0 } = {}) => {
  const slides = INTRO();
  const s = slides[slide];
  const last = slide === slides.length - 1;
  $app.innerHTML = `<section class="intro screen">
    <div class="intro-brand"><span>${slide === 0 ? `<button class="btn-link skip" id="lang-back">${svg('back')}</button>` : ''}</span><div class="wordmark"><img src="icons/logo.svg" alt="">Lifely</div>
      <span>${!last ? `<button class="btn-link skip" id="skip">${t('Überspringen')}</button>` : ''}</span></div>
    <div class="pager" aria-hidden="true">${slides.map((_, i) => `<span class="${i === slide ? 'on' : ''}"></span>`).join('')}</div>
    <div class="illu" aria-hidden="true">
      <span class="float" style="left:9%;top:16%;width:22px;height:12px;background:#9fd6cb;transform:rotate(-24deg)"></span>
      <span class="float" style="right:10%;top:26%;width:26px;height:12px;background:#f3c7bb;transform:rotate(28deg)"></span>
      <span class="float" style="left:14%;bottom:18%;width:12px;height:12px;border-radius:50%;background:#fff"></span>
      <div class="phone">${s.phone}</div>
    </div>
    <h1>${s.title}</h1>
    <p class="lead">${s.text}</p>
    <div class="spacer"></div>
    <div class="bottom-actions">
      <button class="btn btn-primary" id="next">${last ? t("Los geht's") : t('Weiter')}</button>
      <p class="fine center" style="margin:0">${svg('lock').replace('<svg', '<svg style="width:14px;height:14px;vertical-align:-2px"')} ${t('Kostenlos · ohne Werbung · Daten bleiben auf Ihrem Gerät')}</p>
    </div>
  </section>`;
  const done = () => { store.set('intro_seen', true); go('login'); };
  $app.querySelector('#next').onclick = () => last ? done() : go('intro', { slide: slide + 1 });
  $app.querySelector('#skip')?.addEventListener('click', done);
  const lb = $app.querySelector('#lang-back');
  if (lb) { lb.setAttribute('aria-label', t('Sprache ändern')); lb.onclick = () => { store.del('lang'); go('language'); }; }
};

/* ---------- Anmeldung ---------- */
const DEMO_EMAIL = 'test@lifely.ch';
const DEMO_CODE = '123456';
routes.login = () => {
  $app.innerHTML = `<section class="screen auth">
    <div class="login-hero"><img src="icons/logo.svg" alt="Lifely Logo">
      <h1>${t('Willkommen bei Lifely')}</h1>
      <p class="lead">${t('Melden Sie sich an, um Ihren Vorsorgeordner einzurichten.')}</p></div>
    <div class="stack">
      <button class="btn btn-outline" id="google">${googleG} ${t('Mit Google anmelden')}</button>
      <div class="divider">${t('oder mit E-Mail')}</div>
      <form id="mail-form" class="stack" novalidate>
        <label class="field">${t('Ihre E-Mail-Adresse')}
          <input class="input" id="mail" type="email" inputmode="email" autocomplete="email" placeholder="name@beispiel.ch" required></label>
        <button class="btn btn-primary" type="submit">${t('Code per E-Mail erhalten')}</button>
      </form>
    </div>
    <p class="fine center">${t('Prototyp für ein Studienprojekt der BFH. Bitte nur Testdokumente verwenden.')}</p>
  </section>`;
  $app.querySelector('#mail-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const mail = $app.querySelector('#mail').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return toast(t('Bitte geben Sie eine gültige E-Mail-Adresse ein.'));
    // Testkonto für Nutzertests: fester Code
    const code = mail.toLowerCase() === DEMO_EMAIL ? DEMO_CODE : String(Math.floor(100000 + Math.random() * 900000));
    state.pending = { email: mail, code };
    go('code');
  });
  $app.querySelector('#google').addEventListener('click', googleChooser);
};

function googleChooser() {
  const el = document.createElement('div');
  el.className = 'sheet-backdrop';
  el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="g-t">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">${googleG}<span style="color:var(--muted)">${t('Anmelden mit Google')}</span></div>
    <h2 id="g-t">${t('Konto auswählen')}</h2>
    <p class="lead">${t('um mit Lifely fortzufahren')}</p>
    <button class="account" data-acc="1"><span class="avatar">MK</span><span><strong>Margrit Keller</strong><br><small style="color:var(--muted)">margrit.keller@gmail.com</small></span></button>
    <button class="btn btn-outline" data-close>${t('Abbrechen')}</button>
    <p class="fine">${t('Simulation: Im Prototyp wird kein echtes Google-Konto verwendet.')}</p></div>`;
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-acc]')) {
      el.remove();
      toast(t('Angemeldet mit Google'));
      startAccount({ name: 'Margrit', email: 'margrit.keller@gmail.com', via: 'Google' });
    } else if (e.target.closest('[data-close]') || e.target === el) el.remove();
  });
  document.body.appendChild(el);
  el.querySelector('[data-acc]').focus();
}

routes.code = () => {
  if (!state.pending) return go('login');
  const { email, code } = state.pending;
  $app.innerHTML = `<section class="screen auth">
    ${topbar('login')}
    <h1>${t('Code eingeben')}</h1>
    <p class="lead">${t('Wir haben einen 6-stelligen Code an {email} gesendet.', { email: `<strong>${esc(email)}</strong>` })}</p>
    <div class="demo-note">${t('Demo-Modus – Ihr Code lautet:')} <b>${code}</b></div>
    <form id="code-form" class="stack" novalidate>
      <div class="code-boxes" role="group" aria-label="${t('Bestätigungscode')}">
        ${Array.from({ length: 6 }, (_, i) => `<input inputmode="numeric" autocomplete="${i ? 'off' : 'one-time-code'}" aria-label="${t('Ziffer {n}', { n: i + 1 })}">`).join('')}
      </div>
      <button class="btn btn-primary" type="submit">${t('Bestätigen')}</button>
      <button class="btn-link" type="button" id="resend">${t('Code erneut senden')}</button>
    </form></section>`;
  const boxes = [...$app.querySelectorAll('.code-boxes input')];
  boxes[0].focus();
  boxes.forEach((b, i) => {
    b.addEventListener('input', () => {
      const digits = b.value.replace(/\D/g, '');
      if (digits.length > 1) { // eingefügter Code
        digits.slice(0, 6 - i).split('').forEach((d, j) => (boxes[i + j].value = d));
        boxes[Math.min(i + digits.length, 6) - 1].focus(); return;
      }
      b.value = digits;
      if (digits && boxes[i + 1]) boxes[i + 1].focus();
    });
    b.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !b.value && boxes[i - 1]) boxes[i - 1].focus(); });
  });
  $app.querySelector('#resend').addEventListener('click', () => {
    if (state.pending.email.toLowerCase() !== DEMO_EMAIL) state.pending.code = String(Math.floor(100000 + Math.random() * 900000));
    toast(t('Neuer Code gesendet')); go('code');
  });
  $app.querySelector('#code-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const entered = boxes.map(b => b.value).join('');
    if (entered !== state.pending.code) { toast(t('Der Code stimmt nicht. Bitte nochmals versuchen.')); boxes.forEach(b => (b.value = '')); boxes[0].focus(); return; }
    const { email } = state.pending;
    state.pending = null;
    startAccount({ name: '', email, via: 'E-Mail' });
  });
};

function startAccount(user) {
  store.set('user', { ...user, consented: false, onboarded: false, profile: {}, created: Date.now() });
  store.set('ob_step', 0);
  go('privacy');
}

/* ---------- Datenschutz ---------- */
const PRIVACY = () => [
  { icon: 'phoneDevice', t: t('Alles bleibt auf Ihrem Gerät'), p: t('Ihre Dokumente, Fotos und Angaben werden nur in diesem Browser auf Ihrem Gerät gespeichert. Lifely hat keine Cloud und keinen eigenen Server – niemand sonst kann Ihre Unterlagen sehen.') },
  { icon: 'gift', t: t('Kostenlos und ohne Werbung'), p: t('Lifely ist gratis. Es gibt keine Abos, keine Premium-Funktionen, keine Werbung und kein Tracking.') },
  { icon: 'spark', t: t('So arbeitet der Assistent'), p: t('Wenn Sie dem Assistenten eine Frage stellen, wird nur der Text dieser Frage an einen KI-Dienst (Google Gemini) gesendet – nie Ihre Dokumente oder Angaben. Bitte schreiben Sie keine Namen, Adressen oder Kontonummern in Ihre Fragen.') },
  { icon: 'lock', t: t('Keine Passwörter'), p: t('Lifely fragt nie nach Passwörtern, PIN-Codes oder Zugangsdaten. Tragen Sie nur ein, wo Sie Konten haben – nicht, wie man hineinkommt.') },
  { icon: 'trash', t: t('Sie haben die Kontrolle'), p: t('Unter «Profil» können Sie jederzeit alle Daten mit einem Klick löschen.') },
  { icon: 'info', t: t('Studienprojekt'), p: t('Lifely ist ein Prototyp der BFH (Modul EBDS). Verwenden Sie bitte nur Testdokumente.') },
];
const privacyBadges = () => `<div class="privacy-badges"><span class="badge">${svg('check')} ${t('Nur auf dem Gerät')}</span><span class="badge">${svg('check')} ${t('Keine Cloud')}</span><span class="badge">${svg('check')} ${t('Kostenlos')}</span></div>`;
const privacyList = (openFirst) => PRIVACY().map((x, i) => `<details class="acc" ${openFirst && i === 0 ? 'open' : ''}>
    <summary><span class="ic">${svg(x.icon)}</span><span>${x.t}</span><span class="chev">${svg('chevDown')}</span></summary>
    <p>${x.p}</p></details>`).join('');
routes.privacy = () => {
  $app.innerHTML = `<section class="screen auth">
    <h1>${t('Ihre Daten gehören Ihnen')}</h1>
    <p class="lead">${t('Bitte lesen Sie kurz, wie Lifely mit Ihren Daten umgeht.')}</p>
    ${privacyBadges()}
    ${privacyList(true)}
    <div class="bottom-actions"><button class="btn btn-primary" id="agree">${t('Zustimmen & weiter')}</button></div>
  </section>`;
  $app.querySelector('#agree').onclick = () => { saveProfile({ consented: true }); go('onboarding'); };
};
routes.privacyInfo = () => {
  $app.innerHTML = `<section class="screen">
    ${topbar('profile')}
    <h1>${t('Datenschutz')}</h1>
    ${privacyBadges()}
    ${privacyList(false)}
  </section>`;
};

/* ---------- Erste Schritte (Fragen) ---------- */
// Gespeichert wird immer der deutsche Wert, angezeigt die Übersetzung.
// Altersgruppen wie in der Studie «Digital Seniors 2025» (Pro Senectute)
const AGE_GROUPS = ['unter 65', '65 bis 74', '75 bis 84', '85 und älter'];
const STORAGE_OPTIONS = ['In einem Ordner zu Hause', 'Verteilt an verschiedenen Orten', 'Teilweise auf dem Computer', 'Das weiss ich nicht genau'];
const RELATIONS = ['Tochter', 'Sohn', 'Ehepartner/in', 'Enkelkind', 'Freund/in', 'Andere'];
const relationSelect = (id, name) => `<select class="input" id="${id}" ${name ? `name="${name}"` : ''}>${RELATIONS.map(r => `<option value="${r}">${t(r)}</option>`).join('')}</select>`;
const OB_STEPS = ['intro', 'name', 'age', 'storage', 'priorities', 'helper', 'size', 'notify', 'done'];
const QUESTION_COUNT = OB_STEPS.length - 2;
function saveProfile(patch) {
  const u = store.get('user');
  store.set('user', { ...u, ...patch, profile: { ...u.profile, ...(patch.profile || {}) } });
}
const sizeSegment = (size) => {
  const opt = (v, l) => `<button data-size="${v}" aria-pressed="${size === v}">${t(l)}</button>`;
  return `<div class="segmented" role="group" aria-label="${t('Schriftgrösse')}">${opt('normal', 'Normal')}${opt('gross', 'Gross')}${opt('sehr-gross', 'Sehr gross')}</div>`;
};

routes.onboarding = ({ step = store.get('ob_step', 0) } = {}) => {
  step = Math.max(0, Math.min(+step, OB_STEPS.length - 1));
  store.set('ob_step', step);
  const user = store.get('user');
  const p = user.profile || {};
  const kind = OB_STEPS[step];
  const next = () => go('onboarding', { step: step + 1 });
  const inQuestions = step > 0 && kind !== 'done';
  const head = inQuestions ? `<header class="topbar"><button class="back" id="ob-back">${svg('back')}${t('Zurück')}</button><button class="btn-link" id="ob-skip">${t('Überspringen')}</button></header>
    <div class="steps" aria-hidden="true">${Array.from({ length: QUESTION_COUNT }, (_, i) => `<span class="${i < step ? 'on' : ''}"></span>`).join('')}</div>
    <p class="step-label">${t('Schritt {a} von {b}', { a: step, b: QUESTION_COUNT })}</p>` : '';
  const choice = (list, current, attr) => `<div class="stack" role="radiogroup">${list.map(v =>
    `<button class="choice" role="radio" data-${attr}="${esc(v)}" aria-checked="${current === v}">${esc(t(v))}</button>`).join('')}</div>`;
  const nextBtn = (label = t('Weiter')) => `<div class="bottom-actions"><button class="btn btn-primary" id="ob-next">${label}</button></div>`;
  const hello = user.name ? ', ' + esc(user.name) : '';

  let body = '';
  if (kind === 'intro') body = `
    <div class="login-hero"><img src="icons/logo.svg" alt="">
      <h1>${t('Schön, dass Sie da sind{name}!', { name: hello })}</h1>
      <p class="lead">${t('Wir stellen Ihnen ein paar kurze Fragen, damit Lifely zu Ihnen passt. Das dauert etwa eine Minute.')}</p></div>
    <div class="info">${svg('shield')}<span>${t('Sie können jede Frage überspringen. Ihre Antworten bleiben auf diesem Gerät.')}</span></div>
    ${nextBtn(t("Los geht's"))}`;
  if (kind === 'name') body = `
    <h1>${t('Wie dürfen wir Sie ansprechen?')}</h1><p class="lead">${t('Ihr Vorname genügt.')}</p>
    <form id="ob-form" class="stack"><label class="field">${t('Vorname')}
      <input class="input" id="ob-name" autocomplete="given-name" placeholder="${t('z. B. Hans')}" value="${esc(user.name || '')}"></label>
      <div class="bottom-actions"><button class="btn btn-primary" type="submit">${t('Weiter')}</button></div></form>`;
  if (kind === 'age') body = `<h1>${t('Wie alt sind Sie?')}</h1><p class="lead">${t('So können wir die Bedienung besser auf Sie abstimmen.')}</p>${choice(AGE_GROUPS, p.age, 'age')}`;
  if (kind === 'storage') body = `<h1>${t('Wo bewahren Sie Ihre wichtigen Unterlagen heute auf?')}</h1><p class="lead">${t('Zum Beispiel Policen, Bankunterlagen oder Vollmachten.')}</p>${choice(STORAGE_OPTIONS, p.storage, 'storage')}`;
  if (kind === 'priorities') body = `
    <h1>${t('Was möchten Sie zuerst ordnen?')}</h1><p class="lead">${t('Sie können mehrere Bereiche wählen.')}</p>
    <div class="stack" role="group" aria-label="${t('Bereiche')}">
      ${CATEGORIES.filter(c => c.id !== 'sonstiges').map(c => `<button class="choice multi" data-prio="${c.id}" aria-pressed="${(p.priorities || []).includes(c.id)}">${catName(c)}</button>`).join('')}
    </div>${nextBtn()}`;
  if (kind === 'helper') body = `
    <h1>${t('Wer soll im Notfall Ihre Unterlagen finden?')}</h1><p class="lead">${t('Zum Beispiel Ihre Tochter, Ihr Sohn oder eine gute Freundin.')}</p>
    <form id="ob-form" class="stack">
      <label class="field">${t('Name')}<input class="input" id="ob-hname" placeholder="${t('z. B. Thomas Keller')}"></label>
      <label class="field">${t('Beziehung')}${relationSelect('ob-hrel')}</label>
      <label class="field">${t('E-Mail oder Telefon')}<input class="input" id="ob-hcontact" placeholder="${t('z. B. 079 123 45 67')}"></label>
      <div class="bottom-actions"><button class="btn btn-primary" type="submit">${t('Weiter')}</button></div>
    </form>`;
  if (kind === 'size') body = `<h1>${t('Wie gut können Sie diesen Text lesen?')}</h1><p class="lead">${t('Wählen Sie die Schriftgrösse, die für Sie angenehm ist.')}</p>${sizeSegment(store.get('size', 'normal'))}${nextBtn()}`;
  if (kind === 'notify') body = `
    <div class="illu" aria-hidden="true" style="height:260px;margin-top:8px"><div class="phone" style="height:80%">
      <div class="ph-card"><span class="ph-dot" style="background:#fdebe6;color:#e2573f">${svg('bell')}</span><span>Lifely<small>${t('Bitte Patientenverfügung prüfen')}</small></span></div>
    </div></div>
    <h1 class="center" style="margin-top:22px">${t('Erinnerungen aktivieren')}</h1>
    <p class="lead center">${t('Lifely erinnert Sie, wenn z. B. Ihre Patientenverfügung wieder geprüft werden sollte.')}</p>
    <div class="bottom-actions"><button class="btn btn-soft" id="ob-skip2">${t('Vielleicht später')}</button><button class="btn btn-primary" id="ob-notify">${t('Aktivieren')}</button></div>`;
  if (kind === 'done') {
    const prios = (p.priorities || []).map(id => catName(cat(id)));
    const people = store.get('contacts', []);
    const row = (label, value) => `<div class="sum-row"><span>${label}</span><strong>${value ? esc(value) : `<em>${t('übersprungen')}</em>`}</strong></div>`;
    body = `<div class="done-mark"><span>${svg('check')}</span></div>
      <h1 class="center" style="margin-top:20px">${t('Alles bereit{name}!', { name: hello })}</h1>
      <p class="lead center">${t('Lifely ist jetzt für Sie eingerichtet.')}</p>
      <div class="card sum">${row(t('Alter'), p.age && t(p.age))}${row(t('Unterlagen heute'), p.storage && t(p.storage))}${row(t('Zuerst ordnen'), prios.join(', '))}${row(t('Vertrauensperson'), people[0]?.name)}</div>
      <div class="bottom-actions"><button class="btn btn-primary" id="ob-finish">${t('Weiter')}</button></div>`;
  }
  $app.innerHTML = `<section class="screen auth">${head}${body}</section>`;

  const $ = (sel) => $app.querySelector(sel);
  $('#ob-back')?.addEventListener('click', () => go('onboarding', { step: step - 1 }));
  $('#ob-skip')?.addEventListener('click', next);
  $('#ob-skip2')?.addEventListener('click', next);
  $('#ob-next')?.addEventListener('click', next);
  $('#ob-notify')?.addEventListener('click', async () => {
    try { if ('Notification' in window) store.set('notify', (await Notification.requestPermission()) === 'granted'); } catch {}
    toast(t('Erinnerungen sind aktiviert')); next();
  });
  $app.querySelectorAll('[data-age]').forEach(b => b.onclick = () => { saveProfile({ profile: { age: b.dataset.age } }); next(); });
  $app.querySelectorAll('[data-storage]').forEach(b => b.onclick = () => { saveProfile({ profile: { storage: b.dataset.storage } }); next(); });
  $app.querySelectorAll('[data-prio]').forEach(b => b.onclick = () => {
    b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
    saveProfile({ profile: { priorities: [...$app.querySelectorAll('[data-prio][aria-pressed="true"]')].map(x => x.dataset.prio) } });
  });
  $app.querySelectorAll('[data-size]').forEach(b => b.onclick = () => { store.set('size', b.dataset.size); applySize(); go('onboarding', { step }); });
  $('#ob-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (kind === 'name') {
      const name = $('#ob-name').value.trim();
      if (!name) return toast(t('Bitte geben Sie Ihren Vornamen ein.'));
      saveProfile({ name });
    }
    if (kind === 'helper') {
      const h = { name: $('#ob-hname').value.trim(), relation: $('#ob-hrel').value, contact: $('#ob-hcontact').value.trim() };
      if (h.name || h.contact) {
        if (!h.name || !h.contact) return toast(t('Bitte Name und Kontakt ausfüllen oder «Überspringen» wählen.'));
        store.set('contacts', [...store.get('contacts', []), h]);
      }
    }
    next();
  });
  $('#ob-finish')?.addEventListener('click', () => { saveProfile({ onboarded: true }); store.del('ob_step'); go('home'); });
};

/* ---------- Vorsorge-Bereiche (Angaben ohne Dokument) ---------- */
const SECTIONS = {
  contracts: {
    title: 'Verträge & Abos', icon: 'contract', kind: 'list',
    lead: 'Handy, Zeitung, Vereine, Spenden-Daueraufträge – damit Ihre Angehörigen wissen, was sie kündigen müssen.',
    fields: [
      { k: 'art', label: 'Art', options: ['Handy', 'Internet & TV', 'Zeitung / Zeitschrift', 'Verein', 'Spende / Dauerauftrag', 'Streaming', 'Andere'] },
      { k: 'name', label: 'Anbieter oder Name', ph: 'z. B. Swisscom' },
      { k: 'note', label: 'Bemerkung', ph: 'z. B. Kundennummer 12345, jährlich', optional: true },
    ],
  },
  finances: {
    title: 'Banken & Institute', icon: 'bank', kind: 'list',
    lead: 'Nur wo Konten bestehen. Bitte hier nie Zugangsdaten, PINs oder Passwörter eintragen.',
    fields: [
      { k: 'art', label: 'Art', options: ['Privatkonto', 'Sparkonto', 'Wertschriftendepot', 'Säule 3a', 'Freizügigkeitskonto', 'Andere'] },
      { k: 'name', label: 'Bank oder Institut', ph: 'z. B. Berner Kantonalbank' },
      { k: 'note', label: 'Bemerkung', ph: 'z. B. Filiale Bümpliz', optional: true },
    ],
  },
  people: {
    title: 'Wichtige Kontakte', icon: 'phone', kind: 'list',
    lead: 'Menschen, die Ihre Angehörigen im Ernstfall anrufen sollten.',
    fields: [
      { k: 'art', label: 'Rolle', options: ['Hausarzt / Hausärztin', 'Notar / Notarin', 'Treuhänder / Treuhänderin', 'Pfarrer / Pfarrerin', 'Nachbar/in mit Schlüssel', 'Andere'] },
      { k: 'name', label: 'Name', ph: 'z. B. Dr. Anna Meier' },
      { k: 'note', label: 'Telefon', ph: 'z. B. 031 123 45 67', optional: true },
    ],
  },
  funeral: {
    title: 'Bestattungswünsche', icon: 'flower', kind: 'form',
    lead: 'Ihre Wünsche entlasten Ihre Angehörigen in einer schweren Zeit. Alle Angaben sind freiwillig.',
    fields: [
      { k: 'art', label: 'Art der Bestattung', choice: ['Erdbestattung (Sarg)', 'Kremation (Urne)', 'Noch offen'] },
      { k: 'place', label: 'Ort', ph: 'z. B. Friedhof Bremgarten, Bern' },
      { k: 'ceremony', label: 'Abdankung', choice: ['Kirchlich', 'Weltlich', 'Im engsten Kreis', 'Keine Feier'] },
      { k: 'note', label: 'Weitere Wünsche', ph: 'z. B. Lieblingslied, Spenden statt Blumen', area: true },
    ],
  },
  daily: {
    title: 'Alltag', icon: 'paw', kind: 'form',
    lead: 'Wer kümmert sich um Tiere, Pflanzen, Wohnung und Auto, wenn Sie es nicht können?',
    fields: [
      { k: 'pets', label: 'Haustiere', ph: 'z. B. Katze Minou, Futter im Keller, Tierarzt Dr. Frei', area: true },
      { k: 'plants', label: 'Pflanzen', ph: 'z. B. Orchideen einmal pro Woche giessen', area: true },
      { k: 'home', label: 'Wohnung', ph: 'z. B. Ersatzschlüssel bei Frau Huber, Nr. 5', area: true },
      { k: 'car', label: 'Auto', ph: 'z. B. VW Golf, Schlüssel in der Kommode, Garage Müller', area: true },
    ],
  },
};
// Auswahlwerte (deutsch gespeichert) werden übersetzt angezeigt; freie Texte bleiben, wie sie eingegeben wurden.
const fieldValue = (f, v) => (f?.options || f?.choice) ? t(v) : v;
const info = {
  all() { return store.get('info', {}); },
  get(key) { const d = this.all()[key]; return d ?? (SECTIONS[key].kind === 'list' ? [] : {}); },
  set(key, val) { store.set('info', { ...this.all(), [key]: val }); },
  filled(key) { const d = this.get(key); return Array.isArray(d) ? d.length > 0 : Object.values(d).some(v => String(v || '').trim()); },
};

/* ---------- Vollständigkeit ---------- */
function checklist(docs) {
  const count = (c) => docs.filter(d => d.category === c).length;
  const trusted = store.get('contacts', []);
  return [
    ...CATEGORIES.filter(c => c.id !== 'sonstiges').map(c => {
      const n = count(c.id);
      return { group: 'docs', icon: c.icon, label: catName(c), sub: n ? plural(n, '1 Dokument', '{n} Dokumente') : t(c.hint), done: n > 0, act: { add: c.id } };
    }),
    ...Object.entries(SECTIONS).map(([k, s]) => {
      const d = info.get(k);
      const sub = Array.isArray(d) ? (d.length ? plural(d.length, '1 Eintrag', '{n} Einträge') : t('Noch leer')) : (info.filled(k) ? t('Ausgefüllt') : t('Noch leer'));
      return { group: 'info', icon: s.icon, label: t(s.title), sub, done: info.filled(k), act: { section: k } };
    }),
    { group: 'people', icon: 'people', label: t('Vertrauensperson'), sub: trusted.length ? trusted.map(p => p.name).join(', ') : t('Wer hilft im Notfall?'), done: trusted.length > 0, act: { go: 'contacts' } },
  ];
}
function runAct(act) {
  if (act.add) { state.preCat = act.add; go('add'); }
  else if (act.section) go('section', { id: act.section });
  else go(act.go);
}
const progressBar = (pct) => `<div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${t('Vollständigkeit')}"><span style="width:${pct}%"></span></div>`;

/* ---------- Erinnerungen ---------- */
const DAY = 864e5;
const addMonths = (ts, m) => { const d = new Date(ts); d.setMonth(d.getMonth() + m); return d.getTime(); };
function reminders(docs) {
  return docs.filter(d => (d.review ?? cat(d.category).review ?? 0) > 0)
    .map(d => ({ doc: d, due: addMonths(d.reviewed || d.created, d.review ?? cat(d.category).review) }))
    .sort((a, b) => a.due - b.due);
}
const dueSoon = (r) => r.due - Date.now() < 30 * DAY;
const REVIEW_OPTIONS = [[12, 'Jährlich'], [24, 'Alle 2 Jahre'], [0, 'Keine Erinnerung']];

/* ---------- Wissensbasis & Checklisten ---------- */
const KB = () => KB_TEXT[lang()] || KB_TEXT.de;
const GUIDE = {
  self: {
    title: 'Für mich', lead: 'Diese Schritte helfen Ihnen, Ihre Vorsorge vollständig zu regeln.',
    groups: [{ title: 'Ihre Vorsorge-Checkliste', items: [
      { t: 'Patientenverfügung erstellen und ablegen', auto: (d) => d.some(x => x.category === 'patvf') },
      { t: 'Vorsorgeauftrag und Testament ablegen', auto: (d) => d.some(x => x.category === 'vorsorge') },
      { t: 'Mindestens eine Vertrauensperson bestimmen', auto: () => store.get('contacts', []).length > 0 },
      { t: 'Banken und Institute auflisten (ohne Passwörter)', auto: () => info.filled('finances') },
      { t: 'Verträge und Abos erfassen', auto: () => info.filled('contracts') },
      { t: 'Wichtige Kontakte erfassen (Hausarzt, Notar …)', auto: () => info.filled('people') },
      { t: 'Bestattungswünsche festhalten', auto: () => info.filled('funeral') },
      { t: 'Kopie der Patientenverfügung dem Hausarzt geben' },
      { t: 'Vertrauensperson sagen, dass es Lifely gibt' },
    ] }],
  },
  family: {
    title: 'Für Angehörige', lead: 'Eine Schritt-für-Schritt-Hilfe für den Ernstfall. Haken Sie ab, was erledigt ist.',
    groups: [
      { title: 'Im Notfall (Spital, Unfall)', items: [
        { t: 'Patientenverfügung und Vorsorgeauftrag in Lifely öffnen' },
        { t: 'Hausarzt informieren (siehe «Wichtige Kontakte»)' },
        { t: 'Haustiere, Pflanzen und Wohnung versorgen (siehe «Alltag»)' },
      ] },
      { title: 'Im Todesfall', ordered: true, items: [
        { t: 'Arzt stellt die Todesbescheinigung aus' },
        { t: 'Todesfall innert 2 Tagen beim Zivilstandsamt melden (oft übernimmt dies das Spital oder der Bestatter)' },
        { t: 'Bestattungsunternehmen kontaktieren, Bestattungswünsche beachten' },
        { t: 'Testament sofort bei der zuständigen Behörde einreichen' },
        { t: 'Banken, AHV-Ausgleichskasse, Pensionskasse und Versicherungen informieren' },
        { t: 'Erbbescheinigung beantragen' },
        { t: 'Mietvertrag, Abos und Verträge kündigen' },
      ] },
    ],
  },
};
function kbAnswer(text) {
  const q = text.toLowerCase();
  const kb = KB();
  const hit = kb.map(k => ({ k, s: [...k.keys, ...KB_TEXT.de[kb.indexOf(k)].keys].filter(w => q.includes(w)).length })).sort((a, b) => b.s - a.s)[0];
  return hit.s ? hit.k.a : t('Dazu habe ich noch keine Antwort. Versuchen Sie es mit Stichworten wie <strong>Patientenverfügung</strong>, <strong>Testament</strong>, <strong>Todesfall</strong> oder <strong>Mietvertrag</strong>.');
}

/* ---------- KI-Anbindung (Google Gemini, kostenlose Stufe). Schlüssel steht in config.js. ---------- */
const aiReady = () => Boolean(window.LIFELY_AI?.apiKey);
const LANG_NAMES_FOR_AI = { de: 'Deutsch in Schweizer Rechtschreibung (immer «ss», nie «ß»)', fr: 'Französisch (Schweizer Französisch, Vous-Form)', en: 'Englisch (höflich, einfach)', it: 'Italienisch (Schweizer Italienisch, Lei-Form)' };
const aiSystem = () => `Du bist der Lifely-Assistent, ein freundlicher Helfer in einer Vorsorge-App für ältere Menschen in der Schweiz und ihre Angehörigen.
Regeln:
- Antworte immer auf ${LANG_NAMES_FOR_AI[lang()]}, auch wenn die Frage in einer anderen Sprache gestellt wird. Verwende die höfliche Anrede.
- Schreibe einfach, warm und kurz: höchstens 120 Wörter, kurze Sätze, bei Schritten eine nummerierte Liste.
- Beziehe dich auf Schweizer Recht und Stellen (ZGB, OR, Zivilstandsamt, AHV, KESB, Pro Senectute). Nenne Gesetzesartikel nur, wenn du dir sicher bist.
- Gib keine verbindliche Rechts-, Steuer- oder Arztberatung. Empfiehl bei komplexen Fällen einen Notar, die Gemeinde, Pro Senectute oder den Hausarzt.
- Frage nie nach Passwörtern, PINs, Kontonummern oder anderen persönlichen Daten. Rate davon ab, solche Daten in Lifely oder im Chat einzugeben.
- Verweise passend auf Lifely-Bereiche (verwende die Namen in der Antwortsprache): ${['Dokumente', 'Vorsorge', 'Verträge & Abos', 'Banken & Institute', 'Wichtige Kontakte', 'Bestattungswünsche', 'Alltag', 'Vertrauenspersonen', 'Erinnerungen', 'Notfall-Ansicht'].map(x => '«' + t(x) + '»').join(', ')}.
- Bleib beim Thema Vorsorge, Notfall, Todesfall und Nachlass. Andere Fragen lehnst du freundlich ab.
Geprüftes Hintergrundwissen:
${KB_TEXT.de.map(k => '- ' + k.q + ' ' + k.a.replace(/<[^>]+>/g, '')).join('\n')}`;
async function askAI(question, history) {
  const { apiKey, model = 'gemini-flash-lite-latest' } = window.LIFELY_AI;
  const contents = [
    ...history.slice(-4).flatMap(h => [
      { role: 'user', parts: [{ text: h.q }] },
      { role: 'model', parts: [{ text: h.a.replace(/<[^>]+>/g, '') }] },
    ]),
    { role: 'user', parts: [{ text: question }] },
  ];
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ system_instruction: { parts: [{ text: aiSystem() }] }, contents, generationConfig: { temperature: 0.3, maxOutputTokens: 600 } }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
    if (!text) throw new Error('empty');
    return lang() === 'de' ? text.replace(/ß/g, 'ss') : text;
  } finally { clearTimeout(timer); }
}
// Einfaches, sicheres Markdown: erst escapen, dann **fett**, Listen und Absätze
function mdToHtml(md) {
  const lines = esc(md).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>').split(/\n/);
  let html = '', list = null;
  const close = () => { if (list) { html += `</${list}>`; list = null; } };
  for (const raw of lines) {
    const line = raw.trim();
    const ol = line.match(/^\d+[.)]\s+(.*)/), ul = line.match(/^[-•*]\s+(.*)/);
    if (ol || ul) {
      const tag = ol ? 'ol' : 'ul';
      if (list !== tag) { close(); html += `<${tag}>`; list = tag; }
      html += `<li>${(ol || ul)[1]}</li>`;
    } else { close(); if (line) html += `<p>${line.replace(/^#+\s*/, '')}</p>`; }
  }
  close();
  return html;
}

/* ---------- Startseite ---------- */
routes.home = async () => {
  const user = store.get('user');
  const docs = await db.all();
  const list = checklist(docs);
  const done = list.filter(i => i.done).length;
  const pct = Math.round(done / list.length * 100);
  const next = list.find(i => !i.done);
  const due = reminders(docs).filter(dueSoon);
  const people = store.get('contacts', []);
  const hour = new Date().getHours();
  const hello = hour < 11 ? t('Guten Morgen') : hour < 18 ? t('Grüezi') : t('Guten Abend');
  notifyDue(due);
  $app.innerHTML = `<section class="screen">
    <header class="topbar">
      <div class="wordmark"><img src="icons/logo.svg" alt="">Lifely</div>
      <button class="avatar-btn" data-go="profile" aria-label="${t('Profil öffnen')}">${esc(initials(user.name))}</button>
    </header>
    <div class="greet"><h1>${hello}${user.name ? ', ' + esc(user.name) : ''}</h1><p>${t('Schön, dass Sie da sind.')}</p></div>
    ${due.length ? `<button class="alert-banner" data-go="reminders">${svg('bell')}<span><strong>${plural(due.length, 'Ein Dokument bitte prüfen', '{n} Dokumente bitte prüfen')}</strong><small>${esc(due[0].doc.title)}${due.length > 1 ? ' ' + t('und weitere') : ''}</small></span></button>` : ''}
    <div class="home-grid">
      <section class="ai-hero" aria-label="${t('Assistent')}">
        <div class="ai-top"><span class="ai-orb">${svg('spark')}</span><div><h2>${t('Fragen Sie Ihren Assistenten')}</h2><p>${t('Einfache Antworten rund um Vorsorge und Notfall')}</p></div></div>
        <form class="ai-ask" id="home-ask">
          ${svg('search').replace('<svg', '<svg class="s"')}
          <input id="home-q" placeholder="${t('Ihre Frage …')}" aria-label="${t('Frage an den Assistenten')}" autocomplete="off">
          <button type="submit" aria-label="${t('Frage senden')}">${svg('send')}</button>
        </form>
        <div class="ai-chips">${KB().slice(0, 2).map((k, i) => `<button type="button" data-kb="${i}">${esc(k.q)}</button>`).join('')}</div>
      </section>
      <div>
        <button class="photo-cta" data-go="add"><span class="cam">${svg('camera')}</span><span><strong>${t('Dokument fotografieren')}</strong><small>${t('Oder eine Datei hochladen')}</small></span></button>
        <section class="progress-card" aria-label="${t('Vollständigkeit')}">
          <div class="progress-top"><span>${t('Ihre Vorsorge ist erfasst zu')}</span><strong>${pct} %</strong></div>
          ${progressBar(pct)}
          ${next ? `<button class="next-link" id="next"><span>${t('Weiter mit: {x}', { x: esc(next.label) })}</span><span class="arrow">${svg('chev')}</span></button>`
                 : `<p style="margin:0;color:var(--ok-ink);font-weight:700">${t('Alles erfasst – prüfen Sie Ihre Angaben einmal im Jahr.')}</p>`}
        </section>
      </div>
    </div>
    <h2>${t('Entdecken')}</h2>
    <div class="discover">
      <button class="disc" data-go="emergency"><span class="ico coral">${svg('sos')}</span><span>${t('Notfall-Ansicht')}<small>${t('Was Angehörige sehen')}</small></span></button>
      <button class="disc" data-go="contacts"><span class="ico">${svg('people')}</span><span>${t('Vertrauenspersonen')}<small>${people.length ? t('{n} hinterlegt', { n: people.length }) : t('Noch niemand')}</small></span></button>
      <button class="disc" data-go="reminders"><span class="ico">${svg('bell')}</span><span>${t('Erinnerungen')}<small>${due.length ? t('{n} fällig', { n: due.length }) : t('Nichts fällig')}</small></span></button>
    </div>
  </section>`;
  $app.querySelector('#next')?.addEventListener('click', () => runAct(next.act));
  $app.querySelector('#home-ask').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = $app.querySelector('#home-q').value.trim();
    if (!q) return $app.querySelector('#home-q').focus();
    state.pendingQuestion = q; state.guideTab = 'chat'; go('assistant');
  });
  $app.querySelectorAll('[data-kb]').forEach(b => b.onclick = () => { state.pendingQuestion = KB()[+b.dataset.kb].q; state.guideTab = 'chat'; go('assistant'); });
};

// Erinnerung als Systemmitteilung (höchstens einmal pro Tag, nur mit Erlaubnis)
function notifyDue(due) {
  try {
    if (!due.length || !store.get('notify', false) || Notification.permission !== 'granted') return;
    const today = new Date().toDateString();
    if (store.get('notified', '') === today) return;
    store.set('notified', today);
    new Notification('Lifely', { body: t('Bitte prüfen: {x}', { x: due[0].doc.title }), icon: 'icons/logo.svg' });
  } catch {}
}

/* ---------- Assistent ---------- */
routes.assistant = async () => {
  const tab = state.guideTab || 'chat';
  const seg = `<div class="segmented two" role="tablist">
      <button role="tab" data-t="chat" aria-pressed="${tab === 'chat'}" aria-selected="${tab === 'chat'}">${t('Fragen')}</button>
      <button role="tab" data-t="lists" aria-pressed="${tab === 'lists'}" aria-selected="${tab === 'lists'}">${t('Checklisten')}</button></div>`;
  const head = `<div class="assistant-head"><span class="ai-orb">${svg('spark')}</span><div><h1>${t('Ihr Assistent')}</h1><p>${aiReady() ? t('KI-Assistent · antwortet in einfacher Sprache') : t('Antworten aus der Lifely-Wissensbasis')}</p></div></div>`;
  if (tab === 'lists') return renderChecklists(head, seg);
  const name = store.get('user').name;
  const bubbles = state.chat.map(m => `<div class="bubble ${m.me ? 'me' : 'bot'}">${m.me ? esc(m.text) : m.html}</div>`).join('');
  $app.innerHTML = `<section class="screen">
    ${head}${seg}
    <div class="chat" id="chat" aria-live="polite">
      <div class="bubble bot">${t('Grüezi{name}! Ich helfe Ihnen bei Fragen zu Patientenverfügung, Testament, Vorsorgeauftrag und zum Ernstfall. Was möchten Sie wissen?', { name: name ? ' ' + esc(name) : '' })}</div>
      ${bubbles}
    </div>
    ${state.chat.length ? '' : `<div class="suggest">${KB().slice(0, 4).map((k, i) => `<button data-kb="${i}">${esc(k.q)}</button>`).join('')}</div>`}
    <form id="ask" class="composer">
      <input id="question" placeholder="${t('Ihre Frage …')}" aria-label="${t('Ihre Frage')}" autocomplete="off">
      <button type="submit" aria-label="${t('Frage senden')}">${svg('send')}</button>
    </form>
    <p class="fine">${aiReady()
      ? t('Nur der Text Ihrer Frage wird an Google Gemini gesendet – nie Ihre Dokumente. Bitte keine persönlichen Daten eingeben. Keine Rechts- oder Arztberatung.')
      : t('Die Antworten stammen aus einer geprüften Wissensbasis. Keine Rechts- oder Arztberatung.')}</p>
  </section>`;
  $app.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { state.guideTab = b.dataset.t; go('assistant'); });
  const chat = $app.querySelector('#chat');
  const ask = async (text) => {
    $app.querySelector('.suggest')?.remove();
    state.chat.push({ me: true, text });
    chat.insertAdjacentHTML('beforeend', `<div class="bubble me">${esc(text)}</div><div class="bubble bot typing"><span></span><span></span><span></span></div>`);
    chat.lastElementChild.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const started = Date.now();
    let html = null;
    if (aiReady()) {
      try { html = mdToHtml(await askAI(text, state.chat.filter(m => !m.me && m.q).map(m => ({ q: m.q, a: m.html })))); }
      catch (err) { console.warn('KI nicht erreichbar:', err); }
    }
    if (!html) html = kbAnswer(text) + (aiReady() ? `<small class="ai-note">${t('Die KI ist gerade nicht erreichbar – Antwort aus der Wissensbasis.')}</small>` : '');
    setTimeout(() => {
      state.chat.push({ me: false, q: text, html });
      const typing = chat.querySelector('.typing'); if (!typing) return;
      typing.outerHTML = `<div class="bubble bot">${html}</div>`;
      chat.lastElementChild.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, Math.max(0, 600 - (Date.now() - started)));
  };
  $app.querySelectorAll('[data-kb]').forEach(b => b.onclick = () => ask(KB()[+b.dataset.kb].q));
  $app.querySelector('#ask').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = $app.querySelector('#question'); if (!q.value.trim()) return;
    ask(q.value.trim()); q.value = '';
  });
  if (state.pendingQuestion) { const q = state.pendingQuestion; state.pendingQuestion = null; ask(q); }
};

async function renderChecklists(head, seg) {
  const docs = await db.all();
  const checks = store.get('guideChecks', {});
  const who = state.listWho || 'self';
  const g = GUIDE[who];
  const groups = g.groups.map((grp, gi) => `
    <h2>${t(grp.title)}</h2>
    <${grp.ordered ? 'ol' : 'ul'} class="guide-list">
      ${grp.items.map((it, ii) => {
        const key = `${who}-${gi}-${ii}`;
        const auto = it.auto?.(docs);
        const on = auto || checks[key];
        return `<li><button class="guide-item ${on ? 'is-done' : ''}" data-key="${key}" ${auto ? 'data-auto="1"' : ''} aria-pressed="${!!on}">
          <span class="check-mark">${on ? svg('check') : ''}</span><span>${esc(t(it.t))}${auto ? `<small>${t('In Lifely erfasst')}</small>` : ''}</span></button></li>`;
      }).join('')}
    </${grp.ordered ? 'ol' : 'ul'}>`).join('');
  $app.innerHTML = `<section class="screen">
    ${head}${seg}
    <div class="chips" style="margin-top:16px" role="group" aria-label="${t('Für wen')}">
      <button class="chip" data-who="self" aria-pressed="${who === 'self'}">${t('Für mich')}</button>
      <button class="chip" data-who="family" aria-pressed="${who === 'family'}">${t('Für Angehörige')}</button>
    </div>
    <p class="lead" style="margin:0">${t(g.lead)}</p>
    ${groups}
  </section>`;
  $app.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { state.guideTab = b.dataset.t; go('assistant'); });
  $app.querySelectorAll('[data-who]').forEach(b => b.onclick = () => { state.listWho = b.dataset.who; go('assistant'); });
  $app.querySelectorAll('.guide-item').forEach(b => b.onclick = () => {
    if (b.dataset.auto) return toast(t('Dieser Punkt ist in Lifely erfasst ✓'));
    const c = store.get('guideChecks', {}); c[b.dataset.key] = !c[b.dataset.key]; store.set('guideChecks', c);
    go('assistant');
  });
}

/* ---------- Dokument hinzufügen ---------- */
routes.add = () => {
  state.draft = null;
  $app.innerHTML = `<section class="screen">
    ${topbar(state.lastMain || 'home', t('Abbrechen'))}
    <div class="steps" aria-hidden="true"><span class="on"></span><span></span></div>
    <p class="step-label">${t('Schritt {a} von {b}', { a: 1, b: 2 })}</p>
    <h1>${t('Dokument hinzufügen')}</h1>
    <p class="lead">${t('Legen Sie das Blatt auf einen Tisch und fotografieren Sie es von oben – bei gutem Licht.')}</p>
    <div class="illu" aria-hidden="true" style="height:220px"><div class="phone" style="height:86%">
      <div class="ph-card" style="justify-content:center;min-height:92px">${svg('file').replace('<svg', '<svg style="width:40px;height:40px;color:#0e7a6c"')}</div>
    </div></div>
    <div class="bottom-actions">
      <button class="btn btn-primary" id="shoot">${svg('camera')} ${t('Fotografieren')}</button>
      <button class="btn btn-soft" id="pick">${svg('upload')} ${t('Datei auswählen')}</button>
    </div>
    <input type="file" id="cam" accept="image/*" capture="environment" hidden>
    <input type="file" id="file" accept="image/*,application/pdf" hidden>
  </section>`;
  const handle = async (input) => {
    const f = input.files[0]; if (!f) return;
    const isPdf = f.type === 'application/pdf';
    if (!isPdf && !f.type.startsWith('image/')) return toast(t('Bitte wählen Sie ein Foto oder eine PDF-Datei.'));
    const blob = isPdf ? f : await compressImage(f);
    state.draft = { blob, type: isPdf ? 'pdf' : 'image', fileName: f.name };
    go('add2');
  };
  $app.querySelector('#shoot').onclick = () => $app.querySelector('#cam').click();
  $app.querySelector('#pick').onclick = () => $app.querySelector('#file').click();
  $app.querySelector('#cam').onchange = (e) => handle(e.target);
  $app.querySelector('#file').onchange = (e) => handle(e.target);
};

routes.add2 = () => {
  const d = state.draft; if (!d) return go('add');
  const prev = d.type === 'pdf'
    ? `<div class="pdf-box">${svg('file')}<span>${esc(d.fileName)}</span></div>`
    : `<img class="preview" src="${blobUrl(d.blob)}" alt="${t('Vorschau des Dokuments')}">`;
  $app.innerHTML = `<section class="screen">
    ${topbar('add')}
    <div class="steps" aria-hidden="true"><span class="on"></span><span class="on"></span></div>
    <p class="step-label">${t('Schritt {a} von {b}', { a: 2, b: 2 })}</p>
    <h1>${t('Wohin gehört das Dokument?')}</h1>
    ${prev}
    <h2>${t('Kategorie wählen')}</h2>
    <div class="cat-grid" role="group" aria-label="${t('Kategorie')}">
      ${CATEGORIES.map(c => `<button class="cat" data-cat="${c.id}" aria-pressed="false"><span class="dot" style="background:${c.bg};color:${c.color}">${svg(c.icon)}</span><span>${catName(c)}<small>${t(c.hint)}</small></span></button>`).join('')}
    </div>
    <form id="save-form" class="stack" style="margin-top:20px">
      <label class="field">${t('Name des Dokuments')}
        <input class="input" id="title" placeholder="${t('z. B. Krankenkasse Police 2026')}"></label>
      <label class="field">${t('Kommentar')} <span class="opt">(${t('freiwillig')})</span>
        <textarea class="input" id="note" rows="3" placeholder="${t('z. B. Original liegt im blauen Ordner im Wohnzimmer')}"></textarea></label>
      <div class="bottom-actions"><button class="btn btn-primary" type="submit" id="save" disabled>${t('Speichern')}</button></div>
    </form></section>`;
  let chosen = null;
  const title = $app.querySelector('#title');
  $app.querySelectorAll('.cat').forEach(b => b.addEventListener('click', () => {
    $app.querySelectorAll('.cat').forEach(x => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', 'true');
    chosen = b.dataset.cat;
    if (!title.value || title.dataset.auto) { title.value = catName(cat(chosen)); title.dataset.auto = '1'; }
    $app.querySelector('#save').disabled = false;
  }));
  title.addEventListener('input', () => delete title.dataset.auto);
  if (state.preCat) { $app.querySelector(`.cat[data-cat="${state.preCat}"]`)?.click(); state.preCat = null; }
  $app.querySelector('#save-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!chosen) return toast(t('Bitte wählen Sie eine Kategorie.'));
    try {
      await db.put({
        id: crypto.randomUUID?.() || String(Date.now()), title: title.value.trim() || catName(cat(chosen)), category: chosen,
        note: $app.querySelector('#note').value.trim(), type: d.type, blob: d.blob, created: Date.now(),
      });
      state.draft = null;
      toast(t('Dokument gespeichert ✓'));
      go('docs');
    } catch { toast(t('Speichern nicht möglich – der Speicher ist eventuell voll.')); }
  });
};

/* ---------- Dokumente ---------- */
routes.docs = async () => {
  const docs = await db.all();
  const shown = state.filter === 'alle' ? docs : docs.filter(x => x.category === state.filter);
  const used = CATEGORIES.filter(c => docs.some(x => x.category === c.id));
  $app.innerHTML = `<section class="screen">
    <header class="topbar"><h1 style="margin:0">${t('Dokumente')}</h1>
      <button class="btn btn-primary small" data-go="add">${svg('camera')} ${t('Neu')}</button></header>
    ${used.length ? `<div class="chips" role="group" aria-label="${t('Filtern nach Kategorie')}">
      <button class="chip" data-f="alle" aria-pressed="${state.filter === 'alle'}">${t('Alle')} (${docs.length})</button>
      ${used.map(c => `<button class="chip" data-f="${c.id}" aria-pressed="${state.filter === c.id}">${catName(c)}</button>`).join('')}</div>` : ''}
    <div class="list">
      ${shown.length ? shown.map(x => docRow(x)).join('') : `<div class="empty"><div class="bubble-ic">${svg('folder')}</div><strong>${t('Noch keine Dokumente')}</strong>${t('Fotografieren Sie Ihr erstes Dokument – es dauert nur einen Moment.')}
        <div style="margin-top:18px"><button class="btn btn-primary" data-go="add">${svg('camera')} ${t('Dokument fotografieren')}</button></div></div>`}
    </div>
  </section>`;
  $app.querySelectorAll('.chip').forEach(b => b.onclick = () => { state.filter = b.dataset.f; go('docs'); });
};
function docRow(x, clickable = true) {
  const c = cat(x.category);
  const thumb = x.type === 'image' ? `<img class="thumb" src="${blobUrl(x.blob)}" alt="">` : `<span class="thumb">PDF</span>`;
  const inner = `${thumb}<span class="meta"><strong>${esc(x.title)}</strong>
    <span class="tag" style="background:${c.bg};color:${c.color}">${catName(c)}</span>
    ${x.note ? `<small class="note-line">${svg('note')}${esc(x.note)}</small>` : `<small>${fmtDate(x.created)}</small>`}</span>${svg('chev').replace('<svg', '<svg class="chev"')}`;
  return clickable ? `<button class="row" data-go="doc" data-id="${x.id}">${inner}</button>` : `<button class="row" data-open="${x.id}">${inner}</button>`;
}

routes.doc = async ({ id }) => {
  const x = await db.get(id); if (!x) return go('docs');
  const c = cat(x.category);
  const review = x.review ?? c.review ?? 0;
  $app.innerHTML = `<section class="screen">
    ${topbar('docs')}
    <span class="tag" style="background:${c.bg};color:${c.color}">${catName(c)}</span>
    <h1>${esc(x.title)}</h1>
    <p class="lead">${t('Hinzugefügt am {date}', { date: fmtDate(x.created) })}</p>
    ${x.type === 'image' ? `<img class="preview" src="${blobUrl(x.blob)}" alt="${esc(x.title)}">` : `<div class="pdf-box">${svg('file')}<span>${t('PDF-Dokument')}</span></div>`}
    <div class="stack" style="margin-top:12px"><button class="btn btn-soft" id="big">${svg('eye')} ${t('Gross anzeigen')}</button></div>
    <h2>${t('Kommentar')}</h2>
    <form id="note-form" class="stack">
      <textarea class="input" id="note" rows="3" aria-label="${t('Kommentar')}" placeholder="${t('z. B. Original liegt im blauen Ordner im Wohnzimmer')}">${esc(x.note || '')}</textarea>
      <button class="btn btn-outline" type="submit">${t('Kommentar speichern')}</button>
    </form>
    <h2>${t('Erinnerung zum Überprüfen')}</h2>
    <div class="segmented" role="group" aria-label="${t('Erinnerung')}">
      ${REVIEW_OPTIONS.map(([m, l]) => `<button data-review="${m}" aria-pressed="${review === m}">${t(l)}</button>`).join('')}
    </div>
    ${review ? `<p class="fine">${t('Nächste Prüfung: {date}', { date: fmtDate(addMonths(x.reviewed || x.created, review)) })}</p>` : ''}
    <div class="stack" style="margin-top:26px"><button class="btn btn-danger" id="del">${svg('trash')} ${t('Dokument löschen')}</button></div>
  </section>`;
  $app.querySelector('#big').onclick = () => viewer(x);
  $app.querySelector('#note-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await db.put({ ...x, note: $app.querySelector('#note').value.trim() });
    toast(t('Kommentar gespeichert')); go('doc', { id });
  });
  $app.querySelectorAll('[data-review]').forEach(b => b.onclick = async () => { await db.put({ ...x, review: +b.dataset.review }); go('doc', { id }); });
  $app.querySelector('#del').onclick = async () => {
    if (await confirmSheet({ title: t('Dokument löschen?'), text: t('«{x}» wird endgültig entfernt.', { x: x.title }), ok: t('Ja, löschen') })) {
      await db.remove(id); toast(t('Dokument gelöscht')); go('docs');
    }
  };
};

/* ---------- Vorsorge (alle Bereiche) ---------- */
const chevron = () => svg('chev').replace('<svg', '<svg class="chev"');
routes.vorsorge = async () => {
  const docs = await db.all();
  const list = checklist(docs);
  const done = list.filter(i => i.done).length;
  const pct = Math.round(done / list.length * 100);
  const row = (i, n) => `<button class="row" data-n="${n}">
      <span class="ico">${svg(i.icon)}</span><span class="meta"><strong>${esc(i.label)}</strong><small>${esc(i.sub)}</small></span>
      <span class="pill ${i.done ? 'ok' : ''}">${i.done ? t('Erfasst') : t('Offen')}</span></button>`;
  const groups = [['docs', 'Dokumente'], ['info', 'Meine Angaben'], ['people', 'Personen']];
  $app.innerHTML = `<section class="screen">
    <header class="topbar"><h1 style="margin:0">${t('Vorsorge')}</h1></header>
    <section class="vorsorge-hero" aria-label="${t('Vollständigkeit')}">
      <div class="big">${pct} %</div>
      ${progressBar(pct)}
      <p>${t('{a} von {b} Bereichen erfasst. Tippen Sie auf einen offenen Bereich, um ihn zu ergänzen.', { a: done, b: list.length })}</p>
    </section>
    ${groups.map(([g, label]) => `<p class="group-label">${t(label)}</p><div class="list">${list.map((i, n) => i.group === g ? row(i, n) : '').join('')}</div>`).join('')}
    <p class="group-label">${t('Weiteres')}</p>
    <div class="list">
      <button class="row" data-go="reminders"><span class="ico">${svg('bell')}</span><span class="meta"><strong>${t('Erinnerungen')}</strong><small>${t('Regelmässig prüfen')}</small></span>${chevron()}</button>
      <button class="row" data-go="emergency"><span class="ico coral">${svg('sos')}</span><span class="meta"><strong>${t('Notfall-Ansicht')}</strong><small>${t('So sehen Angehörige Ihre Vorsorge')}</small></span>${chevron()}</button>
    </div>
  </section>`;
  $app.querySelectorAll('[data-n]').forEach(b => b.onclick = () => runAct(list[+b.dataset.n].act));
};

routes.section = ({ id }) => {
  const s = SECTIONS[id]; if (!s) return go('vorsorge');
  const data = info.get(id);
  const field = (f, val = '') => {
    const fid = `f-${f.k}`;
    if (f.options) return `<label class="field" for="${fid}">${t(f.label)}<select class="input" id="${fid}" name="${f.k}">${f.options.map(o => `<option value="${esc(o)}" ${o === val ? 'selected' : ''}>${esc(t(o))}</option>`).join('')}</select></label>`;
    if (f.choice) return `<fieldset class="field"><legend>${t(f.label)}</legend><div class="stack" role="radiogroup">${f.choice.map(o =>
      `<button type="button" class="choice" role="radio" data-field="${f.k}" data-val="${esc(o)}" aria-checked="${o === val}">${esc(t(o))}</button>`).join('')}</div></fieldset>`;
    const opt = f.optional ? ` <span class="opt">(${t('freiwillig')})</span>` : '';
    return f.area
      ? `<label class="field" for="${fid}">${t(f.label)}${opt}<textarea class="input" id="${fid}" name="${f.k}" rows="2" placeholder="${esc(t(f.ph || ''))}">${esc(val)}</textarea></label>`
      : `<label class="field" for="${fid}">${t(f.label)}${opt}<input class="input" id="${fid}" name="${f.k}" placeholder="${esc(t(f.ph || ''))}" value="${esc(val)}"></label>`;
  };
  const artField = s.fields.find(f => f.k === 'art');
  const body = s.kind === 'list'
    ? `<div class="list">${data.map((e, i) => `<div class="row"><span class="ico">${svg(s.icon)}</span>
          <span class="meta"><strong>${esc(e.name)}</strong><small>${esc(fieldValue(artField, e.art))}${e.note ? ' · ' + esc(e.note) : ''}</small></span>
          <button class="back" data-del="${i}" aria-label="${t('{x} entfernen', { x: esc(e.name) })}" style="padding:0 12px">${svg('trash')}</button></div>`).join('')}</div>
      <h2>${data.length ? t('Weiteren Eintrag hinzufügen') : t('Eintrag hinzufügen')}</h2>
      <form id="sec-form" class="stack soft-card">${s.fields.map(f => field(f)).join('')}
        <button class="btn btn-primary" type="submit">${svg('plus')} ${t('Hinzufügen')}</button></form>`
    : `<form id="sec-form" class="stack">${s.fields.map(f => field(f, data[f.k] || '')).join('')}
        <div class="bottom-actions"><button class="btn btn-primary" type="submit">${t('Speichern')}</button></div></form>`;
  $app.innerHTML = `<section class="screen">
    ${topbar('vorsorge')}
    <h1>${t(s.title)}</h1>
    <p class="lead">${t(s.lead)}</p>
    ${id === 'finances' ? `<div class="info warn" style="margin:0 0 18px">${svg('lock')}<span>${t('Lifely fragt nie nach Passwörtern oder PIN-Codes. Tragen Sie nur ein, <strong>wo</strong> Sie Konten haben.')}</span></div>` : ''}
    ${body}
  </section>`;
  const form = $app.querySelector('#sec-form');
  form.querySelectorAll('.choice').forEach(b => b.onclick = () => {
    form.querySelectorAll(`.choice[data-field="${b.dataset.field}"]`).forEach(x => x.setAttribute('aria-checked', 'false'));
    b.setAttribute('aria-checked', 'true');
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const entry = Object.fromEntries(new FormData(form));
    form.querySelectorAll('.choice[aria-checked="true"]').forEach(b => (entry[b.dataset.field] = b.dataset.val));
    Object.keys(entry).forEach(k => (entry[k] = String(entry[k]).trim()));
    if (s.kind === 'list') {
      if (!entry.name) return toast(t('Bitte geben Sie einen Namen ein.'));
      info.set(id, [...data, entry]); toast(t('{x} wurde hinzugefügt', { x: entry.name }));
    } else { info.set(id, entry); toast(t('Gespeichert ✓')); }
    go('section', { id });
  });
  $app.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
    const e = data[+b.dataset.del];
    if (await confirmSheet({ title: t('Eintrag entfernen?'), text: t('«{x}» wird entfernt.', { x: e.name }), ok: t('Ja, entfernen') })) {
      info.set(id, data.filter((_, i) => i !== +b.dataset.del)); go('section', { id });
    }
  });
};

routes.contacts = () => {
  const people = store.get('contacts', []);
  $app.innerHTML = `<section class="screen">
    ${topbar('vorsorge')}
    <h1>${t('Vertrauenspersonen')}</h1>
    <p class="lead">${t('Diese Menschen erhalten im Notfall Zugang zu Ihren Unterlagen.')}</p>
    <div class="list">
      ${people.map((p, i) => `<div class="row"><span class="avatar">${esc(initials(p.name))}</span>
        <span class="meta"><strong>${esc(p.name)}</strong><small>${esc(t(p.relation))} · ${esc(p.contact)}</small></span>
        <button class="back" data-del="${i}" aria-label="${t('{x} entfernen', { x: esc(p.name) })}" style="padding:0 12px">${svg('trash')}</button></div>`).join('')}
    </div>
    <h2>${people.length ? t('Weitere Person hinzufügen') : t('Person hinzufügen')}</h2>
    <form id="p-form" class="stack soft-card">
      <label class="field">${t('Name')}<input class="input" id="p-name" name="name" placeholder="${t('z. B. Thomas Keller')}" required></label>
      <label class="field">${t('Beziehung')}${relationSelect('p-rel', 'relation')}</label>
      <label class="field">${t('E-Mail oder Telefon')}<input class="input" id="p-contact" name="contact" placeholder="${t('z. B. 079 123 45 67')}" required></label>
      <button class="btn btn-primary" type="submit">${svg('plus')} ${t('Hinzufügen')}</button>
    </form>
    <div class="info">${svg('shield')}<span>${t('So funktioniert der Notfallzugang: Eine Vertrauensperson kann Zugang anfragen. Sie erhalten eine Nachricht und haben <strong>7 Tage</strong> Zeit, um zu widersprechen. Erst danach werden die Unterlagen freigegeben.')}</span></div>
  </section>`;
  $app.querySelector('#p-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const p = { name: f.get('name').trim(), relation: f.get('relation'), contact: f.get('contact').trim() };
    if (!p.name || !p.contact) return toast(t('Bitte Name und Kontakt ausfüllen.'));
    store.set('contacts', [...people, p]); toast(t('{x} wurde hinzugefügt', { x: p.name })); go('contacts');
  });
  $app.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
    const p = people[+b.dataset.del];
    if (await confirmSheet({ title: t('Person entfernen?'), text: t('{x} hat danach keinen Notfallzugang mehr.', { x: p.name }), ok: t('Ja, entfernen') })) {
      store.set('contacts', people.filter((_, i) => i !== +b.dataset.del)); go('contacts');
    }
  });
};

routes.reminders = async () => {
  const docs = await db.all();
  const list = reminders(docs);
  $app.innerHTML = `<section class="screen">
    ${topbar('vorsorge')}
    <h1>${t('Erinnerungen')}</h1>
    <p class="lead">${t('Unterlagen wie die Patientenverfügung sollten Sie regelmässig prüfen. Lifely erinnert Sie daran.')}</p>
    <div class="list">
      ${list.length ? list.map(r => {
        const soon = dueSoon(r); const over = r.due < Date.now();
        return `<div class="row reminder ${soon ? 'is-due' : ''}"><span class="ico">${svg('bell')}</span>
          <span class="meta"><strong>${esc(r.doc.title)}</strong><small>${over ? t('Überfällig seit {date}', { date: fmtDate(r.due) }) : t('Prüfen bis {date}', { date: fmtDate(r.due) })}</small></span>
          ${soon ? `<button class="btn btn-primary small" data-ok="${r.doc.id}">${t('Geprüft')}</button>` : `<span class="pill ok">${t('In Ordnung')}</span>`}</div>`;
      }).join('') : `<div class="empty"><div class="bubble-ic">${svg('bell')}</div><strong>${t('Noch keine Erinnerungen')}</strong>${t('Sobald Sie z. B. eine Patientenverfügung ablegen, erinnert Lifely Sie jährlich.')}</div>`}
    </div>
    <div class="info">${svg('info')}<span>${t('Die Häufigkeit können Sie bei jedem Dokument einstellen: jährlich, alle 2 Jahre oder nie.')}</span></div>
    ${list.length ? `<button class="btn-link demo-link" id="demo-due">${t('Demo: Fälligkeit simulieren')}</button>` : ''}
  </section>`;
  $app.querySelectorAll('[data-ok]').forEach(b => b.onclick = async () => {
    const x = docs.find(d => d.id === b.dataset.ok);
    await db.put({ ...x, reviewed: Date.now() });
    toast((x.review ?? cat(x.category).review) === 24 ? t('Danke! Nächste Erinnerung in 2 Jahren.') : t('Danke! Nächste Erinnerung in einem Jahr.'));
    go('reminders');
  });
  $app.querySelector('#demo-due')?.addEventListener('click', async () => {
    const x = list[0].doc; const m = x.review ?? cat(x.category).review;
    await db.put({ ...x, reviewed: addMonths(Date.now(), -m) - 3 * DAY });
    toast(t('Demo: Erinnerung ist jetzt fällig')); go('reminders');
  });
};

routes.emergency = async () => {
  const user = store.get('user');
  const docs = await db.all();
  const groups = CATEGORIES.map(c => ({ c, items: docs.filter(x => x.category === c.id) })).filter(g => g.items.length);
  const trusted = store.get('contacts', []);
  const listBlock = (k) => {
    const d = info.get(k); if (!d.length) return '';
    const artField = SECTIONS[k].fields.find(f => f.k === 'art');
    return `<h2>${t(SECTIONS[k].title)}</h2><div class="card sum">${d.map(e => `<div class="sum-row"><span>${esc(fieldValue(artField, e.art))}</span><strong>${esc(e.name)}${e.note ? `<small>${esc(e.note)}</small>` : ''}</strong></div>`).join('')}</div>`;
  };
  const formBlock = (k) => {
    const d = info.get(k); if (!info.filled(k)) return '';
    return `<h2>${t(SECTIONS[k].title)}</h2><div class="card sum">${SECTIONS[k].fields.filter(f => d[f.k]).map(f => `<div class="sum-row"><span>${t(f.label)}</span><strong>${esc(fieldValue(f, d[f.k]))}</strong></div>`).join('')}</div>`;
  };
  const any = groups.length || Object.keys(SECTIONS).some(k => info.filled(k));
  $app.innerHTML = `<section class="screen">
    ${topbar('vorsorge')}
    <div class="emergency-banner"><h1>${t('Notfall-Ansicht')}</h1>
      <p>${t('So sehen Ihre Vertrauenspersonen die Vorsorge von {name}, nachdem der Notfallzugang freigegeben wurde – nur lesen, nichts ändern.', { name: esc(user.name) })}</p></div>
    ${!any ? `<div class="empty"><div class="bubble-ic">${svg('sos')}</div><strong>${t('Noch nichts erfasst')}</strong>${t('Fügen Sie zuerst Dokumente oder Angaben hinzu.')}</div>` : ''}
    ${listBlock('people')}${formBlock('daily')}
    ${groups.map(g => `<h2>${catName(g.c)}</h2><div class="list">${g.items.map(x => docRow(x, false)).join('')}</div>`).join('')}
    ${listBlock('finances')}${listBlock('contracts')}${formBlock('funeral')}
    ${trusted.length ? `<h2>${t('Vertrauenspersonen')}</h2><div class="card sum">${trusted.map(p => `<div class="sum-row"><span>${esc(t(p.relation))}</span><strong>${esc(p.name)}<small>${esc(p.contact)}</small></strong></div>`).join('')}</div>` : ''}
    <div class="stack" style="margin-top:22px"><button class="btn btn-soft" id="family-list">${svg('spark')} ${t('Checkliste für Angehörige')}</button></div>
  </section>`;
  $app.querySelectorAll('[data-open]').forEach(b => b.onclick = () => viewer(docs.find(d => d.id === b.dataset.open)));
  $app.querySelector('#family-list').onclick = () => { state.guideTab = 'lists'; state.listWho = 'family'; go('assistant'); };
};

/* ---------- Profil ---------- */
routes.profile = () => {
  const user = store.get('user');
  const link = (to, icon, label, sub) => `<button class="row" data-go="${to}"><span class="ico">${svg(icon)}</span><span class="meta"><strong>${label}</strong><small>${sub}</small></span>${chevron()}</button>`;
  const curLang = LANGS.find(l => l.id === lang());
  $app.innerHTML = `<section class="screen">
    <div class="profile-head"><span class="avatar-btn">${esc(initials(user.name))}</span><div><h1>${esc(user.name || t('Profil'))}</h1><small>${esc(user.email)} · ${t('via {x}', { x: esc(user.via) })}</small></div></div>
    <div class="privacy-badges" style="margin-top:12px"><span class="badge">${svg('check')} ${t('Daten nur auf diesem Gerät')}</span><span class="badge">${svg('check')} ${t('Kostenlos')}</span></div>
    <h2>${t('Schriftgrösse')}</h2>
    ${sizeSegment(store.get('size', 'normal'))}
    <h2>${t('Einstellungen')}</h2>
    <div class="list">
      <button class="row" id="lang"><span class="ico">${svg('globe')}</span><span class="meta"><strong>${t('Sprache')}</strong><small>${curLang.name}</small></span>${chevron()}</button>
      ${link('privacyInfo', 'lock', t('Datenschutz'), t('Alles bleibt auf Ihrem Gerät'))}
      ${link('help', 'info', t('Hilfe'), t("So funktioniert's"))}
      <button class="row" id="redo"><span class="ico">${svg('pen')}</span><span class="meta"><strong>${t('Fragen erneut beantworten')}</strong><small>${esc(user.profile?.age ? t(user.profile.age) : t('Alter'))} · ${esc(user.profile?.storage ? t(user.profile.storage) : t('Aufbewahrung'))}</small></span>${chevron()}</button>
    </div>
    <div class="stack" style="margin-top:22px">
      <button class="btn btn-outline" id="logout">${svg('logout')} ${t('Abmelden')}</button>
      <button class="btn btn-danger" id="wipe">${svg('trash')} ${t('Alle Daten löschen')}</button>
    </div></section>`;
  $app.querySelectorAll('[data-size]').forEach(b => b.onclick = () => { store.set('size', b.dataset.size); applySize(); go('profile'); });
  $app.querySelector('#lang').onclick = () => go('language', { from: 'profile' });
  $app.querySelector('#redo').onclick = () => { saveProfile({ onboarded: false }); go('onboarding', { step: 1 }); };
  $app.querySelector('#logout').onclick = () => { store.del('user'); state.chat = []; toast(t('Sie wurden abgemeldet')); go('login'); };
  $app.querySelector('#wipe').onclick = async () => {
    if (await confirmSheet({ title: t('Alle Daten löschen?'), text: t('Alle Dokumente, Angaben, Vertrauenspersonen und Ihr Konto werden von diesem Gerät entfernt.'), ok: t('Ja, alles löschen') })) {
      await db.clear(); ['user', 'contacts', 'size', 'ob_step', 'info', 'guideChecks', 'notify', 'notified'].forEach(k => store.del(k)); applySize();
      state.chat = []; toast(t('Alle Daten wurden gelöscht')); go('login');
    }
  };
};

routes.help = () => {
  $app.innerHTML = `<section class="screen">
    ${topbar('profile')}
    <h1>${t('Hilfe')}</h1>
    <p class="lead">${t('Lifely hilft Ihnen, wichtige Unterlagen zu ordnen, damit Ihre Angehörigen im Notfall alles finden.')}</p>
    <ol class="help-steps">
      <li><strong>${t('Dokument fotografieren')}</strong><span>${t('Tippen Sie auf «Dokument fotografieren». Mit einem Kommentar halten Sie fest, wo das Original liegt.')}</span></li>
      <li><strong>${t('Den Assistenten fragen')}</strong><span>${t('Tippen Sie unten in der Mitte auf «Assistent» und stellen Sie Ihre Frage.')}</span></li>
      <li><strong>${t('Vorsorge vervollständigen')}</strong><span>${t('Unter «Vorsorge» sehen Sie, was noch fehlt – z. B. Verträge, Banken oder Bestattungswünsche.')}</span></li>
      <li><strong>${t('Vertrauensperson bestimmen')}</strong><span>${t('Im Notfall kann diese Person Zugang anfragen. Sie haben 7 Tage Zeit, um zu widersprechen.')}</span></li>
    </ol>
    <div class="info warn">${svg('info')}<span>${t('Dies ist ein Prototyp für ein Studienprojekt. Bitte verwenden Sie keine echten Dokumente und geben Sie niemals Passwörter ein.')}</span></div>
  </section>`;
};

/* ---------- Vollbild-Ansicht ---------- */
function viewer(x) {
  const el = document.createElement('div');
  el.className = 'viewer';
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', x.title);
  const url = URL.createObjectURL(x.blob);
  el.innerHTML = `<div class="viewer-bar"><strong>${esc(x.title)}</strong><button class="btn btn-outline" data-close>${t('Schliessen')}</button></div>
    ${x.type === 'image' ? `<img src="${url}" alt="${esc(x.title)}">` : `<div class="pdf-box">${svg('file')}<span>${t('PDF-Dokument')}</span><a class="btn btn-primary" href="${url}" download="${esc(x.title)}.pdf">${t('PDF öffnen')}</a></div>`}
    ${x.note ? `<p class="viewer-note">${svg('note')}${esc(x.note)}</p>` : ''}`;
  const close = () => { URL.revokeObjectURL(url); el.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  el.querySelector('[data-close]').onclick = close;
  document.addEventListener('keydown', onKey);
  document.body.appendChild(el);
  el.querySelector('[data-close]').focus();
}

/* ---------- Start ---------- */
applySize();
applyLang();
splash();
const start = location.hash.slice(1);
go(routes[start] && !['code', 'add2', 'doc', 'section', 'intro', 'language'].includes(start) ? start : 'home');
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
