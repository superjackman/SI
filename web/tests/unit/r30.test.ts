/* R30: three.js scenes. Toy maths, the light mount3d lifecycle (lazy load, fallback, dispose), and that three.js never
   reaches the first-load code (only the scene modules under src/three3d import it, and labs import those dynamically). */
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attnRow, attnSay, AWORDS, descend, flips, LR0, LR_MAX, LR_MIN, nearest, pct, regime, valleySay, vecSay, VGROUP, VWORDS } from '../../src/m2/w3d';
import { autoOff, hasGL, mount3d, resetGLProbe, stats, why3d, type View } from '../../src/m2/s3d';
import type { Env } from '../../src/legacy/runtime';

describe('R30 toy maths', () => {
  it('R30c: three clumps of four words, and the nearest lists match what the fold text says', () => {
    expect(VGROUP).toHaveLength(3);
    for (let g = 0; g < 3; g++) expect(VWORDS.filter((w) => w[2] === g)).toHaveLength(4);
    const at = (zh: string) => VWORDS.findIndex((w) => w[0] === zh);
    expect(nearest(at('国王')).map((j) => VWORDS[j]![0])).toEqual(['王子', '公主', '女王']);
    expect(nearest(at('巴黎')).map((j) => VWORDS[j]![0])).toEqual(['法国', '东京', '日本']);
  });
  it('word vectors: nearest neighbours stay in the same meaning group', () => {
    for (let i = 0; i < VWORDS.length; i++) {
      const n = nearest(i, 2);
      expect(n).toHaveLength(2);
      for (const j of n) expect(VWORDS[j]![2], `${VWORDS[i]![1]} → ${VWORDS[j]![1]}`).toBe(VWORDS[i]![2]);
    }
  });
  it('attention rows: sum to 1, never look ahead, percentages add to about 100', () => {
    for (let i = 0; i < AWORDS.length; i++) {
      const r = attnRow(i);
      expect(r.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
      for (let j = i + 1; j < r.length; j++) expect(r[j]).toBe(0);
      expect(Math.abs(r.map(pct).reduce((a, b) => a + b, 0) - 100)).toBeLessThanOrEqual(2);
    }
    expect(attnRow(0)[0]).toBe(1);
  });
  it('valley: the numbers the text promises (0.1 → 60, 0.3 → 19, 0.5 zigzag 11, 0.78 zigzag 66, 0.02 slow 80)', () => {
    const c = (eta: number) => ({ r: regime(eta), n: descend(eta).length - 1, f: flips(descend(eta)) });
    expect(c(0.1)).toEqual({ r: 'smooth', n: 60, f: 0 });
    expect(c(0.3)).toEqual({ r: 'smooth', n: 19, f: 0 });
    expect(c(0.5)).toEqual({ r: 'zigzag', n: 11, f: 11 });
    expect(c(0.78)).toEqual({ r: 'zigzag', n: 66, f: 66 });
    expect(c(0.02)).toEqual({ r: 'slow', n: 80, f: 0 });
    expect([LR_MIN, LR0, LR_MAX]).toEqual([0.02, 0.1, 0.78]);
    for (let e = LR_MIN; e <= LR_MAX + 1e-9; e += 0.02) for (const p of descend(e)) expect(Number.isFinite(p[0] + p[1])).toBe(true);
  });
});

type IOcb = (es: { isIntersecting: boolean }[]) => void;
function fakeEnv() {
  const ios: IOcb[] = [], disp: (() => void)[] = [];
  class IO { constructor(cb: IOcb) { ios.push(cb); } observe() {} disconnect() {} }
  const env = { document, window, IntersectionObserver: IO as unknown as typeof IntersectionObserver, onDispose: (f: () => void) => disp.push(f) } as unknown as Env;
  return { env, see: (v: boolean) => ios.forEach((f) => f([{ isIntersecting: v }])), leave: () => disp.forEach((f) => f()) };
}
const flush = () => new Promise((r) => setTimeout(r, 0));
const glOK = () => vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => ({ getExtension: () => null })) as never);
const glNo = () => vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => null) as never);
const motion = (on: boolean) => { window.matchMedia = ((q: string) => ({ matches: on && q.includes('reduce'), media: q })) as never; };

describe('R30 mount3d lifecycle', () => {
  beforeEach(() => { resetGLProbe(); delete (window as unknown as { __si3d?: unknown }).__si3d; motion(false); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('no WebGL → 2D fallback, the scene module is never requested', () => {
    glNo(); expect(hasGL()).toBe(false); expect(why3d()).toBe('nogl');
    const box = document.createElement('div'), load = vi.fn(), { env, see } = fakeEnv();
    mount3d(env, box, load, {}); see(true);
    expect(box.dataset.s3d).toBe('fallback'); expect(box.dataset.why).toBe('nogl'); expect(load).not.toHaveBeenCalled();
    expect(stats().loads).toBe(0);
  });
  it('reduced motion → 2D fallback even with WebGL', () => {
    glOK(); motion(true); expect(why3d()).toBe('motion');
    const box = document.createElement('div'), load = vi.fn(), { env, see } = fakeEnv();
    mount3d(env, box, load, {}); see(true);
    expect(box.dataset.s3d).toBe('fallback'); expect(box.dataset.why).toBe('motion'); expect(load).not.toHaveBeenCalled();
  });
  it('lazy: nothing loads until the box is on screen; leaving the screen and leaving the stop free the view', async () => {
    glOK();
    const dispose = vi.fn(), update = vi.fn();
    const load = vi.fn(async () => ({ make: (): View => ({ update, dispose }) }));
    const box = document.createElement('div'), { env, see, leave } = fakeEnv();
    const h = mount3d(env, box, load, {});
    expect(box.dataset.s3d).toBe('idle'); expect(load).not.toHaveBeenCalled();
    see(true); expect(box.dataset.s3d).toBe('loading'); await flush();
    expect(box.dataset.s3d).toBe('on'); expect(h.on()).toBe(true); expect(box.classList.contains('s3d-on')).toBe(true);
    h.refresh(); expect(update).toHaveBeenCalledTimes(1);
    see(false); expect(dispose).toHaveBeenCalledTimes(1); expect(box.dataset.s3d).toBe('off'); expect(stats()).toMatchObject({ made: 1, freed: 1, live: 0 });
    see(true); await flush(); expect(stats()).toMatchObject({ made: 2, live: 1 });
    leave(); expect(dispose).toHaveBeenCalledTimes(2); expect(stats()).toMatchObject({ made: 2, freed: 2, live: 0 });
    see(true); await flush(); expect(stats().live).toBe(0);
  });
  it('hidden page stops and frees; a load that finishes after leaving makes nothing', async () => {
    glOK();
    let done: (m: { make: () => View }) => void = () => {};
    const dispose = vi.fn(), load = vi.fn(() => new Promise<{ make: () => View }>((r) => { done = r; }));
    const box = document.createElement('div'), { env, see, leave } = fakeEnv();
    mount3d(env, box, load, {}); see(true); leave();
    done({ make: () => ({ update() {}, dispose }) }); await flush();
    expect(stats()).toMatchObject({ made: 0, live: 0 });
    const box2 = document.createElement('div'), f2 = fakeEnv();
    const load2 = vi.fn(async () => ({ make: (): View => ({ update() {}, dispose }) }));
    mount3d(f2.env, box2, load2, {}); f2.see(true); await flush(); expect(stats().live).toBe(1);
    const vs = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(dispose).toHaveBeenCalledTimes(1); expect(box2.dataset.s3d).toBe('off'); expect(stats().live).toBe(0);
    vs.mockRestore(); f2.leave();
  });
  it('a failed chunk load keeps the 2D figure', async () => {
    glOK(); vi.spyOn(console, 'error').mockImplementation(() => {});
    const box = document.createElement('div'), { env, see } = fakeEnv();
    mount3d(env, box, () => Promise.reject(new Error('offline')) as Promise<{ make: () => View }>, {}); see(true); await flush();
    expect(box.dataset.s3d).toBe('fallback'); expect(box.dataset.why).toBe('error');
  });
});

describe('R30 power: one scene at a time, render on demand, spin turns itself off', () => {
  beforeEach(() => { resetGLProbe(); delete (window as unknown as { __si3d?: unknown }).__si3d; motion(false); });
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

  it('starting a second scene frees the first (it shows its 2D figure, state off)', async () => {
    glOK();
    const d1 = vi.fn(), d2 = vi.fn();
    const a = fakeEnv(), b = fakeEnv(), boxA = document.createElement('div'), boxB = document.createElement('div');
    mount3d(a.env, boxA, async () => ({ make: (): View => ({ update() {}, dispose: d1 }) }), {});
    mount3d(b.env, boxB, async () => ({ make: (): View => ({ update() {}, dispose: d2 }) }), {});
    a.see(true); await flush(); expect(boxA.dataset.s3d).toBe('on');
    b.see(true); await flush();
    expect(boxB.dataset.s3d).toBe('on'); expect(boxA.dataset.s3d).toBe('off'); expect(d1).toHaveBeenCalledTimes(1);
    expect(stats()).toMatchObject({ made: 2, freed: 1, live: 1 });
    a.leave(); b.leave(); expect(stats().live).toBe(0);
  });
  it('a spin switch turns itself off after the time limit and says so once; turning it on again re-arms it', () => {
    vi.useFakeTimers();
    const i = document.createElement('input'); i.type = 'checkbox'; i.checked = true;
    const then = vi.fn(); const stop = autoOff(i, 20_000, then);
    vi.advanceTimersByTime(19_999); expect(i.checked).toBe(true);
    vi.advanceTimersByTime(1); expect(i.checked).toBe(false); expect(then).toHaveBeenCalledTimes(1);
    i.checked = true; i.dispatchEvent(new Event('change')); vi.advanceTimersByTime(20_000); expect(i.checked).toBe(false); expect(then).toHaveBeenCalledTimes(2);
    i.checked = true; i.dispatchEvent(new Event('change')); stop(); vi.advanceTimersByTime(30_000); expect(i.checked).toBe(true);
  });
  it('the stage draws one frame per change and nothing while still; an animation runs at most 30 frames a second', async () => {
    vi.resetModules();
    vi.doMock('three', () => {
      class O { position = { set() {}, copy() { return this; }, addScaledVector() { return this; } }; rotation = { y: 0 }; add() {} traverse() {} clear() {} lookAt() {} updateProjectionMatrix() {} updateMatrixWorld() {} }
      class R { domElement = null; renderLists = { dispose() {} }; setPixelRatio() {} setClearColor() {} setSize() {} render = vi.fn(); dispose() {} forceContextLoss() {} }
      class V { copy() { return this; } sub() { return this; } length() { return 5; } normalize() { return this; } addScaledVector() { return this; } }
      return {
        AmbientLight: O, DirectionalLight: O, HemisphereLight: O, Group: O, Mesh: O, MeshBasicMaterial: O, PlaneGeometry: O, SphereGeometry: O,
        PerspectiveCamera: O, Scene: O, CanvasTexture: O, DoubleSide: 2, Vector3: V, WebGLRenderer: R, SRGBColorSpace: '',
      };
    });
    const core = await import('../../src/three3d/core');
    (window as unknown as { __si3d: { frames: number } }).__si3d = { frames: 0 } as never;
    const q: FrameRequestCallback[] = []; let now = 0;
    const tick = (n: number) => { for (let k = 0; k < n; k++) { now += 1000 / 60; const fs = q.splice(0); fs.forEach((f) => f(now)); } };
    let spin = false;
    const st = core.stage(document.createElement('div'), { raf: (f) => { q.push(f); return q.length; }, caf: () => { q.length = 0; }, cam: [0, 0, 5], busy: () => spin });
    const frames = () => (window as unknown as { __si3d: { frames: number } }).__si3d.frames;
    tick(60); expect(frames()).toBe(1); expect(q).toHaveLength(0);          // first paint, then still
    st.draw(); st.draw(); tick(60); expect(frames()).toBe(2);              // a change → exactly one more frame
    spin = true; st.draw(); tick(60); const f1 = frames();
    expect(f1 - 2).toBeGreaterThanOrEqual(25); expect(f1 - 2).toBeLessThanOrEqual(31); // ~30 in one second of 60 Hz
    spin = false; tick(60); expect(frames() - f1).toBeLessThanOrEqual(1); expect(q).toHaveLength(0);
    expect(core.MIN_DT).toBeGreaterThan(1000 / 32); expect(core.MIN_DT).toBeLessThan(1000 / 30);
    st.dispose(); vi.doUnmock('three');
  });
});

describe('R30 three.js stays out of the first load', () => {
  const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [path.join(d, e.name)] : []));
  /* R34: the 3D site's scenes and experiments (src/w3/sc, src/w3/lab) are lazy three.js trees too, like src/three3d */
  const T3 = [`${path.sep}three3d${path.sep}`, `${path.sep}w3${path.sep}sc${path.sep}`, `${path.sep}w3${path.sep}lab${path.sep}`];
  it("only the three.js trees (src/three3d, src/w3/sc, src/w3/lab) import 'three'; everyone else reaches them by dynamic import or type-only import", () => {
    for (const f of walk('src')) {
      const s = fs.readFileSync(f, 'utf8');
      if (T3.some((d) => f.includes(d))) continue;
      expect(s, f).not.toMatch(/from ['"]three(\/[^'"]*)?['"]/);
      for (const m of s.matchAll(/^import\s+(type\s+)?[^;]*?from\s+['"]([^'"]*(?:three3d|\/sc\/|\.\/sc\b|\/lab\/|\.\/lab\b)[^'"]*)['"]/gm)) expect(m[1], `${f}: ${m[2]}`).toBeTruthy();
    }
  });
  it('the build puts three into its own chunk', () => {
    expect(fs.readFileSync('vite.config.ts', 'utf8')).toMatch(/three/);
  });
});

/* R30b: each 3D stop opens with a one-screen stage card: stage, one short sentence (+ at most one control), and a
   "Want to know why" fold that is closed by default. */
describe('R30b one-screen stage cards', () => {
  const gen = (S: string, L: string) => (JSON.parse(fs.readFileSync(`src/legacy/gen/st/${S}.${L}.json`, 'utf8')) as { html: string }).html;
  const plain = (h: string) => h.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, '');
  const CARDS = { T3: ['lab3dVec', 'v3Say'], T4a: ['lab3dAttn', 'a3Say'], T7: ['lab3dValley', 'vlSay'] } as const;
  for (const L of ['zh', 'en'] as const) for (const [S, [id, say]] of Object.entries(CARDS)) {
    it(`${S}.${L}: the stage card comes before every other card, has no visible title, and its fold is closed`, () => {
      const h = gen(S, L), i = h.indexOf(`id="${id}"`);
      expect(i).toBeGreaterThan(0);
      expect(h.indexOf('<div class="card'), 'first card').toBe(h.lastIndexOf('<div', i));
      const card = h.slice(h.lastIndexOf('<div', i), h.indexOf('<!--/m2x-->', i));
      expect(card).toMatch(/<details class="s3c-why">/); expect(card).not.toMatch(/<details[^>]*\bopen\b/);
      expect(card).not.toMatch(/class="[^"]*\b(tag|s3d-sw)\b/);
      expect(card).toMatch(/<h3 class="s3c-t">/);
      expect((card.match(/<(input|button)\b/g) ?? []).length, 'controls under the stage').toBeLessThanOrEqual(S === 'T7' ? 3 : 0); // T7: the rate slider, Play and Reset (R30c: all three in one row under the stage)
      expect(card).toContain(`id="${say}"`);
    });
  }
  it('every sentence under the stage is short: ≤30 Chinese characters (zh), ≤110 letters (en)', () => {
    const all: [string, string][] = [];
    for (const L of ['zh', 'en'] as const) {
      for (let i = 0; i < VWORDS.length; i++) all.push([L, vecSay(i, L)]);
      for (let i = 0; i < AWORDS.length; i++) all.push([L, attnSay(i, L)]);
      for (let e = LR_MIN; e <= LR_MAX + 1e-9; e += 0.02) all.push([L, valleySay(e, L)]);
    }
    for (const [L, s] of all) expect([...plain(s)].length, s).toBeLessThanOrEqual(L === 'zh' ? 30 : 110);
  });
});
