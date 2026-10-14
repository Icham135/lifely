/* App-Screenshots für Landingpage und Umfrage (Beispieldaten, nichts Echtes).
   Voraussetzung: lokaler Server auf Port 5173 (ruby -run -e httpd . -p 5173).
   Aufruf: node tools/screens.mjs  → img/screen-*.png */
import { chromium } from '/Users/ilies/Desktop/Brained/node_modules/playwright/index.mjs';

const BASE = 'http://localhost:5173/app/index.html';
const OUT = new URL('../img/', import.meta.url).pathname;
const seed = {
  lang: 'de', intro_seen: true, size: 'normal',
  user: { name: 'Margrit', email: 'margrit.keller@gmail.com', via: 'Google', consented: true, onboarded: true, created: Date.now(), profile: { age: '75 bis 84' } },
  contacts: [{ name: 'Thomas Keller', relation: 'Sohn', contact: '079 123 45 67' }],
  info: {
    people: [{ art: 'Hausarzt / Hausärztin', name: 'Dr. Anna Meier', note: '031 123 45 67' }],
    contracts: [{ art: 'Handy', name: 'Swisscom', note: 'Abo, monatlich' }, { art: 'Zeitung / Zeitschrift', name: 'Der Bund', note: '' }],
    funeral: { art: 'Kremation (Urne)', place: 'Friedhof Bremgarten, Bern', ceremony: 'Im engsten Kreis', note: '' },
  },
};
const docs = [
  ['Krankenkasse Police 2026', 'versicherung', 'Original im blauen Ordner im Wohnzimmer'],
  ['Patientenverfügung', 'patvf', 'Kopie bei Dr. Meier'],
  ['Mietvertrag', 'wohnen', ''],
  ['Vorsorgeauftrag', 'vorsorge', 'Original beim Notar'],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.goto(BASE);
await page.evaluate(async ({ seed, docs }) => {
  Object.entries(seed).forEach(([k, v]) => localStorage.setItem('lifely_' + k, JSON.stringify(v)));
  // Beispiel-Dokumente als gezeichnete Blätter
  const paper = (title) => new Promise(res => {
    const c = document.createElement('canvas'); c.width = 600; c.height = 800;
    const g = c.getContext('2d');
    g.fillStyle = '#e9e4da'; g.fillRect(0, 0, 600, 800);
    g.fillStyle = '#fff'; g.fillRect(40, 30, 520, 740);
    g.fillStyle = '#1f3a36'; g.font = 'bold 34px sans-serif'; g.fillText(title, 80, 120);
    g.fillStyle = '#c9d2cf'; for (let y = 180; y < 700; y += 36) g.fillRect(80, y, 380 + (y * 7 % 80), 12);
    c.toBlob(res, 'image/jpeg', 0.8);
  });
  await db.clear();
  let t = Date.now();
  for (const [title, category, note] of docs) await db.put({ id: crypto.randomUUID(), title, category, note, type: 'image', blob: await paper(title), created: t -= 86400000 * 9 });
}, { seed, docs });

const shot = async (name, hash, prep) => {
  await page.goto(BASE + '?s=' + name + '#' + hash);
  await page.evaluate(() => { window.LIFELY_AI.apiKey = ''; document.querySelector('.splash')?.remove(); });
  await page.waitForTimeout(400);
  if (prep) await prep();
  await page.evaluate(() => document.querySelector('.splash')?.remove());
  await page.waitForTimeout(700);
  await page.screenshot({ path: OUT + 'screen-' + name + '.png' });
};
await shot('start', 'home');
await shot('dokumente', 'docs');
await shot('vorsorge', 'vorsorge');
await shot('notfall', 'emergency');
await shot('assistent', 'home', async () => {
  await page.evaluate(() => { document.querySelector('[data-kb="0"]').click(); });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
});
await browser.close();
console.log('fertig');
