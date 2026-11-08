// Lifely: Nur-lesen-Ansicht mit Key (ohne Konto).
import { createClient } from 'npm:@supabase/supabase-js@2';

const ALLOWED = [/^https:\/\/icham135\.github\.io$/, /^http:\/\/localhost(:\d+)?$/];
let CORS: Record<string, string> = {};
const setCors = (req: Request) => {
  const o = req.headers.get('Origin') || '';
  CORS = ALLOWED.some((r) => r.test(o)) ? { 'Access-Control-Allow-Origin': o, 'Vary': 'Origin', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' } : { 'Vary': 'Origin' };
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const SALT = (Deno.env.get('KEY_SALT') || 'lifely-ansicht-v1') + '-';

async function sha256(s: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
function normalize(k: string) {
  let s = String(k || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (s.length === 16 && s.startsWith('LIFE')) s = s.slice(4);
  return s;
}
// Alle path-Werte aus files-Listen sammeln (rekursiv)
function collect(node: any, out: Set<string>, uid: string) {
  if (Array.isArray(node)) { node.forEach((x) => collect(x, out, uid)); return; }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'files' && Array.isArray(v)) v.forEach((f: any) => { if (f && typeof f.path === 'string' && f.path.startsWith(uid + '/') && !f.path.includes('..')) out.add(f.path); });
      collect(v, out, uid);
    }
  }
}

Deno.serve(async (req) => {
  setCors(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Nicht erlaubt.' }, 405);
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    let b: any;
    try { b = await req.json(); } catch { return json({ error: 'Ungültige Anfrage.' }, 400); }
    const ip = (req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unbekannt').split(',')[0].trim();
    const ipHash = await sha256(SALT + ip);

    const k = normalize(b?.key);
    const hash = k.length === 12 ? await sha256(k) : '';
    const { data: ak } = hash ? await admin.from('access_keys').select('id,user_id,label,uses').eq('key_hash', hash).is('revoked_at', null).maybeSingle() : { data: null };
    if (!ak) {
      // Falscher Key: alte Versuche aufräumen, zählen, ggf. sperren (gültige Keys sind nie gesperrt)
      await admin.from('key_attempts').delete().lt('at', new Date(Date.now() - 86400000).toISOString());
      const { count } = await admin.from('key_attempts').select('*', { count: 'exact', head: true }).eq('ip_hash', ipHash).eq('ok', false).gte('at', new Date(Date.now() - 15 * 60000).toISOString());
      if ((count ?? 0) > 25) return json({ error: 'Zu viele Versuche. Bitte warten Sie 15 Minuten und versuchen Sie es dann nochmals.' }, 429);
      await admin.from('key_attempts').insert({ ip_hash: ipHash, ok: false });
      return json({ error: 'Dieser Key stimmt nicht.' }, 404);
    }

    await admin.rpc('lf_key_use', { kid: ak.id });
    const { data: d } = await admin.from('dossiers').select('data,settings,updated_at').eq('user_id', ak.user_id).maybeSingle();
    const data = d?.data ?? {};
    const paths = new Set<string>(); collect(data, paths, ak.user_id);
    const urls: Record<string, string> = {};
    if (paths.size) {
      const { data: sg, error } = await admin.storage.from('dossier-files').createSignedUrls([...paths], 3600);
      if (error) console.error('signieren', error.message);
      (sg || []).forEach((s: any) => { if (s.path && s.signedUrl) urls[s.path] = s.signedUrl; });
    }
    return json({ name: data?.profile?.name || d?.settings?.name || '', label: ak.label, data, urls, updated: d?.updated_at ? Date.parse(d.updated_at) : 0 });
  } catch (e) {
    console.error('ansicht', e);
    return json({ error: 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später nochmals.' }, 500);
  }
});
