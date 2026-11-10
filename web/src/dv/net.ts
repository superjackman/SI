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
    ? z('十七颗旋钮分成两层：进来两路，中间四颗，出去一颗。橙点和蓝点在对角上，一条直线分不开。自动拧会让全部旋钮跟着坡一起转。', 'Seventeen knobs in two layers: two ways in, four in the middle, one out. Orange and blue sit on the diagonals, so a straight cut fails. Auto-turn moves every knob with the slope.')
    : z('十七颗旋钮分成两层。这些点先升高再落下，一条直线贴不住。自动拧会让全部旋钮跟着坡一起转，误差跟着变小。', 'Seventeen knobs in two layers. The points rise and then fall, so a straight line cannot sit on them. Auto-turn moves every knob with the slope, and the error shrinks.');
  host.innerHTML = `<div class="lab-say">${say}</div><svg class="net-plot" viewBox="0 0 440 150" role="img"></svg><svg class="net-knobs" viewBox="0 0 440 320" role="img"></svg><div class="lab-row"><span class="lab-read" data-net-read></span><button type="button" class="l4-b ui-sec" data-net="auto">${z('自动拧', 'Auto-turn')}</button><button type="button" class="l4-b ui-pri" data-net="check">${z('检查', 'Check')}</button></div><div class="lab-fb" data-net-fb></div>`;
  const plot = host.querySelector('.net-plot')!, knobs = host.querySelector('.net-knobs')!, read = host.querySelector('[data-net-read]')!, fb = host.querySelector<HTMLElement>('[data-net-fb]')!;
  const paint = () => {
    const list = slots(p);
    let dials = '';
    list.forEach((s, i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const cx = 78 + col * 90, cy = 36 + row * 58;
      const t = Math.min(1, Math.max(0, (s.get() + 2) / 4));
      const ang = -140 + t * 280;
      const label = s.name;
      dials += `<g data-i="${i}"><circle cx="${cx}" cy="${cy}" r="16" fill="var(--card)" stroke="var(--navy)" stroke-width="2"/><line x1="${cx}" y1="${cy}" x2="${cx + Math.sin(ang * Math.PI / 180) * 11}" y2="${cy - Math.cos(ang * Math.PI / 180) * 11}" stroke="var(--navy)" stroke-width="2"/><text x="${cx}" y="${cy + 30}" text-anchor="middle" fill="var(--ink)" font-size="16">${label}</text></g>`;
    });
    knobs.innerHTML = dials;
    let body = '';
    if (m === 'curve') {
      const X = (x: number) => 28 + x * 360, Y = (y: number) => 120 - y * 80;
      let d = '';
      for (let k = 0; k <= 40; k++) { const x = k / 40; d += `${k ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(forward(p, [x, 1]).y).toFixed(1)}`; }
      body = `<path d="${d}" fill="none" stroke="var(--navy)" stroke-width="2"/>${curveData().map(([x, y]) => `<circle cx="${X(x[0]!)}" cy="${Y(y)}" r="4" fill="var(--highlight)"/>`).join('')}`;
    } else {
      const X = (x: number) => 36 + x * 160, Y = (y: number) => 124 - y * 100;
      let cells = '';
      for (let iy = 0; iy < 14; iy++) for (let ix = 0; ix < 14; ix++) {
        const x = ix / 13, y = iy / 13, on = forward(p, [x, y]).y >= 0.5;
        cells += `<rect x="${X(x) - 6}" y="${Y(y) - 4}" width="12" height="8" fill="${on ? 'var(--link)' : 'var(--mark)'}" opacity="0.35"/>`;
      }
      body = cells + colorData.map(([x, t]) => `<circle cx="${X(x[0]!)}" cy="${Y(x[1]!)}" r="6" fill="${t ? 'var(--link)' : 'var(--highlight)'}" stroke="var(--ink)" stroke-width="1"/>`).join('');
    }
    plot.innerHTML = body;
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
