/** Turn snapshot placeholders back into the live page's real elements (see scripts/legacy/extract.mjs: a <p> that
    holds a list cannot be written as HTML, so it is stored as <si-x data-si-tag="p">). Innermost first. */
export function restoreTags(root: ParentNode): void {
  const all = [...root.querySelectorAll<HTMLElement>('si-x[data-si-tag]')].reverse();
  for (const x of all) {
    const el = document.createElement(x.dataset.siTag as string);
    for (const a of [...x.attributes]) if (a.name !== 'data-si-tag') el.setAttribute(a.name, a.value);
    while (x.firstChild) el.appendChild(x.firstChild);
    x.replaceWith(el);
  }
}
