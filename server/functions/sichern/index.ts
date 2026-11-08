// Lifely: Sichern beim Schliessen der Seite. Einfache Anfrage (text/plain, ohne Vorabprüfung), Token im Body, Zeilenschutz bleibt über den Nutzer-Client wirksam.
import { createClient } from 'npm:@supabase/supabase-js@2';

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Nicht erlaubt.' }, 405);
  try {
    if (Number(req.headers.get('content-length') || 0) > 100000) return json({ error: 'Zu gross.' }, 413);
    let b: any; try { b = JSON.parse(await req.text()); } catch { return json({ error: 'Ungültige Anfrage.' }, 400); }
    const url = Deno.env.get('SUPABASE_URL')!;
    const token = String(b?.token || '');
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: u, error: ue } = token ? await admin.auth.getUser(token) : { data: null, error: new Error('kein Token') };
    if (ue || !u?.user) return json({ error: 'Bitte melden Sie sich an.' }, 401);
    const me = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: `Bearer ${token}` } } });
    if (typeof b.sec === 'string' && b.sec.length <= 40 && b.val && typeof b.val === 'object') {
      const { error } = await me.rpc('lf_save_section', { sec: b.sec, val: b.val });
      if (error) throw error;
    }
    if (b.meta && typeof b.meta === 'object') {
      const { error } = await me.from('dossiers').update({ guide: b.meta.guide ?? {}, settings: b.meta.settings ?? {} }).eq('user_id', u.user.id);
      if (error) throw error;
    }
    return json({ ok: true });
  } catch (e) {
    console.error('sichern', e);
    return json({ error: 'Speichern hat nicht geklappt.' }, 500);
  }
});
