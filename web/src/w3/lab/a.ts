/* R34: the experiments of the "using AI" zone, all modelled in three.js: a tower of glass floors a ball travels through
   (layers), boxes to sort jobs into (sort), stepping stones round a loop (loop), cards that plug into a robot (plug) and a
   slider-driven meter: a star that brightens, a stack of coins, or memory blocks filling a 16 GB box (meter). */
import { Group, Mesh, MeshBasicMaterial, TorusGeometry, Vector3, type Material } from 'three';
import { glassP, glow, rbox, toy } from '../../three3d/p3/look';
import { add, cyl, lit, pedestal, prop, sign, sph, C } from '../sc/kit';
import { onLevel, rayPick, shade, V3, type View, type WApi } from '../sc/world';
import { ease, lab, type LabOpt } from './lab';

const COL = ['#a78bfa', '#60a5fa', '#34d399', '#facc15', '#fb923c', '#f472b6'];
type Mk = (box: HTMLElement, api: WApi, o: LabOpt) => View;

/** a ball travels floor by floor through a tower of glass slabs; each floor lights and says its name */
export const layers: Mk = (box, api, o) => lab(box, api, o, (c) => {
  const L = ((o.opt.l as string[]) ?? []).map(c.t), n = L.length, up = !!o.opt.up, H = 0.26;
  const path = up ? L.map((_, k) => k) : [...L.map((_, k) => n - 1 - k), ...L.map((_, k) => k).slice(1)];
  const slabs = L.map((s, k) => {
    const g = new Group(); g.position.y = 0.2 + k * H; c.P.add(g);
    const m = rbox(1.5, H * 0.8, 1.0, 0.06, glassP(COL[k % 6]!, { thick: 0.6, att: COL[k % 6]!, dist: 0.6 })); g.add(m);
    const lab = sign(s, 1.1, 0.2, '#3b0764'); lab.position.set(0, 0, 0.51); g.add(lab);
    const gl = glow(COL[k % 6]!, 1.6, 0); gl.position.z = 0.3; g.add(gl);
    return { g, gl };
  });
  const ball = sph(0.09, lit(C.org, 0.5)); c.P.add(ball); shade(ball);
  let i = -1; const tgt = V3(0.95, 0.2 + path[0]! * H, 0.35); ball.position.copy(tgt);
  return {
    cam: { look: V3(0, 0.95, 0), dir: V3(0.25, 0.35, 1), r: 2.1 },
    at: [V3(0.95, 0.4, 0.35)], top: [V3(0.95, 0.9, 0.35)], names: [], hits: [ball, ...slabs.map((s) => s.g)],
    pick() {
      i = (i + 1) % (path.length + 1);
      if (i === path.length) { i = -1; tgt.y = 0.2 + path[0]! * H; slabs.forEach((s) => (s.gl.material.opacity = 0)); c.say('↺'); c.poke(); return; }
      const f = path[i]!; tgt.y = 0.2 + f * H; slabs.forEach((s, k) => (s.gl.material.opacity = k === f ? 0.6 : 0.12 * +(path.slice(0, i + 1).includes(k))));
      c.say(`${i + 1}/${path.length} · ${L[f]}`);
      if (i === path.length - 1) { c.star(0.95, tgt.y + 0.2, 0.35); c.done(); }
      c.poke();
    },
    busy: () => Math.abs(ball.position.y - tgt.y) > 1e-3,
    tick(dt) { ball.position.lerp(tgt, ease(dt, 6)); ball.rotation.y += dt; },
  };
});

/** sort: pick a thing (tap or drag) and drop it in the right glass box */
export const sort: Mk = (box, api, o) => lab(box, api, o, (c) => {
  const bins = ((o.opt.bins as string[]) ?? []).map(c.t), items = (o.opt.items as [string, string, number][]) ?? [];
  const BX = [-0.85, 0.85], BZ = -0.35, IZ = 0.75, IX = items.map((_, k) => (k - (items.length - 1) / 2) * 0.72);
  const binG = bins.map((s, b) => {
    const g = new Group(); g.position.set(BX[b]!, 0, BZ); c.P.add(g);
    const gm = glassP(b ? '#bae6fd' : '#ddd6fe', { thick: 0.4 });
    add(g, rbox(1.2, 0.06, 0.8, 0.03, gm), 0, 0.03);
    for (const [w, d, x, z] of [[1.2, 0.05, 0, 0.38], [1.2, 0.05, 0, -0.38], [0.05, 0.8, 0.58, 0], [0.05, 0.8, -0.58, 0]] as const) add(g, rbox(w, 0.42, d, 0.02, gm), x, 0.24, z);
    const lb = sign(s, 1.1, 0.24, '#1e1b4b', '#ffffffcc'); lb.position.set(0, 0.62, 0); g.add(lb);
    const gl = glow(b ? '#38bdf8' : '#a78bfa', 1.8, 0.2); gl.position.y = 0.2; g.add(gl);
    return g;
  });
  const its = items.map(([p, , bin], k) => {
    const g = new Group(); g.position.set(IX[k]!, 0, IZ); c.P.add(g);
    add(g, pedestal(0.18, 0.24, '#ede9fe'));
    const m = prop(p); m.scale.setScalar(0.42); m.position.y = 0.18; shade(m); g.add(m);
    return { g, m, bin, home: V3(IX[k]!, 0.18, IZ), pos: V3(IX[k]!, 0.18, IZ), done: false };
  });
  let sel = -1, held = -1, moved = false, x0 = 0, y0 = 0, left = items.length;
  const hits = [...its.map((t) => t.m), ...binG];
  const choose = (k: number) => {
    if (k < 0 || k >= its.length || its[k]!.done) return;
    sel = k; its.forEach((t, j) => { if (!t.done) t.pos.y = j === k ? 0.4 : 0.18; });
    c.say(`👉 ${c.t(items[k]![1])} — ${c.lang === 'en' ? 'now tap a box' : '现在点一个盒子'}`); c.poke();
  };
  const judge = (k: number, b: number) => {
    const t = its[k]!; sel = -1;
    if (t.bin === b) {
      t.done = true; left--; t.pos.set(BX[b]! + ((k % 2) - 0.5) * 0.4, 0.12, BZ + (k > 1 ? 0.12 : -0.12)); c.star(BX[b]!, 0.5, BZ);
      c.say(`✓ ${c.t(items[k]![1])} → ${bins[b]}`); if (!left) { c.say(`✓ ${c.lang === 'en' ? 'All sorted!' : '全部放对了！'}`); c.done(); }
    } else { t.pos.copy(t.home); c.say(`💡 ${c.lang === 'en' ? 'Not that box. Think again:' : '不是这个盒子，再想想：'} ${c.t(items[k]![1])}`); }
    c.poke();
  };
  return {
    cam: { look: V3(0, 0.35, 0.2), dir: V3(0, 0.75, 1), r: 2.0 },
    at: its.map((t) => V3(t.home.x, 0.35, IZ)), top: its.map((t) => V3(t.home.x, 0.82, IZ)), names: items.map((t) => c.t(t[1])), hits,
    pick(k) {
      if (k >= items.length && k < items.length + 2) { if (sel >= 0) judge(sel, k - items.length); else c.say(c.t('先点一件事，再点盒子。|Tap a job first, then a box.')); return; }
      choose(k);
    },
    hold(x, y) { const k = rayPick(c.st, its.map((t) => t.m), x, y); held = k >= 0 && !its[k]!.done ? k : -1; x0 = x; y0 = y; moved = false; return held >= 0 || (sel >= 0 && rayPick(c.st, binG, x, y) >= 0); },
    drag(x, y) { if (held < 0) return; if (Math.hypot(x - x0, y - y0) > 8) moved = true; if (!moved) return; const p = onLevel(c.st, x, y, 0.3); if (p) its[held]!.pos.set(Math.max(-1.6, Math.min(1.6, p.x)), 0.35, Math.max(-0.8, Math.min(1.1, p.z))); c.poke(); },
    drop() {
      if (held < 0) { const b = rayPick(c.st, binG, x0, y0); if (b >= 0 && sel >= 0) judge(sel, b); return; }
      const k = held; held = -1;
      if (!moved) { choose(k); return; }
      const p = its[k]!.pos; const b = p.z < 0.25 ? (p.x < 0 ? 0 : 1) : -1;
      if (b >= 0) judge(k, b); else { p.copy(its[k]!.home); c.poke(); }
    },
    busy: () => its.some((t) => t.g.position.distanceTo(V3(t.pos.x, 0, t.pos.z)) > 1e-3 || Math.abs(t.m.position.y - t.pos.y) > 1e-3),
    tick(dt) {
      for (const t of its) {
        const want = V3(t.pos.x, 0, t.pos.z); t.g.position.lerp(want, ease(dt, 9)); t.m.position.y += (t.pos.y - t.m.position.y) * ease(dt, 9);
        t.g.children[0]!.visible = t.g.position.distanceTo(V3(t.home.x, 0, t.home.z)) < 0.05;
        t.m.rotation.y += dt * (its.indexOf(t) === sel ? 2 : 0.3);
      }
    },
  };
});

/** loop: a ball hops round stones in a ring (it does a step, you look, ok or fix), and after two rounds the goal lights */
export const loop: Mk = (box, api, o) => lab(box, api, o, (c) => {
  const S = ((o.opt.steps as string[]) ?? []).map(c.t), n = S.length, R = 0.95, goal = c.t(o.opt.goal);
  const pos = S.map((_, k) => { const a = Math.PI / 2 + (k / n) * Math.PI * 2; return V3(Math.cos(a) * R, 0, Math.sin(a) * R * 0.8); });
  const stones = S.map((s, k) => {
    const g = new Group(); g.position.copy(pos[k]!); c.P.add(g);
    add(g, pedestal(0.22, 0.32, COL[k]!));
    const lb = sign(s, 0.9, 0.2, '#1e1b4b', '#ffffffd9'); lb.position.set(0, 0.5, 0.1); g.add(lb);
    const gl = glow(COL[k]!, 1.0, 0.15); gl.position.y = 0.25; g.add(gl);
    return { g, gl };
  });
  const ring = new Mesh(new TorusGeometry(R, 0.015, 8, 96), new MeshBasicMaterial({ color: o.color, toneMapped: false })); ring.rotation.x = Math.PI / 2; ring.scale.y = 0.8; ring.position.y = 0.05; c.P.add(ring);
  const flag = prop('target'); flag.scale.setScalar(0.55); flag.position.set(0, 0, -0.05); shade(flag); c.P.add(flag);
  const ball = sph(0.09, lit(C.org, 0.5)); c.P.add(ball);
  let i = -1, rounds = 0, t = 1; const from = V3(0, 0.33, 0), to = pos[0]!.clone().setY(0.33); ball.position.copy(to);
  return {
    cam: { look: V3(0, 0.3, 0), dir: V3(0, 0.8, 1), r: 1.9 },
    at: [V3(0, 0.3, 0)], top: [V3(0, 0.9, 0)], names: [], hits: [ball, flag, ...stones.map((s) => s.g)],
    pick() {
      i = (i + 1) % n; if (i === 0 && t >= 1 && from.y > 0) rounds++;
      from.copy(ball.position); to.copy(pos[i]!).setY(0.33); t = 0;
      stones.forEach((s, k) => (s.gl.material.opacity = k === i ? 0.7 : 0.15));
      const r = rounds + (i === n - 1 ? 1 : 0);
      if (i === n - 1 && r >= 2) { c.say(`🎉 ${goal}`); c.star(0, 0.8, 0); flag.scale.setScalar(0.75); c.done(); }
      else c.say(`${c.lang === 'en' ? 'Round' : '第'} ${rounds + 1}${c.lang === 'en' ? '' : ' 圈'} · ${S[i]}`);
      c.poke();
    },
    busy: () => t < 1,
    tick(dt) { if (t < 1) { t = Math.min(1, t + dt * 2.2); ball.position.lerpVectors(from, to, t); ball.position.y = 0.33 + Math.sin(t * Math.PI) * 0.35; } flag.rotation.y += dt * 0.6; },
  };
});

/** plug: cards fly into the robot's chest socket; each one adds a power */
export const plug: Mk = (box, api, o) => lab(box, api, o, (c) => {
  const cards = (o.opt.cards as [string, string, string][]) ?? [];
  const bot = prop('robot'); bot.scale.setScalar(1.25); bot.position.set(0, 0, -0.4); shade(bot); c.P.add(bot);
  const sock = new Mesh(new TorusGeometry(0.11, 0.02, 8, 32), lit(C.sky, 0.8)); sock.position.set(0, 0.55, -0.1); c.P.add(sock);
  const aura = glow('#93c5fd', 2.0, 0.15); aura.position.set(0, 0.6, -0.4); c.P.add(aura);
  const CX = cards.map((_, k) => (k - (cards.length - 1) / 2) * 0.62);
  const cs = cards.map(([p], k) => {
    const g = new Group(); g.position.set(CX[k]!, 0.35, 0.7); c.P.add(g);
    add(g, rbox(0.42, 0.56, 0.05, 0.05, glassP(COL[k]!, { thick: 0.3, att: COL[k]!, dist: 0.5 })));
    const m = prop(p); m.scale.setScalar(0.28); m.position.set(0, -0.12, 0.05); g.add(m);
    return { g, home: g.position.clone(), in: false, tgt: g.position.clone() };
  });
  let n = 0;
  return {
    cam: { look: V3(0, 0.55, 0.1), dir: V3(0, 0.35, 1), r: 1.9 },
    at: cs.map((s) => s.home.clone()), top: cs.map((s) => s.home.clone().setY(0.82)), names: cards.map((x) => c.t(x[1])), hits: cs.map((s) => s.g),
    pick(k) {
      const s = cs[k]; if (!s) return;
      if (s.in) { c.say(`✓ ${c.t(cards[k]![2])}`); return; }
      s.in = true; n++; s.tgt.set(-0.45 + (n - 1) * 0.3, 0.95, -0.12);
      aura.material.opacity = 0.15 + n * 0.12; c.star(0, 0.9, -0.2);
      c.say(`🔌 ${c.t(cards[k]![1])}: ${c.t(cards[k]![2])}`); if (n === cards.length) c.done(); c.poke();
    },
    busy: () => cs.some((s) => s.g.position.distanceTo(s.tgt) > 1e-3),
    tick(dt) { cs.forEach((s) => { s.g.position.lerp(s.tgt, ease(dt, 6)); s.g.scale.setScalar(s.in ? 0.55 : 1); }); bot.rotation.y = Math.sin(performance.now() / 1600) * 0.15; sock.rotation.z += dt; },
  };
});

/** meter: one slider and something that grows with it (a star, coins, memory) */
export const meter: Mk = (box, api, o) => {
  const m = String(o.opt.m ?? 'star');
  return m === 'coin' ? coin(box, api, o) : m === 'ram' ? ram(box, api, o) : star(box, api, o);
};
const star: Mk = (box, api, o) => lab(box, api, o, (c) => {
  const items = ((o.opt.items as string[]) ?? []).map(c.t);
  const st = prop('star'); st.position.set(0, 0.6, -0.3); st.scale.setScalar(0.6); shade(st); c.P.add(st);
  const hal = glow('#fde68a', 2.4, 0.05); hal.position.set(0, 0.9, -0.3); c.P.add(hal);
  const XS = items.map((_, k) => (k - (items.length - 1) / 2) * 0.72);
  const pads = items.map((s, k) => {
    const g = new Group(); g.position.set(XS[k]!, 0, 0.6); c.P.add(g); add(g, pedestal(0.2, 0.26, '#ede9fe'));
    const b = sph(0.08, toy('#e5e7eb')); b.position.y = 0.3; g.add(b);
    const lb = sign(s, 0.7, 0.2, '#1e1b4b', '#ffffffd9'); lb.position.set(0, 0.55, 0.05); g.add(lb);
    return b;
  });
  let v = 0;
  const set = (n: number) => {
    v = n; pads.forEach((b, k) => { (b.material as Material) .dispose(); b.material = k < n ? lit(COL[k]!, 0.9) : toy('#e5e7eb'); });
    st.scale.setScalar(0.45 + n * 0.12); hal.material.opacity = 0.05 + n * 0.17;
    c.say(`⭐ ${n}/${items.length} · ${n === items.length ? (c.lang === 'en' ? 'Bright! It knows exactly what you want.' : '好亮！它完全明白你要什么。') : n ? items.slice(0, n).join(' + ') : (c.lang === 'en' ? 'Dim: it has to guess.' : '暗暗的：它只能猜。')}`);
    if (n === items.length) { c.star(0, 1.0, -0.3); c.done(); }
    c.poke();
  };
  return {
    cam: { look: V3(0, 0.55, 0.15), dir: V3(0, 0.4, 1), r: 1.9 },
    at: [V3(0, 0.6, -0.3)], top: [V3(0, 1.2, -0.3)], names: [], hits: [st],
    slider: { min: 0, max: items.length, val: 0, step: 1, label: c.lang === 'en' ? 'Things said' : '说清了几件' },
    input: (x) => set(Math.round(x)),
    pick: () => set((v + 1) % (items.length + 1)),
    tick(dt) { st.rotation.y += dt * (0.3 + v * 0.3); },
  };
});
const coin: Mk = (box, api, o) => lab(box, api, o, (c) => {
  const big = new Group(), small = new Group(); big.position.set(-0.6, 0, 0); small.position.set(0.6, 0, 0); c.P.add(big, small);
  add(big, pedestal(0.15, 0.4, '#ede9fe')); add(small, pedestal(0.15, 0.4, '#e0f2fe'));
  const lb1 = sign(c.lang === 'en' ? 'Big model' : '大模型', 0.8, 0.2, '#1e1b4b', '#ffffffd9'), lb2 = sign(c.lang === 'en' ? 'Small model' : '小模型', 0.8, 0.2, '#1e1b4b', '#ffffffd9');
  lb1.position.set(0, 0.06, 0.48); lb2.position.set(0, 0.06, 0.48); big.add(lb1); small.add(lb2);
  const coins: Mesh[] = [];
  const mk = (g: Group, k: number) => { const m = cyl(0.2, 0.2, 0.05, toy('#facc15', { metal: 0.6, rough: 0.3 })); m.position.set(Math.sin(k * 2.3) * 0.02, 0.18 + k * 0.055, 0); g.add(m); coins.push(m); return m; };
  const B = Array.from({ length: 20 }, (_, k) => mk(big, k)), S = Array.from({ length: 20 }, (_, k) => mk(small, k));
  const doc = prop('book'); doc.scale.setScalar(0.5); doc.position.set(0, 0, 0.9); shade(doc); c.P.add(doc);
  let moved = false;
  const set = (w: number) => {
    const nb = Math.max(1, Math.round(w / 500)), ns = Math.max(1, Math.round(nb / 10));
    B.forEach((m, k) => (m.visible = k < nb)); S.forEach((m, k) => (m.visible = k < ns)); doc.scale.setScalar(0.35 + w / 20000);
    c.say(c.lang === 'en' ? `${w} words → big model 🪙×${nb}, small model 🪙×${ns}` : `${w} 个字 → 大模型 🪙×${nb}，小模型 🪙×${ns}`);
    if (moved) c.done(); moved = true; c.poke();
  };
  set(1000);
  return {
    cam: { look: V3(0, 0.55, 0.2), dir: V3(0, 0.45, 1), r: 1.9 },
    at: [V3(-0.6, 0.6, 0), V3(0.6, 0.4, 0)], top: [V3(-0.6, 1.4, 0), V3(0.6, 1.0, 0)], names: [], hits: [big, small],
    slider: { min: 500, max: 10000, val: 1000, step: 500, label: c.lang === 'en' ? 'Words' : '字数' },
    input: (x) => set(Math.round(x)),
    pick: (k) => c.say(k === 0 ? c.t('大模型：聪明，但每个字更贵。|Big model: smart, but each word costs more.') : k === 1 ? c.t('小模型：便宜，简单的事够用。|Small model: cheap, fine for simple jobs.') : ''),
    sway: () => true,
  };
});
const ram: Mk = (box, api, o) => lab(box, api, o, (c) => {
  const G = 16, cell = 0.11, boxG = new Group(); boxG.position.set(0, 0, -0.1); c.P.add(boxG);
  add(boxG, rbox(1.0, 0.06, 0.6, 0.03, toy('#e2e8f0', { rough: 0.3, coat: 1 })), 0, 0.03);
  const wall = rbox(1.0, 0.95, 0.6, 0.05, glassP('#e0f2fe', { thick: 0.2 })); wall.position.y = 0.52; boxG.add(wall);
  const lb = sign('16 GB', 0.6, 0.2, '#0c4a6e', '#ffffffd9'); lb.position.set(0, 1.12, 0.31); boxG.add(lb);
  const chip = prop('laptop'); chip.scale.setScalar(0.55); chip.position.set(-1.15, 0, 0.4); shade(chip); c.P.add(chip);
  const blocks: Mesh[] = [];
  for (let k = 0; k < 64; k++) { const m = new Mesh(blocks.length ? blocks[0]!.geometry : rbox(cell * 1.6, cell * 0.9, cell * 2.2, 0.02, toy('#a78bfa')).geometry, toy('#a78bfa', { rough: 0.3 })); const r = Math.floor(k / 4), col = k % 4; m.position.set(-0.33 + col * 0.22, 0.1 + r * 0.105, 0); boxG.add(m); blocks.push(m); }
  let moved = false;
  const set = (b: number) => {
    const gb = b * 0.6, n = Math.round(gb), fit = gb <= G - 2;
    blocks.forEach((m, k) => { m.visible = k < n; (m.material as unknown as { color: { set(s: string): void } }).color.set(k >= G ? '#ef4444' : fit ? '#a78bfa' : '#fb923c'); });
    c.say(c.lang === 'en' ? `${b} billion numbers ≈ ${gb.toFixed(1)} GB · ${fit ? '✓ fits' : '✗ too big for 16 GB'}` : `${b}0 亿个数字 ≈ ${gb.toFixed(1)} GB · ${fit ? '✓ 装得下' : '✗ 16GB 装不下'}`);
    if (moved && !fit) c.done(); moved = true; c.poke();
  };
  set(8);
  return {
    cam: { look: V3(-0.2, 0.6, 0.1), dir: V3(0.15, 0.4, 1), r: 2.0 },
    at: [V3(0, 0.6, -0.1)], top: [V3(0, 1.4, -0.1)], names: [], hits: [boxG],
    slider: { min: 1, max: 70, val: 8, step: 1, label: c.lang === 'en' ? 'Model size (billions)' : '模型大小（10 亿）' },
    input: (x) => set(Math.round(x)),
    pick: () => c.say(c.t('紫色块是模型要的内存，盒子是你电脑的 16GB。|Purple blocks are the memory the model needs; the box is your 16 GB.')),
  };
});
export { Vector3 };
