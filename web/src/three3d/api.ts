/* R31 scene (Api): the ordering window. Left, a laptop 「你的程序」 on a wooden plinth with a menu card (a dish picture)
   on its screen and a golden key (the API key) hanging off it; a glowing pipe runs back to a little food kiosk 「模型」
   (sign board, striped awning, stove with pots, shelves, a pot plant) under a cloud; gold coin stacks (one more coin
   per request) and a small white sign with the running bill; in front, a tray where the answer card (a covered plate)
   lands. Each press of 「发送请求」 plays once (1.8 s, clock in the lab): the menu card flies along the pipe, the kiosk cooks
   (pendant lamps brighter, steam), the answer card slides onto the tray, then its coin drops onto the front stack. Nothing moves otherwise (render on demand). */
import { Group, Vector3, type Mesh } from 'three';
import { satin, stage } from './core';
import { ball, cable, cloud, curveOf, cyl, drawDish, drawIcon, face, glass, glowDisc, glowMat, gloss, iconTex, laptop, matte, metal, paint, plant, plinth, rb, ring, rig, rr, woodTex } from './kit';
import { API_BACK, API_SEND, apiTotal, yuan } from '../m2/w3d2';
import type { View } from '../m2/s3d';

/** n(): requests that have landed; p(): progress 0..1 of the one on its way (1 when none). The lab owns the clock so the sentence,
    the bill and the coin change exactly when the picture does. */
export interface ApiApi { lang: 'zh' | 'en'; raf: (f: FrameRequestCallback) => number; caf: (id: number) => void; n(): number; p(): number }
const MAXC = 12, CH = 0.1, BASE = [7, 10] as const;
const LAP = new Vector3(-1.15, 0, -0.15), KIT = new Vector3(0.95, 0, -1.45), TRAY = new Vector3(1.1, 0, 2.0), COIN = new Vector3(0.15, 0, 0.8), BILL = new Vector3(-0.85, 0, 1.6);

export function make(box: HTMLElement, api: ApiApi): View {
  const en = api.lang === 'en', T = (zh: string, e: string) => (en ? e : zh);
  const st = stage(box, {
    raf: api.raf, caf: api.caf, cam: [0.2, 7.8, 7.0], look: [0.0, 0.7, 0.3], fit: 2.35, yaw: 0,
    busy: () => api.p() < 1, tick: () => { if (api.p() < 1) pose(); },
  });
  rig(st);
  const P = st.pivot, wood = matte('#e2b47c', { map: woodTex('#e6b77d') }), gold = gloss('#f6bd45', { emissive: '#f59e0b', glow: 0.22 });
  /* the laptop on its wooden plinth; the screen shows a menu card with a dish picture */
  const lp = new Group(); lp.position.copy(LAP); lp.rotation.y = 0.32; P.add(lp);
  lp.add(plinth(st, 2.3, 1.8, 0.32, '#e6b77d', 0), glowDisc(1.5, 'rgba(167,139,250,.55)', 0.6));
  (lp.children[0]!.children[0] as Mesh).material = wood;
  const { g: lg, lid } = laptop(1.9, '#24264f', '#dcdeea'); lp.add(lg);
  lg.add(rb(1.5, 0.02, 0.5, 0.01, metal('#b9bccd'), 0, 0.09, 0.12));
  const scr = paint(512, 320, (g, w, h) => {
    g.fillStyle = '#1b1d44'; g.fillRect(0, 0, w, h);
    drawIcon(g, 'code', 22, 18, 46, '#a5b4fc');
    g.fillStyle = '#ffffff'; rr(g, 70, 84, 372, 210, 22); g.fill();
    drawDish(g, 160, 190, 66);
    g.fillStyle = '#c4b5fd'; rr(g, 252, 136, 150, 18, 9); g.fill(); g.fillStyle = '#ddd6fe'; rr(g, 252, 170, 110, 16, 8); g.fill();
    g.fillStyle = '#6d5ce7'; rr(g, 252, 214, 92, 30, 15); g.fill();
  });
  const menu = face(1.78, 1.12, scr, false, 0, 0.02, 0.04); lid.add(menu);
  /* the golden key hangs off the menu card's right edge, on a little ring, where the pipe starts */
  const key = new Group();
  key.add(ring(0.16, 0.05, gold), cyl(0.05, 0.05, 0.6, gold, 0, -0.45, 0), rb(0.2, 0.08, 0.08, 0.02, gold, 0.1, -0.68, 0), rb(0.14, 0.08, 0.08, 0.02, gold, 0.08, -0.53, 0));
  key.scale.setScalar(1.35); key.position.set(1.0, 0.25, 0.14); key.rotation.set(0, 0.2, 0.25); lid.add(key);
  /* the kiosk: plinth, body, sign board, striped awning, dark open front with shelves, a stove with pots, counter */
  const kt = new Group(); kt.position.copy(KIT); P.add(kt);
  kt.add(plinth(st, 2.6, 2.0, 0.38, '#ddd5fb', 0), glowDisc(1.7, 'rgba(196,181,253,.6)', 0.5));
  const shell = gloss('#f6f4fe'), lav = gloss('#cfc4f6');
  kt.add(rb(1.9, 1.75, 1.3, 0.16, shell, 0, 0.875, 0));
  kt.add(rb(1.5, 1.12, 0.1, 0.05, gloss('#3a3468'), 0, 1.0, 0.62));
  /* the open front: two wooden shelves of jars, a wall rail with a ladle and a pan */
  for (const y of [1.36, 1.06]) kt.add(rb(1.3, 0.05, 0.22, 0.02, wood, 0, y, 0.64));
  const jar = ['#f6a04d', '#5fb878', '#e8613c', '#fde68a', '#93c5fd'];
  jar.forEach((c, i) => kt.add(cyl(0.07, 0.07, 0.16, gloss(c), -0.5 + i * 0.25, 1.47, 0.66), cyl(0.075, 0.075, 0.035, gloss('#ffffff'), -0.5 + i * 0.25, 1.56, 0.66), cyl(0.06, 0.06, 0.13, glass('#ffffff', 0.5), -0.38 + i * 0.22, 1.15, 0.66)));
  kt.add(rb(1.2, 0.03, 0.03, 0.01, metal('#9a98b8'), 0, 0.86, 0.68));
  kt.add(cyl(0.012, 0.012, 0.3, metal('#c9cbd9'), 0.32, 0.74, 0.7), cyl(0.07, 0.05, 0.05, metal('#c9cbd9'), 0.32, 0.58, 0.7));
  const pan = cyl(0.13, 0.11, 0.04, metal('#55536e'), 0.58, 0.72, 0.69); pan.rotation.x = Math.PI / 2; kt.add(pan);
  /* the counter in front, with the stove, two pots on it, a bread basket and a bell */
  kt.add(rb(1.85, 0.5, 0.42, 0.06, wood, 0, 0.25, 0.86));
  kt.add(rb(0.78, 0.14, 0.34, 0.04, gloss('#2c2c3e'), -0.42, 0.57, 0.88));
  const flM = satin('#ff9d4d', { emissive: '#ff7a1a', glow: 1.4 });
  for (const x of [-0.6, -0.24]) { const fl = ring(0.08, 0.018, flM); fl.rotation.x = Math.PI / 2; fl.position.set(x, 0.645, 0.88); kt.add(fl); }
  kt.add(cyl(0.14, 0.12, 0.2, metal('#c9cbd9'), -0.6, 0.76, 0.88), cyl(0.15, 0.15, 0.03, metal('#e1e3ee'), -0.6, 0.87, 0.88), ball(0.03, gloss('#3a3468'), -0.6, 0.9, 0.88));
  kt.add(cyl(0.12, 0.12, 0.13, metal('#e1e3ee'), -0.24, 0.72, 0.88), cyl(0.012, 0.012, 0.32, wood, -0.18, 0.86, 0.86));
  kt.add(cyl(0.17, 0.13, 0.13, matte('#c98b4a'), 0.32, 0.565, 0.88), ball(0.075, matte('#f0c27b'), 0.27, 0.66, 0.86), ball(0.075, matte('#e6b36a'), 0.37, 0.66, 0.92), ball(0.07, matte('#f3cf8e'), 0.33, 0.66, 0.8));
  kt.add(cyl(0.09, 0.11, 0.03, metal('#c9cbd9'), 0.68, 0.515, 0.92), ball(0.07, gloss('#f6bd45'), 0.68, 0.56, 0.92));
  const aw = paint(256, 64, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#8b7cf6'; g.fillRect((i * w) / 8, 0, w / 8 + 1, h); } });
  const awn = rb(2.05, 0.08, 0.42, 0.03, gloss('#ffffff', { map: aw }), 0, 1.82, 0.8); awn.rotation.x = 0.5; kt.add(awn);
  for (let i = 0; i < 8; i++) { const sc = ball(0.13, gloss(i % 2 ? '#ffffff' : '#8b7cf6'), -0.9 + i * 0.257, 1.72, 0.99); sc.scale.set(1, 0.5, 0.5); kt.add(sc); }
  kt.add(rb(2.0, 0.16, 1.45, 0.07, lav, 0, 1.83, 0));
  kt.add(rb(1.5, 0.5, 0.14, 0.12, gloss('#26245a'), 0, 2.23, 0.42));
  kt.add(face(0.32, 0.32, iconTex('brain', '#c4b5fd'), false, -0.5, 2.23, 0.5));
  /* two pendant lamps hanging from the awning over the counter */
  const bulbM = satin('#fff3c4', { emissive: '#ffd27a', glow: 1.1 });
  for (const x of [-0.45, 0.45]) {
    kt.add(cyl(0.012, 0.012, 0.3, metal('#55536e'), x, 1.55, 1.02));
    kt.add(cyl(0.04, 0.16, 0.12, gloss('#f6bd45', { emissive: '#d97706', glow: 0.25 }), x, 1.38, 1.02), ball(0.075, bulbM, x, 1.28, 1.02));
    const hl = st.halo(0.13, '#ffe7a3', 0.22); hl.position.set(x, 1.27, 1.02); kt.add(hl);
  }
  const steam: Mesh[] = [];
  for (let i = 0; i < 3; i++) { const sm = ball(0.07 + i * 0.02, glowMat('#ffffff', 0.55)); sm.visible = false; kt.add(sm); steam.push(sm); }
  const pl = plant('#f4f1fb', '#5fb878', 0.95); pl.position.set(1.18, 0, 0.55); kt.add(pl);
  const cl = cloud(0.7); cl.position.set(0.25, 2.62, -0.6); kt.add(cl);
  /* the pipe (the network) from the laptop to the kiosk, glowing */
  const a = new Vector3(LAP.x + 1.05, 0.95, LAP.z - 0.25), b = new Vector3(KIT.x - 1.0, 0.95, KIT.z + 0.35);
  const pipe = cable(a, b, new Vector3(a.x + 0.75, 1.2, a.z - 0.15), new Vector3(b.x - 0.7, 1.2, b.z + 0.7), 0.13, '#8b5cf6', '#c4b5fd', 0.4);
  P.add(pipe);
  for (const p of [a, b]) { const cp = cyl(0.2, 0.2, 0.18, gloss('#b9a6ff', { emissive: '#8b5cf6', glow: 0.4 }), p.x, p.y, p.z); cp.rotation.z = Math.PI / 2; P.add(cp); }
  /* the coin stacks: two that are already there, and the front one that grows by one coin per request */
  const cg = new Group(); cg.position.copy(COIN); P.add(cg);
  cg.add(plinth(st, 1.35, 1.0, 0.12, '#ebe4fd', 0, true));
  const edge = gloss('#e9a92c', { emissive: '#d97706', glow: 0.15 });
  const coin = (x: number, y: number, z: number) => { const c = new Group(); c.add(cyl(0.3, 0.3, CH * 0.86, edge), cyl(0.24, 0.24, CH * 0.9, gold)); c.position.set(x, y, z); return c; };
  BASE.forEach((n, k) => { for (let i = 0; i < n; i++) cg.add(coin(-0.3 + k * 0.62 + (i % 2) * 0.012, CH / 2 + i * CH, -0.15 - k * 0.05)); });
  const coins: Group[] = [];
  for (let i = 0; i < MAXC; i++) { const c = coin(0.1, CH / 2 + i * CH, 0.3); c.visible = false; cg.add(c); coins.push(c); }
  /* the running bill: a small white sign on a stand */
  const bl = new Group(); bl.position.copy(BILL); bl.rotation.y = 0.2; P.add(bl);
  const bs = st.blob(0.5, 0.25); bl.add(bs);
  bl.add(cyl(0.03, 0.03, 0.4, metal('#b9bccd'), 0, 0.2, 0), cyl(0.17, 0.19, 0.05, metal('#c9cbd9'), 0, 0.025, 0));
  bl.add(rb(1.25, 0.42, 0.07, 0.08, gloss('#ffffff'), 0, 0.55, 0));
  /* the tray with its conveyor (rollers, belt) */
  const tr = new Group(); tr.position.copy(TRAY); P.add(tr);
  tr.add(plinth(st, 2.2, 1.6, 0.3, '#ddd5fb', 0, true));
  tr.add(rb(1.8, 0.2, 0.9, 0.09, matte('#2f2e48'), 0, 0.12, 0));
  for (let i = 0; i < 7; i++) tr.add(rb(0.04, 0.02, 0.8, 0.01, matte('#4a4968'), -0.75 + i * 0.25, 0.23, 0));
  for (const x of [-0.92, 0.92]) { const r = cyl(0.14, 0.14, 0.94, metal('#9a98b8'), x, 0.13, 0); r.rotation.x = Math.PI / 2; tr.add(r); }
  /* R31d: a soft floor under the whole shop, and a few props in front so the lower part of the stage is not empty:
     a pile of parcel boxes (answers already sent home) on the left and a plant on the right */
  const fl = plinth(st, 14, 24, 0.16, '#ece6fd', -0.3, false); fl.position.set(0.1, 0, -4); P.add(fl);
  const rug = glowDisc(1.5, 'rgba(196,181,253,.45)', 0.5); rug.position.set(-1.1, -0.28, 2.8); P.add(rug);
  const card = matte('#d9a066'), tape = matte('#b98448');
  for (const [x, y, z, w, r] of [[-1.4, -0.3, 2.7, 0.72, 0.15], [-0.7, -0.3, 2.95, 0.56, -0.25], [-1.35, 0.19, 2.68, 0.54, 0.45]] as const) {
    const pk = new Group(); pk.position.set(x, y, z); pk.rotation.y = r; P.add(pk);
    pk.add(rb(w, w * 0.68, w * 0.8, 0.04, card, 0, w * 0.34, 0), rb(w + 0.01, w * 0.69, 0.12, 0.01, tape, 0, w * 0.34, 0));
    pk.add(face(w * 0.34, w * 0.22, iconTex('check', '#6366f1', '#ffffff', 128), false, w * 0.18, w * 0.38, w * 0.41));
  }
  const pl2 = plant('#f4f1fb', '#5fb878', 0.8); pl2.position.set(0.25, -0.3, 3.15); P.add(pl2);
  /* the answer card: a covered plate picture and a check badge */
  const ansTex = paint(384, 256, (g, w, h) => {
    g.fillStyle = '#ffffff'; rr(g, 0, 0, w, h, 26); g.fill();
    drawDish(g, 268, 140, 72);
    g.fillStyle = '#c4b5fd'; rr(g, 30, 110, 130, 18, 9); g.fill(); g.fillStyle = '#ddd6fe'; rr(g, 30, 146, 100, 16, 8); g.fill();
    g.fillStyle = '#6d5ce7'; rr(g, 30, 186, 80, 28, 14); g.fill();
    drawIcon(g, 'cloche', 26, 22, 64, '#8b7cf6');
  });
  const ans = new Group(); P.add(ans);
  ans.rotation.x = -0.75; ans.add(rb(1.42, 0.95, 0.06, 0.06, gloss('#ffffff')), face(1.36, 0.9, ansTex, true, 0, 0, 0.035));
  const okb = new Group(); okb.position.set(0.66, -0.42, 0.06); ans.add(okb);
  okb.add(cyl(0.17, 0.17, 0.06, gloss('#6366f1'), 0, 0, 0)).children[0]!.rotation.x = Math.PI / 2;
  okb.add(face(0.26, 0.26, iconTex('check', '#6366f1'), false, 0, 0, 0.035));
  const restA = new Vector3(TRAY.x, 0.72, TRAY.z - 0.05), fromA = new Vector3(KIT.x + 0.3, 0.9, KIT.z + 1.1);
  /* the flying menu card */
  const fly = new Group(); fly.add(rb(0.62, 0.4, 0.04, 0.05, gloss('#ffffff')), face(0.56, 0.34, paint(128, 80, (g) => { drawDish(g, 40, 40, 28); g.fillStyle = '#c4b5fd'; rr(g, 76, 26, 44, 10, 5); g.fill(); g.fillStyle = '#ddd6fe'; rr(g, 76, 46, 32, 9, 4); g.fill(); }), false, 0, 0, 0.025));
  fly.add(ball(0.42, glowMat('#c4b5fd', 0.3))); fly.visible = false; P.add(fly);
  const spark = st.halo(0.38, '#fde68a', 0.35); spark.visible = false; cg.add(spark);
  /* labels */
  const tProg = st.tag(T('你的程序', 'Your program'), 'soft'), tMenu = st.tag(T('菜单', 'Menu'), 'onw');
  const tKit = st.tag(T('模型', 'Model'), 'dark big'), tBill = st.tag('', 'pct'), tAns = st.tag(T('答案', 'Answer'), 'onw');
  const onP = (m: Mesh, x: number, y: number) => { m.updateWorldMatrix(true, false); P.updateWorldMatrix(true, false); return P.worldToLocal(m.localToWorld(new Vector3(x, y, 0.06))); };
  const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const COIN_AT = 0.88;
  let tAnsOn: boolean | null = null, billN = -1;
  function pose() {
    /* n requests have landed; while one more is on its way (ph < 1): 0-API_SEND the menu card flies along the pipe; to API_BACK the
       kiosk cooks (lamps brighter, steam over the pots); to COIN_AT the answer slides onto the tray; then its coin drops on the stack.
       The lab adds it to n (and the bill) when ph reaches 1. */
    const n = api.n(), ph = api.p(), play = ph < 1, k = n + (play ? 1 : 0);
    const f1 = ease(ph / API_SEND), f3 = ease((ph - API_BACK) / (COIN_AT - API_BACK)), f4 = ease((ph - COIN_AT) / (1 - COIN_AT));
    fly.visible = play && ph < API_SEND + 0.02;
    if (fly.visible) { fly.position.copy(curveOf(pipe).getPoint(f1)).add(new Vector3(0, 0.36, 0)); fly.rotation.y = -0.3 + f1 * 0.5; }
    const think = play && ph >= API_SEND && ph < API_BACK;
    bulbM.emissiveIntensity = think ? 1.9 : 1.1;
    steam.forEach((sm, i) => { const q = ((ph - API_SEND) / (API_BACK - API_SEND) * 1.6 + i * 0.33) % 1; sm.visible = think; sm.position.set(-0.6 + (i % 2) * 0.36, 0.95 + q * 0.6, 0.88); sm.scale.setScalar(0.6 + q); });
    coins.forEach((c, i) => { c.visible = i < Math.min(MAXC, n); c.position.y = CH / 2 + i * CH; });
    const dropping = play && k <= MAXC && ph >= COIN_AT;
    if (dropping) { const c = coins[k - 1]!; c.visible = true; c.position.y = CH / 2 + (k - 1) * CH + (1 - f4) * 1.5; }
    spark.visible = dropping; if (dropping) spark.position.set(0.1, CH * k + 0.05, 0.3);
    const coming = play && ph >= API_BACK;
    ans.visible = coming || n > 0;
    if (coming) ans.position.lerpVectors(fromA, restA, f3).setY(restA.y + Math.sin(Math.PI * f3) * 0.9);
    else ans.position.copy(restA);
    tAns.at.copy(ans.position).add(new Vector3(-0.3, 0.38, -0.3)); const sa = ans.visible && (!play || ph < API_BACK); if (sa !== tAnsOn) { tAnsOn = sa; tAns.show(sa); } // a tag call asks for a frame: only on a change
    if (billN !== n) { billN = n; tBill.set(`${T('账单', 'Bill')} <b>${yuan(apiTotal(n))}</b> ${T('元', 'yuan')}`); }
  }
  tProg.at.copy(onP(lid, 0, 0.82)); tMenu.at.copy(onP(lid, 0.3, 0.22)); tKit.at.set(KIT.x + 0.12, 2.23, KIT.z + 0.5);
  tBill.at.set(BILL.x, 0.55, BILL.z + 0.06);
  pose();
  const update = () => { pose(); st.draw(); };
  return { update, dispose: () => st.dispose() };
}
