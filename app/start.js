/* Lifely – Start: Begrüssung, Fortschritt, Weitermachen und Schnellzugriffe. */
(() => {
  const L = window.LF, t = (s, v) => L.t(s, v), esc = (s) => L.esc(s == null ? '' : s);
  const ic = (n) => { try { return L.svg(n) || ''; } catch { return ''; } };
  L.routes.start = () => {
    const g = (L.guide && L.guide.get()) || {}, name = (L.settings.name || '').trim(), p = L.dossier.progress();
    const tops = ((L.MODES || []).find(m => m.id === g.mode) || { topics: [] }).topics.map(id => (L.TOPICS || []).find(x => x.id === id)).filter(Boolean);
    const cur = tops[g.ti];
    const cont = cur
      ? `<button class="card dark g-cont" data-go="guide/run"><span class="eb light">${t('Weitermachen')}</span><b class="qt small light" style="color:#fff">${esc(t(cur.title))}</b><span class="btn white">${t('Weiter im Gespräch')}</span></button>`
      : `<button class="card dark g-cont" data-go="guide"><span class="eb light">${t('Geführte Vorsorge')}</span><b class="qt small light" style="color:#fff">${t('Wie viel Zeit haben Sie heute?')}</b><span class="btn white">${t('Zeit wählen und starten')}</span></button>`;
    const row = (to, icon, title, sub) => `<button type="button" class="row" data-go="${to}"><span class="ico">${ic(icon)}</span><span class="m"><b>${t(title)}</b><small>${t(sub)}</small></span></button>`;
    L.app.innerHTML = `<section class="screen g-home"><div class="top"><div class="wm"><img src="icons/logo.svg" alt="">Lifely</div></div>
      <h1 class="hello">${name ? t('Grüezi, {name}', { name: esc(name) }) : t('Grüezi')}</h1>
      <div class="card sun g-prog"><div class="spread"><b>${t('Ihre Vorsorge')}</b><b>${p.percent} %</b></div>
        <div class="bar" role="progressbar" aria-valuenow="${p.percent}" aria-valuemin="0" aria-valuemax="100"><i style="width:${p.percent}%"></i></div>
        <p class="tiny">${t('{done} von {total} Bereichen geregelt', { done: p.done, total: p.total })}</p></div>
      ${cont}
      <h2>${t('Direkt zu')}</h2><div class="list">
        ${row('dossier/dokumente', 'file', 'Dokument oder Foto ablegen', 'Policen, Verträge, Ausweise als Foto oder PDF')}
        ${row('dossier', 'folder', 'Mein Dossier', 'Alles ansehen und ändern')}
        ${row('profile', 'user', 'Key für Vertrauensperson', 'Zugang zum Nachschauen erstellen')}</div></section>`;
  };
})();
