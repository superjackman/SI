/* R31d scene (T3): guess the next word. On a frosted glass tray stand the word cubes 「小猫 坐 在 ？」; behind them rise
   four glass bars, one per possible next word (垫子上, 沙发上, 地上, 月亮上), as tall as its chance. The randomness
   slider squeezes the bars together (high randomness) or lets the top one tower (low randomness). */
import { Group } from 'three';
import { stage } from './core';
import { face, glowMat, gloss, paint, rb, rig, std } from './kit';
import { NEXT, nextP, pc } from '../m2/w3d3';
import type { View } from '../m2/s3d';

export interface NextApi { lang: 'zh' | 'en'; raf: (f: FrameRequestCallback) => number; caf: (id: number) => void; t(): number }
const HMAX = 3.2, FY = -1.3, BX = [-1.74, -0.58, 0.58, 1.74];
const SENT: [string, string][] = [['小猫', 'The'], ['坐', 'cat'], ['在', 'sat on'], ['？', '?']];

const word = (s: string, on: boolean) => paint(160, 160, (g, w, h) => {
  g.fillStyle = on ? '#ffffff' : '#3b3570'; g.font = `bold ${s.length > 3 ? 40 : s.length > 1 ? 54 : 74}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, w / 2, h / 2 + 3);
});

export function make(box: HTMLElement, api: NextApi): View {
  const en = api.lang === 'en';
  const st = stage(box, { raf: api.raf, caf: api.caf, cam: [0.4, 3.0, 9], look: [0, 0.2, 0], fit: 2.75, yaw: -0.22 });
  rig(st);
  const P = st.pivot;
  /* the tray */
  const tm = std('#f1eeff', 0.1, 0.05, { opacity: 0.85 });
  P.add(rb(5.0, 0.26, 3.0, 0.12, tm, 0, FY - 0.13, 0.1));
  P.add(rb(5.2, 0.06, 3.2, 0.03, gloss('#d9d2fb'), 0, FY - 0.29, 0.1));
  const sh = st.blob(1, 0.2); sh.scale.set(2.8, 1.8, 1); sh.position.set(0, FY - 0.34, 0.1); P.add(sh);
  /* the sentence cubes along the front */
  SENT.forEach(([zh, e], i) => {
    const last = i === SENT.length - 1, g = new Group(); g.position.set(-1.65 + i * 1.1, FY + 0.33, 1.05); g.rotation.y = 0.05; P.add(g);
    g.add(rb(0.9, 0.62, 0.62, 0.12, last ? gloss('#7c5cf0', { emissive: '#7c5cf0', glow: 0.3 }) : std('#ffffff', 0.12, 0.05, { opacity: 0.92 })));
    const f = face(0.62, 0.62, word(en ? e : zh, last)); f.position.z = 0.315; g.add(f);
  });
  /* the bars */
  const bars = NEXT.map((_, i) => {
    const m = std('#a78bfa', 0.12, 0.05, { opacity: 0.8, emissive: '#7c3aed', glow: 0.1 });
    const b = rb(0.62, 1, 0.62, 0.1, m, BX[i]!, FY, -0.45); P.add(b);
    const cap = rb(0.66, 0.06, 0.66, 0.03, glowMat('#ede9fe', 0.9), BX[i]!, FY, -0.45); P.add(cap);
    const tag = st.tag('', 'pct two');
    return { b, m, cap, tag };
  });
  function update() {
    const p = nextP(api.t()), top = p.indexOf(Math.max(...p));
    bars.forEach((x, i) => {
      const h = Math.max(0.08, p[i]! * HMAX);
      x.b.scale.y = h; x.b.position.y = FY + h / 2; x.cap.position.y = FY + h;
      x.m.color.set(i === top ? '#7c5cf0' : '#c4b5fd'); x.m.opacity = i === top ? 0.95 : 0.78;
      x.tag.at.set(BX[i]!, FY + h + 0.42, -0.45);
      x.tag.set(`${en ? NEXT[i]![1] : NEXT[i]![0]}<br><b>${pc(p[i]!)}%</b>`); x.tag.el.classList.toggle('on', i === top);
    });
    st.draw();
  }
  update();
  return { update, dispose: () => st.dispose() };
}
