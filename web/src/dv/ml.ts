/* R56/R57 the per-station story. A lazy chunk. A question, the turns that do not work, the picture and the numbers,
   then a check, in that order. Internal steps stay i / r / v so progress, 回炉 and variants keep working.
   The screen never names those steps. Nothing navigates. */
import './ml.css';
import { tx, type L } from '../l4/txt';
import { ML, type Goal, type Ml } from './mld';
import { ML_G, masteredSt, mlGet, mlSet, type MlS } from './prog';
import { noteMastered } from '../px/week';
import { fillDvText } from './nums';
import { DEMO } from '../vf/data';
import { DEMO0, type DemoS } from '../vf/ui';
import { liveQ, takePick, type LiveQ } from './liveq';
import { BASE, misOf, varN, varQ, type VarQ } from '../vf/var';
import { fmt, parseNum } from '../vf/calc';
import { vfAdd } from '../vf/ids';
import { rvAns } from '../px/rv';
import { diaryLine } from './diary';

type Mk = (s: string) => string;
type T = readonly [string, string];
const ABC = ['A', 'B', 'C'];
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
export const hasMl = (k: string) => k in ML && k in ML_G;
export const mlOf = (k: string): Ml | null => ML[k] ?? null;

/** the station's 本站大目标 card + the layered body with the micro-loop bar and panels woven in */
export function wrap(k: string, lyHtml: string, l: L, mk: Mk): string {
  void mk;
  const z = (a: string, b: string) => tx([a, b], l), S = mlGet(k);
  const d0 = diaryLine(k, l);
  const by = d0 ? `<p class="st-by">${l === 'en' ? `${esc(d0.year)}, ${esc(d0.who)}. ` : `${esc(d0.year)} 年，${esc(d0.who)}。`}${esc(d0.why)} <a href="${esc(d0.url)}" target="_blank" rel="noopener">${z('出处', 'Source')}</a></p>` : '';
  let h = lyHtml.replace('<div class="ly" ', `<div class="ly ml" data-ml-s="${S.s}" data-ml-k="${k}" `);
  h = h.replace('<div data-ask="by"></div>', by);
  h = h.replace('<div data-ask="num"></div>', `<div class="ml-num ml-v ml-p" aria-live="polite"></div>`);
  h = h.replace('<div data-ask="pred"></div>', `<div class="ml-pred ml-p"></div>`);
  h = h.replace('<div data-ask="choice"></div>', `<section class="ml-p ml-i" id="q" aria-live="polite"></section>`);
  h = h.replace('<div class="ly-nx"></div>', `<section class="ml-rz" hidden></section><div class="ml-rze" hidden></div><div class="ly-nx"></div>`);
  return h;
}

/** 带走三句 + a picture, for the station's end (memory kit) */
export const take = (k: string, l: L): { s: string[]; p: string } | null => { const M = ML[k]; return M ? { s: M.take.map((x) => fillDvText(tx(x, l), l)), p: tx(M.tpic, l) } : null; };

export function wire(host: HTMLElement, k: string, l: L, mk: Mk, prevQ: string, prevK: string) {
  void prevQ; void prevK;
  const root = host.querySelector<HTMLElement>('.ly.ml'); if (!root) return;
  const M = ML[k]!, z = (a: string, b: string) => tx([a, b], l), t = (x: T) => mk(fillDvText(tx(x, l), l)), N = M.goals.length;
  let S: MlS = mlGet(k);
  const pred: (number | null)[] = M.goals.map(() => null);
  const save = () => { const prev = masteredSt(); mlSet(k, S); noteMastered(prev); };
  const $ = <E extends HTMLElement>(s: string) => root.querySelector<E>(s) ?? host.querySelector<E>(s)!;
  const setTop = () => { const tp = root.querySelector<HTMLElement>('.ly-top'); if (tp) root.style.setProperty('--lyt', `${Math.round(tp.getBoundingClientRect().height)}px`); };
  const refreshCard = () => {
    host.querySelectorAll<HTMLElement>('.ml-gl li').forEach((li, i) => { li.classList.toggle('m', !!S.m[i]); li.textContent = `${tx(M.goals[i]!.t, l)}${S.m[i] ? ' ✓' : ''}`; });
  };
  const bar = () => {
    root.dataset.mlS = S.s; root.dataset.mlG = String(S.g);
    root.querySelectorAll<HTMLElement>('[data-ml-g]').forEach((b) => { const i = Number(b.dataset.mlG), on = i === S.g; b.className = `${on ? 'on' : ''}${S.m[i] ? ' m' : ''}`; b.setAttribute('aria-checked', String(on)); b.setAttribute('aria-label', `${tx(M.goals[i]!.t, l)}${S.m[i] ? z('，过了', ', done') : ''}`); });
  };
  const inv = () => {
    const g = M.goals[S.g]!, pk = S.p[S.g]!;
    const wrongs = S.w?.[S.g] ?? [], solved = pk === g.a;
    const ops = g.o.map((o, i) => {
      const bad = wrongs.includes(i), ok = solved && i === g.a, off = bad || solved;
      return `<button type="button" class="ml-op${ok ? ' ok' : bad ? ' bad' : ''}" data-ml-o="${i}"${off ? ' aria-disabled="true"' : ''}><b>${ABC[i]}</b><span>${t(o)}</span>${bad || ok ? `<em>${z('你选了', 'your pick')}</em>` : ''}</button>`;
    }).join('');
    const shown = solved ? g.why.map((_, i) => i) : wrongs;
    const whyBits = shown.map((i) => i === g.a ? `<p class="ml-live ui-panel"><b>→ ${ABC[i]}</b>${t(g.why[i]!)}</p>` : `<p class="ml-dead ui-panel"><b>✗ ${ABC[i]}</b>${t(g.why[i]!)}</p>`).join('');
    const why = shown.length ? `<div class="ml-why">${whyBits}</div>` : '';
    const sol = `<div class="vf-foot"><button type="button" class="l4-b ui-sec vf-sw" data-ml-sol="1" aria-expanded="false">${z('看解答', 'Show the working')}</button></div><div class="vf-sol ui-panel" hidden><p>${t(g.why[g.a]!)}</p></div>`;
    $('.ml-i').innerHTML = `<p class="ml-q">${t(g.q)}</p><div class="ml-ops">${ops}</div>${sol}${why}`;
  };
  const rz = () => {
    $('.ml-rz').innerHTML = '';
    $('.ml-rze').innerHTML = '';
  };
  let cur: VarQ | null = null, last: 'ok' | 'bad' | null = null, lastMis: ReturnType<typeof misOf> = null;
  const prW: number[][] = M.goals.map(() => []), liveW: number[][] = M.goals.map(() => []), liveOk = M.goals.map(() => false);
  let liveSig = '';
  const snap = () => {
    const kind = DEMO['D/' + k]; if (!kind) return null;
    const s: DemoS = { ...DEMO0 };
    host.querySelectorAll<HTMLInputElement>(`[data-dm="${kind}"] input[data-vs]`).forEach((inp) => {
      const name = inp.dataset.vs as keyof DemoS;
      if (name in s) s[name] = Number(inp.value);
    });
    return { k: kind, s };
  };
  const morphNow = () => {
    const box = host.querySelector<HTMLElement>('[data-morph]'); if (!box) return null;
    const inp = box.querySelector<HTMLInputElement>('input');
    if (inp) return Number(inp.value) / 100;
    const m = Number(box.style.getPropertyValue('--m'));
    return Number.isFinite(m) ? m : 0;
  };
  const currentLive = (): LiveQ | null => {
    const live = liveQ(k, morphNow(), snap());
    if (live && live.sig !== liveSig) {
      if (liveSig) { for (let i = 0; i < N; i++) { liveW[i] = []; liveOk[i] = false; } }
      liveSig = live.sig;
    }
    return live;
  };
  const mcq = (q: T, o: readonly T[], a: number, why: readonly T[], wrongs: readonly number[], solved: boolean) => {
    const ops = o.map((opt, i) => {
      const bad = wrongs.includes(i), ok = solved && i === a, off = bad || solved;
      return `<button type="button" class="ml-op${ok ? ' ok' : bad ? ' bad' : ''}" data-ml-p="${i}"${off ? ' aria-disabled="true"' : ''}><b>${ABC[i]}</b><span>${t(opt)}</span>${bad || ok ? `<em>${z('你选了', 'your pick')}</em>` : ''}</button>`;
    }).join('');
    const shown = solved ? why.map((_, i) => i) : wrongs;
    const bits = shown.map((i) => i === a ? `<p class="ml-live ui-panel"><b>→ ${ABC[i]}</b>${t(why[i]!)}</p>` : `<p class="ml-dead ui-panel"><b>✗ ${ABC[i]}</b>${t(why[i]!)}</p>`).join('');
    const foot = bits ? `<div class="ml-why">${bits}</div>${solved ? `<p class="ml-n">${z('✓ 对了。', '✓ Right.')}</p>` : ''}` : '';
    const sol = `<div class="vf-foot"><button type="button" class="l4-b ui-sec vf-sw" data-ml-sol="1" aria-expanded="false">${z('看解答', 'Show the working')}</button></div><div class="vf-sol ui-panel" hidden><p>${t(why[a]!)}</p></div>`;
    return `<div class="ml-pr"><p class="ml-q">${t(q)}</p><div class="ml-ops">${ops}</div>${sol}${foot}</div>`;
  };
  const prBlock = () => {
    const g0 = M.goals[S.g]!;
    const why = g0.pr.o.map((o, i) => (i === g0.pr.a ? g0.pr.why : [`「${tx(o, 'zh')}」对不上这道题里的数。`, `“${tx(o, 'en')}” does not match the numbers in this question.`] as T));
    return mcq(g0.pr.q, g0.pr.o, g0.pr.a, why, prW[S.g] ?? [], pred[S.g] === g0.pr.a);
  };
  const paintPr = () => { const el = root.querySelector('.ml-pr'); if (el) el.outerHTML = prBlock(); };
  const ver = (judged?: VarQ) => {
    const g = M.goals[S.g]!, q = judged ?? (cur = varQ(g.vk, S.v[S.g]! - (judged ? 1 : 0)));
    const pr = prBlock();
    const done = !!S.m[S.g];
    const head = `<p class="ml-vqq">${t(q.q)}${judged && last === 'ok' ? ` <b class="ml-ans">= ${fmt(q.a, q.d)}${q.u ? tx(q.u, l) : ''}</b>` : ''}</p>`;
    let fb = '';
    if (last === 'ok') {
      const allM = S.m.every(Boolean);
      fb = `<p class="ml-fb ok ui-panel"><b>✓ ${z('对了！', 'Right!')}</b>${done ? z(`「${tx(g.t, 'zh')}」过了。`, `“${tx(g.t, 'en')}” is done.`) : ''}</p>`
        + (done ? (S.g < N - 1 ? `<button type="button" class="l4-b ui-sec ml-go" data-ml-next="1">${z(`${tx(M.goals[S.g + 1]!.t, 'zh')} ›`, `${tx(M.goals[S.g + 1]!.t, 'en')} ›`)}</button>` : allM ? `<p class="ml-fb ok ui-panel"><b>★ ${z('这一站过了。', 'This stop is done.')}</b></p>` : `<button type="button" class="l4-b ui-sec ml-go" data-ml-todo="1">${z('还有一处没过 ›', 'One part is still open ›')}</button>`)
          : `<button type="button" class="l4-b ui-sec ml-go" data-ml-again="1">${z('换一组数 ›', 'New numbers ›')}</button>`);
      if (allM) host.querySelector('.dv-sp')?.setAttribute('data-done', '1');
    } else if (last === 'bad') {
      const m = lastMis;
      const work = g.rz.filter((x) => !/拖一拖|数字层|看动画|NumPy|先自己算|组数|连对/.test(tx(x, l))).map((x) => `<li>${t(x)}</li>`).join('') || `<li>${m ? tx(m.why, l).replace(/`/g, '') : t(q.w)}</li>`;
      fb = `<p class="ml-fb bad ui-panel"><b>✗ ${m ? tx(m.why, l).replace(/`/g, '') : z('还不对。', 'Not yet.')}</b>${m ? '' : z(`对一下：${tx(q.w, 'zh').replace(/`/g, '')}`, `Check: ${tx(q.w, 'en').replace(/`/g, '')}`)}</p>
<ol class="ml-work">${work}</ol>
<p class="ml-n">${z('这道记进错题本，今日复习会再考。换一组数继续。', 'This one is in the wrong book; today’s review will bring it back. New numbers, same question.')}</p><button type="button" class="l4-b ui-sec ml-go" data-ml-again="1">${z('换一组数 ›', 'New numbers ›')}</button>`;
    }
    const sol = `<div class="vf-sol ui-panel" hidden><p>${t(q.w)}</p><p class="vf-an">${z('答案：', 'Answer: ')}<b>${fmt(q.a, q.d)}${q.u ? esc(tx(q.u, l)) : ''}</b></p></div>`;
    const inp = judged ? '' : `<div class="vf-row"><input class="vf-in ml-in" type="text" inputmode="decimal" enterkeyhint="done" autocomplete="off" spellcheck="false" aria-label="${z('你的答案', 'Your answer')}" placeholder="${z('填数字', 'a number')}">${q.u ? `<span class="vf-u">${esc(tx(q.u, l))}</span>` : ''}<span class="vf-acts"><button type="button" class="l4-b ui-sec vf-sw" data-ml-sol="1" aria-expanded="false">${z('看解答', 'Show the working')}</button><button type="button" class="l4-b ui-pri ml-ck" data-ml-ck="1">${z('检查', 'Check')}</button></span></div>`;
    const predHost = root.querySelector<HTMLElement>('.ml-pred');
    const numHost = root.querySelector<HTMLElement>('.ml-num');
    if (predHost && numHost) { predHost.innerHTML = pr; numHost.innerHTML = `<div class="ml-vq">${head}${inp}${judged ? '' : sol}${fb}</div>`; }
    else $('.ml-v').innerHTML = `${pr}<div class="ml-vq">${head}${inp}${judged ? '' : sol}${fb}</div>`;
    const demoAt = M.goals.findIndex((x) => x.ly.includes(3));
    root.dataset.showDemo = demoAt >= 0 && demoAt === S.g ? '1' : '0';
  };
  const draw = () => { bar(); inv(); rz(); ver(); setTop(); };
  const go = (s: MlS['s'], scroll = true) => {
    if (s === 'v' && S.s !== 'v') { liveW[S.g] = []; liveOk[S.g] = false; }
    S.s = s; save(); draw(); if (scroll) { const p = s === 'i' ? $('.ml-i') : s === 'r' ? $('.ml-rz') : $('.ml-v'); p.scrollIntoView({ block: 'start' }); }
  };
  const lyGo = (n: number, fr?: number) => {
    go('r', false); root.querySelector<HTMLElement>(`[data-ly-go="${n}"]`)?.click();
    if (fr) { const at = () => { const el = root.querySelector<HTMLElement>('[data-att]'); if (el?.classList.contains('ly-anim')) el.dispatchEvent(new CustomEvent('att-go', { detail: fr - 1 })); else setTimeout(at, 250); }; at(); }
  };
  const check = () => {
    const inp = root.querySelector<HTMLInputElement>('.ml-in'), q = cur; if (!inp || !q) return;
    const v = parseNum(inp.value); const fbx = root.querySelector('.ml-vq');
    if (v == null) { fbx?.querySelector('.ml-fb')?.remove(); fbx?.insertAdjacentHTML('beforeend', `<p class="ml-fb bad ui-panel"><b>${z('先填一个数字。', 'Type a number first.')}</b></p>`); return; }
    const g = M.goals[S.g]!, right = Math.abs(v - q.a) <= q.tol + 1e-9, base = (S.v[S.g]! % varN(g.vk)) === 0 ? BASE[g.vk] : undefined;
    if (base) { rvAns(base, right); if (right) { const prev = masteredSt(); vfAdd(base); noteMastered(prev); } }
    if (!S.c || S.c.length !== N) S.c = Array.from({ length: N }, (_, i) => S.c?.[i] ?? 0);
    if (right) { S.k[S.g] = S.k[S.g]! + 1; S.c[S.g] = (S.c[S.g] ?? 0) + 1; if (S.k[S.g]! >= 2) S.m[S.g] = 1; last = 'ok'; lastMis = null; }
    else { S.k[S.g] = 0; last = 'bad'; lastMis = misOf(q, v); }
    // the next variant is already chosen (new numbers whatever happens next); the judged one stays on screen
    S.v[S.g] = S.v[S.g]! + 1; save(); refreshCard(); bar(); ver(q);
    root.dataset.mlLast = last;
  };
  root.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-ml-g],[data-ml-s],[data-ml-o],[data-ml-to],[data-ml-ly],[data-ml-p],[data-ml-ck],[data-ml-again],[data-ml-next],[data-ml-end],[data-ml-todo],[data-ml-sol]'); if (!b || b.classList.contains('ly')) return;
    const d = b.dataset;
    if (d.mlSol) {
      const sol = b.closest('.ml-vq, .ml-pr, .ml-i')?.querySelector<HTMLElement>('.vf-sol');
      if (!sol) return;
      const open = sol.hidden; sol.hidden = !open; b.setAttribute('aria-expanded', String(open)); b.textContent = open ? z('收起解答', 'Hide the working') : z('看解答', 'Show the working');
      return;
    }
    if (d.mlG) { S.g = Number(d.mlG); last = null; save(); draw(); return; }
    if (d.mlS && b.getAttribute('role') === 'tab') { last = null; go(d.mlS as MlS['s'], false); return; }
    if (d.mlO) {
      const g0 = M.goals[S.g]!; if (S.p[S.g] === g0.a) return;
      const i = Number(d.mlO), w = S.w ?? M.goals.map(() => [] as number[]);
      if ((w[S.g] ?? []).includes(i)) return;
      if (i === g0.a) S.p[S.g] = i; else { (w[S.g] ??= []).push(i); S.w = w; S.p[S.g] = -1; }
      save(); inv(); bar(); return;
    }
    if (d.mlTo) { go(d.mlTo as MlS['s']); return; }
    if (d.mlLy) { lyGo(Number(d.mlLy), d.mlFr ? Number(d.mlFr) : undefined); last = null; return; }
    if (d.mlP) {
      const i = Number(d.mlP);
      const g0 = M.goals[S.g]!;
      const next = takePick(g0.pr.a, prW[S.g] ?? [], pred[S.g] === g0.pr.a, i);
      prW[S.g] = next.wrongs; if (next.solved) pred[S.g] = g0.pr.a; paintPr(); return;
    }
    if (d.mlCk) { check(); return; }
    if (d.mlAgain) { last = null; ver(); root.querySelector<HTMLInputElement>('.ml-in')?.focus({ preventScroll: true }); return; }
    if (d.mlNext) { S.g = Math.min(N - 1, S.g + 1); S.s = 'i'; last = null; save(); draw(); $('.ml-i').scrollIntoView({ block: 'start' }); return; }
    if (d.mlTodo) { S.g = Math.max(0, S.m.findIndex((x) => !x)); S.s = 'i'; last = null; save(); draw(); return; }
    if (d.mlEnd) { host.querySelector<HTMLElement>('.dv-take')?.scrollIntoView({ block: 'start' }); }
  });
  root.addEventListener('keydown', (e) => { const tg = e.target as HTMLElement; if (e.key === 'Enter' && tg.classList.contains('ml-in')) { e.preventDefault(); check(); } });
  // capture: the demo slider stops the bubble so the page never sees it
  host.addEventListener('input', (e) => {
    const t0 = e.target as HTMLElement;
    if (!(t0 instanceof HTMLInputElement) || !t0.closest('[data-morph], .vf-sl') || S.s !== 'v') return;
    if (!currentLive()) return;
    paintPr();
  }, true);
  draw();
  const url = `https://superjackman.github.io/SI/#D/${k}`;
  const slot = host.querySelector('[data-share-url]'); if (slot) slot.textContent = url;
  host.querySelector('[data-ml-share]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const clip = navigator.clipboard?.writeText(url);
    if (clip) void clip.catch(() => { /* clipboard blocked */ });
  });
  addEventListener('resize', setTop, { passive: true });
}
export type { Goal };
