// Lifely: Konto löschen (Dateien, Zeilen, Nutzer).
import { createClient } from 'npm:@supabase/supabase-js@2';

const ALLOWED = [/^https:\/\/icham135\.github\.io$/, /^http:\/\/localhost(:\d+)?$/];
let CORS: Record<string, string> = {};
const setCors = (req: Request) => {
  const o = req.headers.get('Origin') || '';
  CORS = ALLOWED.some((r) => r.test(o)) ? { 'Access-Control-Allow-Origin': o, 'Vary': 'Origin', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' } : { 'Vary': 'Origin' };
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

// Alle Dateien unter prefix rekursiv sammeln
async function listAll(admin: any, prefix: string): Promise<string[]> {
  const out: string[] = [];
  const { data, error } = await admin.storage.from('dossier-files').list(prefix, { limit: 1000 });
  if (error) throw error;
  for (const it of data || []) {
    if (it.id) out.push(`${prefix}/${it.name}`);
    else out.push(...await listAll(admin, `${prefix}/${it.name}`));
  }
  return out;
}

Deno.serve(async (req) => {
  setCors(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Nicht erlaubt.' }, 405);
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: u, error: ue } = token ? await admin.auth.getUser(token) : { data: null, error: new Error('kein Token') };
    if (ue || !u?.user) return json({ error: 'Bitte melden Sie sich an.' }, 401);
    const uid = u.user.id;
    let b: any = {}; try { b = await req.json(); } catch { /* leer */ }
    if (b?.action !== 'delete') return json({ error: 'Ungültige Anfrage.' }, 400);

    const files = await listAll(admin, uid);
    for (let i = 0; i < files.length; i += 100) {
      const { error } = await admin.storage.from('dossier-files').remove(files.slice(i, i + 100));
      if (error) throw error;
    }
    for (const t of ['dossiers', 'access_keys', 'ai_usage']) {
      const { error } = await admin.from(t).delete().eq('user_id', uid);
      if (error) throw error;
    }
    const { error: de } = await admin.auth.admin.deleteUser(uid);
    if (de) throw de;
    return json({ ok: true });
  } catch (e) {
    console.error('konto', e);
    return json({ error: 'Das Konto konnte nicht gelöscht werden. Bitte versuchen Sie es später nochmals.' }, 500);
  }
});
