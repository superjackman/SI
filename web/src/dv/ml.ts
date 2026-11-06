/* R56 调查 → 推理 → 验证 micro-loop on the pilot stations (参考图 A1 / A2). A lazy chunk, loaded only on a station with
   ML content (./mld). It wraps the station's layered body (./ly):
   - above it, 本站大目标: the one main goal, its 2–3 small goals (lit when mastered) and the everyday picture first;
   - inside the pinned top bar, one more row: the small goals ①②③ and the three steps 🔍 调查 · 💡 推理 · ✔ 验证;
   - 🔍 调查: what is left over + "what would you do?" three ways; picking one reveals why the wrong ways fail;
   - 💡 推理: the goal's chain in 2–3 lines + jumps to the exact layers (and attention shot), then the existing layers;
   - ✔ 验证: predict, then reveal; then a computed question with new numbers each time (vf/var.ts). A miss names the
     mistake and offers 回炉: open exactly the layer / shot that explains it, then a fresh variant. Two right in a row
     masters the small goal; all small goals master the station (dv/prog masteredSt). Nothing navigates. */
import './ml.css';
import { tx, type L } from '../l4/txt';
import { ML, type Goal, type Ml } from './mld';
import { ML_G, mlGet, mlSet, type MlS } from './prog';
import { fillDvText } from './nums';
import { BASE, misOf, varN, varQ, type VarQ } from '../vf/var';
import { fmt, parseNum } from '../vf/calc';
import { vfAdd } from '../vf/ids';
import { rvAns } from '../px/rv';

type Mk = (s: string) => string;
type T = readonly [string, string];
const CIRC = ['①', '②', '③', '④', '⑤'], ABC = ['A', 'B', 'C'];
const LYN: readonly T[] = [['类比', 'Analogy'], ['图', 'Picture'], ['数字', 'Numbers'], ['公式', 'Formula'], ['小测', 'Check']];
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
export const hasMl = (k: string) => k in ML && k in ML_G;
export const mlOf = (k: string): Ml | null => ML[k] ?? null;

/** the station's 本站大目标 card + the layered body with the micro-loop bar and panels woven in */
export function wrap(k: string, lyHtml: string, l: L, mk: Mk): string {
  const M = ML[k]!, z = (a: string, b: string) => tx([a, b], l), S = mlGet(k), t = (x: T) => mk(fillDvText(tx(x, l), l));
  const goals = M.goals.map((g, i) => `<li class="${S.m[i] ? 'm' : ''}"><span>${CIRC[i]}</span>${esc(tx(g.t, l))}${S.m[i] ? ' ✓' : ''}</li>`).join('');
  const card = `<section class="ml-goal" data-ml-card="1"><div class="ml-gh"><span>${z('本站大目标', 'This stop’s goal')}</span><em>${z(`约 ${M.min} 分钟`, `about ${M.min} min`)}</em></div>
<h3 class="ml-gt">${esc(tx(M.goal, l))}</h3><ol class="ml-gl" aria-label="${z('小目标', 'Small goals')}">${goals}</ol>
<div class="ml-pic"><span class="ml-e" aria-hidden="true">${M.pic.e}</span><p><b>${t(M.pic.t)}</b><span>${t(M.pic.s)}</span></p></div>
<p class="ml-how">${z('每个小目标走一遍：🔍 先自己猜、看死路 → 💡 推理 → ✔ 先预测再揭晓、连对 2 题点亮。', 'Each small goal: 🔍 guess first and see the dead ends → 💡 reason → ✔ predict, then two right in a row lights it up.')}</p></section>`;
  const bar = `<div class="ml-bar"><div class="ml-gs" role="radiogroup" aria-label="${z('小目标', 'Small goals')}">${M.goals.map((_, i) => `<button type="button" role="radio" data-ml-g="${i}" aria-checked="false">${CIRC[i]}</button>`).join('')}</div>
<div class="ml-ss" role="tablist" aria-label="${z('三步', 'Three steps')}"><button type="button" role="tab" data-ml-s="i"><b>🔍 ${z('调查', 'Look')}</b><span>${z('先猜', 'guess')}</span></button><button type="button" role="tab" data-ml-s="r"><b>💡 ${z('推理', 'Reason')}</b><span>${z('想办法', 'work it out')}</span></button><button type="button" role="tab" data-ml-s="v"><b>✔ ${z('验证', 'Check')}</b><span>${z('亲手算', 'try it')}</span></button></div></div>`;
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
  const lyLab = (n: number, fr?: number) => `${CIRC[n - 1]} ${tx(LYN[n - 1]!, l)}${fr ? z(` · 第 ${fr} 镜`, ` · shot ${fr}`) : ''}`;
  const setTop = () => { const tp = root.querySelector<HTMLElement>('.ly-top'); if (tp) root.style.setProperty('--lyt', `${Math.round(tp.getBoundingClientRect().height)}px`); };
  const refreshCard = () => {
    host.querySelectorAll<HTMLElement>('.ml-gl li').forEach((li, i) => { li.classList.toggle('m', !!S.m[i]); li.innerHTML = `<span>${CIRC[i]}</span>${esc(tx(M.goals[i]!.t, l))}${S.m[i] ? ' ✓' : ''}`; });
  };
  const bar = () => {
    root.dataset.mlS = S.s; root.dataset.mlG = String(S.g);
    root.querySelectorAll<HTMLElement>('[data-ml-g]').forEach((b) => { const i = Number(b.dataset.mlG), on = i === S.g; b.className = `${on ? 'on' : ''}${S.m[i] ? ' m' : ''}`; b.setAttribute('aria-checked', String(on)); b.setAttribute('aria-label', `${z('小目标', 'Small goal')} ${CIRC[i]} ${tx(M.goals[i]!.t, l)}${S.m[i] ? z('（已掌握）', ' (mastered)') : ''}`); b.textContent = S.m[i] ? '✓' : CIRC[i]!; });
    root.querySelectorAll<HTMLElement>('[data-ml-s]').forEach((b) => { if (b.classList.contains('ly')) return; const on = b.dataset.mlS === S.s; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); const dn = b.dataset.mlS === 'i' ? S.p[S.g]! >= 0 : b.dataset.mlS === 'v' ? !!S.m[S.g] : false; b.classList.toggle('dn', dn); });
  };
  /* 🔍 调查 */
  const inv = () => {
    const g = M.goals[S.g]!, pk = S.p[S.g]!, from = S.g === 0 ? (prevQ ? `<p class="ml-pv"><span>${z(`第 ${prevK} 站留下`, `Left open by stop ${prevK}`)}</span><b>${esc(prevQ)}</b></p>` : '') : `<p class="ml-pv"><span>${z(`小目标 ${CIRC[S.g - 1]} 留下`, `Left by goal ${CIRC[S.g - 1]}`)}</span><b>${t(M.goals[S.g - 1]!.nx)}</b></p>`;
    const ops = g.o.map((o, i) => `<button type="button" class="ml-op${pk < 0 ? '' : i === g.a ? ' ok' : i === pk ? ' bad' : ' dim'}" data-ml-o="${i}"${pk >= 0 ? ' aria-disabled="true"' : ''}><b>${ABC[i]}</b><span>${t(o)}</span>${pk === i ? `<em>${z('你选了', 'your pick')}</em>` : ''}</button>`).join('');
    const why = pk < 0 ? '' : `<div class="ml-why">${g.why.map((w, i) => i === g.a ? '' : `<p class="ml-dead"><b>✗ ${ABC[i]}：${z('死路', 'dead end')}</b>${t(w)}</p>`).join('')}<p class="ml-live"><b>→ ${ABC[g.a]}：${z('走得通', 'this works')}</b>${t(g.why[g.a]!)}</p></div>
<button type="button" class="l4-b g-jump ml-go" data-ml-to="r">${z(`进入 💡 推理：${tx(g.t, 'zh')} ›`, `On to 💡 Reason: ${tx(g.t, 'en')} ›`)}</button>`;
    $('.ml-i').innerHTML = `<div class="ml-ph"><span class="ml-tag i">🔍 ${z('调查 · 研究者当年卡在这', 'Look · where researchers got stuck')}</span><span class="ml-sg">${z(`小目标 ${CIRC[S.g]}`, `Goal ${CIRC[S.g]}`)} / ${N}</span></div>${from}<p class="ml-pv2">${t(g.pv)}</p>
<p class="ml-q"><b>${z('先别看答案，你会怎么做？', 'Before you peek: what would you do?')}</b>${t(g.q)}</p><div class="ml-ops">${ops}</div>${why}`;
  };
  /* 💡 推理 */
  const rz = () => {
    const g = M.goals[S.g]!;
    const jumps = g.ly.map((n) => `<button type="button" class="l4-b g-info ml-ly" data-ml-ly="${n}"${n === 2 && g.fr ? ` data-ml-fr="${g.fr}"` : ''}>${esc(lyLab(n, n === 2 ? g.fr : undefined))}</button>`).join('');
    $('.ml-rz').innerHTML = `<div class="ml-ph"><span class="ml-tag r">💡 ${z('推理', 'Reason')} · ${esc(tx(g.t, l))}</span><span class="ml-sg">${z(`小目标 ${CIRC[S.g]}`, `Goal ${CIRC[S.g]}`)} / ${N}</span></div><ol class="ml-rl">${g.rz.map((x) => `<li>${t(x)}</li>`).join('')}</ol><p class="ml-lyh">${z('细看讲这一步的那几层：', 'The layers that explain this step:')}</p><div class="ml-lys">${jumps}</div>`;
    $('.ml-rze').innerHTML = `<button type="button" class="l4-b g-jump ml-go" data-ml-to="v">${z('推理完了 → ✔ 验证：先预测，再揭晓 ›', 'Reasoned it out → ✔ Check: predict, then reveal ›')}</button>`;
  };
  /* ✔ 验证 */
  let cur: VarQ | null = null, last: 'ok' | 'bad' | null = null, lastMis: ReturnType<typeof misOf> = null;
  const ver = (judged?: VarQ) => {
    const g = M.goals[S.g]!, pp = pred[S.g], vi = S.v[S.g]! - (judged ? 1 : 0), q = judged ?? (cur = varQ(g.vk, vi)), n = varN(g.vk), streak = S.k[S.g]!;
    const pr = `<div class="ml-pr"><p class="ml-q"><b>${z('① 先预测，再揭晓', '① Predict, then reveal')}</b>${t(g.pr.q)}</p><div class="ml-ops s">${g.pr.o.map((o, i) => `<button type="button" class="ml-op${pp == null ? '' : i === g.pr.a ? ' ok' : i === pp ? ' bad' : ' dim'}" data-ml-p="${i}"><b>${ABC[i]}</b><span>${t(o)}</span></button>`).join('')}</div>${pp == null ? '' : `<p class="ml-rev"><b>${pp === g.pr.a ? z('✓ 猜对了。', '✓ Good call.') : z('✗ 和直觉不一样：', '✗ Not what intuition says:')}</b>${t(g.pr.why)}</p>`}</div>`;
    const done = !!S.m[S.g];
    const head = `<p class="ml-q ml-vh"><b>${z('② 亲手算（变式题）', '② Work it out (a variant)')}</b><span class="ml-vn">${z(`第 ${(vi % n) + 1} 组数 / ${n}`, `number set ${(vi % n) + 1} / ${n}`)} · ${done ? z('小目标已掌握 ✓', 'goal mastered ✓') : z(`连对 ${streak}/2`, `${streak}/2 in a row`)}</span></p><p class="ml-vqq">${t(q.q)}${judged && last === 'ok' ? ` <b class="ml-ans">= ${fmt(q.a, q.d)}${q.u ? tx(q.u, l) : ''}</b>` : ''}</p>`;
    let fb = '';
    if (last === 'ok') {
      const allM = S.m.every(Boolean);
      fb = `<p class="ml-fb ok"><b>✓ ${z('对了！', 'Right!')}</b>${done ? z(`小目标 ${CIRC[S.g]} 点亮了。`, `Goal ${CIRC[S.g]} is lit.`) : z('再来一道新数字，连对 2 题点亮小目标。', 'One more with new numbers: two in a row lights the goal.')}</p>`
        + (done ? (S.g < N - 1 ? `<button type="button" class="l4-b g-jump ml-go" data-ml-next="1">${z(`下一个小目标 ${CIRC[S.g + 1]}：${tx(M.goals[S.g + 1]!.t, 'zh')} ›`, `Next goal ${CIRC[S.g + 1]}: ${tx(M.goals[S.g + 1]!.t, 'en')} ›`)}</button>` : allM ? `<p class="ml-fb ok"><b>★ ${z('本站掌握！', 'Stop mastered!')}</b>${z('往下看“本站只带走 3 句”。', 'See “take away three lines” below.')}</p><button type="button" class="l4-b g-jump ml-go" data-ml-end="1">${z('看本站小结 ›', 'The stop’s summary ›')}</button>` : `<button type="button" class="l4-b g-jump ml-go" data-ml-todo="1">${z('还有没点亮的小目标 ›', 'A goal is still unlit ›')}</button>`)
          : `<button type="button" class="l4-b g-info ml-go" data-ml-again="1">${z('下一道变式题 ›', 'Next variant ›')}</button>`);
    } else if (last === 'bad') {
      const m = lastMis, ly = m?.ly ?? g.ly[0]!, fr = m?.fr ?? (ly === 2 ? g.fr : undefined);
      fb = `<p class="ml-fb bad"><b>✗ ${m ? tx(m.why, l).replace(/`/g, '') : z('还不对。', 'Not yet.')}</b>${m ? '' : z(`对一下：${tx(q.w, 'zh').replace(/`/g, '')}`, `Check: ${tx(q.w, 'en').replace(/`/g, '')}`)}</p>
<button type="button" class="ml-re" data-ml-ly="${ly}"${fr ? ` data-ml-fr="${fr}"` : ''}><i aria-hidden="true">↺</i><span><b>${z('回炉：只看讲漏的那一格', 'Re-loop: just the part you missed')}</b>${esc(`「${m ? tx(m.lab, l) : tx(g.t, l)}」· ${lyLab(ly, fr)}`)}</span><em aria-hidden="true">›</em></button>
<p class="ml-n">${z('看完回来，换一道新数字的变式题；连对 2 题才点亮小目标。这道已记进错题本，之后的“今日复习”会再考。', 'Come back for a fresh variant; two in a row lights the goal. It’s in the wrong book, and “today’s review” will bring it back.')}</p><button type="button" class="l4-b g-info ml-go" data-ml-again="1">${z('换一道新数字 ›', 'New numbers ›')}</button>`;
    }
    const inp = judged ? '' : `<div class="vf-row"><input class="vf-in ml-in" type="text" inputmode="decimal" enterkeyhint="done" autocomplete="off" spellcheck="false" aria-label="${z('你的答案', 'Your answer')}" placeholder="${z('填数字', 'a number')}">${q.u ? `<span class="vf-u">${esc(tx(q.u, l))}</span>` : ''}<button type="button" class="l4-b g-act ml-ck" data-ml-ck="1">${z('检查', 'Check')}</button></div>`;
    $('.ml-v').innerHTML = `<div class="ml-ph"><span class="ml-tag v">✔ ${z('验证 · 先预测，再揭晓', 'Check · predict, then reveal')}</span><span class="ml-sg">${z(`小目标 ${CIRC[S.g]}`, `Goal ${CIRC[S.g]}`)} / ${N}</span></div>${pr}<div class="ml-vq">${head}${inp}${fb}</div>`;
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
  addEventListener('resize', setTop, { passive: true });
}
export type { Goal };
