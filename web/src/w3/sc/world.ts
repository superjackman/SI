/* R34: what every scene of the all-3D site shares, on top of the R33 v4 stage (three3d/p3/base: the damped orbit camera,
   picking, the glass bubble, on-demand frames with the quality step-down) and its look (p3/look). Here: the scene module
   type the shell loads, a ground (a floating island or a round glass hall floor tinted with the zone colour), the star
   burst for a right answer, label buttons a scene places itself, and a ray pick. Nothing here is drawn from an image. */
import {
  CircleGeometry, Group, Mesh, MeshBasicMaterial, OctahedronGeometry, Plane, Raycaster, TorusGeometry, Vector2, Vector3,
  type Object3D, type PerspectiveCamera,
} from 'three';
import type { P3, SApi } from '../../three3d/p3/base';
import type { Stage, Tag } from '../../three3d/core';
import { glow, shade, toy } from '../../three3d/p3/look';
import { flowers, island, puff, rnd, tree } from '../../three3d/p3/props';
import { add } from './kit';

/** what a scene may tell the shell */
export interface WApi extends SApi { say?(s: string): void; done?(): void; note?(k: string, v: string | number): void }
/** a live scene: the v4 handle plus set() (a value from the shell: a quiz answer, a lab tap) and its slider, if any */
export type View = P3 & { set?(x: unknown): void; slider?: { min: number; max: number; val: number; step?: number; label: string } };
export type Mod<O = unknown> = { make(box: HTMLElement, api: WApi, o: O): View };

export const V3 = (x: number, y: number, z: number) => new Vector3(x, y, z);
/** a ground for a scene: a floating island (with trees, flowers and clouds) or a glass hall floor with glowing rings */
export function ground(P: Group, kind: 'isle' | 'hall', tint: string, R = 3.2, seed = 3): { tick(t: number): void } {
  const clouds: Group[] = [];
  if (kind === 'isle') {
    const I = island(R, 0.8, 2.0, seed); P.add(I.g);
    const spots: Vector3[] = [];
    for (let k = 0; k < 90; k++) { const a = rnd(k + seed) * Math.PI * 2, r = (0.55 + rnd(k * 3 + seed) * 0.4) * I.edge(a); spots.push(V3(Math.cos(a) * r, 0.05, Math.sin(a) * r * I.sz)); }
    P.add(flowers(spots));
    for (let k = 0; k < 7; k++) { const a = Math.PI * 1.05 + (k / 6) * Math.PI * 0.9 + (rnd(k) - 0.5) * 0.2, r = I.edge(a) * 0.86; const t = tree(0.9 + rnd(k + 2) * 0.5, k + seed); t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r * I.sz); P.add(t); }
  } else {
    const fl = add(P, new Mesh(new CircleGeometry(R + 0.6, 96), toy('#efeafc', { rough: 0.14, coat: 1 }))); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
    const ringM = new MeshBasicMaterial({ color: tint, toneMapped: false, transparent: true, opacity: 0.75 });
    for (const [r, w] of [[R * 0.8, 0.025], [R * 0.86, 0.01]] as const) { const ri = add(P, new Mesh(new TorusGeometry(r, w, 8, 128), ringM)); ri.rotation.x = Math.PI / 2; ri.position.y = 0.012; }
    const disc = add(P, new Mesh(new CircleGeometry(R * 0.78, 96), new MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.12, depthWrite: false }))); disc.rotation.x = -Math.PI / 2; disc.position.y = 0.008;
  }
  for (let k = 0; k < 3; k++) { const c = puff(0.45 + rnd(k + 7) * 0.3, k + seed); c.position.set(-4 + k * 4, 2.6 + rnd(k) * 0.8, -3.5 - rnd(k + 1) * 1.5); P.add(c); clouds.push(c); }
  return { tick(t) { clouds.forEach((c, k) => { c.position.x = -4.5 + ((k * 4 + t * 0.12) % 9); }); } };
}
/** a burst of little gold stars (a right answer, a medal): returns a ticker that says when it is over */
export function burst(P: Group, at: Vector3, n = 26): { tick(dt: number): boolean } {
  const g = new Group(); g.position.copy(at); P.add(g);
  const geo = new OctahedronGeometry(0.05, 0), cols = ['#facc15', '#f472b6', '#a78bfa', '#38bdf8', '#4ade80'];
  const parts = Array.from({ length: n }, (_, k) => {
    const m = new Mesh(geo, toy(cols[k % cols.length]!, { emissive: cols[k % cols.length]!, glow: 0.7 }));
    const a = rnd(k + 1) * Math.PI * 2, e = 0.4 + rnd(k + 2) * 0.9, s = 1.4 + rnd(k + 3) * 1.4;
    g.add(m); return { m, v: V3(Math.cos(a) * Math.cos(e) * s, Math.sin(e) * s + 0.8, Math.sin(a) * Math.cos(e) * s) };
  });
  const gl = glow('#fde68a', 1.4, 0.9); g.add(gl);
  let t = 0;
  return {
    tick(dt) {
      if (t > 1.6) return false;
      t += dt;
      for (const p of parts) { p.v.y -= 3.2 * dt; p.m.position.addScaledVector(p.v, dt); p.m.rotation.x += dt * 6; p.m.rotation.y += dt * 4; p.m.scale.setScalar(Math.max(0.01, 1 - t / 1.6)); }
      gl.material.opacity = Math.max(0, 0.9 - t * 1.2); gl.scale.setScalar(1.4 + t * 1.5);
      if (t > 1.6) { g.removeFromParent(); geo.dispose(); for (const p of parts) (p.m.material as { dispose(): void }).dispose(); return false; }
      return true;
    },
  };
}
/** a label button the scene places itself (same look and behaviour as the v4 labels: tap the word or the thing) */
export function label(st: Stage, s: string, i: number, at: Vector3, cls = 'p3l'): Tag {
  const t = st.tag(s, cls); t.at.copy(at);
  t.el.removeAttribute('aria-hidden'); t.el.setAttribute('role', 'button'); t.el.tabIndex = 0; t.el.dataset.pick = String(i); t.el.dataset.clamp = 'x';
  return t;
}
/** the thing under canvas pixel x, y among `hits` (index, or -1) and where the ray met it */
const RC = new Raycaster(), ND = new Vector2();
export function rayPick(st: Stage, hits: Object3D[], x: number, y: number): number {
  const c = st.canvas; ND.set((x / c.clientWidth) * 2 - 1, -(y / c.clientHeight) * 2 + 1); RC.setFromCamera(ND, st.cam as PerspectiveCamera);
  const hit = RC.intersectObjects(hits, true)[0];
  if (hit) for (let o: Object3D | null = hit.object; o; o = o.parent) { const k = hits.indexOf(o); if (k >= 0) return k; }
  return -1;
}
/** where the ray under canvas pixel x, y meets the level y = h (in world space), or null */
export function onLevel(st: Stage, x: number, y: number, h: number): Vector3 | null {
  const c = st.canvas; ND.set((x / c.clientWidth) * 2 - 1, -(y / c.clientHeight) * 2 + 1); RC.setFromCamera(ND, st.cam as PerspectiveCamera);
  const out = new Vector3(); return RC.ray.intersectPlane(new Plane(V3(0, 1, 0), -h), out);
}
/** a soft glow under a thing on the floor */
export function pad(P: Group, x: number, z: number, color: string, r = 1.2) { const g = glow(color, r, 0.3); g.position.set(x, 0.06, z); P.add(g); return g; }
export { shade };
