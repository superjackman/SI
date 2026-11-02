/* R47 自底向上 · 推导之路 (#D, #D/0–16): the bottom-up chain that complements the top-down pyramid.
   A lazy chunk drawn into the explorer's home area with the same api as 练/记/享 (px/view), the same dark tokens,
   the cards' ①–⑤ section chips, and the one step bar. Content: ./zh.ts, ./en.ts (each its own lazy chunk). */
import '../px/px.css';
import './dv.css';
import { UI, tx, type L } from '../l4/txt';
import { cards, type Card } from '../l4/c/kc';
import type { PxApi } from '../px/view';
import type { Dv } from './types';
import { DV_K, DV_LV, DV_N, DV_SEEN } from './links';
import { LBG } from '../l4/progress';

const LC = ['#0891b2', '#0d9488', '#4f46e5', '#2563eb', '#7c3aed'], GOLD = '#c99a2e';
const col = (i: number) => { const n = DV_LV[i]!; return n ? LC[n - 1]! : GOLD; };
/** --c the layer colour (lines), --cb / --ct a fill and ink that read ≥ 4.5:1 (white on the deeper layer shade; dark ink on gold) */
const cv = (i: number) => { const n = DV_LV[i]!; return n ? `--c:${LC[n - 1]};--cb:${LBG[n - 1]}` : `--c:${GOLD};--cb:${GOLD};--ct:#1a1204`; };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
/** **keyword** · `formula` · {~approximate / empirical} */
export const mk = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<span class="k">$1</span>').replace(/`([^`]+)`/g, '<span class="formula">$1</span>').replace(/\{~([^}]+)\}/g, '<span class="dv-ap">≈ $1</span>');
const LOAD: Record<L, () => Promise<{ default: Dv }>> = { zh: () => import('./zh'), en: () => import('./en') };
export const content = async (l: L) => (await LOAD[l]()).default;
const seenGet = (): number[] => { try { const v = JSON.parse(localStorage.getItem(DV_SEEN) || '[]') as unknown; return Array.isArray(v) ? v.filter((x): x is number => typeof x === 'number') : []; } catch { return []; } };
const seenAdd = (i: number) => { const s = new Set(seenGet()); s.add(i); try { localStorage.setItem(DV_SEEN, JSON.stringify([...s].sort((a, b) => a - b))); } catch { /* private mode */ } };
const lvT = (i: number, l: L) => { const n = DV_LV[i]!; return `<span class="l4-lt" style="${cv(i)}">${n ? tx(UI.lv[n - 1]!, l) : tx(['回顾', 'Recap'], l)}</span>`; };
const stepNo = (i: number, l: L) => tx([`第 ${i} 步`, `Step ${i}`], l);

export async function dv(id: string, A: PxApi) {
  const l = A.l, D = await content(l); if (!A.still()) return;
  const z = (a: string, b: string) => tx([a, b], l), name = z('推导之路', 'Derivation path');
  if (id === 'D') return chain(A, D, z, name);
  const i = Math.min(DV_N - 1, Math.max(0, Number(id.slice(2)) || 0)), S = D.st[i]!;
  const C: Record<string, Card> = { ...(await cards(l, 'K01')), ...(await cards(l, 'KA01')), ...(await cards(l, 'KC01')) }; if (!A.still()) return;
  A.top(`<b class="l4-tt">${stepNo(i, l)} · ${esc(S.n)}</b>`);
  A.crumb([[z('首页', 'Home'), '#home'], [name, '#D'], [`${i} ${S.n}`, null]]);
  const sec = (c: number, h: string, body: string) => body ? `<section class="l4-ks"><h3 class="l4-kh c${c}">${h}</h3><div class="l4-kbd">${body}</div></section>` : '';
  const ul = (xs: string[]) => xs.length ? `<ul>${xs.map((x) => `<li>${mk(x)}</li>`).join('')}</ul>` : '';
  const prev = i > 0 ? D.st[i - 1]! : null, next = i < DV_N - 1 ? D.st[i + 1]! : null, n = DV_LV[i]!;
  const from = prev ? `<button type="button" class="dv-from" data-go="#D/${i - 1}"><span>${z(`第 ${i - 1} 步留下的问题`, `Left open by step ${i - 1}`)}</span><b>${esc(prev.e)}</b></button>` : `<p class="dv-from s"><span>${z('起点', 'The start')}</span><b>${z('地基：一个能调的函数', 'The foundation: a function you can tune')}</b></p>`;
  const nxt = next ? `<button type="button" class="l4-b g-jump dv-nx" data-go="#D/${i + 1}">${z(`去第 ${i + 1} 步 · `, `On to step ${i + 1} · `)}${esc(next.n)}</button>`
    : `<div class="px-row l"><button type="button" class="l4-b g-jump" data-go="#D">${z('回链路图', 'Back to the chain')}</button><button type="button" class="l4-b" data-go="#home">${z('去金字塔', 'To the pyramid')}</button></div>`;
  const ks = DV_K[i]!.filter((k) => C[k]).map((k) => `<button type="button" class="l4-b g-info dv-kb" data-k="${k}"><span class="dv-kid">${k}</span>${esc(C[k]!.n)}</button>`).join('');
  A.host.innerHTML = `<div class="px dv dv-sp" style="--c:${col(i)}">
<div class="dv-hd">${lvT(i, l)}<span class="dv-so">${esc(S.s)}</span></div>${from}
${sec(1, z('① 要解决的问题', '① The problem'), mk(S.q))}${sec(2, z('② 核心思想', '② The idea'), ul(S.i))}${sec(3, z('③ 关键公式 / 机制', '③ Formula / mechanism'), ul(S.f))}${sec(4, z('④ 小数字例子', '④ A small example'), ul(S.x))}
${sec(5, next ? z('⑤ 遗留问题 → 下一步', '⑤ Left open → next') : z('⑤ 接下来', '⑤ What next'), `<p class="dv-lo">${mk(S.lo)}</p>${nxt}`)}
<p class="dv-do"><b>${z('动手验证', 'Try it')}</b>${mk(S.h)}</p>
<div class="dv-ks"><h3>${z('站内知识卡', 'Cards on this site')}</h3><div class="dv-kg">${ks}</div>${n ? `<button type="button" class="l4-b dv-lv" data-go="#L${n}">${z(`在金字塔里看${tx(UI.lv[n - 1]!, l)} ›`, `See ${tx(UI.lv[n - 1]!, l)} in the pyramid ›`)}</button>` : ''}</div></div>`;
  A.host.scrollTop = 0; seenAdd(i);
  A.step({ n: DV_N, i, pv: z('上一步', 'Back'), nx: next ? z('下一步', 'Next') : z('回链路图', 'The chain'), prev: i > 0 ? `#D/${i - 1}` : null, next: next ? `#D/${i + 1}` : '#D', dot: (k) => A.go(`#D/${k}`), z0: true });
  if (A.still()) A.root.dataset.px = `${id}.${l}`;
}

function chain(A: PxApi, D: Dv, z: (a: string, b: string) => string, name: string) {
  const l = A.l, seen = new Set(seenGet());
  A.top(`<b class="l4-tt">${esc(D.t)}</b>`); A.crumb([[z('首页', 'Home'), '#home'], [name, null]]); A.step(null);
  let last = -1, h = '';
  D.st.forEach((S, i) => {
    const n = DV_LV[i]!;
    if (n !== last) { last = n; h += `<div class="dv-gh" style="--c:${col(i)}">${lvT(i, l)}<b>${n ? esc(tx(UI.lvN[n - 1]!, l)) : z('串起全链路', 'The whole chain')}</b>${n ? `<button type="button" class="dv-gp" data-go="#L${n}">${z('金字塔 ›', 'Pyramid ›')}</button>` : ''}</div>`; }
    h += `<button type="button" class="dv-st g-rj${seen.has(i) ? ' seen' : ''}" data-go="#D/${i}" style="${cv(i)}"><span class="dv-n">${i}</span><span class="dv-t"><b>${esc(S.n)}</b><i>${esc(S.s)}</i></span>${seen.has(i) ? '<em aria-label="✓">✓</em>' : ''}</button>`;
    if (S.e) h += `<div class="dv-lk"><span>${z('遗留', 'Left open')}</span>${esc(S.e)}</div>`;
  });
  const nx = [...Array(DV_N).keys()].find((i) => !seen.has(i)), go = nx ?? 0;
  A.host.innerHTML = `<div class="px dv dv-ch"><p class="px-sub">${esc(D.sub)}</p>
<details class="px-how"><summary><span>${z('怎么读 · 和金字塔的关系', 'How to read it · and the pyramid')}</span></summary><p class="px-f">${mk(D.how)}</p></details>
<p class="dv-rd">${z('↓ 往下读：每个箭头旁是上一步留下的问题，下一步就是它的答案。', '↓ Read down: beside each arrow is what the step above left open; the next step answers it.')}<b>${z(`读过 ${seen.size}/${DV_N}`, `${seen.size}/${DV_N} read`)}</b></p>
<div class="dv-c">${h}</div>
<div class="px-row"><button type="button" class="l4-b g-jump big" data-go="#D/${go}">${nx == null ? z('从第 0 步重读', 'Read again from step 0') : seen.size ? z(`继续：第 ${go} 步`, `Continue: step ${go}`) : z('从第 0 步开始', 'Start at step 0')}</button></div></div>`;
  if (A.still()) A.root.dataset.px = `D.${l}`;
}
