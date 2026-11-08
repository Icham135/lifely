// Lifely: KI-Assistent (ask) und Freitext-Zerlegung (extract). Anbieter: Groq.
import { createClient } from 'npm:@supabase/supabase-js@2';

const ALLOWED = [/^https:\/\/icham135\.github\.io$/, /^http:\/\/localhost(:\d+)?$/];
let CORS: Record<string, string> = {};
const setCors = (req: Request) => {
  const o = req.headers.get('Origin') || '';
  CORS = ALLOWED.some((r) => r.test(o)) ? { 'Access-Control-Allow-Origin': o, 'Vary': 'Origin', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' } : { 'Vary': 'Origin' };
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const LIMIT = 150;
const KB = `F: Was gehört in eine Patientenverfügung?
A: In der Patientenverfügung halten Sie fest, welche medizinischen Behandlungen Sie wünschen oder ablehnen, falls Sie nicht mehr selbst entscheiden können. Sie muss schriftlich, datiert und unterschrieben sein (Art. 371 ZGB). Sie können auch eine Person bestimmen, die für Sie entscheidet. Geben Sie Ihrem Hausarzt eine Kopie und prüfen Sie die Verfügung alle 1–2 Jahre. Vorlagen gibt es z. B. bei Pro Senectute, der FMH oder dem Roten Kreuz.

F: Was ist ein Vorsorgeauftrag?
A: Mit einem Vorsorgeauftrag bestimmen Sie, wer sich um Ihre Finanzen, Ihre Post und Ihre Person kümmert, wenn Sie urteilsunfähig werden. Er muss vollständig von Hand geschrieben, datiert und unterschrieben oder öffentlich beurkundet sein (Art. 361 ZGB). Beim Zivilstandsamt können Sie eintragen lassen, dass es einen Vorsorgeauftrag gibt und wo er liegt.

F: Wie schreibe ich ein gültiges Testament?
A: Ein eigenhändiges Testament muss von Anfang bis Ende von Hand geschrieben sein, mit Ort, Datum und Unterschrift (Art. 505 ZGB). Beachten Sie die Pflichtteile der Erben. Bewahren Sie das Original sicher auf, z. B. bei einem Notar oder der amtlichen Hinterlegungsstelle Ihres Kantons, und legen Sie in Lifely einen Hinweis ab, wo es liegt.

F: Was müssen Angehörige im Todesfall zuerst tun?
A: Zuerst stellt ein Arzt die Todesbescheinigung aus. Der Todesfall muss innert 2 Tagen beim Zivilstandsamt gemeldet werden – oft übernehmen das Spital, das Heim oder das Bestattungsunternehmen. Danach: Bestatter kontaktieren, Bestattungswünsche prüfen (in Lifely unter «Bestattungswünsche») und ein vorhandenes Testament sofort der zuständigen Behörde einreichen (Art. 556 ZGB).

F: Wen muss man nach einem Todesfall informieren?
A: Informieren Sie Banken, AHV-Ausgleichskasse, Pensionskasse, Kranken- und weitere Versicherungen sowie den Arbeitgeber. Prüfen Sie, ob Hinterlassenenrenten beantragt werden können. Banken geben meist erst mit einer Erbbescheinigung Auskunft. In Lifely finden Sie unter «Banken & Institute» und «Verträge & Abos» die Liste aller Stellen.

F: Was passiert mit dem Mietvertrag?
A: Der Mietvertrag geht auf die Erben über. Sie können ihn mit der gesetzlichen Frist auf den nächsten gesetzlichen Termin kündigen, auch wenn im Vertrag etwas anderes steht (Art. 266i OR). Abos und Verträge (Handy, Zeitung, Vereine) sollten ebenfalls gekündigt werden – die Liste steht in Lifely unter «Verträge & Abos».

F: Was tun bei einem Notfall im Spital?
A: Nehmen Sie, wenn möglich, die Patientenverfügung, den Vorsorgeauftrag und eine Medikamentenliste mit. Informieren Sie den Hausarzt. In der Lifely-Notfall-Ansicht finden Angehörige alle wichtigen Kontakte und Dokumente auf einen Blick.

F: Soll ich meine Passwörter in Lifely speichern?
A: Nein. Lifely speichert bewusst keine Passwörter oder PIN-Codes. Notieren Sie nur, wo Sie Konten haben. Für den digitalen Nachlass eignet sich ein Passwort-Manager mit Notfallzugang oder ein versiegelter Umschlag beim Notar.`;
const LANGS: Record<string, string> = { de: 'Deutsch (Schweizer Rechtschreibung, nie das Zeichen ß, immer «ss»)', fr: 'Français', it: 'Italiano', en: 'English' };

async function groq(models: string[], messages: unknown[], json_mode = false): Promise<string | null> {
  const key = Deno.env.get('GROQ_API_KEY');
  if (!key) return null;
  for (const model of models) {
    try {
      const body: Record<string, unknown> = { model, messages, temperature: 0.3, max_tokens: 900 };
      if (json_mode) body.response_format = { type: 'json_object' };
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) { console.error('groq', model, r.status, (await r.text()).slice(0, 200)); continue; }
      const j = await r.json();
      const txt = j?.choices?.[0]?.message?.content;
      if (typeof txt === 'string' && txt.trim()) return txt.trim();
    } catch (e) { console.error('groq fehler', model, e); }
  }
  return null;
}

const sysAsk = (lang: string, topic?: string) => `Du bist «Lifely», ein freundlicher Assistent in einer Vorsorge-App für Menschen ab 65 in der Schweiz.
Antworte in dieser Sprache: ${LANGS[lang] || LANGS.de}.
Regeln:
- Höchstens 110 Wörter, kurze Sätze, einfache Wörter, höfliche Anrede (Sie / vous / Lei / you). Fachbegriffe kurz erklären.
- Beziehe dich auf Schweizer Recht und Stellen (ZGB, Zivilstandsamt, AHV, KESB, Pro Senectute).
- Gib nie verbindliche Rechts- oder Arztberatung; verweise bei Unsicherheit auf Fachpersonen (Notar, Anwalt, Hausarzt, Pro Senectute).
- Frage nie nach Passwörtern, PINs, Kontonummern oder Ausweisnummern. Rate davon ab, sie in Lifely einzutragen.
- Bleibe beim Thema Vorsorge, Notfall, Todesfall, Nachlass und Dossier. Andere Themen höflich ablehnen und zum Thema zurückführen.
- Erfinde nichts. Wenn du etwas nicht sicher weisst, sage es.
${topic ? `- Beende die Antwort mit einem kurzen Hinweis im Stil «Weiter geht es mit ${topic}.» (in der Antwortsprache).` : '- Kein Schlusshinweis nötig.'}

Geprüftes Hintergrundwissen:
${KB}`;

const clip = (s: unknown, n: number) => String(s ?? '').slice(0, n);
// Nur harmlose Zeichen in den Prompt lassen (keine Zeilenumbrüche/Steuerzeichen)
const clean = (s: unknown, n: number) => String(s ?? '').replace(/[^\p{L}\p{N} &\-\/]/gu, '').replace(/\s+/g, ' ').trim().slice(0, n);
const cleanList = (a: unknown) => Array.isArray(a) ? a.slice(0, 20).map((x) => String(x ?? '').slice(0, 40)) : [];

function parseJson(txt: string): any {
  try { return JSON.parse(txt); } catch { /* weiter */ }
  const m = txt.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch { /* leer */ } }
  return null;
}

Deno.serve(async (req) => {
  setCors(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Nicht erlaubt.' }, 405);
  try {
    const SB = Deno.env.get('SUPABASE_URL')!;
    const admin = createClient(SB, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: u, error: ue } = token ? await admin.auth.getUser(token) : { data: null, error: new Error('kein Token') };
    if (ue || !u?.user) return json({ error: 'Bitte melden Sie sich an.' }, 401);
    const uid = u.user.id;

    if (Number(req.headers.get('content-length') || 0) > 40000) return json({ error: 'Die Eingabe ist zu gross.' }, 413);
    let b: any;
    try { b = await req.json(); } catch { return json({ error: 'Ungültige Anfrage.' }, 400); }
    const action = b?.action;
    const lang = LANGS[b?.lang] ? b.lang : 'de';

    // Eingaben prüfen
    let msgs: { role: string; content: string }[] = [];
    if (action === 'ask') {
      if (!Array.isArray(b.messages) || !b.messages.length) return json({ error: 'Ungültige Anfrage.' }, 400);
      msgs = b.messages.slice(-12).map((m: any) => ({ role: m?.role === 'assistant' ? 'assistant' : 'user', content: clip(m?.content, 2000) })).filter((m: any) => m.content);
      if (!msgs.length) return json({ error: 'Ungültige Anfrage.' }, 400);
    } else if (action === 'extract') {
      if (!['list', 'people'].includes(b.kind) || !clip(b.text, 4000).trim()) return json({ error: 'Ungültige Anfrage.' }, 400);
    } else return json({ error: 'Ungültige Anfrage.' }, 400);

    // Tageslimit pro Konto
    const { data: nn, error: ne } = await admin.rpc('lf_ai_take', { uid, lim: LIMIT });
    if (ne) { console.error('ai_take', ne.message); return json({ error: 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später nochmals.' }, 500); }
    if (Number(nn) > LIMIT) return json({ error: 'Für heute sind die KI-Antworten aufgebraucht. Morgen geht es weiter.' }, 429);

    const DOWN = { error: 'Die KI ist gerade nicht erreichbar. Sie können trotzdem weitermachen.' };
    if (action === 'ask') {
      const out = await groq(['openai/gpt-oss-120b', 'llama-3.3-70b-versatile'], [{ role: 'system', content: sysAsk(lang, b.topic ? clean(b.topic, 60) || undefined : undefined) }, ...msgs]);
      return out ? json({ reply: out }) : json(DOWN, 503);
    }

    // extract
    const text = clip(b.text, 4000);
    let sys: string;
    if (b.kind === 'list') {
      const types = cleanList(b.types).map((x) => clean(x, 40));
      sys = `Zerlege den Text einer Person in einzelne Einträge einer Liste. Antworte NUR mit JSON: {"items":[{"type":"","name":"","note":""}]}.
"type" muss genau einer dieser Werte sein: ${JSON.stringify(types)}; passt keiner, nimm "Andere".
"name" = kurzer Name (z. B. Firma/Produkt), "note" = weitere genannte Angaben (kurz, sonst leer).
Nur Genanntes, nichts erfinden. Passwörter, PINs, Kontonummern, IBAN und Ausweisnummern weglassen. Sprache der Einträge wie im Text.`;
    } else {
      const roles = cleanList(b.roles).map((x) => clean(x, 40));
      sys = `Zerlege den Text einer Person in einzelne Personen. Antworte NUR mit JSON: {"items":[{"name":"","rel":"","role":"","phone":"","note":""}]}.
"rel" = Beziehung (z. B. Tochter, Hausarzt), "role" muss genau einer dieser Werte sein: ${JSON.stringify(roles)} (passt keiner, leer lassen), "phone" = Telefonnummer falls genannt.
Nur Genanntes, nichts erfinden. Passwörter, PINs und Kontonummern weglassen.`;
    }
    const msg = [{ role: 'system', content: sys }, { role: 'user', content: text }];
    let out = await groq(['llama-3.3-70b-versatile'], msg, true);
    let parsed = out ? parseJson(out) : null;
    if (!parsed) { out = await groq(['openai/gpt-oss-120b'], msg); parsed = out ? parseJson(out) : null; }
    if (!out) return json(DOWN, 503);
    let items = Array.isArray(parsed?.items) ? parsed.items : [];
    items = items.slice(0, 50).map((it: any) => {
      if (b.kind === 'list') {
        const types = cleanList(b.types);
        const ty = types.find((x) => clean(x, 40) === clean(it?.type, 40)) ?? 'Andere';
        return { type: ty, name: clip(it?.name, 120), note: clip(it?.note, 300) };
      }
      const roles = cleanList(b.roles);
      return { name: clip(it?.name, 120), rel: clip(it?.rel, 80), role: roles.find((x) => clean(x, 40) === clean(it?.role, 40)) ?? '', phone: clip(it?.phone, 40), note: clip(it?.note, 300) };
    }).filter((it: any) => it.name);
    return json({ items });
  } catch (e) {
    console.error('fuehrung', e);
    return json({ error: 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später nochmals.' }, 500);
  }
});
