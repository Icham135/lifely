/* Lifely – Umfrage. Fragen aus fragen.js, Antworten gehen ans Google-Formular (google.js). */
const $s = document.getElementById('survey');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const OTHER = 'Sonstiges';
const KEY = 'lifely_umfrage';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch {} };
// Zustand: Antworten, besuchte Abschnitte, aktueller Abschnitt (-1 = Einführung, 'done' = fertig)
const st = Object.assign({ a: {}, other: {}, path: [], cur: -1, order: null }, load());
const secIndex = (id) => SURVEY.sections.findIndex(s => s.id === id);

// Reihenfolge der Optionen bei «shuffle» einmal pro Person mischen («Keine …» bleibt am Schluss)
if (!st.order) {
  st.order = {};
  SURVEY.sections.forEach(s => s.questions.filter(q => q.shuffle).forEach(q => {
    const last = q.opts.filter(o => /^Keine/.test(o)), rest = q.opts.filter(o => !last.includes(o));
    for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
    st.order[q.k] = [...rest, ...last];
  }));
}
const optsOf = (q) => st.order[q.k] || q.opts;

const ic = {
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  next: '<path d="M9 6l6 6-6 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  phone: '<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M11 18.5h2"/>',
};
const svg = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ic[n]}</svg>`;

/* ---------- Einführung mit kurzer App-Erklärung ---------- */
function intro() {
  const [p1, p2, , p4] = SURVEY.intro.split('\n\n');
  const shots = [['start', 'Startseite mit Assistent'], ['dokumente', 'Dokumente nach Themen'], ['vorsorge', 'Übersicht: Was fehlt noch?'], ['notfall', 'Notfall-Ansicht für Angehörige']];
  $s.innerHTML = `<section class="sv intro">
    <p class="eyebrow">Umfrage · Berner Fachhochschule BFH</p>
    <h1>Wie sorgen Sie für den Ernstfall vor?</h1>
    <p class="lead">${esc(p1)}</p>
    <div class="facts"><span>${svg('clock')} 6–10 Minuten</span><span>${svg('lock')} anonym</span></div>
    <div class="about">
      <h2>Darum geht es: Lifely</h2>
      <p>${esc(p2)}</p>
      <div class="shots" tabindex="0" aria-label="Bilder der App">
        ${shots.map(([f, c]) => `<figure><div class="phone"><img src="../img/screen-${f}.jpg" alt="${c}" loading="lazy"></div><figcaption>${c}</figcaption></figure>`).join('')}
      </div>
      <a class="text-link" href="../app/" target="_blank" rel="noopener">${svg('phone')} App selbst ausprobieren (öffnet neues Fenster)</a>
    </div>
    <p class="fine">${esc(p4).replace(SURVEY.contact, `<a href="mailto:${SURVEY.contact}">${SURVEY.contact}</a>`)}</p>
    <div class="actions"><button class="pill primary big" id="go">${Object.keys(st.a).length ? 'Umfrage fortsetzen' : 'Umfrage starten'} ${svg('next')}</button></div>
  </section>`;
  $s.querySelector('#go').onclick = () => { if (!st.path.length) st.path = ['s1']; show(st.path.at(-1)); };
}

/* ---------- Ein Abschnitt ---------- */
function field(q, n) {
  const v = st.a[q.k];
  const req = q.req ? '<span class="req" aria-hidden="true">*</span>' : '';
  const head = `<legend><span class="qn">${n}</span><span>${esc(q.t)}${req}</span></legend>${q.max ? `<p class="hint">Höchstens ${q.max} auswählen</p>` : q.hint ? `<p class="hint">${esc(q.hint)}</p>` : q.type === 'check' ? '<p class="hint">Mehrere Antworten möglich</p>' : ''}`;
  let body = '';
  if (q.type === 'radio' || q.type === 'check') {
    const multi = q.type === 'check';
    const list = [...optsOf(q), ...(q.other ? [OTHER] : [])];
    body = `<div class="opts">${list.map(o => {
      const on = multi ? (v || []).includes(o) : v === o;
      return `<button type="button" class="opt ${multi ? 'multi' : ''}" role="${multi ? 'checkbox' : 'radio'}" aria-checked="${on}" data-q="${q.k}" data-v="${esc(o)}"><span class="box">${svg('check')}</span><span>${esc(o)}</span></button>`;
    }).join('')}</div>`;
    if (q.other) body += `<input class="in other" data-other="${q.k}" placeholder="Bitte beschreiben …" value="${esc(st.other[q.k] || '')}" ${(multi ? (v || []).includes(OTHER) : v === OTHER) ? '' : 'hidden'} aria-label="Sonstiges, bitte beschreiben">`;
  }
  if (q.type === 'text') body = `<textarea class="in" rows="4" data-text="${q.k}" placeholder="Ihre Antwort (freiwillig)">${esc(v || '')}</textarea>`;
  if (q.type === 'short') body = `<input class="in" data-text="${q.k}" placeholder="Ihre Antwort (freiwillig)" value="${esc(v || '')}">`;
  if (q.type === 'scale') body = `<div class="scale" role="radiogroup">${[1, 2, 3, 4, 5].map(i => `<button type="button" class="sc" role="radio" aria-checked="${v === i}" data-q="${q.k}" data-n="${i}">${i}</button>`).join('')}</div>
    <div class="scale-labels"><span>1 = ${esc(q.low)}</span><span>5 = ${esc(q.high)}</span></div>`;
  return `<fieldset class="q" id="q-${q.k}" role="${q.type === 'check' ? 'group' : 'radiogroup'}">${head}${body}<p class="err" hidden></p></fieldset>`;
}

function numberOf(k) { // fortlaufende Nummer über alle Abschnitte
  let n = 0;
  for (const s of SURVEY.sections) for (const q of s.questions) { n++; if (q.k === k) return n; }
}

function show(id) {
  st.cur = id; save();
  const sec = SURVEY.sections[secIndex(id)];
  const total = SURVEY.sections.length, idx = secIndex(id);
  const last = idx === total - 1;
  $s.innerHTML = `<section class="sv">
    <div class="progress"><div class="bar"><span style="width:${Math.round((idx + 1) / total * 100)}%"></span></div><p>Abschnitt ${idx + 1} von ${total}</p></div>
    <h1>${esc(sec.title)}</h1>
    ${sec.desc ? `<p class="lead">${esc(sec.desc)}</p>` : ''}
    <form id="f" novalidate>${sec.questions.map(q => field(q, numberOf(q.k))).join('')}
      <div class="actions row">
        <button type="button" class="pill soft" id="back">${svg('back')} Zurück</button>
        <button type="submit" class="pill primary" id="next">${last ? 'Absenden' : 'Weiter'} ${last ? svg('check') : svg('next')}</button>
      </div>
    </form>
    <p class="fine center">Fragen mit <span class="req">*</span> sind Pflichtfragen.</p>
  </section>`;
  window.scrollTo(0, 0);
  bind(sec, id, last);
  $s.querySelector('h1').focus?.();
}

function bind(sec, id, last) {
  const f = $s.querySelector('#f');
  f.addEventListener('click', (e) => {
    const b = e.target.closest('.opt, .sc'); if (!b) return;
    const q = sec.questions.find(x => x.k === b.dataset.q);
    if (b.classList.contains('sc')) st.a[q.k] = +b.dataset.n;
    else if (q.type === 'radio') st.a[q.k] = b.dataset.v;
    else {
      const cur = st.a[q.k] || [];
      const v = b.dataset.v;
      if (cur.includes(v)) st.a[q.k] = cur.filter(x => x !== v);
      else if (q.max && cur.length >= q.max) return flash(q, `Bitte höchstens ${q.max} Antworten auswählen.`);
      else st.a[q.k] = [...cur, v];
    }
    refresh(q); save();
  });
  f.addEventListener('input', (e) => {
    if (e.target.dataset.text) st.a[e.target.dataset.text] = e.target.value;
    if (e.target.dataset.other) st.other[e.target.dataset.other] = e.target.value;
    save();
  });
  $s.querySelector('#back').onclick = () => {
    const i = st.path.indexOf(id);
    if (i <= 0) { st.cur = -1; save(); return intro(); }
    show(st.path[i - 1]);
  };
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const missing = sec.questions.filter(q => q.req && !answered(q));
    sec.questions.forEach(q => flash(q, ''));
    missing.forEach(q => flash(q, 'Bitte beantworten Sie diese Frage.'));
    if (missing.length) return $s.querySelector('#q-' + missing[0].k).scrollIntoView({ behavior: 'smooth', block: 'center' });
    const badOther = sec.questions.find(q => q.other && isOther(q) && !(st.other[q.k] || '').trim());
    if (badOther) { flash(badOther, 'Bitte beschreiben Sie «Sonstiges» kurz.'); return $s.querySelector('#q-' + badOther.k).scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    if (last) return submit();
    // Verzweigung: Frage mit «next» bestimmt den nächsten Abschnitt
    const branchQ = sec.questions.find(q => q.next);
    const nextId = branchQ ? branchQ.next[st.a[branchQ.k]] : SURVEY.sections[secIndex(id) + 1].id;
    st.path = [...st.path.slice(0, st.path.indexOf(id) + 1), nextId];
    show(nextId);
  });
}
const isOther = (q) => q.type === 'check' ? (st.a[q.k] || []).includes(OTHER) : st.a[q.k] === OTHER;
const answered = (q) => { const v = st.a[q.k]; return Array.isArray(v) ? v.length > 0 : v !== undefined && String(v).trim() !== ''; };
function refresh(q) {
  const box = $s.querySelector('#q-' + q.k);
  box.querySelectorAll('.opt, .sc').forEach(b => {
    const v = st.a[q.k];
    b.setAttribute('aria-checked', b.classList.contains('sc') ? v === +b.dataset.n : Array.isArray(v) ? v.includes(b.dataset.v) : v === b.dataset.v);
  });
  const o = box.querySelector('[data-other]');
  if (o) { o.hidden = !isOther(q); if (!o.hidden && document.activeElement?.closest('.opt')?.dataset.v === OTHER) o.focus(); }
  flash(q, '');
}
function flash(q, msg) { const e = $s.querySelector(`#q-${q.k} .err`); if (!e) return; e.textContent = msg; e.hidden = !msg; $s.querySelector('#q-' + q.k).classList.toggle('bad', !!msg); }

/* ---------- Absenden ans Google-Formular ---------- */
async function submit() {
  const g = window.LIFELY_GFORM;
  const btn = $s.querySelector('#next');
  if (!g) { alertBox('Die Umfrage ist noch nicht freigeschaltet. Bitte versuchen Sie es später nochmals.'); return; }
  btn.disabled = true; btn.textContent = 'Wird gesendet …';
  const p = new URLSearchParams();
  const visited = new Set(st.path);
  SURVEY.sections.filter(s => visited.has(s.id)).forEach(s => s.questions.forEach(q => {
    const id = g.ids[q.k], v = st.a[q.k];
    if (!id || v === undefined || v === '' || (Array.isArray(v) && !v.length)) return;
    (Array.isArray(v) ? v : [v]).forEach(x => {
      if (x === OTHER) { p.append(`entry.${id}`, '__other_option__'); p.append(`entry.${id}.other_option_response`, (st.other[q.k] || '').trim()); }
      else p.append(`entry.${id}`, String(x).trim());
    });
  }));
  p.append('pageHistory', st.path.map(secIndex).join(','));
  try {
    await fetch(g.action, { method: 'POST', mode: 'no-cors', body: p });
    try { localStorage.removeItem(KEY); localStorage.setItem(KEY + '_done', '1'); } catch {}
    done();
  } catch {
    btn.disabled = false; btn.textContent = 'Nochmals senden';
    alertBox('Die Antworten konnten nicht gesendet werden. Bitte prüfen Sie die Internetverbindung und versuchen Sie es nochmals.');
  }
}
function alertBox(msg) {
  let el = $s.querySelector('.alert');
  if (!el) { el = document.createElement('p'); el.className = 'alert'; el.setAttribute('role', 'alert'); $s.querySelector('.actions').before(el); }
  el.textContent = msg;
}
function done() {
  $s.innerHTML = `<section class="sv thanks">
    <span class="done-mark">${svg('check')}</span>
    <h1>${esc(SURVEY.thanks)}</h1>
    <p class="lead">Ihre Antworten helfen uns, Lifely so zu entwickeln, dass es im Ernstfall wirklich hilft.</p>
    <div class="actions"><a class="pill primary big" href="../app/">Lifely ausprobieren</a><a class="pill soft big" href="../">Mehr über Lifely</a></div>
  </section>`;
  window.scrollTo(0, 0);
}

if (st.cur === -1 || !SURVEY.sections.some(s => s.id === st.cur)) intro(); else show(st.cur);
