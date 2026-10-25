/* R28 pilot: one calm skeleton on H, Job and T4a (shell/r28.ts) — what the pages and the chrome promise */
import { describe, expect, it } from 'vitest';
import { R28, isR28, isZone, upOf } from '../../src/shell/r28';
import { HSTEPS28 } from '../../src/onboard';
import { O } from '../../src/onboard/strings';
import { PATH, TABORDER } from '../../src/legacy/kb';

describe('R28 pilot set', () => {
  it('rollout: the home page and all 27 stops use the calm skeleton (pilot set H, Job, T4a kept as the seed)', () => {
    expect([...R28]).toEqual(['H', 'Job', 'T4a']);
    expect(TABORDER.length).toBe(27);
    for (const S of ['H', ...TABORDER]) expect(isR28(S), S).toBe(true);
    expect(isZone('Job')).toBe(true); expect(isZone('T4a')).toBe(false); expect(isZone('H')).toBe(false);
  });
  it('‹ goes exactly one level up the tree (the home page has no up)', () => {
    expect(upOf('H')).toBeNull(); expect(upOf('Job')).toBe('H'); expect(upOf('T4a')).toBe('T4');
    for (const S of TABORDER) { const p = PATH[S]!; expect(upOf(S), S).toBe(p[p.length - 2]); }
  });
});

describe('R28 walk-through words', () => {
  const keys = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'hwGo5'] as const;
  it('say nothing about controls the new skeleton dropped (‹ › in the header, EN, the 5-button row)', () => {
    for (const k of keys) {
      expect(O[k].zh, k).not.toMatch(/EN|🧪|✅|📑|‹ ›/);
      expect(O[k].en, k).not.toMatch(/[\u4e00-\u9fff]|\{NS\}/);
    }
    expect(O.n1.zh).toContain(String(TABORDER.length));
  });
  it('the home walk-through has 5 steps, as its button says, starting at what this is', () => {
    expect(HSTEPS28).toHaveLength(5); expect(O.hwGo5.zh).toContain('5'); expect(HSTEPS28[0]![0]).toBe('.hm-t');
    expect(HSTEPS28.map(([q]) => q).join()).not.toMatch(/mPrev|mNext|mLang|bnav/);
  });
});
