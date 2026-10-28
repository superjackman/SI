// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { QUIZ, LAYERS } from '../../src/px/quiz';
import { steps, retrieve, softmax, sample, sqrtD, bag, cosine } from '../../src/px/exp';
import { PATH, units, secs, LOOK, plan } from '../../src/px/qpath';
import { add, answers, week, streak, day, log } from '../../src/px/rec';
import { lxFrom } from '../../src/lx/ids';
import { lxPage } from '../../src/lx/view';
import { parse, page, MY_DEFAULT, Q, type Ctx } from '../../src/l4/pages';
import { handle, type Demo } from '../../src/l4/tf/core';
import type { Trace } from '../../src/l4/tf/model';
import { isCard, type Card } from '../../src/l4/c/kc';
import { cardData, whyOf } from '../../src/l4/share/card';

/* R40: 练 / 记 / 享 / 快速路径 — quiz data complete in zh and en and tied to real cards, experiment maths, the record,
   and the quick-path time computed from the real page and card text. */
const J = (f: string) => JSON.parse(fs.readFileSync(path.join(__dirname, '../../src/l4/c', f), 'utf8')) as Record<string, Card>;
const CARDS: Record<'zh' | 'en', Record<string, Card>> = { zh: { ...J('k-zh.json'), ...J('k1-zh.json'), ...J('k3-zh.json') }, en: { ...J('k-en.json'), ...J('k1-en.json'), ...J('k3-en.json') } };
const strip = (h: string) => { const d = document.createElement('div'); d.innerHTML = h; return (d.textContent || '').replace(/\s+/g, ' ').trim(); };

describe('R40 quiz', () => {
  it('four questions per layer, four options, zh and en, answers in range, ids unique', () => {
    const ids = new Set<string>();
    for (const n of LAYERS) { expect(QUIZ[n].length).toBe(4);
      for (const q of QUIZ[n]) { expect(ids.has(q.id)).toBe(false); ids.add(q.id); expect(q.o.length).toBe(4); expect(q.a).toBeGreaterThanOrEqual(0); expect(q.a).toBeLessThan(4);
        for (const t of [q.q, q.e, ...q.o]) { expect(t[0].trim()).toBeTruthy(); expect(t[1].trim()).toBeTruthy(); expect(/[\u4e00-\u9fff]/.test(t[0])).toBe(true); }
        expect(new Set(q.o.map((o) => o[0])).size).toBe(4); } }
  });
  it('each question points at a real card of its own layer that has a ⑤ "why"', () => {
    const pre: Record<number, RegExp> = { 1: /^KA/, 2: /^KB/, 3: /^KC/, 4: /^K\d/, 5: /^KM/ };
    for (const n of LAYERS) for (const q of QUIZ[n]) { expect(isCard(q.k)).toBe(true); expect(pre[n]!.test(q.k)).toBe(true);
      for (const l of ['zh', 'en'] as const) { const c = CARDS[l][q.k]!; expect(c).toBeTruthy(); expect(whyOf(c).length).toBeGreaterThan(10); } }
  });
  it('the right answers are not always in the same place', () => { const pos = LAYERS.flatMap((n) => QUIZ[n].map((q) => q.a)); expect(new Set(pos).size).toBe(4); });
});

describe('R40 experiments (computed)', () => {
  it('steps: p^n and check-and-redo, the simulation agrees', () => {
    const r = steps(0.9, 10, 4000, 3); expect(r.once).toBeCloseTo(0.9 ** 10, 12); expect(r.redo).toBeCloseTo(0.99 ** 10, 12);
    expect(Math.abs(r.simOnce / 4000 - r.once)).toBeLessThan(0.03); expect(Math.abs(r.simRedo / 4000 - r.redo)).toBeLessThan(0.03);
    expect(steps(0.95, 1).once).toBeCloseTo(0.95, 12);
  });
  it('retrieval: cosine of count vectors, best match first', () => {
    expect(cosine(bag('火车票'), bag('火车票'))).toBeCloseTo(1, 9); expect(cosine(bag('abc'), bag('猫'))).toBe(0);
    const r = retrieve('帮我订明天的高铁', ['我对花生过敏', '上次坐高铁选了靠窗', '每周三下午开会']); expect(r.top[0]).toBe(1);
    const e = retrieve('book a train', ['I am allergic to peanuts', 'Last train trip: window seat', 'Weekly meeting on Wednesday']); expect(e.top[0]).toBe(1);
  });
  it('softmax sums to 1, temperature sharpens or flattens; sampling counts add up', () => {
    const z = [2, 1, 0.1], p1 = softmax(z), p2 = softmax(z, 0.5), p3 = softmax(z, 2);
    for (const p of [p1, p2, p3]) expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(p2[0]!).toBeGreaterThan(p1[0]!); expect(p3[0]!).toBeLessThan(p1[0]!);
    const c = sample(p1, 100, 5); expect(c.reduce((a, b) => a + b, 0)).toBe(100); expect(sample(p1, 100, 5)).toEqual(c);
  });
  it('÷√d: raw spread grows like √d, scaled spread stays near 1, softmax stays less peaked', () => {
    const a = sqrtD(4), b = sqrtD(64);
    expect(b.sd / a.sd).toBeGreaterThan(3); expect(b.sd / a.sd).toBeLessThan(5);
    for (const r of [a, b]) { expect(r.sdS).toBeGreaterThan(0.8); expect(r.sdS).toBeLessThan(1.2); }
    expect(b.top).toBeGreaterThan(b.topS);
  });
});

describe('R40 record', () => {
  it('logs answers, counts right ones, a 7-day week and the streak', () => {
    localStorage.clear(); const now = new Date(2026, 9, 29, 12).getTime();
    add({ k: 'ans', t: now - 864e5, id: 'q1a', ok: false }); add({ k: 'ans', t: now, id: 'q1a', ok: true }); add({ k: 'ans', t: now, id: 'q1b', ok: true });
    expect(log().length).toBe(3); expect(answers()).toEqual({ n: 3, r: 2, uniq: 2, uniqR: 2 });
    const w = week(now); expect(w.length).toBe(7); expect(w[6]).toEqual([day(now), 2]); expect(w[5]![1]).toBe(1);
    expect(streak(now)).toBe(2);
  });
});

/* ---------- the quick path: the time comes from the real text ---------- */
async function ctx(l: 'zh' | 'en'): Promise<Ctx> {
  const d = handle({ op: 'demo' }, () => {}) as Demo, u = handle({ op: 'trace', which: 'demo', text: Q }, () => {}) as { chars: string[]; tr: Trace };
  const a = handle({ op: 'answer', which: 'demo', q: Q }, () => {}) as Ctx['a'];
  return { l, d, u, a, my: { lines: MY_DEFAULT, prog: null, running: false, paused: false, ans: null, q: '', err: '', ready: false } };
}
async function stopText(h: string, card: string | null, l: 'zh' | 'en') {
  const id = parse(h).id, lx = lxFrom(id); let t: string[];
  if (lx) { const p = await lxPage(lx, l); t = [strip(p.top), p.ttl, ...p.info, strip(p.panel), strip(p.chart ?? ''), p.hint]; }
  else { const p = page(id, await ctx(l)); t = [...p.info, strip(p.panel ?? ''), p.hint, ...p.tags.map((x) => strip(x.h)), ...(p.notes ?? [])]; }
  if (card) { const c = CARDS[l][card]!; t.push(c.n, ...c.s.slice(0, 4).map(strip), c.no); }
  return t.join(' ');
}
describe('R40 quick path', () => {
  it('the stored time matches the real text (regenerate with QGEN=1)', async () => {
    const out: Record<string, { units: number[]; sec: number[] }> = {};
    for (const l of ['zh', 'en'] as const) { const u: number[] = [], s: number[] = [];
      for (const [h, c] of PATH) { const n = units(await stopText(h, c, l), l); u.push(n); s.push(Math.round(secs(n, l) + LOOK)); }
      out[l] = { units: u, sec: s }; }
    const f = path.join(__dirname, '../../src/px/qtime.json');
    if (process.env.QGEN) fs.writeFileSync(f, JSON.stringify(out) + '\n');
    expect(JSON.parse(fs.readFileSync(f, 'utf8'))).toEqual(out);
   
  }, 60000);
  it('the plan fits about 10 minutes (7–11) in both languages', () => {
    for (const l of ['zh', 'en'] as const) { const p = plan(l); expect(p.sec.length).toBe(PATH.length); expect(p.total).toBeGreaterThan(420); expect(p.total).toBeLessThan(660); }
  });
  it('share card words: knowledge only, never a quiz question', () => {
    const qs = LAYERS.flatMap((n) => QUIZ[n].flatMap((q) => [q.q[0], q.q[1]]));
    for (const l of ['zh', 'en'] as const) for (const id of ['K06', 'KA04', 'KC11', 'KM12']) {
      const d = cardData(l, id, CARDS[l][id]!, 'https://x/', 'site'); const w = [d.head, d.name, d.idea, d.co, d.why, ...d.parts.map((p) => p.n + p.s)].join('\n');
      expect(d.name).toBe(CARDS[l][id]!.n); for (const q of qs) expect(w.includes(q)).toBe(false);
    }
  });
});
