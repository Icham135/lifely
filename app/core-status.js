/* Lifely – reine Rechenfunktionen für den Dossier-Status (kein Netz, kein Speicher). */
window.LF = window.LF || {};
(() => {
  const T = (x) => (LF.t ? LF.t(x) : x);
  const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => v[k]);
  const clip = (s, n) => { s = String(s).trim().replace(/\s+/g, ' '); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };
  const defaults = (kind) => kind === 'doc' ? { has: undefined, where: '', copy: '', note: '', files: [] }
    : kind === 'list' ? { items: [], none: false } : kind === 'people' ? { items: [] } : { values: {}, files: [] };
  const sec = (id) => (typeof SECTION === 'function' ? SECTION(id) : null);
  const get = (id, d) => d || defaults(sec(id)?.kind);
  const has = (v) => typeof v === 'string' && v.trim() !== '';

  function docInfo(id, d) {
    const w = has(d.where);
    if (d.has === 'ja' && w) {
      let sub = fill(T('Original: {where}'), { where: d.where.trim() });
      if (has(d.copy)) sub += ' · ' + fill(T('Kopie: {copy}'), { copy: d.copy.trim() });
      const months = typeof REVIEW_MONTHS === 'function' ? REVIEW_MONTHS(id) : 0;
      if (months && d.checked && Date.now() - d.checked > months * 30.44 * 864e5)
        return { state: 'due', label: 'Prüfen', sub: fill(T('Zuletzt geprüft {Jahr}'), { Jahr: new Date(d.checked).getFullYear() }) };
      return { state: 'ok', label: 'Geregelt', sub };
    }
    const sub = d.has === 'nein' ? 'Noch nicht vorhanden' : d.has === '?' ? 'Weiss ich noch nicht' : d.has === 'ja' ? 'Fundort fehlt' : 'Noch nicht erfasst';
    return { state: 'warn', label: 'Offen', sub: T(sub) };
  }

  function summary(id, daten) {
    const s = sec(id), d = get(id, daten);
    if (!s) return '';
    if (s.kind === 'doc') return docInfo(id, d).sub;
    if (s.kind === 'list') {
      const n = (d.items || []).length;
      if (!n) return d.none ? T('Keine vorhanden') : T('Noch nichts eingetragen');
      const u = s.unit || ['Eintrag', 'Einträge'];
      const names = d.items.map(i => (i.name || i.type || '').trim()).filter(Boolean).join(', ');
      return n + ' ' + T(n === 1 ? u[0] : u[1]) + (names ? ': ' + names : '');
    }
    if (s.kind === 'people') {
      const it = d.items || [];
      if (!it.length) return T('Noch niemand');
      const nm = it.slice(0, 3).map(p => (p.name || '').trim() ? (p.name.trim() + (has(p.rel) ? ' (' + p.rel.trim() + ')' : '')) : '').filter(Boolean);
      return nm.join(', ') + (it.length > 3 ? ' ' + T('und weitere') : '');
    }
    const out = [];
    for (const f of s.fields || []) {
      const v = (d.values || {})[f.k];
      if (has(v)) { out.push(clip(T(f.label) + ': ' + v, 60)); if (out.length === 2) break; }
    }
    return out.length ? out.join(' · ') : T('Noch nichts eingetragen');
  }

  function status(id, daten) {
    const s = sec(id), d = get(id, daten), k = s?.kind;
    if (k === 'doc') { const r = docInfo(id, d); return r; }
    const ok = k === 'list' ? (d.items || []).length > 0 || !!d.none
      : k === 'people' ? (d.items || []).length > 0
      : Object.values(d.values || {}).some(has);
    return ok ? { state: 'ok', label: 'Geregelt', sub: summary(id, d) }
      : { state: 'warn', label: 'Offen', sub: summary(id, d) };
  }

  function progress(map) {
    map = map || {};
    const total = SECTIONS.length;
    const done = SECTIONS.filter(s => status(s.id, map[s.id]).state === 'ok').length;
    return { done, total, percent: total ? Math.round(done / total * 100) : 0 };
  }

  LF.calc = { defaults, status, summary, progress };
})();
