/* R23 ⚠️ mix-up cards: toy maths of labEmbOut + every card generated, findable in search and the outline (目录/Tree) */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { dot, EMB, OUT, pick, run, softmax, VOCAB } from '../../src/m2/cfmath';
import { CF_IDS } from '../../m2/content/ext/m11';

const gen = (f: string) => JSON.parse(readFileSync(`src/legacy/gen/${f}`, 'utf8')) as unknown;
const argmax = (a: number[]) => a.indexOf(Math.max(...a));

describe('cfmath (toy numbers of labEmbOut)', () => {
  it('softmax sums to 1 and keeps the order', () => {
    for (const T of [0.2, 0.5, 1, 2]) {
      const p = softmax([2, 1, 0], T);
      expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
      expect(p[0]).toBeGreaterThan(p[1]!); expect(p[1]).toBeGreaterThan(p[2]!);
    }
    expect(softmax([2, 1, 0]).map((x) => Math.round(x * 100))).toEqual([67, 24, 9]);
    expect(softmax([12, 11, 10])).toEqual(softmax([2, 1, 0]).map((x) => expect.closeTo(x, 10)));
  });
  it('lower temperature sharpens, higher flattens', () => {
    const top = (T: number) => Math.max(...run(T).probs);
    expect(top(0.3)).toBeGreaterThan(top(1)); expect(top(1)).toBeGreaterThan(top(2));
    expect(run(1).probs.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });
  it('the raw card of 吃 picks an action; the rewritten final thought picks a food', () => {
    const raw = OUT.map((o) => dot(EMB[2]!, o));
    expect(VOCAB[argmax(raw)]![0]).toBe('跑步');
    const r = run();
    expect(VOCAB[argmax(r.scores)]![0]).toBe('苹果');
    expect(r.trace).toHaveLength(3);
    expect(r.trace[2]![0]).toBeGreaterThan(r.trace[0]![0]!);
    expect(r.scores.map((s) => +s.toFixed(2))).toEqual([5.64, 5.35, 5.15, 4.79, 4.64, 0, 0.76, 0.28]);
  });
  it('causal: each position only attends to itself and earlier words', () => {
    for (const l of [run().l1, run().l2]) l.att.forEach((row, i) => { row.forEach((a, j) => { if (j > i) expect(a).toBe(0); }); expect(row.reduce((x, y) => x + y, 0)).toBeCloseTo(1, 10); });
  });
  it('pick follows the cumulative probabilities', () => {
    const p = [0.5, 0.3, 0.2];
    expect([0, 0.49, 0.5, 0.79, 0.8, 0.999].map((u) => pick(p, u))).toEqual([0, 0, 1, 1, 2, 2]);
  });
});

describe('R23 cards are generated and reachable', () => {
  const all = Object.entries(CF_IDS).flatMap(([S, ids]) => ids.map((id) => [S, id] as const));
  it('at least 14 mix-up cards plus the lab, spread over several stations', () => {
    expect(all.filter(([, id]) => id.startsWith('cf')).length).toBeGreaterThanOrEqual(14);
    expect(CF_IDS.T4b).toEqual(expect.arrayContaining(['cfEmbOut', 'cfQkOut', 'labEmbOut', 'cfLogitProb']));
    expect(Object.keys(CF_IDS).length).toBeGreaterThanOrEqual(7);
  });
  for (const L of ['zh', 'en'] as const) it(`${L}: every card is in its station page, the outline and search`, () => {
    const out = gen(`outline.${L}.json`) as Record<string, [string, string, string, number][]>;
    const sx = gen('search-x.json') as [string, string, string, string, string][];
    for (const [S, id] of all) {
      const html = (gen(`st/${S}.${L}.json`) as { html: string }).html;
      expect(html, `${S}/${id}`).toContain(`id="${id}"`);
      expect(out[S]!.some((r) => r[0] === id), `outline ${S}/${id}`).toBe(true);
      expect(sx.some((r) => r[1] === id && r[2] === S), `search ${id}`).toBe(true);
      if (id.startsWith('cf')) {
        expect(html).toMatch(new RegExp(`id="${id}"[^>]*>[\\s\\S]{0,400}${L === 'zh' ? '⚠️ 容易混淆' : '⚠️ Easy to mix up'}`));
        expect(out[S]!.find((r) => r[0] === id)![1].startsWith('⚠️')).toBe(true);
      }
    }
  });
  it('the dictionary card carries the GPT-2 shape and the memory line on Q·K', () => {
    const zh = (gen('st/T4b.zh.json') as { html: string }).html, en = (gen('st/T4b.en.json') as { html: string }).html;
    for (const h of [zh, en]) expect(h).toContain('50257');
    expect(zh).toMatch(/50257\s*×\s*768/);
    expect(zh).toContain('id="cfQkOut"');
  });
});
