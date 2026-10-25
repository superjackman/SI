/* M2 generator: writes the "using agents" stations (U, Ua, Ub, Uc, Ud and the M3 products stop Up) into src/legacy/gen in the same formats as the
   legacy extraction, and merges them idempotently into the shared files (kb, quiz, qkey, search, outline, T8 glossary).
   Run: npm run m2      Check only (used by a unit test): npm run m2 -- --check
   Re-run after any legacy re-extraction (scripts/legacy/extract.mjs / islands.mjs), which rewrites the shared files. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, fit, Page, popBody, strip, type Bi, type Lang, type OutlineRow, type PopSpec, type StationOut, type T, type World } from './lib';
import { PARTS, PATHS, STATIONS, USE_LINKS } from './content/parts';
import { QUIZ, type Q } from './content/quiz';
import U from './content/U';
import Ua from './content/Ua';
import Ub from './content/Ub';
import Uc from './content/Uc';
import Ud from './content/Ud';
import Up from './content/Up';
import Api from './content/Api';
import Loc from './content/Loc';
import Job from './content/Job';
import Skl from './content/Skl';
import Bld from './content/Bld';
import { KPARTS, KPATHS, KSTATIONS, MATH_LINKS } from './content/math/parts';
import { KQUIZ } from './content/math/quiz';
import K1 from './content/math/K1';
import K2 from './content/math/K2';
import K3 from './content/math/K3';
import K4 from './content/math/K4';
import K5 from './content/math/K5';
import { katexCss } from './tex';
import { CODES } from '../src/i18n/codes';
import { IC } from '../src/shell/common';
import type { Ext } from './content/ext/kit';
import { M4 } from './content/ext/m4';
import { M5 } from './content/ext/m5';
import { M6 } from './content/ext/m6';
import { M7 } from './content/ext/m7';
import { M8 } from './content/ext/m8';
import { M9 } from './content/ext/m9';
import { M10 } from './content/ext/m10';
import { M11 } from './content/ext/m11';
import { M12 } from './content/ext/m12';
import { HAND } from './content/handoff';
import { render as dgRender, legend as dgLegend } from './content/t1dg';
import { check as dgCheck } from './dgcheck';
import { PLAIN, PLAIN_STATIONS } from './plain';
import { glossaryJson, plainNodes, plainPage, topPlain } from './plainpass';
import { SYM } from './content/symbols';

const GEN = join(dirname(fileURLToPath(import.meta.url)), '../src/legacy/gen');
const CHECK = process.argv.includes('--check');
const MODS: Record<string, (P: Page) => StationOut> = { U, Ua, Ub, Uc, Ud, Up, Api, Loc, Job, Skl, Bld, K1, K2, K3, K4, K5 };
/* the usage stations go right after T1; the math layer (K1–K5) goes after T8 as its own appendix group */
const USIDS = Object.keys(STATIONS), KSIDS = Object.keys(KSTATIONS);
const SIDS = [...USIDS, ...KSIDS];
const ALLST: Record<string, Bi> = { ...STATIONS, ...KSTATIONS }, ALLPATH: Record<string, string[]> = { ...PATHS, ...KPATHS };
type AnyPart = { n: Bi; t: string; up?: string; zoom?: string; dn?: string[]; use?: string[]; cat?: string; train?: string; pop: (t: T) => PopSpec };
/* M4–M6: extension cards, labs, popups and quiz questions added to the legacy stations (injected between <!--m2x--> markers) */
const EXTS: Ext[] = [M4, M5, M6, M7, M8, M9, M10, M11, M12];
const XPARTS: Record<string, AnyPart> = Object.assign({}, ...EXTS.map((e) => e.parts));
const XCARDS: Record<string, ((P: Page) => void)[]> = {}, XLABS: Record<string, ((P: Page) => void)[]> = {};
const XNEAR: Record<string, { after: string; f: (P: Page) => void }[]> = {};
for (const e of EXTS) {
  for (const [S, a] of Object.entries(e.near ?? {})) (XNEAR[S] ??= []).push(...a);
  for (const [S, f] of Object.entries(e.cards)) (XCARDS[S] ??= []).push(f);
  for (const [S, f] of Object.entries(e.labs ?? {})) (XLABS[S] ??= []).push(f);
}
/* R24: "near" items on a generated station (K*, U*) are emitted by the station's own Page right after the anchor card,
   so its page map and outline pick them up like any other card; only legacy stations go through the re-insert pass */
const GNEAR: Record<string, { after: string; f: (P: Page) => void }[]> = {};
for (const S of Object.keys(XNEAR)) if (SIDS.includes(S)) { GNEAR[S] = XNEAR[S]!; delete XNEAR[S]; }
const hookNear = (P: Page) => {
  const a = GNEAR[P.S]; if (!a) return () => undefined;
  const seen = new Set<string>(), card = P.card.bind(P), lab = P.lab.bind(P);
  const after = (id: string) => { for (const n of a) if (n.after === id && !seen.has(n.after + '|' + a.indexOf(n))) { seen.add(n.after + '|' + a.indexOf(n)); n.f(P); } };
  P.card = (id, ...r) => { card(id, ...r); after(id); };
  P.lab = (id, ...r) => { lab(id, ...r); after(id); };
  return () => { const miss = a.filter((n) => !seen.has(n.after + '|' + a.indexOf(n))); if (miss.length) throw new Error(`near: no card ${miss.map((n) => n.after).join(', ')} on ${P.S}`); };
};
const XSIDS = [...new Set([...Object.keys(XCARDS), ...Object.keys(XLABS), ...Object.keys(XNEAR), ...Object.values(XPARTS).map((p) => p.t)])];
const ALLP: Record<string, AnyPart> = { ...PARTS, ...Object.fromEntries(Object.entries(KPARTS).map(([k, p]) => [k, { ...p, cat: 'math' }])), ...XPARTS };
const LANGS: Lang[] = ['zh', 'en'];
const MC = '#15803d';

type KPart = { n: Bi; cat: string; train: string; t: string; up?: string; zoom?: string; dn?: string[]; use?: string[]; math?: string[]; links?: unknown };
interface KB { C: Record<string, KPart>; TABN: Record<string, Bi>; PATH: Record<string, string[]>; TABORDER: string[]; footer: Bi }

const files = new Map<string, string>();
const read = (p: string) => readFileSync(join(GEN, p), 'utf8');
const readJ = <X>(p: string): X => JSON.parse(read(p)) as X;
const put = (p: string, o: unknown, nl = true) => { files.set(p, JSON.stringify(o) + (nl ? '\n' : '')); };
const nlOf = (p: string) => !existsSync(join(GEN, p)) || read(p).endsWith('\n');

/* ---------- kb.json ---------- */
const kb = readJ<KB>('kb.json');
for (const id of Object.keys(ALLP)) delete kb.C[id];
for (const c of Object.values(kb.C)) { delete c.use; delete c.math; }
for (const s of [...SIDS, 'H']) { delete kb.TABN[s]; delete kb.PATH[s]; }
kb.TABORDER = kb.TABORDER.filter((s) => !SIDS.includes(s));
kb.TABORDER.splice(kb.TABORDER.indexOf('T1') + 1, 0, ...USIDS);
kb.TABORDER.splice(kb.TABORDER.indexOf('T8') + 1, 0, ...KSIDS);
for (const s of SIDS) { kb.TABN[s] = ALLST[s] as Bi; kb.PATH[s] = ALLPATH[s] as string[]; }
/* R27: every path starts at the home page H (a page of its own, not one of the numbered stops) */
for (const s of Object.keys(kb.PATH)) kb.PATH[s] = ['H', ...(kb.PATH[s] as string[]).filter((x) => x !== 'H')];
kb.PATH.H = ['H']; kb.TABN.H = { zh: '首页', en: 'Home' };
for (const [id, p] of Object.entries(ALLP)) {
  const o: KPart = { n: p.n, cat: p.cat ?? 'use', train: p.train ?? 'no', t: p.t };
  if (p.up) o.up = p.up; if (p.zoom) o.zoom = p.zoom; if (p.dn) o.dn = p.dn; if (p.use) o.use = p.use;
  kb.C[id] = o;
}
for (const [id, u] of Object.entries(USE_LINKS)) { const c = kb.C[id]; if (!c) throw new Error('use link on unknown part ' + id); c.use = u; }
for (const [id, k] of Object.entries(MATH_LINKS)) { const c = kb.C[id]; if (!c) throw new Error('math link on unknown part ' + id); if (k.some((s) => !KSIDS.includes(s))) throw new Error('math link to a non-math station: ' + id); c.math = k; }
for (const [id, c] of Object.entries(kb.C)) {
  for (const x of [...(c.dn ?? []), ...(c.use ?? []), ...(c.up ? [c.up] : [])]) if (!kb.C[x] && !kb.PATH[x]) throw new Error(`${id}: link target ${x} missing`);
  if (c.zoom && !kb.PATH[c.zoom]) throw new Error(`${id}: zoom ${c.zoom} missing`);
}
put('kb.json', kb);

const W: World = { order: kb.TABORDER, path: kb.PATH, tabn: kb.TABN, part: (id) => kb.C[id] };

/* ---------- stations, popups, outline ---------- */
const outline: Record<Lang, Record<string, OutlineRow[]>> = { zh: readJ('outline.zh.json'), en: readJ('outline.en.json') };
/* R23: "⚠️ 容易混淆：A vs B" titles keep the ⚠️ and drop the long prefix in the outline and the page map */
const cfShort = (s: string) => s.replace(/^⚠️\s*(容易混淆：|Easy to mix up: )/u, '⚠️ ');
const cutRow = (r: OutlineRow, L: Lang): OutlineRow => {
  const n = 20;
  if (r[1].startsWith('⚠️')) return [r[0], fit(cfShort(r[1]), L === 'en' ? 44 : 24, L), r[2], r[3]];
  if (r[2] === 'lab') { const b = r[1].replace(/^🧪\s*/, ''); return [r[0], '🧪 ' + fit(b, L === 'en' ? 22 : 18, L), 'lab', r[3]]; }
  if (r[2] === 'quiz') return r;
  return [r[0], fit(r[1].replace(/^[^\p{L}\p{Nd}“"《（(]+/u, ''), L === 'en' ? 28 : n, L), '', r[3]];
};
for (const L of LANGS) {
  const t: T = (zh, en) => (L === 'en' ? en : zh);
  for (const S of SIDS) {
    const P = new Page(S, L, W), done = hookNear(P);
    const o = (MODS[S] as (P: Page) => StationOut)(P); done();
    put(`st/${S}.${L}.json`, { cls: 'level', html: P.html(o.sub, o.one, o.why, P.stage(o.svg, o.legend)) });
    const nodes: Record<string, { title: string; mc: string; body: string }> = {};
    for (const [id, p] of Object.entries(ALLP)) if (p.t === S) nodes[id] = { title: p.n[L], mc: MC, body: popBody(id, S, p.pop(t), W, L) };
    put(`nodes/${S}.${L}.json`, nodes);
    outline[L][S] = P.rows.map((r) => cutRow(r, L));
  }
  /* legacy stations with extension cards/labs: re-insert the marked blocks, page-map buttons, outline rows and popups */
  for (const S of XSIDS) {
    if (SIDS.includes(S)) throw new Error('extension on a generated station: ' + S);
    const p = `st/${S}.${L}.json`, st = readJ<{ cls: string; html: string }>(p);
    let h = st.html.replace(/<!--m2x-->[\s\S]*?<!--\/m2x-->\n?/g, '').replace(/<button class="[^"]*" data-m2x="1"[^>]*>[^<]*<\/button>/g, '');
    const Pc = new Page(S, L, W), Pl = new Page(S, L, W);
    (XCARDS[S] ?? []).forEach((f) => f(Pc)); (XLABS[S] ?? []).forEach((f) => f(Pl));
    const keep = (outline[L][S] ?? []).filter((r) => r[2] === 'quiz' || !r[0] || h.includes(`id="${r[0]}"`));
    const qa = h.indexOf('<div class="card quiz'); if (qa < 0) throw new Error('no quiz card on ' + S);
    const la = h.indexOf('<div class="lab-divider'); if (Pl.out.length && la < 0) throw new Error('no lab divider on ' + S);
    const ca = la >= 0 ? la : qa;
    if (Pl.out.length) h = h.slice(0, qa) + `<!--m2x-->${Pl.out.join('\n')}<!--/m2x-->\n` + h.slice(qa);
    if (Pc.out.length) h = h.slice(0, ca) + `<!--m2x-->${Pc.out.join('\n')}<!--/m2x-->\n` + h.slice(ca);
    const cut = (s: string) => fit(cfShort(s), L === 'en' ? 22 : 16, L);
    const btn = (r: OutlineRow) => `<button class="${r[3] === 3 ? 'l3' : ''}" data-m2x="1" data-sj="${r[0]}" data-sp="${S}">${esc(cut(r[1]))}</button>`;
    const pm = h.indexOf(`<div class="ph-map" id="pm${S}">`); if (pm < 0) throw new Error('no page map on ' + S);
    const pmEnd = h.indexOf('</div>', pm);
    const firstLab = keep.find((r) => r[2] === 'lab');
    let at = firstLab ? h.indexOf(`data-sj="${firstLab[0]}"`, pm) : -1;
    at = at > 0 && at < pmEnd ? h.lastIndexOf('<button', at) : pmEnd;
    h = h.slice(0, pmEnd) + Pl.rows.map(btn).join('') + h.slice(pmEnd);
    h = h.slice(0, at) + Pc.rows.map(btn).join('') + h.slice(at);
    const rows = keep.filter((r) => r[2] !== 'quiz'), quiz = keep.filter((r) => r[2] === 'quiz');
    const li = rows.findIndex((r) => r[2] === 'lab');
    rows.splice(li < 0 ? rows.length : li, 0, ...Pc.rows.map((r) => cutRow(r, L)));
    const orow = [...rows, ...Pl.rows.map((r) => cutRow(r, L))];
    /* "near" items: right after their anchor card; inside an m2x block they join it, otherwise they get their own markers */
    for (const { after, f } of XNEAR[S] ?? []) {
      const Pn = new Page(S, L, W); f(Pn);
      const ai = h.indexOf(`id="${after}"`); if (ai < 0) throw new Error(`near: no card ${after} on ${S}`);
      const a0 = h.lastIndexOf('<div', ai), re = /<div\b|<\/div>/g; re.lastIndex = a0;
      let d = 0, end = -1;
      for (let m = re.exec(h); m; m = re.exec(h)) { d += m[0] === '</div>' ? -1 : 1; if (!d) { end = m.index + 6; break; } }
      if (end < 0) throw new Error('near: unbalanced card ' + after);
      const inX = h.lastIndexOf('<!--m2x-->', a0) > h.lastIndexOf('<!--/m2x-->', a0);
      const body = Pn.out.join('\n');
      h = h.slice(0, end) + (inX ? '\n' + body : `<!--m2x-->\n${body}<!--/m2x-->\n`) + h.slice(end);
      const pm2 = h.indexOf(`<div class="ph-map" id="pm${S}">`), pe2 = h.indexOf('</div>', pm2);
      const bi = h.indexOf(`data-sj="${after}"`, pm2); if (bi < 0 || bi > pe2) throw new Error(`near: ${after} not in the page map of ${S}`);
      const be = h.indexOf('</button>', bi) + 9;
      h = h.slice(0, be) + Pn.rows.map(btn).join('') + h.slice(be);
      const ri = orow.findIndex((r) => r[0] === after); if (ri < 0) throw new Error(`near: ${after} not in the outline of ${S}`);
      orow.splice(ri + 1, 0, ...Pn.rows.map((r) => cutRow(r, L)));
    }
    put(p, { ...st, html: h });
    outline[L][S] = [...orow, ...quiz];
    const np = `nodes/${S}.${L}.json`, nodes = readJ<Record<string, { title: string; mc: string; body: string }>>(np);
    for (const id of Object.keys(XPARTS)) delete nodes[id];
    for (const [id, x] of Object.entries(XPARTS)) if (x.t === S) nodes[id] = { title: x.n[L], mc: MC, body: popBody(id, S, x.pop(t), W, L) };
    put(np, nodes, nlOf(np));
  }
  const ord: Record<string, OutlineRow[]> = {};
  for (const s of kb.TABORDER) if (outline[L][s]) ord[s] = outline[L][s] as OutlineRow[];
  put(`outline.${L}.json`, ord, nlOf(`outline.${L}.json`));
}

/* ---------- quiz + key ---------- */
const qz: Record<Lang, Record<string, unknown>> = { zh: readJ('quiz.zh.json'), en: readJ('quiz.en.json') };
const qkey = readJ<{ src: string; key: Record<string, number[]> }>('qkey.json');
for (const L of LANGS) {
  const tt: T = (zh, en) => (L === 'en' ? en : zh);
  const Q = { ...QUIZ(tt), ...KQUIZ(tt) };
  for (const S of SIDS) {
    const qs = Q[S]; if (!qs) throw new Error('no quiz for ' + S);
    qz[L][S] = qs;
    const key = qs.map((q) => q[2]);
    if (L === 'zh') qkey.key[S] = key; else if (JSON.stringify(qkey.key[S]) !== JSON.stringify(key)) throw new Error('quiz key differs between languages: ' + S);
    qs.forEach((q, i) => { if (q[2] < 0 || q[2] >= q[1].length) throw new Error(`bad key ${S}.${i}`); });
  }
  /* extension questions are appended after the legacy ones (a re-run first drops any question it added before) */
  const mine = new Set(EXTS.flatMap((e) => [...Object.values(e.quiz((zh) => zh)), ...Object.values(e.quiz((_z, en) => en))].flat().map((q) => q[0])));
  const XQ: Record<string, Q[]> = {};
  for (const e of EXTS) for (const [S, qs] of Object.entries(e.quiz(tt))) (XQ[S] ??= []).push(...qs);
  for (const [S, qs] of Object.entries(XQ)) {
    const base = ((qz[L][S] ?? []) as Q[]).filter((q) => !mine.has(q[0]));
    qz[L][S] = [...base, ...qs];
    const key = [...(qkey.key[S] ?? []).slice(0, base.length), ...qs.map((q) => q[2])];
    if (L === 'zh') qkey.key[S] = key; else if (JSON.stringify(qkey.key[S]) !== JSON.stringify(key)) throw new Error('quiz key differs between languages: ' + S);
    qs.forEach((q, i) => { if (q[2] < 0 || q[2] >= q[1].length) throw new Error(`bad key ${S}.x${i}`); });
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
/* the role line as HTML (it may hold inline math) for the T8 index table, and as plain text (math as TeX) for the search index */
const roleHtml: Record<string, Bi> = {};
for (const [id, p] of Object.entries(ALLP)) { roleHtml[id] = { zh: p.pop((zh) => zh).role, en: p.pop((_z, en) => en).role }; search[id] = { zh: strip(roleHtml[id].zh), en: strip(roleHtml[id].en) }; }
put('search.json', search, nlOf('search.json'));
/* R10: the same role lines as pre-rendered KaTeX HTML, only for the few that hold math; the search box loads this (and the
   KaTeX stylesheet) lazily, the first time such a part is in its results. Matching still uses the plain-text search.json. */
const searchMath: Record<string, Bi> = {};
for (const [id, h] of Object.entries(roleHtml)) if (h.zh.includes('class="katex"') || h.en.includes('class="katex"')) searchMath[id] = h;
put('search-math.json', searchMath);

/* ---------- T8 glossary rows (marked data-m2 so a re-run replaces them) ---------- */
for (const L of LANGS) {
  const p = `st/T8.${L}.json`, st = readJ<{ cls: string; html: string }>(p);
  let h = st.html.replace(/<tr class="grp" data-m2="1">[\s\S]*?<\/tr>|<tr data-m2="1">[\s\S]*?<\/tr>/g, '');
  const lbl = L === 'en' ? { role: 'In one sentence', stop: 'Stop', up: 'Belongs to' } : { role: '一句话', stop: '所在页', up: '往上属于' };
  let rows = '';
  for (const S of [...SIDS, ...XSIDS]) {
    if (!Object.values(ALLP).some((p) => p.t === S)) continue;
    const more = SIDS.includes(S) ? '' : L === 'en' ? ' · additions' : ' · 补充';
    rows += `<tr class="grp" data-m2="1"><td colspan="4">${esc((kb.PATH[S] as string[]).filter((s) => s !== 'H').map((s) => (kb.TABN[s] as Bi)[L]).join(' › ') + more)}</td></tr>`;
    for (const [id, part] of Object.entries(ALLP)) if (part.t === S) {
      const up = part.up ? `<a data-open="${part.up}">${esc((kb.C[part.up] as KPart).n[L])}</a>` : '—';
      rows += `<tr data-m2="1"><td><a data-open="${id}">${esc(part.n[L])}</a></td><td data-label="${lbl.role}">${roleHtml[id] ? (roleHtml[id] as Bi)[L] : esc((search[id] as Bi)[L])}</td><td data-label="${lbl.stop}"><a data-go="${S}">${esc((kb.TABN[S] as Bi)[L])}</a></td><td data-label="${lbl.up}">${up}</td></tr>`;
    }
  }
  const anchor = `<tr class="grp"><td colspan="4">${esc((kb.TABN.T1 as Bi)[L])} › ${esc((kb.TABN.T2 as Bi)[L])}</td></tr>`;
  if (!h.includes(anchor)) throw new Error('T8 glossary anchor not found: ' + anchor);
  h = h.replace(anchor, rows + anchor);
  /* the learning map (svgMap): one extra band at the bottom for the M2 usage parts (marked data-m2 for re-runs) */
  const old = /<g data-m2="map" data-h0="(\d+)">[\s\S]*?<\/g><\/g>/.exec(h);
  if (old) h = h.replace(old[0], '').replace(/(<svg id="svgMap" viewBox="0 0 380 )\d+"/, `$1${old[1]}"`);
  const vb = /<svg id="svgMap" viewBox="0 0 380 (\d+)"/.exec(h);
  if (!vb) throw new Error('T8 svgMap not found');
  const H0 = Number(vb[1]), y0 = H0;
  const chip = (id: string, x: number, y: number, w: number) => {
    const n = (kb.C[id] as KPart).n[L];
    return `<g class="comp mapn cat-use" data-id="${id}" data-train="no" tabindex="0" role="button" aria-label="${esc(n)}"><rect class="main" x="${x}" y="${y}" width="${w}" height="32" rx="10"></rect><text x="${x + w / 2}" y="${y + 21}">${esc(n)}</text></g>`;
  };
  const band = `<g data-m2="map" data-h0="${H0}"><rect x="2" y="${y0}" width="376" height="148" rx="14" fill="#f0fdf4" stroke="#eef0f5"></rect>`
    + `<text class="lbl" x="12" y="${y0 + 19}" font-size="12.5" font-weight="700" fill="#15803d">${L === 'en' ? 'How to use it (on top of the app layer)' : '怎么用（建在应用层之上）'}</text>`
    + chip('uHub', 14, y0 + 28, 352) + chip('uWith', 14, y0 + 68, 172) + chip('uSolo', 194, y0 + 68, 172) + chip('uKit', 14, y0 + 108, 172) + chip('uWell', 194, y0 + 108, 172) + '</g>';
  h = h.replace(/(<svg id="svgMap" viewBox="0 0 380 )\d+("[^>]*>[\s\S]*?)<\/svg>/, (_m, a: string, rest: string) => `${a}${H0 + 154}${rest}${band}</svg>`);
  put(p, { ...st, html: h });
}

/* ---------- R11: the hand-off block at the end of every station (between <!--m2h--> markers, before the prev/next bar) ---------- */
const stOf = (p: string) => (files.has(p) ? JSON.parse(files.get(p) as string) : readJ(p)) as { cls: string; html: string };
const nlOfF = (p: string) => (files.has(p) ? (files.get(p) as string).endsWith('\n') : nlOf(p));
for (const S of kb.TABORDER) if (!HAND[S]) throw new Error('no hand-off for ' + S);
for (const L of LANGS) for (const S of kb.TABORDER) {
  const H = HAND[S]!, p = `st/${S}.${L}.json`, st = stOf(p), nl = nlOfF(p);
  const name = (s: string) => { const n = kb.TABN[s]; if (!n) throw new Error(`hand-off ${S}: unknown station ${s}`); return esc(n[L]); };
  const hop = (cls: string, k: string) => ([s, why]: [string, Bi]) => `<button type="button" class="mh-b ${cls}" data-go="${s}"><span class="mh-k">${k === 'hand.dn' ? IC.down : IC.up}${CODES[k as 'hand.dn'][L]}</span><b>${name(s)}</b><span class="mh-r">${esc(why[L])}</span></button>`;
  const use = (H.use ?? []).filter((id) => { const c = kb.C[id]; if (!c) throw new Error(`hand-off ${S}: unknown part ${id}`); return c.t !== S; });
  const labs = (outline[L][S] ?? []).filter((r) => r[2] === 'lab');
  let o = `<nav class="m-hand" aria-label="${esc(CODES['hand.title'][L].replace(/^\S+\s/, ''))}"><p class="mh-t">${CODES['hand.title'][L]}</p>`;
  o += H.dn.length ? H.dn.map(hop('dn', 'hand.dn')).join('') : `<p class="mh-end">${CODES['hand.end'][L]}</p>`;
  o += H.up.map(hop('up', 'hand.up')).join('');
  if (labs.length) o += `<p class="mh-c"><span>${CODES['hand.labs'][L]}</span>${labs.map((r) => `<button type="button" class="mh-x" data-sj="${r[0]}" data-sp="${S}">${esc(r[1].replace(/^🧪\s*/, ''))}</button>`).join('')}</p>`;
  if (H.xlabs?.length) o += `<p class="mh-c"><span>${CODES['hand.xlabs'][L]}</span>${H.xlabs.map(([s, id]) => { const r = (outline[L][s] ?? []).find((x) => x[0] === id && x[2] === 'lab'); if (!r) throw new Error(`hand-off ${S}: no lab ${id} on ${s}`); return `<button type="button" class="mh-x" data-sj="${id}" data-sp="${s}">${esc(r[1].replace(/^🧪\s*/, ''))} · ${name(s)}</button>`; }).join('')}</p>`;
  if (use.length) o += `<p class="mh-c"><span>${CODES['hand.use'][L]}</span>${use.map((id) => `<button type="button" class="mh-x" data-open="${id}">${esc((kb.C[id] as KPart).n[L])}</button>`).join('')}</p>`;
  o += '</nav>';
  let h = st.html.replace(/<!--m2h-->[\s\S]*?<!--\/m2h-->\n?/g, '');
  const at = h.indexOf(`<div class="ph-nav m-pn" data-sec="${S}"`); if (at < 0) throw new Error('no prev/next bar on ' + S);
  h = h.slice(0, at) + `<!--m2h-->${o}<!--/m2h-->\n` + h.slice(at);
  put(p, { ...st, html: h }, nl);
}

/* ---------- R11: search index of stations, cards, labs and quizzes (parts are searched from kb.json + search.json) ---------- */
/* one row per item: [kind s|c|l|q, element id (the station id for s), station, zh title, en title]; the search box loads it lazily */
type XRow = [string, string, string, string, string];
const xrows: XRow[] = [];
const titles = (S: string, L: Lang) => {
  const h = stOf(`st/${S}.${L}.json`).html, o = new Map<string, [string, string]>();
  for (const m of h.matchAll(/<div class="card( [^"]*)?" id="([^"]+)"[^>]*>/g)) {
    const cls = m[1] ?? '', id = m[2] as string;
    if (/\bquiz\b/.test(cls)) { o.set(id, ['q', (L === 'en' ? 'Quiz: ' : '小测验：') + (kb.TABN[S] as Bi)[L]]); continue; }
    const hm = /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/.exec(h.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 4000));
    const tt = hm ? strip(hm[1] as string).replace(/\s+/g, ' ').trim() : '';
    if (tt) o.set(id, [/\blab\b/.test(cls) ? 'l' : 'c', tt]);
  }
  return o;
};
for (const S of kb.TABORDER) {
  xrows.push(['s', S, S, (kb.TABN[S] as Bi).zh, (kb.TABN[S] as Bi).en]);
  const zh = titles(S, 'zh'), en = titles(S, 'en');
  for (const [id, [k, z]] of zh) { const e = en.get(id); if (!e) throw new Error(`search index: ${S}#${id} has no English title`); xrows.push([k, id, S, z, e[1]]); }
}
put('search-x.json', xrows);

/* ---------- R13: the home diagram (T1) is the whole stack, from you down to the maths (m2/content/t1dg.ts) ---------- */
/* replaces svgT1 in the phone page and the landscape full-screen data, and the legend under it; the geometry checks in
   m2/dgcheck.ts must come back clean or the build stops. Also removes the R12 knowledge-map card. */
{
  const dkb = { C: kb.C as Record<string, { n: Bi; cat: string; train?: string; zoom?: string }>, PATH: kb.PATH as Record<string, unknown> };
  for (const L of LANGS) {
    const p = 'st/T1.' + L + '.json', st = stOf(p), nl = nlOfF(p);
    const m = dgRender(L, 'm', dkb), w = dgRender(L, 'w', dkb);
    for (const [k, d] of [['phone', m], ['wide', w]] as const) {
      const bad = dgCheck(d.svg, true);
      if (bad.length) throw new Error(`T1 diagram (${k}, ${L}):\n  ` + bad.join('\n  '));
    }
    let h = st.html.replace(/<!--m2k-->[\s\S]*?<!--\/m2k-->\n?/g, '');
    const n0 = h.length;
    h = h.replace(/<svg id="svgT1"[\s\S]*?<\/svg>/, () => m.svg).replace(/<div class="legend" id="legendT1">[\s\S]*?<\/div>/, () => dgLegend(L));
    if (!h.includes(m.svg) || !h.includes('id="legendT1"') || n0 === 0) throw new Error('T1 diagram: no svgT1 / legend to replace');
    put(p, { ...st, html: h }, nl);
    const wp = 'st/T1.' + L + '.wide.json';
    put(wp, { ...(readJ(wp) as object), svgT1: { vb: w.vb, html: w.inner } }, nlOf(wp));
  }
}

/* ---------- the KaTeX stylesheet (woff2 fonts only), loaded lazily by the shell when math is on screen ---------- */
files.set('../../styles/katex.css', katexCss(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../node_modules/katex/dist/katex.min.css'), 'utf8')));

/* ---------- R10: overseas academic / legal sources get a reachability note (one per source line) ---------- */
/* hosts checked on 2026-10-23 from an overseas box: no official mainland mirror was found (cn.arxiv.org only redirects to
   arxiv.org; xxx.itp.ac.cn did not answer from here), so the note says so instead of claiming any route works */
const OVERSEAS_SRC = /href="https:\/\/(?:www\.)?(?:arxiv\.org|jmlr\.org|copyright\.gov|artificialintelligenceact\.eu|[a-z.-]*europa\.eu|nature\.com|doi\.org)\//;
for (const [p, s] of [...files]) {
  const mm = /^st\/[\w-]+\.(zh|en)\.json$/.exec(p); if (!mm) continue;
  const st = JSON.parse(s) as { html: string }, Lx = mm[1] as 'zh' | 'en';
  const note = `<span class="k-reach" data-m2="reach"> · ${esc(CODES['src.reach'][Lx])}</span>`;
  const h = st.html.replace(/<span class="k-reach" data-m2="reach">[^<]*<\/span>/g, '')
    .replace(/<p class="k-src">([\s\S]*?)<\/p>/g, (m0, body: string) => (OVERSEAS_SRC.test(body) ? `<p class="k-src">${body}${note}</p>` : m0));
  if (h !== st.html) put(p, { ...st, html: h }, s.endsWith('\n'));
}

/* ---------- R15: plain-language layer (m2/plainpass.ts): plain openings, closed "Go deeper", symbol notes under every formula ---------- */
const ISS: string[] = [];
for (const S of PLAIN_STATIONS) for (const L of LANGS) {
  const p = `st/${S}.${L}.json`, st = stOf(p), nl = nlOfF(p);
  const h = plainPage(st.html, S, L, PLAIN[S]!, undefined, ISS);
  if (h !== st.html) put(p, { ...st, html: h }, nl);
  const np = `nodes/${S}.${L}.json`;
  if (files.has(np) || existsSync(join(GEN, np))) {
    const cur = files.get(np) ?? read(np), nodes = JSON.parse(cur) as Record<string, { body: string }>;
    const nn = plainNodes(nodes, S, L, PLAIN[S]!, undefined, ISS);
    if (JSON.stringify(nn) !== JSON.stringify(nodes)) put(np, nn, cur.endsWith('\n'));
  }
}
/* a symbol note may only talk about symbols that are in its own formula, and every entry says how to read it */
if (ISS.length) throw new Error(`plain: ${ISS.length} symbol-note problem(s):\n  ` + ISS.join('\n  '));
put('symbols.json', glossaryJson());
/* the glossary is searchable: one row for the whole sheet, one per symbol (kind y, no station) */
xrows.push(['y', '*', '', CODES['sym.title'].zh, CODES['sym.title'].en]);
for (const [k, g] of Object.entries(SYM)) xrows.push(['y', k, '', `${g.s} ${g.r.zh}`, `${g.s} ${g.r.en}`]);
put('search-x.json', xrows);

/* ---------- R21: the stop's first plain opening ("🧒 先用大白话说") goes to the very top, above the diagram ----------
   It is cut out of the first card (c_<S>_0, which keeps its title and its closed "Go deeper") into a card of its own
   right under the page head. Idempotent: the plain pass above strips its m2p part, this strips the rest. */
for (const S of PLAIN_STATIONS) for (const L of LANGS) {
  const p = `st/${S}.${L}.json`, st = stOf(p), h = topPlain(st.html, S);
  if (h !== st.html) put(p, { ...st, html: h }, nlOfF(p));
}

/* ---------- R27: a short home page (H) and a three-level drill-down: 首页 → 专区 → 细节站 ----------
   H is a generated page of its own (st/H.*.json; in PATH/TABN but not in TABORDER, so the 27-stop numbering, progress
   and challenge links do not move). It holds what the first screen needs: one line on what this is, 🎬 the tour, the
   🧒 kids' route and the six "I want to…" doorways (moved here from T1, R25), then a small share card and a closed
   "Go deeper" layer. T1 becomes the 🧠 principles zone: a route map of the theory stops grouped by theme (✓ = opened,
   drawn by hydrate.ts). Every stop gets a small strip under its page head: which level it is, ⬆ one level up, and on
   the zone pages ⬇ the stops to drill into. Idempotent (<!--m2door-->, <!--m2zone-->, <!--m2rmap--> markers). */
{
  type Door = { i: string; t: Bi; s: Bi; go: string };
  const D: Door[] = [
    { i: '🔌', t: { zh: '我想用代码调模型', en: 'Call a model from my code' }, s: { zh: '密钥 · 第一次调用 · 算钱', en: 'keys · first call · cost' }, go: 'Api' },
    { i: '💻', t: { zh: '我想在自己电脑上跑', en: 'Run a model on my computer' }, s: { zh: '内存够不够 · 用什么工具', en: 'enough memory? · which tool' }, go: 'Loc' },
    { i: '🤖', t: { zh: '我想让 AI 替我干活', en: 'Let an AI do tasks for me' }, s: { zh: '按事情挑 Agent · 国内产品', en: 'pick an agent by task · products' }, go: 'Job' },
    { i: '🧰', t: { zh: '我想给 AI 装技能', en: 'Add skills to an AI' }, s: { zh: '工具 · MCP · 技能包', en: 'tools · MCP · skill packs' }, go: 'Skl' },
    { i: '🛠', t: { zh: '我想自己搭一个 Agent', en: 'Build my own agent' }, s: { zh: '平台或代码，一步步来', en: 'platform or code, step by step' }, go: 'Bld' },
    { i: '🧠', t: { zh: '我想弄懂原理', en: 'Understand how it works' }, s: { zh: '路线图 · 从远看到细看', en: 'route map · big picture to detail' }, go: 'T1' },
  ];
  /* level 2: the zones under the home page, and the stops each one drills down to (the doorways' old chips, R25) */
  const ZONE: Record<string, string[]> = { T1: [], U: ['Ua', 'Ub', 'Uc', 'Ud', 'Up'], Api: ['T3', 'Loc'], Loc: ['T5', 'T2'], Job: ['U', 'Ua', 'Ub', 'Up'], Skl: ['Uc', 'T2'], Bld: ['Up', 'Ua', 'Ub', 'Uc', 'T2'] };
  /* the principles route map on T1: theory stops by theme (same groups as the side menu) */
  const RM: [string, Bi, string[]][] = [
    ['🔭', { zh: '远看', en: 'Big picture' }, ['T1', 'T2']],
    ['🗺️', { zh: '近看', en: 'Closer' }, ['T3']],
    ['🔬', { zh: '细看：模型内部', en: 'Inside the model' }, ['N', 'T4', 'T4a', 'T4b', 'T5']],
    ['🧭', { zh: '专题与速查', en: 'Topics & reference' }, ['T6', 'T7', 'T8']],
    ['∑', { zh: '数学层', en: 'Math layer' }, ['K1', 'K2', 'K3', 'K4', 'K5']],
  ];
  const ICO: Record<string, string> = { T1: '🔭', T2: '🤖', T3: '🧠', N: '🕸️', T4: '🧩', T4a: '👀', T4b: '📚', T5: '⚡', T6: '🖼️', T7: '🏋️', T8: '🗺️', K1: '📈', K2: '🧮', K3: '🎲', K4: '⛰️', K5: '📝' };
  for (const ks of Object.values(ZONE)) for (const s of ks) if (!kb.TABORDER.includes(s)) throw new Error('zone link to unknown stop ' + s);
  const rmAll = RM.flatMap((g) => g[2]);
  for (const s of rmAll) if (!kb.TABORDER.includes(s)) throw new Error('route map: unknown stop ' + s);
  const N = kb.TABORDER.length;
  for (const L of LANGS) {
    const t: T = (zh, en) => (L === 'en' ? en : zh);
    const nm = (s: string) => esc((kb.TABN[s] as Bi)[L]);
    /* --- H --- */
    const door = (d: Door) => `<button type="button" class="dr-m" data-go="${d.go}"><span class="dr-i" aria-hidden="true">${d.i}</span><b>${esc(d.t[L])}</b><span class="dr-s">${esc(d.s[L])}</span></button>`;
    const lv = (i: string, a: string, b: string, on = false) => `<li${on ? ' class="on"' : ''}><i aria-hidden="true">${i}</i><b>${a}</b><small>${b}</small></li>`;
    const H = `<div class="hm" id="hmTop"><h1 class="hm-t">${t('大白话拆解 AI', 'AI, explained plainly')}</h1>`
      + `<p class="hm-s">${t('用图和小实验，一层层看懂 AI：怎么用、怎么搭、为什么行。', 'Pictures and small experiments, layer by layer: how to use AI, how to build with it, why it works.')}</p>`
      + `<div class="hm-go"><button type="button" class="hm-b pri" data-tour="start">${t('🎬 跟着一句话走一遍', '🎬 Follow one sentence through')}</button><button type="button" class="hm-b kid" data-route="kid" data-go="T1">${t('🧒 小学生路线 · 6 站', '🧒 Kids’ route · 6 stops')}</button></div></div>`
      + `<!--m2door--><nav class="m-door hm-door" aria-label="${t('我想……', 'I want to…')}"><p class="dr-h">${t('👋 你想做什么？点一个', '👋 What do you want to do? Tap one')}</p><div class="dr-g">${D.map(door).join('')}</div></nav><!--/m2door-->`
      + `<div class="hm-sh" id="hmShare"><p class="hm-h">${t('📣 觉得有用？分享给朋友', '📣 Useful? Share it with a friend')}</p><div class="hm-shb">`
      + `<button type="button" class="hm-b" data-hm="share">${t('🔗 分享本站', '🔗 Share this site')}</button><button type="button" class="hm-b" data-hm="poster">${t('🏅 我的进度海报', '🏅 My progress card')}</button></div>`
      + `<p class="hm-nt">${t('每一页右上角的 ↗ 都能分享那一页。', 'The ↗ at the top right of every page shares that page.')}</p></div>`
      + `<details class="hm-more" id="hmMore"><summary>${t('想深入看：这个网站怎么逛', 'Go deeper: how this site is laid out')}</summary><div class="hm-mb">`
      + `<ol class="hm-lv" aria-label="${t('三层', 'Three levels')}">${lv('🏠', t('首页', 'Home'), t('选一个“我想…”', 'pick an “I want to…”'), true)}${lv('📂', t('专区', 'Zone'), t('这件事的全貌', 'the whole of one job'))}${lv('🔬', t('细节站', 'Detail stop'), t('一个点讲透', 'one idea in depth'))}</ol>`
      + `<ul class="pts"><li>${t('每页顶上一行写着<b>你在哪</b>：点 ⬆ 回上一层，点 ⬇ 往下钻。', 'The line at the top of each page says <b>where you are</b>: ⬆ goes up a level, ⬇ drills down.')}</li><li>${t('底部按钮：📑 本页目录、🧪 小实验、✅ 小测、✨ 进度、▶ 下一站。', 'Bottom bar: 📑 this page, 🧪 experiments, ✅ quiz, ✨ progress, ▶ next stop.')}</li></ul>`
      + `<p class="hm-all"><button type="button" class="hm-b" data-hm="drawer">${t(`🧭 全部 ${N} 站`, `🧭 All ${N} stops`)}</button><button type="button" class="hm-b" data-hm="search">${t('🔍 搜索', '🔍 Search')}</button></p></div></details>`;
    put(`st/H.${L}.json`, { cls: 'level', html: '\n' + H + '\n' });
    /* --- the level strip on every stop, and the route map on T1 --- */
    for (const S of kb.TABORDER) {
      const p = `st/${S}.${L}.json`, st = stOf(p);
      let h = st.html.replace(/<!--m2door-->[\s\S]*?<!--\/m2door-->\n?/g, '').replace(/<!--m2zone-->[\s\S]*?<!--\/m2zone-->\n?/g, '').replace(/<!--m2rmap-->[\s\S]*?<!--\/m2rmap-->\n?/g, '');
      const path = (kb.PATH[S] as string[]), z = S in ZONE, up = path[path.length - 2] ?? 'H';
      let o = `<!--m2zone--><nav class="m-zone${z ? ' z2' : ' z3'}" aria-label="${t('这一层', 'This level')}"><p class="mz-r"><span class="mz-lv">${z ? t('📂 第 2 层 · 专区', '📂 Level 2 · zone') : t('🔬 第 3 层 · 细节站', '🔬 Level 3 · detail')}</span>`
        + `<button type="button" class="mz-up" data-go="${up}">⬆ ${up === 'H' ? t('回首页', 'Home') : nm(up)}</button></p>`;
      const dn = ZONE[S] ?? [];
      if (dn.length) o += `<p class="mz-dn"><span>${t('⬇ 往下钻：', '⬇ Drill down:')}</span>${dn.map((s) => `<button type="button" data-go="${s}">${nm(s)}</button>`).join('')}</p>`;
      o += '</nav><!--/m2zone-->';
      if (S === 'T1') {
        o += `<!--m2rmap--><nav class="m-rmap" id="rmapT1" aria-label="${t('原理路线图', 'Route map of the ideas')}"><p class="rm-h"><b>${t('🧠 弄懂原理：路线图', '🧠 How it works: the route map')}</b><span class="rm-c" data-rmc="${rmAll.length}">0/${rmAll.length}</span></p>`
          + `<p class="rm-tip">${t('从上往下，一步步拆开看。✓ = 已经看过。', 'Top to bottom, one layer at a time. ✓ = already opened.')}</p><ol class="rm-g">`
          + RM.map(([ic, g, ks]) => `<li><p class="rm-gh"><i aria-hidden="true">${ic}</i>${esc(g[L])}</p><p class="rm-ss">${ks.map((s) => `<button type="button" class="rm-s" data-go="${s}" data-rm="${s}"><span class="rm-n">${kb.TABORDER.indexOf(s) + 1}</span>${ICO[s] ?? ''} ${nm(s)}</button>`).join('')}</p></li>`).join('')
          + `</ol><p class="rm-rt"><button type="button" data-route="kid">${t('🧒 小学生路线 · 6 站（从本页开始）', '🧒 Kids’ route · 6 stops (starts here)')}</button><button type="button" data-route="all" data-go="T2">${t(`🗺 完整路线 · ${N} 站`, `🗺 Full route · ${N} stops`)}</button></p></nav><!--/m2rmap-->`;
      }
      const end = `<div class="zoomnote" id="zn${S}" style="display:none"></div></div>`, at = h.indexOf(end);
      if (at < 0) throw new Error('level strip: no page head end on ' + S);
      h = h.slice(0, at + end.length) + o + h.slice(at + end.length);
      if (h !== st.html) put(p, { ...st, html: h }, nlOfF(p));
    }
  }
}

/* ---------- R25: outline rows (目录 / Tree) and page-map buttons are cut at a word boundary and end in "…" ----------
   Legacy rows were cut at a fixed length on extraction (mid-word in English); each row is re-cut from its card's full
   heading in the station page (by id, or for id-less rows the heading it starts with). Idempotent. */
const heads = (h: string) => {
  const m = new Map<string, string>(), all: string[] = [];
  const re = /<div class="card[^"]*" id="([^"]+)"/g; let k: RegExpExecArray | null;
  while ((k = re.exec(h))) {
    const nx = h.indexOf('<div class="card', k.index + 10), hs = h.slice(k.index, nx < 0 ? undefined : nx).match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/);
    if (hs) { const t = strip(hs[1]!).replace(/\s+/g, ' ').trim(); m.set(k[1]!, t); all.push(t); }
  }
  const re2 = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/g; while ((k = re2.exec(h))) all.push(strip(k[1]!).replace(/\s+/g, ' ').trim());
  return { m, all };
};
const noLead = (s: string) => s.replace(/^[^\p{L}\p{N}]+/u, '');
const recut = (t: string, L: Lang, n: number) => { if (L !== 'en' || t.endsWith('…') || [...t].length !== n) return t; const u = t.replace(/\s*\S+$/, ''); return fit(u + ' ' + 'x'.repeat(n), u.length, L); };
for (const L of LANGS) {
  const op = `outline.${L}.json`, out = JSON.parse(files.get(op) as string) as Record<string, OutlineRow[]>;
  for (const S of Object.keys(out)) {
    const p = `st/${S}.${L}.json`; if (!files.has(p) && !existsSync(join(GEN, p))) continue;
    const st = stOf(p), H = heads(st.html);
    const full = (r: OutlineRow) => H.m.get(r[0]) ?? H.all.find((x) => r[1].length > 6 && noLead(x).startsWith(noLead(r[1].replace(/…$/, ''))));
    out[S] = out[S]!.map((r) => { if (r[2] === 'quiz') return r; const f = full(r); const c = f ? cutRow([r[0], f, r[2], r[3]], L) : r; return [c[0], recut(c[1], L, 20), c[2], c[3]]; });
    const h = st.html.replace(/(<div class="ph-map" id="pm[^"]+">)([\s\S]*?)(<\/div>)/, (_m, a: string, b: string, c: string) => a + b.replace(/(<button[^>]*data-sj="([^"]*)"[^>]*>)([^<]*)(<\/button>)/g, (_x, o: string, id: string, txt: string, e: string) => {
      const f = H.m.get(id); return o + esc(f ? fit(cfShort(f), L === 'en' ? 22 : 16, L) : recut(strip(txt), L, 18)) + e;
    }) + c);
    if (h !== st.html) put(p, { ...st, html: h }, nlOfF(p));
  }
  put(op, out, nlOf(op));
}

/* ---------- guard: KaTeX markup must never be escaped into visible text (it would print as raw HTML on the page) ---------- */
const KX = /&lt;(?:span class=(?:&quot;|\\")katex|\/?(?:math|semantics|annotation)\b)|&amp;lt;/;
for (const [p, s] of files) { const i = s.search(KX); if (i >= 0) throw new Error(`m2: escaped KaTeX/HTML markup in ${p}: …${s.slice(Math.max(0, i - 120), i + 80)}…`); }

/* ---------- write or check ---------- */
let stale = 0;
for (const [p, s] of files) {
  const f = join(GEN, p), cur = existsSync(f) ? readFileSync(f, 'utf8') : null;
  if (cur === s) continue;
  if (CHECK) { stale++; console.error('stale: ' + p); } else { writeFileSync(f, s); console.log('wrote ' + p); }
}
if (CHECK && stale) { console.error(`${stale} generated file(s) out of date: run npm run m2`); process.exit(1); }
if (CHECK) console.log('m2 gen up to date');
