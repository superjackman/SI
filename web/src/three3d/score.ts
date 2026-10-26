/* R31d scene (T4b): a tall frosted glass rack with six word cards on shelves (an emoji and a word each). Each card
   carries a glowing score bar: the brighter and longer, the better the word fits the sentence. A thought vector (a
   beam of light) points into the rack from the left. The button picks the highest score: that card turns purple,
   slides forward a little and a pin shows its score. */
import { Group, Mesh } from 'three';
import { stage } from './core';
import { cyl, face, glass, glowMat, gloss, paint, rb, rig, rr } from './kit';
import { SCORE, bestScore } from '../m2/w3d3';
import type { View } from '../m2/s3d';

export interface ScoreApi { lang: 'zh' | 'en'; raf: (f: FrameRequestCallback) => number; caf: (id: number) => void; picked(): boolean }
const N = SCORE.length, DY = 0.66, Y0 = -1.6, CW = 2.5, CH = 0.5, DUR = 0.45;
const EMO = ['🍎', '🍌', '🚗', '🐶', '🍰', '📘'];

function card(i: number, on: boolean, en: boolean) {
  const [zh, e, s] = SCORE[i]!;
  return paint(512, 112, (g, _w, h) => {
    g.font = '58px sans-serif'; g.textBaseline = 'middle'; g.fillText(EMO[i]!, 22, h / 2 + 4);
    g.fillStyle = on ? '#ffffff' : '#2e2a5c'; g.font = `bold ${en ? 44 : 50}px sans-serif`; g.fillText(en ? e : zh, 104, h / 2 + 2);
    /* the score bar on the right */
    const x = 300, bw = 180;
    g.fillStyle = on ? 'rgba(255,255,255,.3)' : '#ece9fb'; rr(g, x, h / 2 - 11, bw, 22, 11); g.fill();
    g.fillStyle = on ? '#ffffff' : `rgba(109,92,231,${0.35 + s * 0.65})`; rr(g, x, h / 2 - 11, Math.max(22, bw * s), 22, 11); g.fill();
  });
}

export function make(box: HTMLElement, api: ScoreApi): View {
  const en = api.lang === 'en';
  let t = DUR, was = false;
  const st = stage(box, {
    raf: api.raf, caf: api.caf, cam: [0.8, 1.4, 9], look: [-0.45, 0.32, 0], fit: 2.35, yaw: -0.22,
    busy: () => t < DUR, tick: (dt) => { if (t < DUR) { t = Math.min(DUR, t + dt); pose(); } },
  });
  rig(st);
  const P = st.pivot;
  /* the rack: a base, two glass side walls, a glass back and a top cap */
  const H = N * DY + 0.5, yc = Y0 + ((N - 1) * DY) / 2;
  P.add(rb(CW + 0.7, 0.28, 1.4, 0.1, gloss('#f4f2fc'), 0, Y0 - 0.5, 0));
  P.add(rb(CW + 0.7, 0.16, 1.4, 0.06, gloss('#f4f2fc'), 0, Y0 - 0.42 + H, 0));
  const sh = st.blob(1, 0.22); sh.scale.set(2.4, 1.3, 1); sh.position.set(0, Y0 - 0.66, 0); P.add(sh);
  for (const x of [-1, 1]) { const w = rb(0.08, H, 1.3, 0.03, glass('#f1eeff', 0.32), x * (CW / 2 + 0.28), yc, 0); w.renderOrder = 5; P.add(w); }
  const back = rb(CW + 0.5, H, 0.06, 0.02, glass('#e4defe', 0.35), 0, yc, -0.6); P.add(back);
  /* the shelves and their cards */
  const best = SCORE.indexOf(bestScore());
  const cards = SCORE.map((_, i) => {
    const y = Y0 + (N - 1 - i) * DY;
    P.add(rb(CW + 0.45, 0.04, 1.2, 0.015, glass('#ffffff', 0.55), 0, y - CH / 2 - 0.05, 0));
    const g = new Group(); g.position.set(0, y, 0.1); P.add(g);
    const m = gloss('#ffffff'); g.add(rb(CW, CH, 0.22, 0.08, m));
    const f = [false, true].map((on) => { const o = face(CW * 0.94, CW * 0.94 * 112 / 512, card(i, on, en)); o.position.z = 0.115; o.visible = !on; g.add(o); return o; });
    return { g, m, f };
  });
  const glowBox = rb(CW + 0.3, CH + 0.26, 0.3, 0.14, glowMat('#a78bfa', 0.35)); glowBox.visible = false; cards[best]!.g.add(glowBox);
  /* the thought vector: a light beam with an arrow head pointing into the best row */
  const yb = Y0 + (N - 1 - best) * DY;
  const beam = cyl(0.045, 0.045, 1.0, glowMat('#8b5cf6', 0.7), -CW / 2 - 1.05, yb, 0.1); beam.rotation.z = Math.PI / 2; P.add(beam);
  const halo = cyl(0.14, 0.14, 1.0, glowMat('#c4b5fd', 0.3), -CW / 2 - 1.05, yb, 0.1); halo.rotation.z = Math.PI / 2; P.add(halo);
  const tip = cyl(0, 0.14, 0.3, gloss('#7c5cf0', { emissive: '#7c5cf0', glow: 0.5 }), -CW / 2 - 0.48, yb, 0.1); tip.rotation.z = -Math.PI / 2; P.add(tip);
  const tv = st.tag(en ? 'Thought' : '想法', 'ax'); tv.at.set(-CW / 2 - 1.0, yb + 0.4, 0.1);
  const pin = st.tag('', 'pin up'); pin.at.set(CW / 2 - 0.25, yb + CH / 2 + 0.12, 0.6);
  function pose() {
    const e = 1 - (1 - t / DUR) ** 3, on = api.picked(), k = on ? e : 1 - e;
    cards[best]!.g.position.z = 0.1 + 0.45 * k;
    pin.at.z = 0.6 + 0.45 * k;
  }
  function update() {
    const on = api.picked();
    cards.forEach((c, i) => {
      const me = on && i === best;
      c.m.color.set(me ? '#7c5cf0' : '#ffffff'); c.f[0]!.visible = !me; c.f[1]!.visible = me;
      (c.f[0]!.material as Mesh['material'] & { opacity: number }).opacity = on && !me ? 0.55 : 1;
    });
    glowBox.visible = on; pin.show(on); pin.set(`<b>${SCORE[best]![2].toFixed(2)}</b> ${en ? 'top' : '最高'}`);
    if (on !== was) { was = on; t = 0; } else t = DUR;
    pose(); st.draw();
  }
  update();
  return { update, dispose: () => st.dispose() };
}
