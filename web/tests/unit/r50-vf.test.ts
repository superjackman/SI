// R50 验证优化: self-check questions, 常见误解 and the three demos. Every answer is recomputed here by hand,
// the demos are checked against the shared number table, and the page lists are checked against the real pages.
import { describe, expect, it, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { NUM, NUMS, fillDvText, numKeys } from '../../src/dv/nums';
import { DV_N, dvK } from '../../src/dv/links';
import { QQ, MCS, MC_PAGES, MC_ALL, DEMO } from '../../src/vf/data';
import { VF_Q, VF_KEY, VF_MC_ONLY, hasVf, vfAdd, vfDone, vfStat, vfStages } from '../../src/vf/ids';
import { attW, D_ATT, D_DK, D_SM, fmt, gdKind, gdSeq, parseNum, softmax } from '../../src/vf/calc';
import { DEMO0, demoOut, mk, ok, ansT, order } from '../../src/vf/ui';

const src = (p: string) => fs.readFileSync(path.join(__dirname, '../../src', p), 'utf8');
const CARDS = new Set(['k-zh', 'k1-zh', 'k3-zh'].flatMap((f) => Object.keys(JSON.parse(src(`l4/c/${f}.json`)))));
const CJK = /[\u3400-\u9fff\uff00-\uffef\u3000-\u303f]/;
const en = (k: keyof typeof NUM) => NUM[k].en;
const ln = Math.log;

/** hand-computed answers (numbers written out, not taken from src/vf) */
const EXPECT: Record<string, number> = {
  s0a: 2, s0b: 1, s1a: 0.5 / 3, s1b: ln(2), s1c: 0, s2a: 1.2, s2b: 1.68, s2c: 4.4, s3a: 1, s3b: 1, s3c: 0,
  s4a: 3, s4b: 4, s4c: 6, s5a: 3906.25, s5b: 2.71, s5c: 0, s6a: 8.5, s6b: 0.88,
  s7a: Math.exp(2) / (Math.exp(2) + Math.exp(1) + 1),
  s7b: (100 * Math.exp(2)) / (Math.exp(2) + Math.exp(1) + Math.exp(0.1) + Math.exp(-0.5)),
  s8a: 2, s8b: (12 * 4096 * 4096) / 1e6, s8c: 0, s8d: 64, s9a: 4, s9b: -ln(0.998), s9c: 5,
  s10a: 1 / (1 + Math.exp(-1)), s10b: 0.5, s10c: 0, s11a: 65536, s11b: 3.5, s11c: 0,
  s12a: 2 * 32 * 32 * 128 * 2, s12b: 5050, s12c: (100 * Math.exp(4.1)) / (Math.exp(4.1) + Math.exp(1.3) + Math.exp(1)),
  s13a: 0.6, s13b: 0, s14a: 0.95 ** 20, s14b: 0.99 ** 20, s15a: 196, s15b: 256, s15c: 12, s16a: 0, s16b: ln(4),
  m1a: Math.sqrt(13), m1b: 2.5, m2b: 0.74, m2c: 0, m3a: -0.22, m3b: 2, m4b: 0, m5a: 2, m5b: -(ln(0.12) + ln(0.1) + ln(0.11)),
  m6a: 0.3472, m6b: -(ln(0.62) + ln(0.7) + ln(0.8)), m7a: -ln(0.62), m7b: -0.38, m7c: 0, m8a: -4, m8b: -3.999,
  m9b: 3.3, m10a: 0.2, m10b: (2 - 2 * 0.4 ** 4 - 2) ** 2 + 0.5, m11a: 8.5 / 3, m11b: (1.5 - 8.5 / 3) / Math.sqrt(((1.5 - 8.5 / 3) ** 2 + (1 - 8.5 / 3) ** 2 + (6 - 8.5 / 3) ** 2) / 3),
  m12c: 16, m13b: -0.1, m13c: 1.998, k11a: 0, k14a: 0.48,
};

describe('R50 self-check questions', () => {
  it('page lists ↔ questions: every listed id exists, every question is listed, pages are real', () => {
    const listed = new Set(Object.values(VF_Q).flat());
    expect([...listed].sort()).toEqual(Object.keys(QQ).sort());
    for (let i = 0; i < DV_N; i++) expect(VF_Q['D/' + dvK(i)]?.length, 'D/' + dvK(i)).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < DV_N; i++) expect(VF_Q['D/' + dvK(i)]!.length, 'D/' + dvK(i)).toBeLessThanOrEqual(3);
    expect(Object.keys(VF_Q).filter((p) => p.startsWith('D/')).length, 'only real stations').toBe(DV_N);
    for (const p of Object.keys(VF_Q)) if (!p.startsWith('D/')) expect(CARDS.has(p), p).toBe(true);
    // all 13 maths cards KM01–KM13 have questions
    for (let i = 1; i <= 13; i++) expect(VF_Q['KM' + String(i).padStart(2, '0')]?.length, 'KM' + i).toBeGreaterThan(0);
  });
  it('every answer matches the hand computation', () => {
    expect(Object.keys(EXPECT).sort()).toEqual(Object.keys(QQ).sort());
    for (const [id, q] of Object.entries(QQ)) expect(q.a, id).toBeCloseTo(EXPECT[id]!, 9);
  });
  it('the shown answer is accepted, a clearly wrong one is not; choices are well-formed', () => {
    for (const [id, q] of Object.entries(QQ)) {
      if (q.o) {
        expect(q.o.length, id).toBeGreaterThanOrEqual(2);
        expect(Number.isInteger(q.a) && q.a >= 0 && q.a < q.o.length, id).toBe(true);
        expect(order(id, q.o.length).slice().sort(), id).toEqual([...q.o.keys()]);
        continue;
      }
      const shown = parseNum(fmt(q.a, q.d))!;
      expect(ok(q, shown), `${id} ${fmt(q.a, q.d)}`).toBe(true);
      expect(ok(q, q.a + Math.max(1, Math.abs(q.a))), id).toBe(false);
    }
  });
  it('answers tied to a shared number agree with the table (they cannot drift)', () => {
    for (const [id, q] of Object.entries(QQ)) {
      if (!q.n) continue;
      expect(NUMS[q.n], id).toBeTruthy();
      for (const l of ['zh', 'en'] as const) { const c = (x: string) => x.replace(/−/g, '-').replace(/(\d),(\d{3})/g, '$1$2'); expect(c(NUMS[q.n]![l]), `${id} ${q.n}`).toContain(c(fmt(q.a, q.d))); }
    }
  });
  it('zh + en texts: non-empty, en has no CJK, placeholders resolve, formulas stay plain text', () => {
    const texts: [string, readonly [string, string]][] = [];
    for (const [id, q] of Object.entries(QQ)) { texts.push([id + '.q', q.q], [id + '.h', q.h], [id + '.w', q.w]); if (q.u) texts.push([id + '.u', q.u]); q.o?.forEach((o, i) => texts.push([`${id}.o${i}`, o])); }
    for (const [k, m] of Object.entries(MC_ALL)) texts.push([k + '.x', m.x], [k + '.r', m.r]);
    for (const [k, [zh, e]] of texts) {
      expect(zh.trim().length, k).toBeGreaterThan(0); expect(e.trim().length, k).toBeGreaterThan(0);
      expect(CJK.test(e), `${k}: ${e}`).toBe(false);
      for (const n of numKeys(zh + e)) expect(NUMS[n], `${k} {#${n}}`).toBeTruthy();
      expect(fillDvText(zh, 'zh'), k).not.toMatch(/\{#/); expect(CJK.test(fillDvText(e, 'en')), k).toBe(false);
      expect(zh + e, k).not.toMatch(/<\/?[a-z]|\\frac|\$/);
      expect((mk(e, 'en').match(/`/g) ?? []).length, k).toBe(0);
    }
  });
  it('answer text: unit and choice shown right', () => {
    expect(ansT(QQ.s7b!, 'en')).toBe('62.5%');
    expect(ansT(QQ.s11b!, 'en')).toBe('3.5 GB');
    expect(ansT(QQ.s11a!, 'en')).toBe('65,536');
    expect(ansT(QQ.k11a!, 'en')).toBe(QQ.k11a!.o![0]![1]);
  });
});

describe('R50 常见误解', () => {
  it('1–3 per stage, every stage has some; pages real; card-only list in ids matches', () => {
    for (let i = 0; i < DV_N; i++) { const n = MCS('D/' + dvK(i)).length; expect(n, 'D/' + dvK(i)).toBeGreaterThanOrEqual(1); expect(n, 'D/' + dvK(i)).toBeLessThanOrEqual(3); }
    expect(MC_PAGES.filter((p) => p.startsWith('D/')).length, 'only real stations').toBe(DV_N);
    for (const p of MC_PAGES) { if (!p.startsWith('D/')) expect(CARDS.has(p), p).toBe(true); expect(MCS(p).length, p).toBeLessThanOrEqual(3); }
    const only = MC_PAGES.filter((p) => !(p in VF_Q)).sort();
    expect(only).toEqual([...VF_MC_ONLY].sort());
    for (const p of [...MC_PAGES, ...Object.keys(VF_Q), ...Object.keys(DEMO)]) expect(hasVf(p), p).toBe(true);
  });
  it('the course’s own confusions are all covered', () => {
    const all = Object.values(MC_ALL).map((m) => m.x[1] + ' ' + m.r[1]).join('\n');
    for (const re of [/coordinate/i, /simultaneous|at the same time|together/i, /normal equation/i, /query|demand/i, /h · u_i|h·u_i/, /LoRA/, /frozen/i, /reinforcement|RL\b/, /entropy/i, /KL/]) expect(all).toMatch(re);
  });
});

describe('R50 demos use the shared numbers', () => {
  it('gradient descent = gd03 / gd11 (the KM10 example)', () => {
    expect(en('gd03')).toContain(gdSeq(0.3, 4).map((v) => fmt(v, 2)).join(', '));
    expect(en('gd11').replace(/−/g, '-')).toContain(gdSeq(1.1, 4).map((v) => fmt(v, 2)).join(', ').replace(/−/g, '-'));
    expect(gdKind(0.3)).toBe('ok'); expect(gdKind(0.05)).toBe('slow'); expect(gdKind(0.8)).toBe('osc'); expect(gdKind(1)).toBe('stuck'); expect(gdKind(1.1)).toBe('div');
    const h = demoOut('gd', DEMO0, 'en');
    expect(h).toContain('w = 0.00, 1.20, 1.68, 1.87, 1.95'); expect(h).toContain('Glides in');
    expect(demoOut('gd', { ...DEMO0, eta: 1.1 }, 'zh')).toContain('发散');
  });
  it('softmax with temperature = t1 / t05 / t2 (scores tS)', () => {
    expect(en('tS')).toBe(D_SM.map((v) => fmt(v, 1)).join(' / '));
    const pc = (T: number) => softmax(D_SM, T).map((v) => 100 * v);
    const near = (key: 't1' | 't05' | 't2', T: number) => { const want = en(key).match(/[\d.]+(?=%)/g)!.map(Number); pc(T).forEach((v, i) => expect(Math.abs(v - want[i]!), `${key}[${i}]`).toBeLessThan(0.6)); };
    near('t1', 1); near('t05', 0.5); near('t2', 2);
    const h = demoOut('sm', DEMO0, 'en'); expect(h).toContain('90.4%'); expect(CJK.test(h)).toBe(false);
  });
  it('attention scaling = attW (d_k = 64) / attSat (no scaling)', () => {
    expect(D_DK[DEMO0.dk]).toBe(64);
    expect(en('attW')).toBe('[' + attW(D_ATT, 64).map((v) => v.toFixed(3)).join(', ') + ']');
    expect(en('attSat')).toBe('[' + attW(D_ATT, 1).map((v) => v.toFixed(4)).join(', ') + ']');
    expect(demoOut('att', DEMO0, 'en')).toContain('[2.00, 1.00, 0.00]');
    expect(demoOut('att', { ...DEMO0, dk: 0 }, 'en')).toContain('no scaling');
  });
  it('demo pages exist', () => { for (const p of Object.keys(DEMO)) expect(p.startsWith('D/') || CARDS.has(p), p).toBe(true); });
});

describe('R50 helpers', () => {
  beforeEach(() => localStorage.clear());
  it('parseNum reads what people type on a phone', () => {
    expect(parseNum('1.2')).toBe(1.2); expect(parseNum(' 1,234.5 ')).toBe(1234.5); expect(parseNum('−0.38')).toBe(-0.38); expect(parseNum('-4')).toBe(-4);
    expect(parseNum('１．２')).toBe(1.2); expect(parseNum('62.5%')).toBe(62.5); expect(parseNum('+3')).toBe(3); expect(parseNum('.5')).toBe(0.5);
    expect(parseNum('')).toBeNull(); expect(parseNum('abc')).toBeNull(); expect(parseNum('1.2.3')).toBeNull();
  });
  it('fmt: real minus, thousands, no −0', () => {
    expect(fmt(-0.38, 2)).toBe('−0.38'); expect(fmt(65536, 0)).toBe('65,536'); expect(fmt(-0.0001, 2)).toBe('0.00'); expect(fmt(4.4, 2)).toBe('4.40');
  });
  it('progress ticks: done / total per page and over all the stations', () => {
    const t = vfStages(DV_N); expect(t.s).toBe(0); expect(t.t).toBe(Object.keys(VF_Q).filter((p) => p.startsWith('D/')).reduce((s, p) => s + VF_Q[p]!.length, 0));
    vfAdd('s2a'); vfAdd('s2a'); vfAdd('s2c');
    expect(JSON.parse(localStorage.getItem(VF_KEY)!)).toEqual(['s2a', 's2c']);
    expect(vfStat('D/2')).toEqual({ s: 2, t: 3 }); expect(vfStat('KM10')).toEqual({ s: 2, t: 4 }); expect(vfStages(DV_N).s).toBe(2);
    localStorage.setItem(VF_KEY, '{bad'); expect(vfDone().size).toBe(0);
  });
});
