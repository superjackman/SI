/* R30 scene 3 (T7): rolling down the loss valley. R30c look (the reference sheet): a cut-out block of soft hilly ground
   whose height is the loss. The real loss (w3d.loss) is a long, narrow valley; a few soft made-up hills and a little
   ripple are added around the edges (never on the ball's road, so the maths of the steps is unchanged) so it reads as a
   landscape, not a bowl. Lavender on the hills, deep glowing purple at the bottom, with fading sides. A glowing glass ball
   sits at the current step, see-through "ghost" balls show earlier steps, a glowing trail shows the road so far, a faint
   one the road ahead, and a small arrow points downhill. A thin Loss ruler stands at the back-left corner (high / mid /
   low). The lab (m2/labs/T7.w.ts) owns the steps, Play and Reset; this view only draws. */
import {
  AdditiveBlending, BufferGeometry, CatmullRomCurve3, Color, ConeGeometry, CylinderGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, Quaternion, SphereGeometry, TubeGeometry, Vector3,
} from 'three';
import { satin, stage } from './core';
import { grad, loss } from '../m2/w3d';
import type { View } from '../m2/s3d';

export interface ValleyApi {
  lang: 'zh' | 'en'; raf: (f: FrameRequestCallback) => number; caf: (id: number) => void;
  path(): [number, number][]; at(): number;
}
export const AX = 4.4, BX = 2.6, BF = 1.9; // the drawn part of the valley: |a| ≤ AX, −BF ≤ b ≤ BX (the front edge is cut lower so it never hides the floor)
const S = 0.66, SB = 1.1, H = 0.4, GHOSTS = 4, BASE = -0.9; // world units per unit of a, of b, and of height; ghosts; bottom of the block
const C = 3.6; // the loss part is drawn as C·tanh(L/C): the same as L near the bottom, levelling off at the far edges
/* soft hills (a, b, height, width), kept off the ball's road (a from −3 to 0, b from 0 to 1.8). b is drawn toward the
   back (z = −b), so the ball starts at the back-left and rolls down to the front-middle, as in the reference */
const HILLS: [number, number, number, number][] = [[2.9, 1.9, 3.0, 0.95], [-3.6, -1.3, 1.6, 0.8], [3.7, -1.2, 1.5, 0.75], [0.6, 2.6, 2.0, 0.85], [-3.9, 2.4, 1.2, 0.7]];
const bump = (a: number, b: number) =>
  HILLS.reduce((s, [x, y, h, w]) => s + h * Math.exp(-((a - x) ** 2 + (b - y) ** 2) / (2 * w * w)), 0)
  + 0.18 * Math.sin(1.7 * a + 0.4) * Math.cos(2.3 * b) * Math.min(1, Math.hypot(a / 2, b) / 1.6); // ripple, none at the bottom
const hgt = (a: number, b: number) => C * Math.tanh(loss(a, b) / C) + bump(a, b);
const pos = (a: number, b: number, lift = 0) => new Vector3(a * S, hgt(a, b) * H + lift, -b * SB);

export function make(box: HTMLElement, api: ValleyApi): View {
  const st = stage(box, { raf: api.raf, caf: api.caf, cam: [0, 8.4, 5.6], look: [0, 1.1, -0.6], fit: 3.7, yaw: -0.12 });
  const P = st.pivot;
  /* the ground: a sheet a ∈ [−AX, AX], b ∈ [−BX, BX], coloured by height (deep purple low → pale lavender high) */
  const NA = 72, NB = 52, vs: number[] = [], cs: number[] = [], ix: number[] = [];
  const lo = new Color('#7c3aed'), mid = new Color('#ad96f7'), hi = new Color('#efeaff'), c = new Color(), top = 5.5;
  const tint = (h: number) => { const t = Math.min(1, Math.sqrt(Math.max(0, h) / top)); return t < 0.45 ? c.copy(lo).lerp(mid, t / 0.45) : c.copy(mid).lerp(hi, (t - 0.45) / 0.55); };
  const A = (j: number) => -AX + (2 * AX * j) / NA, B = (i: number) => -BF + ((BX + BF) * i) / NB;
  for (let i = 0; i <= NB; i++) for (let j = 0; j <= NA; j++) { const p = pos(A(j), B(i)); vs.push(p.x, p.y, p.z); tint(hgt(A(j), B(i))); cs.push(c.r, c.g, c.b); }
  for (let i = 0; i < NB; i++) for (let j = 0; j < NA; j++) { const k = i * (NA + 1) + j; ix.push(k, k + 1, k + NA + 1, k + 1, k + NA + 2, k + NA + 1); } // z = −b flips the winding back so normals face up
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(vs, 3)); g.setAttribute('color', new Float32BufferAttribute(cs, 3));
  g.setIndex(ix); g.computeVertexNormals();
  P.add(new Mesh(g, new MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.05, side: DoubleSide })));
  /* the four cut sides: from the ground's edge down to the base, fading out toward the bottom */
  const sv: number[] = [], sc: number[] = [], si: number[] = [];
  const edge: [number, number][] = [];
  for (let j = 0; j <= NA; j++) edge.push([A(j), -BF]);
  for (let i = 1; i <= NB; i++) edge.push([AX, B(i)]);
  for (let j = NA - 1; j >= 0; j--) edge.push([A(j), BX]);
  for (let i = NB - 1; i >= 0; i--) edge.push([-AX, B(i)]);
  edge.forEach(([a, b], n) => {
    const p = pos(a, b); tint(hgt(a, b));
    sv.push(p.x, p.y, p.z, p.x, BASE, p.z); sc.push(c.r, c.g, c.b, 0.9, 0.82, 0.78, 0.98, 0.1);
    if (n) { const k = 2 * n; si.push(k - 2, k - 1, k, k, k - 1, k + 1); }
  });
  const sg = new BufferGeometry();
  sg.setAttribute('position', new Float32BufferAttribute(sv, 3)); sg.setAttribute('color', new Float32BufferAttribute(sc, 4)); sg.setIndex(si);
  const side = new Mesh(sg, new MeshBasicMaterial({ vertexColors: true, transparent: true, side: DoubleSide, depthWrite: false })); side.renderOrder = 1; P.add(side);
  const sh = st.blob(1, 0.2); sh.scale.set(AX * S * 1.25, (BX + BF) * SB * 0.62, 1); sh.position.set(0, BASE - 0.05, -((BX - BF) / 2) * SB); P.add(sh);
  /* the valley floor glows: a small patch that hugs the ground, added on top (purple, fading out from the bottom) */
  const gv: number[] = [], gc: number[] = [], gi: number[] = [], GN = 24, GA = 2.6, GB = 1.3;
  for (let i = 0; i <= GN; i++) for (let j = 0; j <= GN; j++) {
    const ga = -GA + (2 * GA * j) / GN, gb = -GB + (2 * GB * i) / GN, p = pos(ga, gb, 0.02), f = Math.exp(-3 * ((ga / GA) ** 2 + (gb / GB) ** 2));
    gv.push(p.x, p.y, p.z); gc.push(0.75 * f, 0.4 * f, 1 * f);
  }
  for (let i = 0; i < GN; i++) for (let j = 0; j < GN; j++) { const k = i * (GN + 1) + j; gi.push(k, k + GN + 1, k + 1, k + 1, k + GN + 1, k + GN + 2); }
  const gg0 = new BufferGeometry(); gg0.setAttribute('position', new Float32BufferAttribute(gv, 3)); gg0.setAttribute('color', new Float32BufferAttribute(gc, 3)); gg0.setIndex(gi);
  const bloom = new Mesh(gg0, new MeshBasicMaterial({ vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false })); bloom.renderOrder = 1; P.add(bloom);
  const low = st.tag(api.lang === 'en' ? 'lowest point' : '最低点', 'soft'); low.at.copy(pos(0.2, -1.05, -0.05)); // just in front of the bottom, so it never covers the ball resting there
  /* the Loss ruler at the back-left corner: a thin post with three ticks (high / mid / low) */
  const rm = new MeshBasicMaterial({ color: '#8b80d9', transparent: true, opacity: 0.7 });
  const rx = -AX * S - 0.4, rz = -BX * SB - 0.5, y0 = pos(0, 0).y, y1 = y0 + 2.1; // a picture ruler: only high / mid / low, no numbers
  const post = new Mesh(new CylinderGeometry(0.018, 0.018, y1 - y0 + 0.4, 6), rm); post.position.set(rx, (y0 + y1) / 2 + 0.2, rz); P.add(post);
  const marks = api.lang === 'en' ? ['high', 'mid', 'low'] : ['高', '中', '低'];
  [y1, (y0 + y1) / 2, y0].forEach((y, i) => {
    const tk = new Mesh(new CylinderGeometry(0.014, 0.014, 0.22, 6), rm); tk.rotation.z = Math.PI / 2; tk.position.set(rx + 0.11, y, rz); P.add(tk);
    st.tag(marks[i]!, 'ax end').at.set(rx - 0.06, y, rz); // right edge just left of the post, whatever the word's length
  });
  st.tag('Loss', 'ax').at.set(rx, y1 + 0.6, rz);
  /* the glass ball, its glow and shadow, the ghosts of earlier steps */
  const RB = 0.3;
  const ball = new Mesh(new SphereGeometry(RB, 40, 28), new MeshStandardMaterial({ color: '#e9ddff', emissive: '#7c3aed', emissiveIntensity: 0.45, roughness: 0.08, metalness: 0.05, transparent: true, opacity: 0.94 }));
  const glow = st.halo(RB * 2.1, '#c4b5fd', 0.28), bsh = st.blob(RB * 1.7, 0.35);
  P.add(ball, glow, bsh);
  const gg = new SphereGeometry(RB * 0.9, 28, 18), ghosts: Mesh<SphereGeometry, MeshStandardMaterial>[] = [];
  for (let i = 0; i < GHOSTS; i++) { const m = new Mesh(gg, satin('#efeaff', { opacity: 0.4 })); m.material.depthWrite = false; m.renderOrder = 2; P.add(m); ghosts.push(m); }
  /* the road so far (a glowing tube) and the road ahead (a faint thin tube); rebuilt on every step */
  const done = new Mesh(new BufferGeometry(), new MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.95 }));
  const doneGlow = new Mesh(new BufferGeometry(), new MeshBasicMaterial({ color: '#e9d5ff', transparent: true, opacity: 0.35, depthWrite: false }));
  const ahead = new Mesh(new BufferGeometry(), new MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.4, depthWrite: false }));
  done.renderOrder = doneGlow.renderOrder = ahead.renderOrder = 2; ball.renderOrder = 3; glow.renderOrder = 3;
  P.add(done, doneGlow, ahead);
  const tube = (m: Mesh, pts: Vector3[], r: number) => {
    m.geometry.dispose();
    m.geometry = pts.length > 1 ? new TubeGeometry(new CatmullRomCurve3(pts), Math.min(240, pts.length * 6), r, 8, false) : new BufferGeometry();
  };
  /* a small arrow that points downhill from the ball */
  const arrow = new Group(), am = satin('#4338ca', { emissive: '#4338ca', glow: 0.3 });
  const shaft = new Mesh(new CylinderGeometry(0.04, 0.04, 0.42, 12), am); shaft.position.y = 0.21;
  const head = new Mesh(new ConeGeometry(0.11, 0.22, 16), am); head.position.y = 0.52;
  arrow.add(shaft, head); P.add(arrow);
  const UP = new Vector3(0, 1, 0), q = new Quaternion();

  const update = () => {
    const path = api.path(), k = Math.min(api.at(), path.length - 1), [a, b] = path[k]!;
    const at = pos(a, b, RB); ball.position.copy(at); glow.position.copy(at); bsh.position.copy(pos(a, b, 0.02));
    /* ghosts spread evenly along the distance already rolled (not by step count, or they bunch up at the bottom) */
    const acc = [0];
    for (let i = 1; i <= k; i++) acc.push(acc[i - 1]! + Math.hypot(path[i]![0] - path[i - 1]![0], path[i]![1] - path[i - 1]![1]));
    const tot = acc[k]!;
    let last = -1;
    ghosts.forEach((m, i) => {
      const want = (tot * (GHOSTS - i)) / (GHOSTS + 1);
      let s = 0;
      while (s < k && acc[s + 1]! <= want) s++;
      m.visible = tot > 0.6 && s < k && s !== last;
      if (m.visible) { last = s; const p = path[s]!; m.position.copy(pos(p[0], p[1], RB * 0.9)); m.material.opacity = 0.22 + 0.06 * (GHOSTS - i); }
    });
    const road = (from: number, to: number) => { const o: Vector3[] = []; for (let i = from; i <= to; i++) o.push(pos(path[i]![0], path[i]![1], 0.05)); return o; };
    const so = road(0, k), ah = road(k, path.length - 1);
    tube(done, so, 0.045); tube(doneGlow, so, 0.12); tube(ahead, ah, 0.028);
    const [ga, gb] = grad(a, b), n = Math.hypot(ga, gb);
    arrow.visible = loss(a, b) > 0.02;
    if (arrow.visible) {
      const da = -ga / n, db = -gb / n, d = 0.5, to = pos(a + da * d, b + db * d, 0.08), from = pos(a, b, 0.08);
      const dir = to.sub(from).normalize();
      q.setFromUnitVectors(UP, dir); arrow.quaternion.copy(q);
      arrow.position.copy(from).addScaledVector(dir, RB + 0.04);
    }
    st.draw();
  };
  update();
  return { update, dispose: () => { for (const m of [done, doneGlow, ahead]) m.geometry.dispose(); st.dispose(); } };
}
