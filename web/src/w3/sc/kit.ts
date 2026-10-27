/* R34: the modelled toy props of the all-3D site (no images: every thing is built from three.js shapes in code).
   Each prop stands on y = 0, is about one unit tall and wide, and uses the v4 look (glossy toy plastic, real glass,
   soft glows). make(name) returns a fresh Group; unknown names get a glass orb, so content can never break a scene. */
import {
  BoxGeometry, CapsuleGeometry, CircleGeometry, ConeGeometry, CylinderGeometry, DodecahedronGeometry, ExtrudeGeometry, Group,
  IcosahedronGeometry, Mesh, MeshBasicMaterial, OctahedronGeometry, PlaneGeometry, Shape, SphereGeometry, TorusGeometry,
  TubeGeometry, CatmullRomCurve3, Vector3, type Material, type Object3D,
} from 'three';
import { canvasTex, glassP, glow, rbox, text, toy } from '../../three3d/p3/look';
import { brainLobe } from '../../three3d/p3/props';

export const add = <T extends Object3D>(g: Group, o: T, x = 0, y = 0, z = 0) => { o.position.set(x, y, z); g.add(o); return o; };
export const cyl = (rt: number, rb: number, h: number, m: Material, n = 32) => new Mesh(new CylinderGeometry(rt, rb, h, n), m);
export const sph = (r: number, m: Material, n = 24) => new Mesh(new SphereGeometry(r, n, Math.max(8, n * 0.66 | 0)), m);
export const tor = (r: number, t: number, m: Material, n = 48) => new Mesh(new TorusGeometry(r, t, 12, n), m);
export const lit = (c: string, g = 0.6) => toy(c, { emissive: c, glow: g });
export const C = { pur: '#8b5cf6', vio: '#a78bfa', blu: '#3b82f6', sky: '#60a5fa', grn: '#22c55e', lim: '#84cc16', yel: '#facc15', org: '#f97316', red: '#ef4444', pnk: '#ec4899', tea: '#14b8a6', wht: '#f8fafc', gry: '#94a3b8', drk: '#334155', brn: '#a16207' };
/** a word or sign on a transparent plane (canvas text, crisp) */
export function sign(s: string, w = 0.6, h = 0.22, color = '#4c1d95', bg = ''): Mesh {
  const tx = canvasTex(256, Math.round((256 * h) / w), (g, W, H) => { if (bg) { g.fillStyle = bg; g.beginPath(); g.roundRect(4, 4, W - 8, H - 8, 18); g.fill(); } text(g, s, W / 2, H / 2 + 2, W - 24, Math.min(H * 0.7, 72), color, 800); });
  const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false })); m.renderOrder = 5; return m;
}
/** a rounded two-tier glass pedestal with a lit top */
export function pedestal(h = 0.5, r = 0.5, tint = '#dcd0ff'): Group {
  const g = new Group(), gl = glassP(tint, { thick: 0.7, rough: 0.1, att: tint, dist: 1.0 });
  add(g, cyl(r, r * 1.04, h * 0.62, gl, 48), 0, h * 0.31);
  add(g, cyl(r * 0.86, r * 0.9, h * 0.38, gl, 48), 0, h * 0.81);
  const cap = add(g, new Mesh(new CircleGeometry(r * 0.8, 40), new MeshBasicMaterial({ color: '#f1ecff', toneMapped: false, transparent: true, opacity: 0.6 })), 0, h + 0.003);
  cap.rotation.x = -Math.PI / 2;
  add(g, cyl(r * 1.1, r * 1.12, 0.04, toy('#f4f1fb', { rough: 0.25, coat: 1 }), 48), 0, 0.02);
  return g;
}
function face(g: Group, y: number, z: number, s = 1) { // two dark eyes and a smile
  const e = toy('#1e1b4b', { rough: 0.2 });
  for (const x of [-0.09, 0.09]) add(g, sph(0.035 * s, e, 12), x * s, y, z);
  const m = add(g, new Mesh(new TorusGeometry(0.05 * s, 0.012 * s, 6, 16, Math.PI), e), 0, y - 0.07 * s, z); m.rotation.z = Math.PI;
}
const P: Record<string, () => Group> = {
  robot() {
    const g = new Group(), w = toy('#f1f5f9'), b = toy(C.pur);
    add(g, rbox(0.5, 0.42, 0.36, 0.12, w), 0, 0.32);
    add(g, rbox(0.56, 0.42, 0.44, 0.16, w), 0, 0.78);
    add(g, rbox(0.44, 0.26, 0.05, 0.08, toy('#1e1b4b', { rough: 0.15 })), 0, 0.8, 0.21);
    for (const x of [-0.1, 0.1]) add(g, sph(0.04, lit('#67e8f9', 1), 12), x, 0.82, 0.24);
    add(g, cyl(0.015, 0.015, 0.16, b, 8), 0, 1.06); add(g, sph(0.05, lit(C.pnk, 0.8), 12), 0, 1.16);
    for (const x of [-0.33, 0.33]) add(g, new Mesh(new CapsuleGeometry(0.06, 0.2, 6, 12), b), x, 0.36);
    add(g, sph(0.06, lit(C.vio, 0.7), 12), 0, 0.38, 0.19);
    return g;
  },
  person() {
    const g = new Group(), sk = toy('#fcd9b8'), sh = toy(C.sky);
    add(g, new Mesh(new CapsuleGeometry(0.2, 0.32, 8, 16), sh), 0, 0.36);
    add(g, sph(0.2, sk, 24), 0, 0.86); face(g, 0.88, 0.19, 0.9);
    add(g, sph(0.205, toy('#7c2d12'), 24), 0, 0.92, -0.03).scale.set(1, 0.75, 1);
    return g;
  },
  duo() { const g = new Group(); add(g, P.person!(), -0.28).scale.setScalar(0.85); add(g, P.robot!(), 0.3).scale.setScalar(0.8); add(g, sph(0.07, lit(C.yel, 0.8), 12), 0.02, 0.48, 0.1); return g; },
  rocket() {
    const g = new Group(), w = toy('#f8fafc'), r = toy(C.red);
    add(g, new Mesh(new CapsuleGeometry(0.17, 0.5, 8, 24), w), 0, 0.55);
    add(g, new Mesh(new ConeGeometry(0.17, 0.25, 24), r), 0, 0.95);
    add(g, cyl(0.08, 0.08, 0.03, glassP('#bae6fd', { thick: 0.1 }), 20), 0, 0.68, 0.165).rotation.x = Math.PI / 2;
    for (let k = 0; k < 3; k++) { const f = add(g, rbox(0.04, 0.22, 0.16, 0.02, r), 0, 0.26); f.rotation.y = (k / 3) * Math.PI * 2; f.translateZ(0.17); }
    add(g, new Mesh(new ConeGeometry(0.1, 0.25, 16), lit(C.org, 1)), 0, 0.1).rotation.x = Math.PI;
    add(g, glow(C.org, 0.6, 0.8), 0, 0.06);
    return g;
  },
  toolbox() {
    const g = new Group(), b = toy(C.pur);
    add(g, rbox(0.8, 0.4, 0.42, 0.06, b), 0, 0.2);
    add(g, rbox(0.82, 0.08, 0.44, 0.03, toy(C.vio)), 0, 0.44);
    add(g, new Mesh(new TorusGeometry(0.14, 0.025, 8, 24, Math.PI), toy(C.drk)), 0, 0.48);
    [C.yel, C.grn, C.sky, C.pnk].forEach((c, k) => { const cd = add(g, rbox(0.16, 0.22, 0.02, 0.02, toy(c)), -0.27 + k * 0.18, 0.62, 0); cd.rotation.z = (k - 1.5) * 0.12; });
    return g;
  },
  target() {
    const g = new Group(), cs = [C.red, C.wht, C.red, C.wht, C.red];
    cs.forEach((c, k) => { const d = add(g, cyl(0.45 - k * 0.09, 0.45 - k * 0.09, 0.06 + k * 0.012, toy(c), 40), 0, 0.55, 0); d.rotation.x = Math.PI / 2; });
    add(g, cyl(0.03, 0.04, 0.55, toy(C.brn), 8), 0, 0.27, -0.05);
    const ar = add(g, cyl(0.015, 0.015, 0.5, toy(C.drk), 8), 0.05, 0.6, 0.25); ar.rotation.x = Math.PI / 2.2;
    add(g, new Mesh(new ConeGeometry(0.06, 0.1, 3), toy(C.yel)), 0.05, 0.6, 0.5).rotation.x = Math.PI / 2;
    return g;
  },
  shelf() {
    const g = new Group(), w = toy('#e9d5ff');
    for (const y of [0.05, 0.42, 0.79]) add(g, rbox(0.9, 0.05, 0.32, 0.02, w), 0, y);
    for (const x of [-0.45, 0.45]) add(g, rbox(0.05, 0.84, 0.32, 0.02, w), x, 0.42);
    [[C.sky, -0.28, 0.2], [C.grn, 0, 0.2], [C.pnk, 0.27, 0.2], [C.yel, -0.2, 0.57], [C.org, 0.15, 0.57]].forEach(([c, x, y]) => add(g, rbox(0.18, 0.26, 0.18, 0.05, toy(c as string)), x as number, (y as number) + 0.06));
    return g;
  },
  plug() {
    const g = new Group(), b = toy(C.drk);
    add(g, rbox(0.42, 0.5, 0.3, 0.1, toy(C.wht)), 0, 0.4);
    for (const x of [-0.09, 0.09]) add(g, rbox(0.05, 0.22, 0.05, 0.01, toy('#cbd5e1', { metal: 0.8, rough: 0.25 })), x, 0.75);
    const c = new CatmullRomCurve3([new Vector3(0, 0.15, 0), new Vector3(0.1, 0.03, 0.3), new Vector3(0.45, 0.03, 0.25), new Vector3(0.55, 0.05, -0.2)]);
    add(g, new Mesh(new TubeGeometry(c, 30, 0.03, 8), b));
    add(g, sph(0.05, lit(C.grn, 1), 12), 0, 0.5, 0.16);
    return g;
  },
  laptop() {
    const g = new Group(), al = toy('#cbd5e1', { metal: 0.5, rough: 0.3 });
    add(g, rbox(0.9, 0.05, 0.6, 0.02, al), 0, 0.03);
    const lid = new Group(); add(g, lid, 0, 0.05, -0.29); lid.rotation.x = -0.25;
    add(lid, rbox(0.9, 0.58, 0.04, 0.02, al), 0, 0.29);
    add(lid, rbox(0.82, 0.5, 0.01, 0.01, lit('#6366f1', 0.7)), 0, 0.3, 0.022);
    for (let k = 0; k < 3; k++) add(lid, rbox(0.5 - k * 0.1, 0.04, 0.012, 0.01, lit('#e0e7ff', 0.9)), -0.1, 0.42 - k * 0.1, 0.03);
    add(g, rbox(0.7, 0.01, 0.3, 0.005, toy('#475569')), 0, 0.06, 0.05);
    return g;
  },
  phone() {
    const g = new Group();
    add(g, rbox(0.42, 0.8, 0.06, 0.08, toy(C.drk)), 0, 0.45);
    add(g, rbox(0.36, 0.7, 0.01, 0.05, lit('#818cf8', 0.6)), 0, 0.45, 0.032);
    for (let k = 0; k < 3; k++) add(g, rbox(k % 2 ? 0.2 : 0.24, 0.08, 0.01, 0.03, toy(k % 2 ? C.wht : C.vio)), k % 2 ? 0.05 : -0.03, 0.62 - k * 0.14, 0.04);
    return g;
  },
  chat() {
    const g = new Group(), s = new Shape();
    s.moveTo(-0.4, 0); s.lineTo(0.4, 0); s.quadraticCurveTo(0.5, 0, 0.5, 0.1); s.lineTo(0.5, 0.45); s.quadraticCurveTo(0.5, 0.55, 0.4, 0.55);
    s.lineTo(-0.4, 0.55); s.quadraticCurveTo(-0.5, 0.55, -0.5, 0.45); s.lineTo(-0.5, 0.1); s.quadraticCurveTo(-0.5, 0, -0.4, 0); s.lineTo(-0.25, 0); s.lineTo(-0.35, -0.18); s.closePath();
    const m = add(g, new Mesh(new ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03 }), toy(C.sky)), 0, 0.3, -0.06);
    void m; for (const x of [-0.2, 0, 0.2]) add(g, sph(0.05, toy(C.wht), 12), x, 0.57, 0.1);
    return g;
  },
  key() {
    const g = new Group(), m = toy(C.yel, { metal: 0.7, rough: 0.25 });
    add(g, tor(0.17, 0.05, m), 0, 0.75);
    add(g, rbox(0.08, 0.5, 0.06, 0.02, m), 0, 0.35);
    for (const y of [0.15, 0.27]) add(g, rbox(0.14, 0.05, 0.06, 0.01, m), 0.08, y);
    return g;
  },
  coin() {
    const g = new Group(), m = toy(C.yel, { metal: 0.8, rough: 0.2 });
    for (let k = 0; k < 4; k++) add(g, cyl(0.25, 0.25, 0.07, m, 40), (k % 2) * 0.03, 0.04 + k * 0.08);
    const f = add(g, cyl(0.28, 0.28, 0.07, m, 40), 0.1, 0.62, 0.05); f.rotation.x = Math.PI / 2;
    add(g, sign('¥$', 0.36, 0.2, '#92400e'), 0.1, 0.62, 0.09);
    return g;
  },
  cloud() {
    const g = new Group(), m = toy('#f8fafc', { rough: 0.6, coat: 0.2 });
    [[0, 0.5, 0.28], [-0.28, 0.42, 0.2], [0.28, 0.42, 0.22], [0.12, 0.66, 0.2]].forEach(([x, y, r]) => add(g, sph(r!, m), x, y));
    for (let k = 0; k < 3; k++) add(g, rbox(0.06, 0.14, 0.06, 0.02, lit(C.sky, 0.8)), -0.15 + k * 0.15, 0.12);
    return g;
  },
  house() {
    const g = new Group();
    add(g, rbox(0.6, 0.45, 0.5, 0.05, toy('#fde68a')), 0, 0.23);
    const r = add(g, new Mesh(new ConeGeometry(0.5, 0.35, 4), toy(C.red)), 0, 0.63); r.rotation.y = Math.PI / 4;
    add(g, rbox(0.14, 0.24, 0.02, 0.02, toy(C.brn)), 0, 0.13, 0.26);
    add(g, rbox(0.12, 0.12, 0.02, 0.02, lit('#93c5fd', 0.5)), 0.17, 0.3, 0.26);
    return g;
  },
  brain() {
    const g = new Group(), m = toy('#f9a8d4', { rough: 0.35, emissive: '#ec4899', glow: 0.25 });
    for (const sd of [-1, 1]) { const l = add(g, new Mesh(brainLobe(sd), m), sd * 0.12, 0.5); l.scale.set(0.42, 0.46, 0.6); }
    add(g, glow('#f0abfc', 1.3, 0.4), 0, 0.5);
    return g;
  },
  book() {
    const g = new Group();
    [[C.blu, 0], [C.grn, 0.13], [C.org, 0.26]].forEach(([c, y], k) => { const b = add(g, rbox(0.62, 0.12, 0.44, 0.02, toy(c as string)), 0, 0.07 + (y as number)); b.rotation.y = (k - 1) * 0.15; add(g, rbox(0.58, 0.09, 0.4, 0.01, toy('#fffbeb')), 0.03, 0.07 + (y as number)).rotation.y = (k - 1) * 0.15; });
    const o = add(g, rbox(0.5, 0.02, 0.36, 0.01, toy('#fffbeb')), 0, 0.62); o.rotation.x = -0.6;
    return g;
  },
  gear() {
    const g = new Group(), m = toy(C.gry, { metal: 0.7, rough: 0.3 });
    const w = add(g, new Group(), 0, 0.5);
    w.add(cyl(0.3, 0.3, 0.14, m, 32)); for (let k = 0; k < 8; k++) { const t = rbox(0.12, 0.14, 0.14, 0.02, m); t.rotation.y = (k / 8) * Math.PI * 2; t.translateX(0.33); w.add(t); }
    w.rotation.x = Math.PI / 2; add(w, cyl(0.1, 0.1, 0.16, toy(C.drk), 20));
    w.name = 'spin'; return g;
  },
  eye() {
    const g = new Group(); const w = add(g, sph(0.38, toy(C.wht, { rough: 0.2 }), 32), 0, 0.5); w.scale.z = 0.8;
    add(g, sph(0.18, toy(C.blu), 24), 0, 0.5, 0.17).scale.z = 0.5;
    add(g, sph(0.09, toy('#0f172a'), 16), 0, 0.5, 0.25).scale.z = 0.4;
    add(g, sph(0.035, lit('#ffffff', 1), 8), 0.05, 0.56, 0.29);
    return g;
  },
  glass() {
    const g = new Group(); add(g, tor(0.24, 0.04, toy(C.pur)), 0, 0.62);
    add(g, cyl(0.22, 0.22, 0.02, glassP('#e0f2fe', { thick: 0.1 }), 32), 0, 0.62).rotation.x = Math.PI / 2;
    const h = add(g, new Mesh(new CapsuleGeometry(0.05, 0.3, 6, 12), toy(C.drk)), 0.22, 0.25); h.rotation.z = 0.6;
    return g;
  },
  bulb() {
    const g = new Group();
    add(g, sph(0.3, toy('#fef08a', { emissive: C.yel, glow: 0.9, opacity: 0.92 }), 32), 0, 0.62);
    add(g, cyl(0.13, 0.13, 0.22, toy(C.gry, { metal: 0.7 }), 20), 0, 0.26);
    add(g, glow(C.yel, 1.4, 0.6), 0, 0.62);
    return g;
  },
  clock() {
    const g = new Group(); const f = add(g, cyl(0.38, 0.38, 0.1, toy(C.wht), 40), 0, 0.5); f.rotation.x = Math.PI / 2;
    add(g, tor(0.38, 0.04, toy(C.blu)), 0, 0.5);
    add(g, rbox(0.03, 0.25, 0.02, 0.01, toy(C.drk)), 0, 0.6, 0.06);
    const m = add(g, rbox(0.03, 0.18, 0.02, 0.01, toy(C.red)), 0.06, 0.5, 0.06); m.rotation.z = -1.2; m.name = 'spin';
    add(g, rbox(0.3, 0.05, 0.2, 0.02, toy(C.blu)), 0, 0.03);
    return g;
  },
  clipboard() {
    const g = new Group(); const b = add(g, rbox(0.56, 0.74, 0.05, 0.04, toy(C.brn)), 0, 0.45); b.rotation.x = -0.2;
    const p = add(g, rbox(0.48, 0.62, 0.02, 0.01, toy('#fffbeb')), 0, 0.43, 0.04); p.rotation.x = -0.2;
    add(g, rbox(0.2, 0.08, 0.05, 0.02, toy(C.gry, { metal: 0.6 })), 0, 0.82, -0.02);
    for (let k = 0; k < 3; k++) { add(g, sph(0.035, toy(C.grn), 10), -0.15, 0.62 - k * 0.16, 0.1 - k * 0.03); add(g, rbox(0.24, 0.03, 0.01, 0.01, toy(C.gry)), 0.05, 0.62 - k * 0.16, 0.09 - k * 0.03); }
    return g;
  },
  shield() {
    const g = new Group(), s = new Shape();
    s.moveTo(0, 0); s.quadraticCurveTo(0.4, 0.2, 0.38, 0.62); s.lineTo(0, 0.75); s.lineTo(-0.38, 0.62); s.quadraticCurveTo(-0.4, 0.2, 0, 0);
    add(g, new Mesh(new ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03 }), toy(C.tea)), 0, 0.1, -0.05);
    add(g, sign('✓', 0.4, 0.4, '#ffffff'), 0, 0.48, 0.1);
    return g;
  },
  folder() {
    const g = new Group(); add(g, rbox(0.8, 0.56, 0.08, 0.04, toy(C.yel)), 0, 0.36);
    add(g, rbox(0.3, 0.1, 0.08, 0.03, toy(C.yel)), -0.24, 0.66);
    add(g, rbox(0.7, 0.44, 0.02, 0.02, toy('#fffbeb')), 0, 0.4, 0.05);
    add(g, rbox(0.82, 0.4, 0.06, 0.04, toy('#fbbf24')), 0, 0.26, 0.06).rotation.x = -0.15;
    return g;
  },
  blocks() {
    const g = new Group();
    [[C.red, -0.2, 0.1], [C.blu, 0.2, 0.1], [C.yel, 0, 0.32], [C.grn, -0.2, 0.54], [C.pnk, 0.2, 0.54]].forEach(([c, x, y]) => {
      add(g, rbox(0.36, 0.2, 0.3, 0.04, toy(c as string)), x as number, y as number);
      for (const dx of [-0.08, 0.08]) add(g, cyl(0.045, 0.045, 0.05, toy(c as string), 14), (x as number) + dx, (y as number) + 0.12);
    });
    return g;
  },
  cards() {
    const g = new Group();
    [C.pnk, C.sky, C.grn, C.yel].forEach((c, k) => { const cd = add(g, rbox(0.34, 0.48, 0.03, 0.04, toy(c)), -0.27 + k * 0.18, 0.4, -k * 0.02); cd.rotation.z = (1.5 - k) * 0.18; add(cd as unknown as Group, sph(0.06, toy(C.wht), 12), 0, 0.05, 0.02); });
    return g;
  },
  letters() {
    const g = new Group(), gl = glassP('#d9ccff', { thick: 0.35, att: '#b9a3ff', dist: 0.9 });
    [['A', -0.3, 0.16], ['I', 0, 0.16], ['你', 0.3, 0.16], ['好', -0.15, 0.46], ['!', 0.15, 0.46]].forEach(([ch, x, y]) => {
      add(g, rbox(0.28, 0.28, 0.28, 0.06, gl), x as number, y as number);
      add(g, sign(ch as string, 0.22, 0.22, '#5b3fb8'), x as number, y as number, 0.145);
    });
    return g;
  },
  net() {
    const g = new Group(), L = [3, 4, 2], pts: Vector3[][] = [];
    L.forEach((n, i) => { pts.push([]); for (let k = 0; k < n; k++) { const p = new Vector3(-0.4 + i * 0.4, 0.5 + (k - (n - 1) / 2) * 0.22, 0); pts[i]!.push(p); add(g, sph(0.07, lit([C.sky, C.vio, C.pnk][i]!, 0.6), 16), p.x, p.y, p.z); } });
    const lm = toy('#c4b5fd', { opacity: 0.7 });
    for (let i = 0; i < 2; i++) for (const a of pts[i]!) for (const b of pts[i + 1]!) {
      const d = b.clone().sub(a), m = add(g, cyl(0.008, 0.008, d.length(), lm, 6), (a.x + b.x) / 2, (a.y + b.y) / 2, 0); m.rotation.z = Math.atan2(d.x, d.y) * -1;
    }
    return g;
  },
  layers() {
    const g = new Group(); [C.red, C.org, C.yel, C.grn, C.blu, C.pur].forEach((c, k) => add(g, rbox(0.72 - k * 0.06, 0.1, 0.5 - k * 0.04, 0.04, toy(c, { emissive: c, glow: 0.15 })), 0, 0.07 + k * 0.14));
    return g;
  },
  tower() {
    const g = new Group(), gl = glassP('#e0e7ff', { thick: 0.3 });
    for (let k = 0; k < 3; k++) { add(g, rbox(0.6, 0.22, 0.42, 0.06, gl), 0, 0.14 + k * 0.28); add(g, rbox(0.4, 0.06, 0.24, 0.03, lit([C.sky, C.vio, C.pnk][k]!, 0.6)), 0, 0.14 + k * 0.28); }
    return g;
  },
  scale() {
    const g = new Group(), m = toy(C.yel, { metal: 0.6, rough: 0.3 });
    add(g, cyl(0.03, 0.05, 0.75, m, 10), 0, 0.4); add(g, cyl(0.2, 0.24, 0.05, m, 24), 0, 0.03);
    const bar = add(g, new Group(), 0, 0.78); bar.rotation.z = 0.12; bar.name = 'tilt';
    add(bar, rbox(0.9, 0.04, 0.04, 0.02, m));
    for (const x of [-0.42, 0.42]) { add(bar, cyl(0.004, 0.004, 0.25, toy(C.drk), 4), x, -0.12); add(bar, cyl(0.15, 0.1, 0.04, m, 24), x, -0.25); }
    add(bar, sph(0.07, lit(C.grn, 0.5), 12), -0.42, -0.18); add(bar, rbox(0.1, 0.1, 0.1, 0.02, lit(C.pnk, 0.5)), 0.42, -0.18);
    return g;
  },
  split() {
    const g = new Group(); add(g, sph(0.12, lit(C.yel, 0.8), 16), 0, 0.15);
    for (let k = 0; k < 4; k++) { const on = k === 1 || k === 2; add(g, rbox(0.18, 0.18, 0.18, 0.04, on ? lit(C.pnk, 0.6) : glassP('#fce7f3', { thick: 0.2 })), -0.33 + k * 0.22, 0.72); }
    for (const x of [-0.11, 0.11]) { const c = new CatmullRomCurve3([new Vector3(0, 0.22, 0), new Vector3(x, 0.45, 0.05), new Vector3(x, 0.62, 0)]); add(g, new Mesh(new TubeGeometry(c, 12, 0.012, 6), lit(C.pnk, 0.8))); }
    return g;
  },
  frame() {
    const g = new Group(); add(g, rbox(0.8, 0.66, 0.06, 0.04, toy(C.brn)), 0, 0.45);
    const cs = [C.sky, C.sky, C.sky, C.yel, C.sky, C.red, C.red, C.sky, C.grn, C.wht, C.wht, C.grn, C.grn, C.grn, C.grn, C.grn];
    cs.forEach((c, k) => add(g, rbox(0.15, 0.12, 0.03, 0.01, toy(c)), -0.24 + (k % 4) * 0.16, 0.66 - Math.floor(k / 4) * 0.13, 0.04));
    return g;
  },
  wave() {
    const g = new Group(); for (let k = 0; k < 9; k++) { const h = 0.15 + Math.abs(Math.sin(k * 0.9)) * 0.55; add(g, rbox(0.07, h, 0.07, 0.03, lit(C.tea, 0.5)), -0.36 + k * 0.09, h / 2 + 0.05); }
    return g;
  },
  dumbbell() {
    const g = new Group(), m = toy(C.drk, { metal: 0.4 }); const b = add(g, new Group(), 0, 0.3); b.rotation.z = Math.PI / 2;
    add(b, cyl(0.04, 0.04, 0.8, toy(C.gry, { metal: 0.8 }), 12));
    for (const y of [-0.3, 0.3]) { add(b, cyl(0.22, 0.22, 0.1, m, 24), 0, y); add(b, cyl(0.17, 0.17, 0.08, toy(C.red), 24), 0, y * 1.32); }
    return g;
  },
  globe() {
    const g = new Group(); add(g, sph(0.34, toy(C.sky, { rough: 0.3 }), 32), 0, 0.55);
    for (const [x, y, z] of [[0.15, 0.65, 0.27], [-0.2, 0.5, 0.25], [0.05, 0.4, 0.31]]) add(g, sph(0.12, toy(C.grn), 12), x!, y!, z!).scale.set(1, 0.7, 0.4);
    const r = add(g, tor(0.42, 0.015, toy(C.yel, { metal: 0.6 })), 0, 0.55); r.rotation.x = 1.2;
    add(g, cyl(0.03, 0.04, 0.2, toy(C.yel, { metal: 0.6 }), 10), 0, 0.12); add(g, cyl(0.18, 0.2, 0.04, toy(C.drk), 24), 0, 0.02);
    return g;
  },
  slope() {
    const g = new Group(), pts: Vector3[] = [];
    for (let k = 0; k <= 20; k++) { const x = -0.45 + k * 0.045; pts.push(new Vector3(x, 0.25 + 1.4 * (x + 0.1) * (x + 0.1), 0)); }
    add(g, new Mesh(new TubeGeometry(new CatmullRomCurve3(pts), 40, 0.025, 8), lit(C.blu, 0.5)));
    const t = add(g, rbox(0.6, 0.025, 0.025, 0.01, lit(C.org, 0.8)), 0.15, 0.39); t.rotation.z = Math.atan(2.8 * 0.25);
    add(g, sph(0.05, lit(C.pnk, 0.8), 12), 0.15, 0.39);
    return g;
  },
  grid() {
    const g = new Group(), m = toy('#c7d2fe');
    for (let k = -2; k <= 2; k++) { const a = add(g, rbox(0.9, 0.012, 0.012, 0.005, m), 0.12 * k * 0.4, 0.5 + k * 0.18); a.rotation.z = 0.2; const b = add(g, rbox(0.012, 0.75, 0.012, 0.005, m), k * 0.18, 0.5); b.rotation.z = -0.25; }
    add(g, rbox(0.4, 0.04, 0.04, 0.02, lit(C.red, 0.7)), 0.2, 0.5, 0.02); add(g, rbox(0.04, 0.36, 0.04, 0.02, lit(C.grn, 0.7)), 0, 0.68, 0.02);
    return g;
  },
  dice() {
    const g = new Group(), gl = glassP('#fce7f3', { thick: 0.3, att: '#f9a8d4', dist: 1 }), pip = toy('#be185d');
    for (const [x, y, ry, n] of [[-0.2, 0.18, 0.3, 3], [0.22, 0.18, -0.4, 5], [0, 0.52, 0.8, 1]] as const) {
      const d = add(g, new Group(), x, y); d.rotation.y = ry; add(d, rbox(0.32, 0.32, 0.32, 0.07, gl));
      const P5: [number, number][] = n === 1 ? [[0, 0]] : n === 3 ? [[-0.08, -0.08], [0, 0], [0.08, 0.08]] : [[-0.08, -0.08], [0.08, 0.08], [0, 0], [-0.08, 0.08], [0.08, -0.08]];
      for (const [a, b] of P5) add(d, sph(0.028, pip, 10), a, b, 0.162).scale.z = 0.4;
    }
    return g;
  },
  valley() {
    const g = new Group(), pts: Vector3[] = [];
    for (let k = 0; k <= 24; k++) { const x = -0.5 + k / 24; pts.push(new Vector3(x, 0.12 + 1.6 * x * x, 0)); }
    add(g, new Mesh(new TubeGeometry(new CatmullRomCurve3(pts), 48, 0.05, 10), toy(C.grn)));
    add(g, sph(0.08, toy(C.red), 16), -0.32, 0.38);
    return g;
  },
  stairs() {
    const g = new Group(); [C.sky, C.vio, C.pnk, C.org].forEach((c, k) => add(g, rbox(0.24, 0.14 + k * 0.16, 0.36, 0.04, toy(c)), -0.36 + k * 0.24, (0.14 + k * 0.16) / 2));
    add(g, sph(0.07, lit(C.yel, 0.8), 12), 0.36, 0.84);
    return g;
  },
  loop() {
    const g = new Group(); const r = add(g, tor(0.32, 0.04, lit(C.vio, 0.4), 64), 0, 0.5); r.rotation.y = 0;
    [C.sky, C.grn, C.org].forEach((c, k) => { const a = (k / 3) * Math.PI * 2 + 0.5; add(g, sph(0.09, lit(c, 0.6), 16), Math.cos(a) * 0.32, 0.5 + Math.sin(a) * 0.32, 0); });
    const b = add(g, sph(0.06, lit(C.yel, 1), 12), 0.32, 0.5, 0.05); b.name = 'orbit';
    return g;
  },
  chip() {
    const g = new Group(); add(g, rbox(0.56, 0.12, 0.56, 0.04, toy(C.drk)), 0, 0.12);
    add(g, rbox(0.3, 0.04, 0.3, 0.02, lit(C.grn, 0.6)), 0, 0.2);
    for (let k = 0; k < 5; k++) for (const s of [-1, 1]) { add(g, rbox(0.04, 0.03, 0.12, 0.01, toy(C.yel, { metal: 0.8 })), -0.2 + k * 0.1, 0.08, s * 0.33); add(g, rbox(0.12, 0.03, 0.04, 0.01, toy(C.yel, { metal: 0.8 })), s * 0.33, 0.08, -0.2 + k * 0.1); }
    return g;
  },
  ram() {
    const g = new Group(); add(g, rbox(0.9, 0.26, 0.04, 0.02, toy('#15803d')), 0, 0.3);
    for (let k = 0; k < 4; k++) add(g, rbox(0.16, 0.14, 0.03, 0.01, toy(C.drk)), -0.3 + k * 0.2, 0.32, 0.03);
    add(g, rbox(0.86, 0.04, 0.05, 0.005, toy(C.yel, { metal: 0.8 })), 0, 0.17);
    return g;
  },
  mail() {
    const g = new Group(); add(g, rbox(0.8, 0.52, 0.06, 0.03, toy(C.wht)), 0, 0.4);
    const s = new Shape(); s.moveTo(-0.4, 0.26); s.lineTo(0, -0.02); s.lineTo(0.4, 0.26); s.lineTo(0.4, 0.2); s.lineTo(0, -0.08); s.lineTo(-0.4, 0.2); s.closePath();
    add(g, new Mesh(new ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false }), toy(C.pnk)), 0, 0.4, 0.03);
    return g;
  },
  calendar() {
    const g = new Group(); add(g, rbox(0.7, 0.66, 0.06, 0.04, toy(C.wht)), 0, 0.4);
    add(g, rbox(0.7, 0.16, 0.07, 0.04, toy(C.red)), 0, 0.68);
    for (let k = 0; k < 9; k++) add(g, rbox(0.12, 0.1, 0.01, 0.02, k === 4 ? lit(C.blu, 0.6) : toy('#e2e8f0')), -0.2 + (k % 3) * 0.2, 0.5 - Math.floor(k / 3) * 0.14, 0.035);
    return g;
  },
  lock() {
    const g = new Group(); add(g, rbox(0.5, 0.42, 0.22, 0.06, toy(C.yel, { metal: 0.6, rough: 0.3 })), 0, 0.25);
    add(g, new Mesh(new TorusGeometry(0.15, 0.04, 10, 24, Math.PI), toy(C.gry, { metal: 0.8 })), 0, 0.46);
    add(g, sph(0.05, toy(C.drk), 12), 0, 0.28, 0.11);
    return g;
  },
  star() { const g = new Group(); const s = new Shape(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 0.16 : 0.38, a = (k / 10) * Math.PI * 2 + Math.PI / 2; if (k) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } s.closePath(); add(g, new Mesh(new ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03 }), lit(C.yel, 0.5)), 0, 0.5, -0.05); add(g, glow(C.yel, 1.1, 0.4), 0, 0.5); return g; },
  medal() {
    const g = new Group(); for (const [x, c] of [[-0.1, C.blu], [0.1, C.red]] as const) { const r = add(g, rbox(0.12, 0.5, 0.02, 0.01, toy(c)), x, 0.75); r.rotation.z = x * 3; }
    const d = add(g, cyl(0.28, 0.28, 0.07, toy('#fbbf24', { metal: 0.9, rough: 0.2, emissive: '#f59e0b', glow: 0.15 }), 48), 0, 0.38); d.rotation.x = Math.PI / 2;
    add(g, tor(0.28, 0.025, toy('#fde68a', { metal: 0.9, rough: 0.15 })), 0, 0.38);
    add(g, sign('★', 0.3, 0.3, '#b45309'), 0, 0.38, 0.04);
    return g;
  },
  flag() { const g = new Group(); add(g, cyl(0.02, 0.02, 0.9, toy(C.gry, { metal: 0.6 }), 8), 0, 0.45); add(g, rbox(0.4, 0.26, 0.02, 0.02, toy(C.red)), 0.2, 0.75); return g; },
  funnel() { const g = new Group(); add(g, cyl(0.4, 0.06, 0.45, glassP('#e0f2fe', { thick: 0.2 }), 32), 0, 0.62); add(g, cyl(0.06, 0.06, 0.3, glassP('#e0f2fe'), 16), 0, 0.25); for (let k = 0; k < 5; k++) add(g, sph(0.05, lit([C.red, C.blu, C.grn, C.yel, C.pnk][k]!, 0.4), 10), -0.2 + k * 0.1, 0.78 + (k % 2) * 0.05); add(g, sph(0.05, lit(C.pur, 0.8), 10), 0, 0.05); return g; },
  pencil() { const g = new Group(), b = add(g, new Group(), 0, 0.45); b.rotation.z = 0.6; add(b, cyl(0.06, 0.06, 0.6, toy(C.yel), 6)); add(b, new Mesh(new ConeGeometry(0.06, 0.14, 6), toy('#fde68a')), 0, -0.37).rotation.x = Math.PI; add(b, cyl(0.06, 0.06, 0.08, toy(C.pnk), 12), 0, 0.33); return g; },
  people() { const g = new Group(); [-0.3, 0, 0.3].forEach((x, k) => { const p = add(g, P.person!(), x, 0, k === 1 ? -0.1 : 0); p.scale.setScalar(0.62); }); return g; },
  magnet() { const g = new Group(); add(g, new Mesh(new TorusGeometry(0.25, 0.09, 12, 24, Math.PI), toy(C.red)), 0, 0.5).rotation.z = Math.PI; for (const x of [-0.25, 0.25]) add(g, rbox(0.18, 0.14, 0.18, 0.02, toy(C.gry, { metal: 0.7 })), x, 0.28); return g; },
  arrow() { const g = new Group(); add(g, rbox(0.6, 0.12, 0.12, 0.04, lit(C.pur, 0.4)), -0.1, 0.5); add(g, new Mesh(new ConeGeometry(0.16, 0.26, 20), lit(C.pur, 0.4)), 0.3, 0.5).rotation.z = -Math.PI / 2; return g; },
  box() { const g = new Group(); add(g, rbox(0.62, 0.5, 0.5, 0.05, toy('#d6a46b', { rough: 0.7 })), 0, 0.25); add(g, rbox(0.64, 0.04, 0.1, 0.01, toy('#b45309')), 0, 0.51); return g; },
  bolt() { const g = new Group(), s = new Shape(); s.moveTo(0.05, 0.9); s.lineTo(-0.25, 0.4); s.lineTo(0, 0.42); s.lineTo(-0.1, 0); s.lineTo(0.25, 0.52); s.lineTo(0, 0.5); s.closePath(); add(g, new Mesh(new ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 }), lit(C.yel, 0.6)), 0, 0, -0.05); return g; },
  gem() { const g = new Group(); add(g, new Mesh(new OctahedronGeometry(0.32, 0), glassP('#f0abfc', { thick: 0.6, att: '#e879f9', dist: 0.6 })), 0, 0.5).scale.y = 1.3; add(g, glow('#f0abfc', 1, 0.4), 0, 0.5); return g; },
  orb() { const g = new Group(); add(g, new Mesh(new IcosahedronGeometry(0.3, 3), glassP('#ddd6fe', { thick: 0.6 })), 0, 0.5); add(g, sph(0.12, lit(C.vio, 0.9), 16), 0, 0.5); return g; },
  rock() { const g = new Group(); add(g, new Mesh(new DodecahedronGeometry(0.32, 0), toy('#a8a29e', { rough: 0.8 })), 0, 0.3).scale.y = 0.7; return g; },
  ball() { const g = new Group(); add(g, sph(0.26, toy(C.org, { coat: 1, rough: 0.2 }), 32), 0, 0.26); add(g, tor(0.262, 0.02, toy(C.wht), 40), 0, 0.26).rotation.y = 0.6; return g; },
  shop() {
    const g = new Group(); add(g, rbox(0.7, 0.5, 0.5, 0.06, toy('#fff7ed')), 0, 0.25);
    for (let k = 0; k < 5; k++) { const a = add(g, rbox(0.15, 0.06, 0.56, 0.02, toy(k % 2 ? C.wht : C.red)), -0.3 + k * 0.15, 0.6); a.rotation.x = 0.35; }
    add(g, rbox(0.2, 0.3, 0.02, 0.03, toy(C.brn)), 0, 0.15, 0.26); add(g, rbox(0.18, 0.14, 0.02, 0.02, glassP('#bae6fd')), 0.2, 0.3, 0.26);
    return g;
  },
  cube() { const g = new Group(); add(g, new Mesh(new BoxGeometry(0.4, 0.4, 0.4), glassP('#c7d2fe', { thick: 0.4 })), 0, 0.3); return g; },
};
/** the names content may use */
export const PROPS = Object.keys(P);
export function prop(name: string): Group { const f = P[name] ?? P.orb!; const g = f(); g.name = g.name || name; return g; }
/** the idle motion a prop may have: spinning parts, an orbiting bead, a tilting scale */
export function idle(g: Object3D, t: number) {
  g.traverse((o) => {
    if (o.name === 'spin') o.rotation.z = t * 0.8;
    else if (o.name === 'tilt') o.rotation.z = Math.sin(t * 1.3) * 0.14;
    else if (o.name === 'orbit') { const a = t * 1.6; o.position.set(Math.cos(a) * 0.32, 0.5 + Math.sin(a) * 0.32, 0.05); }
  });
}
