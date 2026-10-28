/* R34: the progress world map. Five small floating islands, one per zone, float in an arc; on each stands one pillar per
   station, lit gold when its quiz is done, and a glowing beacon over a finished zone. Glowing bridges join them in order.
   Tap an island (or its label) to go to that zone's hall. */
import { CylinderGeometry, Group, Mesh, type Material } from 'three';
import { scene } from '../../three3d/p3/base';
import { glow, toy } from '../../three3d/p3/look';
import { glowPath, island, puff, rnd } from '../../three3d/p3/props';
import { shade, V3, type View, type WApi } from './world';

export interface MapOpt { names: string[]; cols: string[]; done: boolean[][]; sky: [string, string, string] }
const SPOT: [number, number, number][] = [[-1.7, 0.0, 0.9], [-1.05, 0.25, -0.75], [0.25, 0.1, -1.25], [1.45, 0.2, -0.35], [1.25, -0.05, 1.05]];
export function make(box: HTMLElement, api: WApi, o: MapOpt): View {
  return scene(box, api, (_st, P) => {
    const geo = new CylinderGeometry(0.05, 0.06, 1, 12), isles: Group[] = [], beacons: Mesh[] = [];
    const hits = SPOT.map(([x, y, z], k) => {
      const g = new Group(); g.position.set(x, y, z); P.add(g); isles.push(g);
      const I = island(0.62, 0.85, 0.7, k + 2); g.add(I.g);
      const tint = o.cols[k]!, d = o.done[k]!, n = d.length;
      d.forEach((on, j) => {
        const a = (j / n) * Math.PI * 2 + 0.3, r = n === 1 ? 0 : 0.18 + (j % 2) * 0.17, h = on ? 0.36 : 0.16;
        const m = new Mesh(geo, toy(on ? '#facc15' : tint, { emissive: on ? '#f59e0b' : tint, glow: on ? 0.6 : 0.15 }));
        m.scale.y = h; m.position.set(Math.cos(a) * r, h / 2 + 0.03, Math.sin(a) * r * 0.85); g.add(m);
      });
      if (d.every(Boolean)) { const b = new Mesh(new CylinderGeometry(0.0, 0.12, 0.2, 4), toy('#fde68a', { emissive: '#facc15', glow: 0.9 })); b.position.y = 0.75; g.add(b); beacons.push(b); const gl = glow('#fde68a', 0.9, 0.6); gl.position.y = 0.75; g.add(gl); }
      { const gl = glow(tint, 1.4, 0.3); gl.position.set(0, 0.1, 0); g.add(gl); }
      shade(g); return g;
    });
    for (let k = 0; k < 4; k++) { const [a, b] = [SPOT[k]!, SPOT[k + 1]!]; P.add(glowPath([V3(a[0], a[1] + 0.05, a[2]), V3((a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 0.3, (a[2] + b[2]) / 2), V3(b[0], b[1] + 0.05, b[2])], '#f5f3ff', 0.015, 5)); }
    const clouds = [0, 1, 2, 3].map((k) => { const c = puff(0.35 + rnd(k) * 0.2, k); c.position.set(-3 + k * 2, -0.9 - rnd(k + 1) * 0.4, -1.5 + rnd(k + 4) * 3); P.add(c); return c; });
    let tt = 0;
    return {
      look: { sky: o.sky, exposure: 1.0, shadow: 3.6, key: [3, 8, 5], fog: [4, 14] },
      lim: { az: [-0.5, 0.5], el: [0.35, 1.1], z: [0.8, 1.3] },
      cam: { look: V3(0, 0.1, 0), dir: V3(0, 0.95, 1), r: 2.35 },
      view: (k) => ({ look: V3(SPOT[k]![0], SPOT[k]![1] + 0.2, SPOT[k]![2]), dir: V3(0, 0.8, 1), r: 0.9 }),
      marks: { pil: V3(SPOT[0]![0], SPOT[0]![1] + 0.22, SPOT[0]![2]), br: V3((SPOT[0]![0] + SPOT[1]![0]) / 2, SPOT[1]![1] + 0.33, (SPOT[0]![2] + SPOT[1]![2]) / 2) },
      at: SPOT.map(([x, y, z]) => V3(x, y + 0.15, z)), top: SPOT.map(([x, y, z], k) => V3(x, y + (k === 2 ? 0.98 : 0.62), z)),
      names: o.names, hits,
      busy: () => true, sway: () => true,
      tick(dt) {
        tt += dt;
        isles.forEach((g, k) => { g.position.y = SPOT[k]![1] + 0.04 * Math.sin(tt * 0.9 + k * 1.3); });
        beacons.forEach((b) => { b.rotation.y += dt * 2; (b.material as Material & { emissiveIntensity: number }).emissiveIntensity = 0.7 + 0.3 * Math.sin(tt * 3); });
        clouds.forEach((c, k) => { c.position.x = -3.5 + ((k * 2 + tt * 0.1) % 7); });
      },
    };
  }) as View;
}
