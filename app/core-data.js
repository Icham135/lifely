/* Lifely – Daten- und Netz-Schicht: Verbindung, Anmeldung, Dossier-Speicher, Dateien, KI, Keys, Ansicht. */
(() => {
  const LF = window.LF;
  const t = (s, v) => (LF.t ? LF.t(s, v) : s);
  const sb = LF.sb = supabase.createClient(LF_CONFIG.url, LF_CONFIG.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'lifely-auth' } });
  const ls = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
  const ss = { get: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch {} }, del: (k) => { try { sessionStorage.removeItem(k); } catch {} } };
  const fire = (n) => document.dispatchEvent(new CustomEvent(n));

  let row = null;            // { data, guide, settings } im Speicher
  let timer = null, saving = null, again = false;
  const listeners = [];
  const notify = () => listeners.forEach((cb) => { try { cb(); } catch (e) { console.error(e); } });
  const DEFAULT_SET = () => ({ setupDone: false, tourDone: false, consented: false, name: '' });

  // ---------- Fehlermeldungen ----------
  const authErr = (e) => {
    console.error('auth', e?.message, e?.code, e?.status);
    const m = String(e?.message || '').toLowerCase(), c = e?.code || '';
    if (/failed to fetch|network|load failed/.test(m)) return new Error(t('Keine Verbindung. Bitte prüfen Sie das Internet.'));
    if (/already|registered/.test(m) || c === 'user_already_exists') return new Error(t('Diese E-Mail ist schon registriert. Bitte melden Sie sich an.'));
    if (/password/.test(m) && /(short|least|characters|weak)/.test(m)) return new Error(t('Das Passwort ist zu kurz. Bitte mindestens 8 Zeichen.'));
    if (/invalid login|credentials/.test(m)) return new Error(t('E-Mail oder Passwort stimmt nicht.'));
    if (/valid email|invalid.*email|email.*invalid/.test(m)) return new Error(t('Bitte geben Sie eine gültige E-Mail-Adresse ein.'));
    if (/rate|too many|seconds/.test(m) || e?.status === 429) return new Error(t('Zu viele Versuche. Bitte warten Sie einen Moment.'));
    return new Error(t('Das hat nicht geklappt.'));
  };
  const fnErr = async (error, fallback) => {
    let msg = '';
    try { msg = (await error.context.json()).error || ''; } catch {}
    if (!msg && /fetch|network/i.test(error?.message || '')) msg = t('Keine Verbindung. Bitte prüfen Sie das Internet.');
    return new Error(msg || fallback || t('Das hat nicht geklappt.'));
  };

  // ---------- Zeile laden / Zustand ----------
  async function loadRow(user) {
    const { data, error } = await sb.from('dossiers').select('data,guide,settings').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    if (data) {
      row = { data: data.data || {}, guide: data.guide || {}, settings: null };
      if (!row.data.sections) row.data.sections = {};
      Object.assign(LF.settings, data.settings || {});
      if (LF.settings.lang) ls.set('lifely_lang', LF.settings.lang);
      if (LF.settings.size) ls.set('lifely_size', LF.settings.size);
      applyDom();
    } else {
      row = { data: { sections: {} }, guide: {} };
      Object.assign(LF.settings, DEFAULT_SET(), { lang: LF.settings.lang, size: LF.settings.size });
      const { error: e2 } = await sb.from('dossiers').insert({ user_id: user.id, data: row.data, guide: row.guide, settings: LF.settings });
      if (e2) throw e2;
    }
  }
  const applyDom = () => { const d = document.documentElement; if (LF.settings.size) d.dataset.size = LF.settings.size; if (LF.settings.lang) d.lang = LF.settings.lang; };
  function resetState() {
    row = null; dirtySections.clear(); dirtyMeta = false; tok = ''; clearTimeout(timer); clearTimeout(retryT); LF.S.user = null; LF.S.ready = false; LF.viewer = null;
    const { lang, size } = LF.settings; Object.assign(LF.settings, DEFAULT_SET(), { lang, size });
  }
  const setUser = (u) => { LF.S.user = u ? { id: u.id, email: u.email } : null; };

  LF.data = {
    async init() {
      try {
        const { data } = await sb.auth.getSession();
        const u = data?.session?.user; tok = data?.session?.access_token || '';
        if (u) { setUser(u); try { await loadRow(u); LF.S.ready = true; } catch (e) { console.error(e); LF.S.ready = false; } }
        else resetState();
      } catch (e) { console.error(e); resetState(); }
      const key = ss.get('lf_key');
      if (key && !LF.S.user) { try { await LF.viewerOpen(key); } catch { ss.del('lf_key'); } }
      sb.auth.onAuthStateChange((_ev, session) => setTimeout(async () => {
        const u = session?.user || null; if (session?.access_token) tok = session.access_token;
        if ((u?.id || null) === (LF.S.user?.id || null)) return;
        if (!u) { resetState(); notify(); return; }
        setUser(u); LF.S.ready = false; notify();
        try { await loadRow(u); LF.S.ready = true; } catch (e) { console.error(e); }
        notify();
      }, 0));
    },
    onChange(cb) { listeners.push(cb); },
  };

  // ---------- Anmeldung ----------
  LF.auth = {
    async signUp(email, pw) {
      let r; try { r = await sb.auth.signUp({ email: String(email || '').trim(), password: pw }); } catch (e) { throw authErr(e); }
      if (r.error) throw authErr(r.error);
      if (!r.data.session) throw new Error(t('Diese E-Mail ist schon registriert. Bitte melden Sie sich an.'));
    },
    async signIn(email, pw) {
      let r; try { r = await sb.auth.signInWithPassword({ email: String(email || '').trim(), password: pw }); } catch (e) { throw authErr(e); }
      if (r.error) throw authErr(r.error);
    },
    async signOut() {
      try { await LF.dossier.flush(); } catch {}
      try { await sb.auth.signOut({ scope: 'local' }); } catch {}
      resetState(); notify();
    },
  };

  // ---------- Speichern (pro Bereich, damit sich Tabs nicht überschreiben) ----------
  const dirtySections = new Set(); let dirtyMeta = false, retryN = 0, retryT = null, tok = '';
  const isDirty = () => dirtySections.size > 0 || dirtyMeta;
  const RETRY = [3000, 10000, 30000];
  const rpcSave = (sec) => sb.rpc('lf_save_section', { sec, val: row.data.sections[sec] });
  async function doSave() {
    if (!row || !LF.S.user || !isDirty()) return;
    if (saving) { again = true; return saving; }
    saving = (async () => {
      do {
        again = false; fire('lf:saving');
        const secs = [...dirtySections], meta = dirtyMeta; dirtySections.clear(); dirtyMeta = false;
        let failed = false;
        for (const sec of secs) {
          if (!row.data.sections[sec]) continue;
          const { error } = await rpcSave(sec);
          if (error) { failed = true; dirtySections.add(sec); }
        }
        if (meta) {
          const { error } = await sb.from('dossiers').update({ guide: row.guide, settings: LF.settings }).eq('user_id', LF.S.user.id);
          if (error) { failed = true; dirtyMeta = true; }
        }
        if (failed) {
          fire('lf:saveerror'); LF.toast(t('Speichern hat nicht geklappt. Bitte prüfen Sie die Verbindung.'));
          clearTimeout(retryT); retryT = setTimeout(() => doSave().catch(console.error), RETRY[Math.min(retryN, 2)]); retryN++;
          break;
        }
        retryN = 0;
        if (!again) fire('lf:saved');
      } while (again);
    })();
    try { await saving; } finally { saving = null; }
  }
  const mark = (sec) => {
    if (!LF.S.user || !row) return;
    if (sec) dirtySections.add(sec); else dirtyMeta = true;
    clearTimeout(timer); timer = setTimeout(() => doSave().catch(console.error), 400);
  };
  const flush = async () => { clearTimeout(timer); clearTimeout(retryT); if (saving) await saving; await doSave(); };
  addEventListener('online', () => { clearTimeout(retryT); doSave().catch(console.error); });
  // Beim Schliessen/Verstecken: Anfragen mit keepalive, die der Browser nicht abbricht
  function beacon() {
    if (!row || !LF.S.user || !tok || !isDirty()) return;
    // text/plain = einfache Anfrage ohne Vorabprüfung, die beim Schliessen der Seite zuverlässig rausgeht
    const send = (o) => { const body = JSON.stringify({ token: tok, ...o }); if (body.length >= 60000) return; try { fetch(`${LF_CONFIG.url}/functions/v1/sichern`, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'text/plain' }, body }); } catch {} };
    for (const sec of dirtySections) if (row.data.sections[sec]) send({ sec, val: row.data.sections[sec] });
    if (dirtyMeta) send({ meta: { guide: row.guide, settings: LF.settings } });
  }
  // Tab kommt zurück: fremde Änderungen anderer Bereiche übernehmen (lokal geänderte nie ersetzen)
  async function refresh() {
    if (!row || !LF.S.user || saving) return;
    const { data, error } = await sb.from('dossiers').select('data').eq('user_id', LF.S.user.id).maybeSingle();
    if (error || !data || !row || saving) return;
    const srv = data.data?.sections || {}; let changed = false;
    for (const id of Object.keys(srv)) {
      if (dirtySections.has(id)) continue;
      if (JSON.stringify(srv[id]) !== JSON.stringify(row.data.sections[id])) { row.data.sections[id] = srv[id]; changed = true; }
    }
    if (changed) fire('lf:remote');
  }
  addEventListener('pagehide', () => { beacon(); flush().catch(() => {}); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { beacon(); flush().catch(() => {}); }
    else refresh().catch(() => {});
  });

  LF.saveSettings = () => {
    ls.set('lifely_lang', LF.settings.lang || 'de'); ls.set('lifely_size', LF.settings.size || 'normal'); applyDom(); mark(null);
  };

  // ---------- Dossier ----------
  const kindOf = (id) => (typeof SECTION === 'function' && SECTION(id)?.kind) || 'form';
  const fresh = (id) => LF.calc.defaults(kindOf(id));
  const hasMap = () => row?.data?.sections;
  LF.dossier = {
    get(id) {
      if (!hasMap()) return fresh(id);
      const s = row.data.sections;
      if (!s[id]) s[id] = fresh(id);
      return s[id];
    },
    set(id, fn) {
      if (!hasMap()) return;
      const d = LF.dossier.get(id);
      if (typeof fn === 'function') fn(d); else Object.assign(d, fn);
      mark(id);
    },
    all() { const o = {}; (typeof SECTIONS !== 'undefined' ? SECTIONS : []).forEach((s) => { o[s.id] = LF.dossier.get(s.id); }); return o; },
    status(id, daten) { return LF.calc.status(id, arguments.length > 1 && daten === undefined ? fresh(id) : (daten === undefined ? LF.dossier.get(id) : daten)); },
    summary(id, daten) { return LF.calc.summary(id, arguments.length > 1 && daten === undefined ? fresh(id) : (daten === undefined ? LF.dossier.get(id) : daten)); },
    progress(map) { return LF.calc.progress(map || LF.dossier.all()); },
    flush,
  };
  LF.guide = {
    get() { if (!row) return {}; if (!row.guide || typeof row.guide !== 'object') row.guide = {}; return row.guide; },
    set(patch) { if (!row) return; Object.assign(LF.guide.get(), patch); mark(null); },
  };

  // ---------- Dateien ----------
  const MAX = 10 * 1024 * 1024;
  function shrink(file) {
    return new Promise((res) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        c.toBlob((b) => res(b || null), 'image/jpeg', 0.85);
      };
      img.onerror = () => { URL.revokeObjectURL(url); res(null); };
      img.src = url;
    });
  }
  const urlCache = new Map();
  LF.upload = async (sectionId, file) => {
    if (!LF.S.user) throw new Error(t('Bitte melden Sie sich an.'));
    const type = file.type || '';
    if (!(type.startsWith('image/') || type === 'application/pdf') || type === 'image/svg+xml') throw new Error(t('Bitte wählen Sie ein Foto oder eine PDF-Datei.'));
    let body = file, ctype = type, name = file.name || 'datei';
    if (type.startsWith('image/') && type !== 'image/gif') {
      const b = await shrink(file);
      if (b && type !== 'image/gif') { body = b; ctype = 'image/jpeg'; name = name.replace(/\.[^.]*$/, '') + '.jpg'; }
      else if (!b && /^image\/(jpeg|png|webp|gif)$/.test(type)) throw new Error(t('Das ist kein gültiges Bild. Bitte wählen Sie ein anderes Foto.'));
    }
    if (body.size > MAX) throw new Error(t('Die Datei ist grösser als 10 MB.'));
    const safe = name.normalize('NFKD').replace(/[^\w.\-]+/g, '_').replace(/^_+|_+$/g, '').slice(-60) || 'datei';
    const path = `${LF.S.user.id}/${sectionId}/${LF.uid()}-${safe}`;
    const { error } = await sb.storage.from('dossier-files').upload(path, body, { contentType: ctype, upsert: false });
    if (error) throw new Error(t('Das Hochladen hat nicht geklappt. Bitte versuchen Sie es nochmals.'));
    return { path, name, type: ctype, size: body.size };
  };
  LF.fileUrl = async (ref) => {
    const p = ref?.path; if (!p) return '';
    if (LF.viewer) return LF.viewer.urls?.[p] || '';
    const c = urlCache.get(p); if (c && c.exp > Date.now()) return c.url;
    const { data, error } = await sb.storage.from('dossier-files').createSignedUrl(p, 3600);
    if (error) throw new Error(t('Das Hochladen hat nicht geklappt. Bitte versuchen Sie es nochmals.'));
    urlCache.set(p, { url: data.signedUrl, exp: Date.now() + 50 * 60000 });
    return data.signedUrl;
  };
  LF.removeFile = async (ref) => {
    if (!ref?.path) return;
    urlCache.delete(ref.path);
    const { error } = await sb.storage.from('dossier-files').remove([ref.path]);
    if (error) throw new Error(t('Das hat nicht geklappt.'));
  };

  // ---------- KI ----------
  async function call(name, body) {
    const { data, error } = await sb.functions.invoke(name, { body });
    if (error) throw await fnErr(error);
    if (data?.error) throw new Error(data.error);
    return data;
  }
  LF.ai = {
    async ask(messages, topic) { const d = await call('fuehrung', { action: 'ask', lang: LF.settings.lang, topic, messages }); return d.reply; },
    async extract(kind, text, o = {}) { const d = await call('fuehrung', { action: 'extract', lang: LF.settings.lang, kind, text, types: o.types, roles: o.roles }); return d.items || []; },
  };

  // ---------- Keys ----------
  const AL = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  function rawKey() {
    let s = ''; const lim = 256 - (256 % AL.length);
    while (s.length < 12) { const b = crypto.getRandomValues(new Uint8Array(24)); for (const x of b) { if (x < lim && s.length < 12) s += AL[x % AL.length]; } }
    return s;
  }
  const sha = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((x) => x.toString(16).padStart(2, '0')).join('');
  LF.keys = {
    async list() {
      const { data, error } = await sb.from('access_keys').select('id,label,created_at,last_used_at,uses,revoked_at').order('created_at', { ascending: false });
      if (error) throw new Error(t('Das hat nicht geklappt.'));
      return data || [];
    },
    async create(label) {
      if (!LF.S.user) throw new Error(t('Bitte melden Sie sich an.'));
      const raw = rawKey();
      const { data, error } = await sb.from('access_keys').insert({ user_id: LF.S.user.id, label: String(label || '').slice(0, 60), key_hash: await sha(raw) }).select('id,label,created_at,last_used_at,uses,revoked_at').single();
      if (error) throw new Error(/Zu viele Keys/.test(error.message || '') ? t('Zu viele Keys. Bitte widerrufen Sie nicht benötigte Keys.') : t('Das hat nicht geklappt.'));
      return { key: 'LIFE-' + raw.match(/.{4}/g).join('-'), row: data };
    },
    async revoke(id) {
      const { error } = await sb.from('access_keys').update({ revoked_at: new Date().toISOString() }).eq('id', id);
      if (error) throw new Error(t('Das hat nicht geklappt.'));
    },
  };

  // ---------- Ansicht mit Key ----------
  LF.viewer = null;
  LF.viewerOpen = async (key) => {
    const { data, error } = await sb.functions.invoke('ansicht', { body: { key } });
    if (error) throw await fnErr(error);
    if (data?.error) throw new Error(data.error);
    LF.viewer = { name: data.name, label: data.label, data: data.data, urls: data.urls || {}, updated: data.updated || 0 };
    ss.set('lf_key', key);
  };
  LF.viewerClose = () => { LF.viewer = null; ss.del('lf_key'); };

  // ---------- Konto löschen ----------
  LF.deleteAccount = async () => {
    const { data, error } = await sb.functions.invoke('konto', { body: { action: 'delete' } });
    if (error) throw await fnErr(error);
    if (data?.error) throw new Error(data.error);
    try { await sb.auth.signOut({ scope: 'local' }); } catch {}
    resetState();
    try { Object.keys(localStorage).filter((k) => k.startsWith('lifely_') || k === 'lifely-auth').forEach((k) => localStorage.removeItem(k)); } catch {}
    notify();
  };
})();
