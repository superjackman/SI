/* M2 generator: writes the "using agents" stations (U, Ua, Ub, Uc, Ud) into src/legacy/gen in the same formats as the
   legacy extraction, and merges them idempotently into the shared files (kb, quiz, qkey, search, outline, T8 glossary).
   Run: npm run m2      Check only (used by a unit test): npm run m2 -- --check
   Re-run after any legacy re-extraction (scripts/legacy/extract.mjs / islands.mjs), which rewrites the shared files. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, Page, popBody, strip, type Bi, type Lang, type OutlineRow, type StationOut, type T, type World } from './lib';
import { PARTS, PATHS, STATIONS, USE_LINKS } from './content/parts';
import { QUIZ } from './content/quiz';
import U from './content/U';
import Ua from './content/Ua';
import Ub from './content/Ub';
import Uc from './content/Uc';
import Ud from './content/Ud';

const GEN = join(dirname(fileURLToPath(import.meta.url)), '../src/legacy/gen');
const CHECK = process.argv.includes('--check');
const MODS: Record<string, (P: Page) => StationOut> = { U, Ua, Ub, Uc, Ud };
const SIDS = Object.keys(STATIONS);
const LANGS: Lang[] = ['zh', 'en'];
const MC = '#15803d';

type KPart = { n: Bi; cat: string; train: string; t: string; up?: string; zoom?: string; dn?: string[]; use?: string[]; links?: unknown };
interface KB { C: Record<string, KPart>; TABN: Record<string, Bi>; PATH: Record<string, string[]>; TABORDER: string[]; footer: Bi }

const files = new Map<string, string>();
const read = (p: string) => readFileSync(join(GEN, p), 'utf8');
const readJ = <X>(p: string): X => JSON.parse(read(p)) as X;
const put = (p: string, o: unknown, nl = true) => { files.set(p, JSON.stringify(o) + (nl ? '\n' : '')); };
const nlOf = (p: string) => !existsSync(join(GEN, p)) || read(p).endsWith('\n');

/* ---------- kb.json ---------- */
const kb = readJ<KB>('kb.json');
for (const id of Object.keys(PARTS)) delete kb.C[id];
for (const c of Object.values(kb.C)) delete c.use;
for (const s of SIDS) { delete kb.TABN[s]; delete kb.PATH[s]; }
kb.TABORDER = kb.TABORDER.filter((s) => !SIDS.includes(s));
kb.TABORDER.splice(kb.TABORDER.indexOf('T1') + 1, 0, ...SIDS);
for (const s of SIDS) { kb.TABN[s] = STATIONS[s] as Bi; kb.PATH[s] = PATHS[s] as string[]; }
for (const [id, p] of Object.entries(PARTS)) {
  const o: KPart = { n: p.n, cat: 'use', train: 'no', t: p.t };
  if (p.up) o.up = p.up; if (p.zoom) o.zoom = p.zoom; if (p.dn) o.dn = p.dn;
  kb.C[id] = o;
}
for (const [id, u] of Object.entries(USE_LINKS)) { const c = kb.C[id]; if (!c) throw new Error('use link on unknown part ' + id); c.use = u; }
for (const [id, c] of Object.entries(kb.C)) {
  for (const x of [...(c.dn ?? []), ...(c.use ?? []), ...(c.up ? [c.up] : [])]) if (!kb.C[x] && !kb.PATH[x]) throw new Error(`${id}: link target ${x} missing`);
  if (c.zoom && !kb.PATH[c.zoom]) throw new Error(`${id}: zoom ${c.zoom} missing`);
}
put('kb.json', kb);

const W: World = { order: kb.TABORDER, path: kb.PATH, tabn: kb.TABN, part: (id) => kb.C[id] };

/* ---------- stations, popups, outline ---------- */
const outline: Record<Lang, Record<string, OutlineRow[]>> = { zh: readJ('outline.zh.json'), en: readJ('outline.en.json') };
const cutRow = (r: OutlineRow, L: Lang): OutlineRow => {
  const n = 20;
  if (r[2] === 'lab') return [r[0], '🧪 ' + [...r[1].replace(/^🧪\s*/, '')].slice(0, L === 'en' ? 20 : 18).join(''), 'lab', r[3]];
  if (r[2] === 'quiz') return r;
  return [r[0], [...r[1].replace(/^[^\p{L}\p{N}]+/u, '')].slice(0, n).join(''), '', r[3]];
};
for (const L of LANGS) {
  const t: T = (zh, en) => (L === 'en' ? en : zh);
  for (const S of SIDS) {
    const P = new Page(S, L, W);
    const o = (MODS[S] as (P: Page) => StationOut)(P);
    put(`st/${S}.${L}.json`, { cls: 'level', html: P.html(o.sub, o.one, o.why, P.stage(o.svg, o.legend)) });
    const nodes: Record<string, { title: string; mc: string; body: string }> = {};
    for (const [id, p] of Object.entries(PARTS)) if (p.t === S) nodes[id] = { title: p.n[L], mc: MC, body: popBody(id, S, p.pop(t), W, L) };
    put(`nodes/${S}.${L}.json`, nodes);
    outline[L][S] = P.rows.map((r) => cutRow(r, L));
  }
  const ord: Record<string, OutlineRow[]> = {};
  for (const s of kb.TABORDER) if (outline[L][s]) ord[s] = outline[L][s] as OutlineRow[];
  put(`outline.${L}.json`, ord, nlOf(`outline.${L}.json`));
}

/* ---------- quiz + key ---------- */
const qz: Record<Lang, Record<string, unknown>> = { zh: readJ('quiz.zh.json'), en: readJ('quiz.en.json') };
const qkey = readJ<{ src: string; key: Record<string, number[]> }>('qkey.json');
for (const L of LANGS) {
  const Q = QUIZ((zh, en) => (L === 'en' ? en : zh));
  for (const S of SIDS) {
    const qs = Q[S]; if (!qs) throw new Error('no quiz for ' + S);
    qz[L][S] = qs;
    const key = qs.map((q) => q[2]);
    if (L === 'zh') qkey.key[S] = key; else if (JSON.stringify(qkey.key[S]) !== JSON.stringify(key)) throw new Error('quiz key differs between languages: ' + S);
    qs.forEach((q, i) => { if (q[2] < 0 || q[2] >= q[1].length) throw new Error(`bad key ${S}.${i}`); });
  }
  const ordered: Record<string, unknown> = {};
  for (const s of Object.keys(qz[L]).filter((s) => !SIDS.includes(s))) ordered[s] = qz[L][s];
  for (const s of SIDS) ordered[s] = qz[L][s];
  put(`quiz.${L}.json`, ordered, nlOf(`quiz.${L}.json`));
}
const keyOrd: Record<string, number[]> = {};
for (const s of Object.keys(qkey.key).filter((s) => !SIDS.includes(s))) keyOrd[s] = qkey.key[s] as number[];
for (const s of SIDS) keyOrd[s] = qkey.key[s] as number[];
put('qkey.json', { src: qkey.src, key: keyOrd }, nlOf('qkey.json'));

/* ---------- search roles ---------- */
const search = readJ<Record<string, Bi>>('search.json');
for (const [id, p] of Object.entries(PARTS)) search[id] = { zh: strip(p.pop((zh) => zh).role), en: strip(p.pop((_z, en) => en).role) };
put('search.json', search, nlOf('search.json'));

/* ---------- T8 glossary rows (marked data-m2 so a re-run replaces them) ---------- */
for (const L of LANGS) {
  const p = `st/T8.${L}.json`, st = readJ<{ cls: string; html: string }>(p);
  let h = st.html.replace(/<tr class="grp" data-m2="1">.*?<\/tr>|<tr data-m2="1">.*?<\/tr>/g, '');
  const lbl = L === 'en' ? { role: 'In one sentence', stop: 'Stop', up: 'Belongs to' } : { role: '一句话', stop: '所在页', up: '往上属于' };
  let rows = '';
  for (const S of SIDS) {
    rows += `<tr class="grp" data-m2="1"><td colspan="4">${esc((kb.PATH[S] as string[]).map((s) => (kb.TABN[s] as Bi)[L]).join(' › '))}</td></tr>`;
    for (const [id, part] of Object.entries(PARTS)) if (part.t === S) {
      const up = part.up ? `<a data-open="${part.up}">${esc((kb.C[part.up] as KPart).n[L])}</a>` : '—';
      rows += `<tr data-m2="1"><td><a data-open="${id}">${esc(part.n[L])}</a></td><td data-label="${lbl.role}">${esc((search[id] as Bi)[L])}</td><td data-label="${lbl.stop}"><a data-go="${S}">${esc((kb.TABN[S] as Bi)[L])}</a></td><td data-label="${lbl.up}">${up}</td></tr>`;
    }
  }
  const anchor = `<tr class="grp"><td colspan="4">${esc((kb.TABN.T1 as Bi)[L])} › ${esc((kb.TABN.T2 as Bi)[L])}</td></tr>`;
  if (!h.includes(anchor)) throw new Error('T8 glossary anchor not found: ' + anchor);
  h = h.replace(anchor, rows + anchor);
  put(p, { ...st, html: h });
}

/* ---------- write or check ---------- */
let stale = 0;
for (const [p, s] of files) {
  const f = join(GEN, p), cur = existsSync(f) ? readFileSync(f, 'utf8') : null;
  if (cur === s) continue;
  if (CHECK) { stale++; console.error('stale: ' + p); } else { writeFileSync(f, s); console.log('wrote ' + p); }
}
if (CHECK && stale) { console.error(`${stale} generated file(s) out of date: run npm run m2`); process.exit(1); }
if (CHECK) console.log('m2 gen up to date');
