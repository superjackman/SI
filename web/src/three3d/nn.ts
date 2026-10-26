/* R31d scene (N): a tiny neural network in glossy purple glass: 3 input balls, 4 hidden, 2 output, joined by soft
   tubes. One line (hidden 1 → output A) is lit; the slider under the stage sets its weight: the tube gets thicker
   with a bigger weight, turns coral when the weight is negative, and output A glows brighter or dimmer (its % on a
   small tag). The lab (m2/labs/N.w.ts) owns the slider; this view only draws. */
import { Group, Vector3 } from 'three';
import { stage } from './core';
import { ball, cable, freeObj, gloss, rig } from './kit';
import { nnOut, pc } from '../m2/w3d3';
import type { View } from '../m2/s3d';

export interface NnApi { lang: 'zh' | 'en'; raf: (f: FrameRequestCallback) => number; caf: (id: number) => void; w(): number }
const XS = [-2.5, 0, 2.5], YS = [[1.7, 0, -1.7], [2.4, 0.8, -0.8, -2.4], [0.85, -0.85]];
const R = 0.4;

export function make(box: HTMLElement, api: NnApi): View {
  const en = api.lang === 'en', T = (zh: string, e: string) => (en ? e : zh);
  const st = stage(box, { raf: api.raf, caf: api.caf, cam: [0.4, 2.0, 9], look: [0, 0.3, 0], fit: 3.25, yaw: -0.12 });
  rig(st);
  const P = st.pivot;
  const at = (l: number, i: number) => new Vector3(XS[l]!, YS[l]![i]!, 0);
  /* balls: deep glossy violet with a small white shine, like glass marbles */
  const bm = gloss('#5b4fd6', { emissive: '#3b2fb0', glow: 0.25 }), shine = gloss('#ffffff', { emissive: '#ffffff', glow: 0.8 });
  const outs: ReturnType<typeof st.halo>[] = [];
  YS.forEach((ys, l) => ys.forEach((_, i) => {
    const p = at(l, i); P.add(ball(R, bm, p.x, p.y, p.z), ball(0.08, shine, p.x - 0.14, p.y + 0.16, p.z + 0.33));
    if (l === 2 && i === 0) { const h = st.halo(0.62, '#a78bfa', 0.2); h.position.copy(p); P.add(h); outs.push(h); }
  }));
  const sh = st.blob(1, 0.18); sh.scale.set(3.6, 1.0, 1); sh.position.set(0, -3.0, 0); P.add(sh);
  /* the quiet tubes (every pair of neighbouring layers) */
  const tube = (a: Vector3, b: Vector3, r: number, c: string, glow = '#c4b5fd', ga = 0.12) => {
    const dx = (b.x - a.x) * 0.45;
    return cable(a.clone().setX(a.x + R * 0.8), b.clone().setX(b.x - R * 0.8), new Vector3(a.x + dx, a.y, 0), new Vector3(b.x - dx, b.y, 0), r, c, glow, ga);
  };
  for (let l = 0; l < 2; l++) YS[l]!.forEach((_, i) => YS[l + 1]!.forEach((__, j) => { if (!(l === 1 && i === 0 && j === 0)) P.add(tube(at(l, i), at(l + 1, j), 0.022, '#b9adf5', '#ddd6fe', 0)); }));
  /* the tags: layer names on top, the weight on the lit line, the output share */
  const head = [T('输入层', 'Input'), T('隐藏层', 'Hidden'), T('输出层', 'Output')].map((s, l) => { const g = st.tag(s, 'ax'); g.at.set(XS[l]!, 3.25, 0); return g; });
  const wt = st.tag('', 'pin up'); wt.at.set(0.95, 1.95, 0.05);
  const pt = st.tag('', 'pct on'); pt.at.set(XS[2]!, YS[2]![0]! + 0.82, 0);
  let lit: Group | null = null;
  function update() {
    const w = api.w(), o = nnOut(w), neg = w < 0;
    if (lit) freeObj(lit);
    const r = 0.035 + Math.abs(w) * 0.05, c = neg ? '#f2836b' : '#7c5cf0';
    lit = Math.abs(w) < 0.05 ? tube(at(1, 0), at(2, 0), 0.018, '#d4cdf7', '#ddd6fe', 0) : tube(at(1, 0), at(2, 0), r, c, neg ? '#fecaca' : '#c4b5fd', 0.3);
    P.add(lit);
    (outs[0]!.material as { opacity: number }).opacity = 0.08 + 0.42 * o; outs[0]!.scale.setScalar(0.8 + 0.5 * o);
    wt.set(`${T('权重', 'Weight')} = ${w.toFixed(1).replace('-', '−')}`);
    pt.set(`${pc(o)}%`); pt.el.classList.toggle('bad', o < 0.35);
    void head; st.draw();
  }
  update();
  return { update, dispose: () => { lit = null; st.dispose(); } };
}
