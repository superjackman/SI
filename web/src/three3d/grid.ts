/* R31d scene (K2): a matrix acting on a grid. A white board leans back a little; on it lies the plain grey grid with
   two short arrows (one blue, one violet: the two "unit" steps). Over it floats the purple grid after the matrix:
   the same squares, turned and stretched, with the two arrows turned and stretched too, and the first little
   square filled in. The slider sets the turn; a white card shows the four numbers of the matrix. */
import { Group, Mesh, PlaneGeometry } from 'three';
import { stage } from './core';
import { cyl, glowMat, gloss, rb, rig, std } from './kit';
import { MAT_S, matOf, n2 } from '../m2/w3d3';
import type { View } from '../m2/s3d';

export interface GridApi { lang: 'zh' | 'en'; raf: (f: FrameRequestCallback) => number; caf: (id: number) => void; deg(): number }
const B = 2.2;

/** a flat grid of thin bars from -n to n (step 1) in the x-y plane */
function lines(n: number, r: number, m: Parameters<typeof cyl>[3]) {
  const g = new Group();
  for (let i = -n; i <= n; i++) {
    const h = cyl(r, r, 2 * n, m, i, 0, 0, 8); g.add(h);
    const v = cyl(r, r, 2 * n, m, 0, i, 0, 8); v.rotation.z = Math.PI / 2; g.add(v);
  }
  return g;
}
/** an arrow from the origin along +x (length 1), drawn in the x-y plane */
function arrow(color: string, r = 0.05) {
  const g = new Group(), m = gloss(color, { emissive: color, glow: 0.35 });
  const s = cyl(r, r, 0.8, m, 0.4, 0, 0, 12); s.rotation.z = Math.PI / 2; g.add(s);
  const h = cyl(0, r * 3, 0.22, m, 0.89, 0, 0, 16); h.rotation.z = -Math.PI / 2; g.add(h);
  return g;
}

export function make(box: HTMLElement, api: GridApi): View {
  const en = api.lang === 'en';
  const st = stage(box, { raf: api.raf, caf: api.caf, cam: [0.6, 1.2, 9], look: [0.05, -0.05, 0], fit: 2.35, yaw: -0.25 });
  rig(st);
  const P = st.pivot;
  /* the board, leaning back */
  const brd = new Group(); brd.rotation.x = -0.62; P.add(brd);
  brd.add(rb(2 * B + 0.3, 2 * B + 0.3, 0.14, 0.12, gloss('#ffffff'), 0, 0, -0.1));
  brd.add(lines(2, 0.012, std('#cfcbe6', 0.6, 0)));
  const ax = std('#a39ccc', 0.5, 0);
  brd.add(cyl(0.02, 0.02, 2 * B, ax, 0, 0, 0.01, 8)); const xa = cyl(0.02, 0.02, 2 * B, ax, 0, 0, 0.01, 8); xa.rotation.z = Math.PI / 2; brd.add(xa);
  const i0 = arrow('#93c5fd', 0.03); i0.position.z = 0.02; brd.add(i0);
  const j0 = arrow('#c4b5fd', 0.03); j0.position.z = 0.02; j0.rotation.z = Math.PI / 2; brd.add(j0);
  /* the grid after the matrix: one group, turned and scaled (a turn × a stretch is exactly this matrix) */
  const tg = new Group(); tg.position.z = 0.16; brd.add(tg);
  tg.add(lines(1, 0.016, gloss('#8b5cf6', { emissive: '#7c3aed', glow: 0.25, opacity: 0.75 })));
  const sq = new Mesh(new PlaneGeometry(1, 1), glowMat('#8b5cf6', 0.28)); sq.position.set(0.5, 0.5, 0); tg.add(sq);
  const i1 = arrow('#2563eb'); tg.add(i1);
  const j1 = arrow('#7c3aed'); j1.rotation.z = Math.PI / 2; tg.add(j1);
  const sh = st.blob(1, 0.18); sh.scale.set(2.6, 1.2, 1); sh.position.set(0, -2.15, 0.3); P.add(sh);
  const card = st.tag('', 'mat'); card.at.set(1.1, 1.95, -0.6);
  function update() {
    const d = api.deg(), [a, b, c, e] = matOf(d);
    tg.rotation.z = (d * Math.PI) / 180; tg.scale.set(MAT_S, MAT_S, 1);
    card.set(`<b>${en ? 'Matrix A' : '矩阵 A'}</b><br>${n2(a)}&nbsp;&nbsp;${n2(b)}<br>${n2(c)}&nbsp;&nbsp;${n2(e)}`);
    st.draw();
  }
  update();
  return { update, dispose: () => st.dispose() };
}
