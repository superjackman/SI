/* Life scenes for the ten 看懂大模型 stations. Each paired object uses the same
   data-obj id and data-c colour in the life drawing and the diagram, so a drag
   crossfades one into the other: a hukou seal into a one-hot cell, a cat into
   its arrow. No SVG text on the life side (phone text checks). Lazy, with the
   station chunk. */
import { tx, type L } from '../l4/txt';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export const Y = 'var(--highlight)', G = 'var(--good)', B = 'var(--link)', P = 'var(--link)', R = 'var(--bad)', D = 'var(--link)', AX = 'var(--link)';
const SKIN = 'var(--skin)', HAIR = 'var(--ink)', INK = 'var(--ink)', PAGE = 'var(--card)', RED = 'var(--bad)';
const H = 176;

export const CAST_KEYS = new Set(['6', '7', '8a', '8b', '9', 'E', '10', '11', '12', '16']);

/** station 6 math arrows, degrees above +x. Cat and dog stay close; the car is more than 60° from both. */
export const ST6_ANG = { ox: 128, oy: 114, cat: 74, dog: 56, car: -18, lc: 50, ld: 86, lr: 132 } as const;

const tip = (deg: number, len: number) => {
  const r = (deg * Math.PI) / 180;
  return [+(ST6_ANG.ox + len * Math.cos(r)).toFixed(1), +(ST6_ANG.oy - len * Math.sin(r)).toFixed(1)] as const;
};
const g = (id: string, c: string, body: string) => `<g data-obj="${id}" data-c="${c}">${body}</g>`;
const label = (x: number, y: number, s: string, c: string, anchor: 'start' | 'middle' | 'end' = 'middle') =>
  `<text x="${x}" y="${y}" fill="${c}" font-size="15" font-weight="700" font-family="system-ui,sans-serif" text-anchor="${anchor}">${esc(s)}</text>`;

function face(cx: number, cy: number, r = 7) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${SKIN}"/>
<path d="M${cx - r} ${cy - 1} Q${cx} ${cy - r - 3.5} ${cx + r} ${cy - 1}" fill="${HAIR}"/>
<circle cx="${(cx - r * 0.34).toFixed(1)}" cy="${cy + 0.4}" r="1.15" fill="${INK}"/>
<circle cx="${(cx + r * 0.34).toFixed(1)}" cy="${cy + 0.4}" r="1.15" fill="${INK}"/>
<path d="M${cx - 2.2} ${cy + r * 0.42} q2.2 2.4 4.4 0" fill="none" stroke="var(--navy)" stroke-width="0.9"/>`;
}

/** feet at (x, foot). Arm reaches right, left, up, or hangs. */
function person(x: number, foot: number, shirt: string, arm: 'down' | 'R' | 'L' | 'up' = 'down') {
  const hip = foot - 12, neck = hip - 16, r = 7, cy = neck - r - 1;
  const arms = arm === 'R' ? `M${x + 6} ${neck + 3} L${x + 20} ${neck + 11}`
    : arm === 'L' ? `M${x - 6} ${neck + 3} L${x - 22} ${neck + 10}`
    : arm === 'up' ? `M${x + 5} ${neck + 2} L${x + 13} ${neck - 14}`
    : `M${x - 8} ${neck + 3} L${x - 11} ${hip - 1} M${x + 8} ${neck + 3} L${x + 11} ${hip - 1}`;
  return `<ellipse cx="${x}" cy="${foot + 1}" rx="11" ry="2.3" fill="var(--bg)" opacity="0.5"/>
<path d="${arms}" stroke="${shirt}" stroke-width="3.6" stroke-linecap="round" fill="none"/>
<path d="M${x - 5} ${hip} l-2.5 12 M${x + 5} ${hip} l2.5 12" stroke="var(--link)" stroke-width="3.6" stroke-linecap="round"/>
<path d="M${x - 10} ${hip + 1} Q${x} ${neck - 2} ${x + 10} ${hip + 1} Z" fill="${shirt}"/>
${face(x, cy, r)}`;
}

function arrow(deg: number, len: number, color: string, name: string) {
  const [x, y] = tip(deg, len), r = (deg * Math.PI) / 180;
  const bx = +(x - 11 * Math.cos(r)).toFixed(1), by = +(y + 11 * Math.sin(r)).toFixed(1);
  const px = +(5.5 * Math.sin(r)).toFixed(1), py = +(5.5 * Math.cos(r)).toFixed(1);
  return `<path data-v="${name}" d="M${ST6_ANG.ox} ${ST6_ANG.oy} L${x} ${y}" stroke="${color}" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M${x} ${y} L${+(bx + px).toFixed(1)} ${+(by + py).toFixed(1)} L${+(bx - px).toFixed(1)} ${+(by - py).toFixed(1)} Z" fill="${color}"/>`;
}

const BG = `<rect width="300" height="${H}" rx="12" fill="var(--card)"/>`;
const ground = (y: number, fill: string) => `<rect x="0" y="${y}" width="300" height="${H - y}" fill="${fill}"/>`;

function svg(label: string, body: string, hidden: boolean) {
  return `<svg class="ly-life" viewBox="0 0 300 ${H}" role="img" aria-label="${esc(label)}"${hidden ? ' aria-hidden="true"' : ''}>${body}</svg>`;
}

function catShape(x: number, y: number) {
  return `<path d="M${x - 15} ${y + 1} q7-13 2 0" fill="none" stroke="${Y}" stroke-width="2.5" stroke-linecap="round"/>
<ellipse cx="${x}" cy="${y}" rx="12" ry="7.2" fill="${Y}"/>
<circle cx="${x + 9}" cy="${y - 5}" r="6" fill="${Y}"/>
<path d="M${x + 4} ${y - 10} l2.4-6.2 3.6 5.6 z M${x + 10} ${y - 11} l2.6-5.6 3.6 6.2 z" fill="${Y}"/>
<circle cx="${x + 7}" cy="${y - 6}" r="1" fill="${INK}"/><circle cx="${x + 12}" cy="${y - 6}" r="1" fill="${INK}"/>
<path d="M${x + 14.5} ${y - 4} h4.2 M${x + 14.5} ${y - 2} h3.4" stroke="${INK}" stroke-width="0.7"/>`;
}
function dogShape(x: number, y: number) {
  return `<ellipse cx="${x}" cy="${y + 1}" rx="14" ry="8" fill="${G}"/>
<circle cx="${x + 12}" cy="${y - 3}" r="7" fill="${G}"/>
<ellipse cx="${x + 6}" cy="${y - 2}" rx="3.2" ry="7" fill="${G}"/>
<ellipse cx="${x + 15}" cy="${y - 1}" rx="3.2" ry="7.2" fill="${G}"/>
<ellipse cx="${x + 20}" cy="${y - 2}" rx="5" ry="3.2" fill="var(--good-bg)"/>
<circle cx="${x + 23}" cy="${y - 2.4}" r="0.9" fill="${INK}"/>
<circle cx="${x + 10}" cy="${y - 4}" r="1.05" fill="${INK}"/><circle cx="${x + 14.5}" cy="${y - 4}" r="1.05" fill="${INK}"/>
<path d="M${x - 13} ${y} q-10 -8 -2 -12" fill="none" stroke="${G}" stroke-width="2.6" stroke-linecap="round"/>`;
}
function carShape(tipX: number, tipY: number) {
  const x = tipX - 46, y = tipY - 8;
  return `<rect x="${x}" y="${y}" width="46" height="15" rx="3.5" fill="${B}"/>
<path d="M${x + 11} ${y} l5-9 h15 l6 9 z" fill="${B}"/>
<rect x="${x + 15}" y="${y - 7}" width="7" height="6" rx="0.6" fill="var(--card)"/>
<rect x="${x + 24}" y="${y - 7}" width="7" height="6" rx="0.6" fill="var(--card)"/>
<circle cx="${x + 12}" cy="${y + 15}" r="4.6" fill="var(--card)"/><circle cx="${x + 34}" cy="${y + 15}" r="4.6" fill="var(--card)"/>
<circle cx="${x + 12}" cy="${y + 15}" r="1.7" fill="${D}"/><circle cx="${x + 34}" cy="${y + 15}" r="1.7" fill="${D}"/>`;
}

/* ---------- station 6: hukou book → sparse ids, neighbourhood → vectors ---------- */
function scene6(l: L, math: boolean) {
  const z = (a: string, b: string) => tx([a, b], l);
  const [catX, catY] = tip(ST6_ANG.cat, ST6_ANG.lc);
  const [dogX, dogY] = tip(ST6_ANG.dog, ST6_ANG.ld);
  const [carX, carY] = tip(ST6_ANG.car, ST6_ANG.lr);
  const rows = [
    { id: 'hot-cat', c: Y, on: 0, y: 78 },
    { id: 'hot-dog', c: G, on: 1, y: 104 },
    { id: 'hot-car', c: B, on: 4, y: 130 },
  ];
  const cell = (i: number) => 54 + i * 11;
  const hot = rows.map((row) => g(row.id, row.c, math
    ? [0, 1, 2, 3, 4].map((i) => `<rect x="${cell(i)}" y="${row.y}" width="8" height="8" rx="1" fill="${i === row.on ? row.c : 'var(--card)'}" stroke="${row.c}" stroke-width="0.6"/>`).join('')
    : `<path d="M50 ${row.y + 4} H108" stroke="var(--highlight)" stroke-width="1.2"/><circle cx="${cell(row.on) + 4}" cy="${row.y + 4}" r="4.2" fill="${row.c}"/>`)).join('');
  const road = g('axes', AX, math
    ? `<path d="M${ST6_ANG.ox} ${ST6_ANG.oy} H290" stroke="${AX}" stroke-width="2" fill="none"/><path d="M${ST6_ANG.ox} ${ST6_ANG.oy} V16" stroke="${AX}" stroke-width="2" fill="none"/>`
    : `<path d="M${ST6_ANG.ox} ${ST6_ANG.oy} H292" stroke="${AX}" stroke-width="8" stroke-linecap="round" fill="none"/><path d="M${ST6_ANG.ox + 6} ${ST6_ANG.oy} H286" stroke="var(--highlight)" stroke-width="1.2" stroke-dasharray="5 6" fill="none"/>`);
  const actors = [
    g('cat', Y, math ? `${arrow(ST6_ANG.cat, ST6_ANG.lc, Y, 'cat')}${label(catX - 2, catY - 12, z('猫', 'cat'), Y)}` : catShape(catX - 2, catY + 10)),
    g('dog', G, math ? `${arrow(ST6_ANG.dog, ST6_ANG.ld, G, 'dog')}${label(dogX + 14, dogY - 6, z('狗', 'dog'), G, 'start')}` : dogShape(dogX + 6, dogY + 8)),
    g('car', B, math ? `${arrow(ST6_ANG.car, ST6_ANG.lr, B, 'car')}${label(carX - 28, carY - 22, z('车', 'car'), B)}` : carShape(carX, carY)),
  ].join('');
  const lifeOnly = math ? '' : `${person(22, 158, RED, 'R')}
<rect x="38" y="44" width="76" height="114" rx="4" fill="${RED}"/>
<rect x="38" y="44" width="12" height="114" fill="var(--bad-bg)"/>
<circle cx="78" cy="56" r="6" fill="none" stroke="var(--navy)" stroke-width="1.4"/>
<path d="M78 51.5 l1.1 2.4 h2.6 l-2.1 1.6 0.8 2.5 -2.4-1.5 -2.4 1.5 0.8-2.5 -2.1-1.6 h2.6 z" fill="var(--navy)"/>
<rect x="48" y="66" width="60" height="84" rx="2" fill="${PAGE}"/>
<path d="M228 114 v-38 h30 v32 z" fill="var(--link)"/><path d="M224 76 l19-14 19 14 z" fill="var(--bad-bg)"/>
<rect x="238" y="88" width="8" height="12" fill="var(--navy)"/>`;
  const aria = math
    ? z('猫和狗靠得近，车离得远', 'cat and dog are close, the car is far')
    : z('一本户口本，号码排开，看不出谁住得近', 'A household register: the numbers do not show who lives near whom');
  return svg(aria, `${BG}${math ? '' : ground(128, 'var(--card)')}${lifeOnly}${hot}${road}${actors}`, math);
}

/* ---------- station 7: a fading note → weights, a glance → the look-back arc ---------- */
function scene7(l: L, math: boolean) {
  const z = (a: string, b: string) => tx([a, b], l);
  const notes = [
    { id: 'n1', x: 68, y: 138, w: 26, h: 16, op: 1, t: '1' },
    { id: 'n2', x: 136, y: 140, w: 20, h: 13, op: 0.7, t: '1/2' },
    { id: 'n3', x: 200, y: 144, w: 14, h: 10, op: 0.42, t: '1/4' },
  ];
  const paper = notes.map((n) => g(n.id, Y, math
    ? `<circle cx="${n.x}" cy="${n.y}" r="${7 + n.op * 5}" fill="${Y}" opacity="${n.op}"/>${label(n.x, n.y - 34, n.t, Y)}`
    : `<rect x="${n.x - n.w / 2}" y="${n.y - n.h / 2}" width="${n.w}" height="${n.h}" rx="1.5" fill="${Y}" opacity="${n.op}"/><path d="M${n.x - n.w / 2 + 2} ${n.y} h${n.w - 4}" stroke="${INK}" stroke-width="0.8" opacity="${n.op}"/>`)).join('');
  const arc = g('back', B, `<path d="M226 108 C248 36 52 30 34 100" fill="none" stroke="${B}" stroke-width="${math ? 3 : 2.4}" stroke-linecap="round"/>${math ? '' : `<circle cx="226" cy="108" r="2.4" fill="${B}"/>`}`);
  const people = math ? '' : `${person(34, 158, 'var(--link)', 'R')}${person(104, 158, 'var(--link)', 'R')}${person(170, 158, 'var(--link)', 'R')}${person(228, 158, B, 'up')}
<rect x="258" y="40" width="30" height="64" rx="2" fill="var(--card)" stroke="${D}" stroke-width="1.4"/><circle cx="266" cy="74" r="2" fill="${Y}"/>`;
  const aria = math
    ? z('越传越淡，旁边能回头看', 'fades as it is passed, and can look back')
    : z('一张纸条越传越淡，旁边一条能回头看的弧', 'A note that fades as it is passed, and an arc that looks back');
  return svg(aria, `${BG}${math ? '' : ground(148, 'var(--card)')}${people}${paper}${arc}`, math);
}

/* ---------- station 8a: name tags → scores, the asker's card → Q ---------- */
function scene8a(l: L, math: boolean) {
  const z = (a: string, b: string) => tx([a, b], l);
  const bars = [
    { id: 's1', c: Y, x: 108, h: 22, t: '0.1' },
    { id: 's2', c: G, x: 176, h: 78, t: '0.7' },
    { id: 's3', c: B, x: 244, h: 36, t: '0.2' },
  ];
  const floor = 152;
  const scores = bars.map((b) => g(b.id, b.c, math
    ? `<rect x="${b.x}" y="${floor - b.h}" width="26" height="${b.h}" rx="4" fill="${b.c}"/>${label(b.x + 13, floor - b.h - 6, b.t, b.c)}`
    : `<rect x="${b.x}" y="${floor - 18}" width="26" height="14" rx="3" fill="${b.c}"/>`)).join('');
  const ask = g('q', R, `<rect x="50" y="132" width="34" height="22" rx="4" fill="${R}"/>${math ? label(67, 148, 'Q', INK) : `<path d="M56 140 h22 M56 146 h14" stroke="${INK}" stroke-width="1.2"/>`}`);
  const lifeOnly = math ? '' : `${person(40, 158, R, 'R')}${person(121, 158, 'var(--link)')}${person(189, 158, G)}${person(257, 158, B)}
<path d="M24 22 Q150 40 280 20" fill="none" stroke="${Y}" stroke-width="1.4"/>
<circle cx="70" cy="26" r="3.2" fill="${R}"/><circle cx="140" cy="32" r="3.2" fill="${Y}"/><circle cx="210" cy="28" r="3.2" fill="${G}"/><circle cx="260" cy="24" r="3.2" fill="${B}"/>
<polygon points="189,16 170,78 208,78" fill="${Y}" opacity="0.38"/>`;
  const aria = math
    ? z('需求对准名牌，分数高低不同', 'a need matched to name tags, with different scores')
    : z('三个人里，一束光打在其中一个身上', 'Three people, a light on one of them');
  return svg(aria, `${BG}${math ? '' : ground(150, 'var(--card)')}${lifeOnly}${ask}${scores}`, math);
}

/* ---------- station 8b: three floors → attn / +x / FFN ---------- */
function scene8b(l: L, math: boolean) {
  const z = (a: string, b: string) => tx([a, b], l);
  const floors = [
    { id: 'f1', c: B, y: 28, t: 'attn', ink: 'var(--ink)', who: `${face(128, 46, 6)}${face(176, 46, 6)}<rect x="116" y="54" width="70" height="7" rx="1" fill="var(--card)"/>` },
    { id: 'f2', c: P, y: 74, t: '+ x', ink: INK, who: `${face(118, 94, 6)}<rect x="138" y="84" width="46" height="22" rx="2" fill="${PAGE}"/><rect x="172" y="78" width="16" height="12" rx="2" fill="${Y}"/>` },
    { id: 'f3', c: G, y: 120, t: 'FFN', ink: INK, who: `${face(122, 138, 6)}${face(198, 138, 6)}<rect x="110" y="146" width="24" height="6" rx="1" fill="var(--card)"/><rect x="186" y="146" width="24" height="6" rx="1" fill="var(--card)"/>` },
  ];
  const body = floors.map((f) => g(f.id, f.c, `<rect x="86" y="${f.y}" width="140" height="40" rx="6" fill="${f.c}"/>${math ? label(156, f.y + 25, f.t, f.ink) : f.who}`)).join('');
  const shell = math ? '' : `<path d="M74 30 L160 10 L246 30 V164 H74 Z" fill="var(--card)" stroke="var(--link)" stroke-width="2"/>
<rect x="228" y="150" width="10" height="18" fill="var(--muted)"/>`;
  const aria = math
    ? z('一层注意力，一层各自消化', 'one attention layer, then each word alone')
    : z('叠起来的几层楼', 'Floors stacked into one building');
  return svg(aria, `${BG}${shell}${body}`, math);
}

/* ---------- station 9: written lines → the prompt, the blank → the guess ---------- */
function scene9(l: L, math: boolean) {
  const z = (a: string, b: string) => tx([a, b], l);
  const pageL = `<path d="M92 36 h92 v96 h-92 z" fill="var(--card)" stroke="${D}"/>`;
  const pageR = `<path d="M184 36 h92 v96 h-92 z" fill="var(--card)" stroke="${D}"/>`;
  const seen = g('seen', B, math
    ? label(108, 90, z('天空是 ?', 'sky is ?'), B, 'start')
    : `<path d="M104 56 H172 M104 72 H164 M104 88 H150 M104 104 H168" stroke="${B}" stroke-width="2.4" stroke-linecap="round"/>`);
  const next = g('next', Y, math
    ? label(230, 90, z('蓝', 'blue'), Y)
    : `<rect x="200" y="72" width="60" height="28" rx="3" fill="none" stroke="${Y}" stroke-width="2" stroke-dasharray="4 3"/>`);
  const lifeOnly = math ? '' : `${person(76, 168, 'var(--link)', 'R')}
<rect x="20" y="148" width="260" height="12" rx="3" fill="var(--card)"/>
<path d="M250 108 l16-28" stroke="${Y}" stroke-width="2.4" stroke-linecap="round"/><path d="M264 78 l4 2 -6 1 z" fill="${Y}"/>
<rect x="176" y="24" width="16" height="10" rx="1" fill="${Y}"/>`;
  const aria = math
    ? z('看见前面的字，猜下一个', 'see the words so far, guess the next')
    : z('一本打开的书，下一格还空着', 'An open book, the next square still empty');
  return svg(aria, `${BG}${math ? '' : ground(140, 'var(--card)')}${lifeOnly}${pageL}${pageR}${seen}${next}`, math);
}

/* ---------- station E: two papers and one ruler → loss and perplexity ---------- */
function sceneE(l: L, math: boolean) {
  const z = (a: string, b: string) => tx([a, b], l);
  const paper = (id: string, c: string, x: number, text: string) => {
    const lines = `<path d="M${x + 10} 90 H${x + 84} M${x + 10} 104 H${x + 70} M${x + 10} 118 H${x + 60}" stroke="var(--link)" stroke-width="1.6"/>`;
    const cross = id === 'p2' ? `<path d="M${x + 68} 82 l14 14 M${x + 82} 82 l-14 14" stroke="${R}" stroke-width="2.4"/>` : '';
    const face = math ? label(x + 48, 108, text, c) : lines + cross;
    return g(id, c, `<rect x="${x}" y="74" width="96" height="58" rx="4" fill="${math ? 'var(--card)' : PAGE}" stroke="${c}" stroke-width="2.4"/>${face}`);
  };
  const ruler = g('rule', Y, `<rect x="48" y="58" width="204" height="8" rx="2" fill="${Y}"/>${math ? '' : `<path d="M60 60 v4 M80 60 v4 M110 60 v4 M140 60 v4 M170 60 v4 M200 60 v4 M230 60 v4" stroke="${INK}" stroke-width="1"/>`}`);
  const lifeOnly = math ? '' : `${person(32, 168, 'var(--link)')}${person(268, 168, 'var(--link)')}
<rect x="16" y="150" width="268" height="12" rx="3" fill="var(--card)"/>`;
  const aria = math
    ? z('同一把尺子：困惑度', 'one ruler: perplexity')
    : z('一张卷子，角上有一处被划掉的题', 'A paper, with one question crossed out in the corner');
  return svg(aria, `${BG}${math ? '' : ground(146, 'var(--card)')}${lifeOnly}${ruler}${paper('p1', Y, 46, 'L = ln 4')}${paper('p2', G, 154, z('困惑度 = 4', 'e^L = 4'))}`, math);
}

/* ---------- station 10: two answers, a hand → the chosen card ---------- */
function scene10(l: L, math: boolean) {
  const z = (a: string, b: string) => tx([a, b], l);
  const card = (id: string, c: string, x: number, letter: string, hot: boolean) => g(id, c, `<rect x="${x}" y="28" width="104" height="84" rx="8" fill="${hot ? 'var(--link)' : 'var(--card)'}" stroke="${c}" stroke-width="${hot ? 3 : 1.6}"/>${math
    ? label(x + 52, 76, letter, c)
    : `<path d="M${x + 12} 46 H${x + 88} M${x + 12} 60 H${x + 76} M${x + 12} 74 H${x + 84} M${x + 12} 88 H${x + 64}" stroke="${c}" stroke-width="1.6" opacity="0.85"/>`}`);
  const pick = g('pick', G, math
    ? `<path d="M188 62 l8 10 l16-18" fill="none" stroke="${G}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<circle cx="206" cy="74" r="6.5" fill="${G}"/>`);
  const lifeOnly = math ? '' : `<rect x="12" y="136" width="276" height="14" rx="3" fill="var(--card)"/>${person(256, 166, G)}
<path d="M246 124 C228 104 216 88 206 74" fill="none" stroke="${G}" stroke-width="4" stroke-linecap="round"/>`;
  const aria = math
    ? z('两份回答，人选一份', 'two answers, a person picks one')
    : z('两张卡片，有人指向其中一张', 'Two cards, a hand pointing at one');
  return svg(aria, `${BG}${math ? '' : ground(140, 'var(--card)')}${lifeOnly}${card('a', D, 16, 'A', false)}${card('b', Y, 132, 'B', true)}${pick}`, math);
}

/* ---------- station 11: a block of ice → W, the warmed strip → BA ---------- */
function scene11(l: L, math: boolean) {
  const z = (a: string, b: string) => tx([a, b], l);
  const ice = g('w', B, `<rect x="20" y="44" width="196" height="96" rx="8" fill="var(--card)" stroke="${B}" stroke-width="3"/>${math
    ? label(78, 100, 'W', B)
    : `<path d="M40 60 l20 16 l-8 22 M80 52 l6 28 M120 70 l14-16 l8 24 M160 58 l-10 30" fill="none" stroke="var(--link)" stroke-width="1.3" opacity="0.8"/>
<circle cx="54" cy="108" r="2" fill="var(--card)"/><circle cx="96" cy="120" r="1.6" fill="var(--card)"/><circle cx="150" cy="112" r="2" fill="var(--card)"/>`}`);
  const strip = g('ba', Y, `<rect x="176" y="52" width="78" height="22" rx="4" fill="${Y}"/>${math ? label(215, 68, 'BA', INK) : `<path d="M188 60 h50 M188 68 h32" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`}`);
  const lifeOnly = math ? '' : `${person(262, 164, 'var(--highlight)')}<path d="M250 126 C232 100 226 80 214 66" fill="none" stroke="var(--navy)" stroke-width="4" stroke-linecap="round"/><ellipse cx="214" cy="62" rx="40" ry="16" fill="${Y}" opacity="0.25"/>`;
  const aria = math
    ? z('大矩阵冻住，只暖旁边一条', 'the big matrix stays frozen, a thin path is warmed')
    : z('一大块冻住的方块，角上贴着一小条', 'A large frozen block, with a small strip on the corner');
  return svg(aria, `${BG}${math ? '' : ground(148, 'var(--card)')}${lifeOnly}${ice}${strip}`, math);
}

/* ---------- station 12: names in a notebook → K, V, and the next one ---------- */
function scene12(l: L, math: boolean) {
  const z = (a: string, b: string) => tx([a, b], l);
  const row = (id: string, c: string, x: number, y: number, w: number, t: string, faceX: number) => g(id, c, math
    ? `<rect x="${x}" y="${y}" width="${w}" height="32" rx="6" fill="${id === 'n' ? 'none' : c}" stroke="${c}" stroke-width="2"${id === 'n' ? ' stroke-dasharray="4 3"' : ''}/>${label(x + w / 2, y + 21, t, id === 'k' ? 'var(--ink)' : id === 'n' ? Y : INK)}`
    : `<rect x="${x}" y="${y}" width="${w}" height="32" rx="6" fill="${id === 'n' ? 'none' : c}" stroke="${c}" stroke-width="2"${id === 'n' ? ' stroke-dasharray="4 3"' : ''}/>${id === 'n' ? '' : `${face(faceX, y + 16, 6)}<path d="M${faceX + 12} ${y + 16} h${w - 36}" stroke="${INK}" stroke-width="1.5"/>`}`);
  const book = math ? '' : `<rect x="78" y="24" width="168" height="132" rx="6" fill="var(--card)" stroke="${D}" stroke-width="2"/>
<rect x="92" y="32" width="142" height="116" rx="3" fill="${PAGE}"/>
<path d="M86 36 v108" stroke="var(--bad)" stroke-width="3"/>
${person(46, 160, 'var(--link)', 'R')}${person(262, 150, Y, 'L')}`;
  const aria = math
    ? z('问过的 K、V 记在本子上', 'K and V already asked stay in the notebook')
    : z('一本已经写了名字的笔记本', 'A notebook that already has the names written');
  return svg(aria, `${BG}${math ? '' : ground(150, 'var(--card)')}${book}${row('k', B, 100, 44, 120, 'K', 116)}${row('v', P, 100, 84, 120, 'V', 116)}${row('n', Y, 150, 124, 70, '+1', 0)}`, math);
}

/* ---------- station 16: beads on a thread → the stops ---------- */
function scene16(l: L, math: boolean) {
  const z = (a: string, b: string) => tx([a, b], l);
  const stops = [
    { id: 's0', c: B, x: 52, t: '0' },
    { id: 's8', c: Y, x: 150, t: '8' },
    { id: 's16', c: G, x: 248, t: '16' },
  ];
  const thread = g('thread', D, `<path d="M20 150 H280" stroke="${D}" stroke-width="${math ? 3 : 4}" fill="none" stroke-linecap="round"/>`);
  const beads = stops.map((s) => g(s.id, s.c, math
    ? `<circle cx="${s.x}" cy="150" r="13" fill="${s.c}"/>${label(s.x, 155, s.t, s.c === B ? 'var(--ink)' : INK)}`
    : `<circle cx="${s.x}" cy="150" r="12" fill="${s.c}"/><circle cx="${s.x - 3}" cy="146" r="3" fill="var(--card)" opacity="0.35"/>`)).join('');
  const lifeOnly = math ? '' : `${person(52, 168, B)}${person(248, 168, G, 'up')}
<path d="M132 86 h36 v30 h-36 z" fill="var(--link)"/><path d="M128 86 l22-16 22 16 z" fill="${Y}"/>
<rect x="146" y="98" width="8" height="12" fill="${PAGE}"/>
<rect x="28" y="96" width="22" height="18" rx="4" fill="${B}"/><path d="M32 108 h14 M32 104 h10" stroke="${INK}" stroke-width="1"/>`;
  const aria = math
    ? z('从第 0 站串到这一站', 'from stop 0 to this one')
    : z('一根线串起几颗珠子', 'One thread through several beads');
  return svg(aria, `${BG}${math ? '' : ground(150, 'var(--card)')}${lifeOnly}${thread}${beads}`, math);
}

const SCENE: Record<string, (l: L, math: boolean) => string> = {
  '6': scene6, '7': scene7, '8a': scene8a, '8b': scene8b, '9': scene9, E: sceneE, '10': scene10, '11': scene11, '12': scene12, '16': scene16,
};

export function castLife(key: string, l: L): string {
  const fn = SCENE[key]; return fn ? fn(l, false) : '';
}
export function castMath(key: string, l: L): string {
  const fn = SCENE[key]; return fn ? fn(l, true) : '';
}
