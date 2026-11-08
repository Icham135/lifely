/* Rundgang: kurzes Intro mit Scheinwerfer auf der Route «guide». LF.tour = { start(step), end() } */
(() => {
  const t = (s, v) => LF.t(s, v);
  // Schritte: sel = Ziel (Liste = der Reihe nach probieren), ohne sel = zentrierte Karte
  const STEPS = [
    { logo: true, title: 'Willkommen, {name}!', text: 'Willkommen, {name}! Ein kurzer Rundgang zeigt Ihnen, wo was ist. Er dauert etwa eine Minute.' },
    { sel: ['[data-tour="guide-modes"]', '[data-tab="guide"]'], title: 'Geführte Vorsorge', text: 'Geführte Vorsorge: Sie wählen, wie viel Zeit Sie haben (15, 30 oder 60 Minuten). Lifely führt Sie dann wie in einem Gespräch durch alles Wichtige. Ihre Antworten und Fotos werden automatisch im Dossier gespeichert.' },
    { sel: ['[data-tab="guide"]'], title: 'Zurück zum Start', text: 'Hier sind Sie immer wieder zurück am Start und können dort weitermachen, wo Sie aufgehört haben.' },
    { sel: ['[data-tab="dossier"]'], title: 'Mein Dossier', text: 'Mein Dossier: Alles, was Sie festgehalten haben, an einem Ort. Sie können es jederzeit selbst ansehen und ändern.' },
    { sel: ['[data-tab="profile"]'], title: 'Profil', text: 'Profil: Hier erstellen Sie einen Key. Mit dem Key kann eine Vertrauensperson Ihr Dossier ansehen, aber nichts ändern. Dort stellen Sie auch die Schriftgrösse ein.' },
    { title: 'Das war\'s!', text: 'Das war\'s! Wählen Sie jetzt, wie viel Zeit Sie haben, und legen Sie los.' },
  ];
  const N = STEPS.length, GAP = 14, PAD = 8, EDGE = 12;
  let step = 0, el = null, prevFocus = null, first = true, token = 0;
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const find = (s) => { for (const q of s.sel || []) { const n = document.querySelector(q); if (n && n.getClientRects().length) return n; } return null; };
  const isFixed = (n) => { for (; n && n !== document.body; n = n.parentElement) { const p = getComputedStyle(n).position; if (p === 'fixed' || p === 'sticky') return true; } return false; };
  const focusables = () => [...el.querySelectorAll('button:not([disabled])')];

  function onKey(e) {
    if (!el) return;
    if (e.key === 'Escape') { e.preventDefault(); end(); return; }
    if (e.key === 'Tab') { // Fokus-Falle
      const f = focusables(); if (!f.length) return;
      const a = document.activeElement, i = f.indexOf(a);
      if (i < 0) { e.preventDefault(); f[0].focus(); }
      else if (e.shiftKey && i === 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  }

  function build() {
    el = document.createElement('div');
    el.id = 'tour'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'tourT'); el.setAttribute('aria-describedby', 'tourP');
    el.innerHTML = '<div class="tspot"></div><div class="ttip"></div>';
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-tnext]')) return step < N - 1 ? show(step + 1) : end();
      if (e.target.closest('[data-tback]')) return show(step - 1);
      if (e.target.closest('[data-tskip]')) return end();
    });
    document.body.appendChild(el);
    document.body.classList.add('touring');
    addEventListener('keydown', onKey, true);
    addEventListener('resize', place);
    first = true;
  }

  function render() {
    const s = STEPS[step], last = step === N - 1;
    const name = LF.esc(LF.settings.name || '');
    const title = s.logo ? t('Willkommen, {name}!', { name: LF.settings.name || '' }) : t(s.title);
    const body = s.logo ? t('Ein kurzer Rundgang zeigt Ihnen, wo was ist. Er dauert etwa eine Minute.') : t(s.text);
    const tip = el.querySelector('.ttip');
    tip.innerHTML = `${s.logo ? '<img class="tlogo" src="icons/logo.svg" alt="">' : ''}
      <p class="tstep">${LF.esc(t('Schritt {x} von {y}', { x: step + 1, y: N }))}</p>
      <h2 id="tourT">${LF.esc(title)}</h2><p id="tourP" class="tbody">${LF.esc(body)}</p>
      <div class="tdots" aria-hidden="true">${STEPS.map((_, k) => `<i class="${k === step ? 'on' : ''}"></i>`).join('')}</div>
      <div class="tbtns${step ? '' : ' one'}">${step ? `<button class="btn ghost" data-tback>${LF.esc(t('Zurück'))}</button>` : ''}
        <button class="btn primary" data-tnext>${LF.esc(last ? t('Los geht\'s') : t('Weiter'))}</button></div>
      ${!last ? `<button class="link tskip" data-tskip>${LF.esc(step ? t('Rundgang beenden') : t('Überspringen'))}</button>` : ''}`;
    tip.classList.remove('swap'); void tip.offsetWidth; tip.classList.add('swap');
  }

  // Karte und Scheinwerfer platzieren; Karte immer ganz im Bild
  function place() {
    if (!el) return;
    const s = STEPS[step], spot = el.querySelector('.tspot'), tip = el.querySelector('.ttip');
    const target = find(s), vw = innerWidth, vh = innerHeight;
    el.classList.toggle('center', !target);
    const tw = Math.min(380, vw - 2 * EDGE);
    tip.style.width = tw + 'px';
    tip.style.maxHeight = (vh - 2 * EDGE) + 'px'; tip.classList.remove('tight');
    if (!target) { spot.style.cssText = ''; tip.style.left = tip.style.top = ''; return; }
    const fixed = isFixed(target);
    let r = target.getBoundingClientRect();
    // Karte zuerst normal messen; ist sie fürs Ziel zu hoch, kompakte Form (ohne Punkte/Kopfzeile)
    const fits = (k) => { tip.classList.toggle('tight', k); const h = tip.offsetHeight; return h; };
    let th = fits(false);
    const need = () => Math.max(r.top, vh - r.bottom) - PAD - GAP - EDGE;
    if (fixed ? th > need() : th > vh - 2 * EDGE - 40) th = fits(true);
    if (fixed && th > need()) { tip.style.maxHeight = Math.max(160, need()) + 'px'; th = tip.offsetHeight; }
    if (!fixed) { // Ziel in die Mitte holen (sofort, nicht animiert, sonst stimmen die Masse nicht)
      const room = vh - th - GAP - 2 * PAD - 2 * EDGE;
      if (r.height <= room) { if (r.top < EDGE + PAD || r.bottom > vh - EDGE - PAD) { scrollBy(0, r.top - (vh - r.height) / 2); r = target.getBoundingClientRect(); } }
    }
    let top, h = r.height;
    const below = r.bottom + PAD + GAP, above = r.top - PAD - GAP - th;
    if (below + th <= vh - EDGE) top = below;
    else if (above >= EDGE) top = above;
    else { // weder oben noch unten Platz: Karte unten andocken, Ziel nach oben, Scheinwerfer nur auf den sichtbaren Teil
      top = vh - th - EDGE;
      if (!fixed) { scrollBy(0, r.top - EDGE - PAD); r = target.getBoundingClientRect(); }
      if (!fixed) h = Math.max(6, Math.min(r.height, top - r.top - 2 * PAD - 6));
    }
    const sl = Math.max(4, r.left - PAD), sw = Math.min(vw - 8, r.width + 2 * PAD);
    Object.assign(spot.style, { left: sl + 'px', top: Math.max(4, r.top - PAD) + 'px', width: sw + 'px', height: h + 2 * PAD + 'px' });
    tip.style.left = Math.min(Math.max(EDGE, r.left + r.width / 2 - tw / 2), vw - tw - EDGE) + 'px';
    tip.style.top = Math.max(EDGE, top) + 'px';
  }

  async function show(i) {
    const my = ++token;
    step = Math.max(0, Math.min(N - 1, i));
    if (!el) { prevFocus = document.activeElement; build(); }
    if (location.hash.replace(/^#\/?/, '').split('/')[0] !== 'guide') LF.go('guide');
    render();
    // auf das Ziel warten (Route kann noch zeichnen)
    for (let k = 0; k < 20 && STEPS[step].sel && !find(STEPS[step]); k++) await new Promise((r) => setTimeout(r, 100));
    if (my !== token || !el) return;
    if (first) { el.classList.add('noanim'); }
    place();
    if (first) { void el.offsetWidth; requestAnimationFrame(() => el && el.classList.remove('noanim')); first = false; }
    el.querySelector('[data-tnext]').focus({ preventScroll: true });
    // nach dem Scrollen/Umbruch nochmals prüfen
    setTimeout(() => { if (my === token) place(); }, 360);
  }

  function start(i = 0) {
    if (el) return show(i);
    const onGuide = location.hash.replace(/^#\/?/, '').split('/')[0] === 'guide';
    if (!onGuide) { LF.go('guide'); setTimeout(() => show(i), 300); } else show(i);
  }

  function end() {
    token++;
    if (el) { el.remove(); el = null; }
    document.body.classList.remove('touring');
    removeEventListener('keydown', onKey, true);
    removeEventListener('resize', place);
    LF.settings.tourDone = true; LF.saveSettings();
    try { prevFocus && prevFocus.isConnected && prevFocus.focus({ preventScroll: true }); } catch (e) {}
    prevFocus = null;
  }

  LF.tour = { start, end };
})();
