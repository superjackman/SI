/* R52 first-visit chooser (lazy): ask depth + goal, save them, deep-link into the route's first station.
   Replaces the R42 3-step pyramid tour. Shown once (si.onb), only when the visit starts on home.
   Depth → si.ly.depth; goal → si.goal. Skip anytime. */
import { tx, type L, type Tx } from './txt';
import { ROUTES, type GoalId, goalSet } from '../dv/routes';

export const ONB_KEY = 'si.onb';
/** "约 9 分半" from the real reading-time estimate (kept for the quick-path wording test) */
export function about(sec: number, l: L) {
  const m = Math.floor(sec / 60), r = sec % 60;
  if (r >= 15 && r < 45) return l === 'en' ? `about ${m}½ min` : `约 ${m} 分半`;
  const n = r < 15 ? m : m + 1; return l === 'en' ? `about ${n} min` : `约 ${n} 分钟`;
}
type Depth = 's' | 'm' | 'd';
const depthSet = (d: Depth) => { try { localStorage.setItem('si.ly.depth', d); } catch { /* private mode */ } };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function showOnb(host: HTMLElement, l: L, quick: () => void) {
  const z = (t: Tx) => tx(t, l);
  void quick; /* kept for shell API compatibility (was: start quick path) */
  const goHash = (h: string) => {
    try { localStorage.setItem(ONB_KEY, '1'); } catch { /* private mode */ }
    el.remove(); removeEventListener('keydown', key);
    const b = document.createElement('button'); b.type = 'button'; b.dataset.go = h; b.hidden = true;
    host.appendChild(b); b.click(); b.remove();
  };
  const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { try { localStorage.setItem(ONB_KEY, '1'); } catch { /* */ } el.remove(); removeEventListener('keydown', key); } };
  const el = document.createElement('div'); el.className = 'l4-ob'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
  let st = 1; let depth: Depth = 'm'; let goal: GoalId = 'derive';
  const DEPTHS: { id: Depth; n: Tx; s: Tx }[] = [
    { id: 's', n: ['30 秒', '30 sec'], s: ['一句话 + 一张图，先建立直觉', 'One line + one picture: the intuition'] },
    { id: 'm', n: ['5 分钟', '5 min'], s: ['类比 + 图 + 数字 + 一道题', 'Analogy + picture + numbers + one quiz'] },
    { id: 'd', n: ['深入', 'Deep'], s: ['公式、推导、常见误解全开', 'Formulas, derivation, misconceptions'] },
  ];
  const draw = () => {
    const body = st === 1
      ? `<p class="ob-k">${z(['开始之前', 'Before you start'])}</p><h2>${z(['你想学多深？', 'How deep do you want to go?'])}</h2><p class="ob-m">${z(['同一批内容，只是展开多少不同。之后随时能改。', 'Same content; only how much is opened differs. Change anytime later.'])}</p>
<div class="ob-pick">${DEPTHS.map((d) => `<button type="button" class="ob-c${depth === d.id ? ' on' : ''}" data-o="depth:${d.id}"><b>${esc(z(d.n))}</b><span>${esc(z(d.s))}</span></button>`).join('')}</div>`
      : `<h2>${z(['你为什么学？', 'Why are you learning?'])}</h2><p class="ob-m">${z(['选一条路线，站点按推导顺序；同一批站，不同地铁线。', 'Pick a route. Stops follow derivation order — same stations, different metro lines.'])}</p>
<div class="ob-pick">${ROUTES.map((r) => `<button type="button" class="ob-c${goal === r.id ? ' on' : ''}" data-o="goal:${r.id}" style="--c:${r.c}"><b>${esc(tx(r.n, l))}</b><span>${esc(tx(r.s, l))}</span></button>`).join('')}</div>`;
    const nx = st < 2
      ? `<button type="button" class="g-next ob-go" data-o="next">${z(['下一步', 'Next'])} ›</button>`
      : `<button type="button" class="g-next ob-go" data-o="start">${z(['开始我的路线 ›', 'Start my route ›'])}</button>`;
    const nav = `<nav class="g-nav ob-nav"><button type="button" class="g-prev" data-o="prev"${st === 1 ? ' disabled' : ''}>‹ ${z(['上一步', 'Back'])}</button><span class="g-mid"><span class="g-dots" aria-hidden="true">${[1, 2].map((i) => `<i class="${i === st ? 'on' : i < st ? 'd' : ''}"></i>`).join('')}</span><span class="g-n">${st} / 2</span></span>${nx}</nav>
<button type="button" class="l4-b g-jump ob-me" data-o="routes">${z(['先看五条路线', 'See all five routes'])}</button>
<button type="button" class="l4-b ob-me" data-o="skip">${z(['我自己逛', 'I’ll look around'])}</button>`;
    el.setAttribute('aria-label', z(['学习偏好', 'Learning preferences']));
    el.innerHTML = `<div class="ob-in"><div class="ob-top"><span></span><button type="button" class="l4-b ob-skip" data-o="skip">${z(['跳过', 'Skip'])}</button></div>
<div class="ob-body">${body}</div>${nav}</div>`;
    el.querySelector<HTMLElement>('.ob-go')?.focus({ preventScroll: true });
  };
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    const o = (e.target as HTMLElement).closest<HTMLElement>('[data-o]')?.dataset.o; if (!o) return;
    if (o.startsWith('depth:')) { depth = o.slice(6) as Depth; draw(); return; }
    if (o.startsWith('goal:')) { goal = o.slice(5) as GoalId; draw(); return; }
    if (o === 'next') { st = 2; draw(); }
    else if (o === 'prev') { if (st > 1) { st = 1; draw(); } }
    else if (o === 'skip') { try { localStorage.setItem(ONB_KEY, '1'); } catch { /* */ } el.remove(); removeEventListener('keydown', key); }
    else if (o === 'routes') { depthSet(depth); goalSet(goal); goHash('#D/routes'); }
    else if (o === 'start') {
      depthSet(depth); goalSet(goal);
      const r = ROUTES.find((x) => x.id === goal)!;
      goHash('#D/' + String(r.st[0]));
    }
  });
  addEventListener('keydown', key); draw(); host.appendChild(el);
  return { redraw: (nl: L) => { l = nl; draw(); }, close: () => { try { localStorage.setItem(ONB_KEY, '1'); } catch { /* */ } el.remove(); removeEventListener('keydown', key); } };
}
