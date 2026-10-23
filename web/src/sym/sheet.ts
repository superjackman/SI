/* R15: the symbol glossary sheet — every math symbol, how to read it, what it means (data: gen/symbols.json, loaded lazily).
   Opened by any [data-sym] button (the lists under formulas) and by the search box; data-sym="*" opens it at the top.
   Its own CSS lives here so the first load does not carry it. */
import type { Lang } from '../i18n/types';

type Bi = { zh: string; en: string };
type G = { title: Bi; intro: Bi; read: Bi; close: Bi; groups: { g: string; n: Bi; k: string[] }[]; sym: Record<string, { s: string; g: string; r: Bi; m: Bi }> };
let dataP: Promise<G> | null = null;
const load = () => (dataP ||= import('../legacy/gen/symbols.json').then((m) => m.default as unknown as G, (e: unknown) => { dataP = null; throw e; }));
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const CSS = `#symSheet{position:fixed;inset:0;z-index:60;display:flex;align-items:flex-end;justify-content:center;background:rgba(15,23,42,.45)}
#symSheet .sy-p{background:var(--bg,#fff);color:inherit;width:100%;max-width:720px;max-height:88vh;overflow:auto;border-radius:16px 16px 0 0;padding:14px 16px 28px;box-sizing:border-box;overscroll-behavior:contain}
#symSheet .sy-t{display:flex;gap:8px;align-items:flex-start;position:sticky;top:-14px;background:inherit;padding:6px 0;margin-top:-6px;z-index:1}
#symSheet h2{font-size:17px;margin:0;flex:1;line-height:1.4;overflow-wrap:anywhere}
#symSheet .sy-x{flex:none;min-width:44px;min-height:44px;border:0;border-radius:10px;background:rgba(127,127,127,.15);font-size:15px;cursor:pointer;color:inherit}
#symSheet .sy-i{font-size:14px;opacity:.8;margin:4px 0 10px;line-height:1.6}
#symSheet h3{font-size:15px;margin:16px 0 6px;color:var(--accent,#2563eb)}
#symSheet .sy-e{padding:8px 10px;border-radius:10px;margin:4px 0;background:rgba(127,127,127,.07);scroll-margin-top:64px;line-height:1.6;font-size:14.5px}
#symSheet .sy-e b{font-size:17px;margin-right:8px;font-family:'KaTeX_Main','Times New Roman',serif}
#symSheet .sy-e span{opacity:.75;font-size:13.5px}
#symSheet .sy-e p{margin:2px 0 0;overflow-wrap:anywhere}
#symSheet .sy-e.on{outline:2px solid #f59e0b;background:rgba(245,158,11,.14)}`;

let lastFocus: HTMLElement | null = null;
function close() {
  const el = document.getElementById('symSheet'); if (!el) return;
  el.remove(); window.removeEventListener('keydown', onKey, true);
  lastFocus?.focus?.(); lastFocus = null;
}
function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } }

/** open the glossary at one symbol (key) or at the top ('*') */
export async function openSym(key: string, lang: Lang): Promise<void> {
  const d = await load();
  if (!document.getElementById('symCss')) { const st = document.createElement('style'); st.id = 'symCss'; st.textContent = CSS; document.head.appendChild(st); }
  close();
  lastFocus = document.activeElement as HTMLElement | null;
  const root = document.createElement('div'); root.id = 'symSheet';
  let h = `<div class="sy-p" role="dialog" aria-modal="true" aria-labelledby="symT"><div class="sy-t"><h2 id="symT">${esc(d.title[lang])}</h2><button type="button" class="sy-x" aria-label="${esc(d.close[lang])}">✕</button></div><p class="sy-i">${esc(d.intro[lang])}</p>`;
  for (const g of d.groups) {
    h += `<h3>${esc(g.n[lang])}</h3>`;
    for (const k of g.k) { const s = d.sym[k]!; h += `<div class="sy-e" id="sy-${k}" data-k="${k}"><b>${esc(s.s)}</b><span>${esc(d.read[lang])}${esc(s.r[lang])}</span><p>${esc(s.m[lang])}</p></div>`; }
  }
  root.innerHTML = h + '</div>';
  root.addEventListener('click', (e) => { const t = e.target as Element; if (t === root || t.closest('.sy-x')) close(); });
  document.body.appendChild(root);
  window.addEventListener('keydown', onKey, true);
  (root.querySelector('.sy-x') as HTMLElement).focus({ preventScroll: true });
  const tg = key !== '*' ? root.querySelector<HTMLElement>(`[data-k="${key.replace(/[^\w]/g, '')}"]`) : null;
  if (tg) { tg.classList.add('on'); tg.scrollIntoView({ block: 'center' }); }
}
export const closeSym = close;
