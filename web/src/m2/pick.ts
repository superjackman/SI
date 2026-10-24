/* R26: the one-tap pickers on Job / Skl / Bld. All panels are already in the page (all but one `hidden`), so the content
   reads fine without JS; this only switches which panel shows. Imported by the lazy station labs only. */
import type { Env } from '../legacy/runtime';
import { byId } from './kit';

export function picker(env: Env, groupId: string, outId: string) {
  const g = byId(env, groupId), out = byId(env, outId);
  if (!g || !out || g.dataset.pkOn) return;
  g.dataset.pkOn = '1';
  const show = (k: string) => {
    for (const b of g.querySelectorAll<HTMLButtonElement>('.pk-b')) b.setAttribute('aria-pressed', String(b.dataset.pk === k));
    for (const v of out.querySelectorAll<HTMLElement>('.pk-v')) v.hidden = v.dataset.pv !== k;
  };
  g.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.pk-b');
    if (b?.dataset.pk) show(b.dataset.pk);
  });
}
