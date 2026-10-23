/* Which lab / quiz an interaction belongs to — the live page's (legacy.html) sparse-event rules, unchanged:
   a lab counts on a click on its button/select/input/canvas/svg or on any input inside it; a quiz on a click on an
   answer option. Tiny and dependency-free so main.tsx can queue interactions made before the analytics chunk loads. */
export function eventFor(e: Event): string | null {
  const t = e.target as Element | null;
  if (!t || typeof t.closest !== 'function') return null;
  const lab = t.closest('.card.lab[id]');
  if (lab && (e.type === 'input' || (e.type === 'click' && t.closest('button,select,input,canvas,svg')))) return 'lab-' + lab.id;
  if (e.type === 'click') {
    const o = t.closest('.card.quiz[data-sec] .opt');
    if (o) return 'quiz-' + (o.closest('.card.quiz')?.getAttribute('data-sec') ?? '');
  }
  return null;
}
