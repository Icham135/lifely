/* Lifely – Sprache, Anmeldung, Key eingeben, Einrichten (Agent «auth»). */
(() => {
  const LF = window.LF, t = LF.t, esc = LF.esc;
  const ic = (d) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const I = {
    check: ic('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    lock: ic('<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 018 0v3"/>'),
    key: ic('<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8m-3 3l2.5 2.5M14 9l2 2"/>'),
    back: ic('<path d="M15 5l-7 7 7 7"/>'),
  };
  const LANGS = [{ id: 'de', name: 'Deutsch' }, { id: 'fr', name: 'Français' }, { id: 'en', name: 'English' }, { id: 'it', name: 'Italiano' }];
  const logo = (cls = 'authlogo') => `<img class="${cls}" src="icons/logo.svg" alt="">`;
  const $ = (s, r = LF.app) => r.querySelector(s);
  const KEY_RE = /^LIFE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

  let mode = 'in';
  /* ---------- Laden ---------- */
  // Hinweis bei langer Wartezeit (nach 8 s): freundlicher Text mit zwei Knöpfen
  const slowHtml = () => `<div class="auth-slow" role="status"><p>${esc(t('Das dauert länger als gewöhnlich.'))}</p>
    <div class="stack"><button type="button" class="btn primary" data-slow="reload">${esc(t('Nochmals versuchen'))}</button>
    <button type="button" class="btn ghost" data-slow="login">${esc(t('Anmelden'))}</button></div></div>`;
  const slowShow = (host) => {
    if (!host || host.querySelector('.auth-slow')) return;
    host.insertAdjacentHTML('beforeend', slowHtml());
    host.querySelectorAll('[data-slow]').forEach(b => b.onclick = () => { if (b.dataset.slow === 'reload') location.reload(); else { mode = 'in'; LF.go('login'); } });
  };
  LF.routes.loading = () => {
    LF.app.innerHTML = `<section class="screen auth-load" aria-busy="true">${logo('authlogo big')}
      <div class="wm big">Lifely</div><div class="auth-dots" aria-hidden="true"><i></i><i></i><i></i></div>
      <p class="sr" role="status">${esc(t('Lifely wird geladen …'))}</p><div id="aslowl"></div></section>`;
    setTimeout(() => slowShow(document.getElementById('aslowl')), 8000);
  };

  /* ---------- Sprache ---------- */
  LF.routes.language = () => {
    const cur = LF.settings.lang || 'de';
    LF.app.innerHTML = `<section class="screen auth">
      <div class="auth-hero">${logo()}</div>
      <h1 tabindex="-1" class="center">Sprache · Langue · Language · Lingua</h1>
      <p class="lead center">Bitte wählen · Veuillez choisir · Please choose · Si prega di scegliere</p>
      <div class="stack" role="radiogroup" aria-label="Sprache">
        ${LANGS.map(l => `<button type="button" class="choice" role="radio" data-lang="${l.id}" aria-checked="${cur === l.id}" lang="${l.id}"><span>${l.name}</span>${cur === l.id ? I.check : ''}</button>`).join('')}
      </div></section>`;
    LF.app.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => {
      LF.settings.lang = b.dataset.lang;
      try { localStorage.setItem('lifely_lang', b.dataset.lang); } catch (e) {}
      LF.saveSettings();
      LF.go('login');
    });
  };

  /* ---------- Anmelden / Registrieren ---------- */
    LF.routes.login = () => {
    const up = mode === 'up';
    LF.app.innerHTML = `<section class="screen auth">
      <div class="auth-hero">${logo()}<h1 tabindex="-1">${esc(t('Willkommen bei Lifely'))}</h1>
        <p class="lead">${esc(t('Ihre Vorsorge, Schritt für Schritt geordnet.'))}</p></div>
      <div class="seg" role="group" aria-label="${esc(t('Anmelden oder registrieren'))}">
        <button type="button" data-mode="in" aria-pressed="${!up}">${esc(t('Anmelden'))}</button>
        <button type="button" data-mode="up" aria-pressed="${up}">${esc(t('Registrieren'))}</button></div>
      <form id="af" class="stack auth-form" novalidate>
        <label class="field">${esc(t('Ihre E-Mail-Adresse'))}
          <input class="in" id="am" type="email" inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false" placeholder="name@example.ch" required></label>
        <div class="field"><label for="ap">${esc(t('Passwort'))}</label>
          <div class="pwrap"><input class="in" id="ap" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" minlength="8" required>
            <button type="button" class="pwshow" id="ash" aria-pressed="false">${esc(t('Anzeigen'))}</button></div>
          ${up ? `<span class="tiny">${esc(t('Wählen Sie ein Passwort mit mindestens 8 Zeichen'))}</span>` : ''}</div>
        <p class="auth-err" id="aerr" role="alert" hidden></p>
        <div id="aslow"></div>
        <button class="btn primary" id="asub" type="submit">${esc(up ? t('Konto erstellen') : t('Anmelden'))}</button>
      </form>
      <div class="card mint auth-key"><div class="spread left">${I.key}<b>${esc(t('Sie haben einen Key?'))}</b></div>
        <p class="tiny" style="color:inherit;margin:6px 0 12px">${esc(t('Sie möchten das Dossier einer Person ansehen? Geben Sie den Key ein, den Sie bekommen haben.'))}</p>
        <button type="button" class="btn ghost" id="akey">${esc(t('Ich habe einen Key'))}</button></div>
      <p class="fine center">${esc(t('Prototyp einer Projektarbeit der BFH. Bitte nur Testdaten verwenden.'))}</p>
      <p class="center"><button type="button" class="link" id="alang">${esc(t('Sprache ändern'))}</button></p></section>`;
    LF.app.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => {
      const m = b.dataset.mode; if (m === mode) return;
      const e = $('#am').value; mode = m; LF.routes.login(); $('#am').value = e;
    });
    $('#ash').onclick = (ev) => {
      const p = $('#ap'), show = p.type === 'password';
      p.type = show ? 'text' : 'password';
      ev.currentTarget.textContent = show ? t('Verbergen') : t('Anzeigen');
      ev.currentTarget.setAttribute('aria-pressed', show);
    };
    $('#akey').onclick = () => LF.go('key');
    $('#alang').onclick = () => LF.go('language');
    const err = (m) => { const e = $('#aerr'); e.textContent = m; e.hidden = !m; };
    $('#af').onsubmit = async (ev) => {
      ev.preventDefault();
      const em = $('#am').value.trim(), pw = $('#ap').value;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { err(t('Bitte geben Sie eine gültige E-Mail-Adresse ein.')); $('#am').focus(); return; }
      if (pw.length < 8) { err(t('Das Passwort braucht mindestens 8 Zeichen.')); $('#ap').focus(); return; }
      err('');
      const btn = $('#asub'), label = btn.textContent;
      btn.disabled = true; btn.textContent = up ? t('Konto wird erstellt …') : t('Sie werden angemeldet …');
      const slowT = setTimeout(() => { const b = $('#asub'); if (b && b.disabled) slowShow($('#aslow')); }, 8000);
      try { await (up ? LF.auth.signUp(em, pw) : LF.auth.signIn(em, pw)); clearTimeout(slowT); }
      catch (e) {
        clearTimeout(slowT); const sl = $('#aslow'); if (sl) sl.innerHTML = '';
        const b = $('#asub'); if (!b) return; // Seite schon gewechselt
        err(e.message || t('Das hat leider nicht geklappt. Bitte versuchen Sie es nochmals.'));
        b.disabled = false; b.textContent = label;
      }
    };
  };

  /* ---------- Key eingeben ---------- */
  // Eingabe in Form LIFE-XXXX-XXXX-XXXX bringen (Zeichen ohne I, L, O)
  const fmtKey = (v) => {
    let r = String(v).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (r.startsWith('LIFE')) r = r.slice(4);
    else if (r.length < 4 && 'LIFE'.startsWith(r)) return r; // «L», «LI», «LIF»: die ersten Buchstaben von LIFE noch zu Ende tippen (echte Keys enthalten kein L oder I)
    r = r.slice(0, 12);
    return r ? 'LIFE-' + (r.match(/.{1,4}/g) || []).join('-') : '';
  };
  LF.routes.key = () => {
    LF.app.innerHTML = `<section class="screen auth">
      ${LF.back('login', t('Zurück'))}
      <h1 tabindex="-1">${esc(t('Key eingeben'))}</h1>
      <p class="lead">${esc(t('Geben Sie den Key ein, den Sie bekommen haben. Er sieht so aus: LIFE-XXXX-XXXX-XXXX'))}</p>
      <form id="kf" class="stack" novalidate>
        <label class="field">${esc(t('Ihr Key'))}
          <input class="in keyin" id="kk" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" placeholder="LIFE-XXXX-XXXX-XXXX" maxlength="40"></label>
        <p class="auth-err" id="kerr" role="alert" hidden></p>
        <button class="btn primary" id="ksub" type="submit">${esc(t('Dossier ansehen'))}</button>
      </form>
      <div class="note">${I.lock}<span>${esc(t('Sie können das Dossier nur ansehen, nichts ändern.'))}</span></div></section>`;
    const inp = $('#kk'), err = (m) => { const e = $('#kerr'); e.textContent = m; e.hidden = !m; };
    inp.addEventListener('input', () => { inp.value = fmtKey(inp.value); err(''); });
    inp.addEventListener('paste', (e) => { e.preventDefault(); inp.value = fmtKey((e.clipboardData || window.clipboardData).getData('text')); err(''); });
    $('#kf').onsubmit = async (ev) => {
      ev.preventDefault();
      if (!KEY_RE.test(inp.value)) { err(t('Der Key ist noch nicht vollständig. Er besteht aus LIFE und 12 Zeichen.')); inp.focus(); return; }
      err('');
      const btn = $('#ksub'), label = btn.textContent;
      btn.disabled = true; btn.textContent = t('Wird geprüft …');
      try { await LF.viewerOpen(inp.value); LF.go('view'); }
      catch (e) {
        const b = $('#ksub'); if (!b) return;
        err(e.message || t('Das hat leider nicht geklappt. Bitte versuchen Sie es nochmals.'));
        b.disabled = false; b.textContent = label;
      }
    };
  };

  /* ---------- Einrichten (3 Schritte) ---------- */
  const dots = (n) => `<div class="dots" role="img" aria-label="${esc(t('Schritt {n} von 3', { n }))}">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`;
  const POINTS = () => [
    t('Ihre Daten liegen verschlüsselt auf einem Server in der Schweiz (Zürich). Andere sehen sie nur, wenn Sie einen Key weitergeben.'),
    t('Sie können alles jederzeit ändern und das Konto samt Daten löschen.'),
    t('Wenn Sie die KI (künstliche Intelligenz, ein Computerprogramm, das Fragen beantwortet) um Hilfe bitten, geht nur der Text Ihrer Frage an einen KI-Dienst in den USA (Groq), nie Ihre Dokumente oder Fotos.'),
    t('Lifely ist kein Rechtsdokument und kein Ersatz für Beratung.'),
    t('Das ist ein Prototyp. Bitte tragen Sie nur Testdaten ein.'),
    t('Bitte tragen Sie keine Passwörter ein.'),
  ];
  LF.routes.setup = (arg) => {
    const n = Math.min(3, Math.max(1, parseInt(arg, 10) || 1));
    const back = n > 1 ? LF.back('setup/' + (n - 1), t('Zurück')) : '';
    let body = '';
    if (n === 1) body = `<h1 tabindex="-1">${esc(t('Ihre Daten gehören Ihnen'))}</h1>
      <p class="lead">${esc(t('Bitte lesen Sie kurz, wie Lifely mit Ihren Daten umgeht.'))}</p>
      <ul class="checks">${POINTS().map(p => `<li>${I.check}<span>${esc(p)}</span></li>`).join('')}</ul>
      <div class="bottom"><button class="btn primary" id="snext">${esc(t('Einverstanden, weiter'))}</button></div>`;
    if (n === 2) body = `<h1 tabindex="-1">${esc(t('Wie dürfen wir Sie ansprechen?'))}</h1>
      <p class="lead">${esc(t('Wir verwenden Ihren Vornamen, damit Lifely persönlicher wird.'))}</p>
      <form id="sf" class="stack" novalidate>
        <label class="field">${esc(t('Ihr Vorname'))}
          <input class="in" id="sn" type="text" autocomplete="given-name" autocapitalize="words" maxlength="40" value="${esc(LF.settings.name || '')}" required></label>
        <p class="auth-err" id="serr" role="alert" hidden></p>
        <button class="btn primary" type="submit">${esc(t('Weiter'))}</button></form>`;
    if (n === 3) body = `<h1 tabindex="-1">${esc(t('Wie gut können Sie diesen Text lesen?'))}</h1>
      <p class="lead">${esc(t('Wählen Sie die Schriftgrösse, die für Sie angenehm ist. Sie können sie später im Profil ändern.'))}</p>
      ${LF.sizeSeg()}
      <div class="card sun auth-prev"><b>${esc(t('So sieht der Text aus'))}</b>
        <p>${esc(t('Hier steht ein Beispiel. Ist die Schrift gross genug, dann ist alles gut.'))}</p></div>
      <div class="bottom"><button class="btn primary" id="sdone">${esc(t('Fertig'))}</button></div>`;
    LF.app.innerHTML = `<section class="screen auth">${back}${dots(n)}${body}</section>`;
    if (n === 1) $('#snext').onclick = () => { LF.settings.consented = true; LF.saveSettings(); LF.go('setup/2'); };
    if (n === 2) {
      const inp = $('#sn');
      $('#sf').onsubmit = (ev) => {
        ev.preventDefault();
        const v = inp.value.trim();
        if (!v) { const e = $('#serr'); e.textContent = t('Bitte geben Sie Ihren Vornamen ein.'); e.hidden = false; inp.focus(); return; }
        LF.settings.name = v; LF.saveSettings(); LF.go('setup/3');
      };
    }
    if (n === 3) {
      LF.bindSize(LF.app);
      $('#sdone').onclick = () => {
        LF.settings.setupDone = true; LF.saveSettings();
        LF.go('guide'); setTimeout(() => LF.tour.start(0), 400);
      };
    }
  };
})();
