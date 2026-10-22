/* Training-mode panel (live #trainPanel, mobile placeTrainPanel): shown on the Transformer stops (T4, T4a, T4b) when
   the mode is 🔥 训练时. Native port of the live trainRender / trainStep / trainReset; the softmax over five scores
   is nudged towards the correct word one step at a time. State survives moving between the T4 stops (live: one
   element that is moved), and is reset by ⟲. Lazy: loaded only in training mode on a T4 stop. */
import type { Lang } from '../i18n/types';
import { restoreTags } from '../legacy/restore';
import { fitAndMark, setupViewers } from './hydrate';
import type { Viewer } from '../ui/diagram/Viewer';

interface TrainData { cls: string; html: string; orig: Record<string, { vb: string; html: string }> }
const data = import.meta.glob<TrainData>('../legacy/gen/train.*.json', { import: 'default' });
export async function trainOrig(lang: Lang) { const f = data[`../legacy/gen/train.${lang}.json`]; return f ? (await f()).orig : {}; }

const TL0 = [0.2, 0.9, 0.7, 0.5, 0.3];
let TT = TL0.slice(), hist: number[] = [], tbusy = false;
let viewers: Viewer[] = [];
const t2 = (l: Lang, zh: string, en: string) => (l === 'en' ? en : zh);
function softmax(a: number[]) { let m = -Infinity; a.forEach((v) => { if (v > m) m = v; }); const e = a.map((v) => (v === -Infinity ? 0 : Math.exp(v - m))); const s = e.reduce((x, y) => x + y, 0); return e.map((v) => v / s); }
function pct(p: number) { return parseFloat((p * 100).toFixed((p < 0.1 && p > 0) || (p > 0.995 && p < 1) ? 1 : 0)) + '%'; }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function render(tp: HTMLElement, words: string[], l: Lang) {
  const p = softmax(TT), q = (id: string) => tp.querySelector<HTMLElement>('#' + id);
  const bars = q('trainBars');
  if (bars) bars.innerHTML = words.map((w, i) => '<div class="bar' + (i === 0 ? ' hit' : '') + '"><span class="w">' + w + '</span><div class="track"><div class="fill" style="width:' + ((p[i] ?? 0) * 100).toFixed(1) + '%"></div></div><span class="p">' + pct(p[i] ?? 0) + '</span></div>').join('');
  const p0 = p[0] ?? 0, loss = -Math.log(p0);
  const info = q('trainInfo');
  if (info) info.innerHTML = t2(l, '第 <b>', 'Step <b>') + hist.length + t2(l, '</b> 步　正确词“好”的概率：<b>', '</b>　Probability of the correct word “good”: <b>') + pct(p0)
    + t2(l, '</b><br>损失 loss = −log(', '</b><br>Loss = −log(') + p0.toFixed(3) + ') = <b style="color:#ea580c">' + loss.toFixed(3) + '</b>'
    + (hist.length === 0 ? t2(l, '<br><span class="hint">刚开始参数是随机的，模型基本在瞎猜，甚至更偏向“差”。</span>', '<br><span class="hint">At first the parameters are random, so the model is basically guessing, and even leans towards “bad”.</span>')
      : t2(l, '<br><span class="hint">每一步：正确词的分数被往上推，其他词被往下压（推多少取决于它们当前的概率）。</span>', '<br><span class="hint">Each step: the correct word’s score is pushed up and the others pushed down (by how much depends on their current probability).</span>'));
  const all = hist.concat([loss]), mx = Math.max(...all, 2);
  const x = (i: number) => (20 + i * (260 / Math.max(10, all.length - 1))).toFixed(1), y = (v: number) => (95 - v / mx * 80).toFixed(1);
  const lc = q('lossChart');
  if (lc) lc.innerHTML = t2(l, '<text x="8" y="14" font-size="11" fill="#9a3412">损失</text>', '<text x="8" y="14" font-size="11" fill="#9a3412">Loss</text>')
    + '<line x1="20" y1="95" x2="290" y2="95" stroke="#fdba74"/><polyline points="' + all.map((v, i) => x(i) + ',' + y(v)).join(' ') + '" fill="none" stroke="#ea580c" stroke-width="2.5"/>'
    + all.map((v, i) => '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="3" fill="#ea580c"/>').join('')
    + t2(l, '<text x="290" y="108" font-size="11" text-anchor="end" fill="#9a3412">训练步数 →</text>', '<text x="290" y="108" font-size="11" text-anchor="end" fill="#9a3412">Training steps →</text>');
}

/* which language a panel was built in (kept off the DOM so the markup stays identical to live) */
const panelLang = new WeakMap<HTMLElement, Lang>();
/** put the panel after the stop's diagram (live placeTrainPanel); idempotent */
export async function mountTrain(sec: HTMLElement, S: string, lang: Lang): Promise<HTMLElement | null> {
  if (!S.startsWith('T4')) return null;
  const old = sec.querySelector<HTMLElement>('#trainPanel');
  if (old && panelLang.get(old) === lang) return old;
  const f = data[`../legacy/gen/train.${lang}.json`]; if (!f) return null;
  const d = await f();
  if (!sec.isConnected || sec.id !== S) return null;
  const again = sec.querySelector<HTMLElement>('#trainPanel'); if (again && panelLang.get(again) === lang) return again;
  again?.remove();
  viewers.forEach((v) => v.destroy()); viewers = [];
  const tp = document.createElement('section');
  tp.className = d.cls; tp.id = 'trainPanel'; tp.dataset.cc = '1'; panelLang.set(tp, lang);
  tp.innerHTML = d.html;
  restoreTags(tp);
  const anchor = sec.querySelector(':scope>.m-stage') ?? document.getElementById('ph' + S);
  if (anchor) anchor.after(tp); else sec.prepend(tp);
  fitAndMark(tp, S, lang);
  viewers = setupViewers(tp);
  requestAnimationFrame(() => viewers.forEach((v) => v.apply()));
  const words = [...tp.querySelectorAll('#trainBars .bar .w')].map((e) => e.textContent ?? '');
  tp.querySelector('#trainStep')?.addEventListener('click', () => { void (async () => {
    if (tbusy) return; tbusy = true;
    try {
      for (let i = 0; i < 5; i++) { tp.querySelector('#tn' + i)?.classList.add('lit'); await sleep(230); }
      const p = softmax(TT); hist.push(-Math.log(p[0] ?? 1)); TT = TT.map((v, j) => v - 1.2 * ((p[j] ?? 0) - (j === 0 ? 1 : 0)));
      render(tp, words, lang);
      await sleep(250);
      for (let k = 0; k < 5; k++) tp.querySelector('#tn' + k)?.classList.remove('lit');
    } finally { tbusy = false; }
  })(); });
  tp.querySelector('#trainReset')?.addEventListener('click', () => { TT = TL0.slice(); hist = []; render(tp, words, lang); });
  render(tp, words, lang);
  return tp;
}
/** test hook */
export function _trainState() { return { TT: TT.slice(), hist: hist.slice() }; }
