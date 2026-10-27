/* R33 pilot v4, page 1: the home page is a real three.js floating island (the reference "Explore the AI Universe!"),
   modelled in code: a bumped grass top and a faceted rocky underside, a glowing path between the things and along the
   cliff, round toy trees, a meadow of tiny flowers, birds, drifting soft clouds and two far islets in the haze. Six
   modelled things, one per 「我想…」 door, each a tap target on its own glowing pad: the price-tag shop (call an API), the
   circuit monitor with keyboard and mouse (run a model locally), the robot with a headset and a magnifier (find an
   agent), the purple toolbox of cards (skills), the lego house with a tiny robot (build an agent) and the glowing brain
   under a glass ring (how it works). Drag to orbit, pinch to zoom, tap a thing: the camera flies to it, its bubble opens. */
import {
  CapsuleGeometry, CylinderGeometry, ExtrudeGeometry, Group, InstancedMesh, LatheGeometry, Mesh, MeshBasicMaterial, Object3D,
  PlaneGeometry, Shape, SphereGeometry, TorusGeometry, Vector2, Vector3, Color, type Sprite,
} from 'three';
import { drawIcon, type Icon } from '../kit';
import { scene, V, type P3, type SApi } from './base';
import { canvasTex, glassP, glow, rbox, shade, text, toy } from './look';
import { bird, brainLobe, flowers, glowPath, island, puff, rnd, tree } from './props';
import { DOORS, t } from '../../pilot3d/text';

/** where the six things stand on the island (x, z), in the doors' order */
export const SPOTS: [number, number][] = [[-1.8, -1.15], [0, -1.3], [1.8, -1.15], [-1.75, 0.8], [0, 0.85], [1.75, 0.8]];
const add = (g: Group, ...o: Object3D[]) => { g.add(...o); return o[0]!; };

function shop(): Group {
  const g = new Group();
  add(g, rbox(1.3, 0.12, 1.0, 0.05, toy('#b9b3c9', { rough: 0.7 }), 0, 0.06, 0));
  add(g, rbox(1.0, 0.66, 0.74, 0.06, toy('#f6c27a'), 0, 0.45, 0));
  add(g, rbox(1.06, 0.08, 0.8, 0.03, toy('#5b7fd6'), 0, 0.8, 0));
  /* the roof: a red prism with soft edges */
  const s = new Shape(); s.moveTo(-0.6, 0); s.lineTo(0.6, 0); s.lineTo(0, 0.48); s.closePath();
  const roof = add(g, new Mesh(new ExtrudeGeometry(s, { depth: 0.78, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3 }), toy('#e5534b')));
  roof.position.set(0, 0.84, -0.39);
  add(g, new Mesh(new CylinderGeometry(0.07, 0.08, 0.3, 16), toy('#c2410c'))).position.set(0.28, 1.25, -0.1);
  add(g, new Mesh(new CylinderGeometry(0.1, 0.1, 0.03, 20), toy('#fde68a', { emissive: '#fbbf24', glow: 0.6 }))).rotation.set(Math.PI / 2, 0, 0);
  g.children[g.children.length - 1]!.position.set(0, 1.04, 0.42);
  /* door, windows, flower boxes */
  add(g, rbox(0.24, 0.4, 0.05, 0.04, toy('#b45309'), 0.18, 0.32, 0.37));
  add(g, new Mesh(new SphereGeometry(0.02, 8, 6), toy('#fde047', { metal: 0.6 }))).position.set(0.26, 0.32, 0.4);
  for (const x of [-0.24]) {
    add(g, rbox(0.26, 0.24, 0.04, 0.03, toy('#ffffff'), x, 0.48, 0.37));
    add(g, rbox(0.2, 0.18, 0.04, 0.02, toy('#93c5fd', { emissive: '#60a5fa', glow: 0.5, rough: 0.1 }), x, 0.48, 0.38));
    add(g, rbox(0.28, 0.06, 0.08, 0.02, toy('#a16207'), x, 0.33, 0.4));
    for (let k = 0; k < 4; k++) add(g, new Mesh(new SphereGeometry(0.03, 8, 6), toy(k % 2 ? '#f472b6' : '#fde047'))).position.set(x - 0.09 + k * 0.06, 0.38, 0.42);
  }
  /* the striped awning with a scalloped edge */
  const stripes = canvasTex(256, 64, (c, w, h) => { for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#ffffff' : '#ef4444'; c.fillRect((k * w) / 8, 0, w / 8 + 1, h); } });
  const aw = add(g, rbox(1.0, 0.05, 0.3, 0.02, toy('#ffffff', { map: stripes }), 0, 0.72, 0.5)); aw.rotation.x = 0.45;
  for (let k = 0; k < 8; k++) add(g, new Mesh(new SphereGeometry(0.062, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toy(k % 2 ? '#ffffff' : '#ef4444'))).position.set(-0.44 + k * 0.126, 0.66, 0.64);
  /* the hanging price tag */
  const tag = new Group(); tag.position.set(-0.56, 0.78, 0.4); g.add(tag);
  add(tag, new Mesh(new CylinderGeometry(0.006, 0.006, 0.16, 6), toy('#78716c'))).position.y = -0.08;
  const face = canvasTex(128, 160, (c, w, h) => {
    c.fillStyle = '#fb923c'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(w / 2, 22, 9, 0, 7); c.fill();
    c.fillStyle = '#fff7ed'; c.beginPath(); c.roundRect(18, 46, w - 36, h - 64, 16); c.fill(); text(c, '¥$', w / 2, 98, 80, 46, '#ea580c', 800);
  });
  const tg = add(tag, rbox(0.3, 0.38, 0.04, 0.05, toy('#fb923c'))); tg.position.y = -0.33;
  add(tag, new Mesh(new PlaneGeometry(0.27, 0.34), toy('#ffffff', { map: face }))).position.set(0, -0.33, 0.022);
  tag.name = 'tag';
  return g;
}
function monitor(): Group {
  const g = new Group(), frame = toy('#e9ebf3', { rough: 0.3 });
  add(g, rbox(0.5, 0.05, 0.3, 0.02, frame, 0, 0.03, -0.15));
  add(g, rbox(0.1, 0.36, 0.06, 0.03, frame, 0, 0.22, -0.18));
  add(g, rbox(1.3, 0.88, 0.08, 0.06, frame, 0, 0.78, -0.15));
  const scr = canvasTex(512, 340, (c, w, h) => {
    const bg = c.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.6); bg.addColorStop(0, '#1e3a8a'); bg.addColorStop(1, '#0b1440'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#38bdf8'; c.fillStyle = '#7dd3fc'; c.lineWidth = 4; c.shadowColor = '#38bdf8'; c.shadowBlur = 14;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2, x0 = w / 2 + Math.cos(a) * 60, y0 = h / 2 + Math.sin(a) * 60, mid = 95 + (k % 3) * 25;
      const x1 = w / 2 + Math.cos(a) * mid, y1 = h / 2 + Math.sin(a) * mid * 0.8, x2 = x1 + (Math.cos(a) > 0 ? 40 : -40);
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x2, y1); c.stroke(); c.beginPath(); c.arc(x2, y1, 7, 0, 7); c.fill();
    }
    c.lineWidth = 7; c.strokeStyle = '#7dd3fc'; c.beginPath(); c.roundRect(w / 2 - 52, h / 2 - 52, 104, 104, 14); c.stroke();
    c.fillStyle = '#2563eb'; c.beginPath(); c.roundRect(w / 2 - 34, h / 2 - 34, 68, 68, 8); c.fill();
  });
  add(g, new Mesh(new PlaneGeometry(1.18, 0.76), new MeshBasicMaterial({ map: scr, toneMapped: false }))).position.set(0, 0.78, -0.105);
  const sg = glow('#60a5fa', 1.6, 0.35); sg.position.set(0, 0.78, -0.05); g.add(sg);
  const keys = canvasTex(256, 96, (c, w, h) => { c.fillStyle = '#f8fafc'; c.fillRect(0, 0, w, h); c.fillStyle = '#d6d9e6'; for (let r = 0; r < 4; r++) for (let k = 0; k < 14; k++) { c.beginPath(); c.roundRect(6 + k * 17.8, 8 + r * 21, 14, 16, 3); c.fill(); } });
  add(g, rbox(0.95, 0.05, 0.32, 0.02, toy('#f8fafc', { map: keys }), -0.1, 0.03, 0.32));
  const mouse = add(g, new Mesh(new SphereGeometry(0.07, 16, 12), toy('#f8fafc'))); mouse.scale.set(0.8, 0.5, 1.15); mouse.position.set(0.55, 0.035, 0.34);
  return g;
}
function robot(s = 1): Group {
  const g = new Group(), white = toy('#f5f6fb', { rough: 0.3 }), blue = toy('#60a5fa', { rough: 0.3 }), dark = toy('#1e1b4b', { rough: 0.15, coat: 1 });
  const body = add(g, new Mesh(new LatheGeometry([new Vector2(0, 0), new Vector2(0.2, 0.02), new Vector2(0.26, 0.15), new Vector2(0.24, 0.35), new Vector2(0.16, 0.45), new Vector2(0, 0.47)], 32), white));
  body.position.y = 0.2;
  for (const x of [-0.1, 0.1]) { add(g, new Mesh(new CapsuleGeometry(0.06, 0.1, 6, 12), white)).position.set(x, 0.14, 0); add(g, rbox(0.15, 0.07, 0.2, 0.03, blue, x, 0.04, 0.03)); }
  add(g, new Mesh(new SphereGeometry(0.07, 16, 12), toy('#93c5fd', { emissive: '#3b82f6', glow: 0.6 }))).position.set(0, 0.45, 0.22);
  const head = new Group(); head.position.y = 0.88; g.add(head);
  add(head, rbox(0.66, 0.5, 0.52, 0.2, white));
  add(head, rbox(0.52, 0.32, 0.06, 0.12, dark, 0, -0.01, 0.25));
  for (const x of [-0.11, 0.11]) {
    const e = add(head, new Mesh(new CapsuleGeometry(0.045, 0.05, 6, 12), new MeshBasicMaterial({ color: '#67e8f9', toneMapped: false }))); e.position.set(x, 0, 0.29);
    const gl = glow('#22d3ee', 0.28, 0.7); gl.position.set(x, 0, 0.31); head.add(gl);
  }
  for (const x of [-0.35, 0.35]) { const p = add(head, new Mesh(new CylinderGeometry(0.11, 0.11, 0.08, 24), blue)); p.rotation.z = Math.PI / 2; p.position.x = x; }
  const band = add(head, new Mesh(new TorusGeometry(0.36, 0.025, 8, 32, Math.PI), blue)); band.position.y = 0.02;
  add(head, new Mesh(new CylinderGeometry(0.012, 0.012, 0.16, 8), white)).position.y = 0.33;
  add(head, new Mesh(new SphereGeometry(0.045, 12, 8), toy('#93c5fd', { emissive: '#60a5fa', glow: 0.8 }))).position.y = 0.43;
  /* arms; the right one holds the magnifier */
  const armL = add(g, new Mesh(new CapsuleGeometry(0.055, 0.22, 6, 12), white)); armL.position.set(-0.3, 0.42, 0.02); armL.rotation.z = -0.35;
  const armR = add(g, new Mesh(new CapsuleGeometry(0.055, 0.22, 6, 12), white)); armR.position.set(0.3, 0.45, 0.08); armR.rotation.set(-0.7, 0, 0.5);
  const mag = new Group(); mag.position.set(0.48, 0.52, 0.28); mag.rotation.set(0, -0.35, -0.25); g.add(mag);
  add(mag, new Mesh(new TorusGeometry(0.17, 0.03, 12, 40), toy('#7aa7e8', { metal: 0.4, rough: 0.25 })));
  add(mag, new Mesh(new CylinderGeometry(0.155, 0.155, 0.02, 40), glassP('#dbeafe', { thick: 0.15 }))).rotation.x = Math.PI / 2;
  add(mag, new Mesh(new CylinderGeometry(0.03, 0.035, 0.26, 12), toy('#312e81'))).position.set(0.06, -0.3, 0);
  g.scale.setScalar(s); g.name = 'bot'; return g;
}
function toolbox(): Group {
  const g = new Group(), pur = toy('#7c5cd6', { rough: 0.3 }), pur2 = toy('#9b7ff0', { rough: 0.3 });
  add(g, rbox(1.15, 0.46, 0.68, 0.07, pur, 0, 0.23, 0));
  add(g, rbox(1.2, 0.07, 0.72, 0.03, pur2, 0, 0.46, 0));
  const lid = new Group(); lid.position.set(0, 0.48, -0.34); lid.rotation.x = -1.95; g.add(lid);
  add(lid, rbox(1.15, 0.08, 0.68, 0.05, pur, 0, 0, 0.34));
  add(g, rbox(0.18, 0.12, 0.05, 0.02, toy('#facc15', { metal: 0.3 }), 0, 0.38, 0.35));
  const icons: [Icon, string][] = [['puzzle', '#f97316'], ['code', '#14b8a6'], ['heart', '#ef4444'], ['globe', '#38bdf8']];
  icons.forEach(([ic, col], k) => {
    const tex = canvasTex(128, 168, (c, w, h) => { c.fillStyle = col; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.roundRect(14, 14, w - 28, h - 28, 14); c.fill(); drawIcon(c, ic, w / 2 - 34, h / 2 - 34, 68, col); });
    const card = new Group(); card.position.set(-0.36 + k * 0.24, 0.62, -0.05 + (k % 2) * 0.08); card.rotation.set(-0.2, 0, (k - 1.5) * 0.18); g.add(card);
    add(card, rbox(0.3, 0.4, 0.025, 0.03, toy(col)));
    add(card, new Mesh(new PlaneGeometry(0.27, 0.36), toy('#ffffff', { map: tex }))).position.z = 0.014;
  });
  return g;
}
function lego(): Group {
  const g = new Group(), cells: [number, number, number][] = [];
  for (let y = 0; y < 6; y++) for (let x = -2; x <= 1; x++) for (let z = -1; z <= 1; z++) {
    const door = (x === -1 || x === 0) && z >= 0 && y < 3, top = y === 5 && (x === -2 || z === 1 || rnd(x * 3 + z * 7) > 0.6), tower = y === 5 && x === 1 && z === -1;
    if (door || (y === 5 && !top && !tower)) continue;
    cells.push([x, y, z]);
  }
  const W = 0.24, H = 0.16, pal = ['#3b82f6', '#ef4444', '#facc15', '#22c55e', '#8b5cf6', '#2563eb', '#f97316'].map((c) => new Color(c));
  const br = new InstancedMesh(rbox(W - 0.012, H - 0.012, W - 0.012, 0.03, toy('#ffffff')).geometry, toy('#ffffff', { rough: 0.32, coat: 0.9 }), cells.length);
  const st = new InstancedMesh(new CylinderGeometry(0.055, 0.055, 0.04, 16), toy('#ffffff', { rough: 0.32, coat: 0.9 }), cells.length);
  const o = new Object3D();
  cells.forEach(([x, y, z], k) => {
    const c = pal[Math.floor(rnd(x * 13 + y * 7 + z * 3) * pal.length)]!;
    o.position.set((x + 0.5) * W, y * H + H / 2 + 0.02, z * W); o.updateMatrix(); br.setMatrixAt(k, o.matrix); br.setColorAt(k, c);
    o.position.y += H / 2 + 0.015; o.updateMatrix(); st.setMatrixAt(k, o.matrix); st.setColorAt(k, c);
  });
  br.castShadow = st.castShadow = true; br.receiveShadow = true; g.add(br, st);
  add(g, rbox(1.1, 0.04, 0.85, 0.02, toy('#a8a3b8'), 0, 0.01, 0));
  const mini = robot(0.36); mini.name = ''; mini.position.set(0, 0.03, 0.12); g.add(mini);
  const lamp = glow('#c4b5fd', 0.7, 0.5); lamp.position.set(0, 0.25, 0.25); g.add(lamp);
  return g;
}
function brain(): { g: Group; lobes: Mesh[]; aura: Sprite } {
  const g = new Group(), m = toy('#f472b6', { rough: 0.3, coat: 1, emissive: '#c026d3', glow: 0.45 });
  const lobes = [-1, 1].map((sd) => {
    const geo = brainLobe(sd);
    const l = new Mesh(geo, m); l.scale.set(0.62, 0.68, 0.95); l.position.set(sd * 0.19, 0.5, 0); g.add(l); return l;
  });
  const stem = add(g, new Mesh(new CapsuleGeometry(0.07, 0.18, 6, 12), m)); stem.position.set(0, 0.22, -0.05);
  /* glowing strands dripping down, and a glass ring and dome */
  const strand = new MeshBasicMaterial({ color: '#e9d5ff', toneMapped: false, transparent: true, opacity: 0.85 });
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2, r = 0.22 + (k % 2) * 0.08, h = 0.06 + rnd(k) * 0.08, c = add(g, new Mesh(new CylinderGeometry(0.008, 0.008, h, 6), strand));
    c.position.set(Math.cos(a) * r, 0.26 - h / 2, Math.sin(a) * r * 0.8);
    add(g, new Mesh(new SphereGeometry(0.022, 8, 6), strand)).position.set(Math.cos(a) * r, 0.26 - h, Math.sin(a) * r * 0.8);
  }
  add(g, new Mesh(new CylinderGeometry(0.55, 0.6, 0.08, 48), glassP('#efe7ff', { thick: 0.3 }))).position.y = 0.04;
  const ring = add(g, new Mesh(new TorusGeometry(0.58, 0.035, 16, 64), glassP('#e9d5ff', { thick: 0.2, glow: '#c084fc', gi: 0.5 }))); ring.rotation.x = Math.PI / 2; ring.position.y = 0.1;
  const aura = glow('#e879f9', 2.0, 0.7); aura.position.set(0, 0.5, 0); g.add(aura);
  return { g, lobes, aura };
}

export function make(box: HTMLElement, api: SApi): P3 {
  return scene(box, api, (st, P) => {
    const I = island(3.3, 0.86, 2.5, 1.3); P.add(I.g);
    /* the things, each on a raised pad with a glowing ring */
    const padM = toy('#7cc35a', { rough: 0.8, coat: 0.1 }), ringM = new MeshBasicMaterial({ color: '#f5efff', toneMapped: false, transparent: true, opacity: 0.9 });
    const B = brain(), things = [shop(), monitor(), robot(), toolbox(), lego(), B.g];
    const hits = things.map((th, k) => {
      const [x, z] = SPOTS[k]!, hold = new Group(); hold.position.set(x, 0, z); P.add(hold);
      const pad = new Mesh(new CylinderGeometry(0.78, 0.84, 0.1, 48), padM); pad.position.y = 0.05; pad.receiveShadow = true; hold.add(pad);
      const ring = new Mesh(new TorusGeometry(0.8, 0.018, 8, 72), ringM); ring.rotation.x = Math.PI / 2; ring.position.y = 0.1; hold.add(ring);
      th.position.y = 0.1; th.scale.multiplyScalar(1.1); hold.add(th); shade(th); return hold;
    });
    things[0]!.rotation.y = 0.25; things[2]!.rotation.y = -0.3; things[3]!.rotation.y = 0.2; things[5]!.rotation.y = -0.2;
    /* the glowing paths: one between the two rows, one along the front cliff */
    P.add(glowPath([V(-2.9, 0.06, -0.2), V(-1.2, 0.06, -0.1), V(-0.6, 0.06, -0.35), V(0.6, 0.06, -0.3), V(1.3, 0.06, -0.05), V(2.9, 0.06, -0.15)]));
    const cliff: Vector3[] = [];
    for (let k = 0; k <= 12; k++) { const a = 0.35 + (k / 12) * (Math.PI - 0.7), r = I.edge(a) * 0.97; cliff.push(V(Math.cos(a) * r, -0.55 - 0.18 * Math.sin(k * 1.3), Math.sin(a) * r * I.sz + 0.04)); }
    P.add(glowPath(cliff, '#f3eeff', 0.018, 12));
    /* trees round the rim and between, flowers in the grass */
    const trees: [number, number, number][] = [[-3.0, 0.1, 0.9], [-2.75, -1.3, 0.8], [2.9, -0.9, 0.95], [2.85, 0.5, 0.9], [-0.95, 0.15, 0.7], [0.95, -2.05, 0.7], [-0.9, -2.15, 0.75], [1.0, 1.85, 0.6], [-2.6, 1.6, 0.7], [0.9, 0.3, 0.55]];
    trees.forEach(([x, z, s], k) => { const tr = tree(s, k * 3.1); tr.position.set(x, 0.02, z); P.add(tr); });
    const spots: Vector3[] = [];
    for (let k = 0; spots.length < 70 && k < 400; k++) {
      const a = rnd(k) * Math.PI * 2, r = Math.sqrt(rnd(k + 0.5)) * 3.0, x = Math.cos(a) * r, z = Math.sin(a) * r * I.sz;
      if (SPOTS.some(([sx, sz]) => Math.hypot(sx - x, sz - z) < 0.9)) continue;
      spots.push(V(x, 0.05, z));
    }
    P.add(flowers(spots));
    /* clouds below and behind, two far islets, birds */
    const clouds = ([[-3.9, -2.3, 1.2, 1.0], [3.9, -2.8, 0.6, 1.2], [-4.2, 1.6, -5, 1.1], [4.6, 2.2, -6, 1.3], [0.6, -4.2, -1.5, 1.5], [-1.2, 3.4, -8, 1.0]] as const).map(([x, y, z, s], k) => {
      const c = puff(s, k * 4.7); c.position.set(x, y, z); P.add(c); return { c, x, v: 0.05 + rnd(k) * 0.06 };
    });
    for (const [x, y, z, s] of [[-5.2, 0.8, -6.5, 0.28], [5.4, 0.2, -5.5, 0.24]] as const) {
      const fi = island(3.3, 0.86, 2.5, x); fi.g.scale.setScalar(s); fi.g.position.set(x, y, z); P.add(fi.g);
      const tr = tree(1.6, x); tr.position.set(x, y, z); P.add(tr);
    }
    const birds = [0, 1, 2].map((k) => { const b = bird(); b.g.position.set(-1.5 + k * 1.4, 2.8 + k * 0.3, -3 - k); b.g.scale.setScalar(0.9 - k * 0.15); P.add(b.g); return b; });
    /* the pointing hand of the reference, on the brain ("start here"), until the first tap */
    const hand = st.tag('<i>👆</i>', 'p3h'); hand.at.set(SPOTS[5]![0] + 0.55, 0.45, SPOTS[5]![1] + 0.5);
    let seen = false, tt = 0, idle = 0;
    const poke = () => { idle = 0; st.draw(); };
    st.canvas.addEventListener('pointerdown', poke);
    const tagG = things[0]!.getObjectByName('tag')!, bot = things[2]!;
    const pos = (k: number, y: number) => V(SPOTS[k]![0], y, SPOTS[k]![1]);
    const TOPY = [1.55, 1.3, 1.45, 1.05, 1.25, 1.2];
    /* the back row sits behind the front row: look down on it from higher up, so the front thing does not hide it */
    const view = (k: number) => (k < 3 ? { look: pos(k, 0.9), dir: V(0, 1.7, 1), r: 1.7 } : { look: pos(k, 0.85), dir: V(0, 0.8, 1), r: 1.35 });
    return {
      look: { sky: ['#c4bbee', '#ddd5f8', '#f1ecfc'], exposure: 0.92, fog: [2, 14], shadow: 4.2, key: [3, 9, 5] },
      lim: { az: [-0.8, 0.8], el: [0.12, 1.25], z: [0.62, 1.35] },
      cam: { look: V(0, -0.55, 0.2), dir: V(0, 0.6, 1), r: 2.9 }, view,
      at: SPOTS.map((_, k) => pos(k, 0.55)), top: SPOTS.map((_, k) => pos(k, TOPY[k]!)),
      names: DOORS.map((d) => t(d.name, api.lang)), hits,
      onFocus(i) { if (i !== null) seen = true; hand.show(!seen); poke(); },
      busy: () => idle < 30, sway: () => true,
      tick(dt) {
        tt += dt; idle += dt;
        bot.position.y = 0.1 + Math.sin(tt * 2) * 0.04; bot.rotation.y = -0.3 + Math.sin(tt * 0.7) * 0.15;
        tagG.rotation.z = Math.sin(tt * 1.6) * 0.12;
        const pu = 0.32 + 0.22 * (0.5 + 0.5 * Math.sin(tt * 2.4));
        for (const l of B.lobes) (l.material as unknown as { emissiveIntensity: number }).emissiveIntensity = pu;
        B.aura.material.opacity = 0.4 + 0.25 * Math.sin(tt * 2.4);
        clouds.forEach((c) => { c.c.position.x = c.x + Math.sin(tt * c.v) * 0.8; });
        birds.forEach((b, k) => { b.flap(tt + k); b.g.position.x = ((tt * 0.35 + k * 2.2) % 9) - 4.5; b.g.position.y = 2.8 + k * 0.3 + Math.sin(tt + k) * 0.15; });
      },
      bye() { st.canvas.removeEventListener('pointerdown', poke); },
    };
  });
}
