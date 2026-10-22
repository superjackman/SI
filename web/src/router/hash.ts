/* Hash routes. Accepts every format the live page accepts, plus the plan's new one:
   #T2  #T2&lang=en  #lang=en&T2  #/T2?lang=en  #!T2  and an optional part:  #/T3/llm  #T3/llm
   The app writes the live page's own format (#T3), so links stay interchangeable between /SI/ and /SI/next/. */
export interface Route { station: string | null; node: string | null }
export function parseHash(hash: string): Route {
  const h = (hash || '').replace(/^#/, '');
  for (const raw of h.split(/[&?;]/)) {
    const t = raw.replace(/^[/!]+/, '');
    if (!t || /^lang=/i.test(t)) continue;
    const [station, node] = t.split('/');
    return { station: station || null, node: node || null };
  }
  return { station: null, node: null };
}
/** hash to write for a station; keeps a lang token if the current hash carried one (live hashFor) */
export function hashFor(station: string, lang: string, currentHash: string): string {
  return /(^|[?&#;/!])lang=/i.test(currentHash) ? `#${station}&lang=${lang}` : `#${station}`;
}
