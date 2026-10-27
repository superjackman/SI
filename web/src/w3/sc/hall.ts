/* R34: a zone hall. The zone's stations stand on glass pedestals round a turning carousel on the zone's island, each
   with its modelled emblem (kit props) and a lit crown once its quiz is done. Swipe to turn the carousel, tap a station
   (or its label): it turns to the front and its bubble opens with an Enter button. Only the front few labels show, so
   they never crowd a phone screen. */
import { Group, Mesh, TorusGeometry, MeshBasicMaterial, Vector3 } from 'three';
import { scene } from '../../three3d/p3/base';
import type { Tag } from '../../three3d/core';
import { glow } from '../../three3d/p3/look';
import { idle, pedestal, prop } from './kit';
import { ground, label, rayPick, shade, V3, type View, type WApi } from './world';

export interface HallOpt { emb: string[]; names: string[]; done: boolean[]; color: string; sky: [string, string, string]; seed?: number }
export function make(box: HTMLElement, api: WApi, o: HallOpt): View {
  return scene(box, api, (st, P) => {
    const n = o.emb.length, R = n === 1 ? 0.01 : Math.max(2.0, n * 0.37), step = (Math.PI * 2) / n, H = 0.5;
    const G = ground(P, 'isle', o.color, Math.max(3, R + 1.2), o.seed ?? 5);
    const ring = new Group(); ring.position.z = -R; P.add(ring);
    const things: Group[] = [];
    const hits = o.emb.map((e, k) => {
      const a = k * step, hold = new Group(); hold.position.set(Math.sin(a) * R, 0, Math.cos(a) * R); hold.rotation.y = a; ring.add(hold);
      hold.add(pedestal(H, 0.5, o.done[k] ? '#fde68a' : '#e4dcff'));
      const g = prop(e); g.position.y = H; shade(g); hold.add(g); things.push(g);
      if (o.done[k]) { const c = new Mesh(new TorusGeometry(0.42, 0.03, 8, 48), new MeshBasicMaterial({ color: '#facc15', toneMapped: false })); c.rotation.x = Math.PI / 2; c.position.y = H + 0.02; hold.add(c); }
      const gl = glow(o.done[k] ? '#fde68a' : o.color, 1.2, 0.28); gl.position.y = H + 0.05; hold.add(gl);
      return hold;
    });
    /* the carousel: turn = the ring's angle now, aim = where it is going */
    let turn = 0, aim = 0, cur: number | null = null, tt = 0, quiet = 0, px = 0, x0 = 0, y0 = 0, moved = false;
    const front = (k: number) => -k * step;
    const nearest = () => { const k = Math.round(-turn / step); return ((k % n) + n) % n; };
    const tags: Tag[] = o.names.map((s, k) => label(st, s, k, V3(0, 0, 0)));
    const at = o.emb.map(() => new Vector3()), top = o.emb.map(() => new Vector3()), tip = o.emb.map(() => V3(0, H + 1.1, 0));
    const place = () => {
      ring.rotation.y = turn;
      o.emb.forEach((_, k) => {
        const a = k * step + turn, x = Math.sin(a) * R, z = Math.cos(a) * R - R;
        at[k]!.set(x, H + 0.35, z); top[k]!.set(x, H + 1.05, z); tags[k]!.at.copy(top[k]!);
        tags[k]!.show(cur === null && Math.cos(a) > (n > 6 ? 0.8 : 0.5));
      });
    };
    const poke = () => { quiet = 0; st.draw(); };
    st.canvas.addEventListener('pointerdown', poke);
    place();
    return {
      look: { sky: o.sky, exposure: 1.0, shadow: R + 2, key: [3, 8, 5], fog: [3, 16] },
      lim: { az: [-0.35, 0.35], el: [0.15, 0.8], z: [0.75, 1.3] },
      cam: { look: V3(0, 0.85, -0.2), dir: V3(0, 0.38, 1), r: n === 1 ? 1.2 : 1.75 },
      view: () => ({ look: V3(0, H + 0.45, 0), dir: V3(0, 0.3, 1), r: 0.95 }),
      at, top, tip, names: [], hits,
      onFocus(i) { cur = i; if (i !== null) { const t = front(i); aim = turn + (((t - turn + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI; } tags.forEach((t, k) => t.el.classList.toggle('on', k === i)); place(); poke(); },
      /* a sideways drag turns the carousel; a tap picks what is under the finger */
      hold(x, y) { px = x0 = x; y0 = y; moved = false; return n > 1; },
      drag(x, y) { if (Math.hypot(x - x0, y - y0) > 8) moved = true; if (moved) { turn += (x - px) * 0.006; aim = turn; px = x; place(); poke(); } },
      drop() {
        if (!moved) { api.pick(rayPick(st, hits, x0, y0)); return; }
        const k = nearest(); aim = front(k) + Math.round((turn - front(k)) / (Math.PI * 2)) * Math.PI * 2; api.note?.('front', k); poke();
      },
      busy: () => quiet < 20 || Math.abs(aim - turn) > 1e-3, sway: () => Math.abs(aim - turn) < 1e-3,
      tick(dt) {
        tt += dt; quiet += dt; G.tick(tt);
        if (Math.abs(aim - turn) > 1e-4) { turn += (aim - turn) * (1 - Math.exp(-dt * 7)); place(); }
        things.forEach((g, k) => { g.position.y = H + 0.03 * Math.sin(tt * 1.3 + k); idle(g, tt); });
      },
      bye() { st.canvas.removeEventListener('pointerdown', poke); tags.forEach((t) => st.drop(t)); },
    };
  }) as View;
}
