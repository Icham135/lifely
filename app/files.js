/* Lifely – Fotos und PDFs: Liste mit Hinzufügen/Öffnen/Löschen (files.js), Nur-lesen-Vorschau und Vollbild-Ansicht. */
(() => {
  const LF = window.LF = window.LF || {};
  LF.ui = LF.ui || {};
  const t = (s, v) => (LF.t ? LF.t(s, v) : s);
  const esc = (s) => (LF.esc ? LF.esc(s) : String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const MAX = 10 * 1024 * 1024;
  const isImg = (f) => /^image\//.test(f.type || '') || /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(f.name || '');
  const isPdf = (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name || '');
  const ic = (d, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICON = {
    cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    file: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/>',
    pdf: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 15h6M9 18h4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    spin: '<path d="M12 3a9 9 0 1 0 9 9"/>',
    img: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
  };

  // Signierte URLs kurz merken (laufen nach einer Weile ab)
  const cache = new Map();
  const getUrl = (ref, urlFn) => {
    if (urlFn) return Promise.resolve(urlFn(ref));
    const c = cache.get(ref.path);
    if (c && Date.now() - c.at < 20 * 60e3) return c.p;
    const p = Promise.resolve(LF.fileUrl(ref));
    cache.set(ref.path, { at: Date.now(), p });
    p.catch(() => cache.delete(ref.path));
    return p;
  };
  const sizeTxt = (n) => !n ? '' : n < 1024 * 1024 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB';

  // Miniatur (Knopf): Bild wird später durch loadThumbs gesetzt
  function thumb(f, i, opts = {}) {
    const img = isImg(f);
    return `<div class="fl-item${opts.del ? ' has-del' : ''}">
      <button type="button" class="fl-th ${img ? 'is-img skel' : 'is-pdf'}" data-path="${esc(f.path)}" data-i="${i}" aria-label="${esc(t('Öffnen:') + ' ' + (f.name || ''))}">
        ${img ? '' : ic(ICON.pdf)}<span class="fl-name">${esc(f.name || (img ? t('Foto') : 'PDF'))}</span>
      </button>
      ${opts.del ? `<button type="button" class="fl-del" data-del="${i}" aria-label="${esc(t('Löschen:') + ' ' + (f.name || ''))}">${ic(ICON.trash)}<span>${esc(t('Löschen'))}</span></button>` : ''}
    </div>`;
  }

  // Bilder der Miniaturen laden (lazy per IntersectionObserver)
  function loadThumbs(root, files, urlFn) {
    const byPath = new Map(files.map(f => [f.path, f]));
    const load = (btn) => {
      const f = byPath.get(btn.dataset.path);
      if (!f || !btn.classList.contains('is-img') || btn.dataset.loaded) return;
      btn.dataset.loaded = '1';
      getUrl(f, urlFn).then(url => {
        const im = new Image();
        im.alt = ''; im.decoding = 'async';
        im.onload = () => { btn.classList.remove('skel'); btn.prepend(im); requestAnimationFrame(() => im.classList.add('on')); };
        im.onerror = () => { btn.classList.remove('skel'); btn.classList.add('broken'); btn.insertAdjacentHTML('afterbegin', ic(ICON.img)); };
        im.src = url;
      }).catch(() => { btn.classList.remove('skel'); btn.classList.add('broken'); btn.insertAdjacentHTML('afterbegin', ic(ICON.img)); });
    };
    const btns = [...root.querySelectorAll('.fl-th.is-img')];
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); load(e.target); } }), { rootMargin: '200px' });
      btns.forEach(b => io.observe(b));
    } else btns.forEach(load);
  }

  // Vollbild-Ansicht: Bild gross, PDF als Link; Escape/Schliessen, Fokus-Falle
  function open(f, urlFn) {
    const opener = document.activeElement;
    const el = document.createElement('div');
    el.className = 'fl-full';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', f.name || t('Datei'));
    const img = isImg(f);
    el.innerHTML = `<div class="fl-bar"><strong class="fl-title">${esc(f.name || '')}</strong><button type="button" class="btn white small" data-close>${esc(t('Schliessen'))}</button></div>
      <div class="fl-body">${img ? `<div class="fl-ld skel" aria-hidden="true"></div>` : `<div class="fl-pdf">${ic(ICON.pdf)}<p>${esc(f.name || 'PDF')}</p><a class="btn primary" target="_blank" rel="noopener" data-pdf hidden>${esc(t('PDF öffnen'))}</a><p class="tiny fl-wait">${esc(t('Einen Moment bitte …'))}</p></div>`}</div>`;
    document.body.appendChild(el);
    document.body.classList.add('fl-lock');
    requestAnimationFrame(() => el.classList.add('on'));
    const close = () => { document.removeEventListener('keydown', key, true); el.remove(); document.body.classList.remove('fl-lock'); try { opener && opener.focus && opener.focus(); } catch (e) {} };
    const key = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
      if (e.key === 'Tab') { // Fokus-Falle
        const fs = [...el.querySelectorAll('button:not([hidden]),a[href]:not([hidden])')];
        if (!fs.length) { e.preventDefault(); return; }
        const first = fs[0], last = fs[fs.length - 1];
        if (e.shiftKey && (document.activeElement === first || !el.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || !el.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', key, true);
    el.querySelector('[data-close]').onclick = close;
    el.querySelector('[data-close]').focus();
    getUrl(f, urlFn).then(url => {
      if (!el.isConnected) return;
      if (img) {
        const im = new Image(); im.alt = f.name || '';
        im.onload = () => { const ld = el.querySelector('.fl-ld'); if (ld) ld.replaceWith(im); requestAnimationFrame(() => im.classList.add('on')); };
        im.onerror = () => { const ld = el.querySelector('.fl-ld'); if (ld) ld.outerHTML = `<p class="fl-err">${esc(t('Das Bild konnte nicht geladen werden.'))}</p>`; };
        im.src = url;
      } else {
        const a = el.querySelector('[data-pdf]'); a.href = url; a.hidden = false;
        el.querySelector('.fl-wait')?.remove();
      }
    }).catch(() => { const w = el.querySelector('.fl-ld,.fl-wait'); if (w) w.outerHTML = `<p class="fl-err">${esc(t('Die Datei konnte nicht geladen werden.'))}</p>`; });
    return close;
  }
  LF.ui.openFile = open;

  // Nur-lesen-HTML (Bild-src wird erst durch bindFiles gesetzt)
  LF.ui.filesHtml = (files = [], opts = {}) => {
    if (!files || !files.length) return '';
    return `<div class="fl-grid fl-ro" data-fl-ro>${files.map((f, i) => thumb(f, i)).join('')}</div>`;
  };
  // Klicks und Bilder in root aktivieren (Elemente aus filesHtml)
  LF.ui.bindFiles = (root, opts = {}) => {
    if (!root) return;
    const urlFn = opts.urlFn;
    root.querySelectorAll('[data-fl-ro]').forEach(grid => {
      if (grid.dataset.bound) return;
      grid.dataset.bound = '1';
      // Dateiverweise aus data-path; Name/Typ aus Beschriftung und Miniatur-Art rekonstruieren
      const files = [...grid.querySelectorAll('.fl-th')].map(b => ({ path: b.dataset.path, name: b.querySelector('.fl-name')?.textContent || '', type: b.classList.contains('is-img') ? 'image/jpeg' : 'application/pdf' }));
      grid.addEventListener('click', (e) => { const b = e.target.closest('.fl-th'); if (b) open(files[+b.dataset.i], urlFn); });
      loadThumbs(grid, files, urlFn);
    });
  };

  // Bearbeitbare Liste
  LF.ui.files = (container, o = {}) => {
    if (!container) return;
    const { sectionId, onChange, readonly } = o;
    let files = Array.isArray(o.files) ? o.files.slice() : [];
    const uid = 'fl' + Math.random().toString(36).slice(2, 7);
    const pending = []; // { id, name }
    const draw = () => {
      const items = files.map((f, i) => thumb(f, i, { del: !readonly })).join('') +
        pending.map(p => `<div class="fl-item"><div class="fl-th fl-load" role="status" aria-label="${esc(t('Wird hochgeladen:') + ' ' + p.name)}">${ic(ICON.spin, 'spin')}<span class="fl-name">${esc(p.name)}</span></div></div>`).join('');
      container.innerHTML = `<div class="fl" data-fl>
        ${items ? `<div class="fl-grid">${items}</div>` : (readonly ? `<p class="tiny">${esc(t('Keine Dateien'))}</p>` : '')}
        ${readonly ? '' : `<div class="fl-add">
          <label class="btn ghost fl-btn" for="${uid}c">${ic(ICON.cam)}<span>${esc(t('Foto aufnehmen'))}</span></label>
          <input type="file" id="${uid}c" class="fl-in" accept="image/*" capture="environment" data-cam>
          <label class="btn ghost fl-btn" for="${uid}f">${ic(ICON.file)}<span>${esc(t('Datei wählen'))}</span></label>
          <input type="file" id="${uid}f" class="fl-in" accept="image/*,application/pdf" multiple data-pick>
        </div>
        <p class="tiny">${esc(t('Foto freiwillig. Wichtiger ist, dass Sie notieren, wo das Original liegt.'))}</p>`}
      </div>`;
      const root = container.querySelector('[data-fl]');
      loadThumbs(root, files, null);
      root.addEventListener('click', async (e) => {
        const b = e.target.closest('.fl-th:not(.fl-load)');
        if (b) { open(files[+b.dataset.i]); return; }
        const d = e.target.closest('[data-del]');
        if (d) {
          const f = files[+d.dataset.del]; if (!f) return;
          const ok = await LF.confirm(t('Datei löschen?'), t('«{x}» wird gelöscht. Das lässt sich nicht rückgängig machen.', { x: f.name || '' }), t('Löschen'), true);
          if (!ok) return;
          try { await LF.removeFile(f); } catch (err) { LF.toast(t('Die Datei konnte nicht gelöscht werden. Bitte versuchen Sie es nochmals.')); return; }
          files = files.filter(x => x.path !== f.path);
          draw();
          onChange && onChange(files.slice());
        }
      });
      root.querySelectorAll('.fl-in').forEach(inp => inp.addEventListener('change', () => { const l = [...inp.files]; inp.value = ''; if (l.length) add(l); }));
    };
    const add = async (list) => {
      const jobs = [];
      for (const file of list) {
        if (!isImg(file) && !isPdf(file)) { LF.toast(t('«{x}» ist keine Foto- oder PDF-Datei.', { x: file.name })); continue; }
        if (file.size > MAX) { LF.toast(t('«{x}» ist zu gross. Erlaubt sind höchstens 10 MB.', { x: file.name })); continue; }
        jobs.push(file);
      }
      if (!jobs.length) return;
      const ps = jobs.map(f => ({ id: LF.uid ? LF.uid() : Math.random(), name: f.name || t('Foto') }));
      pending.push(...ps); draw();
      const done = [];
      const res = new Array(jobs.length);
      await Promise.all(jobs.map(async (file, k) => {
        try { res[k] = await LF.upload(sectionId, file); }
        catch (err) {
          const m = err && err.message;
          LF.toast(m && /[a-zäöü]/i.test(m) && !/fetch|network|Failed|TypeError/i.test(m) ? m : t('Hochladen hat nicht geklappt. Bitte prüfen Sie die Internetverbindung und versuchen Sie es nochmals.'));
        }
        pending.splice(pending.indexOf(ps[k]), 1);
      }));
      done.push(...res.filter(Boolean));
      files = [...files, ...done];
      if (container.isConnected) draw();
      if (done.length) onChange && onChange(files.slice());
    };
    draw();
  };
})();
