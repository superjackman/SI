/* R34: the maths experiments, drawn as geometry in three.js: a ball rolling down a valley curve with a step-size slider
   (valley), a ball dragged along a curve with its tangent (slope), a grid sheared by a matrix with its two arrows (grid),
   two dice and a histogram of their sums (dice) and stepping stones that pass a number forward and the error back (steps). */
import { BufferAttribute, BufferGeometry, CatmullRomCurve3, Group, LineBasicMaterial, LineSegments, Mesh, TubeGeometry } from 'three';
import { glow, toy } from '../../three3d/p3/look';
import { cyl, lit, pedestal, prop, sign, sph, C } from '../sc/kit';
import { rayPick, shade, V3, type View, type WApi } from '../sc/world';
import { lab, type LabOpt, type Ctx } from './lab';

type Mk = (box: HTMLElement, api: WApi, o: LabOpt) => View;
const K = 0.32, XM = 2.0, Y0 = 0.25;
const fy = (x: number) => Y0 + K * x * x;
function curve(c: Ctx, color: string) {
  const pts = Array.from({ length: 41 }, (_, k) => { const x = -XM + (k / 40) * XM * 2; return V3(x, fy(x), 0); });
  const m = new Mesh(new TubeGeometry(new CatmullRomCurve3(pts), 120, 0.03, 10), toy(color, { emissive: color, glow: 0.35 })); c.P.add(m);
  const base = cyl(0.02, 0.02, XM * 2, toy('#cbd5e1'), 6); base.rotation.z = Math.PI / 2; base.position.y = Y0 - 0.02; c.P.add(base);
  const bot = sign('0', 0.2, 0.14, '#334155'); bot.position.set(0, Y0 - 0.14, 0.05); c.P.add(bot);
  return m;
}

/** valley: choose a step size (the learning rate), tap to step downhill: x ← x − rate × slope */
export const valley: Mk = (box, api, o) => lab(box, api, o, (c) => {
  const v = curve(c, o.color), ball = sph(0.1, lit(C.org, 0.5)); c.P.add(ball); shade(ball);
  const trail = new Group(); c.P.add(trail);
  let x = -1.7, lr = 0.3, n = 0, t = 1, fromX = x;
  const reset = () => { x = fromX = -1.7; n = 0; trail.clear(); t = 1; };
  const put = (xx: number) => ball.position.set(xx, fy(xx) + 0.1, 0);
  put(x);
  return {
    cam: { look: V3(0, 0.85, 0), dir: V3(0, 0.15, 1), r: 2.2 },
    marks: { ball: ball.position, bot: V3(0, 0.27, 0), left: V3(-1.7, 0.25 + 0.32 * 2.89, 0) },
    at: [ball.position], top: [V3(0, 1.8, 0)], names: [], hits: [ball, v],
    slider: { min: 0.1, max: 2.2, val: 0.3, step: 0.1, label: c.lang === 'en' ? 'Step size' : '步子大小' },
    input: (val) => { lr = Math.round(val * 10) / 10; reset(); put(x); c.say(`${c.lang === 'en' ? 'Step size' : '步子'} = ${lr.toFixed(1)}`); c.poke(); },
    pick() {
      if (Math.abs(x) > 3 || n >= 12) { reset(); put(x); c.say('↺'); c.poke(); return; }
      const g = 2 * K * x; fromX = x; x = x - lr * g * 1.5625; n++; t = 0;
      const dot = sph(0.03, toy('#a78bfa')); dot.position.set(fromX, fy(fromX) + 0.1, 0); trail.add(dot);
      const near = Math.abs(x) < 0.12, out = Math.abs(x) > XM;
      c.say(`${c.lang === 'en' ? 'Step' : '第'} ${n}${c.lang === 'en' ? '' : ' 步'} · x = ${x.toFixed(2)} ${near ? (c.lang === 'en' ? '🎉 at the bottom!' : '🎉 到谷底了！') : out ? (c.lang === 'en' ? '💥 flew out! Try a smaller step.' : '💥 飞出去了！换小一点的步子。') : Math.sign(x) !== Math.sign(fromX) ? (c.lang === 'en' ? '↔ jumped over the bottom' : '↔ 跳过了谷底') : ''}`);
      if (near) { c.star(0, Y0 + 0.4, 0); c.done(); }
      c.poke();
    },
    busy: () => t < 1,
    tick(dt) { if (t < 1) { t = Math.min(1, t + dt * 2.5); const xx = fromX + (x - fromX) * t; ball.position.set(Math.max(-3, Math.min(3, xx)), fy(Math.max(-3, Math.min(3, xx))) + 0.1 + Math.sin(t * Math.PI) * 0.25, 0); } },
  };
});

/** slope: drag the ball along the curve; the tangent bar follows and the steepness is read out */
export const slope: Mk = (box, api, o) => lab(box, api, o, (c) => {
  const v = curve(c, o.color), ball = sph(0.11, lit(C.org, 0.5)); c.P.add(ball); shade(ball);
  const tan = cyl(0.018, 0.018, 1.4, toy('#ec4899', { emissive: '#ec4899', glow: 0.5 }), 8); c.P.add(tan);
  let x = -1.4, held = false, flat = false;
  const put = (xx: number) => {
    x = Math.max(-XM, Math.min(XM, xx)); const s = 2 * K * x;
    ball.position.set(x, fy(x) + 0.11, 0); tan.position.set(x, fy(x), 0.02); tan.rotation.z = Math.atan(s) - Math.PI / 2;
    c.say(`x = ${x.toFixed(1)} · ${c.lang === 'en' ? 'steepness' : '陡度'} = ${s.toFixed(2)} ${Math.abs(s) < 0.05 ? (c.lang === 'en' ? '— flat: the bottom!' : '— 平的：谷底！') : s < 0 ? '↘' : '↗'}`);
    if (Math.abs(s) < 0.05 && !flat) { flat = true; c.star(0, Y0 + 0.4, 0); c.done(); }
    c.poke();
  };
  put(x);
  return {
    cam: { look: V3(0, 0.85, 0), dir: V3(0, 0.15, 1), r: 2.2 },
    marks: { ball: ball.position, bot: V3(0, 0.27, 0) },
    at: [ball.position], top: [V3(0, 1.8, 0)], names: [], hits: [ball, v],
    hold(px, py) { held = rayPick(c.st, [ball, v], px, py) >= 0; return held; },
    drag(px, py) { if (!held) return; const r = c.st.canvas.getBoundingClientRect(); const p = V3((px / r.width) * 2 - 1, -(py / r.height) * 2 + 1, 0.5).unproject(c.st.cam); const d = p.sub(c.st.cam.position).normalize(); const k = -c.st.cam.position.z / d.z; put(c.st.cam.position.x + d.x * k); },
    drop() { held = false; },
    pick() { put(x + (x < 0 ? 0.35 : -0.35)); },
  };
});

/** grid: a 7×7 grid in an upright plane; the slider shears it by the matrix [1 k; 0 1]; red (1,0) and green (0,1) arrows */
export const grid: Mk = (box, api, o) => lab(box, api, o, (c) => {
  const N = 3, s = 0.28, g = new Group(); g.position.set(0, 1.0, -0.2); c.P.add(g);
  const pos = new Float32Array((2 * N + 1) * 2 * 2 * 3), geo = new BufferGeometry(); geo.setAttribute('position', new BufferAttribute(pos, 3));
  const lines = new LineSegments(geo, new LineBasicMaterial({ color: '#7c3aed', transparent: true, opacity: 0.7 })); g.add(lines);
  const ghost = new LineSegments(geo.clone(), new LineBasicMaterial({ color: '#cbd5e1', transparent: true, opacity: 0.6 })); g.add(ghost);
  const arrow = (color: string) => { const a = new Group(); const sh = cyl(0.025, 0.025, 1, lit(color, 0.5), 8); sh.position.y = 0.5; a.add(sh); const tip = cyl(0, 0.07, 0.16, lit(color, 0.6), 12); tip.position.y = 1; a.add(tip); g.add(a); return a; };
  const red = arrow(C.red), grn = arrow(C.grn);
  let k = 0, moved = false;
  const fill = (arr: Float32Array, kk: number) => {
    let i = 0; const P = (x: number, y: number) => { arr[i++] = (x + kk * y) * s; arr[i++] = y * s; arr[i++] = 0; };
    for (let j = -N; j <= N; j++) { P(-N, j); P(N, j); P(j, -N); P(j, N); }
  };
  const aim = (a: Group, x: number, y: number) => { const L = Math.hypot(x, y) * s; a.scale.set(1, L, 1); a.children.forEach((m) => { if (m !== a.children[0]) m.scale.set(1, 1 / L, 1); }); a.rotation.z = Math.atan2(-x, y); };
  const set = (kk: number) => {
    k = kk; fill(pos, k); geo.attributes.position!.needsUpdate = true; aim(red, 1, 0); aim(grn, k, 1);
    c.say(`[1 ${k.toFixed(1)}; 0 1] · ${c.lang === 'en' ? 'red' : '红'} (1,0) → (1,0) · ${c.lang === 'en' ? 'green' : '绿'} (0,1) → (${k.toFixed(1)},1)`);
    if (moved && Math.abs(k) >= 0.5) c.done(); moved = true; c.poke();
  };
  fill(ghost.geometry.attributes.position!.array as Float32Array, 0); set(0);
  return {
    cam: { look: V3(0, 1.0, 0), dir: V3(0, 0.1, 1), r: 2.1 },
    marks: { red: V3(0.28, 1.0, -0.2), grn: V3(0, 1.28, -0.2), grid: V3(-0.56, 0.72, -0.2) },
    at: [V3(0, 1, -0.2)], top: [V3(0, 2, -0.2)], names: [], hits: [g],
    slider: { min: -1, max: 1, val: 0, step: 0.1, label: c.lang === 'en' ? 'Slant k' : '斜度 k' },
    input: (v) => set(Math.round(v * 10) / 10),
    pick: () => set(k >= 1 ? -1 : Math.round((k + 0.5) * 10) / 10),
  };
});

/** dice: two dice roll; a bar for each sum 2..12 grows; 7 wins over time */
export const dice: Mk = (box, api, o) => lab(box, api, o, (c) => {
  const d = [prop('dice'), prop('dice')]; d.forEach((m, k) => { m.scale.setScalar(0.45); m.position.set(-1.6 + k * 0.6, 0, 0.6); shade(m); c.P.add(m); });
  const H = new Array(13).fill(0) as number[];
  const bars = Array.from({ length: 11 }, (_, k) => {
    const x = (k - 5) * 0.26, b = cyl(0.09, 0.09, 1, toy(k === 5 ? '#f59e0b' : '#a78bfa', { emissive: k === 5 ? '#f59e0b' : '#a78bfa', glow: 0.25 }), 16);
    b.position.set(x + 0.4, 0, -0.3); b.scale.y = 0.001; c.P.add(b);
    const s = sign(String(k + 2), 0.2, 0.13, '#334155'); s.position.set(x + 0.4, 0.06, -0.14); c.P.add(s); return b;
  });
  let n = 0, spin = 0;
  return {
    cam: { look: V3(-0.1, 0.5, 0.1), dir: V3(0, 0.45, 1), r: 2.1 },
    marks: { dice: V3(-1.3, 0.3, 0.6), b7: V3(0.4, 0.25, -0.3), b2: V3(-0.9, 0.15, -0.3) },
    at: d.map((m) => m.position.clone().setY(0.25)), top: d.map((m) => m.position.clone().setY(0.7)), names: [c.lang === 'en' ? 'Roll' : '掷', ''], hits: d,
    pick() {
      for (let r = 0; r < (n >= 10 ? 10 : 1); r++) { const a = 1 + Math.floor(Math.random() * 6), b = 1 + Math.floor(Math.random() * 6); H[a + b]!++; n++; if (r === 0) c.say(`🎲 ${a} + ${b} = ${a + b} · ${c.lang === 'en' ? 'rolls' : '次数'} ${n}${n >= 10 ? (c.lang === 'en' ? ' (now 10 at a time)' : '（现在一次扔 10 下）') : ''}`); }
      const mx = Math.max(...H); bars.forEach((b, k) => { b.scale.y = Math.max(0.001, (H[k + 2]! / Math.max(mx, 4)) * 1.1); b.position.y = b.scale.y / 2; });
      spin = 1; if (n >= 20) c.done(); c.poke();
    },
    busy: () => spin > 0,
    tick(dt) { if (spin > 0) { spin = Math.max(0, spin - dt * 2); d.forEach((m, k) => { m.rotation.set(spin * (8 + k), spin * (6 - k), 0); m.position.y = Math.sin(spin * Math.PI) * 0.3; }); } },
  };
});

/** steps: four stones; Forward sends a number across (×2, ×3, ×0.5), Back sends the error home multiplying the slopes */
export const steps: Mk = (box, api, o) => lab(box, api, o, (c) => {
  const M = [2, 3, 0.5], X = [-1.35, -0.45, 0.45, 1.35];
  X.forEach((x, k) => { const p = pedestal(0.2, 0.28, ['#ddd6fe', '#bfdbfe', '#bbf7d0', '#fde68a'][k]); p.position.set(x, 0, 0); c.P.add(p); });
  M.forEach((m, k) => { const s = sign(`×${m}`, 0.4, 0.18, '#7c3aed', '#ffffffd9'); s.position.set((X[k]! + X[k + 1]!) / 2, 0.45, 0.1); c.P.add(s); });
  const ball = sph(0.1, lit(C.org, 0.5)); ball.position.set(X[0]!, 0.32, 0); c.P.add(ball); shade(ball);
  const val = sign('1', 0.4, 0.2, '#1e1b4b', '#fef3c7'); c.P.add(val);
  const fwd = sign(c.lang === 'en' ? 'Forward ▶' : '往前 ▶', 0.7, 0.24, '#ffffff', '#8b5cf6'), back = sign(c.lang === 'en' ? '◀ Back' : '◀ 往回', 0.7, 0.24, '#ffffff', '#ec4899');
  fwd.position.set(0.5, 1.2, 0.2); back.position.set(-0.5, 1.2, 0.2); c.P.add(fwd, back);
  const gl = glow('#fde68a', 0.8, 0.5); c.P.add(gl);
  let i = 0, dir = 0, t = 1, v = 1, from = 0, went = false;
  const show = (s: string) => { (val.material as unknown as { map: { dispose(): void } | null }).map?.dispose(); const n = sign(s, 0.4, 0.2, '#1e1b4b', dir < 0 ? '#fce7f3' : '#fef3c7'); val.geometry.dispose(); val.geometry = n.geometry; val.material = n.material; };
  show('1');
  const go = (d: number) => {
    t = 1; // a quick second tap finishes the last hop at once (slow devices tick rarely)
    if (d > 0) { if (i >= 3 || dir < 0) { i = 0; v = 1; dir = 1; show('1'); } from = i; i++; v *= M[i - 1]!; dir = 1; c.say(`${c.lang === 'en' ? 'Forward' : '往前'}: ${v}`); if (i === 3) { went = true; c.say(`${c.lang === 'en' ? 'Answer' : '答案'} = ${v} · ${c.lang === 'en' ? 'now tap Back' : '现在点“往回”'}`); } }
    else { if (!went) { c.say(c.t('先往前走到最后一块。|Go forward to the last stone first.')); return; } if (dir > 0) { v = 1; dir = -1; i = 3; } if (i <= 0) return; from = i; i--; v *= M[i]!; c.say(`${c.lang === 'en' ? 'Error back' : '误差传回'}: ${M.slice(i).join(' × ')} = ${v}`); if (i === 0) { c.star(X[0]!, 0.7, 0); c.done(); } }
    show(String(v)); t = 0; c.poke();
  };
  return {
    cam: { look: V3(0, 0.6, 0), dir: V3(0, 0.3, 1), r: 2.1 },
    marks: { fwd: V3(0.5, 1.2, 0.2), back: V3(-0.5, 1.2, 0.2), s0: V3(X[0]!, 0.35, 0), m0: V3((X[0]! + X[1]!) / 2, 0.45, 0.1) },
    at: [V3(0.5, 1.2, 0.2), V3(-0.5, 1.2, 0.2)], top: [V3(0.5, 1.5, 0.2), V3(-0.5, 1.5, 0.2)], names: [], hits: [fwd, back],
    pick: (k) => go(k === 1 ? -1 : 1),
    busy: () => t < 1,
    tick(dt) {
      if (t < 1) t = Math.min(1, t + dt * 2.2);
      const x = X[from]! + (X[i]! - X[from]!) * t * t * (3 - 2 * t); ball.position.set(x, 0.32 + Math.sin(t * Math.PI) * 0.3, 0);
      val.position.set(ball.position.x, ball.position.y + 0.3, 0.05); gl.position.copy(ball.position); gl.material.color.set(dir < 0 ? '#f9a8d4' : '#fde68a');
    },
  };
});
