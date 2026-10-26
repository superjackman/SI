/* R30 scene 1 (T3): the word-vector space. R30c look (the reference sheet): three tight clumps of big satin balls
   (lavender people, indigo places, powder-blue animals) floating over three faint arrowed axes X / Y / Z, each ball with
   a soft shadow on the floor. The chosen word glows (halo + white ring) and wears the only label, a white pill on a thin
   stem; its 3 nearest neighbours stay bright, the rest fade a little. Tap a ball to choose it; drag sideways to turn. */
import { Color, ConeGeometry, CylinderGeometry, DoubleSide, Mesh, MeshBasicMaterial, Quaternion, RingGeometry, SphereGeometry, Vector3 } from 'three';
import { satin, stage } from './core';
import { vcol, VWORDS } from '../m2/w3d';
import type { View } from '../m2/s3d';

export interface VecApi {
  lang: 'zh' | 'en'; raf: (f: FrameRequestCallback) => number; caf: (id: number) => void;
  sel(): number; near(): number[]; pick(i: number): void;
}
const R = 0.45, FLOOR = -2.6, O = new Vector3(0, FLOOR, -1.2); // ball radius, floor height, where the axes meet

export function make(box: HTMLElement, api: VecApi): View {
  const balls: Mesh[] = [];
  const st = stage(box, {
    raf: api.raf, caf: api.caf, cam: [0, 5.2, 11], look: [0, -0.1, 0.8], fit: 3.3, yaw: 0.1,
    tick: () => face(),
    tap: (x, y) => {
      let best = -1, bd = 44;
      balls.forEach((b, i) => { const [sx, sy] = st.toScreen(b.position); const d = Math.hypot(sx - x, sy - y); if (d < bd) { bd = d; best = i; } });
      if (best >= 0) api.pick(best);
    },
  });
  const P = st.pivot;
  /* three faint axes with small arrow heads: the three "directions" (dimensions) of this toy space */
  const am = new MeshBasicMaterial({ color: '#b9adf0', transparent: true, opacity: 0.75 });
  const shaft = new CylinderGeometry(0.03, 0.03, 1, 10), cone = new ConeGeometry(0.11, 0.3, 14), UP = new Vector3(0, 1, 0);
  /* drawn like the reference: Y straight up, X running out to the front-right, Z to the front-left */
  const axes: [Vector3, string][] = [[new Vector3(2.7, 0, 2.6), 'X'], [new Vector3(0, 4.9, 0), 'Y'], [new Vector3(-2.7, 0, 2.6), 'Z']];
  for (const [d, n] of axes) {
    const q = new Quaternion().setFromUnitVectors(UP, d.clone().normalize()), len = d.length();
    const s = new Mesh(shaft, am); s.scale.y = len; s.quaternion.copy(q); s.position.copy(O).addScaledVector(d, 0.5); P.add(s);
    const c = new Mesh(cone, am); c.quaternion.copy(q); c.position.copy(O).add(d); P.add(c);
    const t = st.tag(n, 'ax'); t.at.copy(O).addScaledVector(d, 1 + 0.42 / len);
  }
  /* one soft pool of light on the floor, and a shadow under every ball */
  const pool = st.blob(4.2, 0.07); pool.position.set(0, FLOOR - 0.01, 0.3); P.add(pool);
  const geo = new SphereGeometry(R, 48, 32), shadows: Mesh[] = [];
  for (const w of VWORDS) {
    const m = new Mesh(geo, satin(vcol(w[2])));
    m.position.set(w[3], w[4], w[5]); P.add(m); balls.push(m);
    const s = st.blob(0.9, 0.14); s.position.set(w[3], FLOOR, w[5]); P.add(s); shadows.push(s);
  }
  /* the glow of the chosen ball: a see-through halo and a thin white ring that always faces you */
  const halo = st.halo(R * 1.95, '#c4b5fd', 0.3); P.add(halo);
  const ring = new Mesh(new RingGeometry(R * 1.5, R * 1.62, 56), new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, side: DoubleSide, depthWrite: false }));
  ring.renderOrder = 3; P.add(ring);
  const tag = st.tag('', 'pin');
  const q = new Quaternion(), PALE = new Color('#ece8fb');

  const update = () => {
    const s = api.sel(), nb = new Set(api.near());
    balls.forEach((b, i) => {
      const on = i === s, n = nb.has(i), mat = b.material as ReturnType<typeof satin>;
      b.scale.setScalar(on ? 1.22 : 1);
      /* the far words fade toward the background colour (kept solid: see-through balls look like soap bubbles) */
      mat.color.set(vcol(VWORDS[i]![2])); if (!on && !n) mat.color.lerp(PALE, 0.5);
      mat.emissive.set(on ? vcol(VWORDS[i]![2]) : '#000000'); mat.emissiveIntensity = on ? 0.35 : 0;
      (shadows[i]!.material as MeshBasicMaterial).opacity = on ? 0.22 : n ? 0.16 : 0.1;
    });
    const c = balls[s];
    halo.visible = ring.visible = !!c; tag.show(!!c);
    if (c) {
      const w = VWORDS[s]!;
      halo.position.copy(c.position); ring.position.copy(c.position);
      tag.set(api.lang === 'en' ? w[1] : w[0]);
      /* the pill hangs under the ball on a thin stem, like the reference; a ball at the bottom of its clump gets it above */
      const low = VWORDS.some((v, j) => j !== s && v[2] === w[2] && v[4] < w[4] - 0.3 && Math.abs(v[3] - w[3]) < 0.8);
      tag.el.classList.toggle('up', low);
      tag.at.copy(c.position).add(new Vector3(0, low ? R * 1.25 : -R * 1.25, 0));
    }
    st.draw();
  };
  /* the ring turns to face the camera on every frame (the pivot turns under it) */
  function face() { P.updateMatrixWorld(); P.getWorldQuaternion(q).invert(); ring.quaternion.copy(q).multiply(st.cam.quaternion); }
  update();
  return { update, dispose: () => { st.dispose(); } };
}
