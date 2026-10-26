/* R31d scene (T5): a mixture of experts. In front a little queue of word cubes waits; the current one sits on the
   router (a white box with a chip on it). Behind it stand eight coloured expert blocks in two rows (R32). For the
   current word the router lights exactly two experts and runs a glowing cable to each; the other six stay pale.
   The button sends the next word along. */
import { Group, Mesh, Vector3 } from 'three';
import { stage } from './core';
import { cable, face, freeObj, gloss, iconTex, paint, rb, rig, rr } from './kit';
import { MOE_N, MOE_TOK } from '../m2/w3d3';
import type { View } from '../m2/s3d';

export interface MoeApi { lang: 'zh' | 'en'; raf: (f: FrameRequestCallback) => number; caf: (id: number) => void; i(): number }
const COL = ['#f59e0b', '#22c55e', '#8b5cf6', '#f97316', '#ec4899', '#14b8a6', '#6366f1', '#eab308'];
const DUR = 0.5, RX = 0, RY = -1.12, RZ = 0.55;
/** expert k (1..8): R32 portrait layout, the experts stand behind the router like a little stadium: back row 1-4 on a
    step (so the front row never hides it), front row 5-8, left to right */
const ex = (k: number) => new Vector3(-1.05 + ((k - 1) % 4) * 0.7, k <= 4 ? -0.47 : -0.97, k <= 4 ? -1.75 : -0.85);

const word = (s: string, en: boolean) => paint(160, 160, (g, w, h) => {
  g.fillStyle = '#3b3570'; g.font = `bold ${en ? 54 : s.length > 1 ? 58 : 70}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, w / 2, h / 2 + 3);
});
const num = (k: number, en: boolean) => paint(128, 192, (g, w) => {
  g.fillStyle = 'rgba(255,255,255,.95)'; rr(g, 30, 22, 68, 54, 14); g.fill();
  g.fillStyle = COL[k - 1]!; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(k), w / 2, 51);
  g.fillStyle = '#ffffff'; g.font = `bold ${en ? 26 : 30}px sans-serif`; g.fillText(en ? 'expert' : '专家', w / 2, 128);
});

export function make(box: HTMLElement, api: MoeApi): View {
  const en = api.lang === 'en';
  let t = DUR, cur = -2;
  const st = stage(box, {
    raf: api.raf, caf: api.caf, cam: [0.3, 6.0, 7.0], look: [0, -0.8, -0.15], fit: 2.3, yaw: -0.12,
    busy: () => t < DUR, tick: (dt) => { if (t < DUR) { t = Math.min(DUR, t + dt); pose(); } },
  });
  rig(st);
  const P = st.pivot;
  /* a soft floor tray under everything */
  P.add(rb(3.6, 0.16, 4.3, 0.08, gloss('#f1eefb'), 0, -1.55, -0.1));
  const sh = st.blob(1, 0.2); sh.scale.set(2.2, 2.5, 1); sh.position.set(0, -1.65, -0.1); P.add(sh);
  /* the router */
  P.add(rb(1.0, 0.6, 1.0, 0.16, gloss('#ffffff'), RX, RY, RZ));
  const chip = face(0.62, 0.62, iconTex('chip', '#6d5ce7')); chip.position.set(RX, RY + 0.302, RZ); chip.rotation.x = -Math.PI / 2; P.add(chip);
  P.add(rb(1.12, 0.08, 1.12, 0.04, gloss('#c9c0f7'), RX, RY - 0.32, RZ));
  const rt = st.tag(en ? 'Router' : '路由器', 'ax'); rt.at.set(RX + 1.1, RY - 0.1, RZ);
  /* a step for the back row of experts */
  P.add(rb(3.0, 0.5, 0.8, 0.08, gloss('#e6e1fa'), 0, -1.22, -1.75));
  /* the eight experts */
  const exps = Array.from({ length: MOE_N }, (_, j) => {
    const k = j + 1, p = ex(k), m = gloss(COL[j]!, { emissive: COL[j]!, glow: 0 });
    const g = new Group(); g.position.copy(p); P.add(g);
    g.add(rb(0.62, 1.0, 0.5, 0.1, m));
    const f = face(0.52, 0.8, num(k, en)); f.position.z = 0.252; g.add(f);
    return { g, m, f };
  });
  const xt = st.tag(en ? '8 experts' : '8 位专家', 'ax'); xt.at.set(0, 0.35, -1.75);
  /* the word cubes */
  const toks = MOE_TOK.map((w) => {
    const g = new Group(); P.add(g);
    g.add(rb(0.62, 0.62, 0.62, 0.12, gloss('#ffffff')));
    const f = face(0.56, 0.56, word(en ? w[1] : w[0], en)); f.position.z = 0.312; g.add(f);
    return g;
  });
  /* the queue waits in a row in front of the router, in sentence order from the left (R32: was a line straight away
     from the camera, which hid the faces) */
  const slot = (q: number) => (q === 0 ? new Vector3(RX, RY + 0.66, RZ) : new Vector3(RX - 0.8 + (q - 1) * 0.8, -1.16, RZ + 1.15));
  let wires: Group[] = [];
  const from = MOE_TOK.map(() => new Vector3()), to = MOE_TOK.map(() => new Vector3());
  function pose() {
    const e = 1 - (1 - t / DUR) ** 3;
    toks.forEach((g, j) => { g.position.lerpVectors(from[j]!, to[j]!, e); g.position.y += Math.sin(e * Math.PI) * 0.35 * (from[j]!.distanceTo(to[j]!) > 1.2 ? 1 : 0); });
  }
  function update() {
    const i = api.i(), n = MOE_TOK.length, on = i >= 0 ? MOE_TOK[i % n]![2] : null;
    /* who sits where: the current word on the router, the rest queued after it; before the first tap all queue */
    const q = (j: number) => (i < 0 ? j + 1 : (j - (i % n) + n) % n);
    toks.forEach((g, j) => { from[j]!.copy(cur === -2 ? slot(q(j)) : g.position); to[j]!.copy(slot(q(j))); });
    exps.forEach((x, j) => {
      const lit = !!on && on.includes(j + 1), dim = !!on && !lit;
      x.m.color.set(dim ? '#e4e1f0' : COL[j]!); x.m.emissiveIntensity = lit ? 0.35 : 0;
      (x.f.material as Mesh['material'] & { opacity: number }).opacity = dim ? 0.5 : 1;
      x.g.position.y = ex(j + 1).y + (lit ? 0.12 : 0);
    });
    for (const w of wires) freeObj(w);
    wires = (on ?? []).map((k) => {
      const a = new Vector3(RX, RY + 0.1, RZ - 0.5), b = ex(k).add(new Vector3(0, 0.62, 0));
      const w = cable(a, b, a.clone().add(new Vector3(0, 0.6, -0.4)), b.clone().add(new Vector3(0, 0.9, 0.35)), 0.035, COL[k - 1]!, '#c4b5fd', 0.3);
      P.add(w); return w;
    });
    t = cur === -2 || i === cur ? DUR : 0; cur = i;
    pose(); st.draw();
  }
  update();
  return { update, dispose: () => { for (const w of wires) freeObj(w); st.dispose(); } };
}
