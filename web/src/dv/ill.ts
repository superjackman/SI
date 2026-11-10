/* One everyday picture per station. Shapes only (no SVG text, so phone text checks stay quiet).
   The ten 看懂大模型 stations are drawn in ./cast (a person and objects that morph into the diagram).
   Lazy: imported by the station chunks, never the first load. */
import { tx, type L } from '../l4/txt';
import { CAST_KEYS, castLife } from './cast';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const frame = (label: string, body: string, h = 132) => `<svg class="ly-life" viewBox="0 0 300 ${h}" role="img" aria-label="${esc(label)}"><rect width="300" height="${h}" rx="12" fill="var(--card)"/>${body}</svg>`;

const Y = 'var(--highlight)', G = 'var(--good)', P = 'var(--link)', B = 'var(--link)', R = 'var(--bad)', D = 'var(--link)';

/** a short caption under the plain drawings, tied to that station's story */
export const LIFE_CAP: Record<string, readonly [string, string]> = {
  P: ['两枚硬币一正一反，空中还有一枚没落地：所有朝向的可能性要刚好分完。', 'Two coins, heads and tails, and one still in the air: every face’s chance has to use up the whole share.'],
  '3': ['对角两个点站一边。直线怎么切都有一个站错，弯的那条才把它们分开。', 'The matching dots sit on the diagonals. Every straight cut leaves one wrong; the bend is what separates them.'],
  '4': ['三块一块比一块小。人把最后一块的变化沿着虚线指回第一块。', 'Three blocks, each smaller. The person points the last block’s change back along the dotted line to the first.'],
  '5': ['面板上三个旋钮拧向不同的角度，旁边的小袋是这一步抽出来的样本。', 'Three knobs on the panel point different ways, and the little bag is the sample drawn for this step.'],
  '13': ['书架上抽出一本，人把那一页拉到眼前，另一页留在桌上没被选中。', 'One book is pulled from the shelf and the page is drawn close. The other page stays on the desk, unchosen.'],
  '14': ['工具箱打开，扳手拿在外面，旁边的环还在转：写下要办的一件事，再看它带回什么。', 'The toolbox is open, the wrench is out, and the ring beside it is still turning: write the one job, then see what it brings back.'],
  S: ['门上了锁。纸条停在门外，不能当成新的吩咐放进来。', 'The gate is locked. The note stops outside and is not let in as a new order.'],
  '15a': ['眼睛被切成小方块，方块排好，才和文字走同一条路。', 'The eye is cut into small squares. Once the squares line up, they walk the same path as the words.'],
  '15b': ['想法一节比一节长，最长的那一节上打了勾：留下出现最多的那个。', 'Each thought is longer than the last, and the longest one is ticked: keep the answer that shows up most.'],
  A: ['代码、文稿、屏幕三扇窗用线连在一起，编成一个能用的应用。', 'Code, a page and a screen, three windows joined by a line, arranged into one usable application.'],
};

const SCENE: Record<string, readonly [string, string, string]> = {
  '0': ['一串点，和穿过它们的一条线', 'Dots, and one line through them',
    `<circle cx="48" cy="88" r="6" fill="${R}"/><circle cx="96" cy="70" r="6" fill="${Y}"/><circle cx="150" cy="58" r="6" fill="${G}"/><circle cx="210" cy="40" r="6" fill="${B}"/><circle cx="258" cy="28" r="6" fill="${P}"/><path d="M30 100 C90 80 180 50 280 22" fill="none" stroke="${Y}" stroke-width="3"/>`],
  P: ['两枚硬币，正面和反面', 'Two coins, heads and tails',
    `<rect x="4" y="4" width="292" height="142" rx="10" fill="var(--bg)"/>
<circle cx="78" cy="78" r="62" fill="var(--card)" stroke="${Y}" stroke-width="8"/><circle cx="78" cy="78" r="14" fill="${Y}"/>
<path d="M78 48 v60 M48 78 h60" stroke="${Y}" stroke-width="6" stroke-linecap="round"/>
<circle cx="222" cy="78" r="62" fill="var(--card)" stroke="${B}" stroke-width="8"/>
<path d="M178 78 h88" stroke="${B}" stroke-width="8" stroke-linecap="round"/>
<circle cx="150" cy="36" r="28" fill="var(--card)" stroke="${G}" stroke-width="6"/><path d="M134 36 h32" stroke="${G}" stroke-width="5"/>`],
  '1': ['三根高低不同的柱子', 'Three bars of different heights',
    `<rect x="40" y="70" width="28" height="40" rx="4" fill="${B}"/><rect x="90" y="36" width="28" height="74" rx="4" fill="${Y}"/><rect x="140" y="88" width="28" height="22" rx="4" fill="${R}"/><path d="M190 96c20-40 40-8 60-28" fill="none" stroke="${G}" stroke-width="3"/>`],
  '2': ['雾里的一道下坡', 'A slope down through fog',
    `<path d="M20 30 C80 28 100 70 160 78 C210 86 240 100 290 108" fill="none" stroke="${D}" stroke-width="8" opacity="0.35"/><path d="M24 40 L70 48 L110 70 L150 74" fill="none" stroke="${Y}" stroke-width="3"/><circle cx="150" cy="74" r="6" fill="${R}"/><circle cx="250" cy="108" r="7" fill="${G}"/>`],
  '3': ['四个点，一条直线切不开', 'Four dots a straight line cannot split',
    `<rect x="4" y="4" width="292" height="142" rx="10" fill="var(--bg)"/>
<circle cx="70" cy="40" r="26" fill="${R}"/><circle cx="230" cy="40" r="26" fill="${G}"/>
<circle cx="70" cy="110" r="26" fill="${G}"/><circle cx="230" cy="110" r="26" fill="${R}"/>
<path d="M36 128 L264 18" fill="none" stroke="${Y}" stroke-width="5" stroke-dasharray="10 7"/>
<path d="M40 78 C100 18 180 132 268 60" fill="none" stroke="${B}" stroke-width="7"/>`],
  '4': ['三块越来越小的色块', 'Three blocks, each smaller than the last',
    `<rect x="4" y="4" width="292" height="142" rx="10" fill="var(--bg)"/>
<rect x="12" y="18" width="88" height="118" rx="8" fill="${R}"/>
<rect x="112" y="48" width="72" height="88" rx="8" fill="${Y}"/>
<rect x="196" y="78" width="52" height="58" rx="8" fill="${G}"/>
<path d="M250 40 C210 8 120 8 56 28" fill="none" stroke="${B}" stroke-width="6"/>
<path d="M56 28 l16 -2 -4 16 z" fill="${B}"/>`],
  '5': ['三个旋钮', 'Three knobs',
    `<rect x="4" y="4" width="292" height="142" rx="10" fill="var(--bg)"/>
<circle cx="58" cy="78" r="46" fill="none" stroke="${B}" stroke-width="14"/><path d="M58 78 L90 52" stroke="${Y}" stroke-width="7" stroke-linecap="round"/>
<circle cx="158" cy="78" r="46" fill="none" stroke="${G}" stroke-width="14"/><path d="M158 78 L158 36" stroke="${Y}" stroke-width="7" stroke-linecap="round"/>
<circle cx="250" cy="78" r="42" fill="none" stroke="${P}" stroke-width="14"/><path d="M250 78 L222 108" stroke="${Y}" stroke-width="7" stroke-linecap="round"/>
<rect x="214" y="8" width="74" height="28" rx="6" fill="${Y}"/><circle cx="232" cy="22" r="6" fill="var(--ink)"/><circle cx="256" cy="22" r="6" fill="var(--ink)"/>`],
  '13': ['一排书，其中一本被抽出来', 'A row of books, one pulled out',
    `<rect x="4" y="4" width="292" height="142" rx="10" fill="var(--bg)"/>
<rect x="8" y="28" width="36" height="114" fill="${B}"/><rect x="48" y="40" width="36" height="102" fill="${P}"/>
<rect x="88" y="8" width="48" height="134" fill="${Y}"/><path d="M98 28 h28 M98 48 h22 M98 68 h28 M98 88 h18 M98 108 h26" stroke="var(--ink)" stroke-width="3"/>
<rect x="142" y="36" width="36" height="106" fill="${G}"/><rect x="182" y="48" width="36" height="94" fill="${R}"/>
<rect x="228" y="18" width="64" height="86" rx="6" fill="var(--card)" stroke="${Y}" stroke-width="4"/><path d="M240 40 h40 M240 58 h32 M240 76 h36" stroke="${Y}" stroke-width="3"/>
<rect x="236" y="112" width="52" height="26" rx="4" fill="var(--card)" stroke="${D}" stroke-width="3"/>`],
  '14': ['一个工具箱，旁边一个来回的环', 'A toolbox, and a ring beside it',
    `<rect x="4" y="4" width="292" height="142" rx="10" fill="var(--bg)"/>
<rect x="12" y="48" width="150" height="90" rx="10" fill="var(--card)" stroke="${Y}" stroke-width="6"/>
<path d="M48 48 V22 H124 V48" fill="none" stroke="${Y}" stroke-width="8"/>
<rect x="32" y="78" width="48" height="16" rx="4" fill="${B}"/><rect x="92" y="72" width="46" height="28" rx="4" fill="${G}"/>
<path d="M178 118 C250 130 286 40 214 22 C160 10 150 78 196 86" fill="none" stroke="${G}" stroke-width="8"/>
<path d="M188 78 l16 12 -6 4 z" fill="${G}"/>`],
  S: ['一扇门挡住一张纸条', 'A gate stopping a slipped-in note',
    `<rect x="4" y="4" width="292" height="142" rx="10" fill="var(--bg)"/>
<rect x="150" y="8" width="138" height="134" rx="6" fill="var(--card)" stroke="${D}" stroke-width="6"/>
<rect x="196" y="64" width="28" height="22" rx="3" fill="${Y}"/><path d="M202 64 v-12 a8 8 0 0 1 16 0 v12" fill="none" stroke="${Y}" stroke-width="4"/>
<rect x="12" y="46" width="118" height="64" rx="6" fill="${R}" transform="rotate(-6 70 78)"/>
<path d="M28 70 h84 M28 88 h64" stroke="var(--ink)" stroke-width="4"/>
<path d="M118 100 H148" stroke="${G}" stroke-width="6" stroke-dasharray="6 5"/>`],
  '15a': ['一只眼睛，被切成小方块', 'An eye, cut into small squares',
    `<rect x="4" y="4" width="292" height="142" rx="10" fill="var(--bg)"/>
<circle cx="78" cy="75" r="62" fill="var(--card)" stroke="${B}" stroke-width="8"/><circle cx="78" cy="75" r="24" fill="${Y}"/>
<path d="M78 18 v-8 M78 132 v8 M16 75 h-6 M140 75 h8" stroke="${D}" stroke-width="4"/>
<rect x="162" y="10" width="40" height="40" fill="${P}"/><rect x="206" y="10" width="40" height="40" fill="${B}"/><rect x="250" y="10" width="42" height="40" fill="${G}"/>
<rect x="162" y="54" width="40" height="40" fill="${Y}"/><rect x="206" y="54" width="40" height="40" fill="${R}"/><rect x="250" y="54" width="42" height="40" fill="${P}"/>
<rect x="162" y="98" width="40" height="42" fill="${B}"/><rect x="206" y="98" width="40" height="42" fill="${G}"/><rect x="250" y="98" width="42" height="42" fill="${Y}"/>`],
  '15b': ['一串越来越长的想法', 'A chain of thoughts, each longer',
    `<rect x="4" y="4" width="292" height="142" rx="10" fill="var(--bg)"/>
<circle cx="36" cy="108" r="26" fill="${B}"/>
<rect x="70" y="78" width="52" height="52" rx="16" fill="${P}"/>
<rect x="132" y="46" width="70" height="70" rx="18" fill="${Y}"/>
<rect x="212" y="12" width="80" height="100" rx="20" fill="${G}"/>
<path d="M236 48 l12 14 22 -26" fill="none" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/>
<rect x="8" y="12" width="70" height="28" rx="6" fill="${R}"/>`],
  A: ['桌面上的三个窗口：代码、文稿、屏幕', 'Three windows on a desk: code, a page, a screen',
    `<rect x="4" y="4" width="292" height="142" rx="10" fill="var(--bg)"/>
<rect x="8" y="8" width="90" height="134" rx="8" fill="var(--card)" stroke="${B}" stroke-width="5"/><path d="M20 32 H84 M20 54 H72 M20 76 H80 M20 98 H60 M20 120 H76" stroke="${B}" stroke-width="4"/>
<rect x="106" y="8" width="90" height="134" rx="8" fill="var(--card)" stroke="${Y}" stroke-width="5"/><path d="M118 40 H182 M118 68 H160 M118 96 H176" stroke="${Y}" stroke-width="5"/>
<rect x="204" y="8" width="90" height="134" rx="8" fill="var(--card)" stroke="${G}" stroke-width="5"/><circle cx="248" cy="78" r="32" fill="${G}"/>
<path d="M98 74 H106 M196 74 H204" stroke="${D}" stroke-width="6"/>`],
};

/** the station's own everyday picture (empty string if the key is unknown) */
export function life(key: string, l: L): string {
  if (CAST_KEYS.has(key)) return castLife(key, l);
  const s = SCENE[key]; if (!s) return '';
  const tall = new Set(['P', '3', '4', '5', '13', '14', 'S', '15a', '15b', 'A']);
  return frame(tx([s[0], s[1]], l), s[2], tall.has(key) ? 150 : 132);
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
  '14': ['写下要办的事，环在旁边转', 'Write the job; the ring sits beside it',
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
