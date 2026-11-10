/* A real 2-4-1 network drawn as one knob per weight. Loaded only on stations 5 and 6. */
import { tx, type L } from '../l4/txt';

export interface NetP { W1: number[][]; b1: number[]; W2: number[]; b2: number }

const curveData = () => {
  const rows: [number[], number][] = [];
  for (let i = 0; i <= 8; i++) {
    const x = i / 8;
    rows.push([[x, 1], Math.max(0, Math.min(x / 0.35, (1 - x) / 0.35))]);
  }
  return rows;
};
const colorData: [number[], number][] = [[[0, 0], 0], [[1, 0], 1], [[0, 1], 1], [[1, 1], 0]];

function randOf(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
export function netInit(mode: string): NetP {
  const rand = randOf(mode === 'colors' ? 4 : 78);
  const r = () => (rand() * 2 - 1) * 0.8;
  return { W1: Array.from({ length: 4 }, () => [r(), r()]), b1: [0, 0, 0, 0], W2: Array.from({ length: 4 }, () => r()), b2: 0 };
}

const relu = (z: number) => (z > 0 ? z : 0);
function forward(p: NetP, x: number[]) {
  const pre: number[] = [], h: number[] = [];
  for (let i = 0; i < 4; i++) {
    const z = p.W1[i]![0]! * x[0]! + p.W1[i]![1]! * x[1]! + p.b1[i]!;
    pre.push(z); h.push(relu(z));
  }
  let y = p.b2;
  for (let i = 0; i < 4; i++) y += p.W2[i]! * h[i]!;
  return { y, h, pre };
}

/** One full-batch step. Returns the mean squared error after the step. */
export function netStep(mode: string, p: NetP, lr: number): number {
  const data = mode === 'colors' ? colorData : curveData();
  const gW1 = [[0, 0], [0, 0], [0, 0], [0, 0]];
  const gb1 = [0, 0, 0, 0], gW2 = [0, 0, 0, 0];
  let gb2 = 0, loss = 0;
  for (const [x, t] of data) {
    const { y, h, pre } = forward(p, x);
    const e = (y - t) * 2 / data.length;
    loss += (y - t) ** 2;
    gb2 += e;
    for (let i = 0; i < 4; i++) {
      gW2[i]! += e * h[i]!;
      const dh = e * p.W2[i]! * (pre[i]! > 0 ? 1 : 0);
      gb1[i]! += dh;
      gW1[i]![0]! += dh * x[0]!;
      gW1[i]![1]! += dh * x[1]!;
    }
  }
  for (let i = 0; i < 4; i++) {
    p.W2[i]! -= lr * gW2[i]!;
    p.b1[i]! -= lr * gb1[i]!;
    p.W1[i]![0]! -= lr * gW1[i]![0]!;
    p.W1[i]![1]! -= lr * gW1[i]![1]!;
  }
  p.b2 -= lr * gb2;
  return loss / data.length;
}

const slots = (p: NetP): { name: string; get: () => number; set: (n: number) => void }[] => {
  const out: { name: string; get: () => number; set: (n: number) => void }[] = [];
  for (let i = 0; i < 4; i++) out.push({ name: `甲${i + 1}`, get: () => p.W1[i]![0]!, set: (n) => { p.W1[i]![0] = n; } });
  for (let i = 0; i < 4; i++) out.push({ name: `乙${i + 1}`, get: () => p.W1[i]![1]!, set: (n) => { p.W1[i]![1] = n; } });
  for (let i = 0; i < 4; i++) out.push({ name: `偏${i + 1}`, get: () => p.b1[i]!, set: (n) => { p.b1[i] = n; } });
  for (let i = 0; i < 4; i++) out.push({ name: `出${i + 1}`, get: () => p.W2[i]!, set: (n) => { p.W2[i] = n; } });
  out.push({ name: '出偏', get: () => p.b2, set: (n) => { p.b2 = n; } });
  return out;
};

const lossOf = (mode: string, p: NetP) => {
  const data = mode === 'colors' ? colorData : curveData();
  return data.reduce((s, [x, t]) => s + (forward(p, x).y - t) ** 2, 0) / data.length;
};
const passed = (mode: string, p: NetP) => {
  if (mode === 'colors') return colorData.every(([x, t]) => (forward(p, x).y >= 0.5) === (t === 1));
  return lossOf(mode, p) < 0.02;
};

export function mount(host: HTMLElement, mode: string, l: L) {
  const m = mode === 'colors' ? 'colors' : 'curve';
  const z = (a: string, b: string) => tx([a, b], l);
  const p = netInit(m);
  const lr = m === 'colors' ? 0.3 : 0.2;
  let timer = 0;
  const say = m === 'colors'
    ? z('一个入口，中间四颗各弯一下，右边收成一个数。每种颜色对一条线。圆心里的小旋钮是起点。', 'One way in, four bends in the middle, one number out. Each colour is one neuron. The small knob inside a circle is where that bend starts.')
    : z('一个入口，中间四颗各贡献一条小弯线，加起来才贴住这些点。圆心里的小旋钮是起点，可以一颗颗拖。', 'One way in. Each of the four middle neurons adds one small bent line, and together they sit on the points. The small knob inside a circle is where that bend starts. Drag any knob.');
  const legend = z('每条线和它旁边的小弯线是同一颗。线越粗，这颗旋钮拧得越狠。圆心里的小旋钮是起点，决定这条弯从哪开始。', 'Each line matches the small bent line beside that neuron. A thicker line is a harder turn. The small knob inside the circle is the start of that bend.');
  host.innerHTML = `<div class="lab-say">${say}</div><svg class="net-knobs" viewBox="0 0 440 400" role="img"></svg><div class="lab-cap">${legend}</div><div class="lab-row"><span class="lab-read" data-net-read></span><button type="button" class="l4-b ui-sec" data-net="auto">${z('自动拧', 'Auto-turn')}</button><button type="button" class="l4-b ui-pri" data-net="check">${z('检查', 'Check')}</button></div><div class="lab-fb" data-net-fb></div>`;
  const knobs = host.querySelector('.net-knobs')!, read = host.querySelector('[data-net-read]')!, fb = host.querySelector<HTMLElement>('[data-net-fb]')!;
  const paint = () => {
    const list = slots(p);
    const col = ['var(--link)', 'var(--good)', 'var(--highlight)', 'var(--lv4)'];
    const hy = [70, 160, 250, 340];
    const ix = 64, hx = 176, ox = 392, iy = 205;
    const mid = (x1: number, y1: number, x2: number, y2: number): [number, number] => [(x1 + x2) / 2, (y1 + y2) / 2];
    const dial = (slot: number, cx: number, cy: number, r: number) => {
      const s = list[slot];
      const v = s ? s.get() : 0;
      const t = Math.min(1, Math.max(0, (v + 2) / 4));
      const ang = -140 + t * 280;
      return `<g data-i="${slot}"><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="var(--card)" stroke="var(--navy)" stroke-width="2"/><line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${(cx + Math.sin(ang * Math.PI / 180) * (r - 3)).toFixed(1)}" y2="${(cy - Math.cos(ang * Math.PI / 180) * (r - 3)).toFixed(1)}" stroke="var(--navy)" stroke-width="2"/></g>`;
    };
    let lines = '', charts = '', dials = '';
    const piece = (i: number, x: number) => p.W2[i]! * relu(p.W1[i]![0]! * x + p.W1[i]![1]! + p.b1[i]!);
    for (let i = 0; i < 4; i++) {
      const y = hy[i]!;
      const sw = (v: number) => `stroke="${col[i]}" stroke-width="${(1.8 + Math.min(2, Math.abs(v)) * 2.4).toFixed(1)}"`;
      lines += `<line x1="${ix}" y1="${iy}" x2="${hx}" y2="${y}" ${sw(p.W1[i]![0]!)}/>`;
      lines += `<line x1="${hx}" y1="${y}" x2="${ox}" y2="${iy}" ${sw(p.W2[i]!)}/>`;
      const a = mid(ix, iy, hx, y), b = mid(hx, y, ox, iy);
      dials += dial(i, a[0], a[1], 11);
      dials += dial(12 + i, b[0], b[1], 11);
      dials += dial(8 + i, hx, y, 7);
      const ys: number[] = [];
      for (let k = 0; k <= 12; k++) ys.push(piece(i, k / 12));
      const lo = Math.min(...ys), hi = Math.max(...ys), span = Math.max(0.2, hi - lo);
      const x0 = hx + 22, y0 = y - 16;
      let d = '';
      ys.forEach((v, k) => { d += `${k ? 'L' : 'M'}${(x0 + (k / 12) * 46).toFixed(1)} ${(y0 + 28 - ((v - lo) / span) * 24).toFixed(1)}`; });
      charts += `<rect x="${x0}" y="${y0}" width="46" height="28" fill="var(--card)"/><path d="${d}" fill="none" stroke="${col[i]}" stroke-width="2"/>`;
    }
    dials += dial(16, ox, iy, 8);
    let corner = '';
    if (m === 'curve') {
      const X = (x: number) => 300 + x * 120, Y = (y: number) => 48 - y * 32;
      let sum = '';
      for (let k = 0; k <= 24; k++) { const x = k / 24; sum += `${k ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(forward(p, [x, 1]).y).toFixed(1)}`; }
      corner = `<path d="${sum}" fill="none" stroke="var(--navy)" stroke-width="2"/>${curveData().map(([x, y]) => `<circle cx="${X(x[0]!)}" cy="${Y(y)}" r="2.4" fill="var(--highlight)"/>`).join('')}<text x="360" y="62" text-anchor="middle" fill="var(--ink)" font-size="16">${z('加起来', 'added')}</text>`;
    } else {
      const X = (x: number) => 312 + x * 100, Y = (y: number) => 58 - y * 46;
      let cells = '';
      for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
        const x = i / 7, y = j / 7;
        cells += `<rect x="${(X(x) - 6).toFixed(1)}" y="${(Y(y) - 3).toFixed(1)}" width="12" height="6" fill="${forward(p, [x, y]).y >= 0.5 ? 'var(--link)' : 'var(--mark)'}" opacity="0.45"/>`;
      }
      corner = cells + colorData.map(([x, t]) => `<circle cx="${X(x[0]!)}" cy="${Y(x[1]!)}" r="3.5" fill="${t ? 'var(--link)' : 'var(--highlight)'}"/>`).join('');
    }
    const nodes = `<text x="36" y="${iy + 5}" text-anchor="end" fill="var(--ink)" font-size="16">${z('输入', 'in')}</text><circle cx="${ix}" cy="${iy}" r="14" fill="var(--card)" stroke="var(--ink)"/>${hy.map((y) => `<circle cx="${hx}" cy="${y}" r="16" fill="var(--card)" stroke="var(--ink)"/>`).join('')}<circle cx="${ox}" cy="${iy}" r="16" fill="var(--card)" stroke="var(--ink)"/><text x="${ox}" y="${iy + 34}" text-anchor="middle" fill="var(--ink)" font-size="16">${z('结果', 'out')}</text>`;
    knobs.innerHTML = `${lines}${nodes}${charts}${corner}${dials}`;
    read.textContent = `${z('误差', 'error')} ${lossOf(m, p).toFixed(3)}`;
  };
  knobs.addEventListener('pointerdown', (e) => {
    const g = (e.target as Element).closest('[data-i]'); if (!g) return;
    const i = Number((g as HTMLElement).dataset.i);
    const list = slots(p);
    const box = knobs.getBoundingClientRect();
    const move = (ev: PointerEvent) => {
      const t = Math.min(1, Math.max(0, (ev.clientY - box.top) / box.height));
      list[i]?.set(2 - t * 4);
      paint();
    };
    const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
    move(e as PointerEvent);
  });
  host.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-net]'); if (!b) return;
    if (b.dataset.net === 'auto') {
      window.clearInterval(timer);
      let n = 0;
      timer = window.setInterval(() => {
        if (!host.isConnected || n++ > 180) { window.clearInterval(timer); return; }
        netStep(m, p, lr);
        paint();
      }, 40);
      return;
    }
    const ok = passed(m, p);
    fb.className = `lab-fb ${ok ? 'ok' : 'bad'}`;
    fb.textContent = ok
      ? (m === 'colors' ? z('对了。界线把两种颜色分开了。', 'Right. The boundary separates the two colours.') : z('对了。曲线已经贴住这些点。', 'Right. The curve sits on the points.'))
      : z('还差一点。可以再拧几颗，或按自动拧看全部旋钮怎么转。', 'Not yet. Turn a few more, or press auto-turn and watch every knob.');
  });
  paint();
}
