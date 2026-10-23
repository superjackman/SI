/* KaTeX is pre-rendered at generation time; the browser only needs its stylesheet + fonts, loaded the first time math shows.
   Long display formulas carry a line-broken twin (m2/tex.ts); fit() shows the least-broken form that fits. */
let p: Promise<void> | null = null;
export const hasMath = (html: string) => html.includes('class="katex"');

/* show the first form that fits; the last one (most broken) is the fallback and scrolls inside its box if it still overflows */
const fit = (el: Element) => {
  const forms = [...el.children] as HTMLElement[]; if (!forms.length || !(el as HTMLElement).clientWidth) return;
  for (const [i, f] of forms.entries()) {
    forms.forEach((g, j) => { g.hidden = j !== i; });
    if (f.scrollWidth <= (el as HTMLElement).clientWidth + 1) return;
  }
};
function watch() {
  const ro = new ResizeObserver((es) => es.forEach((e) => fit(e.target)));
  const seen = new WeakSet<Element>();
  const scan = () => document.querySelectorAll('.kx-w').forEach((el) => { if (!seen.has(el)) { seen.add(el); ro.observe(el); fit(el); } });
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  scan();
  const all = () => document.querySelectorAll('.kx-w').forEach(fit);
  // KaTeX fonts arrive lazily (when a glyph first shows), changing widths without resizing the box
  void document.fonts?.ready.then(all);
  document.fonts?.addEventListener?.('loadingdone', all);
}
export function loadMath(): Promise<void> {
  p ??= import('../styles/katex.css').then(() => { document.documentElement.dataset.siMath = '1'; watch(); }, (e: unknown) => { p = null; console.warn('[math css]', e); });
  return p;
}
