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
  const s = screenStr();
  const q = `p=${encodeURIComponent(p)}&t=${encodeURIComponent(title)}${ref ? '&r=' + encodeURIComponent(ref) : ''}&s=${encodeURIComponent(s)}&rnd=${Math.random().toString(36).slice(2, 9)}`;
  ref = '';
  pixel(q);
}
const screenStr = () => (typeof screen !== 'undefined' && screen ? `${screen.width},${screen.height},${devicePixelRatio || 1}` : '');
/* keep a reference until the pixel settles so it is not garbage-collected mid-flight (as the live page does) */
const inflight = new Set<HTMLImageElement>();
function pixel(q: string): void {
  try {
    const img = new Image(); inflight.add(img);
    img.onload = img.onerror = () => { inflight.delete(img); img.onload = img.onerror = null; };
    img.src = GC_COUNT + '?' + q;
  } catch { /* analytics is optional */ }
}
/** live __gcEvent naming: "evt-" + name with every run of non-[A-Za-z0-9_-] characters turned into "-" */
export function eventPath(name: string): string { return 'evt-' + String(name).replace(/[^\w-]+/g, '-'); }
const seen = new Set<string>();
/** sparse event (first use of each lab, first answer in each quiz), once per page load like the live page:
    p = t = evt-…, e=true, never a referrer */
export function event(name: string): void {
  const k = eventPath(name);
  if (seen.has(k)) return;
  seen.add(k);
  pixel(`p=${encodeURIComponent(k)}&t=${encodeURIComponent(k)}&e=true&s=${encodeURIComponent(screenStr())}&rnd=${Math.random().toString(36).slice(2, 9)}`);
}
