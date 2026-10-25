/* Stale-deploy recovery.
   GitHub Pages serves index.html with max-age=600, so after a deploy a browser can run an old index.html / old entry
   whose hashed chunks are gone (404). deploy.mjs keeps one generation of old assets, which covers most of it; this
   covers the rest: when a chunk fails to load we fetch index.html fresh and, only if it names a different build, do ONE
   cache-busting reload (sessionStorage guard per build, so it can never loop). Otherwise the ⟳ retry UI shows.
   The inline guard in index.html does the same for the entry script / stylesheet itself (window.__siStale). */
export const RKEY = 'si.reload';
export const BUST = '_r';
/** set just before any reload the app does on its own (stale build, chunk recovery, update banner): the reloaded page
    is the same visit, so analytics does not count its first page view again when it equals the last one counted */
export const GCRE = 'si.gcre';
export function reloadTo(url: string) { try { sessionStorage.setItem(GCRE, '1'); } catch { /* */ } location.replace(url); }

/** basename of the running entry script, e.g. "index-Do0ajEEB.js" ("" in dev) */
export function buildId(doc: Document = document): string {
  const s = doc.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/"]');
  return s ? (s.getAttribute('src') ?? '').split('/').pop() ?? '' : '';
}
/** entry name an index.html text references */
export function entryOf(html: string): string {
  const m = /<script[^>]+type="module"[^>]+src="[^"]*\/assets\/([^"/]+\.js)"/.exec(html) ?? /<script[^>]+src="[^"]*\/assets\/([^"/]+\.js)"[^>]+type="module"/.exec(html);
  return m?.[1] ?? '';
}
export function isChunkError(e: unknown): boolean {
  const m = String((e as { message?: string })?.message ?? e);
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported|Failed to fetch|Unable to preload|module script|ChunkLoadError|Loading chunk/i.test(m);
}
/** the URL to reload with: same path, query (+ _r=<now>), hash */
export function bustURL(loc: { pathname: string; search: string; hash: string }, now = Date.now()): string {
  const q = loc.search.replace(/^\?/, '').split('&').filter((p) => p && !p.startsWith(BUST + '=')).concat(BUST + '=' + now).join('&');
  return loc.pathname + '?' + q + loc.hash;
}
/** URL without our _r token (written back after a recovery reload so links stay clean) */
export function cleanURL(loc: { pathname: string; search: string; hash: string }): string | null {
  if (!new RegExp('(^|[?&])' + BUST + '=').test(loc.search)) return null;
  const q = loc.search.replace(/^\?/, '').split('&').filter((p) => p && !p.startsWith(BUST + '=')).join('&');
  return loc.pathname + (q ? '?' + q : '') + loc.hash;
}
/** one reload per build per tab session */
export function reloadOnce(id = buildId()): boolean {
  try {
    if (sessionStorage.getItem(RKEY) === (id || '?')) return false;
    sessionStorage.setItem(RKEY, id || '?');
  } catch { return false; } // no sessionStorage: never auto-reload (cannot guard against loops)
  reloadTo(bustURL(location));
  return true;
}
/** is a newer build deployed than the one running? (null = cannot tell, e.g. offline) */
export async function newerBuild(): Promise<boolean | null> {
  const cur = buildId(); if (!cur) return null;
  try {
    const r = await fetch(import.meta.env.BASE_URL + '?' + BUST + '=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return null;
    const e = entryOf(await r.text());
    return e ? e !== cur : null;
  } catch { return null; }
}
let inflight: Promise<boolean> | null = null;
/** after a failed chunk load: true when a recovery reload is under way (keep the skeleton), false → show ⟳ */
export function recover(err?: unknown): Promise<boolean> {
  if (err !== undefined && !isChunkError(err)) return Promise.resolve(false);
  return (inflight ||= newerBuild().then((n) => (n ? reloadOnce() : false)).finally(() => { setTimeout(() => { inflight = null; }, 0); }));
}
/** ⟳ after a chunk failure: try the import again; if the chunk is still missing, reload the page (user asked) */
export function userReload() { try { sessionStorage.removeItem(RKEY); } catch { /* */ } reloadTo(bustURL(location)); }

export function installStaleGuard() {
  const c = cleanURL(location);
  if (c) try { history.replaceState(history.state, '', c); } catch { /* file: */ }
  addEventListener('vite:preloadError', (e) => { e.preventDefault(); void recover((e as Event & { payload?: unknown }).payload ?? new Error('Unable to preload')); });
}
