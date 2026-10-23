/* small DOM helpers shared by the hand-written M2 labs (m2/labs/<S>.ts) */
import type { Env } from '../legacy/runtime';
export type TT = (zh: string, en: string) => string;
export const tr = (env: Env): TT => (zh, en) => (env.lang === 'en' ? en : zh);
export const byId = <E extends HTMLElement = HTMLElement>(env: Env, id: string) => env.document.getElementById(id) as E | null;
export const name = (env: Env, id: string) => String((env.C[id] as { n?: string } | undefined)?.n ?? id);
export const fmt = (env: Env, n: number) => n.toLocaleString(env.lang === 'en' ? 'en-US' : 'zh-CN');
/** a stacked bar: segments [cls, value, label]; total = sum unless given */
export function bar(el: HTMLElement, segs: [string, number, string][], total?: number) {
  const sum = total ?? segs.reduce((a, s) => a + s[1], 0);
  el.innerHTML = segs.filter((s) => s[1] > 0).map(([c, v, l]) => `<span class="${c}" style="width:${((v / sum) * 100).toFixed(2)}%" title="${l}"></span>`).join('');
  el.setAttribute('aria-label', segs.map((s) => `${s[2]} ${s[1]}`).join(', '));
}
/** wire range/select inputs so any change re-renders; returns a reader of their numeric values */
export function wire(env: Env, ids: string[], render: () => void) {
  for (const id of ids) byId<HTMLInputElement>(env, id)?.addEventListener('input', render);
  for (const id of ids) byId<HTMLSelectElement>(env, id)?.addEventListener('change', render);
  return (id: string) => Number(byId<HTMLInputElement>(env, id)?.value ?? 0);
}
export const setTxt = (env: Env, id: string, s: string) => { const e = byId(env, id); if (e) e.textContent = s; };
/** number with up to `d` decimals, trailing zeros dropped, real minus sign */
export const num = (x: number, d = 4) => (Object.is(Math.round(x * 10 ** d), -0) ? 0 : Number(x.toFixed(d))).toString().replace('-', '−');
