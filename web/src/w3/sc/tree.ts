/* R37: the knowledge tree in 3D. Six glass levels float one under the other: what you see and do on top, the math at
   the bottom. On each level stands one glowing orb per station (grey = not started, the level colour = seen, teal =
   practised, gold = mastered); a thin line joins each station to its parent one level up, and beads of light run down
   the lines (from the big picture into the parts). Tap a level (or its name) to bring it close. */
import { CylinderGeometry, Group, Mesh, MeshBasicMaterial, SphereGeometry, TorusGeometry, Vector3 } from 'three';
import { scene } from '../../three3d/p3/base';
import { glow, toy } from '../../three3d/p3/look';
import { shade, V3, type View, type WApi } from './world';

export interface TreeOpt { lv: { n: string; c: string }[]; nodes: { lv: number; up: number; st: number; on?: boolean }[]; sky: [string, string, string] }
const SC = ['#e7e5f0', '', '#14b8a6', '#facc15'];
export function make(box: HTMLElement, api: WApi, o: TreeOpt): View {
  return scene(box, api, (st, P) => {
    const nL = o.lv.length, Y = (k: number) => 1.3 - k * 0.52, tiers: Group[] = [];
    const disc = new CylinderGeometry(1, 1, 0.035, 64), ring = new TorusGeometry(1, 0.012, 8, 96), orb = new SphereGeometry(0.075, 20, 14);
    const hits = o.lv.map((l, k) => {
      const g = new Group(); g.position.y = Y(k); P.add(g); tiers.push(g);
      const r = 1.05 - k * 0.04;
      const d = new Mesh(disc, toy('#ffffff', { rough: 0.15, coat: 1, emissive: l.c, glow: 0.06, opacity: 0.6 })); d.scale.set(r, 1, r * 0.42); g.add(d);
      const ri = new Mesh(ring, new MeshBasicMaterial({ color: l.c, toneMapped: false })); ri.rotation.x = Math.PI / 2; ri.scale.set(r, r * 0.42, 1); ri.position.y = 0.02; g.add(ri);
      return g;
    });
    /* the orbs, spread along the front of their level */
    const pos: Vector3[] = [], per = o.lv.map(() => 0), cnt = o.lv.map((_, k) => o.nodes.filter((n) => n.lv === k).length), orbs: Mesh[] = [];
    o.nodes.forEach((n) => {
      const m = cnt[n.lv]!, j = per[n.lv]!++, gap = Math.min(0.3, 1.5 / Math.max(1, m - 1)), xx = 0.12 + (j - (m - 1) / 2) * gap;
      const p = V3(xx, Y(n.lv) + 0.1, 0.18 + 0.12 * Math.cos(xx * 1.4)); pos.push(p);
      const c = n.st === 1 ? o.lv[n.lv]!.c : SC[n.st]!;
      const b = new Mesh(orb, toy(c, { emissive: c, glow: n.st ? 0.55 : 0.08 })); b.position.copy(p); if (n.on) b.scale.setScalar(1.5); P.add(b); orbs.push(b);
      if (n.st === 3 || n.on) { const gl = glow(n.on ? '#ffffff' : '#fde68a', 0.45, 0.7); gl.position.copy(p); P.add(gl); }
    });
    /* the lines to the parents, with beads running down them */
    const lineM = new MeshBasicMaterial({ color: '#a78bfa', toneMapped: false, transparent: true, opacity: 0.75 }), stick = new CylinderGeometry(0.008, 0.008, 1, 6);
    const beads: { m: Mesh; a: Vector3; b: Vector3; t: number }[] = [], beadG = new SphereGeometry(0.025, 10, 8), beadM = new MeshBasicMaterial({ color: '#fef3c7', toneMapped: false });
    o.nodes.forEach((n, i) => {
      if (n.up < 0) return;
      const a = pos[n.up]!, b = pos[i]!, mid = a.clone().add(b).multiplyScalar(0.5), len = a.distanceTo(b);
      const s = new Mesh(stick, lineM); s.position.copy(mid); s.scale.y = len; s.lookAt(b); s.rotateX(Math.PI / 2); P.add(s);
      const bd = new Mesh(beadG, beadM); P.add(bd); beads.push({ m: bd, a, b, t: (i * 0.37) % 1 });
    });
    shade(P);
    const L = (k: number) => V3(-1.08, Y(k) + 0.06, 0.25);
    let tt = 0, quiet = 0;
    const poke = () => { quiet = 0; st.draw(); };
    st.canvas.addEventListener('pointerdown', poke);
    return {
      look: { sky: o.sky, exposure: 1.05, shadow: 3.6, key: [3, 8, 5], fog: [4, 14] },
      lim: { az: [-0.45, 0.45], el: [0.05, 0.6], z: [0.75, 1.3] },
      cam: { look: V3(-0.05, 0.06, 0), dir: V3(0, 0.22, 1), r: 1.62 },
      view: (k) => ({ look: V3(0, Y(k) + 0.05, 0), dir: V3(0, 0.3, 1), r: 0.95 }),
      at: o.lv.map((_, k) => V3(0.1, Y(k) + 0.05, 0.3)), top: o.lv.map((_, k) => L(k)),
      names: o.lv.map((l) => l.n), hits,
      marks: { top: V3(0.12, Y(0) + 0.2, 0.2), math: V3(0.12, Y(nL - 1) + 0.2, 0.2) },
      busy: () => quiet < 25, sway: () => true, onFocus: poke,
      bye() { st.canvas.removeEventListener('pointerdown', poke); },
      tick(dt) {
        tt += dt; quiet += dt;
        tiers.forEach((g, k) => { g.position.y = Y(k) + 0.012 * Math.sin(tt * 1.1 + k); });
        for (const b of beads) { b.t = (b.t + dt * 0.35) % 1; b.m.position.lerpVectors(b.a, b.b, b.t); }
        orbs.forEach((m, k) => { if (o.nodes[k]!.on) m.scale.setScalar(1.4 + 0.15 * Math.sin(tt * 4)); });
      },
    };
  }) as View;
}
