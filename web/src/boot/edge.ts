/* R16 iOS edge swipe-back guard. Safari's back/forward swipe starts from a touch within ~20 px of the screen edge; a
   non-passive touchstart that calls preventDefault there stops it. Only on our swipe area (<main>), only in that
   edge strip, and never on anything interactive or anything with its own horizontal gesture — so taps, links,
   sliders, text selection and vertical scrolling everywhere else are untouched. (Android's system back gesture and
   WeChat's own iOS swipe-back live outside the page and cannot be blocked.) */
export const EDGE = 20;
import { NO } from './noswipe';
export const KEEP = 'a,button,label,summary,[role=button],[contenteditable],[tabindex],' + NO;
export const isIOSUA = (ua: string, touch: number) => /iP(hone|od|ad)/.test(ua) || (/Macintosh/.test(ua) && touch > 1);
export function atEdge(x: number, w: number, t: EventTarget | null): boolean {
  if (x >= EDGE && x <= w - EDGE) return false;
  const el = t as Element | null;
  return !(el && el.closest && el.closest(KEEP));
}
export function installEdgeGuard(m: Element | null, ua = navigator.userAgent, touch = navigator.maxTouchPoints): () => void {
  if (!m || !isIOSUA(ua, touch)) return () => { /* nothing */ };
  const f = (e: Event) => { const te = e as TouchEvent, p = te.touches[0]; if (te.touches.length === 1 && p && atEdge(p.clientX, innerWidth, te.target)) te.preventDefault(); };
  m.addEventListener('touchstart', f, { passive: false });
  return () => m.removeEventListener('touchstart', f);
}
