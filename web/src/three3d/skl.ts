/* R31 scene (Skl): plug tools into the robot. A glossy white robot (screen face, antenna, joints) stands on a round
   plinth with a soft halo; five white tool cards stand around it (Files, Web, Calendar, Database, Code), each with a big
   painted icon and a short cable ending in a plug. Tapping a card (in 3D, the 2D picture, or keys 1-5) plugs its cable
   into one of five ports in the robot's layered chest slot: the cable grows along a smooth tube to the port in 0.6 s
   while the cards bob gently; then everything stops. With at least one plugged in, a green shield lights in the chest
   with 「已连接」. The 「用之前先问我」 switch shows a hand-up bubble over the head. */
import { Group, Mesh, Vector3, type BufferGeometry } from 'three';
import { satin, stage } from './core';
import { cable, curveOf, face, freeObj, glowDisc, gloss, iconTex, matte, metal, paint, plant, plinth, rb, rig, robot, type Icon } from './kit';
import { SKL_TOOLS } from '../m2/w3d2';
import type { View } from '../m2/s3d';

export interface SklApi { lang: 'zh' | 'en'; raf: (f: FrameRequestCallback) => number; caf: (id: number) => void; on(): number[]; ask(): boolean; pick(i: number): void }
/* card centres: Files, Web, Calendar, Database, Code (left two, right three, like the reference) */
const CARD: [number, number, number][] = [[-1.78, 3.2, 0.1], [1.78, 3.45, 0.1], [-1.82, 1.5, 0.4], [1.88, 2.05, 0.35], [1.72, 0.72, 0.8]];
const ICONS: Icon[] = ['folder', 'globe', 'cal', 'db', 'code'];
const S = 1.22, DUR = 1.0, GROW = 0.6;

export function make(box: HTMLElement, api: SklApi): View {
  const en = api.lang === 'en', T = (zh: string, e: string) => (en ? e : zh);
  let t = DUR, fresh = -1;
  const st = stage(box, {
    raf: api.raf, caf: api.caf, cam: [0, 2.6, 10], look: [0, 1.95, 0.2], fit: 2.65, yaw: 0,
    busy: () => t < DUR, tick: (dt) => { if (t < DUR) { t = Math.min(DUR, t + dt); pose(); } },
    tap: (x, y) => {
      let best = -1, bd = 1e9;
      CARD.forEach((c, i) => { const [sx, sy] = st.toScreen(new Vector3(...c)); const d = Math.hypot(sx - x, sy - y); if (d < bd) { bd = d; best = i; } });
      if (best >= 0 && bd < 70) api.pick(best);
    },
  });
  rig(st);
  const P = st.pivot;
  /* R31d: a workshop wall behind (a pegboard with a shelf, two hanging tools, a lamp) and a plant, so the stage is not bare */
  const peg = paint(256, 192, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f6f3ff'); gr.addColorStop(1, '#e9e3fd'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(124,108,240,.12)'; for (let y = 12; y < h; y += 16) for (let x = 12; x < w; x += 16) { g.beginPath(); g.arc(x, y, 2.4, 0, 7); g.fill(); }
  });
  const wall = new Group(); wall.position.set(0, 0, -2.2); P.add(wall);
  wall.add(rb(9, 9, 0.16, 0.2, matte('#efe9ff', { map: peg, emissive: '#e4dcfc', glow: 0.18 }), 0, 4.2, 0));
  wall.add(rb(1.9, 0.08, 0.4, 0.03, gloss('#cbbff5'), -2.3, 3.6, 0.25));
  for (const [x, c, h] of [[-2.9, '#f6a04d', 0.36], [-2.55, '#5fb878', 0.26], [-2.2, '#93c5fd', 0.42], [-1.85, '#f472b6', 0.3]] as const) wall.add(rb(0.24, h, 0.24, 0.05, gloss(c), x, 3.64 + h / 2, 0.25));
  const wr = rb(0.12, 0.9, 0.06, 0.05, metal('#b9bccd'), 2.5, 3.5, 0.15); wr.rotation.z = 0.25; wall.add(wr, rb(0.42, 0.18, 0.08, 0.06, metal('#b9bccd'), 2.62, 3.95, 0.15));
  const hm = rb(0.1, 0.8, 0.06, 0.04, gloss('#c98b4a'), 2.95, 3.4, 0.15); hm.rotation.z = -0.2; wall.add(hm, rb(0.42, 0.2, 0.14, 0.05, metal('#55536e'), 3.03, 3.8, 0.15));
  P.add(glowDisc(1.0, 'rgba(255,231,163,.5)', 0.4, true)).children.at(-1)!.position.set(0.0, 4.4, -2.0);
  const pl = plant('#f4f1fb', '#5fb878', 0.95); pl.position.set(-2.55, 0, -0.6); P.add(pl);
  /* the robot on its plinth, with a halo */
  P.add(glowDisc(2.2, 'rgba(167,139,250,.6)', 0.55));
  P.add(plinth(st, 2.6, 2.0, 0.3, '#ddd5fb', 0, true));
  const bot = robot(); bot.g.scale.setScalar(S); P.add(bot.g);
  bot.chest.visible = false;
  const CH = new Vector3(0, 0.92 * S, 0.5 * S);
  /* layered chest slot: metal frame, dark panel, five ports with lit rims */
  P.add(rb(1.02, 0.82, 0.08, 0.14, metal('#c9cbe0'), CH.x, CH.y, CH.z - 0.06));
  P.add(rb(0.9, 0.7, 0.1, 0.1, gloss('#1f2047'), CH.x, CH.y, CH.z - 0.01));
  const ports = SKL_TOOLS.map((_, i) => { const p = rb(0.1, 0.44, 0.06, 0.04, gloss('#3d3f78'), CH.x + (i - 2) * 0.16, CH.y + 0.04, CH.z + 0.05); P.add(p); return p; });
  const shield = new Group(); shield.position.set(CH.x, CH.y - 0.02, CH.z + 0.12); P.add(shield);
  shield.add(rb(0.36, 0.4, 0.06, 0.14, gloss('#22c55e', { emissive: '#22c55e', glow: 0.8 })), face(0.26, 0.26, iconTex('shield', '#ffffff'), false, 0, 0, 0.04));
  const sg = glowDisc(0.75, 'rgba(74,222,128,.9)', 0.6, true); sg.position.z = -0.02; shield.add(sg);
  /* the five cards: white card, painted icon tile, a little floor shadow */
  const cards = CARD.map((c, i) => {
    const g = new Group(); g.position.set(...c); g.rotation.y = -c[0] * 0.1; P.add(g);
    g.add(rb(1.34, 1.06, 0.28, 0.16, gloss('#ffffff', { emissive: '#ffffff', glow: 0.12 }))); // a thick rounded card
    g.add(rb(0.52, 0.48, 0.16, 0.12, gloss('#efeaff'), 0, 0.17, 0.12), face(0.4, 0.4, iconTex(ICONS[i]!, '#7c6cf0'), false, 0, 0.17, 0.205)); // raised icon tile
    g.add(rb(1.2, 0.92, 0.04, 0.12, gloss('#fbfaff', { emissive: '#ffffff', glow: 0.2 }), 0, 0, 0.13)); // bevelled front plate
    g.add(rb(1.3, 1.02, 0.12, 0.14, gloss('#ddd6f7'), 0, -0.02, -0.12)); // darker back edge
    const sh = st.blob(1, 0.12); sh.scale.set(0.8, 0.5, 1); sh.position.set(0, -0.9, -0.1); g.add(sh);
    return g;
  });
  const tags = SKL_TOOLS.map(([, , zh, e]) => st.tag(T(zh, e), 'onw'));
  CARD.forEach((c, i) => tags[i]!.at.set(c[0], c[1] - 0.27, c[2] + 0.2));
  const tOk = st.tag(`🛡️ ${T('已连接', 'Connected')}`, 'ok');
  tOk.at.set(CH.x, CH.y - 0.66, CH.z + 0.2);
  const tAsk = st.tag(`✋ ${T('先问你', 'Asks first')}`, 'soft');
  tAsk.at.set(0, 2.95 * S + 0.25, 0.3);
  /* cables: rebuilt on every change; the freshly plugged one grows */
  let wires: Group[] = [], grow: { w: Group; plug: Group } | null = null;
  const edge = (i: number) => { const c = CARD[i]!; const s = Math.sign(c[0]); return new Vector3(c[0] - s * 0.5, c[1] - 0.5, c[2] + 0.05); };
  function plug(on: boolean) {
    const g = new Group();
    g.add(rb(0.2, 0.28, 0.2, 0.07, gloss(on ? '#7c6cf0' : '#8b7cf6')), rb(0.09, 0.11, 0.09, 0.02, metal('#d4d8e6'), 0, -0.19, 0));
    return g;
  }
  function pose() {
    const k = Math.min(1, t / GROW), e = 1 - (1 - k) ** 3, wob = t < DUR ? Math.sin((t / DUR) * Math.PI) : 0;
    cards.forEach((c, i) => { c.position.y = CARD[i]![1] + wob * 0.06 * Math.sin(i * 1.7 + t * 9); });
    if (grow) {
      grow.w.children.forEach((m) => { const gm = (m as Mesh).geometry as BufferGeometry | undefined; if (gm?.index) gm.setDrawRange(0, Math.ceil((gm.index.count * e) / 6) * 6); });
      const cv = curveOf(grow.w), p = cv.getPoint(e), d = cv.getTangent(Math.min(0.999, e));
      grow.plug.position.copy(p); grow.plug.quaternion.setFromUnitVectors(new Vector3(0, -1, 0), d);
    }
  }
  let last: number[] = [];
  function update() {
    wires.forEach(freeObj); wires = []; grow = null;
    const on = api.on();
    fresh = on.find((i) => !last.includes(i)) ?? -1;
    const moved = on.length !== last.length || fresh >= 0;
    last = on.slice();
    SKL_TOOLS.forEach((_, i) => {
      const a = edge(i), s = Math.sign(CARD[i]![0]), isOn = on.includes(i), pm = ports[i]!.material as ReturnType<typeof satin>;
      if (isOn) {
        const b = new Vector3(CH.x + (i - 2) * 0.16, CH.y + 0.04, CH.z + 0.14);
        const w = cable(a, b, a.clone().add(new Vector3(-s * 0.2, -0.7, 0.5)), b.clone().add(new Vector3(s * 0.55, -0.15, 0.6)), 0.045, '#8b5cf6', '#c4b5fd', 0.3);
        P.add(w); wires.push(w);
        if (i === fresh) { const pl = plug(true); w.add(pl); grow = { w, plug: pl }; }
        pm.color.set('#4ade80'); pm.emissive.set('#22c55e'); pm.emissiveIntensity = 0.8;
      } else {
        /* not plugged in: a thin pale cable already runs towards the robot, its plug waiting just short of the port */
        const port = new Vector3(CH.x + (i - 2) * 0.16, CH.y + 0.04, CH.z + 0.14), b = a.clone().lerp(port, 0.5).add(new Vector3(0, -0.55, 0.35));
        const w = cable(a, b, a.clone().add(new Vector3(-s * 0.15, -0.75, 0.4)), b.clone().add(new Vector3(s * 0.25, -0.1, 0)), 0.03, '#b9b3da', '#c4b5fd', 0);
        const pl = plug(false); pl.position.copy(b); pl.quaternion.setFromUnitVectors(new Vector3(0, -1, 0), port.clone().sub(b).normalize()); w.add(pl);
        P.add(w); wires.push(w);
        pm.color.set('#3d3f78'); pm.emissive.set('#000000'); pm.emissiveIntensity = 0;
      }
      (cards[i]!.children[0]! as Mesh).scale.setScalar(isOn ? 1.05 : 1);
      ((cards[i]!.children[1]! as Mesh).material as ReturnType<typeof satin>).color.set(isOn ? '#dcfce7' : '#efeaff');
    });
    shield.visible = on.length > 0; tOk.show(on.length > 0);
    tAsk.show(api.ask());
    t = moved ? 0 : DUR; pose();
    st.draw();
  }
  update();
  return { update, dispose: () => { wires = []; grow = null; st.dispose(); } };
}
