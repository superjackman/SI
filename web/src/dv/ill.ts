/* One everyday picture per station. Shapes only (no SVG text, so phone text checks stay quiet).
   The ten 看懂大模型 stations are drawn in ./cast (a person and objects that morph into the diagram).
   Lazy: imported by the station chunks, never the first load. */
import { tx, type L } from '../l4/txt';
import { CAST_KEYS, castLife } from './cast';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const frame = (label: string, body: string) => `<svg class="ly-life" viewBox="0 0 300 132" role="img" aria-label="${esc(label)}"><rect width="300" height="132" rx="12" fill="var(--card)"/>${body}</svg>`;

const Y = 'var(--highlight)', G = 'var(--good)', P = 'var(--link)', B = 'var(--link)', R = 'var(--bad)', D = 'var(--link)';

const SCENE: Record<string, readonly [string, string, string]> = {
  '0': ['一串点，和穿过它们的一条线', 'Dots, and one line through them',
    `<circle cx="48" cy="88" r="6" fill="${R}"/><circle cx="96" cy="70" r="6" fill="${Y}"/><circle cx="150" cy="58" r="6" fill="${G}"/><circle cx="210" cy="40" r="6" fill="${B}"/><circle cx="258" cy="28" r="6" fill="${P}"/><path d="M30 100 C90 80 180 50 280 22" fill="none" stroke="${Y}" stroke-width="3"/>`],
  P: ['两枚硬币，正面和反面', 'Two coins, heads and tails',
    `<circle cx="90" cy="66" r="36" fill="var(--card)" stroke="${Y}" stroke-width="3"/><circle cx="90" cy="66" r="8" fill="${Y}"/><circle cx="210" cy="66" r="36" fill="var(--card)" stroke="${B}" stroke-width="3"/><path d="M190 66h40" stroke="${B}" stroke-width="3"/>`],
  '1': ['三根高低不同的柱子', 'Three bars of different heights',
    `<rect x="40" y="70" width="28" height="40" rx="4" fill="${B}"/><rect x="90" y="36" width="28" height="74" rx="4" fill="${Y}"/><rect x="140" y="88" width="28" height="22" rx="4" fill="${R}"/><path d="M190 96c20-40 40-8 60-28" fill="none" stroke="${G}" stroke-width="3"/>`],
  '2': ['雾里的一道下坡', 'A slope down through fog',
    `<path d="M20 30 C80 28 100 70 160 78 C210 86 240 100 290 108" fill="none" stroke="${D}" stroke-width="8" opacity="0.35"/><path d="M24 40 L70 48 L110 70 L150 74" fill="none" stroke="${Y}" stroke-width="3"/><circle cx="150" cy="74" r="6" fill="${R}"/><circle cx="250" cy="108" r="7" fill="${G}"/>`],
  '3': ['四个点，一条直线切不开', 'Four dots a straight line cannot split',
    `<circle cx="70" cy="36" r="9" fill="${R}"/><circle cx="220" cy="36" r="9" fill="${G}"/><circle cx="70" cy="96" r="9" fill="${G}"/><circle cx="220" cy="96" r="9" fill="${R}"/><path d="M40 110 L250 24" fill="none" stroke="${Y}" stroke-width="2" stroke-dasharray="5 4"/>`],
  '4': ['三块越来越小的色块', 'Three blocks, each smaller than the last',
    `<rect x="36" y="28" width="70" height="76" rx="8" fill="${R}"/><rect x="120" y="46" width="48" height="58" rx="8" fill="${Y}"/><rect x="186" y="70" width="28" height="34" rx="8" fill="${G}"/><path d="M230 86h40" stroke="${D}" stroke-width="3" />`],
  '5': ['三个旋钮', 'Three knobs',
    `<circle cx="70" cy="66" r="28" fill="none" stroke="${B}" stroke-width="6"/><path d="M70 66 L88 52" stroke="${Y}" stroke-width="3"/><circle cx="150" cy="66" r="28" fill="none" stroke="${G}" stroke-width="6"/><path d="M150 66 L150 44" stroke="${Y}" stroke-width="3"/><circle cx="230" cy="66" r="28" fill="none" stroke="${P}" stroke-width="6"/><path d="M230 66 L214 80" stroke="${Y}" stroke-width="3"/>`],
  '13': ['一排书，其中一本被抽出来', 'A row of books, one pulled out',
    `<rect x="36" y="36" width="28" height="70" fill="${B}"/><rect x="70" y="36" width="28" height="70" fill="${P}"/><rect x="104" y="16" width="28" height="90" fill="${Y}"/><rect x="138" y="36" width="28" height="70" fill="${G}"/><rect x="172" y="36" width="28" height="70" fill="${R}"/>`],
  '14': ['一个工具箱，旁边一个来回的环', 'A toolbox, and a loop beside it',
    `<rect x="36" y="48" width="110" height="56" rx="8" fill="var(--card)" stroke="${Y}" stroke-width="3"/><path d="M70 48 V36 H110 V48" fill="none" stroke="${Y}" stroke-width="3"/><path d="M190 90 C230 90 240 40 200 40 C170 40 168 70 196 74" fill="none" stroke="${G}" stroke-width="3"/>`],
  S: ['一扇门挡住一张纸条', 'A gate stopping a slipped-in note',
    `<rect x="120" y="24" width="16" height="90" fill="${D}"/><rect x="40" y="48" width="70" height="36" rx="4" fill="${R}" transform="rotate(-12 75 66)"/><path d="M148 70 H230" stroke="${G}" stroke-width="3" stroke-dasharray="4 4"/>`],
  '15a': ['一只眼睛，被切成小方块', 'An eye, cut into small squares',
    `<circle cx="110" cy="66" r="36" fill="none" stroke="${B}" stroke-width="3"/><circle cx="110" cy="66" r="12" fill="${Y}"/><rect x="180" y="36" width="22" height="22" fill="${P}"/><rect x="206" y="36" width="22" height="22" fill="${B}"/><rect x="180" y="62" width="22" height="22" fill="${G}"/><rect x="206" y="62" width="22" height="22" fill="${P}"/>`],
  '15b': ['一串越来越长的想法', 'A chain of thoughts, each longer',
    `<circle cx="40" cy="70" r="10" fill="${B}"/><rect x="70" y="58" width="36" height="24" rx="12" fill="${P}"/><rect x="120" y="50" width="60" height="32" rx="14" fill="${Y}"/><rect x="196" y="42" width="80" height="40" rx="16" fill="${G}"/>`],
  A: ['桌面上的三个窗口：代码、文稿、屏幕', 'Three windows on a desk: code, a page, a screen',
    `<rect x="24" y="28" width="78" height="78" rx="6" fill="var(--card)" stroke="${B}"/><path d="M36 48 H90 M36 64 H78 M36 80 H70" stroke="${B}" stroke-width="3"/><rect x="112" y="28" width="78" height="78" rx="6" fill="var(--card)" stroke="${Y}"/><path d="M124 50 H176 M124 68 H160" stroke="${Y}" stroke-width="3"/><rect x="200" y="28" width="78" height="78" rx="6" fill="var(--card)" stroke="${G}"/><circle cx="238" cy="66" r="16" fill="${G}" opacity="0.8"/>`],
};

/** the station's own everyday picture (empty string if the key is unknown) */
export function life(key: string, l: L): string {
  if (CAST_KEYS.has(key)) return castLife(key, l);
  const s = SCENE[key]; if (!s) return '';
  return frame(tx([s[0], s[1]], l), s[2]);
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
