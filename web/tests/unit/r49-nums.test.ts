// R49 · R4: one shared number table (src/dv/nums.ts) read by both the cards and the stage pages.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { NUM, NUMS, deepFill, fillCardText, fillDvText, numKeys, type Lang } from '../../src/dv/nums';
import zh from '../../src/dv/zh';
import en from '../../src/dv/en';
import type { Card } from '../../src/l4/c/kc';

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
