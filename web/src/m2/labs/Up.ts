/* Station Up (M3 products): filter the product list by way of use, mainland-run and open source. The list itself is
   static HTML (it reads fine without this script); this only hides items and empty groups. */
import type { Env } from '../../legacy/runtime';
import { byId, tr } from '../kit';
import { prodVisible, type ProdFilter } from '../logic';

export const LABS = [{ ids: ['upF', 'upCn', 'upOs', 'upCount', 'upList'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const f: ProdFilter = { g: 'all', cn: false, os: false };
  const render = () => {
    const list = byId(env, 'upList'), out = byId(env, 'upCount'); if (!list || !out) return;
    const seen = new Set<string>();
    list.querySelectorAll<HTMLElement>('.up-g').forEach((sec) => {
      let any = false;
      sec.querySelectorAll<HTMLElement>('.up-i').forEach((li) => {
        const v = prodVisible({ g: (li.dataset.g ?? '').split(' '), cn: li.dataset.cn === '1', os: li.dataset.os === '1' }, f);
        li.hidden = !v; if (v) { any = true; seen.add(li.dataset.n ?? ''); }
      });
      sec.hidden = !any || (f.g !== 'all' && sec.dataset.g !== f.g);
    });
    out.textContent = seen.size ? t(`显示 ${seen.size} 个产品`, `Showing ${seen.size} products`) : t('没有符合条件的产品', 'No products match');
    out.dataset.n = String(seen.size);
  };
  const lab = () => {
    const bar = byId(env, 'upF'); if (!bar) return;
    bar.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-f]'); if (!b) return;
      f.g = b.dataset.f ?? 'all';
      bar.querySelectorAll<HTMLButtonElement>('button[data-f]').forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
      render();
    });
    byId<HTMLInputElement>(env, 'upCn')?.addEventListener('change', (e) => { f.cn = (e.target as HTMLInputElement).checked; render(); });
    byId<HTMLInputElement>(env, 'upOs')?.addEventListener('change', (e) => { f.os = (e.target as HTMLInputElement).checked; render(); });
    render();
  };
  return { labs: [lab], eager: () => {} };
}
