/* R56/R57 the per-station story. A lazy chunk. A question, the turns that do not work, the picture and the numbers,
   then a check, in that order. Internal steps stay i / r / v so progress, 回炉 and variants keep working.
   The screen never names those steps. Nothing navigates. */
import './ml.css';
import { tx, type L } from '../l4/txt';
import { ML, type Goal, type Ml } from './mld';
import { ML_G, mlGet, mlSet, type MlS } from './prog';
import { fillDvText } from './nums';
import { BASE, misOf, varN, varQ, type VarQ } from '../vf/var';
import { fmt, parseNum } from '../vf/calc';
import { vfAdd } from '../vf/ids';
import { rvAns } from '../px/rv';
import { life } from './ill';
import { diaryLine } from './diary';

type Mk = (s: string) => string;
type T = readonly [string, string];
const ABC = ['A', 'B', 'C'];
const LYN: readonly T[] = [['开场', 'Opening'], ['图', 'Picture'], ['数字', 'Numbers'], ['式子', 'Formula'], ['计算', 'Compute']];
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
export const hasMl = (k: string) => k in ML && k in ML_G;
export const mlOf = (k: string): Ml | null => ML[k] ?? null;

/** the station's 本站大目标 card + the layered body with the micro-loop bar and panels woven in */
export function wrap(k: string, lyHtml: string, l: L, mk: Mk): string {
  const M = ML[k]!, z = (a: string, b: string) => tx([a, b], l), S = mlGet(k), t = (x: T) => mk(fillDvText(tx(x, l), l));
  const goals = M.goals.map((g, i) => `<li class="${S.m[i] ? 'm' : ''}">${esc(tx(g.t, l))}${S.m[i] ? ' ✓' : ''}</li>`).join('');
  const card = `<section class="ml-goal" data-ml-card="1"><div class="ml-gh"><span>${z(`约 ${M.min} 分钟`, `about ${M.min} min`)}</span></div>
<h3 class="ml-gt">${esc(tx(M.goal, l))}</h3><ol class="ml-gl">${goals}</ol>
<div class="ml-pic"><div class="ml-ill">${life(k, l)}</div><p><b>${t(M.pic.t)}</b><span>${t(M.pic.s)}</span></p></div>
${(() => { const d = diaryLine(k, l); return d ? `<p class="ml-dy"><b>${esc(d.year)} · ${esc(d.who)}</b> ${esc(d.why)} <a href="${esc(d.url)}" target="_blank" rel="noopener">${z('出处', 'Source')}</a></p>` : ''; })()}
<button type="button" class="l4-b sm" data-ml-share="1">${z('分享这一站', 'Share this stop')}</button>
</section>`;
  const bar = `<div class="ml-bar"><div class="ml-gs" role="radiogroup" aria-label="${z('进度', 'Progress')}">${M.goals.map((_, i) => `<button type="button" role="radio" data-ml-g="${i}" aria-checked="false"><i aria-hidden="true"></i></button>`).join('')}</div></div>`;
  let h = lyHtml.replace('<div class="ly" ', `<div class="ly ml" data-ml-s="${S.s}" data-ml-k="${k}" `).replace('<div class="ly-top">', `<div class="ly-top">${bar}`);
  h = h.replace(/(<\/ol><\/div>)(<section class="ly-l")/, `$1<section class="ml-p ml-i" aria-live="polite"></section><section class="ml-p ml-rz"></section>$2`);
  h = h.replace('<div class="ly-nx"></div>', '<div class="ly-nx"></div><div class="ml-rze"></div><section class="ml-p ml-v" aria-live="polite"></section>');
  return card + h;
}

/** 带走三句 + a picture, for the station's end (memory kit) */
export const take = (k: string, l: L): { s: string[]; p: string } | null => { const M = ML[k]; return M ? { s: M.take.map((x) => fillDvText(tx(x, l), l)), p: tx(M.tpic, l) } : null; };

export function wire(host: HTMLElement, k: string, l: L, mk: Mk, prevQ: string, prevK: string) {
  const root = host.querySelector<HTMLElement>('.ly.ml'); if (!root) return;
  const M = ML[k]!, z = (a: string, b: string) => tx([a, b], l), t = (x: T) => mk(fillDvText(tx(x, l), l)), N = M.goals.length;
  let S: MlS = mlGet(k);
  const pred: (number | null)[] = M.goals.map(() => null);
  const save = () => mlSet(k, S);
  const $ = <E extends HTMLElement>(s: string) => root.querySelector<E>(s)!;
  const lyLab = (n: number, fr?: number) => `${tx(LYN[n - 1]!, l)}${fr ? z(` · 第 ${fr} 镜`, ` · shot ${fr}`) : ''}`;
  const setTop = () => { const tp = root.querySelector<HTMLElement>('.ly-top'); if (tp) root.style.setProperty('--lyt', `${Math.round(tp.getBoundingClientRect().height)}px`); };
  const refreshCard = () => {
    host.querySelectorAll<HTMLElement>('.ml-gl li').forEach((li, i) => { li.classList.toggle('m', !!S.m[i]); li.textContent = `${tx(M.goals[i]!.t, l)}${S.m[i] ? ' ✓' : ''}`; });
  };
  const bar = () => {
    root.dataset.mlS = S.s; root.dataset.mlG = String(S.g);
    root.querySelectorAll<HTMLElement>('[data-ml-g]').forEach((b) => { const i = Number(b.dataset.mlG), on = i === S.g; b.className = `${on ? 'on' : ''}${S.m[i] ? ' m' : ''}`; b.setAttribute('aria-checked', String(on)); b.setAttribute('aria-label', `${tx(M.goals[i]!.t, l)}${S.m[i] ? z('，过了', ', done') : ''}`); });
  };
  const inv = () => {
    const g = M.goals[S.g]!, pk = S.p[S.g]!, from = S.g === 0 ? (prevQ ? `<p class="ml-pv"><span>${z(`第 ${prevK} 站留下`, `Left open by stop ${prevK}`)}</span><b>${esc(prevQ)}</b></p>` : '') : `<p class="ml-pv"><span>${z('刚才留下', 'Left just now')}</span><b>${t(M.goals[S.g - 1]!.nx)}</b></p>`;
    const ops = g.o.map((o, i) => `<button type="button" class="ml-op${pk < 0 ? '' : i === g.a ? ' ok' : i === pk ? ' bad' : ' dim'}" data-ml-o="${i}"${pk >= 0 ? ' aria-disabled="true"' : ''}><b>${ABC[i]}</b><span>${t(o)}</span>${pk === i ? `<em>${z('你选了', 'your pick')}</em>` : ''}</button>`).join('');
    const why = pk < 0 ? '' : `<div class="ml-why">${g.why.map((w, i) => i === g.a ? '' : `<p class="ml-dead"><b>✗ ${ABC[i]}</b>${t(w)}</p>`).join('')}<p class="ml-live"><b>→ ${ABC[g.a]}</b>${t(g.why[g.a]!)}</p></div>
<button type="button" class="l4-b g-jump ml-go" data-ml-to="r">${z('继续 ›', 'Continue ›')}</button>`;
    $('.ml-i').innerHTML = `<h3 class="ml-h">${esc(tx(g.t, l))}</h3>${from}<p class="ml-pv2">${t(g.pv)}</p>
<p class="ml-q">${t(g.q)}</p><div class="ml-ops">${ops}</div>${why}`;
  };
  const rz = () => {
    const g = M.goals[S.g]!;
    const jumps = g.ly.map((n) => `<button type="button" class="l4-b g-info ml-ly" data-ml-ly="${n}"${n === 2 && g.fr ? ` data-ml-fr="${g.fr}"` : ''}>${esc(lyLab(n, n === 2 ? g.fr : undefined))}</button>`).join('');
    $('.ml-rz').innerHTML = `<ol class="ml-rl">${g.rz.map((x) => `<li>${t(x)}</li>`).join('')}</ol><div class="ml-lys">${jumps}</div>`;
    $('.ml-rze').innerHTML = `<button type="button" class="l4-b g-jump ml-go" data-ml-to="v">${z('继续 ›', 'Continue ›')}</button>`;
  };
  let cur: VarQ | null = null, last: 'ok' | 'bad' | null = null, lastMis: ReturnType<typeof misOf> = null;
  const ver = (judged?: VarQ) => {
    const g = M.goals[S.g]!, pp = pred[S.g], vi = S.v[S.g]! - (judged ? 1 : 0), q = judged ?? (cur = varQ(g.vk, vi)), n = varN(g.vk), streak = S.k[S.g]!;
    const pr = `<div class="ml-pr"><p class="ml-q">${t(g.pr.q)}</p><div class="ml-ops s">${g.pr.o.map((o, i) => `<button type="button" class="ml-op${pp == null ? '' : i === g.pr.a ? ' ok' : i === pp ? ' bad' : ' dim'}" data-ml-p="${i}"><b>${ABC[i]}</b><span>${t(o)}</span></button>`).join('')}</div>${pp == null ? '' : `<p class="ml-rev"><b>${pp === g.pr.a ? z('✓ 对了。', '✓ Right.') : z('✗ 不是这样：', '✗ Not this:')}</b>${t(g.pr.why)}</p>`}</div>`;
    const done = !!S.m[S.g];
    const head = `<p class="ml-q ml-vh"><span class="ml-vn">${z(`第 ${(vi % n) + 1} 组数 / ${n}`, `number set ${(vi % n) + 1} / ${n}`)} · ${done ? z('这里过了 ✓', 'this part is done ✓') : z(`连对 ${streak}/2`, `${streak}/2 in a row`)}</span></p><p class="ml-vqq">${t(q.q)}${judged && last === 'ok' ? ` <b class="ml-ans">= ${fmt(q.a, q.d)}${q.u ? tx(q.u, l) : ''}</b>` : ''}</p>`;
    let fb = '';
    if (last === 'ok') {
      const allM = S.m.every(Boolean);
      fb = `<p class="ml-fb ok"><b>✓ ${z('对了！', 'Right!')}</b>${done ? z(`「${tx(g.t, 'zh')}」过了。`, `“${tx(g.t, 'en')}” is done.`) : z('再对一道，连对两道这里就过了。', 'One more right, and two in a row finishes this part.')}</p>`
        + (done ? (S.g < N - 1 ? `<button type="button" class="l4-b g-jump ml-go" data-ml-next="1">${z(`${tx(M.goals[S.g + 1]!.t, 'zh')} ›`, `${tx(M.goals[S.g + 1]!.t, 'en')} ›`)}</button>` : allM ? `<p class="ml-fb ok"><b>★ ${z('这一站过了。', 'This stop is done.')}</b></p><button type="button" class="l4-b g-jump ml-go" data-ml-end="1">${z('带走三句 ›', 'Three lines to keep ›')}</button>` : `<button type="button" class="l4-b g-jump ml-go" data-ml-todo="1">${z('还有一处没过 ›', 'One part is still open ›')}</button>`)
          : `<button type="button" class="l4-b g-info ml-go" data-ml-again="1">${z('换一组数 ›', 'New numbers ›')}</button>`);
    } else if (last === 'bad') {
      const m = lastMis, ly = m?.ly ?? g.ly[0]!, fr = m?.fr ?? (ly === 2 ? g.fr : undefined);
      fb = `<p class="ml-fb bad"><b>✗ ${m ? tx(m.why, l).replace(/`/g, '') : z('还不对。', 'Not yet.')}</b>${m ? '' : z(`对一下：${tx(q.w, 'zh').replace(/`/g, '')}`, `Check: ${tx(q.w, 'en').replace(/`/g, '')}`)}</p>
<button type="button" class="ml-re" data-ml-ly="${ly}"${fr ? ` data-ml-fr="${fr}"` : ''}><i aria-hidden="true">↺</i><span><b>${z('回炉', 'Back to this part')}</b>${esc(`「${m ? tx(m.lab, l) : tx(g.t, l)}」· ${lyLab(ly, fr)}`)}</span><em aria-hidden="true">›</em></button>
<p class="ml-n">${z('看完再换一组数。这道记进错题本，今日复习会再考。', 'Come back for new numbers. This one is in the wrong book; today’s review will bring it back.')}</p><button type="button" class="l4-b g-info ml-go" data-ml-again="1">${z('换一组数 ›', 'New numbers ›')}</button>`;
    }
    const inp = judged ? '' : `<div class="vf-row"><input class="vf-in ml-in" type="text" inputmode="decimal" enterkeyhint="done" autocomplete="off" spellcheck="false" aria-label="${z('你的答案', 'Your answer')}" placeholder="${z('填数字', 'a number')}">${q.u ? `<span class="vf-u">${esc(tx(q.u, l))}</span>` : ''}<button type="button" class="l4-b g-act ml-ck" data-ml-ck="1">${z('检查', 'Check')}</button></div>`;
    $('.ml-v').innerHTML = `${pr}<div class="ml-vq">${head}${inp}${fb}</div>`;
  };
  const draw = () => { bar(); if (S.s === 'i') inv(); else if (S.s === 'r') rz(); else ver(); setTop(); };
  const go = (s: MlS['s'], scroll = true) => { S.s = s; save(); draw(); if (scroll) { const p = s === 'i' ? $('.ml-i') : s === 'r' ? $('.ml-rz') : $('.ml-v'); p.scrollIntoView({ block: 'start' }); } };
  const lyGo = (n: number, fr?: number) => {
    go('r', false); root.querySelector<HTMLElement>(`[data-ly-go="${n}"]`)?.click();
    if (fr) { const at = () => { const el = root.querySelector<HTMLElement>('[data-att]'); if (el?.classList.contains('ly-anim')) el.dispatchEvent(new CustomEvent('att-go', { detail: fr - 1 })); else setTimeout(at, 250); }; at(); }
  };
  const check = () => {
    const inp = root.querySelector<HTMLInputElement>('.ml-in'), q = cur; if (!inp || !q) return;
    const v = parseNum(inp.value); const fbx = root.querySelector('.ml-vq');
    if (v == null) { fbx?.querySelector('.ml-fb')?.remove(); fbx?.insertAdjacentHTML('beforeend', `<p class="ml-fb bad"><b>${z('先填一个数字。', 'Type a number first.')}</b></p>`); return; }
    const g = M.goals[S.g]!, right = Math.abs(v - q.a) <= q.tol + 1e-9, base = (S.v[S.g]! % varN(g.vk)) === 0 ? BASE[g.vk] : undefined;
    if (base) { rvAns(base, right); if (right) vfAdd(base); }
    if (right) { S.k[S.g] = S.k[S.g]! + 1; if (S.k[S.g]! >= 2) S.m[S.g] = 1; last = 'ok'; lastMis = null; }
    else { S.k[S.g] = 0; last = 'bad'; lastMis = misOf(q, v); }
    // the next variant is already chosen (new numbers whatever happens next); the judged one stays on screen
    S.v[S.g] = S.v[S.g]! + 1; save(); refreshCard(); bar(); ver(q);
    root.dataset.mlLast = last;
  };
  root.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-ml-g],[data-ml-s],[data-ml-o],[data-ml-to],[data-ml-ly],[data-ml-p],[data-ml-ck],[data-ml-again],[data-ml-next],[data-ml-end],[data-ml-todo]'); if (!b || b.classList.contains('ly')) return;
    const d = b.dataset;
    if (d.mlG) { S.g = Number(d.mlG); last = null; save(); draw(); return; }
    if (d.mlS && b.getAttribute('role') === 'tab') { last = null; go(d.mlS as MlS['s'], false); return; }
    if (d.mlO) { if (S.p[S.g]! >= 0) return; S.p[S.g] = Number(d.mlO); save(); inv(); bar(); return; }
    if (d.mlTo) { go(d.mlTo as MlS['s']); return; }
    if (d.mlLy) { lyGo(Number(d.mlLy), d.mlFr ? Number(d.mlFr) : undefined); last = null; return; }
    if (d.mlP) { pred[S.g] = Number(d.mlP); ver(); return; }
    if (d.mlCk) { check(); return; }
    if (d.mlAgain) { last = null; ver(); root.querySelector<HTMLInputElement>('.ml-in')?.focus({ preventScroll: true }); return; }
    if (d.mlNext) { S.g = Math.min(N - 1, S.g + 1); S.s = 'i'; last = null; save(); draw(); $('.ml-i').scrollIntoView({ block: 'start' }); return; }
    if (d.mlTodo) { S.g = Math.max(0, S.m.findIndex((x) => !x)); S.s = 'i'; last = null; save(); draw(); return; }
    if (d.mlEnd) { host.querySelector<HTMLElement>('.dv-take')?.scrollIntoView({ block: 'start' }); }
  });
  root.addEventListener('keydown', (e) => { const tg = e.target as HTMLElement; if (e.key === 'Enter' && tg.classList.contains('ml-in')) { e.preventDefault(); check(); } });
  draw();
  host.querySelector('[data-ml-share]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const base = import.meta.env.BASE_URL, page = `${location.origin}${base}s/${k}/`;
    const box = document.createElement('div'); box.className = 'l4-sheet'; box.setAttribute('role', 'dialog');
    box.innerHTML = `<div class="l4-sin"><header class="l4-sh"><b class="l4-kn">${esc(tx(M.goal, l))}</b></header><div class="l4-sbody"><img alt="${esc(tx(M.goal, l))}" src="${base}og-st/${k}.png" width="320" style="width:100%;height:auto;border-radius:12px"><p class="ml-dy">${esc(page)}</p></div><footer class="l4-sf"><button type="button" class="l4-b" data-s="x">${z('关闭', 'Close')}</button></footer></div>`;
    box.addEventListener('click', (ev) => { ev.stopPropagation(); const t = ev.target as HTMLElement; if (t === box || t.closest('[data-s="x"]')) box.remove(); });
    (host.closest('#l4') ?? host).appendChild(box);
  });
  addEventListener('resize', setTop, { passive: true });
}
export type { Goal };
