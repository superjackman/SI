import { describe, it, expect } from 'vitest';
import { CFG, Model, buildDict, examples, forward, backward, trainAll, answer, pack, unpack, boxOf, splitQA } from '../../src/l4/tf/model';

const LINES = ['天空是什么颜色？→蓝', '草是什么颜色？→绿', '火是什么颜色？→红'];

describe('R38 hand-written Transformer', () => {
  it('builds the dictionary in reading order, with the end mark first', () => {
    const D = buildDict(LINES);
    expect(D.chars.slice(0, 9).join('')).toBe('⏎天空是什么颜色？');
    expect(D.ix['蓝']).toBe(9);
    expect(splitQA('草地是什么颜色 → 绿')).toEqual({ q: '草地是什么颜色？', a: '绿' });
  });
  it('masks the loss to the answer and the end mark', () => {
    const D = buildDict(LINES); const [e] = examples(D, LINES);
    expect(e!.ids.length).toBe(9); // 天空是什么颜色？蓝
    expect(e!.mask.reduce((a, b) => a + b, 0)).toBe(2); // ？->蓝, 蓝->end
  });
  it('analytic gradients match finite differences (float64)', () => {
    const D = buildDict(LINES); const ex = examples(D, LINES)[0]!;
    const M = new Model({ ...CFG, f64: true, seed: 3 }, D.chars.length);
    const loss = () => forward(M, ex.ids, ex.tgt, ex.mask).loss!;
    backward(M, forward(M, ex.ids, ex.tgt, ex.mask));
    const r = (k: number) => (k * 2654435761) % 1000 / 1000;
    let worst = 0, n = 0;
    for (const p of M.ps) {
      for (let s = 0; s < 3; s++) {
        const i = Math.floor(r(n + s * 7 + p.w.length) * p.w.length); const h = 1e-5, w0 = p.w[i]!;
        p.w[i] = w0 + h; const a = loss(); p.w[i] = w0 - h; const b = loss(); p.w[i] = w0;
        const num = (a - b) / (2 * h), ana = p.g[i]!;
        const rel = Math.abs(num - ana) / Math.max(1e-6, Math.abs(num) + Math.abs(ana));
        if (Math.abs(num - ana) > 1e-7) worst = Math.max(worst, rel); n++;
      }
    }
    expect(n).toBeGreaterThan(80);
    expect(worst).toBeLessThan(1e-4);
  });
  it('loss goes down and it answers the training questions; same seed gives the same numbers', () => {
    const D = buildDict(LINES); const ex = examples(D, LINES);
    const M = new Model(CFG, D.chars.length); const ls = trainAll(M, ex, 120);
    expect(ls[0]!).toBeGreaterThan(1.5);
    expect(ls[119]!).toBeLessThan(ls[0]! / 10);
    for (const [q, a] of [['天空是什么颜色', '蓝'], ['草是什么颜色？', '绿'], ['火是什么颜色？', '红']]) expect(answer(M, D, q!).out).toBe(a);
    const M2 = new Model(CFG, D.chars.length); trainAll(M2, ex, 120);
    expect(Array.from(pack(M2).subarray(0, 50))).toEqual(Array.from(pack(M).subarray(0, 50)));
    const M3 = new Model({ ...CFG, seed: 99 }, D.chars.length); unpack(M3, pack(M));
    expect(answer(M3, D, '火是什么颜色').out).toBe('红');
    expect(M.n * 4).toBeLessThan(40 * 1024);
  });
  it('maps every parameter to a box of the figure', () => {
    const M = new Model(CFG, 20); const s = new Set(M.ps.map((p) => boxOf(p.name)));
    expect([...s].sort()).toEqual(['an1', 'an2', 'att', 'emb', 'ffn', 'lin']);
    expect(boxOf('L1.ln2g')).toBe('an2'); expect(boxOf('L0.Wq')).toBe('att'); expect(boxOf('L0.b2')).toBe('ffn');
  });
});
