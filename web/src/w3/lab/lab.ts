/* R34: the frame every experiment is built on. A lab is a v4 scene (orbit, picking, glass bubble, quality step-down) on
   the zone's island; taps on the canvas and on its label buttons both arrive at one pick(k) (the shell forwards label
   taps through set({ pick })). say() puts a line in the caption under the scene, done() tells the shell the experiment
   has been tried (the quiz button starts to glow). An optional slider (a range input in the shell) calls input(v). */
import type { Group } from 'three';
import { scene, type Spec } from '../../three3d/p3/base';
import type { Stage } from '../../three3d/core';
import { x } from '../c/types';
import { tx, type L } from '../reg';
import { burst, ground, V3, type View, type WApi } from '../sc/world';

export interface LabOpt { opt: Record<string, unknown>; color: string; sky: [string, string, string] }
export interface Ctx {
  st: Stage; P: Group; lang: L; o: LabOpt;
  /** a 'zh|en' text in the page language */
  t(s: unknown): string;
  say(s: string): void; done(): void; poke(): void;
  /** a star burst at x, y, z */
  star(x: number, y: number, z: number): void;
}
export type LabSpec = Omit<Spec, 'look' | 'view'> & Partial<Pick<Spec, 'look' | 'view'>> & { pick(k: number): void; slider?: View['slider'] };
export type LabBuild = (c: Ctx) => LabSpec;
export function lab(box: HTMLElement, api: WApi, o: LabOpt, build: LabBuild, hall = false): View {
  let sp: LabSpec | null = null, slider: View['slider'];
  const v = scene(box, { ...api, pick: (k) => sp?.pick(k) }, (st, P) => {
    const G = ground(P, hall ? 'hall' : 'isle', o.color, 3.1, 13);
    let quiet = 0, tt = 0;
    const fx: { tick(dt: number): boolean }[] = [];
    const c: Ctx = {
      st, P, lang: api.lang, o,
      t: (s) => tx(x(String(s ?? '')), api.lang),
      say: (s) => api.say?.(s), done: () => api.done?.(),
      poke: () => { quiet = 0; st.draw(); },
      star: (a, b, d) => { fx.push(burst(P, V3(a, b, d))); quiet = 0; st.draw(); },
    };
    const s = sp = build(c); slider = s.slider;
    const onDown = () => c.poke(); st.canvas.addEventListener('pointerdown', onDown);
    const cam = s.cam;
    return {
      ...s,
      look: s.look ?? { sky: o.sky, exposure: 1.0, shadow: 3.4, key: [3, 8, 5], fog: [3, 14] },
      lim: s.lim ?? { az: [-0.45, 0.45], el: [0.12, 0.9], z: [0.8, 1.3] },
      view: s.view ?? (() => cam),
      busy: () => quiet < 6 || fx.length > 0 || !!s.busy?.(),
      sway: () => fx.length === 0 && (s.sway?.() ?? true),
      tick(dt) {
        tt += dt; quiet += dt; G.tick(tt); s.tick?.(dt);
        for (let k = fx.length - 1; k >= 0; k--) if (!fx[k]!.tick(dt)) fx.splice(k, 1);
      },
      bye() { st.canvas.removeEventListener('pointerdown', onDown); s.bye?.(); },
    };
  }) as View;
  v.set = (q) => { const p = (q as { pick?: number }).pick; if (typeof p === 'number') sp?.pick(p); };
  if (slider) v.slider = slider;
  return v;
}
/** move a toward b by rate r per second (frame-rate independent) */
export const ease = (dt: number, r = 8) => 1 - Math.exp(-dt * r);
