/* R16 stale-cache check (own lazy chunk, loaded at idle after the first render — content never waits for it).
   GitHub Pages sends index.html with max-age=600 and webviews (WeChat / mini-programs) keep it even longer; headers
   cannot be changed, so the deploy writes <site>/version.json with the build id that is also baked into the bundle
   (__SI_BUILD__, see scripts/build-id.mjs). If the deployed id differs from the running one:
   - page opened only a few seconds ago and not touched yet → reload ONCE to the fresh version (same path, ?lang,
     hash; plus ?v=<id> so the cached index.html is not reused). sessionStorage remembers the id we reloaded to, so a
     page that is still stale afterwards can never loop — it shows the banner instead;
   - otherwise → a small banner "有新版本，点此刷新"; nothing reloads unless the user taps it.
   A missing / broken version.json (dev, LAN preview of an old build, offline) is ignored silently. */
import { tx } from '../i18n/L';
import { useApp } from '../store/app';
import { BUST, reloadTo } from './stale';
import { IC } from './ic';

export const VKEY = 'si.vreload';
export const VQ = 'v';
/** "just opened": time since navigation start below this, and no tap / key / wheel yet */
export const FRESH_MS = 6000;
/** visibilitychange re-checks: at most this often */
export const THROTTLE_MS = 5 * 60 * 1000;

type Loc = { pathname: string; search: string; hash: string };
/** same path, query (lang …) and hash; our own tokens replaced by v=<id> and _r=<now> (_r makes the URL differ even when
    it already carries v=<id> — a URL that differs only in its #hash would not reload; installStaleGuard drops _r again) */
export function freshURL(loc: Loc, id: string, now = Date.now()): string {
  const q = loc.search.replace(/^\?/, '').split('&').filter((p) => p && !p.startsWith(BUST + '=') && !p.startsWith(VQ + '='));
  q.push(VQ + '=' + encodeURIComponent(id), BUST + '=' + now);
  return loc.pathname + '?' + q.join('&') + loc.hash;
}
export type Decision = 'none' | 'reload' | 'banner';
export function decide(o: { cur: string; remote: string; reloadedTo: string | null; age: number; touched: boolean }): Decision {
  if (!o.remote || !o.cur || o.remote === o.cur) return 'none';
  return o.reloadedTo !== o.remote && o.age < FRESH_MS && !o.touched ? 'reload' : 'banner';
}
/** deployed id, or '' when it cannot be told (404, offline, not JSON) */
export async function remoteId(base: string, now = Date.now()): Promise<string> {
  try {
    const r = await fetch(base + 'version.json?t=' + now, { cache: 'no-store' });
    if (!r.ok) return '';
    const j = (await r.json()) as { id?: unknown };
    return typeof j?.id === 'string' && /^[\w.-]{1,64}$/.test(j.id) ? j.id : '';
  } catch { return ''; }
}

let last = 0, busy = false;
/** reset module state (tests) */
export function _reset() { last = 0; busy = false; document.getElementById('siUpd')?.remove(); }

export async function check(touched: () => boolean, o: { cur?: string; base?: string; force?: boolean } = {}): Promise<Decision> {
  const now = Date.now();
  if (busy || (!o.force && last && now - last < THROTTLE_MS)) return 'none';
  last = now; busy = true;
  try {
    const cur = o.cur ?? __SI_BUILD__;
    const remote = await remoteId(o.base ?? import.meta.env.BASE_URL, now);
    let reloadedTo: string | null = null, ss = true;
    try { reloadedTo = sessionStorage.getItem(VKEY); } catch { ss = false; }
    let d = decide({ cur, remote, reloadedTo, age: performance.now(), touched: touched() });
    if (d === 'reload' && !ss) d = 'banner'; // no sessionStorage → no loop guard → never auto-reload
    if (d === 'reload') {
      try { sessionStorage.setItem(VKEY, remote); } catch { d = 'banner'; }
      if (d === 'reload') { reloadTo(freshURL(location, remote)); return d; }
    }
    if (d === 'banner') banner(remote);
    return d;
  } finally { busy = false; }
}

const CSS = '#siUpd{position:fixed;left:50%;width:max-content;top:calc(var(--tbh,52px) + 10px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:130;display:flex;align-items:center;gap:2px;max-width:calc(100vw - 24px);background:#1e1b4b;color:#fff;border-radius:999px;box-shadow:0 6px 20px rgba(30,27,75,.25);font:600 14px/1.4 system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif}'
  + '#siUpd button{border:0;background:transparent;color:inherit;font:inherit;cursor:pointer;min-height:40px}'
  + '#siUpd .upd-go{display:flex;align-items:center;gap:7px;padding:8px 4px 8px 14px;text-align:left}#siUpd .upd-x{width:40px;opacity:.8}#siUpd .ic{width:18px;height:18px}';
/** the unobtrusive banner (once; its text follows the language) */
export function banner(id: string) {
  if (document.getElementById('siUpd')) return;
  if (!document.getElementById('siUpdCss')) { const s = document.createElement('style'); s.id = 'siUpdCss'; s.textContent = CSS; document.head.appendChild(s); }
  const b = document.createElement('div'); b.id = 'siUpd'; b.setAttribute('role', 'status');
  const go = document.createElement('button'); go.type = 'button'; go.className = 'upd-go';
  const x = document.createElement('button'); x.type = 'button'; x.className = 'upd-x'; x.innerHTML = IC.x;
  const txt = () => { const l = useApp.getState().lang; go.innerHTML = IC.re + '<span></span>'; (go.lastChild as HTMLElement).textContent = tx('upd.banner', l); x.setAttribute('aria-label', tx('ui.close', l)); x.title = tx('ui.close', l); };
  txt();
  const un = useApp.subscribe((s, p) => { if (s.lang !== p.lang) txt(); });
  go.onclick = () => { reloadTo(freshURL(location, id)); };
  x.onclick = () => { un(); b.remove(); };
  b.append(go, x); document.body.appendChild(b);
}
