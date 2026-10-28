/* R40: 练 / 记 / 享 / 快速路径 — lazy pages drawn into the explorer's home area (one screen, same bottom bar).
   #P list · #P/x1–x5 experiments (real computation) · #P/q1–q5 quizzes · #R record · #S… share · #Q quick path. */
import './px.css';
import { UI, STEPN, tx, type L, type Tx } from '../l4/txt';
import { QUIZ, LAYERS } from './quiz';
import * as R from './rec';
import { steps, retrieve, softmax, sample, sqrtD } from './exp';
import { PATH, plan, QKEY, ZH_CPM, EN_WPM, LOOK, type QState } from './qpath';
import { cards, type Card } from '../l4/c/kc';
import { cardData, lvOf } from '../l4/share/card';
import { LX_N, lxFrom } from '../lx/ids';
import { parse, pickHead, Q } from '../l4/pages';
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
const LVC: Record<N, string> = { 1: '#0891b2', 2: '#0d9488', 3: '#4f46e5', 4: '#2563eb', 5: '#7c3aed' };
const W: Record<string, Tx> = {
  practice: ['练', 'Practice'], record: ['记', 'Record'], share: ['享', 'Share'], quick: ['10 分钟快速路径', '10-minute quick path'],
  pSub: ['动手试一试：小实验都是真实计算；每层 4 道小测，答完就讲为什么。', 'Try it: the experiments compute for real; 4 questions per layer, each explained.'],
  exps: ['实验', 'Experiments'], tests: ['测试题', 'Quizzes'], mine: ['我的训练题', 'My training set'], mineB: ['自己出题，训练小模型', 'Write questions, train the tiny model'],
  trained: ['已训练过', 'trained'], qz: ['小测', 'quiz'], last: ['上次', 'last'], nq: ['4 题', '4 Qs'], done: ['做过', 'done'],
  qn: ['第 {i} 题 / {n}', 'Question {i} / {n}'], right: ['答对了！', 'Right!'], wrong: ['不对，正确答案是 {a}。', 'Not quite — the answer is {a}.'],
  src: ['依据：{k}「{n}」⑤ 为什么', 'From {k} “{n}” ⑤ why'], backK: ['回到知识点 {k}', 'Back to card {k}'], nextQ: ['下一题', 'Next question'], seeR: ['看结果', 'See result'],
  res: ['答对 {r} / {n}', '{r} / {n} right'], allR: ['全部答对', 'All right'], again: ['再练一次', 'Try again'], toR: ['去记录', 'Go to record'], mkShare: ['生成分享卡', 'Make a share card'],
  resP: ['每题的知识点：点开能看 ⑤ 为什么。', 'Each question’s card — open it to see ⑤ why.'],
  why: ['为什么：看 {k} ⑤', 'Why: see {k} ⑤'], real: ['真实计算', 'Computed live'], loading: ['正在载入小模型…', 'Loading the tiny model…'],
  recT: ['学习记录', 'Your record'], seenP: ['看过页面', 'Pages seen'], answered: ['答题', 'Answered'], acc: ['正确率', 'Accuracy'],
  cardsN: ['打开过 {n} 张知识卡', 'Opened {n} knowledge cards'], streak: ['连续学习 {n} 天', '{n}-day streak'], week: ['最近 7 天（每天的操作次数）', 'Last 7 days (actions per day)'],
  recent: ['最近', 'Recent'], none: ['还没有记录，去练一练吧。', 'Nothing yet — try some practice.'], shareAch: ['分享我的成就', 'Share my progress'], toP: ['去练', 'Practise'],
  local: ['记录只存在这台设备的浏览器里。', 'Kept only in this browser on this device.'],
  shT: ['分享预览', 'Share preview'], kK: ['知识点卡', 'Knowledge card'], kQ: ['一句话说清', 'In one line'], kP: ['里程碑', 'Milestone'], kM: ['成就卡', 'Progress card'],
  kKs: ['只讲清一个知识点，看的人一眼能学到东西。', 'One knowledge point, clear enough to learn at a glance.'],
  kQs: ['用一个问题开头引起好奇，答案就在卡上。', 'Opens with a question to spark curiosity; the answer is on the card.'],
  kPs: ['写上你真实做到的一步（来自你的学习记录）。', 'Adds one real step you took (from your record).'],
  kMs: ['你的真实学习记录，加上最近学的一个知识点。', 'Your real record, plus the last thing you learned.'],
  story: ['竖版 9:16', 'Tall 9:16'], post: ['方版 4:5', 'Post 4:5'], save: ['保存图片', 'Save image'], copy: ['复制链接', 'Copy link'], close: ['关闭', 'Close'], copied: ['已复制', 'Copied'],
  card: ['知识点', 'Card'], noQ: ['卡片只放知识点和二维码，不放题目。', 'Cards carry the knowledge point and a QR code, never quiz questions.'],
  oneLine: ['一句话说清：{n}', 'In one line: {n}'], achT: ['我的 AI 学习记录', 'My AI learning record'], achBig: ['看过 {n} 张知识卡', 'Opened {n} knowledge cards'],
  achR: ['答对 {n} 题', '{n} answers right'], achS: ['连续学习 {n} 天', '{n} days in a row'], achNew: ['刚开始学', 'Just getting started'], achLast: ['最近学的', 'Learned last'],
  invite: ['你也来试试？', 'Want to try?'], scan: ['扫码一层层看懂 AI', 'Scan to see AI layer by layer'],
  msQ: ['我在第{lv}层小测答对 {r}/{n}', 'I got {r}/{n} on the layer {lv} quiz'], msS: ['我已看过 {s} 页、{c} 张知识卡', 'I’ve seen {s} pages and {c} cards'], msPath: ['我走完了 10 分钟快速路径', 'I finished the 10-minute quick path'],
  qT: ['10 分钟快速路径', 'The 10-minute quick path'], qSub: ['从「我怎么用 AI」一路到背后的数学：{n} 站，外加 2 张知识卡。', 'From using AI down to the maths: {n} stops plus 2 cards.'],
  qEst: ['预计约 {m} 分钟', 'About {m} minutes'], qHow: ['怎么算的：按这些页面和卡片上的真实文字量，中文每分钟读 {z} 字、英文每分钟 {e} 词（IReST 标准阅读速度研究），每页再加 {s} 秒看图和点击。快慢因人而异。', 'How: from the real amount of text on these pages and cards, at {e} words a minute in English and {z} characters a minute in Chinese (IReST reading-speed study), plus {s} s a page for the diagram and taps. Your pace may differ.'],
  qGo: ['开始', 'Start'], qCont: ['继续第 {i} 站', 'Continue at stop {i}'], qRe: ['重新开始', 'Start over'],
  qDone: ['走完了！', 'Done!'], qTook: ['用时 {t}（从开始到现在的真实时间，包括中途离开的时间）', 'Took {t} (real time since you started, including any breaks)'], qPlan: ['预计 {t}', 'Estimate {t}'],
  home: ['首页', 'Home'],
};
let L_: L = 'zh';
const t = (k: keyof typeof W, v: Record<string, string | number> = {}) => tx(W[k]!, L_).replace(/\{(\w+)\}/g, (_, x: string) => String(v[x] ?? ''));
const mmss = (s: number) => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60), r = s % 60; return L_ === 'en' ? `${m} min ${r} s` : `${m} 分 ${r} 秒`; };
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
let sh: { cid: string; kind: 'k' | 'q' | 'p' | 'm'; fmt: 'story' | 'post' } = { cid: '', kind: 'k', fmt: 'story' };
let model: { tr: Trace; chars: string[]; a: Ans } | null = null;
let wired: HTMLElement | null = null, api: PxApi | null = null, curId = '';

export async function px(id: string, A: PxApi) {
  api = A; L_ = A.l; curId = id; const h = A.host;
  if (wired !== h) { wired = h; h.addEventListener('click', onClick); h.addEventListener('input', onInput); h.addEventListener('change', onInput); }
  if (!id.startsWith('P/x')) xs.rec = '';
  if (id === 'P') return list(A);
  if (/^P\/q[1-5]$/.test(id)) return quiz(A, Number(id[3]) as N);
  if (/^P\/x[1-5]$/.test(id)) return exp(A, id.slice(2));
  if (id === 'R') return record(A);
  if (id === 'S' || id.startsWith('S/')) return share(A, id.slice(2));
  if (id === 'Q/done') return qDone(A);
  return qLand(A);
}
const done = (A: PxApi, id: string) => { if (A.still()) A.root.dataset.px = `${id}.${A.l}`; };
const crumbs = (A: PxApi, ...c: [string, string | null][]) => A.crumb([[t('home'), '#home'], ...c]);

/* ---------- 练: the list ---------- */
function bestOf(n: N) { const q = R.log().filter((e): e is Extract<R.Ev, { k: 'quiz' }> => e.k === 'quiz' && e.lv === n); return q.length ? q[q.length - 1]! : null; }
function list(A: PxApi) {
  A.top(`<b class="l4-tt">${t('practice')}</b>`); crumbs(A, [t('practice'), null]);
  const ran = new Set(R.log().filter((e) => e.k === 'exp').map((e) => (e as { id: string }).id));
  const it = (h: string, n: N, name: string, st: string, on: boolean) => `<button type="button" class="px-it" data-go="${h}"><span class="px-lv" style="--c:${LVC[n]}">L${n}</span><b>${esc(name)}</b><i class="${on ? 'on' : ''}">${esc(st)}</i></button>`;
  A.host.innerHTML = `<div class="px px-p"><p class="px-sub">${t('pSub')}</p>
<h3>${t('exps')}</h3><div class="px-g">${EXP.map((x) => it('#P/' + x.id, x.n, tx(x.t, L_), ran.has(x.id) ? '✓' : '○', ran.has(x.id))).join('')}</div>
<h3>${t('tests')}</h3><div class="px-g">${LAYERS.map((n) => { const b = bestOf(n as N); return it('#P/q' + n, n as N, `${tx(UI.lv[n - 1]!, L_)} ${t('qz')}`, b ? `${b.right}/${b.total}` : t('nq'), !!b); }).join('')}</div>
<h3>${t('mine')}</h3><div class="px-g1">${it('#L4/my/1', 4, t('mineB'), localStorage.getItem('si.l4.my') ? t('trained') : '○', !!localStorage.getItem('si.l4.my'))}</div></div>`;
  done(A, 'P');
}

/* ---------- 练: a quiz ---------- */
async function quiz(A: PxApi, n: N) {
  if (!qs || qs.lv !== n) qs = { lv: n, i: 0, pick: QUIZ[n].map(() => null) };
  const set = QUIZ[n], C = await allCards(A.l); if (!A.still()) return;
  A.top(`<b class="l4-tt">${esc(tx(UI.lv[n - 1]!, L_))} ${t('qz')}</b>`); crumbs(A, [t('practice'), '#P'], [`${tx(UI.lv[n - 1]!, L_)} ${t('qz')}`, null]);
  if (qs.i >= set.length) {
    const r = set.filter((q, i) => qs!.pick[i] === q.a).length, firstR = set.find((q, i) => qs!.pick[i] === q.a) ?? set[0]!;
    A.host.innerHTML = `<div class="px px-r"><div class="px-medal" aria-hidden="true">${r === set.length ? '★' : r}</div><h2 class="px-big">${r === set.length ? t('allR') + ' · ' : ''}${t('res', { r, n: set.length })}</h2>
<p class="px-sub">${t('resP')}</p><div class="px-rl">${set.map((q, i) => `<button type="button" class="px-it" data-k="${q.k}.2"><span class="px-ok ${qs!.pick[i] === q.a ? 'y' : 'n'}">${qs!.pick[i] === q.a ? '✓' : '✗'}</span><b>${esc(C[q.k]!.n)}</b><i>${q.k}</i></button>`).join('')}</div>
<div class="px-col"><button type="button" class="l4-b" data-px="again">${t('again')}</button><button type="button" class="l4-b" data-go="#R">${t('toR')}</button><button type="button" class="l4-b gold" data-go="#S/${firstR.k}.p">${t('mkShare')}</button></div></div>`;
    return done(A, 'P/q' + n);
  }
  const q = set[qs.i]!, p = qs.pick[qs.i], L = 'ABCD';
  A.host.innerHTML = `<div class="px px-q"><div class="px-qh"><b>${t('qn', { i: qs.i + 1, n: set.length })}</b><span class="px-lv" style="--c:${LVC[n]}">L${n}</span></div><div class="l4-pbar px-pb"><i style="width:${(qs.i / set.length) * 100}%"></i></div>
<p class="px-qq">${esc(tx(q.q, L_))}</p><div class="px-opts">${q.o.map((o, i) => `<button type="button" class="px-o${p == null ? '' : i === q.a ? ' ok' : i === p ? ' bad' : ' dim'}" data-px="pick:${i}"${p == null ? '' : ' aria-disabled="true"'}><b>${L[i]}</b><span>${esc(tx(o, L_))}</span>${p != null && i === q.a ? '<em>✓</em>' : p === i ? '<em>✗</em>' : ''}</button>`).join('')}</div>
${p == null ? '' : `<div class="px-ex ${p === q.a ? 'ok' : 'bad'}"><b>${p === q.a ? t('right') : t('wrong', { a: L[q.a]! })}</b> ${esc(tx(q.e, L_))}<span class="px-src">${esc(t('src', { k: q.k, n: C[q.k]!.n }))}</span></div>
<div class="px-row"><button type="button" class="l4-b" data-k="${q.k}.2">${t('backK', { k: q.k })}</button><button type="button" class="l4-b gold" data-px="next">${qs.i + 1 < set.length ? t('nextQ') : t('seeR')}</button></div>`}</div>`;
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
<div class="px-row"><span class="px-tag">⚙ ${t('real')}</span><button type="button" class="l4-b" data-k="${m.k}.2">${esc(t('why', { k: m.k }))}</button></div><p class="px-k">${esc(m.k)} · ${esc(C[m.k]!.n)}</p></div>`;
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

/* ---------- 记 ---------- */
function record(A: PxApi) {
  A.top(`<b class="l4-tt">${t('recT')}</b>`); crumbs(A, [t('record'), null]);
  const lg = R.log(), an = R.answers(lg), wk = R.week(), mx = Math.max(1, ...wk.map(([, v]) => v)), sk = R.streak();
  const dn = L_ === 'en' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['日', '一', '二', '三', '四', '五', '六'];
  const rc = lg.slice(-5).reverse().map((e) => { const d = new Date(e.t), tm = `${d.getMonth() + 1}/${d.getDate()}`;
    const s = e.k === 'quiz' ? [tx(['{l} 小测', '{l} quiz'], L_).replace('{l}', tx(UI.lv[e.lv - 1]!, L_)), `${e.right}/${e.total}`] : e.k === 'ans' ? [e.id.toUpperCase(), e.ok ? tx(['答对', 'right'], L_) : tx(['答错', 'wrong'], L_)]
      : e.k === 'exp' ? [tx(['实验', 'Experiment'], L_) + ' · ' + tx(EXP.find((x) => x.id === e.id)?.t ?? ['', ''], L_), ''] : e.k === 'path' ? [t('quick'), mmss(e.sec)] : [tx(['分享', 'Shared'], L_) + ' · ' + e.id, ''];
    return `<div class="px-rc"><span>${esc(s[0]!)}</span><span class="v">${esc(s[1]!)} <i>${tm}</i></span></div>`; }).join('');
  A.host.innerHTML = `<div class="px px-rec"><div class="px-st"><div><span>${t('seenP')}</span><b>${A.seen.size}</b></div><div><span>${t('answered')}</span><b>${an.n}</b></div><div><span>${t('acc')}</span><b>${an.n ? Math.round((an.r / an.n) * 100) + '%' : '—'}</b></div></div>
<p class="px-sub">${t('cardsN', { n: A.opened.size })}${sk ? ' · ' + t('streak', { n: sk }) : ''}</p>
<p class="px-h4">${t('week')}</p><div class="px-wk">${wk.map(([k, v]) => `<div><span class="v">${v}</span><i style="height:${Math.round((v / mx) * 100)}%"></i><span>${dn[new Date(k + 'T12:00').getDay()]}</span></div>`).join('')}</div>
<p class="px-h4">${t('recent')}</p><div class="px-rcs">${rc || `<p class="px-sub">${t('none')}</p>`}</div>
<div class="px-row"><button type="button" class="l4-b" data-go="#P">${t('toP')}</button><button type="button" class="l4-b gold" data-go="#S/ach">${t('shareAch')}</button></div><p class="px-f">${t('local')}</p></div>`;
  done(A, 'R');
}

/* ---------- 享 ---------- */
const homeOf = (id: string) => ['#L4', '#L1', '#L2', '#L3', '#L4', '#L5'][lvOf(id).n]!;
const site = () => `${location.origin}${location.pathname}`;
function milestone(A: PxApi, cid: string): string {
  const n = lvOf(cid).n as N, b = bestOf(n);
  if (b) return t('msQ', { lv: n, r: b.right, n: b.total });
  if (R.log().some((e) => e.k === 'path')) return t('msPath');
  return t('msS', { s: A.seen.size, c: A.opened.size });
}
async function share(A: PxApi, arg: string) {
  const [a0, k0] = arg.split('.'); const C = await allCards(A.l); if (!A.still()) return;
  if (a0 === 'ach') sh.kind = 'm'; else if (a0 && C[a0]) { sh.cid = a0; if (k0 && 'kqp'.includes(k0)) sh.kind = k0 as 'k' | 'q' | 'p'; else if (sh.kind === 'm') sh.kind = 'k'; }
  const op = [...A.opened].filter((k) => C[k]); if (!sh.cid || !C[sh.cid]) sh.cid = op[op.length - 1] ?? 'K06';
  A.top(`<b class="l4-tt">${t('share')}</b>`); crumbs(A, [t('share'), null]);
  const pool = [...new Set([sh.cid, ...op.slice().reverse(), ...LAYERS.flatMap((n) => QUIZ[n as N].map((q) => q.k))])];
  const kinds: ['k' | 'q' | 'p' | 'm', keyof typeof W, keyof typeof W][] = [['k', 'kK', 'kKs'], ['q', 'kQ', 'kQs'], ['p', 'kP', 'kPs'], ['m', 'kM', 'kMs']];
  const ks = kinds.find((x) => x[0] === sh.kind)!;
  A.host.innerHTML = `<div class="px px-s"><div class="px-chips">${kinds.map(([k, n]) => `<button type="button" class="l4-b${sh.kind === k ? ' on' : ''}" data-px="kind:${k}">${t(n)}</button>`).join('')}</div>
<p class="px-sub">${t(ks[2])} ${t('noQ')}</p>
<div class="px-chips">${sh.kind === 'm' ? '' : `<select class="px-sel" data-xin="card" aria-label="${t('card')}">${pool.map((k) => `<option value="${k}"${k === sh.cid ? ' selected' : ''}>${k} · ${esc(C[k]!.n)}</option>`).join('')}</select>`}<button type="button" class="l4-b${sh.fmt === 'story' ? ' on' : ''}" data-px="fmt:story">${t('story')}</button><button type="button" class="l4-b${sh.fmt === 'post' ? ' on' : ''}" data-px="fmt:post">${t('post')}</button></div>
<div class="px-prev"></div>
<div class="px-row"><button type="button" class="l4-b gold" data-px="save">${t('save')}</button><button type="button" class="l4-b" data-px="copy">${t('copy')}</button><button type="button" class="l4-b" data-px="close">${t('close')}</button></div><p class="px-f px-cp" aria-live="polite"></p></div>`;
  await preview(A, C); done(A, 'S');
}
let blob: Blob | null = null, bUrl = '';
function shareUrl() { return sh.kind === 'm' ? `${site()}?lang=${L_}` : `${site()}?lang=${L_}${homeOf(sh.cid)}~${sh.cid}`; }
async function preview(A: PxApi, C: Record<string, Card>) {
  const D = await import('../l4/share/draw'), box = A.host.querySelector<HTMLElement>('.px-prev'); if (!box) return;
  let cv: HTMLCanvasElement, words: string;
  if (sh.kind === 'm') {
    const M = await import('./ach'), an = R.answers(), sk = R.streak(), op = [...A.opened].filter((k) => C[k]), last = op[op.length - 1];
    const parts = [an.r ? t('achR', { n: an.r }) : '', sk ? t('achS', { n: sk }) : ''].filter(Boolean);
    const lc = last ? C[last]! : null, tmp = document.createElement('div'); if (lc) tmp.innerHTML = lc.s[1];
    const d = { site: tx(D.SITE_N, L_), url: shareUrl(), title: t('achT'), big: op.length ? t('achBig', { n: op.length }) : t('achNew'), stats: parts.join(L_ === 'en' ? ' · ' : ' · '), last: lc ? t('achLast') : '', lastN: lc?.n ?? '', lastIdea: (tmp.textContent ?? '').trim(), invite: t('invite'), scan: t('scan') };
    cv = M.drawAch(d, sh.fmt); words = M.achWords(d);
  } else {
    const c = C[sh.cid]!, head = sh.kind === 'q' ? t('oneLine', { n: c.n }) : sh.kind === 'p' ? milestone(A, sh.cid) : '';
    const d = cardData(L_, sh.cid, c, shareUrl(), tx(D.SITE_N, L_), head, sh.kind === 'q' ? '💡' : sh.kind === 'p' ? '🏅' : sh.cid); cv = D.draw(d, sh.fmt); words = D.words(d);
  }
  blob = await D.png(cv); if (bUrl) URL.revokeObjectURL(bUrl); bUrl = URL.createObjectURL(blob);
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
function qLand(A: PxApi) {
  A.top(`<b class="l4-tt">${t('quick')}</b>`); crumbs(A, [t('quick'), null]);
  const p = plan(A.l), s = qGet(), on = !!s?.on;
  A.host.innerHTML = `<div class="px px-ql"><p class="px-sub">${t('qSub', { n: PATH.length })}</p><h2 class="px-big">⏱ ${t('qEst', { m: Math.round(p.total / 60) })}</h2>
<ol class="px-stops">${PATH.map(([h, c], i) => `<li class="${on && i < s!.i ? 'done' : on && i === s!.i ? 'here' : ''}"><span>${esc(stopName(h, A.l))}${c ? ' + ' + c : ''}</span><i>${mmss(p.sec[i]!).replace(/^0 (分|min) /, '')}</i></li>`).join('')}</ol>
<p class="px-f">${t('qHow', { z: ZH_CPM, e: EN_WPM, s: LOOK })}</p>
<div class="px-row">${on ? `<button type="button" class="l4-b gold" data-px="qcont">${t('qCont', { i: s!.i + 1 })}</button><button type="button" class="l4-b" data-px="qgo">${t('qRe')}</button>` : `<button type="button" class="l4-b gold" data-px="qgo">${t('qGo')}</button>`}</div></div>`;
  done(A, 'Q');
}
function qDone(A: PxApi) {
  A.top(`<b class="l4-tt">${t('quick')}</b>`); crumbs(A, [t('quick'), '#Q'], [t('qDone'), null]);
  const s = qGet(), p = plan(A.l);
  if (s?.on) { const sec = Math.round((Date.now() - s.t0) / 1000); LS.set(QKEY, { ...s, on: false, sec }); R.add({ k: 'path', t: Date.now(), sec }); }
  const sec = (qGet() as (QState & { sec?: number }) | null)?.sec;
  A.host.innerHTML = `<div class="px px-r"><div class="px-medal" aria-hidden="true">★</div><h2 class="px-big">${t('qDone')}</h2>${sec != null ? `<p class="px-sub">${t('qTook', { t: mmss(sec) })}</p>` : ''}<p class="px-sub">${t('qPlan', { t: mmss(p.total) })}</p>
<div class="px-col"><button type="button" class="l4-b gold" data-go="#P">${t('toP')}</button><button type="button" class="l4-b" data-go="#S/K06.p">${t('mkShare')}</button><button type="button" class="l4-b" data-go="#home">${t('home')}</button></div></div>`;
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
  if (k === 'kind') { sh.kind = v as typeof sh.kind; void share(A, ''); return; }
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
  if (el.dataset.xin === 'card' && e.type === 'change') { sh.cid = el.value; void share(api, ''); }
}
