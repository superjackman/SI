/* R31d scene (T2): the agent loop. A glowing ring lies on the floor; on it stand the model (a brain under a glass
   dome), a blue toolbox and a result clipboard. A bright dot runs round the ring step by step: model → tools →
   result → model, and on the last step it leaves the ring to the answer card at the right. */
import { Group, Mesh, Vector3 } from 'three';
import { stage } from './core';
import { ball, cyl, face, glass, glowDisc, glowMat, gloss, iconTex, paint, rb, rig, ring, rr } from './kit';
import { LOOP_AT } from '../m2/w3d3';
import type { View } from '../m2/s3d';

export interface LoopApi { lang: 'zh' | 'en'; raf: (f: FrameRequestCallback) => number; caf: (id: number) => void; k(): number }
const R = 2.0, FY = -1.0, DUR = 0.7;
const ANG = { model: 90, tools: 210, result: 330 } as const;
const on = (deg: number, y = FY) => { const a = (deg * Math.PI) / 180; return new Vector3(R * Math.cos(a), y, -R * Math.sin(a)); };
const ANS = new Vector3(2.75, -0.35, -1.55);

export function make(box: HTMLElement, api: LoopApi): View {
  const en = api.lang === 'en';
  let t = DUR, a0 = 90, a1 = 90, out0 = 0, out1 = 0, last = -2;
  const st = stage(box, {
    raf: api.raf, caf: api.caf, cam: [0, 5.2, 7.8], look: [0.3, -1.05, 0.3], fit: 3.15, yaw: -0.12,
    busy: () => t < DUR, tick: (dt) => { if (t < DUR) { t = Math.min(DUR, t + dt); pose(); } },
  });
  rig(st);
  const P = st.pivot;
  /* the floor disc and the ring */
  P.add(cyl(2.75, 2.85, 0.14, gloss('#f3f0fc'), 0, FY - 0.12, 0));
  const sh = st.blob(1, 0.18); sh.scale.set(3.1, 3.1, 1); sh.position.set(0, FY - 0.2, 0); P.add(sh);
  const rg = ring(R, 0.05, gloss('#8b5cf6', { emissive: '#8b5cf6', glow: 0.5 })); rg.rotation.x = Math.PI / 2; rg.position.y = FY + 0.02; P.add(rg);
  const rh = ring(R, 0.13, glowMat('#c4b5fd', 0.3)); rh.rotation.x = Math.PI / 2; rh.position.y = FY + 0.02; P.add(rh);
  /* the exit path from the ring (at 20°) to the answer card */
  const ex0 = on(55, FY + 0.02);
  const path = cyl(0.04, 0.04, ex0.distanceTo(ANS), glowMat('#a78bfa', 0.55)); path.position.copy(ex0).lerp(ANS, 0.5);
  path.lookAt(ANS); path.rotateX(Math.PI / 2); P.add(path);
  /* the model: a brain in a glass dome on a white plinth */
  const mp = on(ANG.model), model = new Group(); model.position.copy(mp); P.add(model);
  model.add(cyl(0.62, 0.7, 0.32, gloss('#ffffff'), 0, 0.16, 0));
  const brain = ball(0.42, gloss('#8b5cf6', { emissive: '#7c3aed', glow: 0.25 }), 0, 0.78, 0); brain.scale.set(1.15, 0.9, 0.95); model.add(brain);
  const bf = face(0.62, 0.62, iconTex('brain', '#ffffff')); bf.position.set(0, 0.8, 0.43); model.add(bf);
  const dome = ball(0.6, glass('#efeaff', 0.28), 0, 0.72, 0); dome.renderOrder = 6; model.add(dome);
  /* the toolbox */
  const tp = on(ANG.tools), tools = new Group(); tools.position.copy(tp); tools.rotation.y = 0.5; P.add(tools);
  tools.add(rb(1.0, 0.56, 0.6, 0.08, gloss('#3b82f6'), 0, 0.28, 0));
  tools.add(rb(1.04, 0.1, 0.64, 0.04, gloss('#2563eb'), 0, 0.58, 0));
  const hd = ring(0.2, 0.04, gloss('#1e3a8a')); hd.position.set(0, 0.66, 0); tools.add(hd);
  const tf = face(0.42, 0.42, iconTex('wrench', '#ffffff')); tf.position.set(0, 0.28, 0.305); tools.add(tf);
  /* the result clipboard */
  const rp = on(ANG.result), res = new Group(); res.position.copy(rp); res.rotation.y = -0.45; P.add(res);
  const board = rb(0.78, 1.0, 0.08, 0.06, gloss('#ffffff'), 0, 0.55, 0); board.rotation.x = -0.18; res.add(board);
  const clip = rb(0.34, 0.1, 0.1, 0.03, gloss('#a5b4fc'), 0, 1.04, 0.06); res.add(clip);
  const rf = face(0.62, 0.8, paint(124, 160, (g, w) => {
    g.strokeStyle = '#c7c2e6'; g.lineWidth = 6; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(22, 30 + i * 20); g.lineTo(w - 22, 30 + i * 20); g.stroke(); }
    g.strokeStyle = '#6d5ce7'; g.lineWidth = 7; g.beginPath(); g.arc(w / 2, 118, 24, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(w / 2 - 11, 118); g.lineTo(w / 2 - 2, 127); g.lineTo(w / 2 + 12, 109); g.stroke();
  })); rf.position.set(0, 0.52, 0.05); rf.rotation.x = -0.18; res.add(rf);
  /* the answer card */
  const ans = new Group(); ans.position.copy(ANS); P.add(ans);
  const am = gloss('#ffffff'); ans.add(rb(0.95, 0.7, 0.12, 0.1, am));
  const af = face(0.8, 0.56, paint(160, 112, (g, w, h) => {
    g.fillStyle = '#6d5ce7'; rr(g, 34, 24, 92, 46, 18); g.fill(); g.beginPath(); g.moveTo(52, 68); g.lineTo(46, 88); g.lineTo(70, 68); g.fill();
    g.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(w / 2 - 20 + i * 20, 47, 6, 0, 7); g.fill(); }
    void h;
  })); af.position.z = 0.065; ans.add(af);
  /* the glow under the active part, the running dot */
  const pool = glowDisc(0.95, 'rgba(139,92,246,.9)', 0.55); P.add(pool);
  const dot = new Group(); dot.add(ball(0.13, gloss('#ffffff', { emissive: '#c4b5fd', glow: 1.2 })), ball(0.3, glowMat('#8b5cf6', 0.35))); P.add(dot);
  const L = (zh: string, e: string, p: Vector3, dz = 0.7) => { const g = st.tag(en ? e : zh, 'ax'); g.at.set(p.x, FY + 0.05, p.z + dz); return g; };
  const tags = { model: L('模型', 'Model', mp, 0.85), tools: L('工具', 'Tools', tp), result: L('结果', 'Result', rp), answer: st.tag(en ? 'Answer' : '回答', 'ax') };
  tags.answer.at.set(ANS.x, ANS.y - 0.62, ANS.z);
  const where = (k: number) => (k < 0 ? 'model' : LOOP_AT[Math.min(k, LOOP_AT.length - 1)]!);
  function pose() {
    const e = 1 - (1 - t / DUR) ** 3, a = a0 + (a1 - a0) * e, o = out0 + (out1 - out0) * e;
    const p = on(a, FY + 0.12).lerp(new Vector3(ANS.x, ANS.y + 0.5, ANS.z), o);
    dot.position.copy(p);
  }
  function update() {
    const k = api.k(), w = where(k);
    /* the angle the dot is at, always moving forward round the ring */
    const target = w === 'answer' ? 55 : ANG[w as keyof typeof ANG];
    if (last === -2 || k < 0) { a0 = a1 = 90; out0 = out1 = 0; t = DUR; }
    else if (k !== last) { a0 = a1 % 360; out0 = out1; a1 = target; out1 = w === 'answer' ? 1 : 0; if (w !== 'answer' && a1 < a0) a1 += 360; t = 0; }
    last = k;
    const at = w === 'answer' ? ANS : w === 'model' ? mp : w === 'tools' ? tp : rp;
    pool.position.set(at.x, FY + 0.03, at.z); pool.visible = k >= 0;
    for (const [n, g] of Object.entries(tags)) g.el.classList.toggle('on', n === w && k >= 0);
    (brain.material as Mesh['material'] & { emissiveIntensity: number }).emissiveIntensity = w === 'model' ? 0.5 : 0.2;
    am.color.set(w === 'answer' ? '#ede9fe' : '#ffffff');
    pose(); st.draw();
  }
  update();
  return { update, dispose: () => st.dispose() };
}
