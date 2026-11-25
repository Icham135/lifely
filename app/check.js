/* Lifely – Plausibilitätsprüfung der Eingaben (Datum, Namen, Telefon). Gibt eine Fehlermeldung zurück oder '' wenn alles passt. */
(() => {
  const t = (s, v) => LF.t(s, v);
  // Wörter, die als Name einer Gesellschaft, Bank, Person oder eines Anbieters offensichtlich nicht passen (Scherz, Platzhalter, Tiere, Essen)
  const BLOCK = new Set(('hund katze kater maus pferd kuh schwein vogel fisch hase huhn ente affe baer bär löwe tiger elefant ' +
    'banane apfel birne pizza pasta kaese käse brot wurst kuchen schoggi schokolade bier wein kaffee ' +
    'test testen testing tester asdf qwertz qwerty abc abcd xyz xxx yyy zzz aaa bla blabla blub lol haha hihi hehe hallo hello hi hey ' +
    'nix nichts keine keiner egal irgendwas irgendwer keinen idk kp ka none null undefined nan dummy platzhalter foo ' +
    'scheisse scheiss scheiße fuck fick arsch shit idiot trottel depp dumm ' +
    'ja nein vielleicht ok okay').split(' '));
  const MASH = /(asdf|sdfg|dfgh|qwer|wert|ertz|yxcv|xcvb|hjkl|ghjk|uiop|jkl[öo]|1234|abcd)/i;
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

  const check = {
    /* Datum als TT.MM.JJJJ: gültig, nicht in der Zukunft, nicht vor 1900. Leer ist erlaubt. */
    date(v) {
      v = String(v || '').trim(); if (!v) return '';
      const m = v.match(/^(\d{1,2})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(\d{4})$/);
      if (!m) return t('Bitte schreiben Sie das Datum so: 12.03.1948');
      const d = +m[1], mo = +m[2], y = +m[3], dt = new Date(y, mo - 1, d);
      if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return t('Dieses Datum gibt es nicht. Bitte prüfen Sie Tag und Monat.');
      if (dt > today()) return t('Das Datum liegt in der Zukunft. Bitte prüfen Sie es.');
      if (y < 1900) return t('Dieses Jahr scheint nicht zu stimmen. Bitte prüfen Sie es.');
      return '';
    },
    /* Datum vereinheitlichen: «12-3-1948» → «12.03.1948» (so erwartet es auch der Server) */
    normDate(v) {
      const m = String(v || '').trim().match(/^(\d{1,2})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(\d{4})$/);
      return m ? `${m[1].padStart(2, '0')}.${m[2].padStart(2, '0')}.${m[3]}` : String(v || '').trim();
    },
    /* Name einer Gesellschaft, Bank, eines Anbieters oder einer Person. kind: 'firma' | 'person' | 'titel' */
    name(v, kind = 'firma') {
      v = String(v || '').trim();
      const msg = kind === 'person' ? t('Bitte geben Sie den Namen einer Person ein, zum Beispiel «Anna Muster».')
        : kind === 'titel' ? t('Bitte geben Sie einen kurzen Titel ein, zum Beispiel «Police Hausrat 2025».')
        : t('Bitte geben Sie einen echten Namen ein, zum Beispiel «CSS» oder «Mobiliar».');
      if (v.length < 2) return msg;
      if (v.length > 80) return t('Dieser Name ist zu lang. Bitte kürzen Sie ihn auf höchstens 80 Zeichen.');
      if ((v.match(/\p{L}/gu) || []).length < 2) return msg;
      if (/(.)\1{3,}/u.test(v)) return msg;                     // «aaaa», «xxxx»
      if (MASH.test(v.replace(/\s/g, ''))) return msg;          // Tastaturgekritzel
      if (/https?:\/\/|<|>|\bwww\./i.test(v)) return t('Bitte schreiben Sie hier nur den Namen, keinen Link.');
      const words = v.toLowerCase().split(/[^\p{L}\d]+/u).filter(Boolean);
      const core = words.filter((w) => !['und', 'oder', 'mit', 'der', 'die', 'das', 'ag', 'gmbh', 'sa'].includes(w));
      if (core.length && core.every((w) => BLOCK.has(w))) return msg;          // nur Fantasie- oder Scherzwörter
      if (kind !== 'titel' && core.length <= 2 && core.some((w) => BLOCK.has(w))) return msg;
      return '';
    },
    /* Telefonnummer: leer erlaubt, sonst 6–15 Ziffern, nur übliche Zeichen */
    phone(v) {
      v = String(v || '').trim(); if (!v) return '';
      if (!/^[+\d][\d\s().\-/]*$/.test(v)) return t('Bitte schreiben Sie nur Ziffern, zum Beispiel 079 123 45 67.');
      const n = v.replace(/\D/g, '').length;
      if (n < 6 || n > 15) return t('Diese Telefonnummer scheint nicht zu stimmen. Bitte prüfen Sie sie.');
      return '';
    },
  };
  LF.check = check;
})();
