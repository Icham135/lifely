// Lifely: Edge Functions per Management-API deployen. Start: node server/deploy.mjs [name …]
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const REF = 'qvhrfbjhjkjcjnotyybj';
const TOKEN = process.env.LIFELY_TOKEN || (existsSync('/Users/ilies/Desktop/Brained/keys/lifely-token.txt') ? readFileSync('/Users/ilies/Desktop/Brained/keys/lifely-token.txt', 'utf8').trim() : '');
if (!TOKEN) { console.error('Kein Token (LIFELY_TOKEN oder keys/lifely-token.txt).'); process.exit(1); }
const JWT = { fuehrung: true, ansicht: false, konto: true, sichern: false };
const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(JWT);
for (const name of names) {
  const fd = new FormData();
  fd.append('metadata', JSON.stringify({ name, entrypoint_path: 'index.ts', verify_jwt: JWT[name] }));
  fd.append('file', new Blob([readFileSync(join(here, 'functions', name, 'index.ts'))], { type: 'application/typescript' }), 'index.ts');
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/functions/deploy?slug=${name}`, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}` }, body: fd });
  console.log(r.ok ? `ok ${name}` : `FEHLER ${name}: ${r.status} ${(await r.text()).slice(0, 300)}`);
}
