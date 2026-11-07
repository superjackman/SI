/* R50 验证优化 · the lazy block under a stage page (#D/n) or on a card sheet: ⇆ a slider demo, ✎ self-check questions
   (type a number or pick an option → instant ✓ / ✗, a hint on a miss, the worked answer on demand; ticks kept in
   localStorage via ./ids) and ⚠ 常见误解. Nothing here navigates, so it never adds a history entry. */
import './vf.css';
import { tx, type L } from '../l4/txt';
import { fillDvText } from '../dv/nums';
import { QQ, MCS, DEMO, type Q, type DemoK } from './data';
import { VF_Q, order, vfAdd, vfDone } from './ids';
import { masteredSt } from '../dv/prog';
import { noteMastered } from '../px/week';
import { rvAns } from '../px/rv';
import { attW, D_ATT, D_DK, D_SM, fmt, gdKind, gdL, gdSeq, parseNum, softmax } from './calc';
import { extraCtl, extraOut, extraTitle, isExtra } from './demo2';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
/** **keyword** · `formula` · {~approximate} · {#shared number}, as on the stage pages */
// keep the last few characters together so a line never ends with a lone ？ or letter
const glue = (h: string) => h.replace(/((?:&[a-z#0-9]+;|[^<>&\s]){1,4}(?:\s(?:&[a-z#0-9]+;|[^<>&\s]){1,3})?)$/, '<span class="nw">$1</span>');
export const mk = (s: string, l: L) => glue(esc(fillDvText(s, l)).replace(/\*\*(.+?)\*\*/g, '<span class="k">$1</span>').replace(/`([^`]+)`/g, '$1').replace(/\{~([^}]+)\}/g, '<span class="vf-ap">≈ $1</span>').replace(/(\[[^\[\]\n]{1,40}\])/g, '<span class="nw">$1</span>'));
/** is the typed value right? (choice questions are checked by index) */
export const ok = (q: Q, v: number) => Math.abs(v - q.a) <= (q.tol ?? 0.5 * 10 ** -q.d) + 1e-9;
/** the answer the way it is shown */
export const ansT = (q: Q, l: L) => (q.o ? tx(q.o[q.a]!, l) : fmt(q.a, q.d) + (q.u ? (q.u[0] === '%' ? '%' : ' ' + tx(q.u, l)) : ''));
export { order };

/* ---------- the three demos (pure: state → html, tested) ---------- */
export type DemoS = { eta: number; n: number; T: number; dk: number; pred: number; ang: number; layer: number; rank: number; len: number; hit: number; play: number; frame: number };
export const DEMO0: DemoS = { eta: 0.3, n: 4, T: 1, dk: 3, pred: 4, ang: 40, layer: 0, rank: 4, len: 4, hit: 1, play: 0, frame: 0 };
const pct = (v: number) => fmt(100 * v, 1) + '%';
const bars = (lab: string[], p: number[]) => p.map((v, i) => `<div class="vf-bar"><span>${esc(lab[i]!)}</span><i style="width:${Math.max(1, Math.round(100 * v))}%"></i><b>${pct(v)}</b></div>`).join('');
export function demoOut(k: DemoK, s: DemoS, l: L): string {
  if (isExtra(k)) return extraOut(k, s, l);
  const z = (a: string, b: string) => tx([a, b], l);
  if (k === 'gd') {
    const w = gdSeq(s.eta, s.n), L0 = gdL(w[0]!), Ln = gdL(w[s.n]!), kind = gdKind(s.eta);
    const KIND = { slow: z('步子太小：走得很慢', 'Too small: very slow'), ok: z('平稳靠近 w = 2', 'Glides in to w = 2'), osc: z('来回跳，但在收敛', 'Zig-zags, but converges'), stuck: z('在两点之间原地来回', 'Bounces between two points forever'), div: z('越跳越远：发散', 'Runs away: diverges') }[kind];
    // the curve on w ∈ [−3, 7], L ∈ [0, 26]; points outside are pinned to the edge
    const X = (v: number) => 56 + ((Math.max(-3, Math.min(7, v)) + 3) / 10) * 540, Y = (v: number) => 280 - (Math.min(26, v) / 26) * 240;
    let c = ''; for (let i = 0; i <= 50; i++) { const v = -3 + i / 5; c += `${i ? 'L' : 'M'}${X(v).toFixed(1)} ${Y(gdL(v)).toFixed(1)}`; }
    const pts = w.map((v) => [X(v), Y(gdL(v))] as const), path = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
    const svg = `<svg class="vf-plot" viewBox="0 0 640 320" role="img" aria-label="${z('损失曲线。横轴 w，纵轴 L。', 'Loss curve. Across: w. Up: L.')}"><rect width="640" height="320" fill="var(--card)"/><line x1="56" y1="280" x2="610" y2="280" stroke="var(--card)"/><line x1="56" y1="24" x2="56" y2="280" stroke="var(--card)"/><line x1="${X(2)}" y1="24" x2="${X(2)}" y2="280" stroke="var(--link)" stroke-dasharray="4 4"/><path d="${c}" fill="none" stroke="var(--link)" stroke-width="2.6"/><path d="${path}" fill="none" stroke="var(--muted)" stroke-width="1.8"/>${pts.map(([x, y], i) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i === pts.length - 1 ? 8 : 4}" fill="${i === pts.length - 1 ? 'var(--card)' : 'var(--muted)'}"/>`).join('')}</svg>`;
    return `${svg}<p class="vf-axes">${z('横轴 w，纵轴 L。虚线是碗底 w = 2。', 'Across: w. Up: L. The dashed line is the bottom, w = 2.')}</p><p class="vf-o">w = ${w.map((v) => fmt(v, 2)).join(', ')}</p><p class="vf-o">L = ${fmt(L0, 2)} → ${fmt(Ln, 2)} · <b class="vf-k ${kind}">${KIND}</b></p><p class="vf-n">${z(`每步把到 2 的距离乘以 (1 − 2η) = ${fmt(1 - 2 * s.eta, 2)}`, `Each step multiplies the distance to 2 by (1 − 2η) = ${fmt(1 - 2 * s.eta, 2)}`)}</p>`;
  }
  if (k === 'sm') {
    const p = softmax(D_SM, s.T);
    return `${bars([z('蓝', 'blue'), z('绿', 'green'), z('红', 'red')], p)}<p class="vf-o">${z('分数', 'Scores')} ${D_SM.map((v) => fmt(v, 1)).join(' / ')} ÷ T = ${D_SM.map((v) => fmt(v / s.T, 2)).join(' / ')}</p><p class="vf-n">${s.T < 1 ? z('T < 1：更尖，几乎总选第一个', 'T < 1: sharper, nearly always the first') : s.T > 1 ? z('T > 1：更平，别的字也常被抽到', 'T > 1: flatter, other tokens get drawn too') : z('T = 1：就是原来的 softmax', 'T = 1: plain softmax')}</p>`;
  }
  const dk = D_DK[s.dk]!, p = attW(D_ATT, dk), sc = D_ATT.map((v) => v / Math.sqrt(dk));
  return `${bars([z('词 1', 'word 1'), z('词 2', 'word 2'), z('词 3', 'word 3')], p)}<p class="vf-o">[${D_ATT.join(', ')}] ÷ √${dk} = [${sc.map((v) => fmt(v, 2)).join(', ')}]</p><p class="vf-n">${dk === 1 ? z('d_k = 1 等于不缩放：几乎只看词 1', 'd_k = 1 is no scaling: almost only word 1') : z('d_k 越大除得越多，权重越平均，不会全压在一个词上', 'The bigger d_k, the more it divides: the weights even out instead of piling onto one word')}</p>`;
}
const DT = { gd: ['梯度下降', 'Gradient descent'], sm: ['温度', 'Temperature'], att: ['注意力缩放', 'Attention scaling'] } as const;
const sl = (k: keyof DemoS, lab: string, a: number, b: number, st: number, v: number, out: string) => `<label class="vf-sl"><span>${esc(lab)}</span><input type="range" data-vs="${k}" min="${a}" max="${b}" step="${st}" value="${v}" aria-label="${esc(lab)}"><output>${out}</output></label>`;
const slOut = (k: keyof DemoS, v: number) => (k === 'dk' ? String(D_DK[v] ?? v) : k === 'n' || k === 'layer' || k === 'rank' || k === 'len' || k === 'hit' || k === 'play' || k === 'frame' ? String(Math.round(v)) : k === 'ang' ? `${fmt(v, 0)}°` : fmt(v, k === 'eta' ? 2 : 1));
function demo(k: DemoK, s: DemoS, l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  const ctl = extraCtl(k, s, l) ?? (k === 'gd' ? sl('eta', z('学习率 η', 'Rate η'), 0.05, 1.2, 0.05, s.eta, slOut('eta', s.eta)) + sl('n', z('步数', 'Steps'), 1, 8, 1, s.n, slOut('n', s.n))
    : k === 'sm' ? sl('T', z('温度 T', 'Temp T'), 0.1, 3, 0.1, s.T, slOut('T', s.T)) : sl('dk', 'd_k', 0, D_DK.length - 1, 1, s.dk, slOut('dk', s.dk)));
  const title = isExtra(k) ? extraTitle(k) : DT[k];
  return `<section class="vf-b vf-dm" data-dm="${k}"><h3 class="vf-h"><span class="vf-ic">⇆</span>${esc(tx(title, l))}</h3><div class="vf-res" aria-live="polite">${demoOut(k, s, l)}</div><div class="vf-ctl">${ctl}</div></section>`;
}

/* ---------- the questions ---------- */
function qItem(id: string, q: Q, l: L, done: boolean) {
  const z = (a: string, b: string) => tx([a, b], l);
  const inp = q.o
    ? `<div class="vf-opts">${order(id, q.o.length).map((i) => `<button type="button" class="vf-op" data-vf="pick:${i}">${mk(tx(q.o![i]!, l), l)}</button>`).join('')}</div>`
    : `<div class="vf-row"><input class="vf-in" type="text" inputmode="decimal" enterkeyhint="done" autocomplete="off" spellcheck="false" aria-label="${z('你的答案', 'Your answer')}" placeholder="${z('填数字', 'a number')}">${q.u ? `<span class="vf-u">${esc(tx(q.u, l))}</span>` : ''}<button type="button" class="l4-b g-info vf-ck" data-vf="ck">${z('检查', 'Check')}</button></div>`;
  return `<li class="vf-q${done ? ' done' : ''}" data-q="${id}"><p class="vf-qq">${mk(tx(q.q, l), l)}${done ? `<span class="vf-tk" aria-label="${z('做对过', 'solved')}">✓</span>` : ''}</p>${inp}<p class="vf-fb" role="status" aria-live="polite"></p>
<button type="button" class="l4-b vf-sw" data-vf="sol" aria-expanded="false">${z('看解答', 'Show the working')}</button><div class="vf-sol" hidden><p>${mk(tx(q.w, l), l)}</p><p class="vf-an">${z('答案：', 'Answer: ')}<b>${mk(ansT(q, l), l)}</b></p></div></li>`;
}
/** fill `slot` for page `page` ('D/n' or a card id); resolves when drawn. `onTick` runs after a newly solved question.
    `part` (R51 layered pages): 'demo' = only the slider demo (layer ③), 'check' = only the questions + 常见误解 (layer ⑤).
    `o` (R56 今日复习): `ids` = just these questions (no demo, no 常见误解), `rev` = answers here clear the wrong book,
    `onJudge` runs after every answer. Every answer also goes into the review queue (px/rv). */
export interface MountO { ids?: readonly string[]; rev?: boolean; onJudge?: (id: string, right: boolean) => void }
export function mount(slot: HTMLElement, page: string, l: L, onTick?: () => void, part?: 'demo' | 'check', o: MountO = {}) {
  const z = (a: string, b: string) => tx([a, b], l), d0 = vfDone();
  const ids = o.ids ? o.ids.filter((id) => id in QQ) : part === 'demo' ? [] : VF_Q[page] ?? [], mc = o.ids || part === 'demo' ? [] : MCS(page), dk = o.ids || part === 'check' ? undefined : DEMO[page];
  if (!ids.length && !mc.length && !dk) { slot.innerHTML = ''; return; }
  const s: DemoS = { ...DEMO0 };
  slot.innerHTML = `<div class="vf" lang="${l === 'en' ? 'en' : 'zh-CN'}">${dk ? demo(dk, s, l) : ''}`
    + (ids.length ? `<section class="vf-b vf-qz"><ol class="vf-ql">${ids.map((id) => qItem(id, QQ[id]!, l, d0.has(id))).join('')}</ol></section>` : '')
    + (mc.length ? `<section class="vf-mc">${mc.map((m) => `<div class="vf-m"><p class="vf-x"><b>✗ ${z('误解：', 'Myth: ')}</b>${mk(tx(m.x, l), l)}</p><p class="vf-r"><b>✓ ${z('其实：', 'Actually: ')}</b>${mk(tx(m.r, l), l)}</p></div>`).join('')}</section>` : '')
    + '</div>';
  const judge = (li: HTMLElement, right: boolean, pick?: number) => {
    const id = li.dataset.q!, q = QQ[id]!, fb = li.querySelector<HTMLElement>('.vf-fb')!;
    li.dataset.st = right ? 'ok' : 'bad'; rvAns(id, right, undefined, !!o.rev); o.onJudge?.(id, right);
    fb.innerHTML = right ? `<b>✓ ${z('对了！', 'Right!')}</b>` : `<b>✗ ${z('还不对，再试试。', 'Not yet — try again.')}</b> ${z('提示：', 'Hint: ')}${mk(tx(q.h, l), l)}`;
    if (q.o) li.querySelectorAll<HTMLElement>('.vf-op').forEach((b) => { const i = Number(b.dataset.vf!.slice(5)); b.classList.toggle('ok', right && i === q.a); b.classList.toggle('bad', !right && i === pick); });
    if (right && !vfDone().has(id)) {
      const prev = masteredSt(); vfAdd(id); noteMastered(prev); li.classList.add('done');
      const qq = li.querySelector('.vf-qq'); if (qq && !qq.querySelector('.vf-tk')) qq.insertAdjacentHTML('beforeend', `<span class="vf-tk" aria-label="${z('做对过', 'solved')}">✓</span>`);
      onTick?.();
    }
  };
  const check = (li: HTMLElement) => {
    const q = QQ[li.dataset.q!]!, inp = li.querySelector<HTMLInputElement>('.vf-in')!, v = parseNum(inp.value);
    if (v == null) { li.dataset.st = 'bad'; li.querySelector<HTMLElement>('.vf-fb')!.innerHTML = `<b>${z('先填一个数字。', 'Type a number first.')}</b>`; return; }
    judge(li, ok(q, v));
  };
  let timer = 0;
  const redraw = () => { const r = slot.querySelector<HTMLElement>('.vf-res'); if (r && dk) r.innerHTML = demoOut(dk, s, l); };
  slot.addEventListener('click', (e) => {
    const pause = (e.target as HTMLElement).closest<HTMLElement>('[data-vs="play"]');
    if (pause && dk) {
      e.stopPropagation(); s.play = s.play ? 0 : 1; pause.setAttribute('aria-pressed', s.play ? 'true' : 'false'); pause.textContent = s.play ? z('暂停', 'Pause') : z('播放', 'Play');
      window.clearInterval(timer);
      if (s.play) timer = window.setInterval(() => { if (!slot.isConnected || !s.play) { window.clearInterval(timer); return; } s.frame = (s.frame + 1) % 8; if (dk === 'bp') s.layer = s.frame % 4; redraw(); }, 700);
      return;
    }
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-vf]'), li = b?.closest<HTMLElement>('.vf-q'); if (!b || !li) return;
    const k = b.dataset.vf!;
    if (k === 'ck') check(li);
    else if (k.startsWith('pick:')) { const i = Number(k.slice(5)); judge(li, i === QQ[li.dataset.q!]!.a, i); }
    else if (k === 'sol') { const sv = li.querySelector<HTMLElement>('.vf-sol')!, open = sv.hidden; sv.hidden = !open; b.setAttribute('aria-expanded', String(open)); b.textContent = open ? z('收起解答', 'Hide the working') : z('看解答', 'Show the working'); }
  });
  slot.addEventListener('keydown', (e) => { const t = e.target as HTMLElement; if (e.key === 'Enter' && t.classList.contains('vf-in')) { e.preventDefault(); check(t.closest<HTMLElement>('.vf-q')!); } });
  slot.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement, k = t.dataset.vs as keyof DemoS | undefined; if (!k || !dk) return; e.stopPropagation();
    s[k] = Number(t.value); const o = t.parentElement?.querySelector('output'); if (o) o.textContent = slOut(k, s[k]);
    const r = slot.querySelector<HTMLElement>('.vf-res'); if (r) r.innerHTML = demoOut(dk, s, l);
  });
  // dragging a slider must not turn the card's page or close it
  for (const ev of ['touchstart', 'touchmove', 'touchend'] as const) slot.addEventListener(ev, (e) => { if ((e.target as HTMLElement).closest('.vf-sl')) e.stopPropagation(); }, { passive: true });
}
