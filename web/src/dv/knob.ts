/* A bank of knobs. The same picture is the lesson on stations 1, 4, 5 and 6:
   turn them by hand, then let the slope turn them. Loaded only on those stations. */
import { tx, type L } from '../l4/txt';
import { bindDials, dialHitRadius, dialNeedle, dialText } from '../ui/dial';

type Mode = 'line' | 'bend' | 'chain';
type Pt = readonly [number, number];

const LINE: Pt[] = [[1, 3], [2, 5], [3, 7]];
const BEND: Pt[] = [[0, 0], [1, 1], [2, 0]];

const lossLine = (w: number, b: number) => LINE.reduce((s, [x, y]) => s + (w * x + b - y) ** 2, 0) / LINE.length;
const lossBend = (a: number, b: number, c: number) => BEND.reduce((s, [x, y]) => {
  const pred = a + b * x + c * Math.max(0, x - 1);
  return s + (pred - y) ** 2;
}, 0) / BEND.length;

const at = (v: number[], i: number) => v[i] ?? 0;
export function knobStep(mode: Mode, v: number[], lr: number): { v: number[]; loss: number } {
  if (mode === 'chain') {
    const f1 = at(v, 0), f2 = at(v, 1), f3 = at(v, 2), prod = f1 * f2 * f3, d = 2 * (prod - 3);
    return { v: [f1 - lr * d * f2 * f3, f2 - lr * d * f1 * f3, f3 - lr * d * f1 * f2], loss: (prod - 3) ** 2 };
  }
  if (mode === 'bend') {
    const a = at(v, 0), b = at(v, 1), c = at(v, 2);
    let ga = 0, gb = 0, gc = 0;
    for (const [x, y] of BEND) {
      const hinge = Math.max(0, x - 1), pred = a + b * x + c * hinge, e = 2 * (pred - y) / BEND.length;
      ga += e; gb += e * x; gc += e * hinge;
    }
    return { v: [a - lr * ga, b - lr * gb, c - lr * gc], loss: lossBend(a, b, c) };
  }
  const w = at(v, 0), b = at(v, 1);
  let gw = 0, gb = 0;
  for (const [x, y] of LINE) { const e = 2 * (w * x + b - y) / LINE.length; gw += e * x; gb += e; }
  return { v: [w - lr * gw, b - lr * gb], loss: lossLine(w, b) };
}

const passed = (mode: Mode, v: number[]) => {
  if (mode === 'chain') return Math.abs(at(v, 0) * at(v, 1) * at(v, 2) - 3) < 0.25;
  if (mode === 'bend') return lossBend(at(v, 0), at(v, 1), at(v, 2)) < 0.08;
  return lossLine(at(v, 0), at(v, 1)) < 0.08;
};

const LABELS: Record<Mode, string[]> = { line: ['w', 'b'], bend: ['a', 'b', 'c'], chain: ['前', '中', '后'] };
const START: Record<Mode, number[]> = { line: [0, 0], bend: [0, 0, 0], chain: [1, 1, 1] };
const RANGE: Record<Mode, [number, number]> = { line: [-1, 4], bend: [-1, 3], chain: [0.2, 3] };

export function mount(host: HTMLElement, mode: string, l: L) {
  const m = (mode === 'bend' || mode === 'chain' ? mode : 'line') as Mode;
  const z = (a: string, b: string) => tx([a, b], l);
  let v = START[m].slice(), timer = 0;
  const say = m === 'chain'
    ? z('三颗旋钮连着乘。目标是乘积等于 3。自动拧会从最后一颗把坡传回去。', 'Three knobs multiply. The product should be 3. Auto-turn passes the slope back from the last knob.')
    : m === 'bend'
      ? z('这些点先升后降。直线拧不平，中间要有一颗“弯一下”的旋钮。', 'These points rise, then fall. A straight line cannot sit on them. The middle knob is the bend.')
      : z('样本是 (1, 3)、(2, 5)、(3, 7)。拧 w 和 b，让直线靠近这些点。损失是差的平方的平均。', 'The samples are (1, 3), (2, 5), (3, 7). Turn w and b so the line sits near the points. Loss is the average squared gap.');
  host.innerHTML = `<div class="lab-say">${say}</div><svg class="knob-svg" viewBox="0 0 440 200" role="img"></svg><div class="lab-row"><span class="lab-read" data-knob-read></span><button type="button" class="l4-b ui-sec" data-knob="auto">${z('自动拧', 'Auto-turn')}</button><button type="button" class="l4-b ui-pri" data-knob="check">${z('检查', 'Check')}</button></div><div class="lab-fb" data-knob-fb></div>`;
  const svg = host.querySelector('svg')!, read = host.querySelector('[data-knob-read]')!, fb = host.querySelector<HTMLElement>('[data-knob-fb]')!;
  const paint = () => {
    const [lo, hi] = RANGE[m];
    const scaleW = svg.getBoundingClientRect().width;
    const focusI = document.activeElement instanceof Element ? document.activeElement.getAttribute('data-i') : null;
    const knobs = LABELS[m].map((name, i) => {
      const cur = at(v, i);
      const cx = 70 + i * 120, cy = 150;
      const hit = dialHitRadius(440, scaleW, 28);
      const n = dialNeedle(cx, cy, 20, cur, lo, hi);
      return `<g class="dial" data-drag="knob" data-i="${i}" data-v="${cur}" tabindex="0" role="slider" aria-valuemin="${lo}" aria-valuemax="${hi}" aria-valuenow="${dialText(cur)}" aria-label="${name}"><circle cx="${cx}" cy="${cy}" r="${hit.toFixed(1)}" fill="transparent"/><circle cx="${cx}" cy="${cy}" r="28" fill="var(--card)" stroke="var(--navy)" stroke-width="3"/><line x1="${cx}" y1="${cy}" x2="${n.x2.toFixed(1)}" y2="${n.y2.toFixed(1)}" stroke="var(--navy)" stroke-width="3"/><text x="${cx}" y="${cy + 46}" text-anchor="middle" fill="var(--ink)" font-size="14">${name} ${dialText(cur)}</text></g>`;
    }).join('');
    let plot = '';
    if (m !== 'chain') {
      const pts = m === 'bend' ? BEND : LINE;
      const X = (x: number) => 16 + x * 36, Y = (y: number) => 110 - y * 12;
      const pred = (x: number) => m === 'bend' ? at(v, 0) + at(v, 1) * x + at(v, 2) * Math.max(0, x - 1) : at(v, 0) * x + at(v, 1);
      let d = '';
      for (let k = 0; k <= 20; k++) { const x = k / 5; d += `${k ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(pred(x)).toFixed(1)}`; }
      plot = `<path d="${d}" fill="none" stroke="var(--navy)" stroke-width="2"/>${pts.map(([x, y]) => `<circle cx="${X(x)}" cy="${Y(y)}" r="5" fill="var(--highlight)"/>`).join('')}`;
    } else {
      const prod = at(v, 0) * at(v, 1) * at(v, 2);
      plot = `<text x="300" y="70" fill="var(--ink)" font-size="16">${z('乘积', 'product')} ${prod.toFixed(2)}</text><text x="300" y="96" fill="var(--ink)" font-size="16">${z('目标 3', 'target 3')}</text>`;
    }
    svg.innerHTML = `${plot}${knobs}`;
    if (focusI && !document.body.classList.contains('dial-drag')) (svg.querySelector(`[data-i="${focusI}"]`) as SVGElement | null)?.focus({ preventScroll: true });
    const loss = m === 'chain' ? (at(v, 0) * at(v, 1) * at(v, 2) - 3) ** 2 : m === 'bend' ? lossBend(at(v, 0), at(v, 1), at(v, 2)) : lossLine(at(v, 0), at(v, 1));
    read.textContent = `${z('损失', 'loss')} ${loss.toFixed(3)}`;
    host.dispatchEvent(new CustomEvent('knob-move', { bubbles: true, detail: { mode: m, v: v.slice(), loss } }));
  };
  bindDials(svg, (target) => {
    const g = target.closest('[data-i]'); if (!g) return null;
    const i = Number(g.getAttribute('data-i'));
    const [lo, hi] = RANGE[m];
    return {
      min: lo, max: hi,
      get: () => at(v, i),
      set: (n) => { v[i] = Math.min(hi, Math.max(lo, n)); paint(); },
      anchor: () => svg.querySelector(`[data-i="${i}"]`),
    };
  });
  host.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-knob]'); if (!b) return;
    if (b.dataset.knob === 'auto') {
      window.clearInterval(timer);
      let n = 0;
      timer = window.setInterval(() => {
        if (!host.isConnected || n++ > 80) { window.clearInterval(timer); return; }
        v = knobStep(m, v, m === 'bend' ? 0.08 : 0.05).v;
        paint();
      }, 50);
      return;
    }
    const ok = passed(m, v);
    fb.className = `lab-fb ${ok ? 'ok' : 'bad'}`;
    fb.textContent = ok ? z('对了。旋钮已经靠近目标。', 'Right. The knobs are close to the target.') : z('还差一点。可以再拧，或按自动拧看坡怎么走。', 'Not yet. Turn again, or press auto-turn and watch the slope.');
  });
  paint();
}
