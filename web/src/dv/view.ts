/* R47 自底向上 · 推导之路 (#D, #D/<station>): the bottom-up chain that complements the top-down pyramid.
   A lazy chunk drawn into the explorer's home area with the same api as 练/记/享 (px/view), the same dark tokens,
   the cards' ①–⑤ section chips, and the one step bar. Content: ./zh.ts, ./en.ts (each its own lazy chunk). */
import '../px/px.css';
import './dv.css';
import { UI, tx, type L } from '../l4/txt';
import { cards, type Card } from '../l4/c/kc';
import type { PxApi } from '../px/view';
import type { Dv } from './types';
import { DV_ALIAS, DV_BORN, DV_EX, DV_FOCUS, DV_KEY, DV_LV, DV_N, DV_NM, DV_OF, DV_SEEN, DV_USES, cardLv, dvI, dvK, posLabel } from './links';
import { ROUTES, goalGet, routeNext, routeOf } from './routes';
import { LBG } from '../l4/progress';
import { vfDone, vfStat, vfStages } from '../vf/ids';
import { ML_G, masteredSt, seenSt, stationMin } from './prog';
import { stripIds } from './plain';
import { morph, morphWire } from './morph';
import { outlineHtml, railHtml, railWire } from './rail';
import { tx as cx } from '../i18n/L';

const LC = ['var(--lv1)', 'var(--lv2)', 'var(--lv3)', 'var(--lv4)', 'var(--lv5)'], GOLD = 'var(--highlight)';
const col = (i: number) => { const n = DV_LV[i]!; return n ? LC[n - 1]! : GOLD; };
/** --c the layer colour (lines), --cb / --ct a fill and ink that read ≥ 4.5:1 (white on the deeper layer shade; dark ink on gold) */
const cv = (i: number) => { const n = DV_LV[i]!; return n ? `--c:${LC[n - 1]};--cb:${LBG[n - 1]}` : `--c:${GOLD};--cb:${GOLD};--ct:var(--on-navy)`; };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
/** **keyword** · `formula` · {~approximate / empirical} · ⟦q:colour mark⟧ (R51, q k v c r) */
export const mk = (s: string) => esc(stripIds(s)).replace(/\*\*(.+?)\*\*/g, '<span class="k">$1</span>').replace(/`([^`]+)`/g, '<span class="formula">$1</span>').replace(/\{~([^}]+)\}/g, '<span class="dv-ap">≈ $1</span>').replace(/⟦([qkvcr]):([^⟧]+)⟧/g, '<span class="ly-c ly-$1">$2</span>');
const LOAD: Record<L, () => Promise<{ default: Dv }>> = { zh: () => import('./zh'), en: () => import('./en') };
// R49: {#key} numbers come from the shared table in nums.ts, same as the cards
export const content = async (l: L) => {
  const [m, N] = await Promise.all([LOAD[l](), import('./nums')]);
  return N.deepFill(m.default, (s) => N.fillDvText(s, l));
};
/* 读过: kept as station keys ('8a'); older plain step numbers: 8→both halves, 15→15a+15b */
export const seenKeys = (v: unknown): string[] => !Array.isArray(v) ? [] : [...new Set(v.flatMap((x): string[] => typeof x === 'number' ? (x === 8 ? ['8a', '8b'] : x === 15 ? ['15a', '15b'] : [String(x)]) : typeof x === 'string' ? [x] : []))].filter((k) => dvI(k) >= 0);
/** the stations read, as indices */
const seenGet = (): number[] => { try { return seenKeys(JSON.parse(localStorage.getItem(DV_SEEN) || '[]')).map(dvI); } catch { return []; } };
const seenAdd = (i: number) => { const s = new Set(seenGet()); s.add(i); try { localStorage.setItem(DV_SEEN, JSON.stringify([...s].sort((a, b) => a - b).map(dvK))); } catch { /* private mode */ } };
const lvT = (i: number, l: L) => { const n = DV_LV[i]!; return `<span class="l4-lt" style="${cv(i)}">${n ? tx(UI.lv[n - 1]!, l) : tx(['回顾', 'Recap'], l)}</span>`; };
const stepNo = (i: number, l: L) => posLabel(i, l === 'en' ? 'en' : 'zh');
/** #D/<key> of station i */
const hD = (i: number) => `#D/${dvK(i)}`;
/** end of a station: the reason to continue, then the next stop, then share and backup. No dialog. */
export function stationEnd(lo: string, next: string, share: string, backup: string): string {
  return `<section class="dv-end" data-st-end="1"><p class="dv-lo">${lo}</p>${next}<div class="px-row dv-end-do"><button type="button" class="l4-b" data-st-share="1">${share}</button><button type="button" class="l4-b" data-go="#R">${backup}</button></div></section>`;
}

export async function dv(id: string, A: PxApi) {
  const l = A.l, D = await content(l); if (!A.still()) return;
  const z = (a: string, b: string) => tx([a, b], l), name = z('推导之路', 'Derivation path');
  if (id === 'D') return chain(A, D, z, name);
  if (id === 'D/map') return map(A, D, z, name);
  if (id === 'D/routes') return routes(A, D, z, name);
  if (id === 'D/ch' || id.startsWith('D/ch/')) { const m = await import('./ch'); if (!A.still()) return; return m.challenge(id, A); }
  const i0 = dvI((DV_ALIAS[id] ?? id).slice(2)), i = i0 >= 0 ? i0 : 0, S = D.st[i]!;
  const C: Record<string, Card> = { ...(await cards(l, 'K01')), ...(await cards(l, 'KA01')), ...(await cards(l, 'KC01')) }; if (!A.still()) return;
  /* the station count sits in the page title and in .dv-pos, both in the reading column’s frame, so a wide layout still shows it when the bottom pager is not the place to look */
  A.top(`<b class="l4-tt">${stepNo(i, l)} · ${esc(S.n)}</b>`);
  A.crumb([[z('首页', 'Home'), '#home'], [name, '#D'], [`${stepNo(i, l)} · ${S.n}`, null]]);
  const sec = (c: number, h: string, body: string) => body ? `<section class="l4-ks"><h3 class="l4-kh c${c}">${h}</h3><div class="l4-kbd">${body}</div></section>` : '';
  const ul = (xs: string[]) => xs.length ? `<ul>${xs.map((x) => `<li>${mk(x)}</li>`).join('')}</ul>` : '';
  const prev = i > 0 ? D.st[i - 1]! : null, next = i < DV_N - 1 ? D.st[i + 1]! : null, n = DV_LV[i]!;
  const prevSeen = i > 0 && seenSt().has(dvK(i - 1));
  const bridge = (S.ly?.hook ?? S.s).split(/[。！？.!?]/)[0] ?? S.s;
  const from = !prev ? `<p class="dv-from s"><span>${z('起点', 'The start')}</span><b>${z('地基：一个能调的函数', 'The foundation: a function you can tune')}</b></p>`
    : prevSeen ? `<button type="button" class="dv-from" data-go="${hD(i - 1)}"><span>${z(`${stepNo(i - 1, l)}留下的问题`, `Left open by ${stepNo(i - 1, l)}`)}</span><b>${esc(prev.e)}</b></button>`
    : `<p class="dv-from s"><span>${z('从这里接上', 'Pick up here')}</span><b>${esc(bridge)}</b></p>`;
  const nxt = next ? `<button type="button" class="l4-b g-jump dv-nx" data-fwd="1" data-go="${hD(i + 1)}">${z(`下一站 · ${stepNo(i + 1, l)} · `, `Next · ${stepNo(i + 1, l)} · `)}${esc(next.n)}</button>`
    : `<div class="dv-end"><button type="button" class="l4-b g-jump" data-fwd="1" data-go="#D">${z('回链路', 'Back to the chain')}</button><a class="dv-quiet" href="#map">${z('看五层结构', 'The five layers')}</a></div>`;
  /* R48 cards both ways: born here (square 第n层 badge = the card's pyramid layer) / used again here (round 第n步 badge = where it was born) */
  const kb = (k: string, badge: string) => `<button type="button" class="l4-b g-info dv-kb" data-k="${k}">${badge}<span class="dv-kn">${esc(C[k]!.n)}</span></button>`;
  const lvB = (k: string) => { const c = cardLv(k); return `<span class="l4-lt" style="--cb:${LBG[c - 1]}">${tx(UI.lv[c - 1]!, l)}</span>`; };
  const born = DV_BORN[i]!.filter((k) => C[k]).map((k) => kb(k, lvB(k))).join(''), uses = DV_USES[i]!.filter((k) => C[k]).map((k) => kb(k, `<span class="dv-sb">${posLabel(DV_OF[k]!, l === 'en' ? 'en' : 'zh')}</span>`)).join('');
  const exK = DV_EX[i]!.length ? `<p class="dv-exh">${z('同一组数', 'The same numbers')}</p><div class="dv-kg dv-ex">${DV_EX[i]!.filter((k) => C[k]).map((k) => kb(k, lvB(k))).join('')}</div>` : '';
  const top0 = DV_BORN[i]!.find((k) => cardLv(k) === n), tdh = n ? `#L${n}${top0 ? '~' + top0 : ''}` : '#home';
  /* R51 the layered pilot: ① hook → ⑤ check replaces ①–④ + 动手验证 + 验证 (lazy chunk ./ly) */
  const LY = S.ly ? await import('./ly') : null; if (!A.still()) return;
  /* R56 the micro-loop pilot (调查 → 推理 → 验证) wraps the layered body on stations with ML content */
  const MLm = LY && dvK(i) in ML_G ? await import('./ml') : null; if (!A.still()) return;
  const page = `D/${dvK(i)}`;
  A.root.dataset.topdown = tdh;
  const hook = S.ly?.hook ? mk(S.ly.hook) : mk((S.i[0] ?? S.q).split(/[。！？.!?]/)[0] ?? S.q);
  const finished = masteredSt().has(dvK(i));
  const seenNow = seenSt();
  const tabs = `<nav class="st-tabs" aria-label="${z('这一站的段落', 'Parts of this stop')}"><a href="#life" aria-current="true">${z('生活画面', 'Scene')}</a><a href="#fig">${z('图', 'Picture')}</a><a href="#formula">${z('公式', 'Formula')}</a><a href="#code">${z('代码', 'Code')}</a></nav>`;
  A.host.innerHTML = `<div class="px dv dv-sp" data-done="${finished ? '1' : '0'}" style="--c:${col(i)}">${outlineHtml(i, l, seenNow, masteredSt())}<div class="st-main">
${tabs}
<p class="dv-pos">${stepNo(i, l)} · ${z(`约 ${stationMin(ML_G[dvK(i)] ?? 3)} 分钟`, `about ${stationMin(ML_G[dvK(i)] ?? 3)} min`)}</p>
<h1 class="st-h">${esc(S.n)}</h1>
<p class="st-nar">${mk(S.s)}</p>
<p class="dv-sum">${lvT(i, l)}<span>${esc(S.s)}</span></p>${from}<div class="st-stage"><figure class="dv-lead" id="life">${morph(dvK(i), l)}</figure></div><p class="dv-first">${hook}</p>
${LY && S.ly ? (MLm ? MLm.wrap(dvK(i), LY.html({ ...S, ly: S.ly }, page, l, mk, exK), l, mk) : LY.html({ ...S, ly: S.ly }, page, l, mk, exK)) : `${sec(1, z('① 要解决的问题', '① The problem'), mk(S.q))}${sec(2, z('② 核心思想', '② The idea'), ul(S.i))}${sec(3, z('③ 关键公式 / 机制', '③ Formula / mechanism'), ul(S.f))}${sec(4, z('④ 小数字例子', '④ A small example'), ul(S.x) + exK)}`}
${memKit(i, S, prev, next, l, z, MLm?.take(dvK(i), l) ?? null)}
<section class="l4-ks dv-later"><h3 class="l4-kh c5">${next ? z(LY ? '遗留问题 → 下一步' : '⑤ 遗留问题 → 下一步', LY ? 'Left open → next' : '⑤ Left open → next') : z('⑤ 接下来', '⑤ What next')}</h3><div class="l4-kbd">${stationEnd(mk(S.lo), nxt, esc(cx('end.share', l)), esc(cx('end.backup', l)))}</div></section>
${LY ? '' : `<p class="dv-do"><b>${z('动手验证', 'Try it')}</b>${mk(S.h)}</p>
<div class="vf-slot" data-vf-page="${page}"></div>`}
${(dvK(i) === '2' || dvK(i) === '8a') ? `<div class="px-row"><button type="button" class="l4-b g-act" data-go="#D/ch/${dvK(i)}">${z('✎ 分享挑战题：让朋友算一算', '✎ Share a challenge: let a friend try')}</button></div>` : ''}
<div class="dv-ks"><h3>${z('换个角度看 · 金字塔里的卡', 'Another angle · cards in the pyramid')}</h3>${born ? `<h4>${z('本步诞生的卡', 'Born in this step')}</h4><div class="dv-kg">${born}</div>` : ''}${uses ? `<h4>${z('本步也用到', 'Also used here')}</h4><div class="dv-kg">${uses}</div>` : ''}<button type="button" class="l4-b g-info dv-mp" data-go="#D/map">${z('在知识地图里看这一步', 'This step on the knowledge map')}</button>${n ? `<button type="button" class="l4-b dv-lv" data-go="#L${n}">${z(`↓ 去金字塔 第${n}层`, `↓ To the pyramid · layer ${n}`)}</button>` : ''}</div></div>${railHtml(dvK(i), S, l)}</div>`;
  A.host.scrollTop = 0; seenAdd(i);
  let fk: string | null = null; try { fk = sessionStorage.getItem(DV_FOCUS); sessionStorage.removeItem(DV_FOCUS); } catch { /* private mode */ }
  A.host.querySelector('.dv-ks .dv-mp')?.addEventListener('click', () => { try { sessionStorage.setItem(DV_FOCUS, `s${dvK(i)}`); } catch { /* private mode */ } });
  const fb = fk ? A.host.querySelector<HTMLElement>(`.dv-ks .dv-kb[data-k="${fk}"]`) : null; if (fb) { fb.classList.add('on'); fb.scrollIntoView({ block: 'center' }); }
  /* R50 验证优化: demo + 自己算一算 + 常见误解, lazy (first load untouched); re-centre a focused card once it has grown */
  const slot = LY ? null : A.host.querySelector<HTMLElement>('.vf-slot');
  if (LY) LY.wire(A.host, page, l);
  if (MLm) MLm.wire(A.host, dvK(i), l, mk, prevSeen ? (prev?.e ?? '') : '', prevSeen && i > 0 ? dvK(i - 1) : '');
  if (slot) void import('../vf/ui').then((m) => { if (!A.still() || !slot.isConnected) return; m.mount(slot, `D/${dvK(i)}`, l); if (fb) fb.scrollIntoView({ block: 'center' }); });
  A.step({ n: DV_N, i, pv: z('上一站', 'Prev stop'), nx: next ? z('下一站', 'Next stop') : z('回链路', 'Chain'), prev: i > 0 ? hD(i - 1) : null, next: next ? hD(i + 1) : '#D', dot: (k) => A.go(hD(k)), z0: true, keys: DV_KEY, hold: true, txt: stepNo(i, l) });
  A.host.querySelector('[data-st-share]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    void import('./share').then(({ openShare, progressLine }) => openShare(A.root, l, dvK(i), cx('end.share', l), progressLine(dvK(i), l), 'stop', `si-stop-${dvK(i)}`));
  });
  const ly = A.host.querySelector('.ly');
  const lead = A.host.querySelector('.dv-lead');
  if (ly && lead) ly.prepend(lead);
  const side = A.host.querySelector('.st-side');
  const nxb = A.host.querySelector('.dv-nx');
  if (side && nxb) side.appendChild(nxb);
  if (A.still()) { morphWire(A.host); railWire(A.host, dvK(i)); }
  if (A.still()) A.root.dataset.px = `D/${dvK(i)}.${l}`;
}

/* R56 记忆四件套 ①②: 本站只带走 3 句 + one picture, and the chain line 上一站 → 这站 → 下一站 with the layer it lands on.
   Every station has hand-written lines (./mld). If a station ever has none, the fallback is the first sentence of its
   idea, its mechanism and what it leaves open. */
const first = (s: string) => { const m = /^(.+?[。．.!?！？])(\s|$)/.exec(s); return (m ? m[1]! : s).trim(); };
// R56: keep the last few glyphs of a takeaway together (no one-glyph last line)
const glueT = (h: string) => h.replace(/((?:&[a-z#0-9]+;|[^<>&\s]){1,4})$/, '<span class="nw">$1</span>');
function memKit(i: number, S: Dv['st'][number], prev: Dv['st'][number] | null, next: Dv['st'][number] | null, l: L, z: (a: string, b: string) => string, own: { s: string[]; p: string } | null) {
  const n = DV_LV[i]!;
  const s3 = own?.s ?? [S.i[0], S.i[1] ?? S.f[0], S.lo].filter((x): x is string => !!x).map(first).slice(0, 3);
  const pic = own?.p ?? (S.ly ? first(S.ly.an[0] ?? S.ly.hook) : '');
  const picBits = pic.split(/(?<=[。！？])/).map((s) => s.trim()).filter(Boolean);
  const take = `<section class="dv-take" id="take"><div class="dv-th"><b>🧠 ${z('本站只带走 3 句', 'Take away three lines')}</b><span>${z('可截图存成卡片', 'Screenshot it as a card')}</span></div><ol>${s3.map((x) => `<li>${glueT(mk(x))}</li>`).join('')}</ol>${pic ? `<p class="dv-tp"><span>${z('一个画面记住它', 'One picture to remember it')}</span><b>${picBits.map((s) => `<span class="dv-ps">${mk(s)}</span>`).join('')}</b></p>` : ''}</section>`;
  const pl = (j: number) => posLabel(j, l === 'en' ? 'en' : 'zh');
  const nd = (j: number, cls: string, label: string) => `<button type="button" class="dv-cn ${cls}" data-go="#D/${dvK(j)}" style="${cv(j)}"><span>${esc(label)}</span><b>${esc(DV_NM_(j, l))}</b></button>`;
  const line = [prev ? nd(i - 1, 'p', z(`上一站 ${pl(i - 1)}`, `Prev ${pl(i - 1)}`)) : '', `<span class="dv-cn c" style="${cv(i)}"><span>${z(`这一站 ${pl(i)}`, `This stop ${pl(i)}`)}</span><b>${esc(S.n)}</b></span>`, next ? nd(i + 1, 'n', z(`下一站 ${pl(i + 1)}`, `Next ${pl(i + 1)}`)) : ''].filter(Boolean).join('<i class="dv-ca" aria-hidden="true">↓</i>');
  const why = prev ? z(`上一站留下「${prev.e}」，这一站用「${S.s}」接住${next ? `；它又留下「${S.e}」，下一站解决。` : '。'}`, `The last stop left “${prev.e}”; this one answers with “${S.s}”${next ? `, and leaves “${S.e}” for the next.` : '.'}`) : z(`起点：「${S.s}」，留下「${S.e}」给下一站。`, `The start: “${S.s}”, leaving “${S.e}” for the next.`);
  const chainB = `<section class="dv-chn"><div class="dv-th"><b>🔗 ${z('串起来：你走到了哪', 'The chain: where you are')}</b><span>${pl(i)}</span></div><div class="dv-cl">${line}</div><p class="dv-cw">${mk(why)}</p><p class="dv-cp">${n ? z(`在金字塔里的位置：第 ${n} 层「${tx(UI.lvN[n - 1]!, 'zh')}」`, `In the pyramid: layer ${n}, “${tx(UI.lvN[n - 1]!, 'en')}”`) : z('回顾：把五层串起来', 'Recap: all five layers together')}</p></section>`;
  // the last stop of a pyramid layer offers 阶段排序 for that layer
  return take + chainB;
}
const DV_NM_ = (j: number, l: L) => tx(DV_NM[j] ?? ['', ''], l);

function chain(A: PxApi, D: Dv, z: (a: string, b: string) => string, name: string) {
  const l = A.l, seen = new Set(seenGet()), vd = vfDone(), vs = vfStages(DV_N, vd);
  /* R50: the self-check ratio per step (same done/total convention as 读过) */
  const qt = (i: number) => { const r = vfStat(`D/${dvK(i)}`, vd); return r.t ? `<span class="dv-qt${r.s === r.t ? ' all' : ''}" aria-label="${z(`掌握 ${r.s}/${r.t}`, `mastered ${r.s}/${r.t}`)}">✎ ${r.s}/${r.t}</span>` : ''; };
  const ms = masteredSt(vd), mastered = (i: number) => ms.has(dvK(i));
  A.top(`<b class="l4-tt">${esc(D.t)}</b>`); A.crumb([[z('首页', 'Home'), '#home'], [name, null]]); A.step(null);
  let last = -1, h = '';
  D.st.forEach((S, i) => {
    const n = DV_LV[i]!;
    if (n !== last) { last = n; h += `<div class="dv-gh" style="--c:${col(i)}">${lvT(i, l)}<b>${n ? esc(tx(UI.lvN[n - 1]!, l)) : z('串起全链路', 'The whole chain')}</b>${n ? `<button type="button" class="dv-gp" data-go="#L${n}">${z('金字塔 ›', 'Pyramid ›')}</button>` : ''}</div>`; }
    h += `<button type="button" class="dv-st g-rj${mastered(i) ? ' mastered' : seen.has(i) ? ' seen' : ''}" data-go="${hD(i)}" style="${cv(i)}"><span class="dv-n">${i + 1}</span><span class="dv-t"><b>${esc(S.n)}</b><i>${esc(S.s)}</i></span>${qt(i)}${mastered(i) ? '<em aria-label="mastered">★</em>' : seen.has(i) ? '<em aria-label="✓">✓</em>' : ''}</button>`;
    if (S.e) h += `<div class="dv-lk"><span>${z('遗留问题', 'Left open')}</span>${esc(S.e)}</div>`;
  });
  const nx = [...Array(DV_N).keys()].find((i) => !mastered(i)) ?? [...Array(DV_N).keys()].find((i) => !seen.has(i)), go = nx ?? 0;
  A.host.innerHTML = `<div class="px dv dv-ch"><p class="px-sub">${esc(D.sub)}</p>
<details class="px-how"><summary><span>${z('怎么读 · 和金字塔的关系', 'How to read it · and the pyramid')}</span></summary><p class="px-f">${mk(D.how)}</p></details>
<p class="dv-rd">${z('↓ 往下读：每个箭头旁是上一步留下的问题，下一步就是它的答案。', '↓ Read down: beside each arrow is what the step above left open; the next step answers it.')}<b class="dv-qr">${z(`掌握 ${ms.size}/${DV_N} 站`, `Mastered ${ms.size}/${DV_N} stops`)}</b><b>${z(`答对 ${vs.s}/${vs.t} 题`, `${vs.s}/${vs.t} right`)}</b><b>${z(`读过 ${seen.size}/${DV_N}`, `${seen.size}/${DV_N} read`)}</b></p>
<div class="px-row l"><button type="button" class="l4-b g-info dv-mp" data-go="#D/map">${z('知识地图', 'Knowledge map')}</button><button type="button" class="l4-b g-jump" data-go="#D/routes">${z('五条学习路线 ›', 'Five learning routes ›')}</button></div>
<div class="dv-c">${h}</div>
<div class="px-row"><button type="button" class="l4-b g-jump big" data-go="${hD(go)}">${nx == null ? z(`从${posLabel(0, l === 'en' ? 'en' : 'zh')}重读`, `Read again from ${posLabel(0, 'en')}`) : seen.size ? z(`继续：${posLabel(go, l === 'en' ? 'en' : 'zh')}`, `Continue: ${posLabel(go, 'en')}`) : z(`从${posLabel(0, l === 'en' ? 'en' : 'zh')}开始`, `Start at ${posLabel(0, 'en')}`)}</button></div></div>`;
  A.host.scrollTop = 0;
  if (A.still()) A.root.dataset.px = `D.${l}`;
}

/* R48 知识地图 (#D/map): the phone version of the two-axes map. Rows = the derivation steps (bottom-up, read down),
   columns = the pyramid layers 5 → 1 (top-down), each cell = the cards born in that step on that layer.
   The gold cell in each row is the step's own layer, so the gold cells trace the path from 第5层 down-right to 第1层. */
async function map(A: PxApi, D: Dv, z: (a: string, b: string) => string, name: string) {
  const l = A.l, C: Record<string, Card> = { ...(await cards(l, 'K01')), ...(await cards(l, 'KA01')), ...(await cards(l, 'KC01')) }; if (!A.still()) return;
  const t = z('知识地图 · 两个坐标', 'Knowledge map · both axes');
  A.top(`<b class="l4-tt">${t}</b>`); A.crumb([[z('首页', 'Home'), '#home'], [name, '#D'], [z('知识地图', 'Map'), null]]); A.step(null);
  const LS = [5, 4, 3, 2, 1], vd = vfDone();
  const qt = (i: number) => { const r = vfStat(`D/${dvK(i)}`, vd); return r.t ? `<span class="dv-qt${r.s === r.t ? ' all' : ''}" aria-label="${z(`自测 ${r.s}/${r.t}`, `self-check ${r.s}/${r.t}`)}">✎ ${r.s}/${r.t}</span>` : ''; };
  const hd = `<div class="dv-mr dv-mh">${LS.map((n) => `<button type="button" class="dv-mlh" data-go="#L${n}" aria-label="${tx(UI.lv[n - 1]!, l)}"><span class="l4-lt" style="--cb:${LBG[n - 1]}">${z(`第${n}层`, `L${n}`)}</span></button>`).join('')}</div>`;
  const rows = D.st.map((S, i) => {
    const own = DV_LV[i]!, by: Record<number, string[]> = {}; for (const k of DV_BORN[i]!) if (C[k]) (by[cardLv(k)] ??= []).push(k);
    const cells = LS.map((n) => `<div class="dv-mx${n === own ? ' own' : ''}">${(by[n] ?? []).map((k) => `<button type="button" class="dv-mk" data-k="${k}" style="--cb:${LBG[n - 1]}" aria-label="${k} ${esc(C[k]!.n)}">${k}</button>`).join('')}</div>`).join('');
    return `<div class="dv-mr${own ? '' : ' rc'}" id="s${dvK(i)}"><button type="button" class="dv-ms" data-go="${hD(i)}" style="${cv(i)}"><span class="dv-sb">${posLabel(i, l === 'en' ? 'en' : 'zh')}</span><b>${esc(S.n)}</b>${qt(i)}</button>${cells}</div>`;
  }).join('');
  A.host.innerHTML = `<div class="px dv dv-map" lang="${l === 'en' ? 'en' : 'zh-CN'}"><p class="px-sub">${z('同一批知识卡，两个坐标：竖着读是推导顺序（它在第几步诞生），横着读是金字塔（它属于第几层）。金色格＝这一步所在的层，从左上一路走到右下，就是从数学搭到 Agent 的路线。', 'The same cards on two axes: read down for the derivation order (the step a card is born in), across for the pyramid (its layer). Gold cells = the layer each step sits on; from top left to bottom right they trace the route from maths to agents.')}</p>
<p class="dv-mlg"><span class="dv-mk" style="--cb:${LBG[3]}">K09</span>${z('点卡＝在这里打开它', 'Tap a card to open it here')}<span class="dv-sb">${posLabel(dvI('2'), l === 'en' ? 'en' : 'zh')}</span>${z('点站名＝去那一站', 'Tap a stop to go there')}</p>
<div class="dv-mg">${hd}${rows}</div>
<div class="px-row l"><button type="button" class="l4-b g-jump" data-go="#D">${z('回链路', 'Back to chain')}</button><button type="button" class="l4-b" data-go="#map">${z('看五层结构', 'The five layers')}</button></div></div>`;
  A.host.scrollTop = 0;
  let fr: string | null = null; try { fr = sessionStorage.getItem(DV_FOCUS); if (fr?.startsWith('s')) sessionStorage.removeItem(DV_FOCUS); else fr = null; } catch { /* private mode */ }
  const re = fr ? A.host.querySelector<HTMLElement>(`#${fr}`) : null; if (re) { re.classList.add('on'); re.scrollIntoView({ block: 'center' }); }
  if (A.still()) A.root.dataset.px = `D/map.${l}`;
}

/* R52 五条学习路线 (#D/routes): metro-style list. Each line is a subset of the 23 stations in derivation order. */
function routes(A: PxApi, D: Dv, z: (a: string, b: string) => string, name: string) {
  const l = A.l, seen = new Set<string>(seenGet().map(dvK)), vd = vfDone();
  const mastered = masteredSt(vd);
  const mine = goalGet();
  A.top(`<b class="l4-tt">${z('五条学习路线', 'Five learning routes')}</b>`);
  A.crumb([[z('首页', 'Home'), '#home'], [name, '#D'], [z('路线', 'Routes'), null]]); A.step(null);
  const card = (r: typeof ROUTES[number]) => {
    const done = r.st.filter((k) => mastered.has(String(k))).length, tot = r.st.length, nxt = routeNext(r, mastered, seen);
    const stops = r.st.map((k) => {
      const key = String(k), i = dvI(k), on = mastered.has(key), rd = seen.has(key);
      return `<button type="button" class="dv-ms${on ? ' on' : rd ? ' seen' : ''}" data-go="${hD(i)}" style="--c:${r.c}" title="${esc(D.st[i]!.n)}"><span class="dv-sb">${i + 1}</span></button>`;
    }).join('<i class="dv-rail" style="--c:' + r.c + '" aria-hidden="true"></i>');
    return `<article class="dv-rt${mine === r.id ? ' mine' : ''}" style="--c:${r.c}">
<div class="dv-rth"><b>${esc(tx(r.n, l))}</b>${mine === r.id ? `<em>${z('我的路线', 'My route')}</em>` : ''}<span>✎ ${done}/${tot}</span></div>
<p>${esc(tx(r.s, l))}</p>
<div class="dv-railrow">${stops}</div>
<div class="px-row l"><button type="button" class="l4-b gold" data-go="${hD(dvI(nxt))}" data-goal="${r.id}">${done === tot ? z('从头再走 ›', 'Walk again ›') : z(`下一站 · ${posLabel(dvI(nxt), l === 'en' ? 'en' : 'zh')} ›`, `Next · ${posLabel(dvI(nxt), 'en')} ›`)}</button>
<button type="button" class="l4-b sm" data-a="setgoal" data-goal="${r.id}">${mine === r.id ? z('已选 ✓', 'Selected ✓') : z('设为我的路线', 'Make this my route')}</button></div></article>`;
  };
  A.host.innerHTML = `<div class="px dv dv-rts"><p class="px-sub">${z('同一批站点，五条地铁线。按你的目标选一条；沿线的站永远按推导顺序。', 'The same stations, five metro lines. Pick one for your goal; stops always follow derivation order.')}</p>
${ROUTES.map(card).join('')}
<div class="px-row l"><button type="button" class="l4-b g-jump" data-go="#D">${z('回链路', 'Back to chain')}</button><button type="button" class="l4-b" data-go="#D/map">${z('知识地图', 'Knowledge map')}</button></div></div>`;
  A.host.querySelectorAll<HTMLElement>('[data-a="setgoal"]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.goal; const r = routeOf(id); if (!r) return;
    import('./routes').then((m) => { m.goalSet(r.id); routes(A, D, z, name); });
  }));
  A.host.querySelectorAll<HTMLElement>('[data-goal][data-go]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.goal; const r = routeOf(id); if (r) void import('./routes').then((m) => m.goalSet(r.id));
  }));
  if (A.still()) A.root.dataset.px = `D/routes.${l}`;
}
