/* R12: the home page (T1) opens with the knowledge map — every station one tap from home, layers in macro → micro → maths
   order, counts computed from the generated pages, both languages, placed above the T1 diagram. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { KMAP, KSIDE } from '../../m2/content/kmap';
import { CODES } from '../../src/i18n/codes';

const GEN = join(__dirname, '../../src/legacy/gen');
const J = <T>(p: string) => JSON.parse(readFileSync(join(GEN, p), 'utf8')) as T;
const KB = J<{ TABORDER: string[]; TABN: Record<string, { zh: string; en: string }> }>('kb.json');
const XS = J<[string, string, string, string, string][]>('search-x.json');
const kmOf = (L: string) => /<!--m2k-->([\s\S]*?)<!--\/m2k-->/.exec(J<{ html: string }>(`st/T1.${L}.json`).html)?.[1] ?? '';
const attrs = (h: string, a: string) => [...h.matchAll(new RegExp(`${a}="([^"]+)"`, 'g'))].map((m) => m[1] as string);

describe('R12 knowledge map data', () => {
  it('covers every station exactly once, in the site order (T8 as the side entry)', () => {
    const all = KMAP.flatMap((l) => l.st);
    expect(new Set(all).size).toBe(all.length);
    expect([...all, KSIDE.st].sort()).toEqual([...KB.TABORDER].sort());
    const ix = (s: string) => KB.TABORDER.indexOf(s);
    /* within a layer, stations keep the site order; the layers run macro → micro → maths */
    for (const l of KMAP) expect([...l.st].sort((a, b) => ix(a) - ix(b))).toEqual(l.st);
    expect(KMAP[0]!.st[0]).toBe('U'); expect(KMAP[KMAP.length - 1]!.st).toEqual(['K1', 'K2', 'K3', 'K4', 'K5']);
  });
  it('every layer has a zh and an en name and one-liner, English without CJK', () => {
    for (const l of KMAP) for (const b of [l.n, l.learn]) { expect(b.zh.length * b.en.length).toBeGreaterThan(0); expect(/[\u3400-\u9fff]/.test(b.en)).toBe(false); }
  });
});

for (const L of ['zh', 'en'] as const) describe(`R12 knowledge map on the home page (${L})`, () => {
  const km = kmOf(L), html = J<{ html: string }>(`st/T1.${L}.json`).html;
  it('sits once on T1, after the page head and before the T1 diagram', () => {
    expect(html.match(/<!--m2k-->/g)?.length).toBe(1);
    expect(html.indexOf('<!--m2k-->')).toBeGreaterThan(html.indexOf('id="phT1"'));
    expect(html.indexOf('<!--/m2k-->')).toBeLessThan(html.indexOf('<div class="m-stage">'));
    expect(km).toContain(CODES['km.title'][L]);
  });
  it('links every station in one tap (T1 itself scrolls to its diagram; T8 map + glossary as side entries)', () => {
    const go = new Set(attrs(km, 'data-go'));
    for (const S of KB.TABORDER) if (S !== 'T1') expect(go.has(S), S).toBe(true);
    expect(km).toContain('data-sj="c_T1_0" data-sp="T1"');
    expect(km).toContain('data-sj="c_T8_0" data-sp="T8"'); expect(km).toContain('data-sj="c_T8_1" data-sp="T8"');
    expect(km.match(/<li class="km-l"/g)?.length).toBe(KMAP.length);
  });
  it('shows lab and card counts computed from the pages (same rows as the search index)', () => {
    const rows = [...km.matchAll(/<li class="km-l"[^>]*data-km="([^"]+)"[\s\S]*?data-labs="(\d+)" data-cards="(\d+)"/g)];
    expect(rows.length).toBe(KMAP.length);
    let labs = 0, cards = 0;
    for (const [, st, l, c] of rows) {
      const S = st!.split(' ');
      expect(Number(l), st).toBe(XS.filter((r) => S.includes(r[2]) && r[0] === 'l').length);
      expect(Number(c), st).toBe(XS.filter((r) => S.includes(r[2]) && r[0] === 'c').length);
      labs += Number(l); cards += Number(c);
    }
    /* every lab sits in some layer except T8's (it has none) */
    expect(labs).toBe(XS.filter((r) => r[0] === 'l').length);
    expect(cards).toBe(XS.filter((r) => r[0] === 'c' && r[2] !== 'T8').length);
  });
  it('sub-items carry the real station names', () => {
    for (const l of KMAP) if (l.st.length > 1) for (const s of l.st) {
      const n = KB.TABN[s]![L];
      if (n !== l.n[L]) expect(km, s).toContain(`data-go="${s}">${n.replace(/^(数学 · |Math · )/, '').replace(/&/g, '&amp;')}</button>`);
    }
    if (L === 'en') expect(/[\u3400-\u9fff]/.test(km.replace(/<[^>]+>/g, ''))).toBe(false);
  });
});
