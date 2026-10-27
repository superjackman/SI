/* R33 pilot v4: small modelled pieces the island and the hall share (trees, flowers, clouds, birds, a floating-island
   body with a grass top and a rocky underside, a glowing path). All geometry is made here in code: no image files. */
import {
  BufferAttribute, BufferGeometry, CatmullRomCurve3, Color, CylinderGeometry, Group, IcosahedronGeometry, InstancedMesh, Mesh, MeshBasicMaterial,
  Object3D, SphereGeometry, TubeGeometry, Vector3,
} from 'three';
import { glow, toy } from './look';

/** a smooth pseudo-random number for a seed (the same every time) */
export const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** a floating island: a grass top (gently bumped), a grass lip and a rocky underside that narrows to a point.
    The edge wobbles; sz squashes it front to back. Returns the group and the edge radius at an angle. */
export function island(R = 3.3, sz = 0.86, depth = 2.4, seed = 1) {
  const N = 96, edge = (a: number) => R * (1 + 0.06 * Math.sin(3 * a + seed) + 0.045 * Math.sin(5 * a + 2 * seed) + 0.025 * Math.sin(11 * a + seed));
  const g = new Group();
  /* the top: rings from the middle out */
  const K = 10, tp: number[] = [], tc: number[] = [], ti: number[] = [], C1 = new Color('#7cc24f'), C2 = new Color('#4f9d3a'), c = new Color();
  tp.push(0, 0.04, 0); C1.toArray(tc, 0);
  for (let k = 1; k <= K; k++) for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, f = k / K, r = edge(a) * f, x = Math.cos(a) * r, z = Math.sin(a) * r * sz;
    const y = 0.04 * (1 - f * f) + 0.025 * Math.sin(x * 2.3 + seed) * Math.sin(z * 2.9) * (1 - f);
    tp.push(x, y, z); c.copy(C1).lerp(C2, 0.35 + 0.35 * Math.sin(x * 1.7 + z * 2.1 + seed)); c.toArray(tc, tc.length);
  }
  for (let i = 0; i < N; i++) ti.push(0, 1 + ((i + 1) % N), 1 + i);
  for (let k = 1; k < K; k++) for (let i = 0; i < N; i++) {
    const a = 1 + (k - 1) * N + i, b = 1 + (k - 1) * N + ((i + 1) % N), d = 1 + k * N + i, e = 1 + k * N + ((i + 1) % N);
    ti.push(a, b, d, b, e, d);
  }
  const top = new BufferGeometry(); top.setAttribute('position', new BufferAttribute(new Float32Array(tp), 3)); top.setAttribute('color', new BufferAttribute(new Float32Array(tc), 3));
  top.setIndex(ti); top.computeVertexNormals();
  const gm = toy('#ffffff', { rough: 0.85, coat: 0.15 }); gm.vertexColors = true;
  const T = new Mesh(top, gm); T.receiveShadow = true; g.add(T);
  /* the underside: rows going down and in, with rocky noise; the first rows are the grass lip */
  const M = 12, up: number[] = [], uc: number[] = [], ui: number[] = [];
  const G = new Color('#6db650'), Ro = new Color('#a58a74'), Rd = new Color('#7a6888');
  for (let j = 0; j <= M; j++) for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, t = j / M, n = rnd(i * 7.3 + j * 13.1 + seed) - 0.5;
    const lip = j === 0 ? 1 : j === 1 ? 1.015 : 0;
    const f = lip || Math.pow(1 - (t - 2 / M) / (1 - 2 / M), 0.85) * (0.93 + 0.12 * n + 0.05 * Math.sin(a * 7 + j));
    const r = edge(a) * Math.max(0.02, f), y = j === 0 ? 0 : j === 1 ? -0.16 : -0.16 - depth * Math.pow((t - 1 / M) / (1 - 1 / M), 1.15) + 0.06 * n;
    up.push(Math.cos(a) * r, y, Math.sin(a) * r * sz);
    (j <= 1 ? G : c.copy(Ro).lerp(Rd, Math.min(1, t * 1.2)).multiplyScalar(0.9 + 0.2 * rnd(i + j * 3 + seed))).toArray(uc, uc.length);
  }
  for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) {
    const a = j * N + i, b = j * N + ((i + 1) % N), d = (j + 1) * N + i, e = (j + 1) * N + ((i + 1) % N);
    ui.push(a, b, d, b, e, d);
  }
  let under: BufferGeometry = new BufferGeometry(); under.setAttribute('position', new BufferAttribute(new Float32Array(up), 3)); under.setAttribute('color', new BufferAttribute(new Float32Array(uc), 3));
  under.setIndex(ui); under = under.toNonIndexed(); under.computeVertexNormals(); // faceted rock
  const um = toy('#ffffff', { rough: 0.9, coat: 0 }); um.vertexColors = true; um.flatShading = true;
  const U = new Mesh(under, um); U.castShadow = true; U.receiveShadow = true; g.add(U);
  return { g, edge: (a: number) => edge(a), sz, top: T };
}
/** a round toy tree: a trunk and two or three soft balls of leaves */
export function tree(s = 1, seed = 0): Group {
  const g = new Group(), leaf = toy(rnd(seed) > 0.5 ? '#4f9e45' : '#5cad4c', { rough: 0.6, coat: 0.3 });
  const tr = new Mesh(new CylinderGeometry(0.035, 0.05, 0.28, 10), toy('#8a5a3b', { rough: 0.8, coat: 0 })); tr.position.y = 0.14; g.add(tr);
  const n = 2 + Math.floor(rnd(seed + 3) * 2);
  for (let k = 0; k < n; k++) {
    const b = new Mesh(new IcosahedronGeometry(0.17 - k * 0.03, 2), leaf);
    b.position.set((rnd(seed + k) - 0.5) * 0.08, 0.32 + k * 0.13, (rnd(seed + k + 9) - 0.5) * 0.08); g.add(b);
  }
  g.scale.setScalar(s); g.traverse((o) => { (o as Mesh).castShadow = true; }); return g;
}
/** a meadow of tiny flowers (one instanced mesh) at the given spots */
export function flowers(spots: Vector3[]): InstancedMesh {
  const cols = ['#f9a8d4', '#ffffff', '#fde047', '#c4b5fd', '#fb7185'].map((x) => new Color(x));
  const m = new InstancedMesh(new SphereGeometry(0.035, 10, 8), toy('#ffffff', { rough: 0.5, coat: 0.3 }), spots.length), o = new Object3D();
  spots.forEach((p, k) => { o.position.copy(p); o.scale.set(1, 0.7, 1); o.updateMatrix(); m.setMatrixAt(k, o.matrix); m.setColorAt(k, cols[k % cols.length]!); });
  return m;
}
/** a soft cloud: a cluster of white balls (lit, so it has a shaded underside) */
export function puff(s = 1, seed = 0): Group {
  const g = new Group(), m = toy('#ffffff', { rough: 0.95, coat: 0, emissive: '#efe9ff', glow: 0.25 });
  const n = 5 + Math.floor(rnd(seed) * 3);
  for (let k = 0; k < n; k++) {
    const r = 0.35 + rnd(seed + k * 2) * 0.3, b = new Mesh(new SphereGeometry(r, 20, 14), m);
    b.position.set((k - n / 2) * 0.38 + (rnd(seed + k) - 0.5) * 0.2, r * 0.45 + rnd(seed + k * 5) * 0.15, (rnd(seed + k * 3) - 0.5) * 0.4); b.scale.y = 0.75; g.add(b);
  }
  g.scale.setScalar(s); return g;
}
/** a little bird: two wings that flap */
export function bird(): { g: Group; flap(t: number): void } {
  const g = new Group(), m = toy('#7c6fb0', { rough: 0.6, coat: 0 });
  const w = [-1, 1].map((sd) => { const p = new Group(), b = new Mesh(new SphereGeometry(0.09, 8, 6), m); b.scale.set(1.6, 0.18, 0.6); b.position.x = sd * 0.13; p.add(b); g.add(p); return { p, sd }; });
  return { g, flap: (t) => w.forEach(({ p, sd }) => { p.rotation.z = sd * (0.25 + 0.45 * Math.sin(t * 9)); }) };
}
/** a glowing line along points, with beads of light on it */
export function glowPath(pts: Vector3[], color = '#f3eeff', r = 0.022, beads = 8): Group {
  const g = new Group(), cv = new CatmullRomCurve3(pts);
  g.add(new Mesh(new TubeGeometry(cv, 80, r, 8), new MeshBasicMaterial({ color, toneMapped: false })));
  for (let k = 0; k <= beads; k++) { const s = glow('#e9ddff', 0.13, 0.8); s.position.copy(cv.getPoint(k / beads)); g.add(s); }
  return g;
}

/** one folded brain half (sd = -1 left, +1 right), radius 0.4 */
export function brainLobe(sd: number): SphereGeometry {
  const geo = new SphereGeometry(0.4, 96, 72), p = geo.attributes.position!, v = new Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); const n = v.clone().normalize();
      const f = Math.pow(Math.abs(Math.sin(v.y * 14 + 2.2 * Math.sin(v.z * 9 + v.x * 6))), 0.6) * 0.7 + 0.3 * Math.abs(Math.sin(v.z * 12 + 1.5 * Math.sin(v.y * 8)));
      v.addScaledVector(n, 0.05 * f - (n.x * sd < -0.6 ? 0.06 * (-n.x * sd - 0.6) : 0)); p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
  return geo;
}
