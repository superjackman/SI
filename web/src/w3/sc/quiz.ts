/* R34: a quiz page. Three glass answer blocks stand on pedestals behind a glowing answer plate; each block carries its
   answer as a label button. Tap a block, or drag it onto the plate: the shell checks it. Right: the block flies onto the
   plate and gold stars burst. Wrong: the block shakes and a lightbulb pops up over the plate with a hint (try again).
   set({ q: [...] }) swaps in the next question's answers without rebuilding the scene. */
import { Group, Mesh, MeshBasicMaterial, CircleGeometry, TorusGeometry, type Material } from 'three';
import { scene } from '../../three3d/p3/base';
import { glassP, glow, rbox } from '../../three3d/p3/look';
import { pedestal, prop, sign, C } from './kit';
import { burst, ground, onLevel, rayPick, shade, V3, type View, type WApi } from './world';

export interface QuizOpt { opts: string[]; color: string; sky: [string, string, string] }
export type QuizSet = { ok?: number; bad?: number; q?: string[] };
const XS = [-1.25, 0, 1.25], ZB = -0.45, H = 0.42, BY = H + 0.24, PLATE = V3(0, 0.08, 0.95);
const TINT = ['#c4b5fd', '#93c5fd', '#f9a8d4'];
export function make(box: HTMLElement, api: WApi, o: QuizOpt): View {
  let ctl: ((x: QuizSet) => void) | null = null;
  const v = scene(box, api, (st, P) => {
    const G = ground(P, 'isle', o.color, 3.1, 11);
    /* the answer plate: a glowing glass disc with a ring and a "?" */
    const plate = new Group(); plate.position.copy(PLATE); P.add(plate);
    plate.add(rbox(1.0, 0.12, 1.0, 0.06, glassP('#ede9fe', { thick: 0.3 }), 0, 0, 0));
    const ring = new Mesh(new TorusGeometry(0.52, 0.025, 8, 64), new MeshBasicMaterial({ color: o.color, toneMapped: false })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.07; plate.add(ring);
    const disc = new Mesh(new CircleGeometry(0.46, 48), new MeshBasicMaterial({ color: o.color, transparent: true, opacity: 0.25, depthWrite: false })); disc.rotation.x = -Math.PI / 2; disc.position.y = 0.065; plate.add(disc);
    const qm = sign('?', 0.4, 0.4, '#6d28d9'); qm.position.set(0, 0.45, 0); plate.add(qm);
    const pglow = glow(o.color, 1.6, 0.35); pglow.position.y = 0.1; plate.add(pglow);
    /* the hint bulb (hidden until a wrong answer) */
    const bulb = prop('bulb'); bulb.position.set(0.75, 0.15, 0.95); bulb.scale.setScalar(0.001); P.add(bulb); shade(bulb);
    const blocks: Group[] = [], home = XS.map((x) => V3(x, BY, ZB));
    const hits = XS.map((x, k) => {
      const hold = new Group(); hold.position.set(x, 0, ZB); P.add(hold); hold.add(pedestal(H, 0.42, '#ece6ff'));
      const b = new Group(); b.position.copy(home[k]!); P.add(b);
      b.add(rbox(0.42, 0.42, 0.42, 0.08, glassP(TINT[k]!, { thick: 0.8, att: TINT[k]!, dist: 0.8 })));
      const inner = new Mesh(new CircleGeometry(0.1, 24), new MeshBasicMaterial({ color: TINT[k]!, toneMapped: false })); inner.position.z = 0.215; b.add(inner);
      b.add(glow(TINT[k]!, 0.7, 0.4)); blocks.push(b);
      return b;
    });
    let tt = 0, quiet = 0, shake = -1, shakeT = 0, bulbT = -1, won = -1, fx: { tick(dt: number): boolean } | null = null;
    let held = -1, moved = false, x0 = 0, y0 = 0;
    const tgt = home.map((h) => h.clone());
    const poke = () => { quiet = 0; st.draw(); };
    const reset = () => { won = -1; shake = -1; bulbT = -1; bulb.scale.setScalar(0.001); blocks.forEach((b, k) => { tgt[k]!.copy(home[k]!); b.visible = true; b.rotation.set(0, 0, 0); }); qm.visible = true; };
    ctl = (x) => {
      if (x.q) { reset(); x.q.forEach((s, k) => { const el = box.querySelector<HTMLElement>(`.p3l[data-pick="${k}"]`); if (el) (el.firstElementChild ?? el).textContent = s; }); }
      if (x.ok !== undefined) { won = x.ok; tgt[won]!.set(PLATE.x, PLATE.y + 0.3, PLATE.z); qm.visible = false; bulbT = -1; bulb.scale.setScalar(0.001); fx = burst(P, V3(PLATE.x, 0.7, PLATE.z)); }
      if (x.bad !== undefined) { shake = x.bad; shakeT = 0; bulbT = 0; tgt[x.bad]!.copy(home[x.bad]!); }
      poke();
    };
    st.canvas.addEventListener('pointerdown', poke);
    return {
      look: { sky: o.sky, exposure: 1.0, shadow: 3.2, key: [3, 8, 5], fog: [3, 14] },
      lim: { az: [-0.4, 0.4], el: [0.2, 0.9], z: [0.85, 1.25] },
      cam: { look: V3(0, 0.55, 0.15), dir: V3(0, 0.55, 1), r: 1.85 },
      view: () => ({ look: V3(0, 0.55, 0.15), dir: V3(0, 0.55, 1), r: 1.85 }),
      at: home, top: home.map((h) => V3(h.x, h.y + 0.62, h.z)), names: o.opts, hits,
      /* drag a block onto the plate (a tap on a block answers too) */
      hold(x, y) { held = won >= 0 ? -1 : rayPick(st, hits, x, y); x0 = x; y0 = y; moved = false; return held >= 0; },
      drag(x, y) {
        if (held < 0) return; if (Math.hypot(x - x0, y - y0) > 8) moved = true; if (!moved) return;
        const p = onLevel(st, x, y, BY); if (p) { p.x = Math.max(-2, Math.min(2, p.x)); p.z = Math.max(-1, Math.min(1.5, p.z)); blocks[held]!.position.set(p.x, BY + 0.15, p.z); tgt[held]!.copy(blocks[held]!.position); }
        poke();
      },
      drop() {
        const k = held; held = -1; if (k < 0) return;
        if (!moved || blocks[k]!.position.distanceTo(PLATE) < 0.75) api.pick(k);
        else { tgt[k]!.copy(home[k]!); poke(); }
      },
      busy: () => quiet < 20 || !!fx || shake >= 0 || bulbT >= 0 && bulbT < 1, sway: () => !fx && shake < 0,
      tick(dt) {
        tt += dt; quiet += dt; G.tick(tt);
        blocks.forEach((b, k) => {
          if (held === k) return;
          b.position.lerp(tgt[k]!, 1 - Math.exp(-dt * 8));
          if (k !== won) { b.position.y += 0.02 * Math.sin(tt * 1.6 + k * 2) * (b.position.distanceTo(home[k]!) < 0.05 ? 1 : 0); b.rotation.y = Math.sin(tt * 0.7 + k) * 0.25; }
          else b.rotation.y += dt * 2;
        });
        if (shake >= 0) { shakeT += dt; blocks[shake]!.position.x = home[shake]!.x + Math.sin(shakeT * 40) * 0.06 * Math.max(0, 1 - shakeT * 2); if (shakeT > 0.55) { blocks[shake]!.position.x = home[shake]!.x; shake = -1; } }
        if (bulbT >= 0) { bulbT += dt; const s = Math.min(1, bulbT * 3); bulb.scale.setScalar(0.8 * (s < 1 ? s * (1.3 - 0.3 * s) : 1)); bulb.position.y = 0.15 + 0.04 * Math.sin(tt * 3); bulb.rotation.y = Math.sin(tt * 2) * 0.3; }
        ring.rotation.z += dt * 0.6; (pglow.material as Material & { opacity: number }).opacity = 0.3 + 0.12 * Math.sin(tt * 2.5);
        qm.position.y = 0.45 + 0.04 * Math.sin(tt * 2);
        if (fx && !fx.tick(dt)) fx = null;
      },
      bye() { st.canvas.removeEventListener('pointerdown', poke); },
    };
  }) as View;
  v.set = (x) => ctl?.(x as QuizSet);
  return v;
}
export { C };
