/* Which lab / quiz an interaction belongs to — the live page's (legacy.html) sparse-event rules, unchanged:
   a lab counts on a click on its button/select/input/canvas/svg or on any input inside it; a quiz on a click on an
   answer option. Tiny and dependency-free so main.tsx can queue interactions made before the analytics chunk loads. */
export function eventFor(e: Event): string | null {
  const t = e.target as Element | null;
  if (!t || typeof t.closest !== 'function') return null;
  const lab = t.closest('.card.lab[id]');
  if (lab && (e.type === 'input' || (e.type === 'click' && t.closest('button,select,input,canvas,svg')))) return 'lab-' + lab.id;
  if (e.type === 'click') {
    /* R16: a share channel (button / link in the lazy share panel, data-share-ch="weibo" …) → evt-share-weibo */
    const sh = t.closest<HTMLElement>('[data-share-ch]');
    if (sh) return 'share-' + (sh.dataset.shareCh ?? '');
    const o = t.closest('.card.quiz[data-sec] .opt');
    if (o) return 'quiz-' + (o.closest('.card.quiz')?.getAttribute('data-sec') ?? '');
  }
  return null;
}
/** R16: never count on this machine or the LAN: localhost, 127.x, ::1, 0.0.0.0, 10.x, 172.16–31.x, 192.168.x, 169.254.x, *.local */
export const isLocalHost = (h: string): boolean =>
  /^(localhost|\[::1\]|::1|0\.0\.0\.0)$|^(127|10)\.\d+\.\d+\.\d+$|^192\.168\.|^169\.254\.|^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$|\.local$/i.test(h);
