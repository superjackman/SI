/* R42 first-visit onboarding (reference O1–O3, lazy chunk): 1/3 what this is (the five layers), 2/3 the three looks (› another page, ⓘ shown here, gold does a thing), 3/3 start with the 10-minute quick path or look around yourself. 跳过 any time; shown once (si.onb),
   only when the visit starts on the home page (a shared deep link goes straight to its page). */
import { UI, tx, type L, type Tx } from './txt';
import { plan } from '../px/qpath';

export const ONB_KEY = 'si.onb';
const LC = ['#0891b2', '#0d9488', '#4f46e5', '#2563eb', '#7c3aed'];
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
/** "约 9 分半" from the real reading-time estimate */
export function about(sec: number, l: L) {
  const m = Math.floor(sec / 60), r = sec % 60;
  if (r >= 15 && r < 45) return l === 'en' ? `about ${m}½ min` : `约 ${m} 分半`;
  const n = r < 15 ? m : m + 1; return l === 'en' ? `about ${n} min` : `约 ${n} 分钟`;
}
export function showOnb(host: HTMLElement, l: L, quick: () => void) {
  const z = (t: Tx) => tx(t, l), done = () => { try { localStorage.setItem(ONB_KEY, '1'); } catch { /* private mode */ } el.remove(); removeEventListener('keydown', key); };
  const key = (e: KeyboardEvent) => { if (e.key === 'Escape') done(); };
  const lv = (n: number) => `<span class="ob-lt" style="--c:${LC[n - 1]}">${esc(z(UI.lv[n - 1]!))}</span>`;
  const demo = (ic: string, t: Tx, d: Tx, fig: string) => `<div class="ob-c"><i aria-hidden="true">${ic}</i><div><b>${z(t)}</b><span>${z(d)}</span></div>${fig}</div>`;
  const el = document.createElement('div'); el.className = 'l4-ob'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
  let st = 1;
  const draw = () => {
    const body = st === 1
      ? `<p class="ob-k">${z(['欢迎', 'Welcome'])}</p><h2>${z(['大白话拆解 AI', 'AI, explained plainly'])}</h2><p>${z(['用大白话，把 AI 从「我怎么用」一层层拆到「背后的数学」。不用会编程，点一点就能看懂。', 'In plain words, AI taken apart layer by layer — from how you use it down to the maths. No coding needed: just tap.'])}</p>
<div class="ob-pyr">${[1, 2, 3, 4, 5].map((n) => `<div style="--w:${48 + n * 10}%;--c:${LC[n - 1]}"><b>${esc(z(UI.lv[n - 1]!))}</b> ${esc(z(UI.lvN[n - 1]!))}</div>`).join('')}</div><p class="ob-m">${z(['上面是五层：越往下越接近原理', 'Five layers: the lower, the closer to how it really works'])}</p>`
      : st === 2
        ? `<h2>${z(['三种样子，一看就懂', 'Three looks, easy to tell'])}</h2><p class="ob-m">${z(['每一页都一样；底部永远是「‹ 上一步 · 下一步 ›」', 'Every page is the same; the bottom always has “‹ Back · Next ›”'])}</p>
${demo('<b class="ob-ij">›</b>', ['带 › 的 = 换一页', 'With › = another page'], ['进入细节、下一步、去下一层，都会换页，可用「‹ 上一步」或左上 ↑ 回来', 'Details, next step, next layer: all change page; come back with “‹ Back” or ↑ at the top left'], `<span class="g-jump ob-fx">${z(['工具箱', 'Toolbox'])}</span>`)}
${demo('<b class="ob-ii">i</b>', ['带 ⓘ 的 = 就在这页看', 'With ⓘ = shown right here'], ['知识卡、看数学，从底部弹出，下滑或 ✕ 收起，不会换页', 'Cards and the maths pop up from the bottom; swipe down or ✕ to close, the page stays'], `<span class="g-info ob-fx">${z(['知识卡', 'Card'])}</span>`)}
${demo('<b class="ob-ia">⤴</b>', ['金色实心 = 做一件事', 'Solid gold = does a thing'], ['分享、保存图片、开始训练，按了就执行', 'Share, save the image, start training: tap and it happens'], `<span class="g-act ob-fx">⤴ ${z(['分享', 'Share'])}</span>`)}`
        : `<h2>${z(['先花 10 分钟走一遍', 'Start with 10 minutes'])}</h2><p>${z(['快速路径带你从第1层走到第5层，12 站，外加 2 张知识卡。走完再挑感兴趣的一层细看。', 'The quick path takes you from layer 1 to layer 5: 12 stops plus 2 cards. Then pick a layer to look at closely.'])}</p>
<div class="ob-c ob-ls">${[1, 2, 3, 4, 5].map((n) => `<div>${lv(n)}<span>${esc(z(UI.lvN[n - 1]!))}</span></div>`).join('')}<p class="ob-m">${z(['按真实文字量估算，', 'From the real amount of text: '])}${about(plan(l).total, l)}</p></div>`;
    const nx = st < 3 ? `<button type="button" class="g-next ob-go" data-o="next">${z(['下一步', 'Next'])} ›</button>` : `<button type="button" class="g-next ob-go" data-o="quick">${z(['开始快速路径', 'Start quick path'])} ›</button>`;
    const nav = `<nav class="g-nav ob-nav"><button type="button" class="g-prev" data-o="prev"${st === 1 ? ' disabled' : ''}>‹ ${z(['上一步', 'Back'])}</button><span class="g-mid"><span class="g-dots" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${i === st ? 'on' : i < st ? 'd' : ''}"></i>`).join('')}</span><span class="g-n">${st} / 3</span></span>${nx}</nav>${st === 3 ? `<button type="button" class="l4-b g-jump ob-me" data-o="skip">${z(['我自己逛', 'I’ll look around'])}</button>` : ''}`;
    el.setAttribute('aria-label', z(['首次使用引导', 'Welcome guide']));
    el.innerHTML = `<div class="ob-in"><div class="ob-top"><span></span><button type="button" class="l4-b ob-skip" data-o="skip">${z(['跳过', 'Skip'])}</button></div>
<div class="ob-body">${body}</div>${nav}</div>`;
    el.querySelector<HTMLElement>('.ob-go')?.focus({ preventScroll: true });
  };
  el.addEventListener('click', (e) => {
    e.stopPropagation(); const o = (e.target as HTMLElement).closest<HTMLElement>('[data-o]')?.dataset.o; if (!o) return;
    if (o === 'next') { st++; draw(); } else if (o === 'prev') { if (st > 1) { st--; draw(); } } else if (o === 'skip') done(); else if (o === 'quick') { done(); quick(); }
  });
  addEventListener('keydown', key); draw(); host.appendChild(el);
  return { redraw: (nl: L) => { l = nl; draw(); }, close: done };
}
