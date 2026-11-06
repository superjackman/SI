// R56 micro-loop: the variant pools start at the page's own question, every wrong path names a different number,
// and the review queue spaces 1 / 3 / 7 days and keeps wrong answers.
import { beforeEach, describe, expect, it } from 'vitest';
import { QQ } from '../../src/vf/data';
import { BASE, misOf, varN, varQ } from '../../src/vf/var';
import { VAR, type VarK } from '../../src/dv/nums';
import { ML } from '../../src/dv/mld';
import { DV_KEY } from '../../src/dv/links';
import { ML_G, masteredSt } from '../../src/dv/prog';

describe('R56 variants', () => {
  for (const [k, id] of Object.entries(BASE) as [VarK, string][]) {
    it(`${k}: entry 0 is ${id} with the same answer`, () => { expect(varQ(k, 0).a).toBeCloseTo(QQ[id]!.a, 6); });
  }
  for (const k of Object.keys(VAR) as VarK[]) {
    it(`${k}: every variant has an answer and wrong paths that differ from it and are recognised`, () => {
      for (let i = 0; i < varN(k); i++) {
        const q = varQ(k, i); expect(Number.isFinite(q.a)).toBe(true); expect(q.q[0].length).toBeGreaterThan(4); expect(q.q[1].length).toBeGreaterThan(4);
        for (const m of q.mis) if (Math.abs(m.v - q.a) > q.tol) expect(misOf(q, m.v)).toBe(m);
        expect(misOf(q, q.a)).toBeNull();
      }
    });
  }
});
describe('R56 content', () => {
  it('every station has goals, 3 options per guess and per prediction, 3 hand-written takeaways in zh and en', () => {
    expect([...DV_KEY].sort()).toEqual(Object.keys(ML_G).sort());
    expect(Object.keys(ML).sort()).toEqual(Object.keys(ML_G).sort());
    for (const k of DV_KEY) {
      const S = ML[k]!; expect(S.goals.length).toBe(ML_G[k]); expect(S.goals.length).toBeGreaterThanOrEqual(2); expect(S.take.length).toBe(3);
      for (const line of S.take) { expect(line[0].length).toBeGreaterThan(12); expect(line[1].length).toBeGreaterThan(12); }
      for (const g of S.goals) {
        expect(g.o.length).toBe(3); expect(g.why.length).toBe(3); expect(g.pr.o.length).toBe(3); expect(g.a).toBeGreaterThanOrEqual(0); expect(g.a).toBeLessThan(3); expect(VAR[g.vk]).toBeTruthy();
        const q = varQ(g.vk, 0); expect(q.mis.some((m) => Math.abs(m.v - q.a) > q.tol)).toBe(true);
        for (const n of g.ly) expect(n).toBeGreaterThanOrEqual(1); expect(g.ly.every((n) => n <= 5)).toBe(true);
      }
      const en = JSON.stringify(S, (_, v: unknown) => (Array.isArray(v) && v.length === 2 && typeof v[0] === 'string' && typeof v[1] === 'string' ? v[1] : v));
      expect(en, k).not.toMatch(/[\u3400-\u9fff]/);
    }
  });
});
describe('R56 one ledger', () => {
  beforeEach(() => localStorage.clear());
  it('a station counts as mastered when all its small goals are', () => {
    expect(masteredSt().has('2')).toBe(false);
    localStorage.setItem('si.ml', JSON.stringify({ '2': { m: [1, 1, 1], k: [2, 2, 2], v: [0, 0, 0], g: 0, s: 'v', p: [1, 1, 1] } }));
    expect(masteredSt().has('2')).toBe(true);
  });
});

import { firstTry, rvAll, rvAns, rvNext, rvPick, wrongIds } from '../../src/px/rv';
import { sharer } from '../../src/dv/ch';
describe('R56 今日复习', () => {
  beforeEach(() => localStorage.clear());
  it('right answers come back after 1, 3 and 7 days, then retire', () => {
    rvAns('s2a', true, 100); expect(rvPick(3, 100)).toEqual([]); expect(rvPick(3, 101).map((p) => p.id)).toEqual(['s2a']);
    rvAns('s2a', true, 101); expect(rvAll().s2a!.due).toBe(104); rvAns('s2a', true, 104); expect(rvAll().s2a!.due).toBe(111);
    rvAns('s2a', true, 111); expect(rvAll().s2a!.b).toBe(3); expect(rvPick(3, 120)).toEqual([]); expect(rvNext(111)).toBeNull();
  });
  it('a wrong answer goes in the wrong book first; only a right answer on the review page clears it', () => {
    rvAns('s1a', true, 50); rvAns('s2a', false, 50); expect(wrongIds()).toEqual(['s2a']);
    expect(rvPick(3, 51).map((p) => [p.id, p.why])).toEqual([['s2a', 'w'], ['s1a', 'due']]);
    rvAns('s2a', true, 50); expect(wrongIds()).toEqual(['s2a']); expect(rvPick(3, 50)).toEqual([]);
    rvAns('s2a', true, 51, true); expect(wrongIds()).toEqual([]);
    expect(firstTry()).toEqual({ n: 2, r: 1, p: 50 });
  });
  it('at most 3 a day', () => { for (const id of ['a', 'b', 'c', 'd']) rvAns(id, false, 9); expect(rvPick(3, 9).length).toBe(3); });
});
describe('R56 friend link', () => {
  it('reads the sharer numbers only when valid', () => {
    expect(sharer('?lang=zh&fa=82&fm=5')).toEqual({ fa: 82, fm: 5 });
    expect(sharer('?fa=120&fm=5')).toBeNull(); expect(sharer('?fa=80&fm=99')).toBeNull(); expect(sharer('?fa=8x&fm=1')).toBeNull(); expect(sharer('?lang=en')).toBeNull();
  });
});
