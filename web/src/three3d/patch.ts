/* R31d scene (T6): a picture and a word in one space. On the left a picture of a cat is cut into square patches that
   float apart a little, like tiles; on the right the word 「猫」 (cat) stands in big purple letters with a glass ball
   beside it. A soft ripple on the floor joins them: both become the same kind of "word" for the model. The slider
   picks how many patches per side (2, 3 or 4). */
import { Group } from 'three';
import { stage } from './core';
import { ball, face, freeObj, glass, glowDisc, gloss, paint, rb, rig, ring, glowMat } from './kit';
import type { View } from '../m2/s3d';

export interface PatchApi { lang: 'zh' | 'en'; raf: (f: FrameRequestCallback) => number; caf: (id: number) => void; g(): number }
const S = 2.3, CX = -1.15, CY = 0.55;

/** a friendly orange cat, drawn */
function cat() {
  return paint(512, 512, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#dbeafe'); bg.addColorStop(1, '#f5efe6'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e9dcc8'; g.fillRect(0, 400, w, 112);
    /* body */
    g.fillStyle = '#f59e0b'; g.beginPath(); g.ellipse(256, 420, 150, 110, 0, 0, 7); g.fill();
    /* ears */
    g.beginPath(); g.moveTo(130, 190); g.lineTo(150, 60); g.lineTo(235, 140); g.fill();
    g.beginPath(); g.moveTo(382, 190); g.lineTo(362, 60); g.lineTo(277, 140); g.fill();
    g.fillStyle = '#fbcfe8'; g.beginPath(); g.moveTo(155, 160); g.lineTo(162, 95); g.lineTo(210, 140); g.fill();
    g.beginPath(); g.moveTo(357, 160); g.lineTo(350, 95); g.lineTo(302, 140); g.fill();
    /* head */
    g.fillStyle = '#fbbf24'; g.beginPath(); g.ellipse(256, 235, 145, 125, 0, 0, 7); g.fill();
    g.strokeStyle = '#d97706'; g.lineWidth = 10; g.lineCap = 'round';
    for (const x of [-30, 0, 30]) { g.beginPath(); g.moveTo(256 + x, 120); g.lineTo(256 + x * 0.8, 160); g.stroke(); }
    /* muzzle, eyes, nose */
    g.fillStyle = '#fff7ed'; g.beginPath(); g.ellipse(256, 290, 70, 48, 0, 0, 7); g.fill();
    for (const x of [200, 312]) { g.fillStyle = '#065f46'; g.beginPath(); g.ellipse(x, 225, 22, 28, 0, 0, 7); g.fill(); g.fillStyle = '#111827'; g.beginPath(); g.ellipse(x, 228, 9, 22, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 7, 215, 6, 0, 7); g.fill(); }
    g.fillStyle = '#f472b6'; g.beginPath(); g.moveTo(240, 270); g.lineTo(272, 270); g.lineTo(256, 288); g.fill();
    g.strokeStyle = '#7c2d12'; g.lineWidth = 4; g.beginPath(); g.moveTo(256, 288); g.quadraticCurveTo(240, 312, 226, 300); g.moveTo(256, 288); g.quadraticCurveTo(272, 312, 286, 300); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3;
    for (const s of [-1, 1]) for (const d of [-14, 0, 14]) { g.beginPath(); g.moveTo(256 + s * 60, 290 + d * 0.5); g.lineTo(256 + s * 160, 280 + d * 1.6); g.stroke(); }
  });
}
const wordTex = (s: string) => paint(512, 320, (g, w, h) => {
  g.font = `900 ${s.length > 1 ? 190 : 250}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(76,29,149,.25)'; g.fillText(s, w / 2 + 10, h / 2 + 14);
  const gr = g.createLinearGradient(0, 40, 0, h - 40); gr.addColorStop(0, '#8b5cf6'); gr.addColorStop(1, '#5b21b6'); g.fillStyle = gr; g.fillText(s, w / 2, h / 2);
});

export function make(box: HTMLElement, api: PatchApi): View {
  const en = api.lang === 'en';
  const st = stage(box, { raf: api.raf, caf: api.caf, cam: [0.3, 1.6, 9], look: [0, 0.15, 0], fit: 2.55, yaw: -0.18 });
  rig(st);
  const P = st.pivot;
  const pic = cat();
  /* the floor ripple that joins the two */
  const disc = glowDisc(2.6, 'rgba(167,139,250,.9)', 0.55); disc.position.set(0, -1.55, 0.2); P.add(disc);
  for (const r of [1.2, 1.8, 2.4]) { const o = ring(r, 0.012, glowMat('#a78bfa', 0.5)); o.rotation.x = Math.PI / 2; o.position.set(0, -1.54, 0.2); o.scale.set(1.25, 1, 1); P.add(o); }
  /* the word and the glass ball */
  const wd = face(2.0, 1.25, wordTex(en ? 'cat' : '猫')); wd.position.set(1.2, 0.05, 0.3); P.add(wd);
  const gb = ball(0.45, glass('#ede9fe', 0.45), 1.35, -1.05, 0.7); gb.renderOrder = 6; P.add(gb);
  P.add(ball(0.2, gloss('#c4b5fd', { emissive: '#a78bfa', glow: 0.5 }), 1.35, -1.05, 0.7));
  const lw = st.tag(en ? 'word' : '文字', 'ax'); lw.at.set(1.2, -1.75, 0.6);
  const lp = st.tag(en ? 'picture' : '图片', 'ax'); lp.at.set(CX, -1.75, 0.6);
  let tiles: Group | null = null;
  const texs: ReturnType<typeof pic.clone>[] = [];
  function update() {
    const n = api.g();
    if (tiles) freeObj(tiles); for (const x of texs.splice(0)) x.dispose();
    tiles = new Group(); P.add(tiles);
    const s = S / n, gap = 0.1 + 0.05 * (4 - n);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const tx = pic.clone(); tx.repeat.set(1 / n, 1 / n); tx.offset.set(c / n, 1 - (r + 1) / n); tx.needsUpdate = true; texs.push(tx);
      const x = CX + (c - (n - 1) / 2) * (s + gap), y = CY - (r - (n - 1) / 2) * (s + gap), z = Math.sin(r * 2.1 + c * 1.3) * 0.12;
      const g = new Group(); g.position.set(x, y, z); g.rotation.y = 0.12; tiles.add(g);
      g.add(rb(s, s, 0.06, Math.min(0.05, s * 0.08), gloss('#ffffff')));
      const f = face(s * 0.94, s * 0.94, tx); f.position.z = 0.032; g.add(f);
    }
    st.draw();
  }
  update();
  return { update, dispose: () => { for (const x of texs) x.dispose(); st.dispose(); } };
}
