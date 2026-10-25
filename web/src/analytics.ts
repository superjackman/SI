/* GoatCounter tracking pixel (no count.js: gc.zgo.at is blocked in mainland China, the site's own host is not).
   Ported from build/mobile/analytics.js: same virtual paths (/zh/home, /en/T3 …) so dashboard data stays continuous.
   Loaded as a separate chunk only after window 'load' — content never waits for it; a failed pixel is simply lost.
   Off on file:, localhost and on /SI/next/ (build flag __SI_ANALYTICS__), so previews never pollute the dashboard. */
import type { Lang } from './i18n/types';
const GC_COUNT = 'https://superjackman-si.goatcounter.com/count';
let last = '';
let ref = typeof document !== 'undefined' ? document.referrer : '';
export function pathFor(lang: Lang, station: string): string { return '/' + lang + '/' + (station === 'H' ? 'home' : station); }
/* R19 source tag of the landing: ?from=wechat (share links) or a manual ?from=zhihu / xhs / v2ex / bilibili on a post.
   Read once when this chunk loads (after 'load', so content never waits), then taken out of the address bar
   (history.replaceState; hash route, ?lang and ?v untouched) so a reload or a copied address bar does not count it again.
   The first page view carries it as a GoatCounter campaign (q=?campaign=<tag>&ref=<tag> → Campaigns widget) and it
   is also sent once as the event evt-from-<tag>. */
type L3 = { search: string; hash: string; pathname: string };
const FTOK = /(^|[?&#;/!])from=([^&#;?/]*)/i;
/** the landing's valid source tag (lower case) and the URL without any from= token (null = nothing to strip) */
export function landing(loc: L3): { from: string | null; clean: string | null } {
  const m = FTOK.exec(loc.search) ?? FTOK.exec(loc.hash);
  if (!m) return { from: null, clean: null };
  let v = m[2] ?? '';
  try { v = decodeURIComponent(v); } catch { /* keep raw */ }
  v = v.trim().toLowerCase();
  const q = loc.search.replace(/^\?/, '').split('&').filter((p) => p && !/^from=/i.test(p)).join('&');
  const h = loc.hash.replace(/([&?;])from=[^&#;?]*/gi, '').replace(/^#[/!]*from=[^&#;?]*[&?;]?/i, '#');
  return { from: /^[a-z0-9][a-z0-9_-]{0,23}$/.test(v) ? v : null, clean: loc.pathname + (q ? '?' + q : '') + (h === '#' ? '' : h) };
}
let from: string | null = null;
if (typeof location !== 'undefined') {
  const l = landing(location); from = l.from;
  if (l.clean) try { history.replaceState(history.state, '', l.clean); } catch { /* file: etc. */ }
}
export function count(lang: Lang, station: string, title: string): void {
  const p = pathFor(lang, station);
  if (p === last) return;
  last = p;
  const s = screenStr(), f = from;
  const q = `p=${encodeURIComponent(p)}&t=${encodeURIComponent(title)}${ref ? '&r=' + encodeURIComponent(ref) : ''}${f ? '&q=' + encodeURIComponent('?campaign=' + f + '&ref=' + f) : ''}&s=${encodeURIComponent(s)}&rnd=${Math.random().toString(36).slice(2, 9)}`;
  ref = ''; from = null;
  pixel(q);
  if (f) event('from-' + f);
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
