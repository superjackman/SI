import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { layout, type Rect } from '../../src/l4/layout';
import { NODES, NODE_K, K_MATH, LAB, LAB_S, PLUS } from '../../src/l4/txt';
import { parse, hashOf, ORDER, X_ORDER, page, dot, pickHead, pickKey, MY_DEFAULT, validX, type Ctx } from '../../src/l4/pages';
import { CFG, Model, buildDict, examples, forward, splitQA } from '../../src/l4/tf/model';

/* R38: the system explorer (src/l4) — layout geometry, routing, the five-part cards and the real numbers it shows */
const inside = (r: Rect, W: number, H: number) => r.x >= 0 && r.y >= 0 && r.x + r.w <= W && r.y + r.h <= H;
const hit = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('R38 explorer layout', () => {
  for (const W of [360, 390, 430]) for (const H of [330, 380, 460, 560, 700]) for (const mode of ['full', 'left', 'xl'] as const) {
    it(`${W}×${H} ${mode}: boxes in bounds, no overlaps, panel clear of the diagram`, () => {
      const L = layout(W, H, mode);
      for (const n of NODES) expect(inside(L.box[n], W, H), n).toBe(true);
      for (let i = 0; i < NODES.length; i++) for (let j = i + 1; j < NODES.length; j++) expect(hit(L.box[NODES[i]!], L.box[NODES[j]!]), `${NODES[i]} × ${NODES[j]}`).toBe(false);
      expect(inside(L.frame, W, H)).toBe(true);
      for (const n of ['att', 'an1', 'ffn', 'an2'] as const) { const b = L.box[n], f = L.frame; expect(b.y >= f.y && b.y + b.h <= f.y + f.h && b.x >= f.x && b.x + b.w <= f.x + f.w, n).toBe(true); }
      expect(L.bh).toBeGreaterThanOrEqual(18);
      if (mode === 'full') expect(L.panel).toBeNull();
      else { const P = L.panel!; expect(inside(P, W, H)).toBe(true); expect(P.w).toBeGreaterThanOrEqual(170); expect(P.x).toBeGreaterThanOrEqual(L.frame.x + L.frame.w); }
    });
  }
  it('bottom to top in the standard order: input → tokens → embed → [attention → add&norm → FFN → add&norm] → linear → softmax → output', () => {
    expect(NODES.join(' ')).toBe('in tok emb att an1 ffn an2 lin sm out');
    const L = layout(390, 460, 'full'); for (let i = 1; i < NODES.length; i++) expect(L.box[NODES[i]!].y).toBeLessThan(L.box[NODES[i - 1]!].y);
    expect(L.res.length).toBe(2);
  });
  it('every box has a zh and an en name; short names are shorter', () => {
    for (const n of NODES) { expect(LAB[n][0] && LAB[n][1]).toBeTruthy(); const s = LAB_S[n]; if (s) { expect(Array.from(s[0]).length).toBeLessThanOrEqual(Array.from(LAB[n][0]).length); expect(s[1].length).toBeLessThanOrEqual(LAB[n][1].length); } }
    expect(PLUS.has('in') || PLUS.has('out')).toBe(false);
  });
});

describe('R38 explorer routing', () => {
  it('parses and rebuilds every page hash', () => {
    for (const id of [...ORDER, ...X_ORDER.map((p) => 'X:' + p), 'home', 'L1', 'L5']) expect(parse(hashOf(id)).id).toBe(id);
    expect(parse('#L4/x/att.dot.one~KM02')).toEqual({ id: 'X:att.dot.one', card: 'KM02' });
    expect(parse('#L4~K06.2')).toEqual({ id: 'L4', card: 'K06.2' });
    expect(parse('')).toEqual({ id: 'home', card: null });
    expect(validX('att.dot')).toBe(true); expect(validX('nope')).toBe(false);
  });
  it('builds every page with and without data, with no undefined/NaN in its text', () => {
    const ctx = (l: 'zh' | 'en'): Ctx => ({ l, d: null, u: null, a: null, my: { lines: MY_DEFAULT, prog: null, running: false, paused: false, ans: null, q: '', err: '', ready: false } });
    for (const l of ['zh', 'en'] as const) for (const id of [...ORDER, ...X_ORDER.map((p) => 'X:' + p)]) {
      const p = page(id, ctx(l)); const s = JSON.stringify(p);
      expect(s, id).not.toMatch(/undefined|NaN/); expect(p.info.length, id).toBe(4);
    }
  });
});

describe('R38 knowledge cards', () => {
  const zh = JSON.parse(fs.readFileSync('src/l4/c/k-zh.json', 'utf8')), en = JSON.parse(fs.readFileSync('src/l4/c/k-en.json', 'utf8'));
  it('zh and en have the same cards, each with five parts', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort());
    for (const c of [zh, en]) for (const [k, v] of Object.entries<{ n: string; s: string[] }>(c)) { expect(v.n, k).toBeTruthy(); expect(v.s.length, k).toBe(5); for (const s of v.s) expect(s.trim().length, k).toBeGreaterThan(10); }
  });
  it('every box card and every 看数学 target exists', () => {
    for (const k of [...Object.values(NODE_K), ...Object.keys(K_MATH), ...Object.values(K_MATH)]) expect(zh[k], k).toBeTruthy();
  });
  it('the demo facts in the cards match the model: ？ is the query token, 8 tokens, √8, 16 × 14', () => {
    const t = JSON.stringify(zh);
    expect(t).not.toMatch(/7 ?× ?7/); expect(t).toMatch(/√8|√ ?8/); expect(t).toMatch(/16 ?× ?14/);
    expect(CFG.d / CFG.H).toBe(8);
  });
});

describe('R38 real numbers', () => {
  it('Q·K one number: the products sum ÷ √8 equals the score cell of the grid', () => {
    const LINES = ['天空是什么颜色？→蓝', '草是什么颜色？→绿', '火是什么颜色？→红'];
    const D = buildDict(LINES), ex = examples(D, LINES)[0]!, M = new Model(CFG, D.chars.length);
    const tr = forward(M, ex.ids, ex.tgt, ex.mask), qi = 7, hh = pickHead(tr, qi), kj = pickKey(tr, hh, qi);
    expect(kj).toBeLessThan(qi);
    const r = dot(tr, hh, qi, kj); expect(r.pr.length).toBe(8);
    expect(r.pr.reduce((a, x) => a + x[2], 0)).toBeCloseTo(r.sum, 6);
    expect(r.score).toBeCloseTo(tr.layers[0]!.S[hh]![qi * tr.T + kj]!, 5);
  });
  it('my-training lines: the defaults are valid and fit the context', () => {
    for (const s of MY_DEFAULT) { const qa = splitQA(s)!; expect(qa).toBeTruthy(); expect(Array.from(qa.q + qa.a).length + 1).toBeLessThanOrEqual(CFG.ctx + 1); }
  });
});
