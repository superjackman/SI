/* R31: small building blocks shared by the five R31 scenes (rounded boxes, plinths, a cloud, a robot, a person,
   cables). Uses only three.js parts the R30 scenes already use, so the three chunk does not grow; this file is its own
   small chunk, loaded with the first R31 scene. */
import { CubicBezierCurve3, CylinderGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry, TorusGeometry, TubeGeometry, Vector3, type CanvasTexture, type DirectionalLight, type PlaneGeometry, type HemisphereLight, type Material, type Object3D, type Texture } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { satin, type Stage } from './core';

type M = Material | string;
const mat = (m: M) => (typeof m === 'string' ? satin(m) : m);
/** a rounded box (r = corner radius) at x, y, z */
export const rb = (w: number, h: number, d: number, r: number, m: M, x = 0, y = 0, z = 0) => {
  const o = new Mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)), mat(m)); o.position.set(x, y, z); return o;
};
export const cyl = (rt: number, rbt: number, h: number, m: M, x = 0, y = 0, z = 0, seg = 48) => { const o = new Mesh(new CylinderGeometry(rt, rbt, h, seg), mat(m)); o.position.set(x, y, z); return o; };
export const ball = (r: number, m: M, x = 0, y = 0, z = 0) => { const o = new Mesh(new SphereGeometry(r, 32, 20), mat(m)); o.position.set(x, y, z); return o; };
export const ring = (R: number, r: number, m: M) => new Mesh(new TorusGeometry(R, r, 12, 48), mat(m));
export const glowMat = (color: string, a = 0.25) => new MeshBasicMaterial({ color, transparent: true, opacity: a, depthWrite: false });
/** a thick rounded plinth with a soft shadow under it; top surface at y = top */
export function plinth(st: Stage, w: number, d: number, h: number, color: string, top = 0, round = false): Group {
  const g = new Group();
  const body = round ? cyl(w / 2, w / 2, h, color) : rb(w, h, d, Math.min(0.22, h / 2.2), color);
  if (round) body.scale.z = d / w;
  body.position.y = top - h / 2; g.add(body);
  const sh = st.blob(1, 0.22); sh.scale.set(w * 0.62, d * 0.62, 1); sh.position.y = top - h - 0.02; g.add(sh);
  return g;
}
/** a puffy white cloud of balls */
export function cloud(s = 1): Group {
  const g = new Group(), m = satin('#ffffff');
  for (const [x, y, z, r] of [[0, 0.1, 0, 0.55], [-0.6, -0.05, 0.05, 0.4], [0.62, -0.05, 0.05, 0.42], [-0.25, 0.35, -0.1, 0.4], [0.3, 0.32, -0.1, 0.38], [0, -0.15, 0.25, 0.4]] as const) g.add(ball(r, m, x, y, z));
  g.scale.setScalar(s); return g;
}
/** a glowing cable (core + soft glow) along a cubic curve; returns the group (free it with freeObj) */
export function cable(a: Vector3, b: Vector3, c1: Vector3, c2: Vector3, r: number, core: string, glow = '#c4b5fd', ga = 0.22): Group {
  const g = new Group(), cv = new CubicBezierCurve3(a, c1, c2, b);
  g.add(new Mesh(new TubeGeometry(cv, 48, r, 10, false), satin(core, { emissive: core, glow: 0.35 })));
  if (ga > 0) g.add(new Mesh(new TubeGeometry(cv, 48, r * 2.4, 10, false), glowMat(glow, ga)));
  (g as Group & { curve?: CubicBezierCurve3 }).curve = cv;
  return g;
}
export const curveOf = (g: Group) => (g as Group & { curve?: CubicBezierCurve3 }).curve!;
/** free the geometry and materials of a group made for one state (the stage frees everything else on leave) */
export function freeObj(o: Object3D) {
  o.parent?.remove(o);
  o.traverse((c) => { const m = c as Object3D & { geometry?: { dispose(): void }; material?: { dispose(): void } }; m.geometry?.dispose(); m.material?.dispose(); });
}
export interface Bot { g: Group; head: Mesh; body: Mesh; chest: Mesh; eyes: Mesh[]; arms: Group[] }
/** a friendly glossy white robot (R31b): helmet head with a dark screen face (glowing eyes + smile), a lit antenna, ear
    pods, neck / shoulder / elbow joints, and a rounded body with a layered chest slot */
export function robot(o: Partial<{ body: string; visor: string; eye: string; slot: string; trim: string }> = {}): Bot {
  const g = new Group(), white = gloss(o.body ?? '#f6f5fc'), joint = gloss('#d5d2ea'), trim = gloss(o.trim ?? '#8b7cf6', { emissive: o.trim ?? '#8b7cf6', glow: 0.25 });
  const eye = o.eye ?? '#a78bfa';
  const body = rb(1.3, 1.25, 0.95, 0.47, white, 0, 0.85, 0); g.add(body);
  const seam = gloss('#c9c3e6');
  for (const [y, sy] of [[0.7, 0.018], [0.98, 0.012]] as const) { const sm = rb(1.312, 1.25, 0.962, 0.47, seam, 0, y, 0); sm.scale.y = sy; g.add(sm); } // panel lines
  const hs = rb(1.312, 1.04, 1.03, 0.5, seam, 0, 2.07, 0); hs.scale.y = 0.016; g.add(hs);
  /* chest light: a little lit dot in a ring on the upper chest */
  const cl = ball(0.075, satin('#a5f3fc', { emissive: '#22d3ee', glow: 1.6 }), 0, 1.33, 0.36); cl.scale.z = 0.45; g.add(cl);
  const cr = ring(0.11, 0.022, trim); cr.position.set(0, 1.33, 0.345); cr.rotation.x = -0.75; g.add(cr);
  g.add(rb(1.36, 0.12, 1.0, 0.06, joint, 0, 0.3, 0));
  const head = rb(1.3, 1.04, 1.02, 0.48, white, 0, 2.07, 0); g.add(head);
  g.add(rb(1.08, 0.72, 0.2, 0.3, joint, 0, 2.05, 0.43));
  g.add(rb(0.98, 0.62, 0.2, 0.27, gloss(o.visor ?? '#1c1d48'), 0, 2.05, 0.47));
  const eyes = [-0.22, 0.22].map((x) => { const e = ball(0.115, satin(eye, { emissive: eye, glow: 1.6 }), x, 2.11, 0.58); e.scale.set(0.9, 1.15, 0.45); g.add(e); return e; });
  const smile = new Mesh(new TorusGeometry(0.13, 0.026, 8, 24, Math.PI), satin(eye, { emissive: eye, glow: 1.4 }));
  smile.position.set(0, 1.94, 0.575); smile.rotation.z = Math.PI; g.add(smile);
  for (const s of [-1, 1]) {
    const ear = cyl(0.2, 0.2, 0.16, joint, s * 0.7, 2.05, 0); ear.rotation.z = Math.PI / 2; g.add(ear);
    const er = ring(0.13, 0.03, trim); er.position.set(s * 0.79, 2.05, 0); er.rotation.y = Math.PI / 2; g.add(er);
  }
  g.add(cyl(0.035, 0.035, 0.32, joint, 0, 2.72, 0), ball(0.085, satin(eye, { emissive: eye, glow: 1.5 }), 0, 2.9, 0));
  const nk = ball(0.24, joint, 0, 1.53, 0); nk.scale.y = 0.62; g.add(nk); // ball neck
  g.add(rb(0.74, 0.6, 0.1, 0.12, joint, 0, 0.92, 0.45));
  const chest = rb(0.62, 0.48, 0.12, 0.09, o.slot ?? '#24244f', 0, 0.92, 0.48); g.add(chest);
  for (const x of [-0.2, 0, 0.2]) g.add(ball(0.035, satin('#7ee0a4', { emissive: '#4ade80', glow: 1 }), x, 0.6, 0.47));
  const arms = [-1, 1].map((s) => {
    const a = new Group(); a.position.set(s * 0.78, 1.25, 0);
    a.add(ball(0.22, joint, 0, 0, 0)); const sr = ring(0.2, 0.025, trim); sr.rotation.y = Math.PI / 2; sr.position.x = s * 0.06; a.add(sr); // ball shoulder with a trim ring
    a.add(rb(0.3, 0.42, 0.3, 0.14, white, 0, -0.26, 0), ball(0.13, joint, 0, -0.5, 0), rb(0.28, 0.36, 0.28, 0.13, white, 0, -0.72, 0));
    a.add(ball(0.17, joint, 0, -0.95, 0.02)); a.rotation.z = s * 0.18; g.add(a); return a;
  });
  for (const x of [-0.32, 0.32]) g.add(ball(0.17, joint, x, 0.27, 0), rb(0.36, 0.3, 0.42, 0.15, joint, x, 0.12, 0), rb(0.42, 0.14, 0.56, 0.06, white, x, 0.02, 0.05));
  return { g, head, body, chest, eyes, arms };
}
/** a person (R31b): rounded face with cheeks, a hair cap with a fringe, a hoodie with hood and strings, typing arms */
export function person(hoodie = '#3b4fa8', o: Partial<{ hair: string; skin: string; pose: 'type' | 'wave' | 'stand' }> = {}): Group {
  const g = new Group(), hood = matte(hoodie), skin = matte(o.skin ?? '#f3c9a8'), hairM = gloss(o.hair ?? '#3a2a22');
  g.add(cyl(0.48, 0.62, 1.15, hood, 0, 0.6, 0));
  g.add(ball(0.5, hood, 0, 1.15, 0)).children.at(-1)!.scale.set(1, 0.55, 0.9);
  const hd = ring(0.3, 0.12, hood); hd.position.set(0, 1.3, -0.12); hd.rotation.x = Math.PI / 2 - 0.4; g.add(hd);
  for (const x of [-0.1, 0.1]) g.add(cyl(0.02, 0.02, 0.36, matte('#f4f4f8'), x, 1.12, 0.46));
  g.add(cyl(0.13, 0.16, 0.22, skin, 0, 1.42, 0));
  const face = ball(0.44, skin, 0, 1.86, 0.02); face.scale.set(1, 0.98, 0.95); g.add(face);
  const hair = new Mesh(new SphereGeometry(0.47, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.48), hairM); hair.position.set(0, 1.9, -0.04); hair.rotation.x = -0.42; g.add(hair);
  const fr = ball(0.2, hairM, -0.12, 2.12, 0.3); fr.scale.set(1.5, 0.55, 0.7); fr.rotation.z = 0.35; g.add(fr);
  for (const x of [-0.15, 0.15]) { const e = ball(0.055, gloss('#2a1d17'), x, 1.87, 0.41); e.scale.y = 1.25; g.add(e); g.add(ball(0.07, matte('#f2a3a0', { opacity: 0.55 }), x * 1.7, 1.74, 0.36)); }
  const sm = new Mesh(new TorusGeometry(0.075, 0.018, 8, 20, Math.PI), matte('#b5615a')); sm.position.set(0, 1.72, 0.425); sm.rotation.z = Math.PI; g.add(sm);
  const pose = o.pose ?? 'type';
  for (const s of [-1, 1]) {
    const a = new Group(); a.position.set(s * 0.56, 1.2, 0.05); g.add(a);
    const up = rb(0.26, 0.6, 0.26, 0.12, hood, 0, -0.27, 0); a.add(up);
    const lo = new Group(); lo.position.set(0, -0.55, 0); a.add(lo);
    lo.add(rb(0.24, 0.55, 0.24, 0.11, hood, 0, -0.25, 0), ball(0.12, skin, 0, -0.56, 0));
    if (pose === 'type') { a.rotation.set(-0.35, 0, s * 0.18); lo.rotation.set(-1.2, 0, 0); }
    else if (pose === 'wave' && s > 0) { a.rotation.set(0, 0, 2.2); lo.rotation.set(0, 0, -0.6); }
    else a.rotation.z = s * 0.12;
  }
  return g;
}
/** a small laptop: base + lid opened back; returns the lid so a picture can be put on it */
export function laptop(w = 1.4, lid = '#2b2d52', base = '#d8dae6'): { g: Group; lid: Mesh } {
  const g = new Group();
  g.add(rb(w, 0.08, w * 0.66, 0.04, base, 0, 0.04, 0));
  const hinge = new Group(); hinge.position.set(0, 0.08, -w * 0.31); g.add(hinge);
  const l = rb(w, w * 0.64, 0.07, 0.04, lid, 0, w * 0.32, 0); hinge.add(l); hinge.rotation.x = -0.22;
  return { g, lid: l };
}

/* ---------------- R31b: light, materials, painted details ---------------- */
/** the R31b light rig: softer sky/ground, the key light turned warm, plus a cool fill from the left and a white rim from
    behind (the warm/cool contrast of the reference renders). Lights only: nothing to free. */
/* CanvasTexture and PlaneGeometry are in the shared three chunk (the stage's shadow decal uses them) but not exported
   from it; importing them here would add exports and grow that chunk, so take the two classes from a decal instead. */
let PG: typeof PlaneGeometry | undefined, CT: typeof CanvasTexture | undefined;
function classes(st: Stage) {
  if (PG) return;
  const m = st.blob(1), mm = m.material as MeshBasicMaterial;
  PG = m.geometry.constructor as typeof PlaneGeometry; CT = mm.map!.constructor as typeof CanvasTexture;
  m.geometry.dispose(); mm.dispose();
}
export function rig(st: Stage, key = 2.0) {
  classes(st);
  /* the extra lights are clones of the stage's own key light, so no new three.js class is pulled into the shared chunk */
  let k: DirectionalLight | undefined;
  st.scene.traverse((o) => {
    const h = o as HemisphereLight, d = o as DirectionalLight;
    if (h.isHemisphereLight) { h.intensity = 1.35; h.groundColor.set('#d3c6ff'); }
    else if (d.isDirectionalLight && !k) { k = d; d.color.set('#fff1de'); d.intensity = key; d.position.set(4, 9, 7); }
  });
  if (!k) return;
  const f = k.clone(); f.color.set('#b8c4ff'); f.intensity = 0.8; f.position.set(-7, 3, 5);
  const r = k.clone(); r.color.set('#ffffff'); r.intensity = 0.85; r.position.set(-2, 6, -8);
  st.scene.add(f, r);
}
type MO = Partial<{ opacity: number; emissive: string; glow: number; map: Texture }>;
/** a standard material with a chosen roughness / metalness (satin is 0.35 / 0.05) */
export const std = (color: string, rough: number, metal: number, o: MO = {}) => new MeshStandardMaterial({
  color, roughness: rough, metalness: metal, transparent: o.opacity !== undefined, opacity: o.opacity ?? 1,
  emissive: o.emissive ?? '#000000', emissiveIntensity: o.glow ?? 0, map: o.map ?? null,
});
/** shiny plastic / enamel */
export const gloss = (c: string, o: MO = {}) => std(c, 0.16, 0.06, o);
/** soft matte (fabric, wood, rubber) */
export const matte = (c: string, o: MO = {}) => std(c, 0.78, 0, o);
/** brushed metal that still reads without an environment map */
export const metal = (c: string) => std(c, 0.3, 0.55);
/** see-through glass (draw it after what is inside: give the mesh a high renderOrder) */
export const glass = (c = '#eef0ff', a = 0.2) => { const m = std(c, 0.05, 0.1, { opacity: a }); m.depthWrite = false; return m; };
/** draw on a canvas (w × h px) and use it as a texture; the stage frees it with the material that carries it (call rig(st) first) */
export function paint(w: number, h: number, f: (g: CanvasRenderingContext2D, w: number, h: number) => void): CanvasTexture {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  f(c.getContext('2d')!, w, h);
  const t = new CT!(c); t.colorSpace = 'srgb'; t.anisotropy = 4; return t;
}
/** a flat picture (w × h) facing +z; lit = shaded like the solids, otherwise drawn as is (screens, glowing signs) */
export function face(w: number, h: number, map: Texture, lit = false, x = 0, y = 0, z = 0): Mesh {
  const m = lit ? new MeshStandardMaterial({ map, transparent: true, roughness: 0.55, metalness: 0 }) : new MeshBasicMaterial({ map, transparent: true });
  const o = new Mesh(new PG!(w, h), m); o.position.set(x, y, z); return o;
}
export const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
export type Icon = 'folder' | 'globe' | 'cal' | 'db' | 'code' | 'brain' | 'wrench' | 'doc' | 'cloche' | 'heart' | 'shield' | 'chat' | 'check' | 'puzzle' | 'clock' | 'list' | 'chip';
/** draw one simple line icon into a box of size s at x, y (stroke/fill colour c) */
export function drawIcon(g: CanvasRenderingContext2D, n: Icon, x: number, y: number, s: number, c: string) {
  g.save(); g.translate(x, y); g.scale(s / 100, s / 100);
  g.strokeStyle = g.fillStyle = c; g.lineWidth = 8; g.lineCap = g.lineJoin = 'round';
  const P = (d: string) => { const p = new Path2D(d); return p; };
  switch (n) {
    case 'folder': g.fill(P('M10 28 q0-8 8-8 h22 l8 9 h34 q8 0 8 8 v41 q0 8-8 8 h-64 q-8 0-8-8z')); g.fillStyle = 'rgba(255,255,255,.28)'; g.fill(P('M10 40 h80 v6 h-80z')); break;
    case 'globe': g.beginPath(); g.arc(50, 50, 38, 0, 7); g.stroke(); g.beginPath(); g.ellipse(50, 50, 16, 38, 0, 0, 7); g.stroke();
      g.beginPath(); g.moveTo(12, 50); g.lineTo(88, 50); g.moveTo(18, 30); g.lineTo(82, 30); g.moveTo(18, 70); g.lineTo(82, 70); g.stroke(); break;
    case 'cal': rr(g, 12, 18, 76, 70, 12); g.stroke(); g.fillRect(12, 18, 76, 18); g.beginPath(); g.moveTo(32, 10); g.lineTo(32, 24); g.moveTo(68, 10); g.lineTo(68, 24); g.stroke();
      g.beginPath(); g.moveTo(34, 60); g.lineTo(46, 72); g.lineTo(68, 48); g.stroke(); break;
    case 'db': for (const y0 of [22, 44, 66]) { g.beginPath(); g.ellipse(50, y0, 34, 11, 0, 0, 7); g.fill(); g.fillRect(16, y0, 68, 16); }
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 4; for (const y0 of [38, 60]) { g.beginPath(); g.ellipse(50, y0, 34, 11, 0, 0.1, 3.04); g.stroke(); } break;
    case 'code': g.lineWidth = 10; g.beginPath(); g.moveTo(32, 26); g.lineTo(10, 50); g.lineTo(32, 74); g.moveTo(68, 26); g.lineTo(90, 50); g.lineTo(68, 74); g.moveTo(58, 18); g.lineTo(42, 82); g.stroke(); break;
    case 'brain': g.lineWidth = 7; g.stroke(P('M48 16 q-14-6-22 6 q-14 2-12 18 q-8 10 0 22 q0 16 16 16 q8 8 18 2z M52 16 q14-6 22 6 q14 2 12 18 q8 10 0 22 q0 16-16 16 q-8 8-18 2z'));
      g.stroke(P('M50 18 v62 M30 36 q10 2 12 12 M70 36 q-10 2-12 12 M28 62 q10-4 16 4 M72 62 q-10-4-16 4')); break;
    case 'wrench': g.save(); g.translate(50, 50); g.rotate(-Math.PI / 4); rr(g, -9, -4, 18, 50, 9); g.fill(); g.beginPath(); g.arc(0, -22, 22, 0, 7); g.fill();
      g.globalCompositeOperation = 'destination-out'; g.fillRect(-8, -48, 16, 26); g.restore(); break;
    case 'doc': g.stroke(P('M24 10 h36 l18 18 v62 h-54z M60 10 v18 h18')); g.beginPath(); for (const y0 of [46, 60, 74]) { g.moveTo(34, y0); g.lineTo(66, y0); } g.stroke(); break;
    case 'cloche': g.beginPath(); g.arc(50, 64, 34, Math.PI, 0); g.closePath(); g.fill(); g.fillRect(8, 66, 84, 8); g.beginPath(); g.arc(50, 26, 7, 0, 7); g.fill(); break;
    case 'heart': g.fill(P('M50 84 C18 62 8 46 12 30 C16 14 40 10 50 28 C60 10 84 14 88 30 C92 46 82 62 50 84z')); break;
    case 'shield': g.fill(P('M50 8 L86 20 V48 C86 70 70 84 50 92 C30 84 14 70 14 48 V20z')); g.strokeStyle = '#ffffff'; g.lineWidth = 9; g.beginPath(); g.moveTo(33, 50); g.lineTo(46, 63); g.lineTo(68, 38); g.stroke(); break;
    case 'chat': rr(g, 8, 14, 84, 56, 16); g.fill(); g.fill(P('M26 66 l-6 22 l24-18z')); g.fillStyle = '#ffffff'; for (const x0 of [30, 50, 70]) { g.beginPath(); g.arc(x0, 42, 6, 0, 7); g.fill(); } break;
    case 'check': g.beginPath(); g.arc(50, 50, 42, 0, 7); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 11; g.beginPath(); g.moveTo(30, 52); g.lineTo(44, 66); g.lineTo(70, 36); g.stroke(); break;
    case 'puzzle': g.fill(P('M14 30 h20 a10 10 0 1 1 20 0 h20 v20 a10 10 0 1 1 0 20 v20 h-60z')); break;
    case 'clock': g.beginPath(); g.arc(50, 50, 38, 0, 7); g.stroke(); g.beginPath(); g.moveTo(50, 26); g.lineTo(50, 50); g.lineTo(66, 60); g.stroke(); break;
    case 'list': for (let i = 0; i < 3; i++) { const y0 = 24 + i * 26; g.beginPath(); g.arc(18, y0, 9, 0, 7); g.fill(); rr(g, 36, y0 - 6, 54 - i * 8, 12, 6); g.fill(); } break;
    case 'chip': rr(g, 24, 24, 52, 52, 8); g.fill(); g.beginPath(); for (let i = 0; i < 4; i++) { const v = 32 + i * 12; g.moveTo(v, 12); g.lineTo(v, 24); g.moveTo(v, 76); g.lineTo(v, 88); g.moveTo(12, v); g.lineTo(24, v); g.moveTo(76, v); g.lineTo(88, v); } g.stroke(); break;
  }
  g.restore();
}
/** an icon texture: optional rounded tile behind it */
export const iconTex = (n: Icon, c: string, bg = '', px = 256) => paint(px, px, (g, w) => {
  if (bg) { g.fillStyle = bg; rr(g, 0, 0, w, w, w * 0.22); g.fill(); }
  drawIcon(g, n, w * (bg ? 0.18 : 0.04), w * (bg ? 0.18 : 0.04), w * (bg ? 0.64 : 0.92), c);
});
/** a wood grain texture (table tops, signs) */
export const woodTex = (base = '#d9a66b', line = 'rgba(120,70,30,.16)', px = 256) => paint(px, px, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h); g.strokeStyle = line;
  for (let i = 0; i < 26; i++) { g.lineWidth = 1 + (i % 3); g.beginPath(); const y0 = (i / 26) * h + Math.sin(i * 7.3) * 4; g.moveTo(0, y0); for (let x = 0; x <= w; x += 16) g.lineTo(x, y0 + Math.sin(x / 37 + i) * 3 + Math.sin(x / 11 + i * 3) * 1.2); g.stroke(); }
});
/** a leafy pot plant (pot colour p) */
export function plant(p = '#f4f1fb', leaf = '#5fb878', s = 1): Group {
  const g = new Group();
  g.add(cyl(0.26, 0.2, 0.42, gloss(p), 0, 0.21, 0), cyl(0.24, 0.24, 0.04, matte('#6b4a32'), 0, 0.41, 0));
  const lm = gloss(leaf), lm2 = gloss('#4aa366');
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, r = 0.12 + (i % 3) * 0.05;
    const l = ball(0.17, i % 2 ? lm : lm2, Math.cos(a) * r, 0.62 + (i % 3) * 0.16, Math.sin(a) * r); l.scale.set(0.55, 1.25, 0.32); l.rotation.set(Math.sin(a) * 0.5, -a, Math.cos(a) * 0.5); g.add(l);
  }
  g.scale.setScalar(s); return g;
}
/** a mug with a handle */
export function mug(c = '#2f3a5f', s = 1): Group {
  const g = new Group(), m = gloss(c);
  g.add(cyl(0.14, 0.13, 0.3, m, 0, 0.15, 0), cyl(0.115, 0.115, 0.02, matte('#5b3a24'), 0, 0.29, 0));
  const h = ring(0.08, 0.025, m); h.position.set(0.15, 0.16, 0); g.add(h);
  g.scale.setScalar(s); return g;
}

/** a soft round glow lying on the floor (or facing +z when up = true): the ambient halo under lit things */
export function glowDisc(r: number, color: string, a = 0.5, up = false): Mesh {
  const t = paint(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const m = new Mesh(new PG!(2 * r, 2 * r), new MeshBasicMaterial({ map: t, transparent: true, opacity: a, depthWrite: false }));
  if (!up) m.rotation.x = -Math.PI / 2; m.renderOrder = 1; return m;
}
/** a bowl of food seen from above (menu / answer pictures) drawn at x, y with radius r */
export function drawDish(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = '#e5e1f3'; g.lineWidth = r * 0.06; g.stroke();
  g.fillStyle = '#f2b04a'; g.beginPath(); g.arc(x, y, r * 0.72, 0, 7); g.fill();
  const dots: [number, number, string][] = [[-0.3, -0.2, '#e8613c'], [0.25, -0.3, '#5fb878'], [0.1, 0.25, '#e8613c'], [-0.25, 0.3, '#5fb878'], [0.35, 0.1, '#fff3c4'], [-0.05, -0.02, '#fff3c4']];
  for (const [dx, dy, c] of dots) { g.fillStyle = c; g.beginPath(); g.ellipse(x + dx * r, y + dy * r, r * 0.17, r * 0.12, dx * 3, 0, 7); g.fill(); }
}
