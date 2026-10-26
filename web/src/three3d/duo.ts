/* R31b scene (U): together, or on its own. The stage is split down the middle into two rooms that fill it. Left, a warm
   sunny room: a big person in a hoodie types at a laptop, a cute robot sits beside them; window light falls on the
   desk, a plant, a mug, a notebook. Right, a blue room at night (R31d: clear blue, not purplish grey; warm walnut desk): the robot works alone at a laptop showing a checklist
   under a glowing desk lamp, and at the back a dark waving figure says 「稍后检查 🕘」. The 「一起干 / 自己干」 capsule
   sits at the top of the stage (HTML, in the lab); the chosen side keeps its colours, the other is washed out a little.
   Nothing moves on its own (render on demand). */
import { Color, Group, Vector3, type Mesh, type MeshStandardMaterial } from 'three';
import { stage } from './core';
import { ball, cyl, face, glowDisc, gloss, laptop, matte, mug, paint, plant, rb, rig, robot, person, rr, drawIcon, std, woodTex } from './kit';
import type { Duo } from '../m2/w3d2';
import type { View } from '../m2/s3d';

export interface DuoApi { lang: 'zh' | 'en'; raf: (f: FrameRequestCallback) => number; caf: (id: number) => void; mode(): Duo; set(m: Duo): void }
const HW = 1.3; /* half width of each room */
const TOP = 1.25; /* desk top */

function desk(g: Group, wood: string, line: string) {
  const m = std('#ffffff', 0.55, 0, { map: woodTex(wood, line) });
  g.add(rb(HW * 2 - 0.04, 0.16, 2.1, 0.05, m, 0, TOP - 0.08, 0.75));
  g.add(rb(HW * 2 - 0.04, 1.1, 0.1, 0.03, matte(wood), 0, TOP - 0.7, 1.72));
  /* two drawers with knobs on the front */
  for (const x of [-HW / 2, HW / 2]) { g.add(rb(HW * 0.85, 0.42, 0.04, 0.03, matte(wood), x, TOP - 0.42, 1.78)); g.add(ball(0.05, gloss('#e8e2d8'), x, TOP - 0.42, 1.81)); }
}
function books(g: Group, x: number, y: number, cs: string[]) {
  cs.forEach((c, i) => { const b = rb(0.14, 0.42 + (i % 2) * 0.08, 0.3, 0.03, gloss(c), x + i * 0.16, y + 0.22 + (i % 2) * 0.04, -0.92); g.add(b); });
}
function paper(g: Group, x: number, z: number, ry: number, pen = true) {
  const p = rb(0.62, 0.025, 0.46, 0.01, matte('#fbfaf6'), x, TOP + 0.015, z); p.rotation.y = ry; g.add(p);
  for (let i = 0; i < 3; i++) { const l = rb(0.4, 0.006, 0.025, 0.003, matte('#b9c0d8'), 0, 0.016, -0.1 + i * 0.1); p.add(l); }
  if (pen) { const pn = cyl(0.02, 0.02, 0.5, gloss('#2f3a5f'), x + 0.08, TOP + 0.05, z + 0.02); pn.rotation.set(0, 0, Math.PI / 2); pn.rotation.y = ry + 0.5; g.add(pn); }
}

/** R31d: the night room's walls and floor glow their own navy (dark base + emissive), so the soft lavender sky light
    cannot wash them into a purplish grey */
const night = (c: string) => { const m = std('#101828', 0.9, 0, { emissive: c, glow: 1 }); m.name = 'night'; return m; };

export function make(box: HTMLElement, api: DuoApi): View {
  const en = api.lang === 'en', T = (zh: string, e: string) => (en ? e : zh);
  const st = stage(box, {
    raf: api.raf, caf: api.caf, cam: [0, 5.4, 9.0], look: [0, 2.8, 0.3], fit: 2.55, yaw: 0,
    tap: (x) => { const [cx] = st.toScreen(new Vector3(0, 1.5, 0.5)); api.set(x < cx ? 'with' : 'solo'); },
  });
  rig(st, 1.8);
  const P = st.pivot;
  const L = new Group(), R = new Group(); L.position.x = -HW; R.position.x = HW; P.add(L, R);
  /* ---- the two rooms: floor + back wall + skirting ---- */
  L.add(rb(HW * 2 - 0.02, 0.3, 7, 0.04, matte('#e2b98c'), 0, -0.15, 2.4), rb(HW * 2 - 0.02, 6.4, 0.14, 0.04, matte('#f8e1c6'), 0, 3.0, -1.1));
  R.add(rb(HW * 2 - 0.02, 0.3, 7, 0.04, night('#18306a'), 0, -0.15, 2.4), rb(HW * 2 - 0.02, 6.4, 0.14, 0.04, night('#1d3c80'), 0, 3.0, -1.1));
  L.add(rb(HW * 2 - 0.02, 0.16, 0.06, 0.02, matte('#e9c9a2'), 0, 0.08, -1.0)); R.add(rb(HW * 2 - 0.02, 0.16, 0.06, 0.02, night('#142a5c'), 0, 0.08, -1.0));
  /* left: a bright window (light on the wall and a sunny patch on the desk), a shelf with books and a small plant */
  const win = (g: Group, x: number, y: number, pane: string, glow: number, frame: string) => {
    g.add(rb(1.3, 1.6, 0.08, 0.04, gloss(frame), x, y, -1.0));
    g.add(rb(1.12, 1.42, 0.04, 0.02, std(pane, 0.2, 0, { emissive: pane, glow }), x, y, -0.95));
    g.add(rb(1.12, 0.06, 0.06, 0.02, gloss(frame), x, y, -0.92), rb(0.06, 1.42, 0.06, 0.02, gloss(frame), x, y, -0.92));
    g.add(rb(1.45, 0.08, 0.26, 0.03, gloss(frame), x, y - 0.84, -0.86));
  };
  win(L, -0.5, 4.3, '#fff3d6', 0.85, '#ffffff');
  const wh = glowDisc(1.7, '#fff3d0', 0.55, true); wh.position.set(-0.5, 4.3, -1.02); L.add(wh);
  const sun = glowDisc(1.5, '#ffe7b3', 0.5); sun.scale.set(1.3, 0.7, 1); sun.position.set(-0.3, TOP + 0.01, 0.6); L.add(sun);
  L.add(rb(0.9, 0.08, 0.36, 0.03, gloss('#d7a56f'), 0.78, 4.05, -0.88));
  books(L, 0.42, 4.09, ['#7c8fd6', '#e58f6a', '#6fbf73', '#f2c94c']);
  const sp = plant('#ffffff', '#5fb878', 0.55); sp.position.set(1.08, 4.09, -0.88); L.add(sp);
  /* left: the person types at a laptop; the robot sits next to them */
  desk(L, '#cf9a63', 'rgba(120,70,30,.18)');
  const me = person('#3b55b8', { pose: 'type', hair: '#3a2618' }); me.position.set(-0.6, 0.38, 0.2); me.scale.setScalar(1.25); me.rotation.y = 0.68; L.add(me); // R31d: a 3/4 view, body and eyes turned straight at the laptop, hands on its keys
  const l1 = laptop(1.06, '#c9ccd8', '#d9dbe6'); l1.g.position.set(0.04, TOP, 0.95); l1.g.rotation.y = -0.95; L.add(l1.g); // screen faces the person and the camera
  const scr1 = paint(256, 160, (g, w, h) => {
    g.fillStyle = '#eef2ff'; rr(g, 0, 0, w, h, 12); g.fill(); g.fillStyle = '#c7d2fe'; rr(g, 0, 0, w, 26, 12); g.fill();
    for (let i = 0; i < 4; i++) { g.fillStyle = ['#6366f1', '#94a3b8', '#22c55e', '#94a3b8'][i]!; rr(g, 22 + (i % 2) * 18, 44 + i * 26, 150 - i * 18, 11, 5); g.fill(); }
    g.fillStyle = '#7dd3fc'; rr(g, 186, 40, 52, 52, 14); g.fill(); g.fillStyle = '#1e293b'; rr(g, 196, 56, 32, 18, 8); g.fill();
  });
  l1.lid.add(face(0.86, 0.54, scr1, false, 0, 0, 0.04));
  const lg1 = glowDisc(0.7, '#a5b4fc', 0.28, true); lg1.position.set(0, 0, 0.06); l1.lid.add(lg1);
  const b1 = robot({ eye: '#7dd3fc' }); b1.g.position.set(0.92, 0.75, -0.45); b1.g.scale.setScalar(0.62); b1.g.rotation.y = -0.7; L.add(b1.g); // leans in beside the screen
  b1.arms[0]!.rotation.set(-0.9, 0, -0.1);
  const p1 = plant('#f4f1fb', '#5fb878', 0.6); p1.position.set(-1.05, TOP, 1.25); L.add(p1);
  const m1 = mug('#2f3a5f', 1.15); m1.position.set(0.62, TOP, 1.62); L.add(m1);
  paper(L, 0.95, 1.12, 0.25, false);
  /* right: a night window, a dark shelf, the robot alone at a laptop with a checklist, a glowing lamp */
  win(R, -0.4, 4.3, '#3d66bd', 0.4, '#e3ebfa');
  R.add(ball(0.13, std('#fff7d6', 0.3, 0, { emissive: '#fde68a', glow: 1.2 }), -0.05, 4.65, -0.93));
  for (const [x, y] of [[-0.8, 4.8], [-0.5, 3.95], [-0.25, 4.4], [-0.82, 4.0]] as const) R.add(ball(0.025, std('#ffffff', 0.3, 0, { emissive: '#ffffff', glow: 1 }), x, y, -0.93));
  R.add(rb(0.75, 0.08, 0.36, 0.03, gloss('#c99a6b'), 0.88, 4.05, -0.88));
  books(R, 0.62, 4.09, ['#f2c94c', '#e58f6a', '#7c8fd6']);
  desk(R, '#8a6448', 'rgba(50,25,10,.25)');
  const b2 = robot({ eye: '#7dd3fc' }); b2.g.position.set(-0.6, 0.72, -0.1); b2.g.scale.setScalar(0.74); b2.g.rotation.y = 0.45; R.add(b2.g);
  for (const a of b2.arms) a.rotation.set(-1.0, 0, 0);
  const l2 = laptop(1.0, '#1c2246', '#b9bdd6'); l2.g.position.set(0.32, TOP, 0.8); l2.g.rotation.y = -0.45; R.add(l2.g);
  const scr = paint(256, 160, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1e3a8a'); gr.addColorStop(1, '#172554'); g.fillStyle = gr; rr(g, 0, 0, w, h, 12); g.fill();
    for (let i = 0; i < 3; i++) { drawIcon(g, 'check', 22, 18 + i * 44, 34, '#4ade80'); g.fillStyle = '#93c5fd'; rr(g, 70, 30 + i * 44, 150 - i * 22, 12, 6); g.fill(); }
  });
  l2.lid.add(face(0.9, 0.56, scr, false, 0, 0, 0.04));
  const lg = glowDisc(0.75, '#60a5fa', 0.35, true); lg.position.set(0, 0, 0.06); l2.lid.add(lg);
  /* the lamp: base, two arm pieces, shade, bulb; warm pool of light on the desk */
  const dk = gloss('#24304f');
  R.add(cyl(0.2, 0.22, 0.06, dk, 1.1, TOP + 0.03, 0.2));
  const a1 = rb(0.06, 0.95, 0.06, 0.03, dk, 1.17, TOP + 0.48, 0.15); a1.rotation.z = -0.2; R.add(a1);
  const a2 = rb(0.06, 0.6, 0.06, 0.03, dk, 1.07, TOP + 1.1, 0.2); a2.rotation.z = 0.9; R.add(a2);
  const shade = cyl(0.08, 0.3, 0.3, dk, 0.79, TOP + 1.1, 0.25); shade.rotation.z = 0.7; R.add(shade);
  R.add(ball(0.11, std('#fff3c4', 0.3, 0, { emissive: '#fbbf24', glow: 2 }), 0.7, TOP + 0.98, 0.27));
  const bulb = glowDisc(0.6, '#fde68a', 0.6, true); bulb.position.set(0.7, TOP + 0.98, 0.35); R.add(bulb);
  const pool = glowDisc(1.2, '#fcd34d', 0.45); pool.position.set(0.45, TOP + 0.01, 0.6); R.add(pool);
  const m2 = mug('#e5e7eb', 1.15); m2.position.set(0.95, TOP, 1.4); R.add(m2);
  /* the person at the back, a dark waving figure */
  const sil = '#1a3a7a', you = new Group(); you.position.set(0.62, 2.05, -0.85); you.scale.setScalar(0.62); R.add(you);
  you.add(person(sil, { pose: 'wave', hair: '#0e1d3d', skin: '#203a6e' }));
  for (const s of [-1, 1]) you.add(rb(0.32, 1.3, 0.32, 0.12, matte(sil), s * 0.22, -0.6, 0));
  you.traverse((o) => { const m = (o as Mesh).material as MeshStandardMaterial | undefined; if (m && 'color' in m) m.name = 'night'; }); // the figure keeps its night blue too
  const tChk = st.tag(T('稍后检查 🕘', 'Check it later 🕘'), 'soft'); tChk.at.set(HW + 0.1, 3.75, -0.6);
  /* the floor in front of the desks: a soft shadow, a rug, and a couple of things so it is not bare */
  for (const g of [L, R]) { const sh = st.blob(1, 0.28); sh.scale.set(HW * 2.1, 0.9, 1); sh.position.set(0, 0.01, 1.95); g.add(sh); }
  const rugL = cyl(1.0, 1.0, 0.03, matte('#f3d2a8'), 0.15, 0.015, 2.55); rugL.scale.z = 0.42; L.add(rugL);
  const rugL2 = cyl(0.82, 0.82, 0.035, matte('#e9a979'), 0.15, 0.02, 2.55); rugL2.scale.z = 0.42; L.add(rugL2);
  const bag = rb(0.5, 0.6, 0.3, 0.14, matte('#f08a5d'), -0.6, 0.3, 2.15); bag.rotation.y = 0.35; L.add(bag);
  L.add(rb(0.3, 0.2, 0.06, 0.05, matte('#d9734a'), -0.6, 0.22, 2.33));
  const rugR = cyl(1.0, 1.0, 0.03, matte('#3a66b0'), 0.1, 0.015, 2.55); rugR.scale.z = 0.42; R.add(rugR);
  const bin = cyl(0.2, 0.16, 0.42, gloss('#7fa6e6'), 0.7, 0.21, 2.15); R.add(bin);
  const fpR = plant('#f4f1fb', '#4fa56e', 0.6); fpR.position.set(-0.75, 0, 2.15); R.add(fpR);
  /* remember each side's colours so the side not chosen can be washed out */
  const PALE = new Color('#ece9f7');
  const keep = (g: Group) => {
    const ms: [MeshStandardMaterial, Color, Color, number][] = [];
    g.traverse((o) => { const m = (o as Mesh).material as MeshStandardMaterial | undefined; if (m && 'color' in m && m.emissive) ms.push([m, m.color.clone(), m.emissive.clone(), m.emissiveIntensity]); });
    return (off: boolean) => ms.forEach(([m, c, e, i]) => { m.color.copy(c); if (off && m.name !== 'night') m.color.lerp(PALE, 0.12); m.emissive.copy(e); m.emissiveIntensity = off ? i * 0.8 : i; }); // only a light wash, colours stay
  };
  const dimL = keep(L), dimR = keep(R);
  function update() {
    const m = api.mode();
    dimL(m === 'solo'); dimR(m === 'with');
    tChk.el.style.opacity = m === 'solo' ? '1' : '0.7';
    st.draw();
  }
  update();
  return { update, dispose: () => st.dispose() };
}
