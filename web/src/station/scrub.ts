/* R18: the stop-dot strip under each station is one ≥ 44px-tall control (22 dots cannot each get 40px at 360px: 22 × 40 > the
   ~230px between the arrows). Press anywhere on it: the nearest dot grows and a tip names the stop; slide to change it; lift to
   go there; drag up or down out of the strip (or pointercancel, e.g. a vertical scroll) to cancel. Keyboard / screen-reader users
   keep the per-dot buttons (aria-label "Stop n: …"), whose click is handled by the page's data-go delegate as before. */
import { go } from '../nav';
import './scrub.css';

const CANCEL = 36; /* px above / below the strip before a lift no longer counts */

export function mountScrub(root: ParentNode): () => void {
  const offs: Array<() => void> = [];
  root.querySelectorAll<HTMLElement>('.pn-dots').forEach((strip) => {
    const dots = Array.from(strip.querySelectorAll<HTMLElement>('.dt'));
    if (!dots.length) return;
    let tip: HTMLElement | null = null, cur = -1, id = -1, swallow = 0;
    const near = (x: number) => {
      let best = 0, bd = Infinity;
      dots.forEach((d, k) => { const r = d.getBoundingClientRect(), dd = Math.abs(r.left + r.width / 2 - x); if (dd < bd) { bd = dd; best = k; } });
      return best;
    };
    const out = (y: number) => { const r = strip.getBoundingClientRect(); return y < r.top - CANCEL || y > r.bottom + CANCEL; };
    const show = (k: number, off: boolean) => {
      if (k !== cur) { dots[cur]?.classList.remove('pick'); cur = k; dots[k]?.classList.add('pick'); }
      if (!tip) { tip = document.createElement('div'); tip.className = 'pn-tip'; tip.setAttribute('aria-hidden', 'true'); strip.appendChild(tip); }
      const d = dots[k] as HTMLElement, sr = strip.getBoundingClientRect(), r = d.getBoundingClientRect();
      tip.textContent = d.getAttribute('aria-label') ?? '';
      tip.classList.toggle('off', off);
      const w = tip.offsetWidth, x = Math.max(0, Math.min(sr.width - w, r.left - sr.left + r.width / 2 - w / 2));
      tip.style.transform = `translateX(${Math.round(x)}px)`;
    };
    const end = () => { dots[cur]?.classList.remove('pick'); cur = -1; id = -1; tip?.remove(); tip = null; strip.classList.remove('scrub'); };
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || id !== -1) return;
      id = e.pointerId; strip.classList.add('scrub');
      try { strip.setPointerCapture(id); } catch { /* synthetic events */ }
      show(near(e.clientX), false);
    };
    const move = (e: PointerEvent) => { if (e.pointerId === id) show(near(e.clientX), out(e.clientY)); };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      const k = near(e.clientX), cancel = out(e.clientY), to = dots[k]?.dataset.go;
      end(); swallow = performance.now();
      if (!cancel && to) go(to);
    };
    const cancel = (e: PointerEvent) => { if (e.pointerId === id) end(); };
    /* the click that follows a pointer gesture is already handled; keyboard clicks (detail 0) pass through */
    const click = (e: MouseEvent) => { if (e.detail !== 0 && performance.now() - swallow < 800) { e.stopPropagation(); e.preventDefault(); } };
    strip.addEventListener('pointerdown', down); strip.addEventListener('pointermove', move); strip.addEventListener('pointerup', up);
    strip.addEventListener('pointercancel', cancel); strip.addEventListener('click', click, true);
    offs.push(() => { end(); strip.removeEventListener('pointerdown', down); strip.removeEventListener('pointermove', move); strip.removeEventListener('pointerup', up); strip.removeEventListener('pointercancel', cancel); strip.removeEventListener('click', click, true); });
  });
  return () => offs.forEach((f) => f());
}
