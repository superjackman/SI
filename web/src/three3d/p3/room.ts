/* R33 pilot v4, page 2: the "Layered Core" hall is a real three.js room, modelled in code (the reference is only a
   target): a round room of transmissive glass walls on a glossy floor with a glowing ring, a lit ceiling rim, and five
   glass pedestals in two rows: the lettered word blocks, the glowing brain core in its halo, the rainbow layer discs
   under a glass dome, a glass cube holding a green error valley with a ball, and glass dice with pips. A glowing glass
   board "Layered Core" with canvas text floats over the brain core. Everything idles gently (the ball rolls, the discs
   turn, the dice bob, the halo breathes). Drag to orbit, pinch to zoom; tap a pedestal (or a page dot): the camera flies
   to it and its bubble opens. */
import {
  CircleGeometry, Color, CylinderGeometry, Group, Mesh, MeshBasicMaterial, PlaneGeometry, SphereGeometry, TorusGeometry,
  type Material, type Object3D, type Sprite,
} from 'three';
import { scene, V, type P3, type SApi } from './base';
import { canvasTex, glassP, glow, rbox, shade, text, toy } from './look';
import { brainLobe, rnd } from './props';
import { PEDS, UI, t } from '../../pilot3d/text';

/** where the five pedestals stand (x, z) and how tall they are, in the pedestals' order */
export const PODS: [number, number, number][] = [[-1.32, -0.55, 0.55], [0, -1.05, 0.75], [1.32, -0.55, 0.55], [-0.75, 0.85, 0.3], [0.75, 0.85, 0.3]];
const add = <T extends Object3D>(g: Group, o: T) => { g.add(o); return o; };

/** a two-tier rounded glass pedestal with a soft light in its top */
function pedestal(h: number, r: number): Group {
  const g = new Group(), gl = glassP('#dcd0ff', { thick: 0.7, rough: 0.1, att: '#c2b0fb', dist: 1.0 });
  add(g, new Mesh(new CylinderGeometry(r, r * 1.04, h * 0.62, 64), gl)).position.y = h * 0.31;
  add(g, new Mesh(new CylinderGeometry(r * 0.86, r * 0.9, h * 0.38, 64), gl)).position.y = h * 0.81;
  const lip = add(g, new Mesh(new TorusGeometry(r * 1.01, 0.022, 10, 64), glassP('#f1ebff', { thick: 0.2 }))); lip.rotation.x = Math.PI / 2; lip.position.y = h * 0.62;
  const cap = add(g, new Mesh(new CircleGeometry(r * 0.8, 48), new MeshBasicMaterial({ color: '#e9e2ff', toneMapped: false, transparent: true, opacity: 0.55 })));
  cap.rotation.x = -Math.PI / 2; cap.position.y = h + 0.002;
  const base = add(g, new Mesh(new CylinderGeometry(r * 1.1, r * 1.12, 0.04, 64), toy('#f4f1fb', { rough: 0.25, coat: 1 }))); base.position.y = 0.02;
  return g;
}
/** a letter on a canvas (transparent), for the word blocks and dice-free faces */
const letterTex = (s: string, c = '#5b3fb8') => canvasTex(128, 128, (g, w, h) => text(g, s, w / 2, h / 2 + 4, 100, 92, c, 800));

function words(): Group {
  const g = new Group(), gl = glassP('#d9ccff', { thick: 0.35, rough: 0.08, att: '#b9a3ff', dist: 0.9 });
  const rows: [string, number, number][] = [['B', -0.3, 0.15], ['i', 0, 0.15], ['L', 0.3, 0.15], ['I', -0.15, 0.45], ['B', 0.15, 0.45], ['E', 0, 0.75]];
  for (const [ch, x, y] of rows) {
    add(g, rbox(0.28, 0.28, 0.28, 0.055, gl, x, y, 0));
    const f = add(g, new Mesh(new PlaneGeometry(0.22, 0.22), new MeshBasicMaterial({ map: letterTex(ch), transparent: true, depthWrite: false })));
    f.position.set(x, y, 0.142); f.renderOrder = 5;
    add(g, glow('#c4b5fd', 0.28, 0.25)).position.set(x, y, 0);
  }
  return g;
}
function core(): { g: Group; halo: Group; aura: Sprite; lobes: Mesh[] } {
  const g = new Group(), m = toy('#a78bfa', { rough: 0.3, coat: 1, emissive: '#7c3aed', glow: 0.55 });
  const lobes = [-1, 1].map((sd) => { const l = add(g, new Mesh(brainLobe(sd), m)); l.scale.set(0.5, 0.55, 0.72); l.position.set(sd * 0.15, 0.5, 0); return l; });
  const ball = add(g, new Mesh(new SphereGeometry(0.4, 48, 32), glassP('#efe9ff', { thick: 0.2, rough: 0.03 }))); ball.position.y = 0.5; ball.renderOrder = 4;
  /* the halo: a glowing ring with sparks round it */
  const halo = new Group(); halo.position.y = 0.5; g.add(halo);
  const ringM = new MeshBasicMaterial({ color: '#d8b4fe', toneMapped: false, transparent: true, opacity: 0.85 });
  add(halo, new Mesh(new TorusGeometry(0.5, 0.012, 8, 96), ringM));
  for (let k = 0; k < 22; k++) {
    const a = (k / 22) * Math.PI * 2, r = 0.5 + (rnd(k) - 0.5) * 0.08, sp = glow(k % 3 ? '#c4b5fd' : '#f0abfc', 0.08 + rnd(k + 9) * 0.07, 0.9);
    sp.position.set(Math.cos(a) * r, Math.sin(a) * r, 0); halo.add(sp);
  }
  const aura = add(g, glow('#a855f7', 1.6, 0.6)); aura.position.y = 0.5;
  return { g, halo, aura, lobes };
}
function rainbow(): { g: Group; discs: Group } {
  const g = new Group(), discs = new Group(); g.add(discs);
  const C = ['#8b5cf6', '#3b82f6', '#22c55e', '#facc15', '#fb923c', '#ef4444'];
  C.forEach((c, k) => {
    const r = 0.36 - k * 0.04, d = add(discs, new Mesh(new CylinderGeometry(r, r, 0.07, 48), toy(c, { rough: 0.25, coat: 1, emissive: c, glow: 0.18 })));
    d.position.y = 0.06 + k * 0.085;
    const e = add(discs, new Mesh(new TorusGeometry(r, 0.035, 12, 48), d.material as Material)); e.rotation.x = Math.PI / 2; e.position.y = d.position.y;
  });
  const dome = add(g, new Mesh(new CylinderGeometry(0.46, 0.46, 0.62, 64, 1, true), glassP('#f3efff', { thick: 0.08, rough: 0.03 }))); dome.position.y = 0.31; dome.renderOrder = 6;
  const top = add(g, new Mesh(new SphereGeometry(0.46, 64, 16, 0, Math.PI * 2, 0, Math.PI / 2), glassP('#f3efff', { thick: 0.08, rough: 0.03 }))); top.position.y = 0.62; top.scale.y = 0.35; top.renderOrder = 6;
  return { g, discs };
}
function valley(): { g: Group; ball: Mesh } {
  const g = new Group(), n = 40, geo = new PlaneGeometry(0.5, 0.5, n, n), p = geo.attributes.position!;
  const col: number[] = [], lo = new Color('#15803d'), hi = new Color('#a3e635'), c = new Color();
  const hgt = (x: number, y: number) => 0.05 + 0.26 * (Math.pow(Math.abs(x) * 3.6, 2) * 0.55 + Math.pow(Math.abs(y + 0.03) * 3.2, 2) * 0.35) + 0.03 * Math.sin(x * 22) * Math.cos(y * 18);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), h = Math.min(0.44, hgt(x, y)); p.setZ(i, h); c.copy(lo).lerp(hi, Math.min(1, h / 0.3)); col.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new (p.constructor as typeof import('three').BufferAttribute)(new Float32Array(col), 3));
  geo.computeVertexNormals();
  const land = add(g, new Mesh(geo, toy('#ffffff', { rough: 0.6, coat: 0.3 }))); (land.material as unknown as { vertexColors: boolean }).vertexColors = true;
  land.rotation.x = -Math.PI / 2; land.position.y = 0.04;
  const ball = add(g, new Mesh(new SphereGeometry(0.045, 24, 16), toy('#7c3aed', { rough: 0.2, coat: 1, emissive: '#7c3aed', glow: 0.3 })));
  const cube = add(g, rbox(0.6, 0.52, 0.6, 0.07, glassP('#efe9ff', { thick: 0.15, rough: 0.04 }), 0, 0.26, 0)); cube.renderOrder = 6;
  return { g, ball };
}
function dice(): Group {
  const g = new Group(), d = add(g, rbox(0.46, 0.46, 0.46, 0.08, glassP('#d4c7ff', { thick: 0.9, rough: 0.16, att: '#cbbcff', dist: 0.75 }), 0, 0.26, 0));
  const pm = toy('#3b1a7a', { rough: 0.3, coat: 1 }), pg = new SphereGeometry(0.036, 16, 10), s = 0.13, o = 0.232;
  const face = (n: number) => ({ 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] } as Record<number, number[][]>)[n]!;
  const put = (n: number, f: (a: number, b: number) => [number, number, number], sc: [number, number, number]) => face(n).forEach(([a, b]) => { const q = new Mesh(pg, pm); q.position.set(...f(a! * s, b! * s)); q.scale.set(...sc); d.add(q); });
  put(5, (a, b) => [a, b, o], [1, 1, 0.45]); put(2, (a, b) => [-a, b, -o], [1, 1, 0.45]);
  put(3, (a, b) => [o, b, a], [0.45, 1, 1]); put(4, (a, b) => [-o, b, a], [0.45, 1, 1]);
  put(1, (a, b) => [a, o, b], [1, 0.45, 1]); put(6, (a, b) => [a, -o, b], [1, 0.45, 1]);
  d.rotation.set(0.12, 0.5, 0);
  return g;
}
/** the hall: a glossy floor, a glowing floor ring, glass walls and a lit ceiling rim */
function hall(): Group {
  const g = new Group();
  const floor = add(g, new Mesh(new CircleGeometry(4.2, 96), toy('#ddd2f7', { rough: 0.12, coat: 1 }))); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  const ringM = new MeshBasicMaterial({ color: '#ddd0ff', toneMapped: false, transparent: true, opacity: 0.9 });
  for (const [r, w] of [[2.75, 0.03], [2.95, 0.012]] as const) { const ri = add(g, new Mesh(new TorusGeometry(r, w, 8, 128), ringM)); ri.rotation.x = Math.PI / 2; ri.position.y = 0.01; }
  const disc = add(g, new Mesh(new CircleGeometry(2.7, 96), new MeshBasicMaterial({ color: '#e4dafc', transparent: true, opacity: 0.35, depthWrite: false }))); disc.rotation.x = -Math.PI / 2; disc.position.y = 0.006;
  /* the glass walls: the back half of a tall cylinder, in panes with soft mullions */
  const wallM = glassP('#d6c8fb', { thick: 0.3, rough: 0.16, att: '#b7a2f5', dist: 1.2 }), mullM = toy('#f6f3fd', { rough: 0.3, coat: 1 });
  const wall = add(g, new Mesh(new CylinderGeometry(3.8, 3.8, 4.2, 96, 1, true, Math.PI * 0.55, Math.PI * 0.9), wallM)); wall.position.y = 2.1;
  (wall.material as unknown as { side: number }).side = 2;
  for (let k = 0; k <= 6; k++) {
    const a = Math.PI * 0.55 + (k / 6) * Math.PI * 0.9 + Math.PI / 2, m = add(g, new Mesh(new CylinderGeometry(0.035, 0.035, 4.2, 10), mullM));
    m.position.set(Math.sin(a - Math.PI / 2) * 3.78, 2.1, Math.cos(a - Math.PI / 2) * 3.78);
  }
  const rimM = new MeshBasicMaterial({ color: '#f5f0ff', toneMapped: false });
  for (const y of [4.15, 0.04]) { const r = add(g, new Mesh(new TorusGeometry(3.8, 0.06, 10, 128), y > 1 ? rimM : mullM)); r.rotation.x = Math.PI / 2; r.position.y = y; }
  const band = add(g, new Mesh(new CylinderGeometry(3.85, 3.85, 0.5, 96, 1, true), toy('#f3effc', { rough: 0.4 }))); band.position.y = 4.4;
  (band.material as unknown as { side: number }).side = 2;
  return g;
}
/** the floating glass board with "Layered Core" in canvas text */
function board(s: string): Group {
  const g = new Group();
  add(g, rbox(1.25, 0.34, 0.06, 0.08, toy('#f3efff', { rough: 0.2, coat: 1, emissive: '#c4b5fd', glow: 0.35, opacity: 0.88 })));
  const f = add(g, new Mesh(new PlaneGeometry(1.2, 0.3), new MeshBasicMaterial({ map: canvasTex(512, 128, (c, w, h) => {
    c.shadowColor = 'rgba(167,139,250,.9)'; c.shadowBlur = 18; text(c, s, w / 2, h / 2 + 3, 470, 64, '#4c2f9e', 700);
  }), transparent: true, depthWrite: false, toneMapped: false })));
  f.position.z = 0.035; f.renderOrder = 7;
  const edge = add(g, rbox(1.3, 0.39, 0.02, 0.1, new MeshBasicMaterial({ color: '#c4b5fd', toneMapped: false, transparent: true, opacity: 0.45 }))); edge.position.z = -0.03;
  add(g, glow('#a78bfa', 1.6, 0.35));
  return g;
}

export function make(box: HTMLElement, api: SApi): P3 {
  return scene(box, api, (st, P) => {
    P.add(hall());
    const C = core(), R = rainbow(), Vy = valley(), things: Group[] = [words(), C.g, R.g, Vy.g, dice()];
    const hits = things.map((th, k) => {
      const [x, z, h] = PODS[k]!, hold = new Group(); hold.position.set(x, 0, z); P.add(hold);
      const pd = pedestal(h, k === 1 ? 0.5 : 0.46); hold.add(pd);
      th.position.y = h; hold.add(th); shade(th);
      const gl = glow('#d8ccff', 1.3, 0.22); gl.position.set(0, h + 0.05, 0); hold.add(gl);
      return hold;
    });
    const B = board(t(UI.core, api.lang)); B.position.set(0, 2.25, -1.05); P.add(B);
    /* a few sparkles rising */
    const sparks = Array.from({ length: 14 }, (_, k) => { const s = glow('#e9d5ff', 0.06 + rnd(k) * 0.05, 0.9); s.position.set((rnd(k + 3) - 0.5) * 4.4, rnd(k + 5) * 3, (rnd(k + 7) - 0.6) * 3); P.add(s); return s; });
    let tt = 0, idle = 0;
    const poke = () => { idle = 0; st.draw(); };
    st.canvas.addEventListener('pointerdown', poke);
    const TOP = [0.95, 1.0, 0.75, 0.6, 0.55];
    const pos = (k: number, dy: number) => V(PODS[k]![0], PODS[k]![2] + dy, PODS[k]![1]);
    return {
      look: { sky: ['#cfc3f3', '#e2d9fa', '#f3effd'], exposure: 0.95, shadow: 3.2, key: [2, 8, 4] },
      lim: { az: [-0.7, 0.7], el: [0.1, 1.0], z: [0.6, 1.3] },
      cam: { look: V(0, 0.95, 0.1), dir: V(0, 0.36, 1), r: 1.85 },
      view: (k) => ({ look: pos(k, 0.55), dir: V(0, 0.35, 1), r: 0.95 }),
      at: PODS.map((_, k) => pos(k, 0.3)), top: PODS.map((_, k) => pos(k, TOP[k]!)),
      names: PEDS.map((d) => t(d.name, api.lang)), hits,
      onFocus(i) { B.visible = i === null; poke(); },
      busy: () => idle < 30, sway: () => true,
      tick(dt) {
        tt += dt; idle += dt;
        C.halo.rotation.z += dt * 0.4; C.halo.scale.setScalar(1 + 0.04 * Math.sin(tt * 2));
        C.aura.material.opacity = 0.45 + 0.2 * Math.sin(tt * 2.2);
        for (const l of C.lobes) (l.material as unknown as { emissiveIntensity: number }).emissiveIntensity = 0.45 + 0.2 * Math.sin(tt * 2.2);
        R.discs.rotation.y += dt * 0.5;
        const a = tt * 0.9; Vy.ball.position.set(Math.sin(a) * 0.15, 0.13 + 0.07 * Math.sin(a) ** 2, 0.02);
        things[4]!.position.y = PODS[4]![2] + 0.03 * Math.sin(tt * 1.5); things[4]!.rotation.y = Math.sin(tt * 0.5) * 0.2;
        things[0]!.position.y = PODS[0]![2] + 0.02 * Math.sin(tt * 1.2 + 1);
        B.position.y = 2.25 + 0.04 * Math.sin(tt * 1.1);
        sparks.forEach((s, k) => { s.position.y = (rnd(k + 5) * 3 + tt * 0.15) % 3; });
      },
      bye() { st.canvas.removeEventListener('pointerdown', poke); },
    };
  });
}
