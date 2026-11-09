#!/usr/bin/env node
// Lifely – Übersetzungs-Lückenprüfung (nur lesen, ändert nichts in app-neu/).
// Aufruf: node tools/i18n-luecken.mjs [Ausgabedatei.json]
// Sammelt alle t('…')-Schlüssel (auch T(…), LF.t(…)) aus app-neu/*.js, dazu die dynamisch übersetzten Texte aus
// data.js / topics.js / tour.js (Eigenschaften wie title, hint, label, ph, q, text …), prüft fr/it/en in i18n.js
// und vergleicht die {x}-Variablen. Listet ausserdem hartkodierte deutsche Texte ohne t().
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = path.join(ROOT, 'app-neu');
const OUT = process.argv[2] || '/private/tmp/claude-501/-Users-ilies-Desktop-Projekte-Lifely/5cd575d2-6829-4726-9f41-8c9e9615a190/scratchpad/luecken.json';
const LANGS = ['fr', 'it', 'en'];
const DATEN = new Set(['data.js', 'topics.js', 'tour.js']); // Inhalte, die zur Laufzeit mit t() übersetzt werden
const TEXT_KEYS = new Set(['title', 'hint', 'label', 'ph', 'q', 'explain', 'text', 'intro', 'outro', 'tagline', 'example', 'none', 'desc', 'sub', 'name', 'placeholder', 'summary', 'info']);

// ---------- Übersetzungen laden ----------
const sandbox = { window: {} }; sandbox.window.LF = {}; sandbox.LF = sandbox.window.LF;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(APP, 'i18n.js'), 'utf8').replace(/^\s*window\.LF\s*=\s*window\.LF\s*\|\|\s*\{\};?/m, 'window.LF = window.LF || {};'), sandbox);
const I18N = sandbox.window.LF.I18N || {};

// ---------- Mini-Lexer für JS ----------
function lex(src, baseLine = 1) {
  const toks = []; let i = 0, line = baseLine; const n = src.length;
  const decode = (s) => s.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[\s\S])/g, (m, c) => {
    if (c[0] === 'u') return String.fromCodePoint(parseInt(c.replace(/[u{}]/g, ''), 16));
    if (c[0] === 'x' && c.length === 3) return String.fromCharCode(parseInt(c.slice(1), 16));
    return { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' }[c] ?? c;
  });
  const regexOk = () => { const p = toks[toks.length - 1]; if (!p) return true; if (p.k === 'str' || p.k === 'tpl' || p.k === 'num') return false; if (p.k === 'id') return /^(return|typeof|case|in|of|delete|void|throw|new|else|do)$/.test(p.v); return !/^[)\]}]$/.test(p.v); };
  while (i < n) {
    const c = src[i];
    if (c === '\n') { line++; i++; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); const end = e < 0 ? n : e + 2; line += (src.slice(i, end).match(/\n/g) || []).length; i = end; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1; while (j < n && src[j] !== c) { if (src[j] === '\\') j++; if (src[j] === '\n') line++; j++; }
      toks.push({ k: 'str', v: decode(src.slice(i + 1, j)), line }); i = j + 1; continue;
    }
    if (c === '`') {
      // Template: Text und ${…}-Ausdrücke trennen; Ausdrücke werden rekursiv gelext
      const startLine = line; let j = i + 1, buf = '', hasExpr = false; const parts = [];
      while (j < n && src[j] !== '`') {
        if (src[j] === '\\') { buf += src.slice(j, j + 2); j += 2; continue; }
        if (src[j] === '$' && src[j + 1] === '{') {
          hasExpr = true; parts.push(decode(buf)); buf = ''; let d = 1; j += 2; const s = j;
          while (j < n && d) { const ch = src[j]; if (ch === '{') d++; else if (ch === '}') d--; else if (ch === '`') { j++; while (j < n && src[j] !== '`') { if (src[j] === '\\') j++; j++; } } else if (ch === '"' || ch === "'") { j++; while (j < n && src[j] !== ch) { if (src[j] === '\\') j++; j++; } } if (ch === '\n') line++; if (d) j++; }
          parts.push({ expr: src.slice(s, j) }); j++; continue;
        }
        if (src[j] === '\n') line++;
        buf += src[j]; j++;
      }
      parts.push(decode(buf));
      toks.push({ k: 'tpl', v: parts.filter((p) => typeof p === 'string').join(' '), parts, hasExpr, line: startLine });
      for (const part of parts) if (typeof part !== 'string') { toks.push({ k: 'p', v: '${', line: startLine }, ...lex(part.expr, startLine), { k: 'p', v: '}', line: startLine }); }
      i = j + 1; continue;
    }
    if (c === '/' && regexOk()) { let j = i + 1, cls = false; while (j < n && (src[j] !== '/' || cls)) { if (src[j] === '\\') j++; else if (src[j] === '[') cls = true; else if (src[j] === ']') cls = false; j++; } j++; while (/[a-z]/i.test(src[j] || '')) j++; toks.push({ k: 're', v: '', line }); i = j; continue; }
    if (/[A-Za-z_$]/.test(c)) { let j = i + 1; while (j < n && /[\w$]/.test(src[j])) j++; toks.push({ k: 'id', v: src.slice(i, j), line }); i = j; continue; }
    if (/[0-9]/.test(c)) { let j = i + 1; while (j < n && /[\w.]/.test(src[j])) j++; toks.push({ k: 'num', v: src.slice(i, j), line }); i = j; continue; }
    const two = src.slice(i, i + 2);
    if (two === '||' || two === '??' || two === '=>' || two === '?.') { toks.push({ k: 'p', v: two, line }); i += 2; continue; }
    toks.push({ k: 'p', v: c, line }); i++;
  }
  return toks;
}

// ---------- Hilfsfunktionen ----------
const vars = (s) => [...new Set([...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();
const DE_HINT = /[äöüÄÖÜß]|\b(und|oder|der|die|das|den|dem|ein|eine|einen|nicht|Sie|Ihre?[nrms]?|wir|ist|sind|mit|für|von|zu|auf|wird|haben|bitte|noch|alle|keine?|mehr|wenn|dass|aus|bei|nach|wie|was|wer|Ihnen|Angaben|Datei|Datei|Fehler|Speichern|Löschen|Abbrechen|Weiter|Zurück)\b/;
const looksGerman = (s) => { const x = s.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim(); return x.length >= 4 && /[A-Za-zÄÖÜäöü]{3}/.test(x) && /\s|[äöüÄÖÜ]/.test(x) && DE_HINT.test(x) && !/^(https?:|\/|[\w-]+\/[\w./-]+$)/.test(x); };

// ---------- Schlüssel und Fremdtexte sammeln ----------
const files = fs.readdirSync(APP).filter((f) => f.endsWith('.js') && f !== 'i18n.js' && f !== 'sw.js' && f !== 'config.js').sort();
const keys = new Map();   // Schlüssel -> {dateien:Set, zeilen:[], dyn:bool}
const ohneT = new Map();  // Text -> {datei, zeile, art}
const dynNichtGeprueft = []; // t(variable) oder t(`…${x}…`)
const addKey = (k, f, line, dyn) => { if (!k.trim()) return; const e = keys.get(k) || { dateien: new Set(), zeilen: [], dyn: false }; e.dateien.add(f); e.zeilen.push(`${f}:${line}`); if (dyn) e.dyn = true; keys.set(k, e); };

for (const f of files) {
  const src = fs.readFileSync(path.join(APP, f), 'utf8');
  const toks = lex(src);
  const stack = []; // Klammern: true wenn t(…)-Aufruf
  const inT = () => stack.length && stack[stack.length - 1];
  const inData = DATEN.has(f);
  let optDepth = 0; // [ … ] direkt nach options:
  const brk = [];
  for (let i = 0; i < toks.length; i++) {
    const tk = toks[i], p = toks[i - 1], pp = toks[i - 2];
    if (tk.k === 'p' && tk.v === '(') {
      const isT = p && p.k === 'id' && /^(t|T)$/.test(p.v) && !(pp && pp.k === 'p' && pp.v === '.' && false) || (p && p.k === 'id' && p.v === 't' && pp && pp.v === '.' );
      stack.push(!!isT && !(pp && pp.k === 'id' && /^(function|const|let|var)$/.test(pp.v)));
    } else if (tk.k === 'p' && tk.v === ')') stack.pop();
    else if (tk.k === 'p' && tk.v === '[') brk.push(!!(p && p.v === ':' && pp && pp.v === 'options'));
    else if (tk.k === 'p' && tk.v === ']') brk.pop();
    if (tk.k !== 'str' && tk.k !== 'tpl') continue;
    const direct = p && ((p.k === 'p' && /^(\(|\?|:|\|\||\?\?)$/.test(p.v)));
    if (inT() && direct) {
      if (tk.k === 'tpl' && tk.hasExpr) { dynNichtGeprueft.push(`${f}:${tk.line} t(\`${tk.v.slice(0, 60)}…\`)`); }
      else addKey(tk.k === 'tpl' ? tk.v : tk.v, f, tk.line, false);
      continue;
    }
    if (inT() && !direct) continue;
    // Dynamisch übersetzte Daten (Zeichenketten in Eigenschaften)
    if (inData && tk.k === 'str') {
      const keyed = p && p.v === ':' && pp && TEXT_KEYS.has(pp.v);
      const inOptions = brk.length && brk[brk.length - 1];
      const callArg = f === 'topics.js' && tk.v.length >= 12 && /\s/.test(tk.v) && p && /^[(,]$/.test(p.v) && looksGerman(tk.v) && !keyed;
      if (keyed || inOptions || callArg) { if (looksGerman(tk.v) || inOptions || /\s/.test(tk.v) || /^[A-ZÄÖÜ]/.test(tk.v)) addKey(tk.v, f, tk.line, true); }
      continue;
    }
    // Hartkodiertes Deutsch ausserhalb von t()
    if (tk.k === 'str' && looksGerman(tk.v) && tk.v.length < 400) {
      const before = toks.slice(Math.max(0, i - 4), i).map((x) => x.v).join(' ');
      if (/\b(console|throw|Error|import|require|querySelector|addEventListener|getElementById|matches|closest)\b/.test(before)) continue;
      if (!ohneT.has(tk.v)) ohneT.set(tk.v, { datei: f, zeile: tk.line, art: 'string' });
    } else if (tk.k === 'tpl' && /<\w/.test(tk.parts.filter((x) => typeof x === 'string').join('')) ) {
      // HTML-Vorlage: Textknoten zwischen > und <
      for (const part of tk.parts) {
        if (typeof part !== 'string') continue;
        for (const m of part.matchAll(/>([^<>]{3,})</g)) { const txt = m[1].replace(/\s+/g, ' ').trim(); if (looksGerman(txt) && !ohneT.has(txt)) ohneT.set(txt, { datei: f, zeile: tk.line, art: 'html' }); }
        for (const m of part.matchAll(/\b(?:placeholder|title|aria-label|alt)="([^"$]{3,})"/g)) { const txt = m[1].trim(); if (looksGerman(txt) && !ohneT.has(txt)) ohneT.set(txt, { datei: f, zeile: tk.line, art: 'attribut' }); }
      }
    } else if (tk.k === 'tpl' && !tk.hasExpr && looksGerman(tk.v)) {
      if (!ohneT.has(tk.v.trim())) ohneT.set(tk.v.trim(), { datei: f, zeile: tk.line, art: 'template' });
    }
  }
}
// Schon als Schlüssel erkannte Texte nicht doppelt als «ohne t()» melden (z. B. in Daten, die später übersetzt werden)
for (const k of keys.keys()) ohneT.delete(k);
// Texte, die in i18n.js stehen, aber nicht direkt in t('…') (z. B. über Hilfsfunktion T(x) oder Variablen), werden getrennt geführt
const indirekt = [];
for (const [k, v] of [...ohneT]) if (LANGS.some((l) => I18N[l]?.[k])) { indirekt.push({ text: k, ...v }); ohneT.delete(k); }

// ---------- Prüfen ----------
const luecken = {}; const stat = { schluessel: keys.size, ohneLuecke: 0, fehlt: { fr: 0, it: 0, en: 0 }, variablen: 0 };
for (const [k, info] of [...keys].sort((a, b) => a[0].localeCompare(b[0], 'de'))) {
  const fehlt = [], varFehler = {};
  const vDe = vars(k);
  for (const l of LANGS) {
    const v = I18N[l]?.[k];
    if (typeof v !== 'string' || !v.trim()) { fehlt.push(l); stat.fehlt[l]++; continue; }
    const vl = vars(v);
    if (vl.join() !== vDe.join()) varFehler[l] = { de: vDe, [l]: vl };
  }
  if (fehlt.length || Object.keys(varFehler).length) {
    luecken[k] = { fehlt, ...(Object.keys(varFehler).length ? { variablen: varFehler } : {}), dateien: [...info.dateien], ...(info.dyn ? { dynamisch: true } : {}) };
    if (Object.keys(varFehler).length) stat.variablen++;
  } else stat.ohneLuecke++;
}
// Übersetzungen in i18n.js ohne Verwendung im Code (nur zur Info; dynamisch zusammengesetzte Texte möglich)
const ungenutzt = {}; for (const l of LANGS) ungenutzt[l] = Object.keys(I18N[l] || {}).filter((k) => !keys.has(k));
const nurNichtInAllen = [...new Set(LANGS.flatMap((l) => Object.keys(I18N[l] || {})))].filter((k) => LANGS.some((l) => !I18N[l]?.[k]));

const result = {
  erzeugt: new Date().toISOString(),
  statistik: { ...stat, ohneT: ohneT.size, ungenutztInI18n: Object.fromEntries(LANGS.map((l) => [l, ungenutzt[l].length])), eintraegeNichtInAllenSprachen: nurNichtInAllen.length },
  luecken,
  indirekt_uebersetzt_pruefen: indirekt,
  ohne_t: [...ohneT].map(([text, v]) => ({ text, ...v })),
  dynamisch_nicht_geprueft: dynNichtGeprueft,
  ungenutzt_in_i18n: Object.fromEntries(LANGS.map((l) => [l, ungenutzt[l]])),
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(result, null, 2));

console.log(`Schlüssel im Code: ${stat.schluessel}, vollständig: ${stat.ohneLuecke}, mit Lücken: ${Object.keys(luecken).length}`);
console.log(`Fehlend fr/it/en: ${stat.fehlt.fr}/${stat.fehlt.it}/${stat.fehlt.en}; Variablen abweichend: ${stat.variablen}`);
console.log(`Hartkodierte deutsche Texte ohne t(): ${ohneT.size}; t() mit dynamischem Inhalt (nicht prüfbar): ${dynNichtGeprueft.length}`);
console.log(`Texte in i18n.js, aber nicht direkt in t('…') (Hilfsfunktion/Variable, bitte prüfen): ${indirekt.length}`);
console.log(`In i18n.js, aber im Code nicht gefunden: fr ${ungenutzt.fr.length}, it ${ungenutzt.it.length}, en ${ungenutzt.en.length}`);
console.log(`Ausgabe: ${OUT}`);
