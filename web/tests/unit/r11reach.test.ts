/* R11: the whole site is reachable from T1 by tapping links inside the content (no left sidebar / tree, no top-bar arrows),
   the guided "go deeper" hand-off chain alone walks T1 → … → K5, every lab is one tap from its station's hand-off block,
   and the search box covers every station, card, lab, quiz and part. Graph built from the generated HTML. */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { searchAll, searchFind, type XRow } from '../../src/shell/TopBar';
import { HAND } from '../../m2/content/handoff';

const GEN = join(__dirname, '../../src/legacy/gen');
const J = <T>(p: string) => JSON.parse(readFileSync(join(GEN, p), 'utf8')) as T;
const KB = J<{ C: Record<string, { t: string; up?: string; zoom?: string; n: { zh: string; en: string } }>; TABORDER: string[]; TABN: Record<string, { zh: string; en: string }> }>('kb.json');
const XS = J<XRow[]>('search-x.json');
const LANGS = ['zh', 'en'] as const;
const st = (S: string, L: string) => J<{ html: string }>(`st/${S}.${L}.json`).html;
const nodes: Record<string, Record<string, { body: string }>> = {};
for (const f of readdirSync(join(GEN, 'nodes'))) nodes[f.replace('.json', '')] = J(`nodes/${f}`);
const pop = (id: string, L: string) => { for (const [k, v] of Object.entries(nodes)) if (k.endsWith('.' + L) && v[id]) return v[id]!.body; return ''; };
const attrs = (h: string, a: string) => [...h.matchAll(new RegExp(`${a}="([^"]+)"`, 'g'))].map((m) => m[1] as string);
const cardIds = (h: string) => [...h.matchAll(/<div class="card( [^"]*)?" id="([^"]+)"/g)].map((m) => [m[2] as string, m[1] ?? ''] as const);
const handOf = (h: string) => /<!--m2h-->([\s\S]*?)<!--\/m2h-->/.exec(h)?.[1] ?? '';

for (const L of LANGS) describe(`R11 reachability without the sidebar (${L})`, () => {
  /* BFS over in-content links: station pages (data-go, data-ddgo, data-open, data-sj/data-sp, data-jump/data-lv), popups (same) */
  const seenS = new Set<string>(), seenP = new Set<string>(), seenE = new Set<string>(), q: string[] = ['s:T1'];
  const edges = (h: string, here: string) => {
    for (const s of [...attrs(h, 'data-go'), ...attrs(h, 'data-ddgo'), ...attrs(h, 'data-lv'), ...attrs(h, 'data-sp')]) q.push('s:' + s);
    for (const p of attrs(h, 'data-open')) q.push('p:' + p);
    for (const e of [...attrs(h, 'data-sj'), ...attrs(h, 'data-jump')]) seenE.add(e);
    void here;
  };
  while (q.length) {
    const k = q.shift()!, [t, id] = [k.slice(0, 1), k.slice(2)];
    if (t === 's') { if (seenS.has(id) || !KB.TABN[id]) continue; seenS.add(id); edges(st(id, L), id); }
    else { if (seenP.has(id) || !KB.C[id]) continue; seenP.add(id); edges(pop(id, L), KB.C[id]!.t); }
  }
  it('every station and every part is reachable from T1', () => {
    expect(KB.TABORDER.filter((S) => !seenS.has(S))).toEqual([]);
    expect(Object.keys(KB.C).filter((p) => !seenP.has(p))).toEqual([]);
    expect(seenS.size).toBe(24);
  });
  it('every lab and card is reachable: its station is, and every lab has an explicit jump link', () => {
    for (const S of KB.TABORDER) for (const [id, cls] of cardIds(st(S, L))) if (/\blab\b/.test(cls)) expect(seenE.has(id), `${S}#${id}`).toBe(true);
  });
  it('R13: every station is one tap from home (the 🔍 boxes of the T1 full-stack diagram drill into all of them)', () => {
    const svg = /<svg id="svgT1"[\s\S]*?<\/svg>/.exec(st('T1', L))?.[0] ?? '';
    const zoomed = [...svg.matchAll(/<g class="comp[^"]*" data-id="([^"]+)"[\s\S]*?<\/g>/g)].filter((m) => m[0].includes('zm-h')).map((m) => KB.C[m[1]!]?.zoom);
    const one = new Set(['T1', ...zoomed.filter((z): z is string => !!z)]);
    expect(KB.TABORDER.filter((S) => !one.has(S))).toEqual([]);
  });
  it('the "go deeper" hand-off chain alone walks T1 → … → K5 through all 24 stations', () => {
    const seen = new Set<string>(), qq = ['T1'];
    while (qq.length) { const S = qq.shift()!; if (seen.has(S)) continue; seen.add(S); qq.push(...attrs(handOf(st(S, L)).split('mh-b up')[0]!, 'data-go')); }
    expect(KB.TABORDER.filter((S) => !seen.has(S))).toEqual([]);
    /* the deepest stop says so */
    expect(handOf(st('K5', L))).toContain('mh-end');
  });
  it('every station ends with one hand-off block (before the prev/next bar) that points at each of its labs', () => {
    for (const S of KB.TABORDER) {
      const h = st(S, L), hb = handOf(h);
      expect(h.match(/<!--m2h-->/g)?.length, S).toBe(1);
      expect(h.indexOf('<!--/m2h-->'), S).toBeLessThan(h.indexOf(`<div class="ph-nav m-pn" data-sec="${S}"`));
      for (const [id, cls] of cardIds(h)) if (/\blab\b/.test(cls)) expect(hb, `${S}#${id}`).toContain(`data-sj="${id}" data-sp="${S}"`);
      for (const g of attrs(hb, 'data-go')) expect(KB.TABN[g], `${S}→${g}`).toBeTruthy();
      for (const p of attrs(hb, 'data-open')) { expect(KB.C[p], `${S}:${p}`).toBeTruthy(); expect(KB.C[p]!.t, `${S}:${p} is explained elsewhere`).not.toBe(S); }
      expect(HAND[S], S).toBeTruthy();
    }
  });
});

describe('R11 search coverage', () => {
  it('search-x.json lists every station and every card / lab / quiz of every station, titled in both languages', () => {
    const have = new Set(XS.map((r) => r[0] + ':' + r[1]));
    for (const S of KB.TABORDER) {
      expect(have.has('s:' + S), S).toBe(true);
      for (const [id, cls] of cardIds(st(S, 'zh'))) {
        const k = /\bquiz\b/.test(cls) ? 'q' : /\blab\b/.test(cls) ? 'l' : 'c';
        expect(have.has(k + ':' + id), `${S}#${id}`).toBe(true);
      }
    }
    for (const r of XS) { expect(r[3].length * r[4].length, r[1]).toBeGreaterThan(0); expect(/[\u3400-\u9fff]/.test(r[4]), r[1]).toBe(false); }
  });
  it('every station / card / lab is found by its own title (in its language), every part by its name', () => {
    for (const r of XS) for (const L of [3, 4] as const) {
      const hits = searchAll(r[L], null, XS);
      expect(hits.some((h) => 'x' in h && h.x[1] === r[1] && h.x[0] === r[0]) || hits.length === 16, r[1]).toBe(true);
    }
    for (const [id, c] of Object.entries(KB.C)) for (const L of LANGS) expect(searchFind(c.n[L], null), `${id}.${L}`).toContain(id);
  });
  it('one query mixes kinds: parts by name first, then stations, labs, cards', () => {
    const h = searchAll('困惑度', null, XS);
    expect(h[0]).toEqual({ p: 'xppl' });
    expect(h.some((x) => 'x' in x && x.x[1] === 'labPpl')).toBe(true);
    const s = searchAll('attention', null, XS);
    expect(s.some((x) => 'x' in x && x.x[0] === 's' && x.x[1] === 'T4a')).toBe(true);
    expect(searchAll('  ', null, XS)).toEqual([]);
    expect(searchAll('beam', null, XS).filter((x) => 'x' in x).map((x) => ('x' in x ? x.x[1] : ''))).toContain('labBeam');
  });
});

/* R14: the two deferred labs — placed next to their anchor, linked from T1's hand-off and from their popups, searchable */
describe('R14 labs: labChin (T7) and labBpe (T3)', () => {
  const ids = (h: string) => cardIds(h).map((c) => c[0]);
  for (const L of LANGS) {
    it(`placement right after the anchor card (${L})`, () => {
      const t7 = ids(st('T7', L)), t3 = ids(st('T3', L));
      expect(t7[t7.indexOf('xScale') + 1]).toBe('labChin');
      expect(t3[t3.indexOf('labTok') + 1]).toBe('labBpe');
      expect(st('T7', L).match(/id="labChin"/g)?.length).toBe(1);
      expect(st('T3', L).match(/id="labBpe"/g)?.length).toBe(1);
    });
    it(`T1 hand-off jumps straight to both labs; their stations' hand-offs and popups too (${L})`, () => {
      const h1 = handOf(st('T1', L));
      expect(h1).toContain('data-sj="labChin" data-sp="T7"'); expect(h1).toContain('data-sj="labBpe" data-sp="T3"');
      expect(handOf(st('T7', L))).toContain('data-sj="labChin" data-sp="T7"');
      expect(handOf(st('T3', L))).toContain('data-sj="labBpe" data-sp="T3"');
      expect(pop('xchin', L)).toContain('data-jump="labChin" data-lv="T7"');
      expect(pop('xbpe', L)).toContain('data-jump="labBpe" data-lv="T3"');
      expect(st('T7', L)).toMatch(/id="xScale"[\s\S]*?data-sj="labChin" data-sp="T7"[\s\S]*?id="labChin"/);
    });
  }
  it('search finds both labs in both languages', () => {
    const labs = (q: string) => searchAll(q, null, XS).filter((x) => 'x' in x).map((x) => ('x' in x ? x.x[1] : ''));
    for (const q of ['Chinchilla', '规模公式', 'chinchilla scaling']) expect(labs(q), q).toContain('labChin');
    for (const q of ['BPE', '分词', 'merge by merge']) expect(labs(q), q).toContain('labBpe');
    expect(searchFind('Chinchilla', null)).toContain('xchin'); expect(searchFind('BPE', null)).toContain('xbpe');
  });
});
