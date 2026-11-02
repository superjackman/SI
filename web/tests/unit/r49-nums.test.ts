// R49 · R4: one shared number table (src/dv/nums.ts) read by both the cards and the stage pages.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { NUM, NUMS, deepFill, fillCardText, fillDvText, numKeys, type Lang } from '../../src/dv/nums';
import zh from '../../src/dv/zh';
import en from '../../src/dv/en';
import type { Card } from '../../src/l4/c/kc';
import { DV_EX, DV_EX_PTR, DV_N } from '../../src/dv/links';

const src = (p: string) => fs.readFileSync(path.join(__dirname, '../../src', p), 'utf8');
const RAW: Record<Lang, Record<string, Card>> = {
  zh: { ...JSON.parse(src('l4/c/k-zh.json')), ...JSON.parse(src('l4/c/k1-zh.json')), ...JSON.parse(src('l4/c/k3-zh.json')) },
  en: { ...JSON.parse(src('l4/c/k-en.json')), ...JSON.parse(src('l4/c/k1-en.json')), ...JSON.parse(src('l4/c/k3-en.json')) },
};
const DV = { zh, en };
const LS: Lang[] = ['zh', 'en'];
const cardRaw = (l: Lang, id: string) => RAW[l][id]!.s.join('\n');
const stageRaw = (l: Lang, n: number) => JSON.stringify(DV[l].st[n]);
const card = (l: Lang, id: string) => deepFill(RAW[l][id]!, (s) => fillCardText(s, l)).s.join('\n');
const stage = (l: Lang, n: number) => deepFill(DV[l].st[n]!, (s) => fillDvText(s, l));
// every page text where a number could be hard-coded
const FILES = ['l4/c/k-zh.json', 'l4/c/k1-zh.json', 'l4/c/k3-zh.json', 'l4/c/k-en.json', 'l4/c/k1-en.json', 'l4/c/k3-en.json', 'dv/zh.ts', 'dv/en.ts', 'px/quiz.ts'];

describe('R49 shared numbers (R4)', () => {
  it('every {#key} on any card or stage exists in the table', () => {
    const all = FILES.map(src).join('\n');
    const used = new Set(numKeys(all));
    for (const k of used) expect(NUMS[k], k).toBeTruthy();
    // and nothing is left unresolved after filling
    for (const l of LS) {
      for (const id of Object.keys(RAW[l])) expect(card(l, id), id).not.toMatch(/\{#/);
      DV[l].st.forEach((_, n) => expect(JSON.stringify(stage(l, n)), 'D/' + n).not.toMatch(/\{#/));
    }
  });
  it('each number is used on both sides: on every card and every stage page it lists (zh + en)', () => {
    for (const [k, n] of Object.entries(NUMS)) {
      expect(n.cards.length, k).toBeGreaterThan(0);
      expect(n.st.length, k).toBeGreaterThan(0);
      for (const l of LS) {
        for (const id of n.cards) expect(numKeys(cardRaw(l, id)), `${l} ${id} {#${k}}`).toContain(k);
        for (const s of n.st) expect(numKeys(stageRaw(l, s)), `${l} D/${s} {#${k}}`).toContain(k);
      }
    }
  });
  it('a page only uses numbers that list it (the table says who shares what)', () => {
    for (const l of LS) {
      for (const id of Object.keys(RAW[l])) for (const k of numKeys(cardRaw(l, id))) expect(NUMS[k]!.cards, `${l} ${id} {#${k}}`).toContain(id);
      DV[l].st.forEach((_, s) => { for (const k of numKeys(stageRaw(l, s))) expect(NUMS[k]!.st, `${l} D/${s} {#${k}}`).toContain(s); });
    }
  });
  it('no page hard-codes a shared number (or an old differing value) outside the table', () => {
    const bad: string[] = [];
    for (const f of FILES) {
      const s = src(f);
      for (const [k, n] of Object.entries(NUMS)) for (const re of n.ban) {
        for (const m of s.matchAll(new RegExp(re.source, 'g'))) bad.push(`${f}: "${s.slice(Math.max(0, m.index! - 25), m.index! + m[0].length + 10)}" — use {#${k}}`);
      }
    }
    expect(bad).toEqual([]);
  });
  it('table values are plain text (formulas in `…`) and their ban patterns match themselves', () => {
    for (const [k, n] of Object.entries(NUMS)) for (const l of LS) {
      expect(n[l], k).not.toMatch(/[<>&"]|\{[#~]/);
      expect(n[l].split('`').length % 2, k).toBe(1);
      expect(n.ban.some((re) => re.test(n[l].replace(/`/g, ''))), `${k} ${l}: ban must catch its own value`).toBe(true);
    }
  });
  it('approximate / empirical numbers carry an ≈ label on both sides', () => {
    for (const [k, n] of Object.entries(NUMS)) {
      if (!n.ap) continue;
      for (const l of LS) {
        const lab = n.ap[l === 'zh' ? 0 : 1];
        expect(lab.length, k).toBeGreaterThan(1);
        for (const id of n.cards) expect(card(l, id), `${l} ${id}`).toContain('<span class="ap">≈ ' + lab + '</span>');
        for (const s of n.st) expect(JSON.stringify(stage(l, s)), `${l} D/${s}`).toContain('{~' + lab + '}');
      }
    }
    // the rules of thumb named in R4 are all marked
    for (const k of ['c6nd', 'ch20', 'p12', 'ffn']) expect(NUMS[k]!.ap, k).toBeTruthy();
  });
  it('the filled card and stage show the very same text', () => {
    for (const [k, n] of Object.entries(NUMS)) for (const l of LS) {
      const plain = n[l].replace(/`/g, '');
      const strip = (s: string) => s.replace(/<[^>]+>/g, '').replace(/`/g, '');
      for (const id of n.cards) expect(strip(card(l, id)), `${l} ${id} {#${k}}`).toContain(plain);
      for (const s of n.st) expect(strip(JSON.stringify(stage(l, s))), `${l} D/${s} {#${k}}`).toContain(plain);
    }
  });
  it('the numbers are right', () => {
    const sm = (x: number[]) => { const e = x.map(Math.exp), t = e.reduce((a, b) => a + b); return e.map((v) => v / t); };
    const f3 = (x: number[]) => '[' + x.map((v) => v.toFixed(3)).join(', ') + ']';
    expect(f3(sm([16 / 8, 8 / 8, 0]))).toBe(NUM.attW.en);
    expect('[' + sm([16, 8, 0]).map((v) => v.toFixed(4)).join(', ') + ']').toBe(NUM.attSat.en);
    expect(2 * 4096 * 8).toBe(65536);
    expect((65536 / (4096 * 4096) * 100).toFixed(2)).toBe('0.39');
    expect(2 * 32 * 4096 * 4096 * 2 / 2 ** 30).toBe(2);
    expect((224 / 16) ** 2).toBe(196);
    expect((100 * 101) / 2).toBe(5050);
    const pct = (x: number[], T: number) => sm(x.map((v) => v / T)).map((v) => v * 100);
    const t1 = pct([4.1, 1.3, 1.0], 1), t05 = pct([4.1, 1.3, 1.0], 0.5), t2 = pct([4.1, 1.3, 1.0], 2);
    const fm = (x: number[], d: number[]) => x.map((v, i) => v.toFixed(d[i]) + '%').join(' / ');
    expect(fm(t1, [0, 1, 1])).toBe(NUM.t1.en);
    expect(fm(t05, [1, 1, 1])).toBe(NUM.t05.en);
    expect(fm(t2, [0, 0, 0])).toBe(NUM.t2.en);
    expect(1.4e12 / 70e9).toBe(20);
  });
});

// C12 · one canonical example per concept: the card holds it, the stage page reuses its numbers or points to it.
describe('R49 canonical examples (C12)', () => {
  const keysAt = (n: number) => new Set(LS.flatMap((l) => numKeys(stageRaw(l, n))));
  it('every stage with its own example names its canonical card(s); the recap has none', () => {
    expect(DV_EX.length).toBe(DV_N);
    for (let n = 0; n < DV_N - 1; n++) expect(DV_EX[n]!.length, 'D/' + n).toBeGreaterThan(0);
    expect(DV_EX[DV_N - 1]).toEqual([]);
    for (const ks of DV_EX) for (const k of ks) expect(RAW.zh[k], k).toBeTruthy();
  });
  it('a canonical card shares at least one table number with its stage, unless the stage only points to it', () => {
    for (let n = 0; n < DV_N; n++) for (const id of DV_EX[n]!) {
      const shared = [...keysAt(n)].filter((k) => NUMS[k]!.cards.includes(id));
      if (n in DV_EX_PTR) expect(shared, `D/${n} ${id} is listed as pointer-only`).toEqual([]);
      else expect(shared.length, `D/${n} ${id}: no shared {#key}`).toBeGreaterThan(0);
    }
  });
  it('every shared number on a stage comes from one of that stage’s canonical cards', () => {
    for (let n = 0; n < DV_N; n++) for (const k of keysAt(n)) expect(NUMS[k]!.cards.some((id) => DV_EX[n]!.includes(id)), `D/${n} {#${k}} not from ${DV_EX[n]}`).toBe(true);
  });
  it('pointer-only stages say why, and are few', () => {
    for (const [n, why] of Object.entries(DV_EX_PTR)) { expect(why.length, n).toBeGreaterThan(20); expect(DV_EX[+n]!.length, n).toBe(1); }
    expect(Object.keys(DV_EX_PTR).length).toBeLessThanOrEqual(4);
  });
  it('a stage that reuses a card example says so in its ④ text (zh + en)', () => {
    for (let n = 0; n < DV_N; n++) {
      if (n in DV_EX_PTR || !DV_EX[n]!.length) continue;
      for (const l of LS) {
        const x = DV[l].st[n]!.x.join('\n');
        const named = DV_EX[n]!.filter((id) => x.includes(l === 'zh' ? `${id} 卡` : `card ${id}`));
        expect(named.length, `${l} D/${n} ④ names none of ${DV_EX[n]}`).toBeGreaterThan(0);
      }
    }
  });
  it('the softmax picture (lx/m5) shows the same percentages as card KM04', () => {
    for (const l of LS) { const m5 = src(`lx/m5-${l}.json`); for (const p of NUM.smP.en.split(' / ')) expect(m5, `${l} ${p}`).toContain(p); expect(m5).not.toMatch(/9\.3%/); }
  });
  it('the example numbers are right', () => {
    const sm = (x: number[]) => { const e = x.map(Math.exp), t = e.reduce((a, b) => a + b); return e.map((v) => v / t); };
    expect(sm([2, 1, 0.1, -0.5]).map((v) => (v * 100).toFixed(1) + '%').join(' / ')).toBe(NUM.smP.en);
    expect((-Math.log(0.0536)).toFixed(2)).toBe('2.93');
    expect((-Math.log(0.998)).toFixed(3)).toBe('0.002');
    const gd = (eta: number, k: number) => { const w = [0]; for (let i = 0; i < k; i++) w.push(w[i]! - eta * 2 * (w[i]! - 2)); return w.map((v) => v.toFixed(2).replace('-', '−')).join(', '); };
    expect('w = ' + gd(0.3, 4) + '…').toBe(NUM.gd03.en);
    expect('w = ' + gd(1.1, 4)).toBe(NUM.gd11.en);
    expect((0.5 - 0.1 * 0.2).toFixed(2)).toBe('0.48');
    const v: number[] = []; let m = 0; for (let i = 0; i < 4; i++) { m = 0.9 * m + 1; v.push(+m.toFixed(2)); }
    expect('v = ' + v.join(', ')).toBe(NUM.mom.en);
    expect(3 * 2 + 1 * 2.5).toBe(8.5);
    expect((1 / (1 + Math.exp(-(1.5 - 0.5)))).toFixed(2)).toBe('0.73');
  });
});
