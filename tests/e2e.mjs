/* Lifely – durchgängiger Test (echte Oberfläche, Playwright). Start: node tests/e2e.mjs  (Server: LF_URL, Standard Port 5209) */
import { chromium } from '/Users/ilies/Desktop/Brained/node_modules/playwright/index.mjs';
import fs from 'fs';
const URL = process.env.LF_URL || 'http://localhost:5209/app-neu/index.html';
const SHOTS = '/private/tmp/claude-501/-Users-ilies-Desktop-Brained/d784a548-15c1-42d5-85ff-dfa0ff44d2c5/scratchpad/e2e';
fs.mkdirSync(SHOTS, { recursive: true });
const R = Math.random().toString(36).slice(2, 8);
const PW = 'Lifely-Test-2026';
const MAIL1 = `lifely+${R}a@example.com`, MAIL2 = `lifely+${R}b@example.com`;
const MARK = 'E2E' + R;                       // Erkennungstext in allen Eingaben
const results = [], warns = [];
let browser, cur = null, n = 0;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* ---------- Grundwerkzeuge ---------- */
const mkPage = async (ctx, w = 390, h = 844) => {
  const p = await ctx.newPage(); p.errs = [];
  await p.setViewportSize({ width: w, height: h });
  p.on('pageerror', e => p.errs.push('Seitenfehler: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|invalid_credentials|Invalid login/i.test(m.text())) p.errs.push('Konsole: ' + m.text().slice(0, 200)); });
  return p;
};
const shot = async (p, name) => { try { await p.screenshot({ path: `${SHOTS}/${String(++n).padStart(2, '0')}-${name.replace(/\W+/g, '_')}.png`, fullPage: true }); } catch {} };
const step = async (name, fn) => {
  try { await fn(); const e = cur?.errs?.splice(0) || []; if (e.length) { results.push({ name, ok: false, msg: e.slice(0, 3).join(' | ') }); await shot(cur, name); } else results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, msg: String(e.message || e).split('\n')[0].slice(0, 300) }); if (cur) { await shot(cur, name); cur.errs?.splice(0); } }
};
const must = (c, msg) => { if (!c) throw new Error(msg); };
const body = (p) => p.evaluate(() => document.body.innerText);
const vals = (p) => p.evaluate(() => [...document.querySelectorAll('input,textarea,select')].map(e => e.value).join(' | '));
const all = async (p) => (await body(p)) + ' ' + (await vals(p));
const B = (p, re) => p.locator('button, a, [role=button], label.btn, .btn, [data-go], .chip, .g-chip, .choice').filter({ hasText: re }).locator('visible=true');
const has = async (p, re) => (await B(p, re).count()) > 0;
const click = async (p, re, opt = {}) => { const l = B(p, re).first(); await l.waitFor({ state: 'visible', timeout: opt.timeout || 8000 });
  try { await l.click({ timeout: 4000 }); } catch (e) { const ov = await p.evaluate(() => { const o = document.querySelector('.backdrop,.fl-view,[role=dialog],[class*=tour]'); return o ? o.className : '?'; }); warns.push('Klick verdeckt/blockiert (' + re + '), Overlay: ' + ov); await l.click({ force: true, timeout: 4000 }); }
  await sleep(opt.wait ?? 350); };
const tryClick = async (p, re, opt = {}) => { try { if (await has(p, re)) { await click(p, re, opt); return true; } } catch {} return false; };
const hash = (p) => p.evaluate(() => location.hash);
const go = async (p, h) => { await p.evaluate(h => { location.hash = h; }, h); await sleep(600); };
const waitText = (p, re, t = 15000) => p.waitForFunction(s => new RegExp(s, 'i').test(document.body.innerText), re.source, { timeout: t });
const reload = async (p) => { await p.reload(); await sleep(1500); };

/* Testdateien */
const mkImage = (p) => p.evaluate(async () => { const c = document.createElement('canvas'); c.width = 900; c.height = 600; const x = c.getContext('2d'); x.fillStyle = '#c33'; x.fillRect(0, 0, 900, 600); x.fillStyle = '#fff'; x.font = '60px sans-serif'; x.fillText('Lifely Test', 200, 300); const b = await new Promise(r => c.toBlob(r, 'image/png')); return Array.from(new Uint8Array(await b.arrayBuffer())); });
const mkPdf = () => Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF');
const fileImg = async (p) => ({ name: 'testbild.png', mimeType: 'image/png', buffer: Buffer.from(await mkImage(p)) });
const filePdf = () => ({ name: 'testdokument.pdf', mimeType: 'application/pdf', buffer: mkPdf() });
const setFile = async (p, f) => { const i = p.locator('input[type=file]'); must(await i.count() > 0, 'Kein Datei-Feld gefunden'); await i.last().setInputFiles(f); await sleep(2500); };

/* Felder generisch füllen (ausser Frage-Feld) */
async function fillVisible(p, text = MARK, scope = 'body') {
  const els = p.locator(`${scope} input:not([type=file]):not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=password]), ${scope} textarea`).locator('visible=true');
  const c = await els.count(); let k = 0;
  for (let i = 0; i < c; i++) {
    const e = els.nth(i); const meta = await e.evaluate(x => (x.placeholder + ' ' + (x.getAttribute('aria-label') || '') + ' ' + x.name).toLowerCase());
    if (/frage/.test(meta)) continue;
    if (await e.inputValue()) continue;
    const ty = await e.getAttribute('type'); const v = ty === 'tel' || /telefon|nummer|phone/.test(meta) ? '031 123 45 67' : ty === 'email' ? 'a@example.com' : `${text}-${++k}`;
    try { await e.fill(v); } catch {}
  }
  return k;
}

/* ---------- Registrierung / Anmeldung ---------- */
async function register(p, mail) {
  await p.goto(URL); await sleep(1500);
  if (await has(p, /^\s*deutsch/i)) await click(p, /^\s*deutsch/i);
  await p.locator('input[type=email]').first().waitFor({ state: 'visible', timeout: 10000 }).catch(async () => { await tryClick(p, /registrier|konto erstellen|neu hier|neues konto/i); });
  if (!(await p.locator('input[type=email]').count())) await tryClick(p, /registrier|konto erstellen|neu hier|neues konto/i);
  await tryClick(p, /registrier|konto erstellen|neues konto|ich bin neu/i);
  await p.locator('input[type=email]').first().fill(mail);
  const pw = p.locator('input[type=password]').locator('visible=true'); await pw.first().fill(PW);
  if (await pw.count() > 1) await pw.nth(1).fill(PW);
  await submitAuth(p);
}
async function submitAuth(p) {
  const sub = p.locator('button[type=submit]').locator('visible=true').first();
  if (await sub.count()) await sub.click(); else await click(p, /registrieren|konto erstellen|anmelden|weiter/i);
  await sleep(2500);
}
async function login(p, mail, pw = PW) {
  await p.goto(URL); await sleep(1500);
  if (await has(p, /^\s*deutsch/i)) await click(p, /^\s*deutsch/i);
  await tryClick(p, /^\s*anmelden|ich habe schon ein konto|bereits ein konto/i);
  await p.locator('input[type=email]').first().fill(mail);
  await p.locator('input[type=password]').locator('visible=true').first().fill(pw);
  await submitAuth(p);
}

/* Einrichten + Rundgang */
async function setupAndTour(p) {
  for (let i = 0; i < 12; i++) {
    const h = await hash(p); if (!/setup/.test(h)) break;
    const cb = p.locator('input[type=checkbox]').locator('visible=true'); for (let j = 0; j < await cb.count(); j++) if (!(await cb.nth(j).isChecked())) await cb.nth(j).check({ force: true }).catch(() => cb.nth(j).click({ force: true }).catch(() => {}));
    await tryClick(p, /einverstanden|zustimmen|ich stimme/i);
    await fillVisible(p, 'Frau Test');
    await tryClick(p, /^\s*gross\b|normal/i, { wait: 150 });
    if (!(await tryClick(p, /weiter|fertig|los geht|starten|speichern/i))) break;
    await sleep(500);
  }
}
async function tourThrough(p, max = 15) {
  let c = 0;
  for (; c < max; c++) { const nx = p.locator('[data-tnext]').locator('visible=true'); if (!(await nx.count())) break; await nx.first().click(); await sleep(450); }
  await sleep(300); return c;
}

/* ---------- Geführte Vorsorge: Chat ---------- */
async function chat(p, log) {
  let ja = 0, seen = new Map(), up = 0, extras = { frage: false, skip: false, pause: false };
  for (let it = 0; it < 220; it++) {
    const t = await body(p); const sig = t.slice(-300);
    seen.set(sig, (seen.get(sig) || 0) + 1);
    if (!/guide\/run/.test(await hash(p)) && it > 3) { log.push('Chat verlassen bei Schritt ' + it); return; }
    if (/Mein Dossier ansehen|zum Dossier|alles erledigt|Sie sind fertig|geschafft/i.test(t) && !(await p.locator('textarea:visible, input[type=text]:visible').count())) { log.push('Ende erkannt'); return; }
    const stuck = seen.get(sig) > 3;
    if (!extras.frage && it === 2 && await has(p, /frage stellen/i)) { extras.frage = true; await click(p, /frage stellen/i); const q = p.locator('textarea:visible, input:visible').last(); await q.fill('Was ist eine Patientenverfügung?').catch(() => {}); await q.press('Enter').catch(() => {}); await tryClick(p, /senden|fragen|absenden/i); await sleep(5000); log.push('Frage gestellt: ' + (/\?|Verfügung/.test(await body(p)))); continue; }
    if (!extras.skip && it === 6 && await has(p, /überspringen/i)) { extras.skip = true; await click(p, /überspringen/i); await tryClick(p, /ja|ok|bestätig/i); continue; }
    if (!extras.pause && it === 9 && await has(p, /pause/i)) { extras.pause = true; await click(p, /pause/i); await sleep(500); log.push('Pause, Hash=' + await hash(p)); await reload(p); if (!(await tryClick(p, /weiter|fortsetzen|weitermachen|zurück zum gespräch/i))) await go(p, 'guide/run'); await sleep(800); continue; }
    // Formular-Rückfall / Personen / Listenformular: sichtbare Felder
    const fi = p.locator('main input:not([type=file]):not([type=checkbox]):not([type=radio]):not([type=hidden]), main textarea').locator('visible=true');
    const nIn = await fi.count();
    if (nIn && !stuck) {
      const ph = (await fi.first().getAttribute('placeholder')) || '';
      let k = await fillVisible(p, /liste|police|krankenkasse/i.test(t) && nIn <= 2 ? 'Krankenkasse CSS, Haftpflicht Mobiliar ' + MARK : MARK, 'main');
      if (k === 0 && !stuck) { /* schon gefüllt → weiter */ }
      if (await tryClick(p, /speichern|übernehmen|bestätig|hinzufügen|senden|absenden|weiter|ok$/i)) { await sleep(2500); continue; }
    }
    if (await p.locator('input[type=file]').count() && up < 2 && /foto|bild|datei|hochladen|dokument|kopie/i.test(t.slice(-500))) { await setFile(p, up === 0 ? await fileImg(p) : filePdf()); up++; log.push('Upload ' + up); continue; }
    if (await has(p, /^\s*ja\b/i)) { const v = ja++ % 6; await click(p, v === 3 ? /^\s*nein\b/i : v === 5 ? /weiss nicht|weiß nicht/i : /^\s*ja\b/i); continue; }
    if (await tryClick(p, /^\s*(abschliessen|stimmt so|ok|weiter|später|ohne|keine|ich habe keine)/i)) continue;
    // Auswahl: erste Option, die kein Steuerknopf ist
    const opt = p.locator('main .g-chip:visible, main .chip:visible, main [role=radio]:visible, main .seg button:visible, main .list button:visible, main .bubble button:visible').first();
    if (await opt.count() && !stuck) { await opt.click().catch(() => {}); await sleep(400); continue; }
    if (stuck) { log.push('Steckt fest: ' + sig.replace(/\s+/g, ' ').slice(-120)); return; }
    await sleep(800);
  }
  log.push('Abbruch nach 220 Schritten');
}

/* ---------- Messen ---------- */
async function measure(p, label) {
  const o = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, small: [...document.querySelectorAll('button,a.btn,[role=button],input[type=button],input[type=submit]')].filter(e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && r.height < 47.5; }).map(e => ((e.innerText || e.getAttribute('aria-label') || e.className) + '').trim().slice(0, 25) + ' ' + Math.round(e.getBoundingClientRect().height) + 'px') }));
  if (o.sw > o.iw) throw new Error(`${label}: seitliches Scrollen (${o.sw} > ${o.iw})`);
  if (o.small.length) warns.push(`${label}: Knöpfe < 48 px: ${[...new Set(o.small)].slice(0, 5).join(', ')}`);
}
async function setSize(p, re) { await go(p, 'profile'); await sleep(500); await p.locator(re.test('sehr gross') ? '[data-size=sehr-gross]:visible' : '[data-size=normal]:visible').first().click(); await sleep(300); }

/* =================== TEST =================== */
const fileLog = [], chatLog = [];
let KEY = '', page1, ctx1;
try {
  browser = await chromium.launch();
  ctx1 = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  page1 = await mkPage(ctx1); cur = page1;

  await step('1a Sprachwahl sichtbar', async () => { await page1.goto(URL); await sleep(2000); const t = await body(page1); must(/deutsch/i.test(t), 'Keine Sprachwahl mit «Deutsch» (Seite: ' + t.slice(0, 80).replace(/\n/g, ' ') + ')'); await click(page1, /^\s*deutsch/i); });
  await step('1b Zu kurzes Passwort zeigt Fehler', async () => {
    await tryClick(page1, /registrier|konto erstellen|neues konto|ich bin neu/i);
    await page1.locator('input[type=email]').first().fill(`lifely+${R}x@example.com`);
    const pw = page1.locator('input[type=password]').locator('visible=true'); await pw.first().fill('abc'); if (await pw.count() > 1) await pw.nth(1).fill('abc');
    await submitAuth(page1); const t = await body(page1);
    must(/mindestens|zu kurz|Zeichen|Passwort/i.test(t) && !/setup|start|guide/.test(await hash(page1)), 'Keine Fehlermeldung bei kurzem Passwort');
  });
  await step('1c Registrieren (neues Konto)', async () => { await register(page1, MAIL1); await sleep(1500); must(/setup|start|guide|tour/.test(await hash(page1)) || /Name|Datenschutz/i.test(await body(page1)), 'Nach Registrierung nicht im Einrichten, Hash=' + await hash(page1)); });
  await step('1d Einrichten (Datenschutz, Name, Schrift)', async () => { await setupAndTour(page1); must(!/setup/.test(await hash(page1)), 'Einrichten bleibt hängen bei ' + await hash(page1)); });
  await step('1e Rundgang erscheint und lässt sich durchklicken', async () => { await sleep(800); const c = await tourThrough(page1); must(c >= 2, 'Rundgang nicht erkannt oder nur ' + c + ' Schritt(e)'); await sleep(400); });
  await step('1f Startbildschirm Geführte Vorsorge + Tableiste (4 Tabs)', async () => { await go(page1, 'guide'); must(await page1.locator('[data-tab]').locator('visible=true').count() === 4, 'Tableiste hat nicht 4 Tabs'); });
  // Abmelden/Anmelden mit falschem Passwort: später im Profil; hier frischer Kontext
  await step('1g Falsches Passwort zeigt Fehler (frischer Kontext)', async () => {
    const c = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await mkPage(c); cur = p;
    await login(p, MAIL1, 'Falsch-12345'); const t = await body(p); must(/falsch|stimmt nicht|ungültig|fehler/i.test(t) && !/guide|dossier/.test(await hash(p)), 'Keine Fehlermeldung bei falschem Passwort'); await c.close(); cur = page1;
  });

  /* 2 Geführte Vorsorge */
  await step('2a Modus «Schnell» wählen und starten', async () => {
    await go(page1, 'guide'); await click(page1, /schnell/i); await tryClick(page1, /starten|los geht|beginnen|weiter/i, { wait: 1500 });
    must(/guide\/run/.test(await hash(page1)) || await page1.locator('[class*=chat],[class*=bubble],.bot').count() > 0, 'Chat nicht gestartet, Hash=' + await hash(page1));
  });
  await step('2b Chat durchspielen (Ja/Nein, Text, Upload, Liste, Personen, Frage, Überspringen, Pause, Neuladen)', async () => { await chat(page1, chatLog); must(!chatLog.some(l => /Steckt fest|Abbruch/.test(l)), chatLog.join(' ; ')); });
  await step('2c Chat: Datei-Uploads erfolgten (Bild und PDF)', async () => { must(chatLog.filter(l => /^Upload/.test(l)).length >= 1, 'Kein Upload-Schritt im Chat erreicht. Log: ' + chatLog.join(' ; ')); });
  await step('2d Dossier zeigt Chat-Antworten automatisch (Texte, Fortschritt)', async () => {
    await go(page1, 'dossier'); await sleep(1000); const t = await body(page1); const pc = (t.match(/(\d+)\s*%/) || [])[1];
    must(pc === undefined || +pc > 0, 'Fortschritt bleibt bei 0 %'); let found = false;
    for (const id of ['persoenlich', 'patvf', 'versicherungen', 'personen', 'testament', 'konten', 'wohnen']) { await go(page1, 'dossier/' + id); if ((await all(page1)).includes(MARK)) { found = true; break; } }
    must(found, 'Kein Chat-Text («' + MARK + '») in Dossier-Bereichen gefunden. Chat-Log: ' + chatLog.slice(-4).join(' ; '));
  });
  await step('2e Dossier zeigt Chat-Dateien', async () => { let n = 0; for (const id of ['patvf', 'vorsorgeauftrag', 'testament', 'versicherungen', 'persoenlich']) { await go(page1, 'dossier/' + id); await sleep(500); n += await page1.locator('img[src], [class*=file], [class*=thumb]').count(); } must(n > 0, 'Keine Dateien/Miniaturen im Dossier'); });

  /* 3 Dossier bearbeiten */
  const M3 = 'E2E3' + R;
  await step('3a Bereichsart «form» bearbeiten (Persönliches), bleibt nach Neuladen', async () => {
    await go(page1, 'dossier/persoenlich'); await sleep(500); const ta = page1.locator('textarea').locator('visible=true').first(); await ta.fill(M3 + '-form'); await tryClick(page1, /speichern|fertig/i); await sleep(1500);
    await reload(page1); await go(page1, 'dossier/persoenlich'); await sleep(800); must((await all(page1)).includes(M3 + '-form'), 'Text nach Neuladen weg');
  });
  await step('3b Bereichsart «doc» bearbeiten (Testament)', async () => {
    await go(page1, 'dossier/testament'); await sleep(500); await tryClick(page1, /^\s*ja\b/i); await sleep(300); const i = page1.locator('input[type=text], input:not([type]), textarea').locator('visible=true').first(); await i.fill(M3 + '-doc'); await tryClick(page1, /speichern|fertig/i); await sleep(1500);
    await reload(page1); await go(page1, 'dossier/testament'); await sleep(800); must((await all(page1)).includes(M3 + '-doc'), 'Fundort nach Neuladen weg');
  });
  await step('3c Bereichsart «list» bearbeiten (Konten): Eintrag hinzufügen', async () => {
    await go(page1, 'dossier/konten'); await sleep(500); await tryClick(page1, /hinzufügen|neu|\+/i); await sleep(500); const ins = page1.locator('input:not([type=file]):not([type=hidden]):not([type=checkbox])').locator('visible=true');
    const nm = ins.first(); await nm.fill(M3 + '-bank'); await tryClick(page1, /speichern|hinzufügen|fertig|ok/i); await sleep(1500);
    await reload(page1); await go(page1, 'dossier/konten'); await sleep(800); must((await all(page1)).includes(M3 + '-bank'), 'Eintrag nach Neuladen weg');
  });
  await step('3d Bereichsart «people» bearbeiten (Personen)', async () => {
    await go(page1, 'dossier/personen'); await sleep(500); await tryClick(page1, /hinzufügen|neu|person|\+/i); await sleep(500); await fillVisible(page1, M3 + '-person'); await tryClick(page1, /speichern|hinzufügen|fertig|ok/i); await sleep(1500);
    await reload(page1); await go(page1, 'dossier/personen'); await sleep(800); must((await all(page1)).includes(M3 + '-person'), 'Person nach Neuladen weg');
  });
  await step('3e Datei hinzufügen, öffnen, löschen (Wohnen)', async () => {
    await go(page1, 'dossier/wohnen'); await sleep(600); await setFile(page1, await fileImg(page1)); must(await page1.locator('.fl-th').count() > 0, 'Datei erscheint nicht');
    const th = page1.locator('.fl-th').locator('visible=true').first(); await th.click(); await sleep(1200); const open = await page1.locator('[role=dialog][aria-label]').locator('visible=true').count() > 0; if (!open) warns.push('3e: Datei öffnen: keine Vollbild-Ansicht erkannt'); await tryClick(page1, /schliessen/i); await sleep(400);
    await reload(page1); await go(page1, 'dossier/wohnen'); await sleep(1200); must(await page1.locator('.fl-th').count() > 0, 'Datei nach Neuladen weg');
    await page1.locator('.fl-del').first().click(); await sleep(500); await page1.locator('.backdrop button').filter({ hasText: /^\s*Löschen\s*$/ }).click(); await sleep(2000); must(await page1.locator('.fl-th').count() === 0, 'Datei nach Löschen noch sichtbar (Dialog: ' + (await page1.locator('.backdrop').count()) + ' offen, Toast: ' + ((await page1.locator('#toast').innerText().catch(() => '')) || '-') + ')');
  });

  /* 4 Profil / Key */
  await step('4a Key erstellen und aus Anzeige lesen', async () => {
    await go(page1, 'profile'); await sleep(800); await page1.locator('#klabel').fill('Test-Tochter'); await page1.locator('#keyform button[type=submit]').click(); await sleep(3500);
    const i = page1.locator('input[type=text], input:not([type])').locator('visible=true'); if (await i.count()) await i.first().fill('Test-Tochter').catch(() => {});
    await tryClick(page1, /erstellen|speichern|weiter/i, { wait: 2500 }); const kb = await page1.locator('.keybig').first().getAttribute('aria-label').catch(() => ''); const m = (kb || '').match(/LIFE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/); must(m, 'Kein Key im Format LIFE-XXXX-XXXX-XXXX sichtbar'); KEY = m[0];
  });
  await step('4b Key-Liste zeigt den Key', async () => { await go(page1, 'profile'); await sleep(1500); must(/Test-Tochter/.test(await body(page1)), 'Key «Test-Tochter» nicht in der Liste'); });
  await step('4c Schriftgrösse ändern (sehr gross)', async () => { await go(page1, 'profile'); await page1.locator('[data-size=sehr-gross]').click(); const fs0 = await page1.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize)); must(fs0 >= 20, 'Schrift nicht grösser (' + fs0 + ' px)'); await page1.locator('[data-size=normal]').click(); });

  /* 5 Viewer in frischem Kontext */
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } }); const pv = await mkPage(ctx2);
  const openKey = async (k) => { await pv.goto(URL); await sleep(1500); if (await has(pv, /^\s*deutsch/i)) await click(pv, /^\s*deutsch/i); await click(pv, /ich habe einen key|key eingeben|mit key/i); await sleep(400); await pv.locator('input').locator('visible=true').first().fill(k); await click(pv, /dossier ansehen/i, { wait: 3500 }); };
  await step('5a Falscher Key zeigt Fehler', async () => { cur = pv; await openKey('LIFE-ZZZZ-ZZZZ-ZZZZ'); must(/stimmt nicht|ungültig|falsch/i.test(await body(pv)) && !(await hash(pv)).includes('view'), 'Kein Fehler bei falschem Key'); });
  await step('5b Richtiger Key: Nur-lesen-Ansicht mit allen Inhalten', async () => {
    cur = pv; await pv.reload(); await openKey(KEY); must((await hash(pv)).includes('view'), 'Nicht in Ansicht, Hash=' + await hash(pv)); await sleep(1500);
    const t = await all(pv).then(x => x + ' ' + 0); if (!(t.includes(M3 + '-form') || (await body(pv)).includes(M3))) { const vd = await pv.evaluate(() => JSON.stringify(Object.keys(LF.viewer?.data || {}))); const db = await page1.evaluate(async () => { try { const r = await LF.sb.from('dossiers').select('data').eq('user_id', LF.S.user.id).maybeSingle(); return JSON.stringify(Object.keys(r.data?.data || {})) + ' err=' + (r.error?.message || ''); } catch (e) { return 'fehler ' + e.message; } }); throw new Error('Inhalt (' + M3 + ') fehlt in Ansicht. Ansicht-Bereiche: ' + vd + ' | Datenbank-Bereiche des Besitzers: ' + db); }
  });
  await step('5c Nur-lesen: nichts bearbeitbar, keine Tableiste', async () => {
    cur = pv; const e = await pv.locator('input:not([type=hidden]), textarea, select, [contenteditable=true]').locator('visible=true').count(); const tb = await pv.locator('[data-tab]').locator('visible=true').count();
    must(e === 0, e + ' Eingabefeld(er) in der Nur-lesen-Ansicht'); must(tb === 0, 'Tableiste sichtbar'); must(!(await has(pv, /löschen|speichern|bearbeiten|hinzufügen/i)), 'Bearbeiten-Knöpfe sichtbar');
  });
  await step('5d Nur-lesen: Dateien sichtbar', async () => { cur = pv; must(await pv.locator('img[src]:not([src*="icons/"]), [class*=thumb], [class*=file]').count() > 0 || /\.pdf|\.png|\.jpg/i.test(await body(pv)), 'Keine Dateien in der Ansicht (Kontrolle: Datei wurde in 3e gelöscht, ggf. Chat-Dateien nötig)'); });
  await step('5e Nur-lesen bei 320 px ohne seitliches Scrollen', async () => { cur = pv; await pv.setViewportSize({ width: 320, height: 568 }); await sleep(300); await measure(pv, 'view@320'); });
  await ctx2.close();
  await step('5f Key widerrufen → Key funktioniert nicht mehr', async () => {
    cur = page1; await go(page1, 'profile'); await sleep(800); await page1.locator('[data-revoke]').first().click(); await sleep(500); await page1.locator('.backdrop button').filter({ hasText: /^\s*Widerrufen\s*$/ }).click(); await sleep(2000);
    const c = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await mkPage(c); cur = p; const old = pv; Object.assign(old, {}); 
    await p.goto(URL); await sleep(1500); if (await has(p, /^\s*deutsch/i)) await click(p, /^\s*deutsch/i); await click(p, /ich habe einen key|key eingeben|mit key/i); await p.locator('input').locator('visible=true').first().fill(KEY); await click(p, /dossier ansehen/i, { wait: 3500 });
    must(/stimmt nicht|ungültig|widerrufen|falsch/i.test(await body(p)) && !(await hash(p)).includes('view'), 'Widerrufener Key funktioniert noch'); await c.close(); cur = page1;
  });

  /* 4 Rest: Rundgang nochmals, Abmelden, Anmelden */
  await step('4d Rundgang nochmals starten', async () => { cur = page1; await go(page1, 'profile'); await page1.locator('[data-act=tour]').click(); await sleep(900); const c = await tourThrough(page1); must(c >= 2, 'Rundgang startet nicht erneut'); });
  await step('4e Abmelden und wieder Anmelden (Daten bleiben)', async () => {
    await go(page1, 'profile'); await page1.locator('[data-act=out]').click(); await sleep(500); await tryClick(page1, /^\s*(abmelden|ja|ok)\s*$/i, { wait: 1500 }); must(/login|language|key/.test(await hash(page1)) || /Anmelden/i.test(await body(page1)), 'Nach Abmelden nicht im Login');
    await login(page1, MAIL1); await sleep(2000); await go(page1, 'dossier/persoenlich'); must((await all(page1)).includes(M3 + '-form'), 'Daten nach erneutem Anmelden weg');
  });

  /* 6 Zweites Konto, Konto löschen */
  const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p2 = await mkPage(ctx3);
  await step('6a Zweites Konto sieht nichts vom ersten', async () => {
    cur = p2; await register(p2, MAIL2); await setupAndTour(p2); await tourThrough(p2); await sleep(500);
    for (const id of ['persoenlich', 'testament', 'konten', 'personen']) { await go(p2, 'dossier/' + id); must(!(await all(p2)).includes(MARK), 'Zweites Konto sieht Daten des ersten in ' + id); }
  });
  const del = async (p) => { await go(p, 'profile'); await sleep(600); await p.locator('[data-act=del]').click(); await sleep(400); await click(p, /^\s*weiter\s*$/i); await p.locator('#delw').fill('LÖSCHEN'); await sleep(200); await click(p, /alles endgültig löschen/i, { wait: 4000 }); };
  await step('6b Konto 2 löschen, Anmeldung schlägt fehl', async () => { cur = p2; await del(p2); await login(p2, MAIL2); must(!/guide|dossier|setup/.test(await hash(p2)) && /falsch|stimmt nicht|ungültig|fehler|nicht/i.test(await body(p2)), 'Anmeldung mit gelöschtem Konto klappt oder zeigt keinen Fehler'); });
  await ctx3.close();

  /* 7 Messungen (Konto 1 noch aktiv) */
  cur = page1; await login(page1, MAIL1).catch(() => {}); await sleep(1500);
  const screens = ['start', 'guide', 'guide/run', 'dossier', 'dossier/dokumente', 'dossier/persoenlich', 'dossier/personen', 'dossier/testament', 'dossier/konten', 'dossier/wohnen', 'profile', 'profile/privacy'];
  for (const [w, h, size] of [[390, 844, null], [320, 568, null], [390, 844, /sehr gross/i], [320, 568, /sehr gross/i]]) {
    await step(`7 Messung ${w}px${size ? ' Schrift sehr gross' : ''}`, async () => {
      await page1.setViewportSize({ width: w, height: h }); if (size) await setSize(page1, size); else await setSize(page1, /^\s*normal/i);
      const bad = []; for (const s of screens) { await go(page1, s); await sleep(500); try { await measure(page1, s + '@' + w + (size ? '+gross' : '')); } catch (e) { bad.push(e.message); } }
      must(!bad.length, bad.join(' ; '));
    });
  }

  /* Aufräumen: Konto 1 löschen */
  await step('6c Konto 1 löschen, Anmeldung schlägt fehl', async () => { cur = page1; await page1.setViewportSize({ width: 390, height: 844 }); await del(page1); await login(page1, MAIL1); must(!/guide|dossier|setup/.test(await hash(page1)), 'Anmeldung mit gelöschtem Konto klappt noch'); });
} catch (e) {
  results.push({ name: 'Testlauf abgebrochen', ok: false, msg: String(e.stack || e).slice(0, 400) });
} finally {
  await browser?.close();
}

console.log('\n===== Lifely E2E =====  URL: ' + URL);
for (const r of results) console.log((r.ok ? 'PASS  ' : 'FAIL  ') + r.name + (r.msg ? '\n        -> ' + r.msg : ''));
if (chatLog.length) console.log('\nChat-Log: ' + chatLog.join(' ; '));
if (warns.length) { console.log('\nWARNUNGEN:'); [...new Set(warns)].forEach(w => console.log('  - ' + w)); }
const f = results.filter(r => !r.ok).length; console.log(`\n${results.length - f} PASS, ${f} FAIL. Screenshots: ${SHOTS}`);
process.exit(f ? 1 : 0);
