/* R44 one visual grammar on every page (first-load, tiny): a control that goes to another page reads "… ›" in the
   page text, so here it becomes a blue jump (the › becomes the round badge); one that shows something on this page
   (a card, the maths) becomes a teal ⓘ pill; gold stays for the few that do a thing (share, save). Runs after every
   render through a MutationObserver; each control is looked at once (data-g). */
const SKIP = '.l4-mp,.l4-top,.g-nav,.l4-crumb,.g-sf,.g-dlg,.l4-ob,.l4-lb,.lx-fl,.l4-qp,.l4-ml,.g-seg,.g-chips,.l4-ms,.l4-sh,.l4-lv,.l4-hr';
const CARD = /(看卡|（卡片）|\(card\)|^Card)\s*›?\s*$/i;
const ROW = '.px-it,.px-lvr,.px-bc';

function lastText(e: Node): Text | null {
  for (let n = e.lastChild; n; n = n.previousSibling) {
    if (n.nodeType === 3) { if ((n as Text).data.trim()) return n as Text; continue; }
    if (n.nodeType === 1) return lastText(n);
  }
  return null;
}
export function gram(root: ParentNode) {
  for (const e of root.querySelectorAll<HTMLElement>('button:not([data-g]),a.l4-b:not([data-g])')) {
    e.dataset.g = '1';
    if (e.closest(SKIP) || e.matches('.g-jump,.g-info,.g-act,.g-act2,.g-x')) continue;
    if (e.matches(ROW)) {
      const i = e.lastElementChild as HTMLElement | null, it = i && lastText(i);
      if (e.dataset.k && i && it) { it.data = it.data.replace(/\s*›\s*$/, ''); i.classList.add('g-ri'); } else if (e.dataset.go) e.classList.add('g-rj');
      continue;
    }
    const t = lastText(e); if (!t || !/›\s*$/.test(t.data)) continue;
    t.data = t.data.replace(/\s*›\s*$/, '');
    e.classList.remove('gold');
    e.classList.add(e.dataset.k || CARD.test(e.textContent ?? '') ? 'g-info' : 'g-jump');
  }
}
export function gramOn(root: HTMLElement) {
  let q = false;
  const run = () => { q = false; gram(root); };
  new MutationObserver(() => { if (!q) { q = true; queueMicrotask(run); } }).observe(root, { childList: true, subtree: true });
  gram(root);
}
