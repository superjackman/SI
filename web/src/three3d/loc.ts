/* R31 scene (Loc): will the model fit in memory. Left, a silver PC case with its glass side open to view (board,
   graphics card, memory sticks, cooler, fans); right, a tall clear glass capsule on a metal base whose rim is the
   16 GB of memory, with tick marks every 4 GB. The model's weights are stacked in as big coloured blocks, the chat
   history (KV cache + running overhead) as small grey blocks with a speech bubble. If the stack passes the rim it does
   not fit (the part above turns red). In front, a green / yellow / red bar with a marker at need ÷ 16 GB. The numbers
   are the memory calculator's (w3d2.locFit). On a change the blocks drop in one after another (≤0.8 s), then stop. */
import { Group, Mesh, SphereGeometry, type Material } from 'three';
import { satin, stage } from './core';
import { ball, cyl, face, freeObj, glass, glowDisc, glowMat, gloss, iconTex, metal, paint, plinth, rb, ring, rig, rr, std } from './kit';
import { gb, locFit, LOC_HAVE } from '../m2/w3d2';
import type { Quant } from '../m2/calc';
import type { View } from '../m2/s3d';

export interface LocApi { lang: 'zh' | 'en'; raf: (f: FrameRequestCallback) => number; caf: (id: number) => void; get(): { p: number; q: Quant } }
const H = 3.2, R = 0.8, CX = 0.78, CZ = 0.45, S = H / LOC_HAVE, CAP = 1.14, BAR = 3.6, BMAX = 1.3, DUR = 0.8;
const COLS = ['#34d399', '#2dd4bf', '#60a5fa', '#818cf8', '#a78bfa', '#c084fc'];

/** a fan seen face-on: a dark hub and 7 swept blades in a frame (transparent outside) */
const fanTex = (c: string) => paint(128, 128, (g) => {
  g.translate(64, 64); g.fillStyle = '#20223a'; g.beginPath(); g.arc(0, 0, 60, 0, 7); g.fill();
  g.fillStyle = c; for (let i = 0; i < 7; i++) { g.rotate((Math.PI * 2) / 7); g.beginPath(); g.moveTo(10, -6); g.quadraticCurveTo(44, -30, 56, 2); g.quadraticCurveTo(36, -2, 10, 8); g.fill(); }
  g.fillStyle = '#3a3d5c'; g.beginPath(); g.arc(0, 0, 15, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(-4, -4, 5, 0, 7); g.fill();
});
/** where the stack tops out (GB → stage units): weights wH then chat gH; squeezed (k < 1) when it would not stay on stage.
    The top is above the rim H exactly when the calculator says it does not fit (need > have). */
export function locStack(w: number, g: number) {
  const need = w + g, k = need > LOC_HAVE * CAP ? (LOC_HAVE * CAP) / need : 1;
  const gH = Math.max(k < 1 ? 0.4 : 0, g * S * k), wH = k < 1 ? H * CAP - gH : w * S;
  return { k, wH, gH, top: wH + gH };
}

export function make(box: HTMLElement, api: LocApi): View {
  const en = api.lang === 'en', T = (zh: string, e: string) => (en ? e : zh);
  let t = DUR;
  const st = stage(box, {
    raf: api.raf, caf: api.caf, cam: [0, 3.5, 9.4], look: [-0.05, 1.65, 0.4], fit: 2.25, yaw: 0,
    busy: () => t < DUR, tick: (dt) => { if (t < DUR) { t = Math.min(DUR, t + dt); drop(); } },
  });
  rig(st);
  const P = st.pivot;
  /* the PC: a silver case, front bezel with fans on the left, the glass side towards us showing the inside */
  const pc = new Group(); pc.position.set(-0.95, 0, -0.55); pc.rotation.y = 0.5; P.add(pc);
  pc.add(plinth(st, 2.6, 1.9, 0.1, '#e6defc', 0));
  const brush = paint(128, 256, (g, w, h) => { // brushed aluminium: a soft light band plus fine streaks
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#aeb3c6'); gr.addColorStop(0.35, '#f4f5fa'); gr.addColorStop(0.55, '#dfe2ec'); gr.addColorStop(1, '#9fa5bb');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${i % 2 ? '255,255,255' : '90,96,120'},${0.05 + (i % 5) * 0.02})`; g.fillRect(0, (i * 37) % h, w, 1); }
  });
  const sil = std('#ffffff', 0.3, 0.18, { map: brush }), dark = gloss('#1f2133'), W = 2.2, D = 1.4, HH = 3.2;
  pc.add(rb(W, 0.14, D, 0.06, sil, 0, HH - 0.07, 0), rb(W, 0.16, D, 0.06, sil, 0, 0.08, 0));
  pc.add(rb(0.16, HH, D, 0.06, sil, -W / 2 + 0.08, HH / 2, 0), rb(0.12, HH, D, 0.05, sil, W / 2 - 0.06, HH / 2, 0));
  pc.add(rb(W - 0.1, HH - 0.1, 0.06, 0.03, dark, 0, HH / 2, -D / 2 + 0.03));
  /* front bezel fans (seen on the left face) */
  for (const y of [2.35, 1.5]) { const f = ring(0.34, 0.05, satin('#a78bfa', { emissive: '#8b5cf6', glow: 0.9 })); f.position.set(-W / 2 - 0.01, y, 0); f.rotation.y = Math.PI / 2; const b = face(0.62, 0.62, fanTex('#9a8fe0'), true, -W / 2 - 0.02, y, 0); b.rotation.y = -Math.PI / 2; pc.add(f, b); }
  pc.add(ball(0.05, satin('#22c55e', { emissive: '#22c55e', glow: 1 }), -W / 2 - 0.01, 2.95, 0.45));
  /* the inside: board with traces, cooler, memory sticks, graphics card with two fans, power supply under a shroud */
  const board = paint(256, 320, (g, w, h) => {
    g.fillStyle = '#1c2a3a'; g.fillRect(0, 0, w, h); g.fillStyle = '#22384a'; rr(g, 6, 6, w - 12, h - 12, 8); g.fill(); // PCB, two layers
    g.strokeStyle = 'rgba(214,170,90,.35)'; g.lineWidth = 2;
    for (let i = 0; i < 16; i++) { g.beginPath(); const y = 20 + i * 18; g.moveTo(12, y); g.lineTo(50 + (i * 37) % 110, y); g.lineTo(70 + (i * 37) % 110, y + 9); g.lineTo(w - 12, y + 9); g.stroke(); }
    g.fillStyle = '#9aa3bd'; rr(g, 26, 36, 92, 92, 6); g.fill(); g.fillStyle = '#c9cfdf'; rr(g, 40, 50, 64, 64, 4); g.fill(); // socket
    for (let i = 0; i < 4; i++) { g.fillStyle = '#10131f'; rr(g, 150 + i * 22, 24, 12, 130, 3); g.fill(); g.fillStyle = '#e5e7f0'; g.fillRect(149 + i * 22, 22, 14, 6); g.fillRect(149 + i * 22, 150, 14, 6); } // memory slots
    for (const y of [190, 236, 282]) { g.fillStyle = '#10131f'; rr(g, 30, y, 196, 12, 3); g.fill(); g.fillStyle = '#c9cfdf'; g.fillRect(30, y + 4, 10, 4); } // card slots
    for (let i = 0; i < 9; i++) { g.fillStyle = i % 3 ? '#3f4a66' : '#c084fc'; g.beginPath(); g.arc(20 + i * 12, 150, 4, 0, 7); g.fill(); } // capacitors
    g.fillStyle = '#2c3350'; rr(g, 130, 166, 40, 18, 3); g.fill(); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.5; g.strokeRect(22, 32, 100, 100); g.strokeRect(144, 18, 92, 142);
  });
  pc.add(face(1.7, 2.3, board, true, -0.05, 1.85, -D / 2 + 0.07));
  const cool = new Group(); cool.position.set(-0.35, 2.25, -0.38); pc.add(cool);
  const fin = metal('#c3c8da');
  for (let i = 0; i < 9; i++) cool.add(rb(0.03, 0.66, 0.34, 0.01, fin, -0.3 + i * 0.075, 0, 0)); // heatsink fins
  cool.add(rb(0.68, 0.05, 0.36, 0.02, metal('#8e94ad'), 0, 0.34, 0));
  for (const x of [-0.12, 0.12]) cool.add(cyl(0.025, 0.025, 0.7, metal('#d6a25a'), x, 0, -0.1)); // heat pipes
  const cf = ring(0.26, 0.035, satin('#c4b5fd', { emissive: '#a78bfa', glow: 0.9 })); cf.position.z = 0.2; cool.add(cf, face(0.5, 0.5, fanTex('#8f86c9'), true, 0, 0, 0.19));
  for (let i = 0; i < 4; i++) pc.add(rb(0.07, 0.75, 0.2, 0.02, gloss(i % 2 ? '#7c3aed' : '#6366f1', { emissive: '#7c3aed', glow: 0.35 }), 0.18 + i * 0.13, 2.25, -0.5));
  const gpu = new Group(); gpu.position.set(-0.05, 1.3, -0.22); pc.add(gpu);
  gpu.add(rb(1.62, 0.72, 0.36, 0.08, gloss('#2d3047'), 0, 0, 0), rb(1.58, 0.06, 0.3, 0.02, sil, 0, 0.38, 0));
  gpu.add(rb(1.5, 0.04, 0.06, 0.02, satin('#a78bfa', { emissive: '#8b5cf6', glow: 0.8 }), 0, -0.33, 0.17)); // light strip
  for (const x of [-0.4, 0.4]) { const f = ring(0.3, 0.035, sil); f.position.set(x, 0.02, 0.2); gpu.add(f, face(0.58, 0.58, fanTex('#7b82a8'), true, x, 0.02, 0.185), cyl(0.07, 0.07, 0.03, gloss('#cfd3e3'), x, 0.02, 0.2)); (gpu.children.at(-1) as Mesh).rotation.x = Math.PI / 2; }
  pc.add(rb(W - 0.3, 0.55, D - 0.25, 0.06, gloss('#2a2d42'), 0, 0.45, -0.05));
  pc.add(rb(0.6, 0.3, 0.05, 0.03, metal('#8f95ad'), 0.55, 0.45, D / 2 - 0.12));
  const rearF = ring(0.3, 0.04, satin('#a78bfa', { emissive: '#8b5cf6', glow: 0.7 })); rearF.rotation.y = Math.PI / 2; rearF.position.set(W / 2 - 0.14, 2.3, -0.05); const rb2 = face(0.56, 0.56, fanTex('#9a8fe0'), true, W / 2 - 0.15, 2.3, -0.05); rb2.rotation.y = -Math.PI / 2; pc.add(rearF, rb2);
  const gp = rb(W - 0.22, HH - 0.2, 0.04, 0.03, glass('#dfe6ff', 0.16), 0, HH / 2, D / 2 - 0.02); gp.renderOrder = 4; pc.add(gp);
  pc.add(rb(W - 0.18, 0.06, 0.06, 0.03, sil, 0, HH - 0.12, D / 2 - 0.02));
  /* the capsule = 16 GB of memory: metal base and cap ring, clear glass wall and dome, tick marks every 4 GB */
  const cap = new Group(); cap.position.set(CX, 0, CZ); P.add(cap);
  cap.add(glowDisc(1.5, 'rgba(167,139,250,.55)', 0.6), st.blob(1.15, 0.28));
  cap.add(cyl(R + 0.12, R + 0.16, 0.24, metal('#cfd3e3'), 0, 0.12, 0), cyl(R + 0.06, R + 0.06, 0.05, gloss('#a78bfa', { emissive: '#8b5cf6', glow: 0.6 }), 0, 0.25, 0));
  const jar = cyl(R, R, H, glass('#eef0ff', 0.18), 0, 0.27 + H / 2, 0, 48); jar.renderOrder = 5; cap.add(jar);
  const dome = new Mesh(new SphereGeometry(R, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), glass('#eef0ff', 0.18)); dome.scale.y = 0.45; dome.position.y = 0.27 + H; dome.renderOrder = 5; cap.add(dome);
  const rim = ring(R + 0.01, 0.04, satin('#ffffff', { emissive: '#c4b5fd', glow: 0.5 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.27 + H; cap.add(rim);
  for (let g = 4; g < LOC_HAVE; g += 4) { const tk = rb(0.2, 0.035, 0.02, 0.01, satin('#8b7cf6', { emissive: '#8b7cf6', glow: 0.4 }), -R * 0.55, 0.27 + g * S, R * 0.84); tk.rotation.y = -0.6; cap.add(tk); }
  const inner = cyl(R - 0.05, R - 0.05, H - 0.04, glass('#e4e8ff', 0.1), 0, 0.29 + H / 2, 0, 48); inner.renderOrder = 5; cap.add(inner); // the wall has a thickness
  for (const sx of [-1, 1]) { const e = rb(0.035, H - 0.08, 0.03, 0.015, glowMat('#ffffff', 0.75), sx * (R - 0.02), 0.27 + H / 2, 0.06); e.renderOrder = 6; cap.add(e); } // bright edges
  for (const [x, w, a, h] of [[R * 0.5, 0.07, 0.6, 0.82], [R * 0.3, 0.16, 0.22, 0.7], [-R * 0.62, 0.05, 0.35, 0.5]] as const) {
    const sh = rb(w, H * h, 0.02, 0.02, glowMat('#ffffff', a), x, 0.27 + H * 0.52, Math.sqrt(R * R - x * x) + 0.01); sh.rotation.y = Math.asin(x / R); sh.renderOrder = 6; cap.add(sh); } // reflection strips
  const foot = ring(R + 0.01, 0.03, satin('#ffffff', { emissive: '#ddd6fe', glow: 0.4 })); foot.rotation.x = Math.PI / 2; foot.position.y = 0.3; cap.add(foot);
  /* the fit bar */
  const bar = new Group(); bar.position.set(-0.1, 0.16, 2.1); P.add(bar);
  bar.add(rb(BAR + 0.24, 0.12, 0.6, 0.06, gloss('#ffffff'), 0, -0.1, 0));
  const x0 = -BAR / 2, at = (r: number) => x0 + (Math.min(r, BMAX) / BMAX) * BAR;
  for (const [a, b, c] of [[0, 0.8, '#22c55e'], [0.8, 1, '#facc15'], [1, BMAX, '#ef4444']] as [number, number, string][]) bar.add(rb(at(b) - at(a) - 0.05, 0.24, 0.42, 0.1, gloss(c, { emissive: c, glow: 0.18 }), (at(a) + at(b)) / 2, 0.06, 0));
  const mark = new Group(); bar.add(mark);
  mark.add(ball(0.2, gloss('#ffffff'), 0, 0.42, 0), ball(0.1, gloss('#4338ca'), 0, 0.42, 0.14), cyl(0.0, 0.1, 0.18, gloss('#ffffff'), 0, 0.22, 0));
  (mark.children[2] as Mesh).rotation.x = Math.PI;
  /* labels */
  const tHave = st.tag(T(`${LOC_HAVE} GB 内存`, `${LOC_HAVE} GB memory`), 'soft end');
  const tW = st.tag('', 'pct'), tK = st.tag('', 'soft'), tV = st.tag('', 'pct');
  tHave.at.set(CX - R - 0.08, 0.27 + H, CZ + 0.3);
  let stack: Group | null = null, blocks: { m: Group; y: number; i: number }[] = [];
  function drop() {
    for (const b of blocks) {
      const k = Math.max(0, Math.min(1, (t - b.i * 0.07) / 0.35)), e = 1 - (1 - k) * (1 - k);
      b.m.position.y = b.y + (1 - e) * 1.1; b.m.visible = k > 0;
    }
  }
  function build(anim: boolean) {
    const { p, q } = api.get(), f = locFit(p, q);
    if (stack) freeObj(stack);
    stack = new Group(); stack.position.set(CX, 0.27, CZ); P.add(stack); blocks = [];
    const { wH, gH } = locStack(f.w, f.kv + f.ov), n = Math.max(3, Math.min(6, Math.round(wH / 0.3)));
    let y = 0.02, i = 0;
    const chat = iconTex('chat', '#ffffff');
    const put = (h: number, c: string, isChat: boolean, w: number) => {
      if (y < H - 0.005 && y + h > H + 0.005) { put(H - y, c, isChat, w); put(y + h - H, c, isChat, w); return; } // split at the rim: the part above turns red
      const over = y + h / 2 > H && f.v === 'no', g = new Group();
      g.add(rb(w, Math.max(0.05, h - 0.05), w * 0.9, Math.min(0.12, h / 3), gloss(over ? '#f87171' : c, over ? { emissive: '#ef4444', glow: 0.3 } : { emissive: c, glow: 0.08 })));
      if (isChat && h > 0.18) g.add(face(Math.min(0.32, h * 0.8), Math.min(0.32, h * 0.8), chat, false, 0, 0, w * 0.45 + 0.01));
      stack!.add(g); blocks.push({ m: g, y: y + h / 2, i: i++ }); y += h;
    };
    for (let j = 0; j < n; j++) put(wH / n, COLS[Math.round((j * (COLS.length - 1)) / Math.max(1, n - 1))]!, false, 1.15);
    const wTop = y;
    const ng = Math.max(2, Math.min(4, Math.round(gH / 0.2)));
    for (let j = 0; j < ng; j++) put(gH / ng, '#b8b5c9', true, 0.9);
    if (f.v === 'no') { const g = cyl(R * 1.02, R * 1.02, 0.05, glowMat('#ef4444', 0.6), 0, H, 0); stack.add(g); }
    (rim.material as Material).dispose(); rim.material = satin(f.v === 'no' ? '#fecaca' : '#ffffff', { emissive: f.v === 'no' ? '#ef4444' : '#c4b5fd', glow: 0.6 });
    tW.set(`${T('权重', 'Weights')} ${gb(f.w)} GB`); tW.at.set(CX, 0.27 + Math.max(0.42, wTop / 2), CZ + R);
    tK.set(`💬 ${T('聊天记录', 'Chat')} ${gb(f.kv + f.ov)} GB`); tK.at.set(CX, 0.27 + Math.min(H + 0.25, Math.max(wTop + gH / 2, Math.max(0.42, wTop / 2) + 0.5)), CZ + R);
    const r = f.need / f.have;
    mark.position.x = at(r);
    tV.set(`${gb(f.need)} / ${LOC_HAVE} GB ${f.v === 'ok' ? '✅' : f.v === 'tight' ? '⚠️' : '❌'}`);
    tV.at.set(Math.max(x0 + 0.95, Math.min(-x0 - 0.95, at(r))) - 0.1, -0.1, 2.5);
    tV.el.classList.toggle('bad', f.v === 'no');
    t = anim ? 0 : DUR; drop();
  }
  build(false);
  return { update: () => { build(true); st.draw(); }, dispose: () => { stack = null; return st.dispose(); } };
}
