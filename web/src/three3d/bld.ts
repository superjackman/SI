/* R31 scene (Bld): build your own agent. On a wood-grain table, a robot made of four chunky toy bricks stands on a grey
   stud plate: head = model (purple, brain decal), arms = tools (green, wrench decals), body = guide / instructions
   (blue, document decal), base = memory (yellow, database decal). Each brick carries its short name inside its face.
   Around it: a toolbox, loose bricks. A wooden signpost has two 3D arrow boards, 「不写代码」 (puzzle) and 「写代码」 (</>);
   picking one (the two buttons under the stage, or tapping a board) lights that board with a glow and a ring of sparks,
   fades the other, draws a dotted path to the robot and snaps the bricks back together one after another (≤1.2 s). */
import { Group, Vector3 } from 'three';
import { satin, stage } from './core';
import { ball, cyl, matte, plant, face, freeObj, glowDisc, glowMat, gloss, iconTex, metal, rb, rig, std, woodTex, type Icon } from './kit';
import { BLD_PARTS, type Road } from '../m2/w3d2';
import type { View } from '../m2/s3d';

export interface BldApi { lang: 'zh' | 'en'; raf: (f: FrameRequestCallback) => number; caf: (id: number) => void; road(): Road; set(r: Road): void }
const COL = Object.fromEntries(BLD_PARTS.map(([id, , , c]) => [id, c])) as Record<string, string>;
const RX = -0.72; /* robot x */
const SX = 1.45; /* signpost x */
const BOARD: [Road, number, Icon][] = [['nocode', 3.05, 'puzzle'], ['code', 1.95, 'code']];
const DUR = 1.2;

/** a toy brick: glossy rounded box with a grid of studs on top */
function brick(w: number, h: number, d: number, color: string, nx: number, nz: number, x = 0, y = 0, z = 0) {
  const g = new Group(), m = gloss(color), hi = glowMat('#ffffff', 0.38), r = Math.min(0.16, (w / nx) * 0.36, (d / nz) * 0.36);
  g.add(rb(w, h, d, Math.min(0.26, w * 0.2, h * 0.3, d * 0.26), m)); // R31d: rounder, softer toy corners
  for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
    const x = (i - (nx - 1) / 2) * (w / nx), z = (k - (nz - 1) / 2) * (d / nz);
    g.add(cyl(r, r, 0.15, m, x, h / 2 + 0.075, z, 24), cyl(r * 0.62, r * 0.62, 0.012, hi, x - r * 0.12, h / 2 + 0.156, z - r * 0.12, 20)); // stud + a shine on top
  }
  g.position.set(x, y, z); return g;
}
const decal = (n: Icon, s: number, x: number, y: number, z: number, c = '#ffffff') => face(s, s, iconTex(n, c), false, x, y, z);

export function make(box: HTMLElement, api: BldApi): View {
  const en = api.lang === 'en', T = (zh: string, e: string) => (en ? e : zh);
  const name = (id: string) => { const p = BLD_PARTS.find((q) => q[0] === id)!; return T(p[1], p[2]); };
  let t = DUR;
  const st = stage(box, {
    raf: api.raf, caf: api.caf, cam: [0, 6.2, 9.4], look: [0.25, 0.55, 1.0], fit: 2.95, yaw: 0,
    busy: () => t < DUR, tick: (dt) => { if (t < DUR) { t = Math.min(DUR, t + dt); pose(); } },
    tap: (x, y) => {
      let best: Road = '', bd = 1e9;
      BOARD.forEach(([r, by]) => { const [sx, sy] = st.toScreen(new Vector3(SX + 0.35, by, 0.3)); const d = Math.hypot(sx - x, sy - y); if (d < bd) { bd = d; best = r; } });
      if (best && bd < 70) api.set(best);
    },
  });
  rig(st);
  const P = st.pivot;
  /* the wooden table top */
  P.add(rb(5.0, 0.24, 4.6, 0.12, std('#ffffff', 0.6, 0, { map: woodTex('#dcae76', 'rgba(120,70,30,.18)', 512) }), 0.2, -0.36, 0.7));
  /* under the table: four legs, their shadows and a few things on the floor (a rug, a dropped brick, a pot plant) */
  const leg = std('#c48f5a', 0.6, 0);
  for (const [x, z] of [[-1.9, -1.25], [2.3, -1.25], [-1.7, 2.55], [2.1, 2.55]]) P.add(rb(0.28, 1.14, 0.28, 0.06, leg, x, -1.05, z));
  const fl = -1.62, under = st.blob(1, 0.3); under.scale.set(4.6, 3.6, 1); under.position.set(0.2, fl, 1.9); P.add(under);
  const rug = cyl(2.6, 2.6, 0.03, matte('#e9e2fb'), 0.2, fl - 0.01, 2.9); rug.scale.z = 0.45; P.add(rug);
  const rug2 = cyl(2.2, 2.2, 0.035, matte('#d9cdf7'), 0.2, fl, 2.9); rug2.scale.z = 0.45; P.add(rug2);
  const db = brick(0.55, 0.36, 0.46, COL.ins!, 1, 1, -0.7, fl + 0.18, 2.6); db.rotation.y = 0.6; P.add(db);
  const dbs = st.blob(0.6, 0.22); dbs.position.set(-0.7, fl + 0.01, 2.6); P.add(dbs);
  const fp = plant('#f4f1fb', '#5fb878', 0.75); fp.position.set(1.6, fl, 2.85); P.add(fp);
  /* grey stud plate */
  const plate = brick(2.7, 0.22, 2.0, '#b8b6c8', 6, 4, RX, -0.11, 0.1); P.add(plate);
  const sh = st.blob(1, 0.24); sh.scale.set(1.9, 1.4, 1); sh.position.set(RX, -0.23, 0.1); P.add(sh);
  /* the robot, one group per part so they can snap in */
  const part = (id: string) => { const g = new Group(); g.userData.id = id; P.add(g); return g; };
  const gFeet = part('mem'), gBody = part('ins'), gArms = part('tools'), gHead = part('model');
  gFeet.add(brick(1.6, 0.56, 1.0, COL.mem!, 3, 2, RX, 0.28, 0.1), decal('db', 0.32, RX - 0.5, 0.28, 0.61, '#7a5a10'));
  gBody.add(brick(1.4, 1.2, 0.95, COL.ins!, 2, 1, RX, 1.22, 0.1), decal('doc', 0.4, RX, 1.48, 0.58));
  for (const s of [-1, 1]) {
    const arm = new Group(); arm.position.set(RX + s * 1.06, 1.3, 0.1); arm.rotation.z = s * 0.1; gArms.add(arm);
    arm.add(brick(0.66, 1.0, 0.56, COL.tools!, 1, 1), decal('wrench', 0.3, 0, 0.22, 0.29));
    arm.add(ball(0.2, gloss('#d9d6ea'), 0, -0.62, 0.06));
  }
  gBody.add(cyl(0.22, 0.26, 0.16, gloss('#d9d6ea'), RX, 1.9, 0.1));
  gHead.add(brick(1.5, 1.25, 1.0, COL.model!, 3, 2, RX, 2.6, 0.1));
  gHead.add(rb(1.12, 0.56, 0.14, 0.2, gloss('#1f2050'), RX, 2.8, 0.58), decal('brain', 0.3, RX - 0.46, 2.28, 0.61));
  for (const x of [-0.25, 0.25]) { const e = ball(0.1, satin('#c4b5fd', { emissive: '#a78bfa', glow: 1.4 }), RX + x, 2.84, 0.66); e.scale.z = 0.5; gHead.add(e); }
  for (const s of [-1, 1]) { const ear = cyl(0.15, 0.15, 0.14, gloss('#7c5ce0'), RX + s * 0.8, 2.6, 0.1); ear.rotation.z = Math.PI / 2; gHead.add(ear); }
  const parts = [gFeet, gBody, gArms, gHead];
  /* the toolbox and loose bricks */
  const tb = new Group(); tb.position.set(0.45, -0.24, 2.3); tb.rotation.y = -0.25; P.add(tb);
  tb.add(rb(1.15, 0.5, 0.6, 0.08, gloss('#ef6f5e'), 0, 0.25, 0), rb(1.2, 0.12, 0.64, 0.05, gloss('#d95747'), 0, 0.52, 0));
  tb.add(rb(0.12, 0.3, 0.1, 0.04, metal('#c9cbe0'), -0.3, 0.7, 0), rb(0.12, 0.3, 0.1, 0.04, metal('#c9cbe0'), 0.3, 0.7, 0), rb(0.72, 0.1, 0.12, 0.05, metal('#c9cbe0'), 0, 0.86, 0));
  tb.add(rb(0.22, 0.12, 0.04, 0.03, metal('#e5e7f0'), 0, 0.36, 0.31), decal('wrench', 0.26, -0.32, 0.26, 0.31));
  const tbs = st.blob(0.9, 0.2); tbs.position.set(0.45, -0.23, 2.3); P.add(tbs);
  P.add(brick(0.55, 0.36, 0.46, COL.mem!, 1, 1, -1.5, -0.06, 1.95));
  P.add(brick(0.55, 0.36, 0.46, COL.tools!, 1, 1, 1.85, -0.06, 1.75));
  const lb = brick(0.8, 0.36, 0.46, COL.ins!, 2, 1, -1.05, -0.06, 2.55); lb.rotation.y = 0.4; P.add(lb);
  P.add(brick(0.55, 0.36, 0.46, COL.model!, 1, 1, 2.15, -0.06, 0.9));
  /* the brick labels (all inside the brick faces) */
  const tags: Record<string, ReturnType<typeof st.tag>> = {};
  tags.model = st.tag(name('model'), 'dark'); tags.model.at.set(RX + 0.12, 2.28, 0.62);
  tags.ins = st.tag(name('ins'), 'dark'); tags.ins.at.set(RX, 1.02, 0.6);
  tags.mem = st.tag(name('mem'), 'onw'); tags.mem.at.set(RX + 0.15, 0.28, 0.62);
  tags.tools = st.tag(name('tools'), 'dark'); tags.tools.at.set(RX - 1.06, 1.12, 0.42);
  /* the wooden signpost with two 3D arrow boards */
  const wood = std('#ffffff', 0.62, 0, { map: woodTex('#c98d55', 'rgba(90,50,20,.22)', 256) });
  P.add(cyl(0.12, 0.14, 3.7, wood, SX, 1.6, 0), cyl(0.16, 0.14, 0.1, gloss('#8a5a2f'), SX, 3.48, 0));
  P.add(cyl(0.5, 0.6, 0.18, gloss('#8a5a2f'), SX, -0.15, 0));
  const fs = st.blob(1, 0.2); fs.scale.set(0.8, 0.5, 1); fs.position.set(SX, -0.23, 0); P.add(fs);
  const boards = BOARD.map(([r, y, ic]) => {
    const g = new Group(); g.position.set(SX + 0.32, y, 0.2); P.add(g);
    const m = std('#ffffff', 0.55, 0, { map: woodTex('#e6b77d', 'rgba(110,60,25,.2)', 256) }); 
    const sm = std('#a86b3a', 0.7, 0); // the board's sawn sides, darker
    g.rotation.y = -0.32;
    g.add(rb(1.7, 0.72, 0.1, 0.06, m, 0, 0, 0.13)); // the front face
    g.add(rb(1.74, 0.76, 0.3, 0.1, sm)); // thick body
    for (const [z, mm] of [[0.13, m], [0, sm]] as const) { const tp = rb(0.5, 0.5, z ? 0.1 : 0.3, 0.06, mm, 0.86, 0, z); tp.rotation.z = Math.PI / 4; g.add(tp); }
    g.add(ball(0.045, metal('#8a8fa8'), -0.72, 0.24, 0.19), ball(0.045, metal('#8a8fa8'), -0.72, -0.24, 0.19)); // nails
    g.add(face(0.38, 0.38, iconTex(ic, '#6d28d9'), false, -0.5, 0, 0.19));
    const halo = glowDisc(1.5, 'rgba(167,139,250,.95)', 0.85, true); halo.position.z = -0.12; halo.scale.set(1.35, 0.75, 1); g.add(halo);
    const sparks = new Group(); g.add(sparks);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; sparks.add(ball(0.045, satin('#fde68a', { emissive: '#fbbf24', glow: 1.4 }), Math.cos(a) * 1.15 + 0.1, Math.sin(a) * 0.55, 0.15)); }
    const tg = st.tag(r === 'nocode' ? T('不写代码', 'No code') : T('写代码', 'Code'), 'sign'); tg.at.set(SX + 0.45, y, 0.45);
    return { r, g, m, sm, halo, sparks, tg };
  });
  let path: Group[] = [], last: Road = '';
  function pose() {
    parts.forEach((g, i) => { const k = Math.max(0, Math.min(1, (t - i * 0.18) / 0.5)), e = k < 1 ? 1 - (1 - k) ** 3 : 1; g.position.y = (1 - e) * 0.7; });
    boards.forEach((b) => { b.sparks.children.forEach((c, i) => { const a = (i / 12) * Math.PI * 2 + t * 1.5; c.position.set(Math.cos(a) * 1.12 + 0.12, Math.sin(a) * 0.5, 0.15); }); });
  }
  function update() {
    path.forEach(freeObj); path = [];
    const road = api.road();
    boards.forEach((b) => {
      const on = b.r === road, off = !!road && !on;
      b.m.emissive.set(on ? '#fbbf24' : '#000000'); b.m.emissiveIntensity = on ? 0.12 : 0; 
      b.m.color.setScalar(off ? 0.78 : 1); b.sm.color.set(off ? '#9c8a7c' : '#a86b3a'); // the other sign just dims, stays solid
 b.halo.visible = b.sparks.visible = on; b.g.scale.setScalar(on ? 1.06 : 1);
      b.tg.el.classList.toggle('on', on); b.tg.el.style.opacity = off ? '0.55' : '1';
    });
    if (road) {
      const by = BOARD.find((q) => q[0] === road)![1];
      const a = new Vector3(SX - 0.55, by - 0.2, 0.3), z = new Vector3(RX + 1.45, road === 'nocode' ? 2.3 : 1.2, 0.5);
      const g = new Group(), m = satin('#7c6cf0', { emissive: '#7c6cf0', glow: 0.6 });
      for (let i = 0; i <= 7; i++) { const k = i / 7; const p = a.clone().lerp(z, k); p.y -= Math.sin(k * Math.PI) * 0.35; g.add(ball(0.06, m, p.x, p.y, p.z)); }
      P.add(g); path.push(g);
      t = road !== last ? 0 : DUR;
    } else t = DUR;
    last = road;
    pose(); st.draw();
  }
  update();
  return { update, dispose: () => { path = []; st.dispose(); } };
}
