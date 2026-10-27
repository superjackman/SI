/* R34: the reward page. A gold medal spins on a tall glass pedestal while confetti stars burst; round it stand the 27
   station pillars of the whole site, lit (in their zone's colour) for every finished quiz, the new one rising and
   glowing. Tap anywhere for another burst. */
import { CylinderGeometry, Group, Mesh, type Material } from 'three';
import { scene } from '../../three3d/p3/base';
import { glow, toy } from '../../three3d/p3/look';
import { pedestal, prop } from './kit';
import { burst, ground, shade, V3, type View, type WApi } from './world';

export interface RewardOpt { cols: string[]; done: boolean[]; now: number; color: string; sky: [string, string, string] }
export function make(box: HTMLElement, api: WApi, o: RewardOpt): View {
  let again: (() => void) | null = null;
  const v = scene(box, { ...api, pick: () => again?.() }, (st, P) => {
    const G = ground(P, 'hall', o.color, 3.0);
    const base = new Group(); P.add(base); base.add(pedestal(0.7, 0.55, '#fde68a'));
    const medal = prop('medal'); medal.scale.setScalar(1.5); medal.position.y = 0.6; shade(medal); base.add(medal);
    const halo = glow('#fde68a', 2.2, 0.5); halo.position.y = 1.2; base.add(halo);
    const n = o.cols.length, R = 2.2, geo = new CylinderGeometry(0.09, 0.11, 1, 20);
    const pil = o.cols.map((c, k) => {
      const a = Math.PI + (k / n) * Math.PI * 2, lit = o.done[k]!, h = lit ? 0.5 : 0.18;
      const m = new Mesh(geo, toy(lit ? c : '#d6d0e8', { emissive: lit ? c : '#000000', glow: lit ? 0.55 : 0 }));
      m.scale.y = k === o.now ? 0.01 : h; m.position.set(Math.sin(a) * R, m.scale.y / 2, Math.cos(a) * R * 0.75 - 0.3); P.add(m); m.castShadow = true;
      if (lit) { const g = glow(c, 0.5, 0.5); g.position.set(m.position.x, h + 0.08, m.position.z); P.add(g); }
      return { m, h };
    });
    let tt = 0, fx: { tick(dt: number): boolean } | null = burst(P, V3(0, 1.4, 0), 40);
    again = () => { fx = burst(P, V3(0, 1.4, 0), 30); st.draw(); };
    return {
      look: { sky: o.sky, exposure: 1.02, shadow: 3.5, key: [3, 8, 5] },
      lim: { az: [-0.5, 0.5], el: [0.15, 0.85], z: [0.8, 1.3] },
      cam: { look: V3(0, 0.85, 0), dir: V3(0, 0.4, 1), r: 2.1 },
      view: () => ({ look: V3(0, 0.85, 0), dir: V3(0, 0.4, 1), r: 2.1 }),
      at: [], top: [], names: [],
      busy: () => tt < 4 || !!fx, sway: () => !fx,
      tick(dt) {
        tt += dt; G.tick(tt);
        medal.rotation.y += dt * 1.6; medal.position.y = 0.6 + 0.05 * Math.sin(tt * 2);
        (halo.material as Material & { opacity: number }).opacity = 0.4 + 0.15 * Math.sin(tt * 3);
        const p = pil[o.now]; if (p && p.m.scale.y < p.h) { p.m.scale.y = Math.min(p.h, p.m.scale.y + dt * 0.35); p.m.position.y = p.m.scale.y / 2; }
        if (fx && !fx.tick(dt)) fx = null;
      },
    };
  }) as View;
  return v;
}
