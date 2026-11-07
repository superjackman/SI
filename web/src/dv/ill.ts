/* One everyday picture per station. Shapes only (no SVG text, so phone text checks stay quiet).
   The ten 看懂大模型 stations are drawn in ./cast (a person and objects that morph into the diagram).
   Lazy: imported by the station chunks, never the first load. */
import { tx, type L } from '../l4/txt';
import { CAST_KEYS, castLife } from './cast';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const frame = (label: string, body: string, h = 132) => `<svg class="ly-life" viewBox="0 0 300 ${h}" role="img" aria-label="${esc(label)}"><rect width="300" height="${h}" rx="12" fill="var(--card)"/>${body}</svg>`;
const ground = (y: number, h = 176) => `<rect x="0" y="${y}" width="300" height="${h - y}" fill="var(--bg)"/>`;
const person = (x: number, foot: number, shirt: string) => `<circle cx="${x}" cy="${foot - 36}" r="8" fill="var(--card)" stroke="var(--ink)" stroke-width="2"/><path d="M${x - 12} ${foot - 8} q12 -18 24 0 v8 h-24 z" fill="${shirt}"/><path d="M${x - 5} ${foot - 4} l-3 16 M${x + 5} ${foot - 4} l3 16" stroke="var(--ink)" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;

const Y = 'var(--highlight)', G = 'var(--good)', P = 'var(--link)', B = 'var(--link)', R = 'var(--bad)', D = 'var(--link)';

/** a short caption under the plain drawings, tied to that station's story */
export const LIFE_CAP: Record<string, readonly [string, string]> = {
  P: ['两枚硬币一正一反，空中还有一枚没落地：所有朝向的可能性要刚好分完。', 'Two coins, heads and tails, and one still in the air: every face’s chance has to use up the whole share.'],
  '3': ['对角两个点站一边。直线怎么切都有一个站错，弯的那条才把它们分开。', 'The matching dots sit on the diagonals. Every straight cut leaves one wrong; the bend is what separates them.'],
  '4': ['三块一块比一块小。人把最后一块的变化沿着虚线指回第一块。', 'Three blocks, each smaller. The person points the last block’s change back along the dotted line to the first.'],
  '5': ['面板上三个旋钮拧向不同的角度，旁边的小袋是这一步抽出来的样本。', 'Three knobs on the panel point different ways, and the little bag is the sample drawn for this step.'],
  '13': ['书架上抽出一本，人把那一页拉到眼前，另一页留在桌上没被选中。', 'One book is pulled from the shelf and the page is drawn close. The other page stays on the desk, unchosen.'],
  '14': ['工具箱打开，扳手拿在外面，旁边的环还在转：写下一个调用，再看它带回什么。', 'The toolbox is open, the wrench is out, and the loop beside it is still turning: write one call, then see what it brings back.'],
  S: ['门上了锁。纸条停在门外，不能当成新的吩咐放进来。', 'The gate is locked. The note stops outside and is not let in as a new order.'],
  '15a': ['眼睛被切成小方块，方块排好，才和文字走同一条路。', 'The eye is cut into small squares. Once the squares line up, they walk the same path as the words.'],
  '15b': ['想法一节比一节长，最长的那一节上打了勾：留下出现最多的那个。', 'Each thought is longer than the last, and the longest one is ticked: keep the answer that shows up most.'],
  A: ['代码、文稿、屏幕三扇窗用线连在一起，编成一个能用的应用。', 'Code, a page and a screen, three windows joined by a line, arranged into one usable application.'],
};

const SCENE: Record<string, readonly [string, string, string]> = {
  '0': ['一串点，和穿过它们的一条线', 'Dots, and one line through them',
    `<circle cx="48" cy="88" r="6" fill="${R}"/><circle cx="96" cy="70" r="6" fill="${Y}"/><circle cx="150" cy="58" r="6" fill="${G}"/><circle cx="210" cy="40" r="6" fill="${B}"/><circle cx="258" cy="28" r="6" fill="${P}"/><path d="M30 100 C90 80 180 50 280 22" fill="none" stroke="${Y}" stroke-width="3"/>`],
  P: ['两枚硬币，正面和反面', 'Two coins, heads and tails',
    `${ground(148)}${person(46, 164, B)}${person(250, 164, Y)}
<rect x="70" y="118" width="160" height="14" rx="3" fill="var(--card)" stroke="${D}" stroke-width="2"/>
<circle cx="108" cy="78" r="34" fill="var(--card)" stroke="${Y}" stroke-width="3"/><circle cx="108" cy="78" r="8" fill="${Y}"/>
<path d="M96 70 h24 M108 58 v24" stroke="${Y}" stroke-width="2"/>
<circle cx="192" cy="78" r="34" fill="var(--card)" stroke="${B}" stroke-width="3"/>
<path d="M176 78 h32" stroke="${B}" stroke-width="3"/>
<path d="M150 40 h8 v28 h-8 z" fill="${G}"/><path d="M146 48 h16" stroke="var(--ink)" stroke-width="2"/>
<circle cx="150" cy="22" r="14" fill="var(--card)" stroke="${Y}" stroke-width="2"/><path d="M140 22 h20" stroke="${Y}" stroke-width="2"/>`],
  '1': ['三根高低不同的柱子', 'Three bars of different heights',
    `<rect x="40" y="70" width="28" height="40" rx="4" fill="${B}"/><rect x="90" y="36" width="28" height="74" rx="4" fill="${Y}"/><rect x="140" y="88" width="28" height="22" rx="4" fill="${R}"/><path d="M190 96c20-40 40-8 60-28" fill="none" stroke="${G}" stroke-width="3"/>`],
  '2': ['雾里的一道下坡', 'A slope down through fog',
    `<path d="M20 30 C80 28 100 70 160 78 C210 86 240 100 290 108" fill="none" stroke="${D}" stroke-width="8" opacity="0.35"/><path d="M24 40 L70 48 L110 70 L150 74" fill="none" stroke="${Y}" stroke-width="3"/><circle cx="150" cy="74" r="6" fill="${R}"/><circle cx="250" cy="108" r="7" fill="${G}"/>`],
  '3': ['四个点，一条直线切不开', 'Four dots a straight line cannot split',
    `${ground(150)}<rect x="28" y="18" width="200" height="124" rx="8" fill="var(--card)" stroke="${D}" stroke-width="2"/>
<circle cx="70" cy="42" r="11" fill="${R}"/><circle cx="186" cy="42" r="11" fill="${G}"/><circle cx="70" cy="108" r="11" fill="${G}"/><circle cx="186" cy="108" r="11" fill="${R}"/>
<path d="M44 118 L210 28" fill="none" stroke="${Y}" stroke-width="2.4" stroke-dasharray="6 4"/>
<path d="M48 78 C90 28 140 130 196 70" fill="none" stroke="${B}" stroke-width="3"/>
<path d="M36 18 L64 18 L64 46" fill="none" stroke="${Y}" stroke-width="2"/>
${person(258, 164, Y)}`],
  '4': ['三块越来越小的色块', 'Three blocks, each smaller than the last',
    `${ground(150)}${person(36, 164, B)}
<rect x="70" y="36" width="64" height="96" rx="8" fill="${R}"/>
<rect x="148" y="64" width="46" height="68" rx="8" fill="${Y}"/>
<rect x="208" y="96" width="30" height="36" rx="8" fill="${G}"/>
<path d="M102 36 C130 18 168 18 196 36" fill="none" stroke="${D}" stroke-width="2.4" stroke-dasharray="5 3"/>
<path d="M250 110 h28" stroke="${D}" stroke-width="3" marker-end="url(#none)"/>
<path d="M246 78 l18 8 -18 8 z" fill="${B}"/>
<circle cx="102" cy="84" r="12" fill="none" stroke="var(--ink)" stroke-width="2"/><path d="M102 72 v24 M90 84 h24" stroke="var(--ink)" stroke-width="2"/>`],
  '5': ['三个旋钮', 'Three knobs',
    `${ground(150)}<rect x="24" y="28" width="188" height="108" rx="10" fill="var(--card)" stroke="${D}" stroke-width="2.4"/>
<circle cx="62" cy="78" r="26" fill="none" stroke="${B}" stroke-width="7"/><path d="M62 78 L80 62" stroke="${Y}" stroke-width="3" stroke-linecap="round"/>
<circle cx="118" cy="78" r="26" fill="none" stroke="${G}" stroke-width="7"/><path d="M118 78 L118 54" stroke="${Y}" stroke-width="3" stroke-linecap="round"/>
<circle cx="174" cy="78" r="26" fill="none" stroke="${P}" stroke-width="7"/><path d="M174 78 L158 94" stroke="${Y}" stroke-width="3" stroke-linecap="round"/>
<path d="M228 120 C248 90 268 70 286 48" fill="none" stroke="${Y}" stroke-width="3"/>
<rect x="214" y="36" width="26" height="20" rx="4" fill="${Y}"/><circle cx="222" cy="46" r="3" fill="var(--ink)"/><circle cx="232" cy="46" r="3" fill="var(--ink)"/>
${person(262, 164, B)}`],
  '13': ['一排书，其中一本被抽出来', 'A row of books, one pulled out',
    `${ground(150)}<rect x="18" y="86" width="176" height="14" rx="2" fill="${D}"/>
<rect x="26" y="40" width="24" height="58" fill="${B}"/><rect x="54" y="46" width="24" height="52" fill="${P}"/>
<rect x="82" y="16" width="28" height="82" fill="${Y}"/><path d="M88 30 h16 M88 42 h12 M88 54 h16 M88 66 h10" stroke="var(--ink)" stroke-width="1.6"/>
<rect x="114" y="44" width="24" height="54" fill="${G}"/><rect x="142" y="48" width="24" height="50" fill="${R}"/>
<rect x="186" y="58" width="52" height="36" rx="3" fill="var(--card)" stroke="${Y}" stroke-width="2"/><path d="M194 70 h36 M194 80 h28" stroke="${Y}" stroke-width="1.6"/>
<path d="M168 40 H188" stroke="${Y}" stroke-width="2.4"/>
<rect x="214" y="108" width="40" height="22" rx="2" fill="var(--bg)" stroke="${D}" stroke-width="1.6"/>
${person(262, 158, B)}<path d="M240 100 H210" stroke="${B}" stroke-width="3" stroke-linecap="round"/>
<circle cx="250" cy="36" r="12" fill="var(--card)" stroke="${Y}" stroke-width="2"/><path d="M246 40 h8 M250 32 v8" stroke="${Y}" stroke-width="2"/>`],
  '14': ['一个工具箱，旁边一个来回的环', 'A toolbox, and a loop beside it',
    `${ground(150)}${person(40, 164, B)}
<rect x="78" y="78" width="96" height="52" rx="6" fill="var(--card)" stroke="${Y}" stroke-width="3"/>
<path d="M104 78 V58 H148 V78" fill="none" stroke="${Y}" stroke-width="3"/>
<rect x="96" y="92" width="28" height="8" rx="2" fill="${B}"/><rect x="132" y="90" width="22" height="14" rx="2" fill="${G}"/>
<path d="M118 104 l18 16" stroke="${B}" stroke-width="3" stroke-linecap="round"/><circle cx="140" cy="124" r="5" fill="none" stroke="${B}" stroke-width="2"/>
<path d="M196 118 C236 118 250 48 210 42 C176 36 174 86 204 90" fill="none" stroke="${G}" stroke-width="3"/>
<path d="M198 84 l8 8 -2 2 z" fill="${G}"/>`],
  S: ['一扇门挡住一张纸条', 'A gate stopping a slipped-in note',
    `${ground(150)}<rect x="150" y="28" width="78" height="112" rx="4" fill="var(--card)" stroke="${D}" stroke-width="3"/>
<rect x="206" y="74" width="16" height="14" rx="2" fill="${Y}"/><path d="M210 74 v-6 a4 4 0 0 1 8 0 v6" fill="none" stroke="${Y}" stroke-width="2"/>
${person(246, 164, B)}
<rect x="36" y="70" width="78" height="40" rx="4" fill="${R}" transform="rotate(-8 75 90)"/>
<path d="M48 84 h48 M48 94 h36" stroke="var(--ink)" stroke-width="1.6"/>
<path d="M118 96 H146" stroke="${G}" stroke-width="3" stroke-dasharray="4 3"/>`],
  '15a': ['一只眼睛，被切成小方块', 'An eye, cut into small squares',
    `${ground(150)}${person(36, 164, B)}
<circle cx="108" cy="78" r="42" fill="none" stroke="${B}" stroke-width="3"/><circle cx="108" cy="78" r="16" fill="${Y}"/>
<path d="M70 78 h-16 M146 78 h16 M108 40 v-14 M108 116 v14" stroke="${D}" stroke-width="2"/>
<rect x="188" y="36" width="28" height="28" fill="${P}"/><rect x="220" y="36" width="28" height="28" fill="${B}"/>
<rect x="252" y="36" width="28" height="28" fill="${G}"/><rect x="188" y="68" width="28" height="28" fill="${Y}"/>
<rect x="220" y="68" width="28" height="28" fill="${R}"/><rect x="252" y="68" width="28" height="28" fill="${P}"/>
<path d="M168 86 H184" stroke="${Y}" stroke-width="3"/>
<path d="M78 50 H138 M108 28 V128" stroke="${D}" stroke-width="1.4" stroke-dasharray="3 3"/>`],
  '15b': ['一串越来越长的想法', 'A chain of thoughts, each longer',
    `${ground(150)}${person(40, 164, B)}
<circle cx="78" cy="118" r="12" fill="${B}"/>
<rect x="100" y="96" width="40" height="28" rx="12" fill="${P}"/>
<rect x="148" y="72" width="58" height="40" rx="14" fill="${Y}"/>
<rect x="214" y="40" width="72" height="52" rx="16" fill="${G}"/>
<path d="M24 28 H276" stroke="${D}" stroke-width="8" stroke-linecap="round" opacity="0.35"/>
<rect x="120" y="20" width="36" height="16" rx="3" fill="${R}"/>
<path d="M248 58 l6 6 14 -14" fill="none" stroke="var(--ink)" stroke-width="2.4"/>`],
  A: ['桌面上的三个窗口：代码、文稿、屏幕', 'Three windows on a desk: code, a page, a screen',
    `${ground(150)}<rect x="16" y="128" width="268" height="16" rx="3" fill="${D}"/>
${person(150, 164, Y)}
<rect x="20" y="28" width="78" height="86" rx="6" fill="var(--card)" stroke="${B}" stroke-width="2.4"/><path d="M32 48 H86 M32 62 H74 M32 76 H80 M32 90 H60" stroke="${B}" stroke-width="2.4"/>
<rect x="110" y="28" width="78" height="86" rx="6" fill="var(--card)" stroke="${Y}" stroke-width="2.4"/><path d="M122 52 H176 M122 70 H160 M122 88 H168" stroke="${Y}" stroke-width="2.4"/>
<rect x="200" y="28" width="78" height="86" rx="6" fill="var(--card)" stroke="${G}" stroke-width="2.4"/><circle cx="238" cy="72" r="18" fill="${G}" opacity="0.85"/>
<path d="M98 72 H110 M188 72 H200" stroke="${D}" stroke-width="2.4"/>`],
};

/** the station's own everyday picture (empty string if the key is unknown) */
export function life(key: string, l: L): string {
  if (CAST_KEYS.has(key)) return castLife(key, l);
  const s = SCENE[key]; if (!s) return '';
  const tall = new Set(['P', '3', '4', '5', '13', '14', 'S', '15a', '15b', 'A']);
  return frame(tx([s[0], s[1]], l), s[2], tall.has(key) ? 168 : 132);
}

/** the same scene after it has become the diagram. Paired with SCENE, not the cast stations. */
const MATH: Record<string, readonly [string, string, string]> = {
  '0': ['一条直线穿过样本', 'A line through the samples',
    `<path d="M24 108 L270 28" stroke="${Y}" stroke-width="3"/><circle cx="70" cy="92" r="5" fill="${R}"/><circle cx="140" cy="68" r="5" fill="${G}"/><circle cx="220" cy="42" r="5" fill="${B}"/>`],
  P: ['四根概率柱，加起来满格', 'Four probability bars that fill the row',
    `<rect x="36" y="70" width="36" height="40" fill="${B}"/><rect x="90" y="40" width="36" height="70" fill="${Y}"/><rect x="144" y="88" width="36" height="22" fill="${G}"/><rect x="198" y="100" width="36" height="10" fill="${R}"/>`],
  '1': ['罚分曲线：越靠近 0 越高', 'A penalty curve that rises toward 0',
    `<path d="M30 28 C70 30 90 100 270 108" fill="none" stroke="${P}" stroke-width="3"/><circle cx="60" cy="32" r="5" fill="${R}"/><circle cx="200" cy="96" r="5" fill="${G}"/>`],
  '2': ['损失曲线和球', 'The loss curve and the ball',
    `<path d="M24 36 Q150 150 276 36" fill="none" stroke="${B}" stroke-width="3"/><circle cx="78" cy="78" r="7" fill="${R}"/><line x1="150" y1="24" x2="150" y2="118" stroke="${G}" stroke-dasharray="4 3"/>`],
  '3': ['弯一下才能分开', 'A bend, then the points separate',
    `<path d="M40 66 C90 20 150 110 260 50" fill="none" stroke="${Y}" stroke-width="3"/><circle cx="70" cy="40" r="7" fill="${R}"/><circle cx="200" cy="40" r="7" fill="${G}"/><circle cx="70" cy="96" r="7" fill="${G}"/><circle cx="200" cy="96" r="7" fill="${R}"/>`],
  '4': ['坡度一层层传回去', 'The slope passed back, layer by layer',
    `<rect x="36" y="48" width="50" height="36" fill="${R}"/><path d="M90 66 H120" stroke="${D}" stroke-width="3"/><rect x="124" y="54" width="40" height="24" fill="${Y}"/><path d="M168 66 H198" stroke="${D}" stroke-width="3"/><rect x="202" y="58" width="28" height="16" fill="${G}"/>`],
  '5': ['三个旋钮拧到不同角度', 'Three knobs at different angles',
    `<circle cx="70" cy="66" r="22" fill="none" stroke="${B}" stroke-width="6"/><circle cx="150" cy="66" r="22" fill="none" stroke="${G}" stroke-width="6"/><circle cx="230" cy="66" r="22" fill="none" stroke="${P}" stroke-width="6"/>`],
  '13': ['问题指向抽出的那一本', 'The question points at the book that was pulled',
    `<rect x="40" y="40" width="22" height="60" fill="${B}"/><rect x="70" y="24" width="22" height="76" fill="${Y}"/><rect x="100" y="40" width="22" height="60" fill="${G}"/><path d="M150 66 H240" stroke="${R}" stroke-width="3"/>`],
  '14': ['写下调用，环在旁边转', 'Write the call; the loop sits beside it',
    `<rect x="36" y="46" width="90" height="40" fill="none" stroke="${Y}" stroke-width="3"/><path d="M170 90 C220 90 230 40 190 40 C160 40 160 72 188 74" fill="none" stroke="${G}" stroke-width="3"/>`],
  S: ['门关着，纸条停在门外', 'The gate is shut; the note stops outside',
    `<rect x="150" y="28" width="14" height="80" fill="${D}"/><rect x="40" y="52" width="70" height="28" fill="${R}"/><path d="M170 66 H250" stroke="${G}" stroke-width="3" stroke-dasharray="4 3"/>`],
  '15a': ['小方块排成一行', 'Small squares in a row',
    `<rect x="36" y="48" width="28" height="28" fill="${P}"/><rect x="72" y="48" width="28" height="28" fill="${B}"/><rect x="108" y="48" width="28" height="28" fill="${Y}"/><rect x="144" y="48" width="28" height="28" fill="${G}"/><rect x="180" y="48" width="28" height="28" fill="${R}"/>`],
  '15b': ['想得越久，链条越长', 'Thinking longer makes a longer chain',
    `<rect x="30" y="58" width="40" height="18" rx="9" fill="${B}"/><rect x="80" y="52" width="60" height="28" rx="12" fill="${Y}"/><rect x="152" y="44" width="90" height="40" rx="16" fill="${G}"/>`],
  A: ['三个窗口都标了结果', 'Three windows, each with a result',
    `<rect x="28" y="36" width="70" height="64" fill="none" stroke="${B}" stroke-width="3"/><rect x="114" y="36" width="70" height="64" fill="none" stroke="${Y}" stroke-width="3"/><rect x="200" y="36" width="70" height="64" fill="none" stroke="${G}" stroke-width="3"/>`],
};

export function mathPic(key: string, l: L): string {
  const s = MATH[key]; if (!s) return '';
  return frame(tx([s[0], s[1]], l), s[2]);
}
