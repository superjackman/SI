/* R34: the experiments of the "inside the model" zones, modelled in three.js: a dice that grows a sentence word by word
   from score bars (tokens), a little neuron whose weight you turn up until its bulb lights (nn), a gatekeeper that sends
   each word to two of six experts (moe), a picture of tiles that flies apart into a row of patches (patch), and the R33
   v4 attention blocks and dot product arrows (attn, dot). */
import { BufferGeometry, Group, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, TorusGeometry, type Material } from 'three';
import { glassP, glow, rbox, toy } from '../../three3d/p3/look';
import { make as attnMake } from '../../three3d/p3/attn';
import { make as dotMake } from '../../three3d/p3/dot';
import { attnSay, dotInfo, ATT } from '../../pilot3d/text';
import { add, cyl, lit, pedestal, prop, sign, sph, C } from '../sc/kit';
import { shade, V3, type View, type WApi } from '../sc/world';
import { lab, type LabOpt } from './lab';

type Mk = (box: HTMLElement, api: WApi, o: LabOpt) => View;
const COL = ['#a78bfa', '#60a5fa', '#34d399', '#facc15', '#fb923c', '#f472b6'];
const lineTo = (a: ReturnType<typeof V3>, b: ReturnType<typeof V3>, color: string) => new Line(new BufferGeometry().setFromPoints([a, b]), new LineBasicMaterial({ color, transparent: true, opacity: 0.8 }));

/** tokens: tap the dice; score bars show the choices and a weighted pick adds the next word card */
export const tokens: Mk = (box, api, o) => lab(box, api, o, (c) => {
  const stages = (['next', 'more', 'end'] as const).map((k) => ((o.opt[k] as [string, number][]) ?? []).map(([w, p]) => [c.t(w), p] as [string, number]));
  const start = c.t(o.opt.start);
  const dice = prop('dice'); dice.scale.setScalar(0.55); dice.position.set(-1.3, 0, 0.5); shade(dice); c.P.add(dice);
  const row = new Group(); row.position.set(0, 1.25, -0.4); c.P.add(row);
  const bars = new Group(); bars.position.set(0.3, 0, 0.3); c.P.add(bars);
  let words: string[] = [start], si = 0, spin = 0, cards: Mesh[] = [];
  const layout = () => {
    cards.forEach((m) => { m.removeFromParent(); m.geometry.dispose(); (m.material as MeshBasicMaterial).map?.dispose(); (m.material as Material).dispose(); }); cards = [];
    const w = words.map((s) => Math.max(0.45, Math.min(1.3, s.length * (c.lang === 'en' ? 0.075 : 0.2) + 0.2))), tot = w.reduce((a, b) => a + b + 0.06, 0);
    let x = -tot / 2; words.forEach((s, k) => { const m = sign(s, w[k]!, 0.26, '#1e1b4b', k ? '#fef3c7' : '#ede9fe'); m.position.x = x + w[k]! / 2; x += w[k]! + 0.06; row.add(m); cards.push(m); });
    row.scale.setScalar(Math.min(1, 3.2 / tot));
  };
  const showBars = () => {
    bars.clear(); const ch = stages[si]; if (!ch) return;
    ch.forEach(([w, p], k) => {
      const x = (k - (ch.length - 1) / 2) * 0.62, h = 0.05 + p / 100;
      const b = cyl(0.14, 0.14, h, toy(COL[k]!, { emissive: COL[k]!, glow: 0.3 })); b.position.set(x, h / 2, 0); bars.add(b);
      const lb = sign(`${w} ${p}%`, 0.62, 0.18, '#1e1b4b', '#ffffffd9'); lb.position.set(x, h + 0.16, 0.05); bars.add(lb);
    });
  };
  layout(); showBars();
  const roll = () => {
    const ch = stages[si];
    if (!ch) { words = [start]; si = 0; layout(); showBars(); c.say('↺'); c.poke(); return; }
    let r = Math.random() * 100, pick = ch[ch.length - 1]!;
    for (const x of ch) { if (r < x[1]) { pick = x; break; } r -= x[1]; }
    words.push(pick[0]); si++; spin = 1; layout(); showBars();
    c.say(`🎲 ${pick[0]} (${pick[1]}%) → ${words.join(c.lang === 'en' ? ' ' : '')}`);
    if (si === stages.length) { c.star(0, 1.4, -0.4); c.done(); }
    c.poke();
  };
  return {
    cam: { look: V3(0, 0.75, 0), dir: V3(0, 0.38, 1), r: 2.2 },
    marks: { dice: V3(-1.3, 0.3, 0.5), row: V3(0, 1.25, -0.4), bars: V3(0.3, 0.3, 0.3) },
    at: [V3(-1.3, 0.3, 0.5)], top: [V3(-1.3, 0.85, 0.5)], names: [c.lang === 'en' ? 'Roll' : '掷骰子'], hits: [dice],
    pick: () => roll(),
    busy: () => spin > 0,
    tick(dt) { if (spin > 0) { spin = Math.max(0, spin - dt * 1.5); dice.rotation.set(spin * 9, spin * 7, 0); dice.position.y = Math.sin(spin * Math.PI) * 0.4; } },
  };
});

/** nn: three inputs (rain, clouds, wind) feed a neuron; turn up rain's weight until the sum lights the bulb */
export const nn: Mk = (box, api, o) => lab(box, api, o, (c) => {
  const ins = ((o.opt.in as string[]) ?? []).map(c.t), out = c.t(o.opt.out), X = [1, 1, 0], W0 = [0, 0.3, 0.2], TH = 1;
  const N = V3(0.35, 0.75, 0), BULB = V3(1.35, 0.5, 0);
  const pos = ins.map((_, k) => V3(-1.3, 0.35 + (2 - k) * 0.45, 0));
  const nodes = ins.map((s, k) => {
    const m = sph(0.13, X[k] ? lit(COL[k]!, 0.7) : toy('#cbd5e1')); m.position.copy(pos[k]!); c.P.add(m);
    const lb = sign(`${s} = ${X[k]}`, 0.7, 0.18, '#1e1b4b', '#ffffffd9'); lb.position.set(pos[k]!.x - 0.05, pos[k]!.y + 0.22, 0.05); c.P.add(lb);
    return m;
  });
  const wires = pos.map((p) => { const w = cyl(0.01, 0.01, 1, toy('#a78bfa', { emissive: '#a78bfa', glow: 0.4 }), 8); const d = N.clone().sub(p); w.position.copy(p).addScaledVector(d, 0.5); w.scale.y = d.length(); w.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); c.P.add(w); return w; });
  const cell = sph(0.22, glassP('#ede9fe', { thick: 0.6, att: '#a78bfa', dist: 0.6 })); cell.position.copy(N); c.P.add(cell);
  const sum = sign('Σ', 0.5, 0.2, '#4c1d95'); sum.position.set(N.x, N.y, 0.25); c.P.add(sum);
  c.P.add(lineTo(N, BULB, '#a78bfa'));
  const bulb = prop('bulb'); bulb.scale.setScalar(0.7); bulb.position.copy(BULB).setY(0.12); shade(bulb); c.P.add(bulb);
  const bg = glow('#fde68a', 1.6, 0); bg.position.copy(BULB).setY(0.55); c.P.add(bg);
  const ol = sign(out, 0.9, 0.2, '#1e1b4b', '#ffffffd9'); ol.position.set(BULB.x, 1.15, 0.05); c.P.add(ol);
  let w0 = 0, on = false;
  const set = (w: number) => {
    w0 = w; const W = [w, W0[1]!, W0[2]!], s = X.reduce((a, x, k) => a + x * W[k]!, 0);
    wires.forEach((m, k) => (m.scale.x = m.scale.z = 1 + W[k]! * 7));
    const now = s >= TH; bg.material.opacity = now ? 0.8 : 0.05;
    c.say(`${ins.map((_, k) => `${X[k]}×${W[k]!.toFixed(1)}`).join(' + ')} = ${s.toFixed(1)} ${now ? '≥' : '<'} ${TH} · ${now ? `💡 ${out}!` : c.lang === 'en' ? 'not yet' : '还不够'}`);
    if (now && !on) { c.star(BULB.x, 0.8, 0); c.done(); } on = now; c.poke();
  };
  set(0);
  return {
    cam: { look: V3(0, 0.7, 0), dir: V3(0, 0.25, 1), r: 2.0 },
    marks: { in: pos[0]!.clone(), n: N.clone(), bulb: BULB.clone() },
    at: nodes.map((n) => n.position.clone()), top: nodes.map((n) => n.position.clone().setY(n.position.y + 0.4)), names: [], hits: [...nodes, bulb],
    slider: { min: 0, max: 1, val: 0, step: 0.1, label: c.lang === 'en' ? `Weight of ${ins[0]}` : `${ins[0]}的重要程度` },
    input: (v) => set(Math.round(v * 10) / 10),
    pick: (k) => { if (k === 0) set(Math.min(1, Math.round((w0 + 0.1) * 10) / 10)); else c.say(c.t('拖动滑块调“下雨”的重要程度。|Drag the slider to set how much rain matters.')); },
    tick() { cell.rotation.y += 0.01; },
  };
});

/** moe: tap a word; a gatekeeper sends it along glowing paths to its two experts */
export const moe: Mk = (box, api, o) => lab(box, api, o, (c) => {
  const tok = ((o.opt.tok as string[]) ?? []).map(c.t), ex = ((o.opt.ex as string[]) ?? []).map(c.t), route = (o.opt.route as [number, number][]) ?? [];
  const TP = tok.map((_, k) => V3(-1.45, 0.3, (k - 1) * 0.55)), GATE = V3(-0.35, 0.3, 0);
  const EP = ex.map((_, k) => { const a = (k - 2.5) * 0.36; return V3(0.55 + Math.cos(a) * 0.9, 0, Math.sin(a) * 1.25); });
  const toks = tok.map((s, k) => {
    const g = new Group(); g.position.copy(TP[k]!); c.P.add(g);
    add(g, rbox(0.36, 0.36, 0.36, 0.06, glassP(COL[k]!, { thick: 0.6, att: COL[k]!, dist: 0.6 })));
    const lb = sign(s, 0.7, 0.18, '#1e1b4b', '#ffffffd9'); lb.position.set(0, 0.32, 0.05); g.add(lb); return g;
  });
  const gate = prop('shield'); gate.scale.setScalar(0.55); gate.position.copy(GATE).setY(0); shade(gate); c.P.add(gate);
  const exs = ex.map((s, k) => {
    const g = new Group(); g.position.copy(EP[k]!); c.P.add(g); add(g, pedestal(0.22, 0.24, '#ede9fe'));
    const h = sph(0.1, toy('#e5e7eb')); h.position.y = 0.33; g.add(h);
    const lb = sign(s, 0.6, 0.17, '#1e1b4b', '#ffffffd9'); lb.position.set(0, 0.6, 0.05); g.add(lb);
    const gl = glow(COL[k]!, 0.9, 0); gl.position.y = 0.35; g.add(gl); return { g, h, gl };
  });
  const balls = [0, 1].map(() => { const b = sph(0.06, lit(C.org, 0.7)); b.visible = false; c.P.add(b); return b; });
  let cur = -1, t = 1; const seen = new Set<number>();
  return {
    cam: { look: V3(0, 0.3, 0), dir: V3(0, 0.75, 1), r: 2.3 },
    marks: { tok: TP[0]!.clone().setY(0.35), gate: GATE.clone().setY(0.45), ex: EP[0]!.clone().setY(0.4) },
    at: TP.map((p) => p.clone()), top: TP.map((p) => p.clone().setY(0.9)), names: [], hits: toks,
    pick(k) {
      if (k < 0 || k >= tok.length) return; cur = k; t = 0; seen.add(k);
      exs.forEach((e, j) => { const on = route[k]!.includes(j); e.gl.material.opacity = on ? 0.7 : 0; (e.h.material as Material).dispose(); e.h.material = on ? lit(COL[j]!, 0.8) : toy('#e5e7eb'); });
      c.say(`${tok[k]} → 🛡️ → ${route[k]!.map((j) => ex[j]).join(' + ')} · ${c.lang === 'en' ? 'the other experts rest 😴' : '其他专家休息 😴'}`);
      if (seen.size === tok.length) c.done(); c.poke();
    },
    busy: () => t < 1,
    tick(dt) {
      if (cur < 0) return; t = Math.min(1, t + dt * 0.9);
      balls.forEach((b, n) => {
        b.visible = t < 1; const e = EP[route[cur]![n]!]!.clone().setY(0.35);
        if (t < 0.5) b.position.lerpVectors(TP[cur]!, GATE.clone().setY(0.45), t * 2); else b.position.lerpVectors(GATE.clone().setY(0.45), e, (t - 0.5) * 2);
      });
      gate.rotation.y = Math.sin(t * Math.PI * 2) * 0.3;
    },
  };
});

/** patch: a 4×4 tile picture on an easel; tap it and the tiles fly out into a numbered row (and back) */
export const patch: Mk = (box, api, o) => lab(box, api, o, (c) => {
  const S = 4, sz = 0.26, pic = new Group(); pic.position.set(0, 0.95, -0.4); c.P.add(pic);
  const frame = rbox(S * sz + 0.16, S * sz + 0.16, 0.06, 0.04, toy('#c4a484', { rough: 0.6 })); frame.position.set(0, 0.95, -0.46); c.P.add(frame);
  const leg = cyl(0.03, 0.03, 0.9, toy('#a16207'), 8); leg.position.set(0, 0.45, -0.5); c.P.add(leg);
  /* a little picture made of coloured tiles: sky, a sun, a house, grass */
  const colOf = (r: number, q: number) => r === 3 ? '#4ade80' : r === 0 && q === 3 ? '#facc15' : (r === 1 && (q === 1 || q === 2)) ? '#ef4444' : (r === 2 && (q === 1 || q === 2)) ? (q === 1 ? '#fde68a' : '#a16207') : '#93c5fd';
  const tiles = Array.from({ length: S * S }, (_, k) => {
    const r = Math.floor(k / S), q = k % S, m = rbox(sz - 0.02, sz - 0.02, 0.05, 0.02, toy(colOf(r, q), { rough: 0.4 }));
    const home = V3((q - 1.5) * sz, (1.5 - r) * sz, 0), out = V3((k - 7.5) * 0.2, -0.75 + (k % 2) * 0.02, 0.7);
    m.position.copy(home); pic.add(m); return { m, home, out };
  });
  const nums = tiles.map((t, k) => { const s = sign(String(k + 1), 0.18, 0.12, '#1e1b4b'); s.position.copy(t.out).add(V3(0, 0.15, 0.03)); s.visible = false; pic.add(s); return s; });
  let open = false, t = 1;
  return {
    cam: { look: V3(0, 0.75, 0), dir: V3(0, 0.3, 1), r: 2.0 },
    marks: { pic: V3(-0.3, 1.2, -0.4), row: V3(0.9, 0.25, 0.3) },
    at: [V3(0, 0.95, -0.4)], top: [V3(0, 1.6, -0.4)], names: [], hits: [pic, frame],
    pick() {
      open = !open; t = 0; nums.forEach((n) => (n.visible = false));
      c.say(open ? c.t('16 个小方块排成一行，就像 16 个词块。|16 squares in a row, just like 16 word tokens.') : c.t('又拼回成一幅画。|Back together as a picture.'));
      if (open) c.done(); c.poke();
    },
    busy: () => t < 1,
    tick(dt) {
      if (t >= 1) return; t = Math.min(1, t + dt * 0.8);
      tiles.forEach((x, k) => { const f = Math.max(0, Math.min(1, t * 1.6 - k * 0.04)), e = f * f * (3 - 2 * f), a = open ? e : 1 - e; x.m.position.lerpVectors(x.home, x.out, a); x.m.position.z += Math.sin(a * Math.PI) * 0.4; });
      if (t >= 1 && open) nums.forEach((n) => (n.visible = true));
    },
  };
});

/** attention: the R33 v4 glass word blocks with arcs (tap a word) */
export const attn: Mk = (box, api, o) => {
  const seen = new Set<number>(); let v: View | null = null;
  const pick = (k: number) => { if (k < 0 || k > 3) return; v?.focus(k); seen.add(k); api.say?.(attnSay(k, api.lang)); if (seen.size >= 2) api.done?.(); };
  v = attnMake(box, { ...api, pick }) as View; v.set = (x) => { const p = (x as { pick?: number }).pick; if (typeof p === 'number') pick(p); };
  void o; setTimeout(() => api.say?.(attnSay(ATT.start, api.lang)), 0);
  return v;
};
/** dot product: the R33 v4 arrows; drag the pink arrow's ball, the slider sets its length */
export const dot: Mk = (box, api) => {
  let n = 0;
  const v = dotMake(box, { ...api, pick: () => {}, dot: (ax, az, bx, by) => { const d = dotInfo(ax, az, bx, by); api.say?.(`a·b = ${d.dot.toFixed(1)} · ${d.deg}° · ${d.sign > 0 ? (api.lang === 'en' ? 'same way: positive' : '同向：正数') : d.sign < 0 ? (api.lang === 'en' ? 'opposite: negative' : '反向：负数') : (api.lang === 'en' ? 'square: zero' : '垂直：零')}`); api.note?.('dot', d.dot); if (++n > 3) api.done?.(); } }) as View;
  v.slider = { min: 14, max: 34, val: 28, step: 1, label: api.lang === 'en' ? 'Length' : '长度' };
  const inp = v.input.bind(v); v.input = (x) => inp(x / 10);
  /* a tap on the arrow tip (or its label) turns it one step: the experiment works without dragging */
  const turn = (v as unknown as { turn?(d: number): void }).turn;
  v.set = (x) => { if (typeof (x as { pick?: number }).pick === 'number') turn?.(35); };
  v.focus(0, true); return v;
};
export { TorusGeometry, MeshBasicMaterial };
