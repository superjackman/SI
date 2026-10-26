/* R31d: the principles-line 3D stage cards (N, T4, T4b, T5, T2, K2, K3, T6 at the top of their stop; T3's "next word"
   after its first card). Toy numbers, the one-screen card shape, short sentences, lazy scene modules that only use the
   shared three.js classes, and nothing about VPNs. */
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as W from '../../src/m2/w3d3';
import { S3D_IDS3, S3D_TOP3 } from '../../m2/content/ext/m15';

const gen = (S: string, L: string) => (JSON.parse(fs.readFileSync(`src/legacy/gen/st/${S}.${L}.json`, 'utf8')) as { html: string }).html;
const plain = (h: string) => h.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, '');
const SC = [['N', 'lab3dNet', 'nnSay', 'nn', 'N.w'], ['T4', 'lab3dBlk', 'bkSay', 'blk', 'T4.w'], ['T4b', 'lab3dScore', 'scSay', 'score', 'T4b.w'], ['T5', 'lab3dMoe', 'moSay', 'moe', 'T5.w'],
  ['T2', 'lab3dLoop', 'lpSay', 'loop', 'T2.w'], ['K2', 'lab3dGrid', 'grSay', 'grid', 'K2.w'], ['K3', 'lab3dDice', 'dcSay', 'dice', 'K3.w'], ['T6', 'lab3dPatch', 'ptSay', 'patch', 'T6.w'],
  ['T3', 'lab3dNext', 'nxSay', 'next', 'T3.v']] as const;

describe('R31d toy numbers', () => {
  it('N: a bigger weight never gives a smaller output', () => {
    for (let w = W.NN_WMIN; w < W.NN_WMAX; w += 0.1) expect(W.nnOut(w + 0.1)).toBeGreaterThan(W.nnOut(w));
  });
  it('T4b: the best word is the one with the top score', () => {
    expect(W.bestScore()[2]).toBe(Math.max(...W.SCORE.map((s) => s[2])));
  });
  it('T5: each word visits exactly 2 different experts out of 8', () => {
    for (const [, , [a, b]] of W.MOE_TOK) { expect(a).not.toBe(b); for (const x of [a, b]) { expect(x).toBeGreaterThanOrEqual(1); expect(x).toBeLessThanOrEqual(W.MOE_N); } }
  });
  it('K2: the matrix is a turn times a 1.3 stretch (its determinant is 1.3²)', () => {
    for (let d = W.ANG_MIN; d <= W.ANG_MAX; d += 5) { const [a, b, c, e] = W.matOf(d); expect(a * e - b * c).toBeCloseTo(W.MAT_S ** 2, 9); }
  });
  it('K3: the dice are the same every time, the counts add up, and a lot of rolls look like the 1-2-3-4-5-6-5-4-3-2-1 hill', () => {
    expect(W.dice(50)).toEqual(W.dice(50));
    for (const n of [0, 10, 200]) expect(W.sumCounts(n).reduce((a, b) => a + b, 0)).toBe(n);
    for (const [a, b] of W.dice(200)) for (const x of [a, b]) { expect(x).toBeGreaterThanOrEqual(1); expect(x).toBeLessThanOrEqual(6); }
    const c = W.sumCounts(W.ROLL_MAX); expect(c[5]! + c[4]! + c[6]!).toBeGreaterThan(c[0]! + c[1]! + c[9]! + c[10]!);
    expect(W.WAYS.reduce((a, b) => a + b, 0)).toBe(36);
  });
  it('T3: chances add up to 1; less randomness makes the top word stronger, more makes them closer', () => {
    for (let t = W.TEMP_MIN; t <= W.TEMP_MAX + 1e-9; t += 0.1) expect(W.nextP(t).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
    expect(W.nextP(0.2)[0]!).toBeGreaterThan(W.nextP(1)[0]!); expect(W.nextP(2)[0]!).toBeLessThan(W.nextP(1)[0]!);
    W.nextP(1).forEach((p, i) => expect(p).toBeCloseTo(W.NEXT[i]![2] / W.NEXT.reduce((a, b) => a + b[2], 0), 9));
  });
  it('every sentence under the stage is short: ≤30 Chinese characters (zh), ≤60 letters (en)', () => {
    const all: [string, string][] = [];
    for (const L of ['zh', 'en'] as const) {
      for (let w = W.NN_WMIN; w <= W.NN_WMAX; w += 0.1) all.push([L, W.nnSay(w, L)]);
      for (let k = -1; k < W.BLK.length; k++) all.push([L, W.blkSay(k, L)]);
      for (const b of [true, false]) all.push([L, W.scoreSay(b, L)]);
      for (let i = -1; i < W.MOE_TOK.length; i++) all.push([L, W.moeSay(i, L)]);
      for (let k = -1; k < W.LOOP.length; k++) all.push([L, W.loopSay(k, L)]);
      for (let d = W.ANG_MIN; d <= W.ANG_MAX; d += 5) all.push([L, W.matSay(d, L)]);
      for (let n = 0; n <= W.ROLL_MAX; n += W.ROLL_STEP) all.push([L, W.diceSay(n, L)]);
      for (const g of W.PATCH) all.push([L, W.patchSay(g, L)]);
      for (let t = W.TEMP_MIN; t <= W.TEMP_MAX + 1e-9; t += 0.1) all.push([L, W.nextSay(t, L)]);
    }
    for (const [L, s] of all) expect([...plain(s)].length, s).toBeLessThanOrEqual(L === 'zh' ? 30 : 60);
  });
});

describe('R31d one-screen stage cards', () => {
  it('every scene is listed; all but T3 next go to the top of their stop', () => {
    expect(Object.keys(S3D_IDS3).sort()).toEqual(SC.map((s) => s[0]).sort());
    for (const [S, id] of SC) { expect(S3D_IDS3[S]).toEqual([id]); expect(S3D_TOP3[S]).toBe(S === 'T3' ? undefined : id); }
  });
  for (const L of ['zh', 'en'] as const) for (const [S, id, say] of SC) {
    it(`${S}.${L}: ${S === 'T3' ? 'after the first card' : 'stage card first'}, one sentence, at most one control, fold closed, no VPN`, () => {
      const h = gen(S, L), i = h.indexOf(`id="${id}"`);
      expect(i).toBeGreaterThan(0);
      const at = h.lastIndexOf('<div', i);
      if (S === 'T3') expect(at).toBeGreaterThan(h.indexOf('id="c_T3_0"'));
      else expect(h.indexOf('<div class="card'), 'first card').toBe(at);
      const card = h.slice(at, h.indexOf('<!--/m2x-->', i)), top = card.slice(0, card.indexOf('<details'));
      expect(card).toMatch(/<details class="s3c-why">/); expect(card).not.toMatch(/<details[^>]*\bopen\b/);
      expect(card).toContain(L === 'zh' ? '想知道为什么' : 'Want to know why');
      expect(top).toContain(`id="${say}"`);
      expect((top.match(/class="s3c-ctl\b/g) ?? []).length).toBeLessThanOrEqual(1);
      expect((top.match(/<(input|button|select)\b/g) ?? []).length).toBe(1);
      expect(top).toMatch(/viewBox="0 0 320 300"/);
      expect(card).not.toMatch(/VPN|科学上网|翻墙|代理|海外账号/);
    });
  }
});

describe('R31d scenes load lazily and stay small', () => {
  it('each lab reaches its scene module only by dynamic import', () => {
    for (const [S, , , m, f] of SC) {
      const s = fs.readFileSync(`src/m2/labs/${f}.ts`, 'utf8');
      expect(s, S).toContain(`import('../../three3d/${m}')`);
      expect(s, S).not.toMatch(/^import\s+(?!type)[^;]*three3d/m);
    }
  });
  it('the scene modules only use three.js classes already in the shared chunk', () => {
    const OK = new Set('AdditiveBlending BufferGeometry CanvasTexture CatmullRomCurve3 Color ConeGeometry CubicBezierCurve3 CylinderGeometry DoubleSide Float32BufferAttribute Group Mesh MeshBasicMaterial MeshStandardMaterial PlaneGeometry Quaternion RingGeometry RoundedBoxGeometry SphereGeometry TorusGeometry TubeGeometry Vector3'.split(' '));
    for (const [, , , m] of SC) {
      const s = fs.readFileSync(`src/three3d/${m}.ts`, 'utf8');
      for (const x of s.matchAll(/import\s+(type\s+)?\{([^}]*)\}\s+from\s+['"](three[^'"]*)['"]/g)) {
        if (x[1]) continue;
        for (const n of x[2]!.split(',').map((v) => v.trim()).filter(Boolean)) if (!n.startsWith('type ')) expect(OK.has(n), `${m}: ${n}`).toBe(true);
      }
      expect(s, m).toMatch(/dispose/);
    }
  });
});
