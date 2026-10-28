/* R33 pilot v4: what the real 3D pilot scenes share. One stage (three3d/core) that takes every gesture itself and the v4
   look (p3/look: tone mapping, procedural env light, soft shadows, glass, glow). A drag turns a damped orbit camera inside
   limits, pinch or the wheel zooms it, a tap picks the thing under the finger (a ray first, then the nearest pick point
   within 70 px; its label is a real button too) and the camera flies to it; a scene may claim a drag (the dot handle).
   One glass bubble is pinned above the chosen thing (real HTML text: crisp, >= 14 px, read by screen readers).
   Render on demand (at most 30 frames a second, only while something moves); dispose frees everything. */
import { Raycaster, Vector2, Vector3, type Group, type Object3D } from 'three';
import { stage, type Stage, type Tag } from '../core';
import { rig } from '../kit';
import { fly, type Lim } from './cam';
import { look, freeGlow, type Look } from './look';
import type { L } from '../../pilot3d/text';

export interface SApi {
  lang: L; raf: (f: FrameRequestCallback) => number; caf: (id: number) => void;
  /** a thing was tapped (-1: empty space) */
  pick(i: number): void;
  /** a sideways swipe: +1 = next page, -1 = previous (v4: unused, the drag orbits) */
  swipe(d: number): void;
  /** the dot product page reports its numbers after each drag step */
  dot?(ax: number, az: number, bx: number, by: number): void;
}
export interface P3 {
  dispose(): void;
  /** fly to thing i (null: the overview) */
  focus(i: number | null, now?: boolean): void;
  /** show the glass bubble above the focused thing (null hides it); returns its element */
  bubble(html: string | null): HTMLElement | null;
  /** test / debug handle: where on the canvas a tap picks thing i */
  where(i: number): [number, number];
  /** R33 v3: hand the scene a value from the shell (the dot page's length slider) */
  input(v: number): void;
  /** v4 test / debug handle: the orbit now (azimuth, elevation, zoom) */
  orbit(): [number, number, number];
  /** R35: where a point of the scene lands on the canvas (CSS px) and whether it is in front of the camera */
  proj(p: Vector3): [number, number, boolean];
  /** R35: a named point to pin a callout to: the scene's own marks, else t<i> (thing i's label point) or a<i> (its pick point) */
  mark(name: string): Vector3 | null;
  /** R35: run f after every frame (null stops it); redraw asks for one frame */
  onDraw(f: (() => void) | null): void;
  redraw(): void;
}
export interface Spec {
  cam: { look: Vector3; dir: Vector3; r: number };
  /** pick points and bubble points, in pivot space */
  at: Vector3[]; top: Vector3[]; names: string[];
  view(i: number): { look: Vector3; dir: Vector3; r: number };
  /** v4: the look of the scene (sky, fog, shadow box) and the orbit limits */
  look: Look; lim?: Lim;
  /** v4: the tap targets (one per thing; a ray picks them) */
  hits?: Object3D[];
  /** a drag that starts on something the scene wants (returns true to claim the gesture) */
  hold?(x: number, y: number): boolean; drag?(x: number, y: number): void; drop?(): void;
  onFocus?(i: number | null): void;
  tick?(dt: number): void; busy?(): boolean;
  /** v4: true while the only motion is the idle sway (a slow GPU skips it) */
  sway?(): boolean;
  /** where the bubble points, if not at the label */
  tip?: Vector3[];
  bye?(): void;
  /** a value from the shell (the dot page's length slider) */
  input?(v: number): void;
  /** R35: named points (live vectors are fine) that the teaching callouts point at */
  marks?: Record<string, Vector3>;
}
export type Build = (st: Stage, P: Group, api: SApi) => Spec;

export function scene(box: HTMLElement, api: SApi, build: Build): P3 {
  let spec: Spec | null = null, F: ReturnType<typeof fly> | null = null;
  let px = 0, py = 0, held = false, pinch = 0;
  const pts = new Map<number, [number, number]>();
  /* a quality governor for slow GPUs (an old phone, a software renderer): when the frames of a running animation come
     slower than ~12 a second, step down (two steps when far slower) and say so on the box (data-q): 1 = draw at 1x and
     the glass pass at half size, 2 = the shadow map is drawn once and then kept, 3 = the idle sway stops (only real
     motion draws), 4 = no shadow map, draw at 0.75x. A fast GPU never leaves level 0; a software renderer starts at 4. ?p3q=<n> pins level n (0 = full quality, for screenshots). */
  let q = 0, gt = 0, gn = 0, gs = 0, pin = false, after: (() => void) | null = null;
  const setQ = (n: number) => {
    const r = st.renderer;
    if (n >= 1 && q < 1) { r.setPixelRatio(1); r.transmissionResolutionScale = 0.5; }
    if (n >= 2 && q < 2) { r.shadowMap.autoUpdate = false; r.shadowMap.needsUpdate = true; }
    if (n >= 4 && q < 4) { r.setPixelRatio(0.75); r.shadowMap.enabled = false; st.scene.traverse((o) => { const m = (o as { material?: { needsUpdate: boolean } }).material; if (m) m.needsUpdate = true; }); }
    q = Math.max(q, Math.min(4, n)); box.dataset.q = String(q);
  };
  const gov = (dt: number) => {
    if (dt <= 0 || q >= 4 || pin) { gt = performance.now(); gn = 0; gs = 0; return; }
    const t = performance.now(), d = gt ? t - gt : 0; gt = t;
    if (!d || ++gn <= 2) return; // skip the first frames (shader compiles)
    gs += d;
    if (gn < 6) return;
    const avg = gs / 4; gn = 2; gs = 0;
    if (avg > 85) setQ(q + (avg > 250 ? 2 : 1));
  };
  const st = stage(box, {
    raf: api.raf, caf: api.caf, cam: [0, 4, 8], fov: 34, after: () => after?.(),
    busy: () => !!F?.busy() || (!!spec?.busy?.() && !(q >= 3 && spec.sway?.())),
    tick: (dt) => {
      gov(dt);
      F?.tick(dt); spec?.tick?.(dt);
      const fg = st.scene.fog as { near: number; far: number } | null, fo = spec?.look.fog; // v4: the haze starts behind the scene, wherever the camera is
      if (fg && fo) { const d = st.cam.position.length(); fg.near = d + fo[0]; fg.far = d + fo[1]; }
    },
    grab: {
      down: (x, y) => { px = x; py = y; held = !!spec?.hold?.(x, y); },
      move: (x, y) => {
        if (held) { spec?.drag?.(x, y); return; }
        if (pts.size < 2) F?.turn(x - px, y - py);
        px = x; py = y;
      },
      up: (x, y, tap) => {
        if (held) { held = false; spec?.drop?.(); return; }
        if (tap) api.pick(pick(x, y));
      },
    },
  });
  /* two fingers: pinch to zoom (the stage's own handler still sees the first finger, which turns nothing while two are down) */
  const pd = (e: PointerEvent) => { pts.set(e.pointerId, [e.clientX, e.clientY]); if (pts.size === 2) pinch = spread(); };
  const pm = (e: PointerEvent) => {
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2 && pinch > 0) { const s = spread(); F?.zoom(pinch / Math.max(1, s)); pinch = s; st.draw(); }
  };
  const pu = (e: PointerEvent) => { pts.delete(e.pointerId); pinch = 0; };
  const spread = () => { const [a, b] = [...pts.values()]; return Math.hypot(a![0] - b![0], a![1] - b![1]); };
  const wheel = (e: WheelEvent) => { e.preventDefault(); F?.zoom(e.deltaY > 0 ? 1.08 : 1 / 1.08); st.draw(); };
  const c = st.canvas;
  c.addEventListener('pointerdown', pd); c.addEventListener('pointermove', pm); c.addEventListener('pointerup', pu); c.addEventListener('pointercancel', pu);
  c.addEventListener('wheel', wheel, { passive: false });
  c.style.touchAction = 'none';
  rig(st);
  box.classList.add('p3-on');
  spec = build(st, st.pivot, api);
  const LK = look(st, spec.look);
  /* a software renderer (no GPU: SwiftShader, llvmpipe) starts at the lowest level instead of finding out frame by frame */
  const gl = st.renderer.getContext(), ri = gl.getExtension('WEBGL_debug_renderer_info');
  const soft = /swiftshader|llvmpipe|softpipe|software/i.test(String(ri ? gl.getParameter(ri.UNMASKED_RENDERER_WEBGL) : ''));
  const qs = new URLSearchParams(location.search).get('p3q'), q0 = qs === null ? (soft ? 4 : 0) : Number(qs) || 0;
  setQ(q0); pin = qs !== null; // a level asked for in the address stays (the governor does not step down from it)

  F = fly(st.cam, spec.lim);
  F.to(spec.cam.look, spec.cam.dir, spec.cam.r, true);
  /* the labels are buttons: tap the word or the thing */
  const labels: Tag[] = spec.names.map((n, i) => {
    const t = st.tag(n, 'p3l'); t.at.copy(spec!.top[i]!);
    t.el.removeAttribute('aria-hidden'); t.el.setAttribute('role', 'button'); t.el.tabIndex = 0; t.el.dataset.pick = String(i); t.el.dataset.clamp = 'x';
    return t;
  });
  const bub = st.tag('', 'p3b'); bub.show(false); bub.el.removeAttribute('aria-hidden'); bub.el.setAttribute('role', 'dialog'); bub.el.dataset.clamp = '';
  let cur: number | null = null;
  const ray = new Raycaster(), nd = new Vector2(), cd = new Vector3(), wp = new Vector3();
  function pick(x: number, y: number) {
    if (spec?.hits?.length) {
      nd.set((x / c.clientWidth) * 2 - 1, -(y / c.clientHeight) * 2 + 1); ray.setFromCamera(nd, st.cam);
      const hit = ray.intersectObjects(spec.hits, true)[0];
      if (hit) { for (let o: Object3D | null = hit.object; o; o = o.parent) { const k = spec.hits.indexOf(o); if (k >= 0) return k; } }
    }
    let best = -1, bd = 70;
    spec!.at.forEach((p, i) => { const [sx, sy] = st.toScreen(p); const d = Math.hypot(sx - x, sy - y); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  return {
    focus(i, now = false) {
      cur = i;
      const v = i === null ? spec!.cam : spec!.view(i);
      F!.to(v.look, v.dir, v.r, now);
      labels.forEach((t, k) => { t.el.classList.toggle('on', k === i); t.show(i === null); }); // close up, only the chosen thing speaks
      spec!.onFocus?.(i);
      if (i === null) bub.show(false);
      st.draw();
    },
    bubble(html) {
      if (html === null || cur === null) { bub.show(false); labels.forEach((t, k) => t.show(cur === null || k === cur)); return null; }
      bub.at.copy((spec!.tip ?? spec!.top)[cur]!); bub.set(html); bub.show(true);
      labels.forEach((t) => t.show(false)); // the bubble takes the place of the labels
      return bub.el;
    },
    where(i) { // a point where a tap picks thing i: its pick point, or higher up it when a thing in front hides that
      const a = spec!.at[i]!, b = spec!.top[i]!, v = new Vector3();
      for (let k = 0; k <= 8; k++) { const p = st.toScreen(v.lerpVectors(a, b, k / 8)); if (pick(p[0], p[1]) === i) return p; }
      return st.toScreen(a);
    },
    input: (v) => spec?.input?.(v),
    orbit: () => F?.now() ?? [0, 0, 1],
    proj(p) {
      const [x, y] = st.toScreen(p); st.cam.getWorldDirection(cd);
      return [x, y, wp.copy(p).applyMatrix4(st.pivot.matrixWorld).sub(st.cam.position).dot(cd) > 0.05];
    },
    mark(name) {
      const m = spec?.marks?.[name]; if (m) return m;
      const k = /^([at])(\d+)$/.exec(name); if (!k || !spec) return null;
      return (k[1] === 't' ? spec.top : spec.at)[+k[2]!] ?? null;
    },
    onDraw(f) { after = f; st.draw(); },
    redraw: () => st.draw(),
    dispose() {
      spec?.bye?.(); after = null; box.classList.remove('p3-on');
      c.removeEventListener('pointerdown', pd); c.removeEventListener('pointermove', pm); c.removeEventListener('pointerup', pu); c.removeEventListener('pointercancel', pu);
      c.removeEventListener('wheel', wheel);
      st.scene.background = null; st.scene.environment = null; LK.free(); st.dispose(); freeGlow(); spec = null; F = null;
    },
  };
}
export const V = (x: number, y: number, z: number) => new Vector3(x, y, z);
