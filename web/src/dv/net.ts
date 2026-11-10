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
    ? z('这就是一个最小的人工神经网络：左边进一个位置，中间四颗神经元各自弯出一小段，右边把它们加起来，得到一条能把两种颜色分开的界线。', 'This is a tiny artificial neural network: a position comes in on the left, four neurons each bend a little, and the right side adds them into a boundary that separates the two colours.')
    : z('这就是一个最小的人工神经网络：左边进一个数，中间四颗神经元各自弯出一小段，右边把它们加起来，得到一条能贴住点的线。', 'This is a tiny artificial neural network: a number comes in on the left, four neurons each bend a little, and the right side adds them into a line that sits on the points.');
  const legend = z('线上的旋钮管弯得多陡，圆圈里的旋钮管从哪里开始弯。', 'A knob on a line sets how steep that bend is. A knob inside a circle sets where the bend starts.');
  host.innerHTML = `<div class="lab-say">${say}</div><svg class="net-knobs" viewBox="0 0 440 390" role="img"></svg><div class="lab-cap">${legend}</div><div class="lab-row"><span class="lab-read" data-net-read></span><button type="button" class="l4-b ui-sec" data-net="auto">${z('自动拧', 'Auto-turn')}</button><button type="button" class="l4-b ui-pri" data-net="check">${z('检查', 'Check')}</button></div><div class="lab-fb" data-net-fb></div>`;
  const knobs = host.querySelector('.net-knobs')!, read = host.querySelector('[data-net-read]')!, fb = host.querySelector<HTMLElement>('[data-net-fb]')!;
  const paint = () => {
    const list = slots(p);
    const col = ['var(--link)', 'var(--good)', 'var(--highlight)', 'var(--lv4)'];
    const hy = [78, 148, 218, 288];
    const ix = 78, iy = 183, hx = 196, ox = 300;
    const boxX = 352, boxW = 76, boxH = 36;
    const wire = (x1: number, y1: number, x2: number, y2: number, color: string, v: number) => {
      const width = (1.8 + Math.min(2, Math.abs(v)) * 2.2).toFixed(1);
      return `<path class="net-wire" data-x1="${x1}" data-y1="${y1}" data-x2="${x2}" data-y2="${y2}" d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
    };
    const dial = (slot: number, cx: number, cy: number, r: number) => {
      const v = list[slot] ? list[slot]!.get() : 0;
      const ang = -140 + Math.min(1, Math.max(0, (v + 2) / 4)) * 280;
      return `<g class="net-knob" data-i="${slot}"><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="none" stroke="var(--navy)" stroke-width="2"/><line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${(cx + Math.sin(ang * Math.PI / 180) * (r - 3)).toFixed(1)}" y2="${(cy - Math.cos(ang * Math.PI / 180) * (r - 3)).toFixed(1)}" stroke="var(--navy)" stroke-width="2"/></g>`;
    };
    const piece = (i: number, x: number) => p.W2[i]! * relu(p.W1[i]![0]! * x + p.W1[i]![1]! + p.b1[i]!);
    let lines = '', boxes = '', dials = '';
    for (let i = 0; i < 4; i++) {
      const y = hy[i]!;
      lines += wire(ix, iy, hx, y, col[i]!, p.W1[i]![0]!);
      lines += wire(hx, y, ox, iy, col[i]!, p.W2[i]!);
      dials += dial(i, (ix + hx) / 2, (iy + y) / 2, 9);
      dials += dial(12 + i, (hx + ox) / 2, (y + iy) / 2, 9);
      dials += dial(8 + i, hx, y, 7);
      const ys: number[] = [];
      for (let k = 0; k <= 12; k++) ys.push(piece(i, k / 12));
      const lo = Math.min(...ys), hi = Math.max(...ys), span = Math.max(0.2, hi - lo);
      const x0 = boxX, y0 = y - boxH / 2;
      let d = '';
      ys.forEach((v, k) => { d += `${k ? 'L' : 'M'}${(x0 + 6 + (k / 12) * (boxW - 12)).toFixed(1)} ${(y0 + boxH - 6 - ((v - lo) / span) * (boxH - 12)).toFixed(1)}`; });
      boxes += `<path class="net-box" d="M${x0} ${y0}h${boxW}v${boxH}h${-boxW}z" fill="none" stroke="${col[i]}" stroke-width="1.5"/><path class="net-bend" d="${d}" fill="none" stroke="${col[i]}" stroke-width="2"/>`;
      if (i < 3) boxes += `<text x="${boxX + boxW / 2}" y="${((hy[i]! + hy[i + 1]!) / 2 + 5).toFixed(1)}" text-anchor="middle" fill="var(--ink)" font-size="16">＋</text>`;
    }
    dials += dial(16, ox, iy, 8);
    const sumY = hy[3]! + boxH / 2 + 28;
    let sum = '';
    if (m === 'curve') {
      const X = (x: number) => boxX + 6 + x * (boxW - 12), Y = (y: number) => sumY + 22 - y * 16;
      for (let k = 0; k <= 16; k++) { const x = k / 16; sum += `${k ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(forward(p, [x, 1]).y).toFixed(1)}`; }
      sum = `<path class="net-box" d="M${boxX} ${sumY}h${boxW}v${30}h${-boxW}z" fill="none" stroke="var(--navy)" stroke-width="1.5"/><path class="net-bend" d="${sum}" fill="none" stroke="var(--navy)" stroke-width="2"/>`;
    } else {
      let cells = '';
      for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) {
        const x = i / 5, y = j / 5;
        const px = boxX + 4 + i * 11, py = sumY + 4 + (5 - j) * 4;
        cells += `<path d="M${px} ${py}h9v3h-9z" fill="${forward(p, [x, y]).y >= 0.5 ? 'var(--link)' : 'var(--mark)'}" opacity="0.55"/>`;
      }
      sum = `<path class="net-box" d="M${boxX} ${sumY}h${boxW}v${30}h${-boxW}z" fill="none" stroke="var(--navy)" stroke-width="1.5"/>${cells}`;
    }
    const labels = `<text x="${ix}" y="28" text-anchor="middle" fill="var(--ink)" font-size="16">${z('输入', 'in')}</text><text x="${hx}" y="28" text-anchor="middle" fill="var(--ink)" font-size="16">${z('神经元（4 颗）', 'neurons (4)')}</text><text x="${ox}" y="28" text-anchor="middle" fill="var(--ink)" font-size="16">${z('结果', 'out')}</text><text x="${boxX + boxW / 2}" y="${(sumY - 6).toFixed(1)}" text-anchor="middle" fill="var(--ink)" font-size="16">${z('加起来', 'added')}</text>`;
    const nodes = `<circle cx="${ix}" cy="${iy}" r="14" fill="none" stroke="var(--ink)" stroke-width="2"/>${hy.map((y) => `<circle cx="${hx}" cy="${y}" r="16" fill="none" stroke="var(--ink)" stroke-width="2"/>`).join('')}<circle cx="${ox}" cy="${iy}" r="16" fill="none" stroke="var(--ink)" stroke-width="2"/>`;
    knobs.innerHTML = `${lines}${boxes}${sum}${nodes}${dials}${labels}`;
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
