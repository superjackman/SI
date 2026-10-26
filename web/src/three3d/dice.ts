/* R31d scene (K3): two white dice in front and, behind them, a bar chart of the sums 2 to 12 on a white base. Each
   tap rolls the dice 10 more times: the dice tumble and the bars grow. A dotted purple curve shows what the bars
   should look like after very many rolls (7 is the most common sum: 6 ways out of 36). */
import { CatmullRomCurve3, Group, Mesh, TubeGeometry, Vector3 } from 'three';
import { stage } from './core';
import { ball, face, freeObj, glowMat, gloss, paint, rb, rig } from './kit';
import { WAYS, dice, sumCounts } from '../m2/w3d3';
import type { View } from '../m2/s3d';

export interface DiceApi { lang: 'zh' | 'en'; raf: (f: FrameRequestCallback) => number; caf: (id: number) => void; n(): number }
const DX = 0.4, X0 = -2.0, BZ = -0.6, FY = -0.9, HMAX = 2.5, DUR = 0.6;
const PIPS: Record<number, [number, number][]> = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
const pip = (v: number) => paint(128, 128, (g) => { g.fillStyle = v === 1 ? '#e11d48' : '#3b347a'; for (const [x, y] of PIPS[v]!) { g.beginPath(); g.arc(64 + x * 32, 64 + y * 32, v === 1 ? 17 : 12, 0, 7); g.fill(); } });
const side = (v: number) => [1, 2, 3, 4, 5, 6].find((s) => s !== v && s !== 7 - v)!;

export function make(box: HTMLElement, api: DiceApi): View {
  let t = DUR, last = -1;
  const st = stage(box, {
    raf: api.raf, caf: api.caf, cam: [0.6, 3.4, 9], look: [0.05, 0.1, 0], fit: 2.6, yaw: -0.2,
    busy: () => t < DUR, tick: (dt) => { if (t < DUR) { t = Math.min(DUR, t + dt); pose(); } },
  });
  rig(st);
  const P = st.pivot;
  /* the base with the sums 2..12 painted along its front edge */
  const W = 11 * DX + 0.5;
  P.add(rb(W, 0.2, 1.3, 0.08, gloss('#f4f2fc'), X0 + 5 * DX, FY - 0.1, BZ));
  const lab = face(W - 0.2, 0.26, paint(704, 44, (g) => { g.fillStyle = '#5b5591'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; for (let s = 2; s <= 12; s++) g.fillText(String(s), 352 + (s - 7) * 64, 24); }));
  lab.position.set(X0 + 5 * DX, FY - 0.1, BZ + 0.655); P.add(lab);
  const sh = st.blob(1, 0.2); sh.scale.set(2.7, 1.6, 1); sh.position.set(0, FY - 0.22, 0.2); P.add(sh);
  /* the bars */
  const bars = WAYS.map((_, i) => { const m = gloss('#8b5cf6', { emissive: '#7c3aed', glow: 0.1 }); const b = rb(0.3, 1, 0.3, 0.05, m, X0 + i * DX, FY, BZ); P.add(b); return { b, m, h0: 0.02, h1: 0.02 }; });
  /* the two dice */
  const die = (x: number) => {
    const g = new Group(); g.position.set(x, FY + 0.32, 1.25); P.add(g);
    g.add(rb(0.62, 0.62, 0.62, 0.12, gloss('#ffffff')));
    const top = face(0.5, 0.5, pip(1)); top.rotation.x = -Math.PI / 2; top.position.y = 0.312; g.add(top);
    const fr = face(0.5, 0.5, pip(2)); fr.position.z = 0.312; g.add(fr);
    return { g, top, fr, spin: 0 };
  };
  const dd = [die(-1.55), die(-0.7)];
  const pin = st.tag('', 'pin up');
  let curve: Mesh | null = null, dots: Group | null = null;
  function pose() {
    const e = 1 - (1 - t / DUR) ** 3;
    bars.forEach((b) => { const h = b.h0 + (b.h1 - b.h0) * e; b.b.scale.y = h; b.b.position.y = FY + h / 2; });
    dd.forEach((d, i) => { d.g.rotation.set((1 - e) * 6.3 * (i ? 1 : -1), (1 - e) * 3.1, 0); d.g.position.y = FY + 0.32 + Math.sin(e * Math.PI) * 0.5 * (t < DUR ? 1 : 0); });
  }
  function update() {
    const n = api.n(), c = sumCounts(n), top = Math.max(1, ...c);
    /* the bar scale: the expected tallest bar (n × 6/36) or the tallest real bar, whichever is bigger */
    const unit = HMAX / Math.max(top, (n * 6) / 36, 3);
    bars.forEach((b, i) => { b.h0 = b.b.scale.y; b.h1 = Math.max(0.02, c[i]! * unit); b.m.color.set(c[i] === top && n > 0 ? '#6d28d9' : '#a78bfa'); });
    /* the expected curve */
    if (curve) freeObj(curve); if (dots) freeObj(dots);
    curve = null; dots = null;
    if (n > 0) {
      const pts = WAYS.map((w, i) => new Vector3(X0 + i * DX, FY + 0.06 + ((n * w) / 36) * unit, BZ - 0.3));
      curve = new Mesh(new TubeGeometry(new CatmullRomCurve3(pts), 80, 0.025, 8, false), glowMat('#7c3aed', 0.55)); P.add(curve);
      dots = new Group(); for (const p of pts) dots.add(ball(0.05, gloss('#7c3aed'), p.x, p.y, p.z)); P.add(dots);
    }
    const r = n > 0 ? dice(n)[n - 1]! : [1, 2];
    dd.forEach((d, i) => {
      const v = r[i]!;
      for (const f of [d.top, d.fr]) (f.material as Mesh['material'] & { map: { dispose(): void } | null }).map?.dispose();
      freeObj(d.top); freeObj(d.fr);
      d.top = face(0.5, 0.5, pip(v)); d.top.rotation.x = -Math.PI / 2; d.top.position.y = 0.312; d.g.add(d.top);
      d.fr = face(0.5, 0.5, pip(side(v))); d.fr.position.z = 0.312; d.g.add(d.fr);
    });
    const k = c.indexOf(top);
    pin.show(n > 0); pin.at.set(X0 + k * DX, FY + top * unit + 0.12, BZ);
    pin.set(`${api.lang === 'en' ? `${k + 2}: ` : `和 ${k + 2}：`}<b>${top}</b>${api.lang === 'en' ? '×' : ' 次'}`);
    if (n !== last && last >= 0 && n > last) t = 0; else { t = DUR; }
    last = n; pose(); st.draw();
  }
  update();
  return { update, dispose: () => { if (curve) freeObj(curve); if (dots) freeObj(dots); st.dispose(); } };
}
