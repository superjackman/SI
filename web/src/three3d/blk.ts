/* R31d scene (T4): one Transformer block as a tall stack of seven frosted glass plates (bottom: the words come in;
   top: out to the next block). Each plate carries its own little picture (a wave, numbered dots, a web of looks, two
   tidy bars, a small net, an arrow), drawn on a canvas. A Step button under the stage lights the next plate in purple
   and lifts a glowing packet up to it along a beam of light; the plate's name sits on a small label at its right. */
import { Group, Mesh, Vector3 } from 'three';
import { stage } from './core';
import { ball, cyl, face, glowMat, gloss, paint, rb, rig, std } from './kit';
import { BLK } from '../m2/w3d3';
import type { View } from '../m2/s3d';

export interface BlkApi { lang: 'zh' | 'en'; raf: (f: FrameRequestCallback) => number; caf: (id: number) => void; k(): number }
const N = BLK.length, DY = 0.66, Y0 = -1.95, PW = 2.7, PD = 1.7;
const yOf = (i: number) => Y0 + i * DY;
const DUR = 0.55;

/** the little picture on each plate (256 × 160 px) */
function art(i: number, on: boolean) {
  return paint(256, 160, (g, w, h) => {
    const c = on ? '#ffffff' : '#7c6cf0', soft = on ? 'rgba(255,255,255,.55)' : 'rgba(124,108,240,.4)';
    g.strokeStyle = c; g.fillStyle = c; g.lineWidth = 3; g.lineCap = 'round';
    const dot = (x: number, y: number, r = 6) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
    const pts: [number, number][] = [];
    for (let k = 0; k < 6; k++) pts.push([30 + k * 39, 80 + Math.sin(k * 1.7 + i) * 34]);
    if (i === 0) { g.beginPath(); for (let x = 16; x <= w - 16; x += 4) { const y = h / 2 + Math.sin(x / 18) * 30 * Math.sin(x / 70); x === 16 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
    else if (i === 1) { g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; for (let k = 0; k < 5; k++) { dot(36 + k * 46, 64, 9); g.fillText(String(k + 1), 36 + k * 46, 120); } }
    else if (i === 2 || i === 4) {
      g.strokeStyle = soft; g.lineWidth = 2;
      for (const a of pts) for (const b of pts) if (a !== b && (i === 2 || Math.abs(a[0] - b[0]) < 50)) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
      for (const p of pts) dot(p[0], p[1], 7);
    } else if (i === 3 || i === 5) { for (let k = 0; k < 8; k++) { const y = 30 + k * 14; g.globalAlpha = 0.5 + 0.06 * k; g.fillRect(28, y, w - 56 - (k % 3) * 20, 7); } }
    else { g.lineWidth = 8; g.beginPath(); g.moveTo(w / 2, h - 24); g.lineTo(w / 2, 34); g.stroke(); g.beginPath(); g.moveTo(w / 2 - 30, 62); g.lineTo(w / 2, 30); g.lineTo(w / 2 + 30, 62); g.stroke(); for (let k = 0; k < 4; k++) dot(54 + k * 50, 130, 6); }
  });
}

export function make(box: HTMLElement, api: BlkApi): View {
  const en = api.lang === 'en';
  let t = DUR, from = -1, to = -1;
  const st = stage(box, {
    raf: api.raf, caf: api.caf, cam: [2.6, 4.2, 8.8], look: [0.45, 0.05, 0], fit: 2.75, yaw: -0.5,
    busy: () => t < DUR, tick: (dt) => { if (t < DUR) { t = Math.min(DUR, t + dt); pose(); } },
  });
  rig(st);
  const P = st.pivot;
  /* the base: a soft white puck with a shadow */
  P.add(cyl(1.9, 2.0, 0.22, gloss('#f3f1fb'), 0, Y0 - 0.45, 0));
  const sh = st.blob(1, 0.25); sh.scale.set(2.6, 2.0, 1); sh.position.set(0, Y0 - 0.57, 0); P.add(sh);
  /* the plates */
  const plates = BLK.map((_, i) => {
    const g = new Group(); g.position.set(0, yOf(i), 0); P.add(g);
    const m = std('#eeebff', 0.12, 0.05, { opacity: 0.72 }); m.depthWrite = false;
    const slab = rb(PW, 0.13, PD, 0.06, m); slab.renderOrder = 3; g.add(slab);
    const edge = rb(PW + 0.04, 0.03, PD + 0.04, 0.02, gloss('#c9c0f7'), 0, -0.07, 0); g.add(edge);
    const pics = [false, true].map((on) => { const f = face(PW * 0.86, PD * 0.86, art(i, on)); f.rotation.x = -Math.PI / 2; f.position.y = 0.075; f.renderOrder = 4; f.visible = !on; g.add(f); return f; });
    const glow = rb(PW + 0.25, 0.2, PD + 0.25, 0.1, glowMat('#a78bfa', 0.35)); glow.visible = false; g.add(glow);
    const tag = st.tag(en ? BLK[i]![1] : BLK[i]![0], 'side k'); tag.at.set(PW / 2 + 0.05, yOf(i), 0.2);
    return { g, m, pics, glow, tag };
  });
  /* the beam of light through the middle and the packet riding up it */
  const beam = cyl(0.05, 0.05, N * DY, glowMat('#c4b5fd', 0.5), 0, Y0 + ((N - 1) * DY) / 2, 0); P.add(beam);
  const pkt = new Group(); pkt.add(ball(0.13, gloss('#ffffff', { emissive: '#c4b5fd', glow: 1.2 })), ball(0.3, glowMat('#8b5cf6', 0.3))); P.add(pkt);
  const pos = new Vector3();
  function pose() {
    const e = 1 - (1 - t / DUR) ** 3, y = from < 0 ? Y0 - 0.3 : yOf(from), y1 = to < 0 ? Y0 - 0.3 : yOf(to);
    pos.set(0, y + (y1 - y) * e + 0.18, 0); pkt.position.copy(pos);
  }
  function update() {
    const k = api.k();
    plates.forEach((p, i) => {
      const on = i === k, done = k >= 0 && i < k;
      p.m.color.set(on ? '#7c5cf0' : done ? '#ddd6fe' : '#eeebff'); p.m.opacity = on ? 0.92 : 0.72;
      p.pics[0]!.visible = !on; p.pics[1]!.visible = on; p.glow.visible = on;
      p.tag.el.classList.toggle('k', !on);
    });
    (beam.material as Mesh['material'] & { opacity: number }).opacity = k >= 0 ? 0.55 : 0.25;
    if (k !== to) { from = to; to = k; t = 0; } else t = DUR;
    pose(); st.draw();
  }
  update();
  return { update, dispose: () => st.dispose() };
}
