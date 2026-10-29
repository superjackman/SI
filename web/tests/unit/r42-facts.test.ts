import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { makeDemo, handle } from '../../src/l4/tf/core';
import { fixLine, fixLines } from '../../src/l4/pages';

/* R42: every real number printed on cards / T3 / U4 / TR4 / TR6 must come from the site's actual model */
const d = makeDemo(); const V = d.chars.length, Q = 7, BLUE = d.chars.indexOf('蓝'), GREEN = d.chars.indexOf('绿'), RED = d.chars.indexOf('红');
const pct = (p: number, k = 1) => (p * 100).toFixed(k);
const src = (f: string) => readFileSync(new URL('../../src/' + f, import.meta.url), 'utf8');

describe('R42 real model numbers', () => {
  test('dictionary ids used in K03', () => { expect([d.chars.indexOf('色'), d.chars.indexOf('？'), BLUE]).toEqual([7, 8, 9]); });
  test('before training: 蓝 5.4% → 2.93; line-1 loss 3.21', () => {
    const p = d.before.probs[Q * V + BLUE]!; expect(pct(p)).toBe('5.4'); expect((-Math.log(p)).toFixed(2)).toBe('2.93'); expect(d.before.loss!.toFixed(2)).toBe('3.21');
  });
  test('3-line loss 2.48 → 0.002 over 200 steps', () => { expect(d.steps).toBe(200); expect(d.losses[0]!.toFixed(2)).toBe('2.48'); expect(d.losses[d.losses.length - 1]!.toFixed(3)).toBe('0.002'); });
  test('after training: 蓝 99.8%, 绿 0.05%, 红 0.04%', () => {
    const a = d.after.probs; expect(pct(a[Q * V + BLUE]!)).toBe('99.8'); expect(pct(a[Q * V + GREEN]!, 2)).toBe('0.05'); expect(pct(a[Q * V + RED]!, 2)).toBe('0.04');
    const r = handle({ op: 'answer', which: 'demo', q: '天空是什么颜色？' }, () => {}) as { steps: { top: [number, number][] }[] };
    expect(r.steps[0]!.top[0]![0]).toBe(BLUE);
  });
  test('before training top guesses printed on KC11 (草 22.9 / 什 14.8 / 绿 12.0)', () => {
    const row = d.chars.map((c, i) => [c, d.before.probs[Q * V + i]!] as const).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, p]) => c + pct(p));
    expect(row).toEqual(['草22.9', '什14.8', '绿12.0']);
  });
  test('cards and pages print exactly these numbers', () => {
    const k = src('l4/c/k-zh.json'), k3 = src('l4/c/k3-zh.json'), p3 = src('lx/p3.ts');
    for (const s of ['2.93', '99.8%', '0.002']) expect(k).toContain(s);
    for (const s of ['22.9%', '99.8%']) expect(k3).toContain(s);
    expect(p3).toContain("['蓝', 5.4]"); expect(p3).toContain("['蓝', 99.8], ['绿', 0.05], ['红', 0.04]");
  });
});

describe('R42 MY1 half-width fixes', () => {
  test('fixLine', () => {
    expect(fixLine('海是什么颜色? -> 蓝')).toBe('海是什么颜色？ → 蓝');
    expect(fixLine('海是什么颜色？=>蓝')).toBe('海是什么颜色？→蓝');
    expect(fixLine('海是什么颜色：蓝')).toBe('海是什么颜色→蓝');
    expect(fixLine('天空是什么颜色？→蓝')).toBe('天空是什么颜色？→蓝');
    expect(fixLines('a？→b\nc?->d').fixed).toEqual([2]);
  });
});
