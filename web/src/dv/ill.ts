/* One everyday picture per station. Shapes only (no SVG text, so phone text checks stay quiet).
   Lazy: imported by the station chunks, never the first load. */
import { tx, type L } from '../l4/txt';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const frame = (label: string, body: string) => `<svg class="ly-life" viewBox="0 0 300 132" role="img" aria-label="${esc(label)}"><rect width="300" height="132" rx="12" fill="#0a1736"/>${body}</svg>`;

const Y = '#ffd166', G = '#34d399', P = '#c4b5fd', B = '#5b8cff', R = '#ff8a80', D = '#9db0d8';

const SCENE: Record<string, readonly [string, string, string]> = {
  '0': ['一串点，和穿过它们的一条线', 'Dots, and one line through them',
    `<circle cx="48" cy="88" r="6" fill="${R}"/><circle cx="96" cy="70" r="6" fill="${Y}"/><circle cx="150" cy="58" r="6" fill="${G}"/><circle cx="210" cy="40" r="6" fill="${B}"/><circle cx="258" cy="28" r="6" fill="${P}"/><path d="M30 100 C90 80 180 50 280 22" fill="none" stroke="${Y}" stroke-width="3"/>`],
  P: ['两枚硬币，正面和反面', 'Two coins, heads and tails',
    `<circle cx="90" cy="66" r="36" fill="#13224d" stroke="${Y}" stroke-width="3"/><circle cx="90" cy="66" r="8" fill="${Y}"/><circle cx="210" cy="66" r="36" fill="#13224d" stroke="${B}" stroke-width="3"/><path d="M190 66h40" stroke="${B}" stroke-width="3"/>`],
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
  '6': ['一本户口本，号码排开，看不出谁住得近', 'A household register: the numbers do not show who lives near whom',
    `<rect x="22" y="16" width="96" height="100" rx="6" fill="#13224d" stroke="${D}" stroke-width="2"/><rect x="22" y="16" width="14" height="100" rx="4" fill="#1c3f9e"/>
<rect x="46" y="34" width="58" height="8" rx="2" fill="${Y}"/><rect x="46" y="58" width="48" height="8" rx="2" fill="${G}"/><rect x="46" y="82" width="62" height="8" rx="2" fill="${B}"/>
<circle cx="156" cy="78" r="16" fill="${Y}"/><path d="M144 70 l12-16 12 16" fill="${Y}"/>
<circle cx="210" cy="78" r="16" fill="${G}"/><path d="M198 68 l8-14 12 8" fill="${G}"/>
<rect x="240" y="66" width="44" height="18" rx="5" fill="${B}"/><circle cx="252" cy="90" r="6" fill="${D}"/><circle cx="272" cy="90" r="6" fill="${D}"/>`],
  '7': ['一张纸条越传越淡，旁边一条能回头看的弧', 'A note that fades as it is passed, and an arc that looks back',
    `<circle cx="50" cy="70" r="16" fill="${Y}"/><circle cx="110" cy="70" r="14" fill="${Y}" opacity="0.55"/><circle cx="168" cy="70" r="12" fill="${Y}" opacity="0.28"/><path d="M250 90 C250 30 70 30 70 70" fill="none" stroke="${B}" stroke-width="3"/>`],
  '8a': ['三个人里，一束光打在其中一个身上', 'Three people, a light on one of them',
    `<circle cx="70" cy="78" r="16" fill="#1c3f9e"/><circle cx="150" cy="70" r="20" fill="${Y}"/><circle cx="230" cy="78" r="16" fill="#1c3f9e"/><path d="M150 18 L138 48 H162 Z" fill="${Y}" opacity="0.85"/>`],
  '8b': ['叠起来的几层楼', 'Floors stacked into one building',
    `<rect x="90" y="18" width="120" height="22" rx="4" fill="${B}"/><rect x="90" y="46" width="120" height="22" rx="4" fill="${P}"/><rect x="90" y="74" width="120" height="22" rx="4" fill="${G}"/><path d="M78 29 H90 M210 57 H230 M78 85 H90" stroke="${Y}" stroke-width="3"/>`],
  '9': ['一本打开的书，下一格还空着', 'An open book, the next square still empty',
    `<path d="M40 30 H140 V104 H40 Z" fill="#13224d" stroke="${D}"/><path d="M160 30 H260 V104 H160 Z" fill="#13224d" stroke="${D}"/><path d="M56 48 H124 M56 64 H110 M176 48 H210" stroke="${B}" stroke-width="3"/><rect x="176" y="62" width="64" height="22" rx="3" fill="none" stroke="${Y}" stroke-width="2" stroke-dasharray="4 3"/>`],
  E: ['一张卷子，角上有一处被划掉的题', 'A paper, with one question crossed out in the corner',
    `<rect x="70" y="18" width="160" height="98" rx="6" fill="#13224d" stroke="${D}"/><path d="M88 40 H200 M88 58 H180 M88 76 H160" stroke="${B}" stroke-width="3"/><path d="M188 78 L214 96 M214 78 L188 96" stroke="${R}" stroke-width="3"/>`],
  '10': ['两张卡片，有人指向其中一张', 'Two cards, a hand pointing at one',
    `<rect x="36" y="28" width="90" height="70" rx="8" fill="#13224d" stroke="${D}"/><rect x="150" y="28" width="90" height="70" rx="8" fill="#1d3270" stroke="${Y}" stroke-width="3"/><path d="M250 108 L196 86" stroke="${G}" stroke-width="4"/>`],
  '11': ['一大块冻住的方块，角上贴着一小条', 'A large frozen block, with a small strip on the corner',
    `<rect x="40" y="28" width="180" height="80" rx="8" fill="#102048" stroke="${B}" stroke-width="3"/><rect x="188" y="36" width="70" height="22" rx="5" fill="${Y}"/>`],
  '12': ['一本已经写了名字的笔记本', 'A notebook that already has the names written',
    `<rect x="70" y="20" width="150" height="96" rx="6" fill="#13224d" stroke="${D}"/><path d="M88 40 H196 M88 58 H196 M88 76 H160 M88 94 H140" stroke="${B}" stroke-width="3"/><circle cx="196" cy="94" r="8" fill="${G}"/>`],
  '13': ['一排书，其中一本被抽出来', 'A row of books, one pulled out',
    `<rect x="36" y="36" width="28" height="70" fill="${B}"/><rect x="70" y="36" width="28" height="70" fill="${P}"/><rect x="104" y="16" width="28" height="90" fill="${Y}"/><rect x="138" y="36" width="28" height="70" fill="${G}"/><rect x="172" y="36" width="28" height="70" fill="${R}"/>`],
  '14': ['一个工具箱，旁边一个来回的环', 'A toolbox, and a loop beside it',
    `<rect x="36" y="48" width="110" height="56" rx="8" fill="#13224d" stroke="${Y}" stroke-width="3"/><path d="M70 48 V36 H110 V48" fill="none" stroke="${Y}" stroke-width="3"/><path d="M190 90 C230 90 240 40 200 40 C170 40 168 70 196 74" fill="none" stroke="${G}" stroke-width="3"/>`],
  S: ['一扇门挡住一张纸条', 'A gate stopping a slipped-in note',
    `<rect x="120" y="24" width="16" height="90" fill="${D}"/><rect x="40" y="48" width="70" height="36" rx="4" fill="${R}" transform="rotate(-12 75 66)"/><path d="M148 70 H230" stroke="${G}" stroke-width="3" stroke-dasharray="4 4"/>`],
  '15a': ['一只眼睛，被切成小方块', 'An eye, cut into small squares',
    `<circle cx="110" cy="66" r="36" fill="none" stroke="${B}" stroke-width="3"/><circle cx="110" cy="66" r="12" fill="${Y}"/><rect x="180" y="36" width="22" height="22" fill="${P}"/><rect x="206" y="36" width="22" height="22" fill="${B}"/><rect x="180" y="62" width="22" height="22" fill="${G}"/><rect x="206" y="62" width="22" height="22" fill="${P}"/>`],
  '15b': ['一串越来越长的想法', 'A chain of thoughts, each longer',
    `<circle cx="40" cy="70" r="10" fill="${B}"/><rect x="70" y="58" width="36" height="24" rx="12" fill="${P}"/><rect x="120" y="50" width="60" height="32" rx="14" fill="${Y}"/><rect x="196" y="42" width="80" height="40" rx="16" fill="${G}"/>`],
  A: ['桌面上的三个窗口：代码、文稿、屏幕', 'Three windows on a desk: code, a page, a screen',
    `<rect x="24" y="28" width="78" height="78" rx="6" fill="#13224d" stroke="${B}"/><path d="M36 48 H90 M36 64 H78 M36 80 H70" stroke="${B}" stroke-width="3"/><rect x="112" y="28" width="78" height="78" rx="6" fill="#13224d" stroke="${Y}"/><path d="M124 50 H176 M124 68 H160" stroke="${Y}" stroke-width="3"/><rect x="200" y="28" width="78" height="78" rx="6" fill="#13224d" stroke="${G}"/><circle cx="238" cy="66" r="16" fill="${G}" opacity="0.8"/>`],
  '16': ['一根线串起几颗珠子', 'One thread through several beads',
    `<path d="M24 66 H276" stroke="${D}" stroke-width="3"/><circle cx="50" cy="66" r="12" fill="${B}"/><circle cx="110" cy="66" r="12" fill="${P}"/><circle cx="170" cy="66" r="12" fill="${Y}"/><circle cx="230" cy="66" r="12" fill="${G}"/>`],
};

/** the station's own everyday picture (empty string if the key is unknown) */
export function life(key: string, l: L): string {
  const s = SCENE[key]; if (!s) return '';
  return frame(tx([s[0], s[1]], l), s[2]);
}
