/* R40: 练 / 记 / 享 / 快速路径 — lazy pages drawn into the explorer's home area (one screen, same bottom bar).
   #P list · #P/x1–x5 experiments (real computation) · #P/q1–q5 quizzes · #R record · #S… share · #Q quick path. */
import './px.css';
import { UI, STEPN, tx, type L, type Tx } from '../l4/txt';
import { QUIZ, LAYERS } from './quiz';
import * as R from './rec';
import { steps, retrieve, softmax, sample, sqrtD } from './exp';
import { PATH, plan, QKEY, ZH_CPM, EN_WPM, LOOK, STOP_N, STOP_CARD, stopLayer, type QState } from './qpath';
import { cards, type Card } from '../l4/c/kc';
import { cardData, lvOf } from '../l4/share/card';
import { LX_N, lxFrom, lxHash, isLx } from '../lx/ids';
import { cardLayer, layerStats, lastPage, pageLayer, pageName, pbar, recent } from '../l4/progress';
import { hashOf, parse, pickHead, Q } from '../l4/pages';
import type { Trace } from '../l4/tf/model';
import type { Ans } from '../l4/pages';

export interface PxApi {
  root: HTMLElement; host: HTMLElement; l: L; go: (h: string) => void; top: (html: string) => void; crumb: (c: [string, string | null][]) => void;
  tf: () => Promise<typeof import('../l4/tf/client')>; seen: Set<string>; opened: Set<string>; still: () => boolean;
}
type N = 1 | 2 | 3 | 4 | 5;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const LS = { get: <T>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } }, set: (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private */ } } };
const pct = (p: number, d = 1) => (p * 100).toFixed(d) + '%';
const W: Record<string, Tx> = {
  practice: ['练', 'Practice'], record: ['记', 'Record'], share: ['享', 'Share'], quick: ['10 分钟快速路径', '10-minute quick path'],
  pSub: ['动手试一试：小实验都是真实计算；每层 4 道小测，答完就讲为什么。', 'Try it: the experiments compute for real; 4 questions per layer, each explained.'],
  exps: ['实验', 'Experiments'], tests: ['测试题', 'Quizzes'], mine: ['我的训练题', 'My training set'], mineB: ['自己出题，训练小模型', 'Write questions, train the tiny model'],
  trained: ['已训练过', 'trained'], notYet: ['没做过', 'not yet'], doneY: ['做过 ✓', 'done ✓'], bestS: ['最好 {r}/{n}', 'best {r}/{n}'], nqNo: ['4 题 · 没做', '4 Qs · not yet'], qz: ['小测', 'quiz'], last: ['上次', 'last'], nq: ['4 题', '4 Qs'], done: ['做过', 'done'],
  qn: ['第 {i} 题 / {n}', 'Question {i} / {n}'], right: ['答对了！', 'Right!'], wrong: ['不对，正确答案是 {a}。', 'Not quite — the answer is {a}.'],
  src: ['依据：「{n}」卡 ⑤ 为什么', 'From the “{n}” card, ⑤ why'], backK: ['回到「{n}」卡', 'Back to the “{n}” card'], nextQ: ['下一题', 'Next question'], seeR: ['看结果', 'See result'],
  res: ['答对 {r} / {n}', '{r} / {n} right'], allR: ['全部答对', 'All right'], again: ['再练一次', 'Try again'], toR: ['去记录', 'Go to record'], mkShare: ['生成分享卡', 'Make a share card'],
  resP: ['每题的知识点：点开能看 ⑤ 为什么。', 'Each question’s card — open it to see ⑤ why.'],
  why: ['为什么：{n}（卡片）›', 'Why: {n} (card) ›'], shareC: ['分享这个结论', 'Share this'], kcN: ['知识卡 · {n}', 'Card · {n}'],
  lowT: ['再看看这几张卡', 'Look at these cards again'], lowS: ['答错的 {w} 题各对应一张卡，看完再来一次。', 'Each of the {w} wrong answers has a card — read them, then try again.'], seeK: ['看卡 ›', 'Card ›'], firstW: ['看第一张答错的卡：{n}', 'Open the first missed card: {n}'], cardOf: ['「{n}」卡', '“{n}” card'], real: ['真实计算', 'Computed live'], loading: ['正在载入小模型…', 'Loading the tiny model…'],
  recT: ['学习进度', 'Progress'], contT: ['继续上次', 'Pick up where you left off'], cont: ['继续 ›', 'Continue ›'], start1: ['从第1层开始 ›', 'Start at layer 1 ›'], fresh: ['还没开始：先看第1层「我怎么用 AI」。', 'Not started yet: begin with layer 1, “How I use AI”.'],
  fiveT: ['五层进度 · 看过 {s}/{t} 页 · 打开 {c}/{ct} 张卡', 'Five layers · {s}/{t} pages · {c}/{ct} cards'], lvDone: ['看完 ✓ · 卡 {c}/{ct}', 'done ✓ · cards {c}/{ct}'], lvRow: ['{s}/{t} 页 · 卡 {c}/{ct}', '{s}/{t} pages · cards {c}/{ct}'],
  bestT: ['小测最好成绩', 'Best quiz scores'], noQz: ['没做', 'not yet'], wrongT: ['错题待复习（{n}）', 'To review ({n})'], wrongR: ['小测第{i}题 → {c}', 'quiz Q{i} → {c}'], review: ['复习 ›', 'Review ›'],
  seenT: ['最近看过', 'Recently seen'], tP: ['页', 'page'], tC: ['卡', 'card'], tQ: ['小测', 'quiz'], none0: ['还没有看过的页面，从首页开始吧。', 'Nothing seen yet — start from the home page.'],
  achNote: ['有成就（某层小测 ≥3/4、看完一层或走完快速路径）才显示「分享我的成就」。', '“Share my progress” appears once you have something to share (3/4 on a quiz, a finished layer or the quick path).'], seenP: ['看过页面', 'Pages seen'], answered: ['答题', 'Answered'], acc: ['正确率', 'Accuracy'],
  cardsN: ['打开过 {n} 张知识卡', 'Opened {n} knowledge cards'], streak: ['连续学习 {n} 天', '{n}-day streak'], week: ['最近 7 天（每天的操作次数）', 'Last 7 days (actions per day)'],
  recent: ['最近', 'Recent'], none: ['还没有记录，去练一练吧。', 'Nothing yet — try some practice.'], shareAch: ['分享我的成就', 'Share my progress'], toP: ['去练', 'Practise'],
  local: ['记录只存在这台设备的浏览器里。', 'Kept only in this browser on this device.'],
  shT: ['分享预览', 'Share preview'], kK: ['知识点卡', 'Knowledge card'], kQ: ['一句话说清', 'In one line'], kP: ['里程碑', 'Milestone'], kM: ['成就卡', 'Progress card'],
  kKs: ['一张卡只讲一个知识点：3 个要点 + 二维码，不放题目。', 'One knowledge point per card: 3 points + a QR code, no quiz questions.'],
  kMs2: ['你真实做到的事。完成一个小目标后就能生成。', 'Only what you really did. Reach one small goal to make it.'],
  expo: ['导出 {w}×{h} 图片', 'Exports a {w}×{h} image'], scanK: ['扫码直达这张卡', 'The QR opens this card'], scanS: ['扫码打开这个网站', 'The QR opens this site'],
  pkS: ['🔍 搜索卡片，如「注意力」', '🔍 Search cards, e.g. “attention”'], pkSeen: ['我看过的', 'Ones I opened'], pkRec: ['最近看过{n}', 'Recently opened{n}'], pkNo: ['没有找到', 'Nothing found'],
  gT: ['先完成一个小目标', 'Reach one small goal first'], gS: ['成就卡只写真实做到的事', 'A progress card only shows what you really did'],
  g1: ['走完 10 分钟快速路径', 'Finish the 10-minute quick path'], g1v: ['{i}/{n} 站', '{i}/{n} stops'],
  g2: ['任一层小测答对 ≥3/4', 'Score ≥3/4 on any layer quiz'], g2v: ['最好 {r}/{n}', 'best {r}/{n}'],
  g3: ['看完一整层', 'Finish a whole layer'], g3v: ['第{n}层 {s}/{t}', 'Layer {n} {s}/{t}'],
  gGo: ['继续快速路径 ›', 'Continue the quick path ›'], gStart: ['开始快速路径 ›', 'Start the quick path ›'],
  aPath: ['走完了 10 分钟快速路径', 'Finished the 10-minute quick path'], aQ: ['第{n}层小测 {r}/{t}', 'Layer {n} quiz {r}/{t}'], aL: ['看完了第{n}层', 'Finished layer {n}'],
  kQs: ['用一个问题开头引起好奇，答案就在卡上。', 'Opens with a question to spark curiosity; the answer is on the card.'],
  kPs: ['写上你真实做到的一步（来自你的学习记录）。', 'Adds one real step you took (from your record).'],
  kMs: ['你的真实学习记录，加上最近学的一个知识点。', 'Your real record, plus the last thing you learned.'],
  story: ['竖版 9:16', 'Tall 9:16'], post: ['方版 4:5', 'Post 4:5'], save: ['保存图片', 'Save image'], copy: ['复制链接', 'Copy link'], close: ['关闭', 'Close'], copied: ['已复制', 'Copied'],
  card: ['知识点', 'Card'], noQ: ['卡片只放知识点和二维码，不放题目。', 'Cards carry the knowledge point and a QR code, never quiz questions.'],
  oneLine: ['一句话说清：{n}', 'In one line: {n}'], achT: ['我的 AI 学习记录', 'My AI learning record'], achBig: ['看过 {n} 张知识卡', 'Opened {n} knowledge cards'],
  achR: ['答对 {n} 题', '{n} answers right'], achS: ['连续学习 {n} 天', '{n} days in a row'], achNew: ['刚开始学', 'Just getting started'], achLast: ['最近学的', 'Learned last'],
  invite: ['你也来试试？', 'Want to try?'], scan: ['扫码一层层看懂 AI', 'Scan to see AI layer by layer'],
  msQ: ['我在第{lv}层小测答对 {r}/{n}', 'I got {r}/{n} on the layer {lv} quiz'], msS: ['我已看过 {s} 页、{c} 张知识卡', 'I’ve seen {s} pages and {c} cards'], msPath: ['我走完了 10 分钟快速路径', 'I finished the 10-minute quick path'],
  qT: ['10 分钟快速路径', 'The 10-minute quick path'], qSub: ['{n} 站 + 2 张知识卡，走一遍五层。', '{n} stops + 2 cards, through all five layers.'],
  qEst: ['预计约 {m} 分钟', 'About {m} minutes'], qHow: ['怎么算的：按这些页面和卡片上的真实文字量，中文每分钟读 {z} 字、英文每分钟 {e} 词（IReST 标准阅读速度研究），每页再加 {s} 秒看图和点击。快慢因人而异。', 'How: from the real amount of text on these pages and cards, at {e} words a minute in English and {z} characters a minute in Chinese (IReST reading-speed study), plus {s} s a page for the diagram and taps. Your pace may differ.'],
  qGo: ['开始', 'Start'], qCont: ['继续第 {i} 站', 'Continue at stop {i}'], qRe: ['重新开始', 'Start over'],
  qDone: ['走完了！', 'Done!'], qTook: ['用时 {t}（从开始到现在的真实时间，包括中途离开的时间）', 'Took {t} (real time since you started, including any breaks)'], qPlan: ['预计 {t}', 'Estimate {t}'],
  home: ['首页', 'Home'],
};
let L_: L = 'zh';
const t = (k: keyof typeof W, v: Record<string, string | number> = {}) => tx(W[k]!, L_).replace(/\{(\w+)\}/g, (_, x: string) => String(v[x] ?? ''));
const mmss = (s: number) => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60), r = s % 60; return L_ === 'en' ? (m ? `${m} min ${r} s` : `${r} s`) : m ? `${m} 分 ${r} 秒` : `${r} 秒`; };
const allCards = async (l: L): Promise<Record<string, Card>> => ({ ...(await cards(l, 'K01')), ...(await cards(l, 'KA01')), ...(await cards(l, 'KC01')) });

/* ---------- experiments: metadata ---------- */
const EXP: { id: string; n: N; k: string; t: Tx }[] = [
  { id: 'x1', n: 1, k: 'KA03', t: ['多步任务成功率', 'Multi-step success'] },
  { id: 'x2', n: 2, k: 'KB06', t: ['记忆检索', 'Memory retrieval'] },
  { id: 'x3', n: 3, k: 'KC11', t: ['温度与采样', 'Temperature'] },
  { id: 'x4', n: 4, k: 'K06', t: ['注意力权重', 'Attention weights'] },
  { id: 'x5', n: 5, k: 'KM12', t: ['√d 缩放', '√d scaling'] },
];
const NOTES: Tx[] = [['我对花生过敏', 'I am allergic to peanuts'], ['上次坐高铁选了靠窗座位', 'Last train trip: chose a window seat'], ['每周三下午三点开组会', 'Team meeting every Wednesday at 3 pm'],
  ['常用邮箱是工作邮箱', 'My usual email is the work one'], ['订酒店喜欢离地铁近的', 'Hotels: I like them near the metro'], ['女儿的生日是五月十二日', 'My daughter’s birthday is 12 May']];
const QRY: Tx[] = [['帮我订明天的高铁', 'Book me a train for tomorrow'], ['晚饭点什么外卖', 'What should I order for dinner'], ['下周三有空吗', 'Am I free next Wednesday']];

/* ---------- state kept while the module lives ---------- */
let qs: { lv: N; i: number; pick: (number | null)[] } | null = null;
const xs = { p: 90, n: 8, q: 0, qtxt: '', T: 1, draws: 0, j: -1, dl: 0, d: 16, rec: '' };
let sh: { cid: string; kind: 'k' | 'q' | 'p' | 'm'; fmt: 'story' | 'post'; auto?: boolean } = { cid: '', kind: 'k', fmt: 'story' };
let model: { tr: Trace; chars: string[]; a: Ans } | null = null;
let wired: HTMLElement | null = null, api: PxApi | null = null, curId = '';

export async function px(id: string, A: PxApi) {
  api = A; L_ = A.l; curId = id; const h = A.host;
  if (wired !== h) { wired = h; h.addEventListener('click', onClick); h.addEventListener('input', onInput); h.addEventListener('change', onInput); }
  if (!id.startsWith('P/x')) xs.rec = '';
  if (id === 'P') return list(A);
  if (/^P\/q[1-5]$/.test(id)) return quiz(A, Number(id[3]) as N);
  if (/^P\/x[1-5]$/.test(id)) return exp(A, id.slice(2));
  if (id === 'R') return void record(A);
  if (id === 'S' || id.startsWith('S/')) return share(A, id.slice(2));
  if (id === 'Q/done') return qDone(A);
  return qLand(A);
}
const done = (A: PxApi, id: string) => { if (A.still()) A.root.dataset.px = `${id}.${A.l}`; };
const crumbs = (A: PxApi, ...c: [string, string | null][]) => A.crumb([[t('home'), '#home'], ...c]);

/* ---------- 练: the list ---------- */
/** the best score on a layer's quiz (not the last one) */
function bestOf(n: N) { let b: Extract<R.Ev, { k: 'quiz' }> | null = null; for (const e of R.log()) if (e.k === 'quiz' && e.lv === n && (!b || e.right > b.right)) b = e; return b; }
function list(A: PxApi) {
  A.top(`<b class="l4-tt">${t('practice')}</b>`); crumbs(A, [t('practice'), null]);
  const ran = new Set(R.log().filter((e) => e.k === 'exp').map((e) => (e as { id: string }).id)), my = !!localStorage.getItem('si.l4.my');
  const it = (h: string, n: N, name: string, st: string, on: boolean) => `<button type="button" class="px-it" data-go="${h}">${lvT(n, L_)}<b>${esc(name)}</b><i class="${on ? 'on' : ''}">${esc(st)}</i></button>`;
  A.host.innerHTML = `<div class="px px-p"><p class="px-sub">${t('pSub')}</p>
<h3>${t('exps')}</h3><div class="px-g">${EXP.map((x) => it('#P/' + x.id, x.n, tx(x.t, L_), ran.has(x.id) ? t('doneY') : t('notYet'), ran.has(x.id))).join('')}</div>
<h3>${t('tests')}</h3><div class="px-g">${LAYERS.map((n) => { const b = bestOf(n as N); return it('#P/q' + n, n as N, t('qz'), b ? t('bestS', { r: b.right, n: b.total }) : t('nqNo'), !!b); }).join('')}</div>
<h3>${t('mine')}</h3><div class="px-g1">${it('#L4/my/1', 4, t('mineB'), my ? t('trained') : t('notYet'), my)}</div></div>`;
  done(A, 'P');
}

/* ---------- 练: a quiz ---------- */
async function quiz(A: PxApi, n: N) {
  if (!qs || qs.lv !== n) qs = { lv: n, i: 0, pick: QUIZ[n].map(() => null) };
  const set = QUIZ[n], C = await allCards(A.l); if (!A.still()) return;
  A.top(`<b class="l4-tt">${esc(tx(UI.lv[n - 1]!, L_))} ${t('qz')}</b>`); crumbs(A, [t('practice'), '#P'], [`${tx(UI.lv[n - 1]!, L_)} ${t('qz')}`, null]);
  if (qs.i >= set.length) {
    const ok = (i: number) => qs!.pick[i] === set[i]!.a, r = set.filter((_, i) => ok(i)).length, hi = r * 4 >= set.length * 3, firstR = set.find((_, i) => ok(i)) ?? set[0]!, w = set.filter((_, i) => !ok(i));
    const row = (q: (typeof set)[number], i: number) => `<button type="button" class="px-it" data-k="${q.k}.2"><span class="px-ok ${ok(i) ? 'y' : 'n'}">${ok(i) ? '✓' : '✗'}</span><b>${esc(C[q.k]!.n)}</b><i>${esc(t('seeK'))}</i></button>`;
    A.host.innerHTML = hi
      ? `<div class="px px-r"><div class="px-medal" aria-hidden="true">${r === set.length ? '★' : r}</div><h2 class="px-big">${r === set.length ? t('allR') + ' · ' : ''}${t('res', { r, n: set.length })}</h2>
<p class="px-sub">${t('resP')}</p><div class="px-rl">${set.map(row).join('')}</div>
<div class="px-col"><button type="button" class="l4-b" data-px="again">${t('again')}</button><button type="button" class="l4-b" data-go="#R">${t('toR')}</button><button type="button" class="l4-b gold" data-go="#S/${firstR.k}.p">${t('mkShare')}</button></div></div>`
      : `<div class="px px-r px-lo"><div class="px-ring" style="--p:${(r / set.length) * 100}%" aria-hidden="true"><b>${r}/${set.length}</b></div><h2 class="px-big">${t('lowT')}</h2>
<p class="px-sub">${t('lowS', { w: w.length })}</p><div class="px-rl">${set.map(row).join('')}</div>
<div class="px-col"><button type="button" class="l4-b gold" data-k="${w[0]!.k}.2">${esc(t('firstW', { n: C[w[0]!.k]!.n }))}</button><div class="px-row"><button type="button" class="l4-b" data-px="again">${t('again')}</button><button type="button" class="l4-b" data-go="#R">${t('toR')}</button></div></div></div>`;
    return done(A, 'P/q' + n);
  }
  const q = set[qs.i]!, p = qs.pick[qs.i], L = 'ABCD';
  A.host.innerHTML = `<div class="px px-q"><div class="px-qh"><b>${t('qn', { i: qs.i + 1, n: set.length })}</b>${lvT(n, L_)}</div><div class="l4-pbar px-pb"><i style="width:${(qs.i / set.length) * 100}%"></i></div>
<p class="px-qq">${esc(tx(q.q, L_))}</p><div class="px-opts">${q.o.map((o, i) => `<button type="button" class="px-o${p == null ? '' : i === q.a ? ' ok' : i === p ? ' bad' : ' dim'}" data-px="pick:${i}"${p == null ? '' : ' aria-disabled="true"'}><b>${L[i]}</b><span>${esc(tx(o, L_))}</span>${p != null && i === q.a ? '<em>✓</em>' : p === i ? '<em>✗</em>' : ''}</button>`).join('')}</div>
${p == null ? '' : `<div class="px-ex ${p === q.a ? 'ok' : 'bad'}"><b>${p === q.a ? t('right') : t('wrong', { a: L[q.a]! })}</b> ${esc(tx(q.e, L_))}<span class="px-src">${esc(t('src', { n: C[q.k]!.n }))}</span></div>
<div class="px-row"><button type="button" class="l4-b" data-k="${q.k}.2">${esc(t('backK', { n: C[q.k]!.n }))}</button><button type="button" class="l4-b gold" data-px="next">${qs.i + 1 < set.length ? t('nextQ') : t('seeR')}</button></div>`}</div>`;
  done(A, 'P/q' + n);
}

/* ---------- 练: experiments ---------- */
async function exp(A: PxApi, x: string) {
  const m = EXP.find((e) => e.id === x)!;
  A.top(`<b class="l4-tt">${esc(tx(m.t, L_))}</b>`); crumbs(A, [t('practice'), '#P'], [tx(m.t, L_), null]);
  const C = await allCards(A.l); if (!A.still()) return;
  const intro: Record<string, Tx> = {
    x1: ['一个任务要做好几步。拖动看看：每步成功率和步数怎么影响整体成功率，每步检查、错了重做一次又能好多少。', 'A task takes several steps. Drag to see how per-step success and the number of steps change the whole, and how much checking each step (redo once if wrong) helps.'],
    x2: ['助手把记忆存在外面，每次只找最相关的几条读回来。选一个请求，看它会读回哪两条。', 'The assistant keeps memories outside and reads back only the most relevant few. Pick a request and see which two it reads back.'],
    x3: ['这是第4层那个手写小 Transformer 对「天空是什么颜色？」下一个字的真实打分。拖动温度看概率变尖还是变平。', 'These are the real scores of the hand-written tiny Transformer (layer 4) for the next char after “天空是什么颜色？”. Drag the temperature to sharpen or flatten them.'],
    x4: ['这是小 Transformer 第1层里「？」这个字的一个注意力头的真实打分。选一个字，给它的分数加减，看注意力权重怎么重新分配。', 'These are the real scores of one attention head in layer 1 of the tiny Transformer, at the char “？”. Pick a char, nudge its score, and watch the weights re-share.'],
    x5: ['随机生成 q、k（每个数平均 0、方差 1）。选维数 d，看点积有多大、softmax 有多「尖」，以及除以 √d 之后。', 'Random q and k (each number mean 0, variance 1). Pick d and see how big q·k gets and how peaked softmax is — with and without ÷√d.'],
  };
  A.host.innerHTML = `<div class="px px-x" data-x="${x}"><p class="px-sub">${esc(tx(intro[x]!, L_))}</p><div class="px-ctl"></div><div class="px-res"></div>
<div class="px-row"><span class="px-tag">⚙ ${t('real')}</span><button type="button" class="l4-b" data-k="${m.k}.2">${esc(t('why', { n: C[m.k]!.n }))}</button></div><div class="px-row"><button type="button" class="l4-b gold" data-go="#S/${m.k}">${t('shareC')}</button></div><p class="px-k">${esc(t('kcN', { n: C[m.k]!.n }))}</p></div>`;
  const ctl = A.host.querySelector<HTMLElement>('.px-ctl')!;
  if (x === 'x1') ctl.innerHTML = slider('p', tx(['每步成功率', 'Per-step success'], L_), 80, 99, 1, xs.p, '%') + slider('n', tx(['步数', 'Steps'], L_), 1, 20, 1, xs.n, '');
  if (x === 'x2') ctl.innerHTML = `<div class="px-chips">${QRY.map((q, i) => `<button type="button" class="l4-b${!xs.qtxt && xs.q === i ? ' on' : ''}" data-px="qry:${i}">${esc(tx(q, L_))}</button>`).join('')}</div><input class="px-in" data-xin="q" maxlength="30" placeholder="${esc(tx(['或者自己输入一句', 'or type your own'], L_))}" value="${esc(xs.qtxt)}">`;
  if (x === 'x3') ctl.innerHTML = slider('T', tx(['温度 T', 'Temperature T'], L_), 0.1, 2, 0.1, xs.T, '') + `<div class="px-chips"><button type="button" class="l4-b" data-px="draw">${tx(['按这个温度抽 100 次', 'Draw 100 times at this T'], L_)}</button></div>`;
  if (x === 'x4') ctl.innerHTML = slider('dl', tx(['给选中的字加分', 'Add to the picked char’s score'], L_), -3, 3, 0.1, xs.dl, '');
  if (x === 'x5') ctl.innerHTML = `<div class="px-chips">${[2, 4, 16, 64, 256].map((d) => `<button type="button" class="l4-b${xs.d === d ? ' on' : ''}" data-px="d:${d}">d = ${d}</button>`).join('')}</div>`;
  if ((x === 'x3' || x === 'x4') && !model) {
    A.host.querySelector('.px-res')!.innerHTML = `<p class="px-sub">${t('loading')}</p>`;
    const c = await A.tf(), u = await c.tf.trace(Q), a = await c.tf.answer(Q); model = { tr: u.tr, chars: u.chars, a };
    if (!A.still() || curId !== 'P/' + x) return;
  }
  res(x); done(A, 'P/' + x);
}
const slider = (k: string, lab: string, a: number, b: number, s: number, v: number, u: string) => `<label class="px-sl"><span>${esc(lab)}</span><input type="range" data-xs="${k}" min="${a}" max="${b}" step="${s}" value="${v}" aria-label="${esc(lab)}"><output>${fmtV(k, v)}${u}</output></label>`;
const fmtV = (k: string, v: number) => (k === 'T' ? v.toFixed(1) : k === 'dl' ? (v > 0 ? '+' : '') + v.toFixed(1) : String(v));
const bar = (lab: string, v: number, txt: string, cls = '') => `<div class="l4-bar px-bar ${cls}"><span>${lab}</span><i style="width:${Math.max(1, Math.min(100, v * 100))}%"></i><span class="v">${txt}</span></div>`;
function res(x: string) {
  const el = api!.host.querySelector<HTMLElement>('.px-res'); if (!el) return; const T_ = (z: Tx) => tx(z, L_);
  if (x === 'x1') {
    const r = steps(xs.p / 100, xs.n, 1000, xs.p * 100 + xs.n), f = (xs.p / 100).toFixed(2), e = (1 - xs.p / 100).toFixed(2);
    el.innerHTML = `${bar(T_(['一次做', 'One go']), r.once, pct(r.once))}<p class="px-f">${f}<sup>${xs.n}</sup> = ${pct(r.once)}</p>${bar(T_(['检查重做', 'Check+redo']), r.redo, pct(r.redo), 'g')}<p class="px-f">(1 − ${e}²)<sup>${xs.n}</sup> = ${pct(r.redo)}</p>
<p class="px-sub">${esc(T_(['模拟 1000 次（固定随机种子）：', 'Simulated 1000 times (fixed seed): ']))}<b>${r.simOnce}</b> / <b>${r.simRedo}</b> ${esc(T_(['次全部成功', 'all-success runs']))}</p>`;
  } else if (x === 'x2') {
    const q = xs.qtxt || tx(QRY[xs.q]!, L_), notes = NOTES.map((n) => tx(n, L_)), r = retrieve(q, notes, 2);
    el.innerHTML = `<p class="px-sub">${esc(T_(['请求：', 'Request: ']))}<b>${esc(q)}</b></p>${r.all.map(({ i, s }) => `<div class="px-note${r.top.includes(i) ? ' on' : ''}"><span>${esc(notes[i]!)}</span><span class="v">${s.toFixed(2)}${r.top.includes(i) ? ' ' + esc(T_(['读回', 'read back'])) : ''}</span></div>`).join('')}
<p class="px-f">${esc(T_(['相似度 = 两句话共有的字和词（余弦相似度，0–1）', 'Similarity = shared characters and words (cosine, 0–1)']))}</p>${r.top.length ? '' : `<p class="px-sub">${esc(T_(['没有相关的记忆，就一条也不读。', 'Nothing related, so nothing is read back.']))}</p>`}`;
  } else if (x === 'x3' && model) {
    const { tr, chars } = model, V = chars.length, o = (tr.T - 1) * V, z = Array.from({ length: V }, (_, i) => tr.logits[o + i]!), p = softmax(z, xs.T);
    const ord = p.map((v, i) => [v, i] as [number, number]).sort((a, b) => b[0] - a[0]), top = ord.slice(0, 4), rest = 1 - top.reduce((s, [v]) => s + v, 0);
    const cnt = xs.draws ? sample(p, 100, xs.draws) : null, ch = (i: number) => (chars[i] === '⏎' ? T_(UI.end as Tx) : chars[i]!);
    el.innerHTML = top.map(([v, i]) => bar(esc(ch(i)), v, pct(v) + (cnt ? ` · ${cnt[i]}${T_(['次', '×'])}` : ''))).join('') + bar(T_(['其他', 'others']), rest, pct(rest) + (cnt ? ` · ${100 - top.reduce((s, [, i]) => s + cnt[i]!, 0)}${T_(['次', '×'])}` : ''), 'dim')
      + `<p class="px-f">${esc(T_(['p = softmax(打分 ÷ T)；T = 1 就是模型原本的概率', 'p = softmax(score ÷ T); T = 1 is the model’s own probability']))}</p>`;
  } else if (x === 'x4' && model) {
    const { tr, chars, a } = model, ids = tr.ids, qi = tr.T - 1, hh = pickHead(tr, qi), S = tr.layers[0]!.S[hh]!, T = tr.T;
    if (xs.j < 0 || xs.j > qi) { let b = 0; for (let j = 0; j <= qi; j++) if (S[qi * T + j]! > S[qi * T + b]!) b = j; xs.j = b; }
    const z = Array.from({ length: qi + 1 }, (_, j) => S[qi * T + j]! + (j === xs.j ? xs.dl : 0)), w0 = softmax(Array.from({ length: qi + 1 }, (_, j) => S[qi * T + j]!)), w = softmax(z);
    const top = a.steps[0]?.top[0], nx = top ? `${a.chars[top[0]] === '⏎' ? T_(UI.end as Tx) : a.chars[top[0]]} ${pct(top[1])}` : '…';
    el.innerHTML = `<div class="px-chips px-ch">${ids.slice(0, qi + 1).map((id, j) => `<button type="button" class="l4-b${j === xs.j ? ' on' : ''}" data-px="ch:${j}">${esc(chars[id]!)}</button>`).join('')}</div>`
      + z.map((_, j) => bar(esc(chars[ids[j]!]!), w[j]!, `${pct(w[j]!, 0)}${j === xs.j && xs.dl ? ` (${pct(w0[j]!, 0)})` : ''}`, j === xs.j ? 'g' : '')).join('')
      + `<p class="px-f">${esc(T_([`第1层 · 头 ${hh + 1} · 权重 = softmax(q·k ÷ √8)`, `Layer 1 · head ${hh + 1} · weight = softmax(q·k ÷ √8)`]))}</p>`
      + `<div class="px-nx"><span>${esc(T_(['模型真正的下一个字', 'The model’s real next char']))}</span><b>${esc(nx)}</b></div><p class="px-f">${esc(T_(['拖动只改这一个头这一行的打分，不会改模型的输出；整条计算在第4层「用一下」里一步步看。', 'The slider changes only this one row of one head, not the model’s output; follow the whole computation in layer 4 “Use it”.']))}</p>`;
  } else if (x === 'x5') {
    const r = sqrtD(xs.d), mx = Math.max(r.sd, r.sdS);
    el.innerHTML = `<p class="px-h4">${esc(T_(['q·k 有多大（标准差）', 'How big q·k is (std dev)']))}</p>${bar(T_(['不缩放', 'raw']), r.sd / mx, r.sd.toFixed(2))}${bar('÷√d', r.sdS / mx, r.sdS.toFixed(2), 'g')}
<p class="px-h4">${esc(T_(['8 个字里最大的权重（平均）', 'Top weight of 8 keys (average)']))}</p>${bar(T_(['不缩放', 'raw']), r.top, pct(r.top, 0))}${bar('÷√d', r.topS, pct(r.topS, 0), 'g')}
<p class="px-f">${esc(T_([`理论：q·k 的标准差 = √d = ${Math.sqrt(xs.d).toFixed(2)}；300 次随机、固定种子`, `Theory: std of q·k = √d = ${Math.sqrt(xs.d).toFixed(2)}; 300 random trials, fixed seed`]))}</p>`;
  }
}
function ranExp(x: string, v: string) { if (xs.rec === x) return; xs.rec = x; R.add({ k: 'exp', t: Date.now(), id: x, v }); }

/* ---------- 学习进度 (R42: replaces the old record page; real local data only) ---------- */
const pgHash = (id: string) => (isLx(id) ? lxHash(id) : hashOf(id));
const md = (t0: number) => { const d = new Date(t0); return `${d.getMonth() + 1}/${d.getDate()}`; };
async function record(A: PxApi) {
  A.top(`<b class="l4-tt">${t('recT')}</b>`); crumbs(A, [t('recT'), null]);
  const C = await allCards(A.l); if (!A.still()) return;
  const lg = R.log(), sk = R.streak(), st = layerStats(A.seen, A.opened), last = lastPage();
  const S = st.reduce((a, x) => a + x.s, 0), T = st.reduce((a, x) => a + x.t, 0), Cn = st.reduce((a, x) => a + x.c, 0), CT = st.reduce((a, x) => a + x.ct, 0);
  const cont = last
    ? `<div class="px-ct"><div class="px-row l"><b>${t('contT')}</b>${sk ? `<span class="px-f">${t('streak', { n: sk })}</span>` : ''}</div><div class="px-row l">${lvT(pageLayer(last.id), L_)}<span>${esc(pageName(last.id, L_))}</span></div><button type="button" class="l4-b gold" data-go="${pgHash(last.id)}">${t('cont')}</button></div>`
    : `<div class="px-ct"><p class="px-sub">${t('fresh')}</p><button type="button" class="l4-b gold" data-go="#L1">${t('start1')}</button></div>`;
  const lv = st.map((x) => `<button type="button" class="px-lvr" data-go="#L${x.n}"><span class="px-row l">${lvT(x.n, L_)}<b>${esc(tx(UI.lvN[x.n - 1]!, L_))}</b><i>${esc(t(x.s === x.t ? 'lvDone' : 'lvRow', { s: x.s, t: x.t, c: x.c, ct: x.ct }))}</i></span>${pbar(x.s, x.t, x.n)}</button>`).join('');
  const best = LAYERS.map((n) => { const b = bestOf(n as N); return `<button type="button" class="px-bc" data-go="#P/q${n}">${lvT(n, L_)}<span>${b ? `${b.right}/${b.total}${b.right * 4 >= b.total * 3 ? ' 🏅' : ''}` : t('noQz')}</span></button>`; }).join('');
  /* questions whose latest answer was wrong */
  const lastA = new Map<string, boolean>(); for (const e of lg) if (e.k === 'ans') lastA.set(e.id, e.ok);
  const wr = LAYERS.flatMap((n) => QUIZ[n].map((q, i) => ({ n, q, i })).filter(({ q }) => lastA.get(q.id) === false));
  const wrong = wr.length ? `<h3>${t('wrongT', { n: wr.length })}</h3><div class="px-rcs">${wr.map(({ n, q, i }) => `<div class="px-rc">${lvT(n, L_)}<span>${esc(t('wrongR', { i: i + 1, c: t('cardOf', { n: C[q.k]!.n }) }))}</span><button type="button" class="l4-b" data-k="${q.k}.2">${t('review')}</button></div>`).join('')}</div>` : '';
  /* recently seen: pages, cards and quizzes, newest first */
  type It = { t: number; k: string; h: string; go: string };
  const its: It[] = recent().map((e) => e.k === 'p'
    ? { t: e.t, k: t('tP'), h: `${tx(UI.lv[pageLayer(e.id) - 1] ?? ['', ''], L_)} · ${pageName(e.id, L_)}`, go: `data-go="${pgHash(e.id)}"` }
    : { t: e.t, k: t('tC'), h: t('cardOf', { n: C[e.id]?.n ?? e.id }), go: `data-k="${e.id}"` });
  for (const e of lg) if (e.k === 'quiz') its.push({ t: e.t, k: t('tQ'), h: `${tx(UI.lv[e.lv - 1]!, L_)}${L_ === 'en' ? ' quiz' : '小测'} ${e.right}/${e.total}`, go: `data-go="#P/q${e.lv}"` });
  its.sort((a, b) => b.t - a.t);
  const rc = its.slice(0, 6).map((e) => `<button type="button" class="px-rc" ${e.go}><span class="k">${esc(e.k)}</span><span class="h">${esc(e.h)}</span><i>${md(e.t)}</i></button>`).join('');
  const ach = st.some((x) => x.t && x.s === x.t) || lg.some((e) => (e.k === 'quiz' && e.right * 4 >= e.total * 3) || e.k === 'path');
  A.host.innerHTML = `<div class="px px-rec">${cont}
<h3>${t('fiveT', { s: S, t: T, c: Cn, ct: CT })}</h3><div class="px-lvs">${lv}</div>
<h3>${t('bestT')}</h3><div class="px-bcs">${best}</div>${wrong}
<h3>${t('seenT')}</h3><div class="px-rcs">${rc || `<p class="px-sub">${t('none0')}</p>`}</div>
<div class="px-row"><button type="button" class="l4-b" data-go="#P">${t('toP')}</button>${ach ? `<button type="button" class="l4-b gold" data-go="#S/ach">${t('shareAch')}</button>` : ''}</div><p class="px-f">${t('local')}${ach ? '' : ' ' + t('achNote')}</p></div>`;
  done(A, 'R');
}

/* ---------- 享 ---------- */
const site = () => `${location.origin}${location.pathname.replace(/[^/]*$/, '')}`;
function milestone(A: PxApi, cid: string): string {
  const n = lvOf(cid).n as N, b = bestOf(n);
  if (b) return t('msQ', { lv: n, r: b.right, n: b.total });
  if (R.log().some((e) => e.k === 'path')) return t('msPath');
  return A.seen.size || A.opened.size ? t('msS', { s: A.seen.size, c: A.opened.size }) : '';
}
/** the real achievements (nothing made up): the quick path done, a quiz at ≥3/4, a whole layer seen */
function achs(A: PxApi): string[] {
  const out: string[] = [], lg = R.log();
  if (lg.some((e) => e.k === 'path')) out.push(t('aPath'));
  for (const n of LAYERS) { const b = bestOf(n as N); if (b && b.right * 4 >= b.total * 3) out.push(t('aQ', { n, r: b.right, t: b.total })); }
  for (const x of layerStats(A.seen, A.opened)) if (x.t && x.s === x.t) out.push(t('aL', { n: x.n }));
  return out;
}
let pk = { open: false, q: '' };
async function share(A: PxApi, arg: string) {
  const [a0, k0] = arg.split('.'); const C = await allCards(A.l); if (!A.still()) return;
  if (a0 === 'ach') sh.kind = 'm'; else if (a0 && C[a0]) { sh.cid = a0; sh.auto = false; if (k0 && 'kqp'.includes(k0)) sh.kind = k0 as 'k' | 'q' | 'p'; else if (sh.kind === 'm') sh.kind = 'k'; }
  /* S3: by default the card seen most recently */
  const rc = recent().filter((e) => e.k === 'c' && C[e.id]).map((e) => e.id).reverse(), op = [...new Set([...rc, ...[...A.opened].filter((k) => C[k]).reverse()])];
  if (!sh.cid || !C[sh.cid]) { sh.cid = op[0] ?? 'K06'; sh.auto = !!op[0]; }
  A.top(`<b class="l4-tt">${t('share')}</b>`); crumbs(A, [t('share'), null]);
  const kinds: ['k' | 'q' | 'p' | 'm', keyof typeof W][] = [['k', 'kK'], ['q', 'kQ'], ['p', 'kP'], ['m', 'kM']];
  const subK: Record<string, keyof typeof W> = { k: 'kKs', q: 'kQs', p: 'kPs', m: 'kMs2' };
  const ach = achs(A), [w, h] = sh.fmt === 'story' ? [1080, 1920] : [1080, 1350], m = sh.kind === 'm';
  const fmtB = `<button type="button" class="l4-b${sh.fmt === 'story' ? ' on' : ''}" data-px="fmt:story">${t('story')}</button><button type="button" class="l4-b${sh.fmt === 'post' ? ' on' : ''}" data-px="fmt:post">${t('post')}</button>`;
  const pick = m ? '' : `<button type="button" class="px-pick" data-px="pk" aria-haspopup="listbox" aria-expanded="${pk.open}" aria-label="${t('card')}"><span>${sh.auto ? `<i>${esc(t('pkRec', { n: '' }))}</i>${esc(C[sh.cid]!.n)}` : esc(C[sh.cid]!.n)}</span><b>▾</b></button>`;
  const acts = (off: boolean) => `<button type="button" class="l4-b gold" data-px="save"${off ? ' disabled' : ''}>${t('save')}</button><button type="button" class="l4-b" data-px="copy"${off ? ' disabled' : ''}>${t('copy')}</button><button type="button" class="l4-b" data-px="close">${t('close')}</button>`;
  let body: string;
  if (m && !ach.length) {
    /* S2: no real achievement yet — three small goals with real progress, saving greyed out */
    const qsx = qGet(), pathN = R.log().some((e) => e.k === 'path') ? PATH.length : qsx ? Math.min(PATH.length, Math.max(qsx.i, qsx.max ?? 0)) : 0;
    let bq: Extract<R.Ev, { k: 'quiz' }> | null = null; for (const n of LAYERS) { const b = bestOf(n as N); if (b && (!bq || b.right / b.total > bq.right / bq.total)) bq = b; }
    const st = layerStats(A.seen, A.opened), bl = st.reduce((a, x) => (x.t && x.s / x.t > a.s / Math.max(1, a.t) ? x : a), st[0]!);
    const row = (n: string, v: string, f: number) => `<div class="px-gr"><div><span>${esc(n)}</span><i>${esc(v)}</i></div><span class="px-gb"><i style="width:${Math.round(Math.min(1, f) * 100)}%"></i></span></div>`;
    body = `<div class="px-goal"><div class="px-med">🏅</div><b>${t('gT')}</b><p class="px-sub">${t('gS')}</p>
${row(t('g1'), t('g1v', { i: pathN, n: PATH.length }), pathN / PATH.length)}${row(t('g2'), bq ? t('g2v', { r: bq.right, n: bq.total }) : t('noQz'), bq ? bq.right / (bq.total * 0.75) : 0)}${row(t('g3'), t('g3v', { n: bl.n, s: bl.s, t: bl.t }), bl.t ? bl.s / bl.t : 0)}
<button type="button" class="l4-b gold" data-px="${qsx?.on ? 'qcont' : 'qgo'}">${t(qsx?.on ? 'gGo' : 'gStart')}</button></div><div class="px-row">${acts(true)}</div><p class="px-f px-cp" aria-live="polite"></p>`;
  } else {
    body = `<div class="px-sv"><div class="px-prev"></div><div class="px-sa"><p class="px-f">${t('expo', { w, h })}<br>${t(m ? 'scanS' : 'scanK')}</p>${acts(false)}<p class="px-f px-cp" aria-live="polite"></p></div></div>`;
  }
  A.host.innerHTML = `<div class="px px-s"><div class="px-chips">${kinds.map(([k, n]) => `<button type="button" class="l4-b${sh.kind === k ? ' on' : ''}" data-px="kind:${k}">${t(n)}</button>`).join('')}</div>
<p class="px-sub">${t(subK[sh.kind]!)}</p><div class="px-chips px-sr">${pick}${m && !ach.length ? '' : fmtB}</div>${body}${pk.open && !m ? pkPanel(A, C, op) : ''}</div>`;
  if (pk.open) {
    const pp = A.host.querySelector<HTMLElement>('.px-pk'), pb = A.host.querySelector<HTMLElement>('.px-pick'), hs = A.host.querySelector<HTMLElement>('.px-s');
    if (pp && pb && hs) pp.style.top = `${pb.getBoundingClientRect().bottom - hs.getBoundingClientRect().top + 6}px`;
    A.host.querySelector<HTMLInputElement>('.px-pq')?.focus({ preventScroll: true });
  }
  if (!m || ach.length) await preview(A, C, ach);
  done(A, 'S');
}
/** S1b: the card picker — the ones I opened first, then every layer's cards; a search box filters by name */
function pkPanel(A: PxApi, C: Record<string, Card>, op: string[]) {
  const it = (k: string) => `<button type="button" class="px-pi${k === sh.cid ? ' on' : ''}" role="option" aria-selected="${k === sh.cid}" data-px="pc:${k}" data-n="${esc(C[k]!.n.toLowerCase())}"><span>${esc(C[k]!.n)}</span>${k === sh.cid ? '<b>✓</b>' : ''}</button>`;
  const by = (n: number) => Object.keys(C).filter((k) => cardLayer(k) === n).sort();
  const grp = (h: string, ks: string[]) => (ks.length ? `<div class="px-pg"><h4>${h}</h4>${ks.map(it).join('')}</div>` : '');
  return `<div class="px-pk" role="listbox"><input class="px-pq" type="search" data-xin="pq" placeholder="${esc(t('pkS'))}" aria-label="${esc(t('pkS'))}" value="${esc(pk.q)}"><div class="px-pl">${grp(t('pkSeen'), op.slice(0, 6))}${[1, 2, 3, 4, 5].map((n) => grp(`${tx(UI.lv[n - 1]!, A.l)} ${esc(tx(UI.lvN[n - 1]!, A.l))}`, by(n))).join('')}<p class="px-f px-p0" hidden>${t('pkNo')}</p></div></div>`;
}
function pkFilter(host: HTMLElement, q: string) {
  pk.q = q; const v = q.trim().toLowerCase(); let any = false;
  host.querySelectorAll<HTMLElement>('.px-pg').forEach((g) => { let n = 0; g.querySelectorAll<HTMLElement>('.px-pi').forEach((b) => { const ok = !v || (b.dataset.n ?? '').includes(v); b.hidden = !ok; if (ok) n++; }); g.hidden = !n; if (n) any = true; });
  const z = host.querySelector<HTMLElement>('.px-p0'); if (z) z.hidden = any;
}
let blob: Blob | null = null, bUrl = '';
function shareUrl() { return sh.kind === 'm' ? `${site()}?lang=${L_}` : `${site()}c/${sh.cid}.html?lang=${L_}`; }
async function preview(A: PxApi, C: Record<string, Card>, ach: string[]) {
  const D = await import('../l4/share/draw'), box = A.host.querySelector<HTMLElement>('.px-prev'); if (!box) return;
  let cv: HTMLCanvasElement, words: string;
  if (sh.kind === 'm') {
    const M = await import('./ach'), an = R.answers(), sk = R.streak(), op = [...A.opened].filter((k) => C[k]), last = op[op.length - 1];
    const parts = [op.length ? t('achBig', { n: op.length }) : '', an.r ? t('achR', { n: an.r }) : '', sk ? t('achS', { n: sk }) : ''].filter(Boolean);
    const lc = last ? C[last]! : null, tmp = document.createElement('div'); if (lc) tmp.innerHTML = lc.s[1];
    const d = { site: tx(D.SITE_N, L_), url: shareUrl(), title: t('achT'), big: ach.join(L_ === 'en' ? ' · ' : '，'), stats: parts.join(' · '), last: lc ? t('achLast') : '', lastN: lc?.n ?? '', lastIdea: (tmp.textContent ?? '').trim(), invite: t('invite'), scan: t('scan') };
    cv = M.drawAch(d, sh.fmt); words = M.achWords(d);
  } else {
    const c = C[sh.cid]!, head = sh.kind === 'q' ? t('oneLine', { n: c.n }) : sh.kind === 'p' ? milestone(A, sh.cid) : '';
    const d = cardData(L_, sh.cid, c, shareUrl(), tx(D.SITE_N, L_), head, sh.kind === 'q' ? '💡' : sh.kind === 'p' ? '🏅' : ''); cv = D.draw(d, sh.fmt); words = D.words(d);
  }
  blob = await D.png(cv); if (!A.still()) return; if (bUrl) URL.revokeObjectURL(bUrl); bUrl = URL.createObjectURL(blob);
  Object.assign(box.dataset, { w: String(cv.width), h: String(cv.height), bytes: String(blob.size), text: words, url: shareUrl(), kind: sh.kind });
  box.innerHTML = `<img alt="${esc(words.split('\n')[0] ?? '')}" src="${bUrl}">`;
}
async function save() {
  if (!blob) return; const f = new File([blob], `ai-explained-${sh.kind === 'm' ? 'progress' : sh.cid}-${sh.fmt}.png`, { type: 'image/png' });
  R.add({ k: 'share', t: Date.now(), id: sh.kind === 'm' ? 'progress' : sh.cid });
  const nav = navigator as Navigator & { canShare?: (d: object) => boolean; share?: (d: object) => Promise<void> };
  try { if (nav.canShare?.({ files: [f] }) && nav.share) { await nav.share({ files: [f], url: shareUrl() }); return; } } catch { return; }
  const a = document.createElement('a'); a.href = bUrl; a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
}
async function copy() {
  const u = shareUrl(), out = api!.host.querySelector<HTMLElement>('.px-cp'); let ok = false;
  try { await navigator.clipboard.writeText(u); ok = true; } catch { /* no clipboard */ }
  if (out) out.textContent = ok ? `${t('copied')} · ${u}` : u;
}

/* ---------- 快速路径 ---------- */
const STOPN: Record<string, Tx> = { L4: ['Transformer 全图', 'The whole Transformer'], US5: STEPN.us[4]! as Tx, US9: STEPN.us[8]! as Tx };
export function stopName(h: string, l: L) { const id = parse(h).id, lx = lxFrom(id); return tx((lx ? LX_N[lx] : STOPN[id]) ?? ['', ''], l); }
const qGet = () => LS.get<QState | null>(QKEY, null);
const LC = ['#0891b2', '#0d9488', '#4f46e5', '#2563eb', '#7c3aed'];
const lvT = (n: number, l: L) => `<span class="px-lt" style="--c:${LC[n - 1]}">${tx(UI.lv[n - 1]!, l)}</span>`;
function qLand(A: PxApi) {
  A.top(`<b class="l4-tt">${t('quick')}</b>`); crumbs(A, [t('quick'), null]);
  const p = plan(A.l), s = qGet(), on = !!s?.on;
  const lay = [1, 2, 3, 4, 5].map((n) => {
    const ix = PATH.map((_, i) => i).filter((i) => stopLayer(PATH[i]![0]) === n), tot = ix.reduce((a, i) => a + p.sec[i]!, 0);
    return `<div class="px-qs" style="--c:${LC[n - 1]}"><div class="h">${lvT(n, A.l)}<b>${esc(tx(UI.lvN[n - 1]!, A.l))}</b><i>${mmss(tot)}</i></div><p>${ix.map((i) => { const c = PATH[i]![1];
      return `<span class="${on && i < s!.i ? 'done' : on && i === s!.i ? 'here' : ''}">${i + 1}. ${esc(tx(STOP_N[i]!, A.l))}${c ? `<em>${tx(['（卡：', ' (card: '], A.l)}${esc(tx(STOP_CARD[c]!, A.l))}${tx(['）', ')'], A.l)}</em>` : ''}</span>`; }).join('<s> · </s>')}</p></div>`;
  }).join('');
  A.host.innerHTML = `<div class="px px-ql"><p class="px-sub">${t('qSub', { n: PATH.length })}</p>${lay}
<details class="px-how"><summary><span>${tx(['合计约 ', 'About '], A.l)}${mmss(p.total)}${tx([' · 怎么算的', ' in all · how'], A.l)}</span></summary><p class="px-f">${t('qHow', { z: ZH_CPM, e: EN_WPM, s: LOOK })}</p></details>
<div class="px-row">${on ? `<button type="button" class="l4-b gold" data-px="qcont">${t('qCont', { i: s!.i + 1 })}</button><button type="button" class="l4-b" data-px="qgo">${t('qRe')}</button>` : `<button type="button" class="l4-b gold big" data-px="qgo">${t('qGo')}</button>`}</div></div>`;
  done(A, 'Q');
}
function qDone(A: PxApi) {
  A.top(`<b class="l4-tt">${tx(['快速路径 · 完成', 'Quick path · done'], A.l)}</b>`); crumbs(A, [t('quick'), '#Q'], [t('qDone'), null]);
  const s = qGet(), p = plan(A.l);
  if (s?.on) { const sec = Math.round((Date.now() - s.t0) / 1000); LS.set(QKEY, { ...s, on: false, sec }); R.add({ k: 'path', t: Date.now(), sec }); }
  const sec = (qGet() as (QState & { sec?: number }) | null)?.sec;
  const seen = (h: string) => { const id = parse(h).id; return A.seen.has(lxFrom(id) ?? id); };
  const lv = [1, 2, 3, 4, 5].map((n) => { const ok = PATH.filter(([h]) => stopLayer(h) === n).some(([h]) => seen(h)); return `<div class="px-qr">${lvT(n, A.l)}<span>${esc(tx(UI.lvN[n - 1]!, A.l))}</span><b class="${ok ? 'ok' : ''}">${ok ? '✓' : '–'}</b></div>`; }).join('');
  const cs = PATH.filter(([, c]) => c && A.opened.has(c));
  A.host.innerHTML = `<div class="px px-qd"><h2 class="px-big">🎉 ${tx(['走完了快速路径', 'Quick path done'], A.l)}</h2>${sec != null ? `<p class="px-sub">${tx(['用时 ', 'Took '], A.l)}${mmss(sec)}${tx(['（预计 ', ' (estimate '], A.l)}${mmss(p.total)}${tx(['）', ')'], A.l)}</p>` : `<p class="px-sub">${t('qPlan', { t: mmss(p.total) })}</p>`}
<div class="px-card"><b>${tx(['走过的 5 层', 'The 5 layers'], A.l)}</b>${lv}</div>
${cs.length ? `<div class="px-card"><b>${tx([`打开过的 ${cs.length} 张知识卡`, `${cs.length} card${cs.length > 1 ? 's' : ''} opened`], A.l)}</b><div class="px-row l">${cs.map(([h, c]) => `<button type="button" class="l4-b" data-go="${h}~${c}">${esc(tx(STOP_CARD[c!]!, A.l))}</button>`).join('')}</div></div>` : ''}
<div class="px-col"><button type="button" class="l4-b gold big" data-go="#P/q1">${tx([`做第1层小测（${QUIZ[1].length} 题）`, `Layer 1 quiz (${QUIZ[1].length} questions)`], A.l)}</button><button type="button" class="l4-b big" data-go="#S/K06.p">${tx(['生成知识点卡', 'Make a card picture'], A.l)}</button></div></div>`;
  done(A, 'Q/done');
}
export function qStart(go: (h: string) => void) { LS.set(QKEY, { on: true, i: 0, t0: Date.now(), max: 0 } satisfies QState); const [h, c] = PATH[0]!; go(h + (c ? '~' + c : '')); }

/* ---------- events ---------- */
function onClick(e: Event) {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-px]'); if (!b || !api) return; const [k, v] = (b.dataset.px ?? '').split(':') as [string, string | undefined]; const A = api;
  if (k === 'pick' && qs && qs.pick[qs.i] == null) { const q = QUIZ[qs.lv][qs.i]!, p = Number(v); qs.pick[qs.i] = p; R.add({ k: 'ans', t: Date.now(), id: q.id, ok: p === q.a });
    if (qs.pick.every((x) => x != null)) R.add({ k: 'quiz', t: Date.now(), lv: qs.lv, right: QUIZ[qs.lv].filter((z, i) => qs!.pick[i] === z.a).length, total: QUIZ[qs.lv].length }); void quiz(A, qs.lv); return; }
  if (k === 'next' && qs) { qs.i++; void quiz(A, qs.lv); return; }
  if (k === 'again' && qs) { qs = { lv: qs.lv, i: 0, pick: QUIZ[qs.lv].map(() => null) }; void quiz(A, qs.lv); return; }
  const x = curId.slice(2);
  if (k === 'qry') { xs.q = Number(v); xs.qtxt = ''; A.host.querySelectorAll('[data-px^="qry:"]').forEach((n) => n.classList.toggle('on', n === b)); const inp = A.host.querySelector<HTMLInputElement>('[data-xin="q"]'); if (inp) inp.value = ''; res(x); ranExp(x, tx(QRY[xs.q]!, 'zh')); return; }
  if (k === 'draw') { xs.draws++; res(x); ranExp(x, 'T=' + xs.T); return; }
  if (k === 'ch') { xs.j = Number(v); res(x); ranExp(x, 'ch'); return; }
  if (k === 'd') { xs.d = Number(v); A.host.querySelectorAll('[data-px^="d:"]').forEach((n) => n.classList.toggle('on', n === b)); res(x); ranExp(x, 'd=' + xs.d); return; }
  if (k === 'kind') { sh.kind = v as typeof sh.kind; pk.open = false; void share(A, ''); return; }
  if (k === 'pk') { pk = { open: !pk.open, q: '' }; void share(A, ''); return; }
  if (k === 'pc' && v) { sh.cid = v; sh.auto = false; pk = { open: false, q: '' }; void share(A, ''); return; }
  if (k === 'fmt') { sh.fmt = v as typeof sh.fmt; void share(A, ''); return; }
  if (k === 'save') { void save(); return; }
  if (k === 'copy') { void copy(); return; }
  if (k === 'close') { if (history.length > 1) history.back(); else A.go('#home'); return; }
  if (k === 'qgo') { qStart(A.go); return; }
  if (k === 'qcont') { const s = qGet(); if (s) { const [h, c] = PATH[Math.min(s.i, PATH.length - 1)]!; A.go(h + (c ? '~' + c : '')); } }
}
function onInput(e: Event) {
  const el = e.target as HTMLInputElement | HTMLSelectElement; if (!api) return; const x = curId.slice(2);
  if (el.dataset.xs) { const k = el.dataset.xs as 'p' | 'n' | 'T' | 'dl', v = Number(el.value); xs[k] = v; const o = el.parentElement?.querySelector('output'); if (o) o.textContent = fmtV(k, v) + (k === 'p' ? '%' : ''); if (k === 'T') xs.draws = 0; res(x); ranExp(x, `${k}=${v}`); return; }
  if (el.dataset.xin === 'q' && e.type === 'input') { xs.qtxt = el.value.trim(); api.host.querySelectorAll('[data-px^="qry:"]').forEach((n) => n.classList.toggle('on', !xs.qtxt && n.getAttribute('data-px') === 'qry:' + xs.q)); res(x); if (xs.qtxt) ranExp(x, 'own'); return; }
  if (el.dataset.xin === 'pq' && e.type === 'input') { pkFilter(api.host, el.value); return; }
}
