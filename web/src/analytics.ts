/* GoatCounter tracking pixel (no count.js: gc.zgo.at is blocked in mainland China, the site's own host is not).
   Ported from build/mobile/analytics.js: same virtual paths (/zh/home, /en/T3 …) so dashboard data stays continuous.
   Loaded as a separate chunk only after window 'load' — content never waits for it; a failed pixel is simply lost.
   Off on file:, localhost and on /SI/next/ (build flag __SI_ANALYTICS__), so previews never pollute the dashboard. */
import type { Lang } from './i18n/types';
const GC_COUNT = 'https://superjackman-si.goatcounter.com/count';
let last = '';
let ref = typeof document !== 'undefined' ? document.referrer : '';
export function pathFor(lang: Lang, station: string): string { return '/' + lang + '/' + (station === 'T1' ? 'home' : station); }
export function count(lang: Lang, station: string, title: string): void {
  const p = pathFor(lang, station);
  if (p === last) return;
  last = p;
  const s = screen ? `${screen.width},${screen.height},${devicePixelRatio || 1}` : '';
  const q = `p=${encodeURIComponent(p)}&t=${encodeURIComponent(title)}${ref ? '&r=' + encodeURIComponent(ref) : ''}&s=${encodeURIComponent(s)}&rnd=${Math.random().toString(36).slice(2, 9)}`;
  ref = '';
  try { new Image().src = GC_COUNT + '?' + q; } catch { /* ignore */ }
}
