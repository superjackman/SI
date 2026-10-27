/* R34: an idea page. Two or three modelled things (kit props) stand on glass pedestals on the zone's island; tap one
   (or its label) and the camera flies to it and its glass bubble opens (what it is, the lightbulb for why, the magnifier
   to go deeper into the experiment). The things idle gently; everything is three.js geometry made in code. */
import { Group } from 'three';
import { scene, type P3 } from '../../three3d/p3/base';
import { glow } from '../../three3d/p3/look';
import { idle, pedestal, prop } from './kit';
import { ground, shade, V3, type View, type WApi } from './world';

export interface StandOpt { things: { p: string; n: string }[]; color: string; sky: [string, string, string]; seed?: number }
export function make(box: HTMLElement, api: WApi, o: StandOpt): View {
  return scene(box, api, (st, P) => {
    const G = ground(P, 'isle', o.color, 3.0, o.seed ?? 3), n = o.things.length;
    const xs = n === 1 ? [0] : n === 2 ? [-0.85, 0.85] : [-1.35, 0, 1.35], zs = n === 3 ? [0.15, -0.35, 0.15] : xs.map(() => 0);
    const H = 0.45, things: Group[] = [];
    const hits = o.things.map((t, k) => {
      const hold = new Group(); hold.position.set(xs[k]!, 0, zs[k]!); P.add(hold);
      hold.add(pedestal(H, 0.48, '#e9e2ff'));
      const g = prop(t.p); g.position.y = H; g.scale.setScalar(0.95); shade(g); hold.add(g); things.push(g);
      const gl = glow(o.color, 1.1, 0.25); gl.position.y = H + 0.05; hold.add(gl);
      return hold;
    });
    let tt = 0, quiet = 0;
    const poke = () => { quiet = 0; st.draw(); };
    st.canvas.addEventListener('pointerdown', poke);
    const at = (k: number, dy: number) => V3(xs[k]!, H + dy, zs[k]!);
    return {
      look: { sky: o.sky, exposure: 1.0, shadow: 3.4, key: [3, 8, 5], fog: [3, 14] },
      lim: { az: [-0.6, 0.6], el: [0.12, 0.9], z: [0.7, 1.35] },
      cam: { look: V3(0, 0.75, 0), dir: V3(0, 0.42, 1), r: n === 3 ? 2.0 : 1.6 },
      view: (k) => ({ look: at(k, 0.45), dir: V3(xs[k]! * 0.15, 0.35, 1), r: 0.85 }),
      at: o.things.map((_, k) => at(k, 0.4)), top: o.things.map((_, k) => at(k, 1.15)),
      names: o.things.map((t) => t.n), hits,
      onFocus: poke,
      busy: () => quiet < 20, sway: () => true,
      tick(dt) {
        tt += dt; quiet += dt; G.tick(tt);
        things.forEach((g, k) => { g.position.y = H + 0.03 * Math.sin(tt * 1.4 + k * 2); g.rotation.y = Math.sin(tt * 0.6 + k) * 0.3; idle(g, tt); });
      },
      bye() { st.canvas.removeEventListener('pointerdown', poke); },
    };
  }) as P3;
}
