/* R34: an idea page. Two or three modelled things (kit props) stand on glass pedestals on the zone's island; tap one
   (or its label) and the camera flies to it and its glass bubble opens (what it is, the lightbulb for why, the magnifier
   to go deeper into the experiment). The things idle gently; everything is three.js geometry made in code. */
import { ConeGeometry, Group, Mesh, MeshBasicMaterial, QuadraticBezierCurve3, SphereGeometry, TubeGeometry, type Vector3 } from 'three';
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
    /* R37: how the parts work together: a glowing path with an arrow from each thing to the next, beads running along it */
    const flows: { c: QuadraticBezierCurve3; b: Mesh[] }[] = [], fm = new MeshBasicMaterial({ color: o.color, toneMapped: false, transparent: true, opacity: 0.85 });
    const bm = new MeshBasicMaterial({ color: '#fff7d6', toneMapped: false }), bg = new SphereGeometry(0.035, 10, 8), cone = new ConeGeometry(0.06, 0.14, 14);
    for (let k = 0; k + 1 < n; k++) {
      const a = V3(xs[k]! + 0.32, H + 0.12, zs[k]! + 0.42), b = V3(xs[k + 1]! - 0.32, H + 0.12, zs[k + 1]! + 0.42);
      const c = new QuadraticBezierCurve3(a, V3((a.x + b.x) / 2, H + 0.42, (a.z + b.z) / 2 + 0.25), b);
      P.add(new Mesh(new TubeGeometry(c, 24, 0.014, 6), fm));
      const tip = new Mesh(cone, fm), q = c.getPoint(0.9), q2 = c.getPoint(1); tip.position.copy(q2); tip.lookAt(q2.clone().add(q2.clone().sub(q))); tip.rotateX(Math.PI / 2); P.add(tip);
      const b3 = [0, 1, 2].map(() => { const m = new Mesh(bg, bm); P.add(m); return m; }); flows.push({ c, b: b3 });
    }
    const flowAt = (t: number, f: { c: QuadraticBezierCurve3; b: Mesh[] }) => f.b.forEach((m, i) => { const u = (t * 0.45 + i / 3) % 1; m.position.copy(f.c.getPoint(u) as Vector3); m.scale.setScalar(0.6 + 0.6 * Math.sin(u * Math.PI)); });
    flows.forEach((f) => flowAt(0, f));
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
      marks: Object.fromEntries(flows.map((f, k) => [`f${k}`, f.c.getPoint(0.5)])),
      busy: () => quiet < 20, sway: () => true,
      tick(dt) {
        tt += dt; quiet += dt; G.tick(tt);
        things.forEach((g, k) => { g.position.y = H + 0.03 * Math.sin(tt * 1.4 + k * 2); g.rotation.y = Math.sin(tt * 0.6 + k) * 0.3; idle(g, tt); });
        flows.forEach((f) => flowAt(tt, f));
      },
      bye() { st.canvas.removeEventListener('pointerdown', poke); },
    };
  }) as P3;
}
