/* R24 second round of ⚠️ mix-up cards: batch/epoch/step counting + every card generated, placed after its anchor, findable, jumps valid */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { plan } from '../../src/m2/cfbatch';
import { CF2_IDS } from '../../m2/content/ext/m12';
import { CF2_PLAIN } from '../../m2/plain/m12';

const gen = (f: string) => JSON.parse(readFileSync(`src/legacy/gen/${f}`, 'utf8')) as unknown;
const html = (S: string, L: string) => (gen(`st/${S}.${L}.json`) as { html: string }).html;

describe('cfbatch.plan (labBatch)', () => {
  it('1000 examples, batch 32: 32 steps, last batch 8; drop_last → 31', () => {
    expect(plan(1000, 32, 1)).toEqual({ per: 32, last: 8, total: 32, seen: 1000, dropped: 0 });
    expect(plan(1000, 32, 3)).toMatchObject({ per: 32, total: 96, seen: 3000 });
    expect(plan(1000, 32, 3, true)).toEqual({ per: 31, last: 32, total: 93, seen: 2976, dropped: 8 });
  });
  it('exact division and tiny data', () => {
    expect(plan(1024, 32, 2)).toEqual({ per: 32, last: 32, total: 64, seen: 2048, dropped: 0 });
    expect(plan(100, 512, 1)).toMatchObject({ per: 1, last: 100, total: 1 });
    expect(plan(1000, 512, 1)).toMatchObject({ per: 2, last: 488 }); /* the lab's try-it line */
    expect(plan(100, 512, 4, true)).toMatchObject({ per: 0, total: 0, seen: 0, dropped: 100 });
  });
});

describe('R24 cards are generated and reachable', () => {
  const all = Object.entries(CF2_IDS).flatMap(([S, ids]) => ids.map((id) => [S, id] as const));
  it('covers the five requested pairs plus the sweep', () => {
    expect(all.filter(([, id]) => id.startsWith('cf')).length).toBeGreaterThanOrEqual(13);
    expect(CF2_IDS.K1).toContain('cfDerivGrad'); expect(CF2_IDS.K3).toContain('cfCeKl');
    expect(CF2_IDS.K4).toEqual(expect.arrayContaining(['cfBatch', 'labBatch']));
    expect(CF2_IDS.Uc).toContain('cfToolMcpSkill'); expect(CF2_IDS.Ua).toContain('cfChatCode');
  });
  it('every card and the lab has a kept plain opening in zh and en', () => {
    for (const [S, id] of all) { const p = CF2_PLAIN[S]?.[id]; expect(p, `${S}/${id}`).toBeTruthy(); expect(p!.keep).toBe(true); expect(p!.zh).toBeTruthy(); expect(p!.en).toBeTruthy(); }
  });
  for (const L of ['zh', 'en'] as const) it(`${L}: in page, outline, search; valid jumps`, () => {
    const out = gen(`outline.${L}.json`) as Record<string, [string, string, string, number][]>;
    const sx = gen('search-x.json') as [string, string, string, string, string][];
    for (const [S, id] of all) {
      const h = html(S, L);
      expect(h.split(`id="${id}"`).length, `${S}/${id} once`).toBe(2);
      expect(out[S]!.some((r) => r[0] === id), `outline ${S}/${id}`).toBe(true);
      expect(sx.some((r) => r[1] === id && r[2] === S), `search ${id}`).toBe(true);
      if (id.startsWith('cf')) {
        expect(h).toMatch(new RegExp(`id="${id}"[^>]*>[\\s\\S]{0,400}${L === 'zh' ? '⚠️ 容易混淆' : '⚠️ Easy to mix up'}`));
        expect(out[S]!.find((r) => r[0] === id)![1].startsWith('⚠️')).toBe(true);
      }
      const blk = h.slice(h.indexOf(`id="${id}"`));
      const end = blk.indexOf('</section>', 1); const body = end > 0 ? blk.slice(0, end) : blk;
      for (const m of body.matchAll(/data-sj="([^"]+)" data-sp="([^"]+)"/g)) expect(html(m[2]!, L), `${id} → ${m[2]}/${m[1]}`).toContain(`id="${m[1]}"`);
    }
  });
  it('cards sit right after their anchors (K1 after c_K1_4, K4 batch after c_K4_3)', () => {
    const h = html('K1', 'zh'); expect(h.indexOf('id="cfDerivGrad"')).toBeGreaterThan(h.indexOf('id="c_K1_4"'));
    const k4 = html('K4', 'zh'); expect(k4.indexOf('id="cfBatch"')).toBeGreaterThan(k4.indexOf('id="c_K4_3"'));
    expect(k4.indexOf('id="labBatch"')).toBeGreaterThan(k4.indexOf('id="cfBatch"'));
  });
  it('the numbers in the cards match the maths', () => {
    const k3 = html('K3', 'zh'); for (const n of ['0.693', '0.916', '0.223']) expect(k3).toContain(n);
    expect(Math.log(2)).toBeCloseTo(0.693, 3);
    const ce = -(0.5 * Math.log(0.8) + 0.5 * Math.log(0.2)); expect(ce).toBeCloseTo(0.916, 3); expect(ce - Math.log(2)).toBeCloseTo(0.223, 3);
    const k1 = html('K1', 'zh'); expect(k1).toContain('(4, 1)');
    expect(html('K4', 'zh')).toMatch(/32/);
  });
});
