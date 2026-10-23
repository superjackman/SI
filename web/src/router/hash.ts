/* Hash routes. Accepts every format the live page accepts, plus the plan's new one:
   #T2  #T2&lang=en  #lang=en&T2  #/T2?lang=en  #!T2  and an optional part:  #/T3/llm  #T3/llm
   The app writes the live page's own format (#T3), so links stay interchangeable between /SI/ and /SI/next/. */
export interface Route { station: string | null; node: string | null }
export function parseHash(hash: string): Route {
  const h = (hash || '').replace(/^#/, '');
  for (const raw of h.split(/[&?;]/)) {
    const t = raw.replace(/^[/!]+/, '');
    if (!t || /^(lang|from)=/i.test(t)) continue; // R19: a from= tag in the hash is not a route
    const [station, node] = t.split('/');
    return { station: station || null, node: node || null };
  }
  return { station: null, node: null };
}
/** hash to write for a station; keeps a lang token if the current hash carried one (live hashFor) */
export function hashFor(station: string, lang: string, currentHash: string): string {
  return /(^|[?&#;/!])lang=/i.test(currentHash) ? `#${station}&lang=${lang}` : `#${station}`;
}
/** R19: URL to write on navigation — the hash route, and a from= tag found in the hash (#T3?from=zhihu, #T3&from=x)
    moved into the query (?from=zhihu#T3) instead of dropped, so the landing's source tag survives the rewrite */
export function navURL(loc: { pathname: string; search: string; hash: string }, station: string, lang: string): string {
  const h = hashFor(station, lang, loc.hash), m = /[?&#;/!]from=([\w-]+)/i.exec(loc.hash);
  return m && !/[?&]from=/i.test(loc.search) ? loc.pathname + (loc.search ? loc.search + '&' : '?') + 'from=' + m[1] + h : h;
}
