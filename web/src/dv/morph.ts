/* Life scene first, then the same frame becomes the diagram. Tap or drag.
   The ten stops on 看懂大模型. Other stops keep the still picture. */
import { tx, type L } from '../l4/txt';
import { life } from './ill';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const Y = '#ffd166', G = '#34d399', B = '#5b8cff', P = '#c4b5fd', D = '#9db0d8';
const PATH = new Set(['6', '7', '8a', '8b', '9', 'E', '10', '11', '12', '16']);

const svg = (label: string, body: string, h = 150) => `<svg class="ly-life" viewBox="0 0 300 ${h}" role="img" aria-label="${esc(label)}"><rect width="300" height="${h}" rx="12" fill="#0a1736"/>${body}</svg>`;
const txt = (x: number, y: number, s: string, c = '#e6eeff') => `<text x="${x}" y="${y}" fill="${c}" font-size="16" font-family="system-ui,sans-serif">${esc(s)}</text>`;

/** station 6 math arrows, degrees above +x. Cat and dog stay close; the car is more than 60° from both. */
export const ST6_ANG = { ox: 46, oy: 110, cat: 74, dog: 56, car: -18, lc: 88, ld: 96, lr: 155 } as const;
const tip = (deg: number, len: number) => {
  const r = (deg * Math.PI) / 180;
  return [+(ST6_ANG.ox + len * Math.cos(r)).toFixed(1), +(ST6_ANG.oy - len * Math.sin(r)).toFixed(1)] as const;
};
function arrow(deg: number, len: number, color: string, name: string) {
  const [x, y] = tip(deg, len), r = (deg * Math.PI) / 180;
  const bx = +(x - 12 * Math.cos(r)).toFixed(1), by = +(y + 12 * Math.sin(r)).toFixed(1);
  const px = +(6 * Math.sin(r)).toFixed(1), py = +(6 * Math.cos(r)).toFixed(1);
  return `<path data-v="${name}" d="M${ST6_ANG.ox} ${ST6_ANG.oy} L${x} ${y}" stroke="${color}" stroke-width="4" stroke-linecap="round"/><path d="M${x} ${y} L${+(bx + px).toFixed(1)} ${+(by + py).toFixed(1)} L${+(bx - px).toFixed(1)} ${+(by - py).toFixed(1)} Z" fill="${color}"/>`;
}

function math(key: string, l: L): string {
  const z = (a: string, b: string) => tx([a, b], l);
  if (key === '6') {
    const cat = z('猫', 'cat'), dog = z('狗', 'dog'), car = z('车', 'car');
    const [cx, cy] = tip(ST6_ANG.cat, ST6_ANG.lc), [dx, dy] = tip(ST6_ANG.dog, ST6_ANG.ld), [rx, ry] = tip(ST6_ANG.car, ST6_ANG.lr);
    return svg(z('猫和狗靠得近，车离得远', 'cat and dog are close, the car is far'),
      `<line x1="${ST6_ANG.ox}" y1="${ST6_ANG.oy}" x2="286" y2="${ST6_ANG.oy}" stroke="#33508f"/><line x1="${ST6_ANG.ox}" y1="${ST6_ANG.oy}" x2="${ST6_ANG.ox}" y2="14" stroke="#33508f"/>
${arrow(ST6_ANG.cat, ST6_ANG.lc, Y, 'cat')}${arrow(ST6_ANG.dog, ST6_ANG.ld, G, 'dog')}${arrow(ST6_ANG.car, ST6_ANG.lr, B, 'car')}
${txt(cx - 8, cy - 6, cat, Y)}${txt(dx + 8, dy + 4, dog, G)}${txt(rx + 8, ry - 4, car, B)}`, 176);
  }
  if (key === '7') return svg(z('越传越淡，旁边能回头看', 'fades as it is passed, and can look back'),
    `<circle cx="50" cy="78" r="16" fill="${Y}"/><circle cx="120" cy="78" r="14" fill="${Y}" opacity="0.55"/><circle cx="186" cy="78" r="12" fill="${Y}" opacity="0.28"/>
<path d="M250 110 C260 30 70 24 70 70" fill="none" stroke="${B}" stroke-width="3"/>${txt(40, 40, '1', Y)}${txt(108, 40, '1/2', Y)}${txt(170, 40, '1/4', Y)}`);
  if (key === '8a') return svg(z('需求对准名牌，分数高低不同', 'a need matched to name tags, with different scores'),
    `<rect x="24" y="36" width="70" height="36" rx="8" fill="#1c3f9e"/>${txt(36, 60, 'Q', Y)}
<rect x="120" y="24" width="56" height="28" rx="6" fill="${Y}"/>${txt(132, 44, '0.1', '#1a1204')}
<rect x="190" y="24" width="70" height="28" rx="6" fill="${G}"/>${txt(202, 44, '0.7', '#06281f')}
<rect x="150" y="80" width="64" height="28" rx="6" fill="${B}"/>${txt(162, 100, '0.2', '#fff')}`);
  if (key === '8b') return svg(z('一层注意力，一层各自消化', 'one attention layer, then each word alone'),
    `<rect x="70" y="20" width="160" height="28" rx="6" fill="${B}"/>${txt(110, 40, 'attn')}
<rect x="70" y="60" width="160" height="28" rx="6" fill="${P}"/>${txt(118, 80, '+ x')}
<rect x="70" y="100" width="160" height="28" rx="6" fill="${G}"/>${txt(118, 120, 'FFN')}`);
  if (key === '9') return svg(z('看见前面的字，猜下一个', 'see the words so far, guess the next'),
    `${txt(24, 80, z('天空是 ?', 'sky is ?'), Y)}${txt(180, 80, z('→ 蓝', '→ blue'), G)}`);
  if (key === 'E') return svg(z('同一把尺子：困惑度', 'one ruler: perplexity'),
    `${txt(24, 70, 'L = ln 4', Y)}${txt(24, 110, z('困惑度 = 4', 'perplexity = 4'), G)}`);
  if (key === '10') return svg(z('两份回答，人选一份', 'two answers, a person picks one'),
    `<rect x="30" y="40" width="90" height="60" rx="8" fill="#13224d" stroke="${D}"/><rect x="160" y="40" width="90" height="60" rx="8" stroke="${Y}" stroke-width="3" fill="#1d3270"/>
${txt(58, 76, 'A')}${txt(188, 76, 'B', Y)}`);
  if (key === '11') return svg(z('大矩阵冻住，只暖旁边一条', 'the big matrix stays frozen, a thin path is warmed'),
    `<rect x="30" y="30" width="160" height="90" rx="8" fill="#102048" stroke="${B}" stroke-width="3"/>
<rect x="200" y="36" width="70" height="18" rx="4" fill="${Y}"/>${txt(40, 80, 'W', B)}${txt(214, 50, 'BA', '#1a1204')}`);
  if (key === '12') return svg(z('问过的 K、V 记在本子上', 'K and V already asked stay in the notebook'),
    `<rect x="40" y="30" width="70" height="40" rx="6" fill="${B}"/>${txt(52, 56, 'K')}
<rect x="120" y="30" width="70" height="40" rx="6" fill="${P}"/>${txt(132, 56, 'V')}
<rect x="200" y="30" width="70" height="40" rx="6" fill="none" stroke="${Y}" stroke-dasharray="4 3"/>${txt(214, 56, '+1', Y)}`);
  return svg(z('从第 0 站串到这一站', 'from stop 0 to this one'),
    `<path d="M24 80 H276" stroke="${D}" stroke-width="3"/>
<circle cx="40" cy="80" r="10" fill="${B}"/>${txt(28, 50, '0')}
<circle cx="150" cy="80" r="10" fill="${Y}"/>${txt(138, 50, '8')}
<circle cx="250" cy="80" r="10" fill="${G}"/>${txt(232, 50, '16', G)}`);
}

const CAP: Record<string, readonly [string, string, string, string]> = {
  '6': ['户口编号，看不出谁住得近', 'ID numbers, no sense of who lives near whom', '猫和狗的方向靠近，车离得远', 'cat and dog point nearly the same way; the car does not'],
  '7': ['纸条越传越淡', 'A note that fades as it is passed', '回头看整句，不用把前面挤掉', 'Look back over the sentence, instead of squeezing the start out'],
  '8a': ['三个人，一束光打在其中一个身上', 'Three people, a light on one of them', '对得上的名牌分更高', 'A tag that matches scores higher'],
  '8b': ['几层楼叠在一起', 'Floors stacked into one building', '注意力、加回原稿、再各自消化', 'Attention, add the original back, then each word alone'],
  '9': ['下一格还空着', 'The next square is still empty', '看见前面的字，猜下一个', 'See the words so far and guess the next'],
  'E': ['同一张卷子才比得了分', 'The same paper, or the scores cannot be compared', '困惑度是犹豫，不是对不对', 'Perplexity is hesitation, not right or wrong'],
  '10': ['两张卡片，有人指向一张', 'Two cards, a hand pointing at one', '人选哪份更好', 'A person says which answer is better'],
  '11': ['大块冻住，角上贴一条', 'A large block frozen, a strip on the corner', '只暖旁边那条细路', 'Only the thin side path is warmed'],
  '12': ['问过的人记在本子上', 'People already asked stay in the notebook', 'K 和 V 不用再算一遍', 'K and V are not computed again'],
  '16': ['一根线串起几颗珠子', 'One thread through several beads', '从第 0 站走到这里', 'From stop 0 to here'],
};

export function morph(key: string, l: L): string {
  if (!PATH.has(key)) return life(key, l);
  const cap = CAP[key]!, z = (a: string, b: string) => tx([a, b], l);
  return `<div class="dv-morph" data-morph="1"><div class="dv-morn"><div class="dv-ma">${life(key, l)}</div><div class="dv-mb">${math(key, l)}</div></div>
<p class="dv-mcap"><span class="a">${esc(z(cap[0], cap[1]))}</span><span class="b">${esc(z(cap[2], cap[3]))}</span></p>
<label class="dv-msl"><span>${z('拖一下，从图到式子', 'Drag, from the picture to the diagram')}</span><input type="range" min="0" max="100" value="0" aria-label="${z('从图到式子', 'From the picture to the diagram')}"></label></div>`;
}

export function morphWire(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-morph]').forEach((box) => {
    if (box.dataset.wired) return; box.dataset.wired = '1';
    const set = (v: number) => { const x = Math.max(0, Math.min(100, v)); box.style.setProperty('--m', String(x / 100)); box.dataset.at = x >= 50 ? 'math' : 'life'; const inp = box.querySelector<HTMLInputElement>('input'); if (inp && Number(inp.value) !== x) inp.value = String(x); };
    box.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('input, label')) return; const cur = Number(getComputedStyle(box).getPropertyValue('--m')) || 0; set(cur > 0.5 ? 0 : 100); });
    box.querySelector('input')?.addEventListener('input', (e) => set(Number((e.target as HTMLInputElement).value)));
  });
}
