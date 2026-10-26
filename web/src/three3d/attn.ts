/* R30 scene 2 (T4a): attention beams over 「我 爱 吃 苹果」. R30c look (the reference sheet): four chunky rounded word
   blocks standing on a thick rounded glass slab, seen from a little above; from the chosen word, a soft glowing arc goes back to every word it may look at, as thick as the
   share of attention it gives that word (toy numbers from the card above, w3d.attnRow); the share sits in a white pill on
   the arc's shoulder just above that word; the strongest arc is the brightest. Words after the chosen one are not written yet: their blocks are faded. Tap a block to choose. */
import { CubicBezierCurve3, CylinderGeometry, Mesh, MeshBasicMaterial, MeshStandardMaterial, TorusGeometry, TubeGeometry, Vector3, type Object3D } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { satin, stage, type Tag } from './core';
import { attnRow, AWORDS, pct } from '../m2/w3d';
import type { View } from '../m2/s3d';

export interface AttnApi {
  lang: 'zh' | 'en'; raf: (f: FrameRequestCallback) => number; caf: (id: number) => void;
  sel(): number; pick(i: number): void;
}
const GAP = 1.42, BW = 1.12, BH = 1.0, BD = 1.0, TOP = BH / 2;
const xOf = (i: number) => (i - (AWORDS.length - 1) / 2) * GAP;
const C_ON = '#6366f1', C_SEEN = '#c4b5fd', C_LATER = '#e9e5f5';

export function make(box: HTMLElement, api: AttnApi): View {
  const blocks: Mesh[] = [];
  const st = stage(box, {
    raf: api.raf, caf: api.caf, cam: [0, 5.6, 7.2], look: [0, 1.05, 0], fit: 3.1, yaw: 0.08,
    tap: (x, y) => {
      let best = -1, bd = 56;
      blocks.forEach((b, i) => { const [sx, sy] = st.toScreen(b.position); const d = Math.hypot(sx - x, sy - y); if (d < bd) { bd = d; best = i; } });
      if (best >= 0) api.pick(best);
    },
  });
  const P = st.pivot;
  /* the glass pedestal: a thick oval disc (frosted top), a bright rim, a paler see-through lip below and a soft shadow */
  const ped = new Mesh(new CylinderGeometry(1, 1, 0.4, 96), new MeshStandardMaterial({ color: '#f3effe', roughness: 0.18, metalness: 0.05, transparent: true, opacity: 0.86 }));
  ped.scale.set(3.05, 1, 1.7); ped.position.y = -TOP - 0.2; P.add(ped);
  const rim = new Mesh(new TorusGeometry(1, 0.025, 8, 120), new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 }));
  rim.rotation.x = Math.PI / 2; rim.scale.set(3.05, 1.7, 1); rim.position.y = -TOP; P.add(rim);
  const lip = new Mesh(new CylinderGeometry(1, 1, 0.14, 96), new MeshStandardMaterial({ color: '#d9d0fb', roughness: 0.2, metalness: 0.05, transparent: true, opacity: 0.6 }));
  lip.scale.set(3.18, 1, 1.8); lip.position.y = -TOP - 0.47; P.add(lip);
  const sh = st.blob(1, 0.24); sh.scale.set(3.9, 2.4, 1); sh.position.y = -TOP - 0.6; P.add(sh);
  const bgeo = new RoundedBoxGeometry(BW, BH, BD, 5, 0.24);
  const words: Tag[] = [];
  AWORDS.forEach((w, i) => {
    const m = new Mesh(bgeo, satin(C_SEEN, { opacity: 1 }));
    m.position.set(xOf(i), 0, 0); P.add(m); blocks.push(m);
    const t = st.tag(api.lang === 'en' ? w[1] : w[0], 'word'); t.at.set(xOf(i), 0, BD / 2); words.push(t);
  });
  /* everything that depends on the chosen word is rebuilt (and freed) on each choice */
  let beams: Object3D[] = [], pcts: Tag[] = [];
  const clear = () => {
    for (const o of beams) {
      P.remove(o);
      o.traverse((c) => { const m = c as Object3D & { geometry?: { dispose(): void }; material?: { dispose(): void } }; m.geometry?.dispose(); m.material?.dispose(); });
    }
    for (const t of pcts) st.drop(t);
    beams = []; pcts = [];
  };
  const core = (top: boolean) => satin(top ? '#8b5cf6' : '#b7a6f6', { opacity: top ? 0.95 : 0.8, emissive: top ? '#7c3aed' : '#a78bfa', glow: top ? 0.55 : 0.25 });
  const glow = (top: boolean) => new MeshBasicMaterial({ color: '#c4b5fd', transparent: true, opacity: top ? 0.34 : 0.2, depthWrite: false });
  const add = (o: Object3D) => { P.add(o); beams.push(o); };

  const update = () => {
    clear();
    const s = api.sel(), row = attnRow(s);
    blocks.forEach((b, i) => {
      const m = b.material as MeshStandardMaterial;
      m.color.set(i === s ? C_ON : i > s ? C_LATER : C_SEEN); m.opacity = i > s ? 0.6 : 1;
      m.emissive.set(i === s ? C_ON : '#000000'); m.emissiveIntensity = i === s ? 0.18 : 0;
      /* long English words ("apples", "eating") use the smaller 14 px label so they stay inside their block */
      words[i]!.el.className = 's3t word' + ((api.lang === 'en' ? AWORDS[i]![1] : AWORDS[i]![0]).length > 4 ? ' long' : '') + (i === s ? ' on' : i > s ? ' later' : '');
    });
    const best = row.reduce((m, w, j) => (j <= s && w > row[m]! ? j : m), 0);
    row.forEach((w, j) => {
      if (j > s || w <= 0) return;
      const r = 0.045 + 0.1 * w, top = j === best;
      let pill: Vector3;
      if (j === s) {
        /* looking at itself: a loop standing on top of its own block */
        const R = 0.34, at = new Vector3(xOf(s), TOP + R + 0.02, 0);
        pill = at.clone().setY(at.y + R + 0.3);
        const m = new Mesh(new TorusGeometry(R, r, 12, 48), core(top)); m.position.copy(at); add(m);
        const g = new Mesh(new TorusGeometry(R, r * 2.3, 10, 48), glow(top)); g.position.copy(at); add(g);
      } else {
        const span = s - j, h = TOP + 1.0 + 0.85 * span;
        const a = new Vector3(xOf(s) - 0.18, TOP, 0), b = new Vector3(xOf(j) + 0.18, TOP, 0);
        const cv = new CubicBezierCurve3(a, new Vector3(a.x, h, 0), new Vector3(b.x, h, 0), b);
        add(new Mesh(new TubeGeometry(cv, 64, r, 12, false), core(top)));
        add(new Mesh(new TubeGeometry(cv, 64, r * 2.6, 10, false), glow(top)));
        pill = cv.getPoint(0.8);
        /* both ends glow */
        for (const p of [a, b]) { const e = st.halo(r * 2.2 + 0.07, '#a78bfa', 0.4); e.position.copy(p); add(e); }
      }
      /* the share: a white pill sitting on the arc's shoulder just above the word it goes to (one per word, so they
         sit a whole block apart and never pile up) */
      const t = st.tag(`${pct(w)}%`, 'pct' + (top ? ' on' : ''));
      t.at.copy(pill); pcts.push(t);
    });
    st.draw();
  };
  update();
  return { update, dispose: () => { clear(); st.dispose(); } };
}
