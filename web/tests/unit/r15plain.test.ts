/* R15: the plain-language layer (kid-plain opening, closed "Go deeper", symbol notes under every formula, glossary).
   The guard runs over PLAIN_STATIONS (m2/plain/index.ts) — add a station there and it is checked here automatically. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { symKeys, needsCtx } from '../../m2/sym';
import { SYM, GROUPS } from '../../m2/content/symbols';
import { PLAIN, PLAIN_STATIONS } from '../../m2/plain';
import { plainPage, plainNodes, undoPlain, resolve, mentions, topPlain } from '../../m2/plainpass';
import { CODES } from '../../src/i18n/codes';
import type { XRow } from '../../src/shell/TopBar';
import { searchAll } from '../../src/shell/TopBar';

const GEN = join(__dirname, '../../src/legacy/gen');
const J = <T>(p: string) => JSON.parse(readFileSync(join(GEN, p), 'utf8')) as T;
const LANGS = ['zh', 'en'] as const;
const CJK = /[\u3400-\u9fff\uff00-\uffef\u3000-\u303f]/;
const st = (S: string, L: string) => J<{ html: string }>(`st/${S}.${L}.json`).html;
const text = (h: string) => h.replace(/<[^>]+>/g, ' ');
const cards = (h: string) => [...h.matchAll(/<div class="card( [^"]*)?" id="([^"]+)"/g)].map((m) => ({ id: m[2]!, cls: m[1] ?? '', at: m.index! }));
const topCard = (h: string) => /<!--m2top-->([\s\S]*?)<!--\/m2top-->/.exec(h)?.[1] ?? '';
const cardHtml = (h: string, id: string) => { const all = cards(h), i = all.findIndex((c) => c.id === id); return h.slice(all[i]!.at, all[i + 1]?.at ?? h.length); };

describe('R15 symbol extractor', () => {
  const cases: [string, string[], boolean?][] = [
    ['x^2', ['v:x', 'sup']],
    ["f'(x)=2x", ['v:f', 'prime', 'fx', 'v:x', 'mul']],
    ['\\frac{a}{b}', ['frac', 'v:a', 'v:b']],
    ['\\sum_{i=1}^{n} x_i', ['sum', 'v:i', 'v:n', 'v:x', 'sub']],
    ['A_{ij}', ['v:A', 'sub', 'v:i', 'v:j']],
    ['A^\\top B', ['v:A', 'T', 'mul', 'v:B']],
    ['\\|v\\|', ['norm', 'v:v']],
    ['D_{\\mathrm{KL}}(p\\,\\|\\,q)', ['v:D', 'sub', 'w:KL', 'fx', 'v:p', 'parallel', 'v:q']],
    ['\\lVert a\\rVert\\,\\lVert b\\rVert', ['norm', 'v:a', 'mul', 'v:b']],
    ['|a\\cdot b|\\le\\|a\\|\\,\\|b\\|', ['abs', 'v:a', 'cdot', 'v:b', 'le', 'norm', 'mul']],
    ['D(p\\|q)\\neq D(q\\|p)', ['v:D', 'fx', 'v:p', 'parallel', 'v:q', 'neq']],
    ['\\nabla_z L=p-y', ['nabla', 'sub', 'v:z', 'v:L', 'v:p', 'v:y']],
    ['(X-\\mu_X)(Y-\\mu_Y)', ['v:X', 'mu', 'sub', 'mul', 'v:Y']],
    ['\\theta\\leftarrow\\theta-\\eta\\nabla L', ['theta', 'gets', 'eta', 'mul', 'nabla', 'v:L']],
    ['\\lim_{h\\to 0}', ['lim', 'v:h', 'to']],
    ['\\text{ReLU}(x)', ['relu', 'fx', 'v:x']],
    ['\\int_a^x f(t)\\,dt', ['int', 'v:a', 'v:x', 'v:f', 'fx', 'v:t', 'dd'], true],
    ['\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}', ['matrix', 'v:a', 'v:b', 'v:c', 'v:d']],
  ];
  for (const [tex, want, d] of cases) it(tex, () => expect(symKeys(tex, { d: !!d })).toEqual(want));
  it('an unknown TeX command fails the build instead of going unexplained', () => expect(() => symKeys('\\foo x')).toThrow(/unknown TeX command/));
  it('letters, words and Greek letters need a meaning from the card (context)', () => {
    expect(needsCtx('v:x')).toBe(true); expect(needsCtx('w:Area')).toBe(true); expect(needsCtx('theta')).toBe(true); expect(needsCtx('sum')).toBe(false);
  });
});

describe('R15 note guard', () => {
  it('finds the symbols a note mentions', () => {
    expect([...mentions('比如 σ(x)。注意 σ′ = σ(1−σ)', 'zh')].sort()).toEqual(['prime', 'sigma', 'v:x']);
    expect([...mentions('a function, e.g. the input x₁', 'en')].sort()).toEqual(['v:x']);
    expect([...mentions('the model’s output y', 'en')]).toEqual(['v:y']);
    expect([...mentions('把 x 放进函数得到的结果', 'zh')]).toEqual(['v:x']);
  });
  it('K1: the f(x) note under the limit formula does not talk about σ (it stays where σ is)', () => {
    for (const L of LANGS) {
      const h = st('K1', L), c = cardHtml(h, 'c_K1_2');
      const lists = [...c.matchAll(/<!--m2s-->([\s\S]*?)<!--\/m2s-->/g)].map((m) => m[1]!);
      const lim = lists.find((x) => x.includes('data-sym="lim"') && !x.includes('data-sym="sigma"'))!;
      expect(lim).toBeTruthy(); expect(lim).toContain('data-sym="fx"'); expect(lim).not.toContain('σ');
      const all = cardHtml(h, 'c_K1_2'); expect(all).toMatch(/σ′ = σ\(1−σ\)/);
    }
  });
});

describe('R15 glossary data', () => {
  const G = J<{ groups: { g: string; k: string[] }[]; sym: Record<string, unknown> }>('symbols.json');
  it('every symbol is in exactly one group, and every group is shown', () => {
    const inG = G.groups.flatMap((g) => g.k);
    expect(new Set(inG).size).toBe(inG.length);
    expect([...inG].sort()).toEqual(Object.keys(SYM).sort());
    expect(G.groups.map((g) => g.g)).toEqual([...GROUPS]);
  });
  for (const [k, s] of Object.entries(SYM)) it(`${k}: reading and meaning in both languages, no Chinese in English`, () => {
    for (const L of LANGS) { expect(s.r[L].trim()).not.toBe(''); expect(s.m[L].trim()).not.toBe(''); }
    expect(s.r.en + s.m.en).not.toMatch(CJK);
  });
  it('search finds the glossary and single symbols', () => {
    const XS = J<XRow[]>('search-x.json');
    expect(XS.filter((x) => x[0] === 'y').length).toBe(Object.keys(SYM).length + 1);
    for (const L of LANGS) {
      expect(searchAll(L === 'zh' ? '符号' : 'symbol', null, XS).some((h) => 'x' in h && h.x[0] === 'y' && h.x[1] === '*')).toBe(true);
      expect(searchAll(L === 'zh' ? '求和' : 'sum', null, XS).some((h) => 'x' in h && h.x[0] === 'y' && h.x[1] === 'sum')).toBe(true);
    }
  });
});

describe('R15 plain layer covers the whole site', () => {
  it('every station in the tab order has a plain layer, and nothing else does', () => {
    const order = (J<{ TABORDER: string[] }>('kb.json')).TABORDER;
    expect(order.length).toBe(22);
    expect([...PLAIN_STATIONS].sort()).toEqual([...order].sort());
  });
  it('every non-quiz card of every station got a plain opening in both languages', () => {
    const miss: string[] = [];
    for (const S of PLAIN_STATIONS) for (const L of LANGS) {
      const h = st(S, L);
      /* R21: the first card's plain opening sits in its own top card (above the diagram) */
      for (const c of cards(h)) if (!/\bquiz\b/.test(c.cls) && !(c.id === `c_${S}_0` ? topCard(h) : cardHtml(h, c.id)).includes('class="plain')) miss.push(`${S}.${L}#${c.id}`);
    }
    expect(miss).toEqual([]);
  });
});

describe('R15 symbols across the whole site (stations and popups)', () => {
  const unesc = (t: string) => t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;/g, "'");
  const popups = (S: string, L: string): Record<string, { body: string }> => { try { return J(`nodes/${S}.${L}.json`); } catch { return {}; } };
  it('all popup formulas (36 in 21 popups) carry a symbol list, on every station that has them', () => {
    for (const L of LANGS) {
      let f = 0, p = 0;
      for (const S of PLAIN_STATIONS) for (const n of Object.values(popups(S, L))) {
        const c = (n.body.match(/<annotation encoding="application\/x-tex">/g) ?? []).length;
        if (c) { f += c; p++; expect(n.body).toContain('<!--m2pi--><div class="sn">'); }
      }
      expect([f, p]).toEqual([36, 21]);
    }
  });
  it('every symbol of every popup formula resolves to a meaning, a reading and a glossary entry', () => {
    for (const S of PLAIN_STATIONS) for (const L of LANGS) for (const [id, n] of Object.entries(popups(S, L))) {
      const all = [...n.body.matchAll(/<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/g)].flatMap((m) => symKeys(unesc(m[1]!), { d: !!PLAIN[S]!.d }));
      for (const k of all) {
        const r = resolve(k, PLAIN[S]!, id, L, new Set(all));
        expect(r.mean.trim(), `${S}.${L} popup ${id} ${k}`).not.toBe(''); expect(r.read.trim(), `${S}.${L} popup ${id} ${k} reading`).not.toBe('');
        expect(r.key === 'var' || r.key === 'word' || r.key in SYM, `${S} ${id} ${k}`).toBe(true);
      }
      for (const m of n.body.matchAll(/data-sym="([^"]+)"/g)) expect(m[1] === '*' || m[1]! in SYM, `${S} ${id} ${m[1]}`).toBe(true);
      for (const m of n.body.matchAll(/<li><button type="button" class="sn-s"[^>]*>[\s\S]*?<\/li>/g)) expect(m[0], `${S} ${id}`).toMatch(/<span class="sn-r">[^<]+<\/span>/);
    }
  });
  it('the glossary covers every non-letter symbol used anywhere on the site', () => {
    const used = new Set<string>();
    for (const S of PLAIN_STATIONS) for (const L of LANGS) {
      const hs = [st(S, L), ...Object.values(popups(S, L)).map((n) => n.body)];
      for (const h of hs) for (const m of h.matchAll(/<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/g))
        for (const k of symKeys(unesc(m[1]!), { d: !!PLAIN[S]!.d })) if (!k.startsWith('v:') && !k.startsWith('w:')) used.add(k);
    }
    expect([...used].filter((k) => !(k in SYM))).toEqual([]);
    expect(used.size).toBeGreaterThan(20);
  });
});

for (const S of PLAIN_STATIONS) for (const L of LANGS) describe(`R15 plain layer guard: ${S} (${L})`, () => {
  const h = st(S, L), P = PLAIN[S]!;
  it('every PLAIN card exists, opens with a plain block, and keeps the full text in a closed "Go deeper"', () => {
    for (const [id, p] of Object.entries(P.cards)) {
      const c = cardHtml(h, id), first = id === `c_${S}_0`;
      expect(first ? topCard(h) : c, id).toMatch(/<div class="plain( pl-lab)?"><p class="pl-tag">/);
      if (/^ lab\b/.test(cards(h).find((x) => x.id === id)!.cls) || p.keep) expect(c, id).not.toContain('<details class="deep"');
      else { expect(c, id).toContain('<details class="deep"><summary>'); expect(c, id).not.toMatch(/<details class="deep"[^>]*\bopen\b/); }
    }
  });
  it('every non-quiz card on the station has a plain opening', () => {
    for (const c of cards(h)) if (!/\bquiz\b/.test(c.cls)) expect(Object.keys(P.cards), c.id).toContain(c.id);
  });
  it('every display formula is followed by its "What the symbols mean" notes', () => {
    const kx = (h.match(/<div class="kx( kx-w)?">/g) ?? []).length, sn = (h.match(/<!--m2s--><div class="sn">/g) ?? []).length;
    expect(kx).toBeGreaterThanOrEqual(S.startsWith('K') ? 1 : 0); // the maths stations all have display formulas; others may have none
    expect(sn).toBe(kx);
  });
  it('every symbol button points at a glossary entry (or the whole glossary)', () => {
    for (const m of h.matchAll(/data-sym="([^"]+)"/g)) expect(m[1] === '*' || m[1]! in SYM, m[1]).toBe(true);
  });
  it('every symbol of every formula resolves (meaning from the card or the glossary)', () => {
    for (const c of cards(h)) {
      const ch = cardHtml(h, c.id);
      for (const m of ch.matchAll(/<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/g))
      {
        const ks = symKeys(m[1]!.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;/g, "'"), { d: !!P.d });
        for (const k of ks) {
          const r = resolve(k, P, c.id, L, new Set(ks)); expect(r.read.trim(), `${c.id} ${k} reading`).not.toBe(''); expect(r.mean.trim(), `${c.id} ${k}`).not.toBe('');
          expect(r.key === 'var' || r.key === 'word' || r.key in SYM, `${c.id} ${k}`).toBe(true);
        }
      }
    }
  });
  it('no symbol note talks about a symbol that is not in its own formula, and every entry has a reading', () => {
    const iss: string[] = []; plainPage(undoPlain(h), S, L, P, undefined, iss); expect(iss).toEqual([]);
    for (const m of h.matchAll(/<li><button type="button" class="sn-s"[^>]*>[\s\S]*?<\/li>/g)) {
      const r = /<span class="sn-r">([^<]*)<\/span>/.exec(m[0]); expect(r, m[0]).not.toBeNull();
      expect(r![1]!.startsWith(CODES['sym.read'][L]) && r![1]!.length > CODES['sym.read'][L].length, m[0]).toBe(true);
    }
  });
  it('every popup with formulas ends with its symbol list, with no foreign symbols', () => {
    let nodes: Record<string, { body: string }> = {};
    try { nodes = J(`nodes/${S}.${L}.json`); } catch { return; }
    const iss: string[] = []; plainNodes(nodes, S, L, P, undefined, iss); expect(iss).toEqual([]);
    for (const [id, n] of Object.entries(nodes)) if (/<annotation encoding="application\/x-tex">/.test(n.body)) {
      expect(n.body, id).toContain('<div class="sn">'); expect(n.body, id).toContain(CODES['sym.here'][L]);
    } else expect(n.body, id).not.toContain('class="sn"');
  });
  it('the pass is idempotent and fully undoable', () => {
    expect(topPlain(plainPage(h, S, L, P), S)).toBe(h);
    expect(undoPlain(h)).not.toContain('class="plain');
    expect(undoPlain(h)).not.toContain('class="sn"');
  });
  it('R21: the first plain opening is the top card, right under the page head and above the diagram', () => {
    const t = h.indexOf('<!--m2top--><div class="pl-top" data-pl="' + S + '"><!--m2p--><div class="plain"><p class="pl-tag">'), m = h.indexOf('<div class="m-stage');
    expect(t).toBeGreaterThan(h.indexOf('<div class="pagehead')); expect(t).toBeLessThan(m < 0 ? Infinity : m);
    expect((h.match(/<!--m2top-->/g) ?? []).length).toBe(1);
    expect(topCard(h)).toContain(L === 'zh' ? '🧒 先用大白话说' : '🧒');
    expect(cardHtml(h, `c_${S}_0`)).not.toContain('<div class="plain">');
  });
  if (L === 'en') it('no Chinese in the English plain texts, notes or glossary links', () => {
    for (const p of Object.values(P.cards)) { expect(p.en).not.toMatch(CJK); if (p.more) expect(p.more.en).not.toMatch(CJK); }
    for (const m of h.matchAll(/<!--m2(p|pm|pi|s)-->([\s\S]*?)<!--\/m2\1-->/g)) expect(text(m[2]!)).not.toMatch(CJK);
    for (const ctx of Object.values(P.ctx ?? {})) for (const v of Object.values(ctx)) if (typeof v !== 'string') expect(v.en).not.toMatch(CJK);
  });
  it('zh and en have the same plain cards and the same notes', () => {
    const o = st(S, L === 'zh' ? 'en' : 'zh');
    /* per card, the same symbols get notes in both languages (sorted: a sentence may name two formulas in a different order) */
    const sig = (x: string) => [...x.matchAll(/data-sym="([^"]+)"|class="(plain|deep|pl-more)/g)].map((m) => m[1] ?? m[2]).join(' ')
      .split(/(?=\bplain\b)/).map((c) => c.split(' ').filter(Boolean).sort().join(' ')).join(' | ');
    expect(sig(h)).toBe(sig(o));
    for (const p of Object.values(P.cards)) { expect(p.zh.trim()).not.toBe(''); expect(p.en.trim()).not.toBe(''); expect(!!p.more?.zh).toBe(!!p.more?.en); }
  });
});
