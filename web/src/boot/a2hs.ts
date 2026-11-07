/* R16 lazy: the one-time "add to home screen to open full screen" tip (iPhone, browsers without the Fullscreen API) */
import { useApp } from '../store/app';
import { tx } from '../i18n/L';
import type { Bi } from '../i18n/types';
import { IC } from './ic';

/* only this chunk shows it, so it lives here (codes.ts holds the strings shared across the app) */
const TIP: Bi = { zh: '添加到主屏幕后可全屏打开', en: 'Add to Home Screen to open it full screen' };
const HOW: Record<'ios' | 'other', Bi> = {
  ios: { zh: '点 Safari 的「分享」按钮（或「···」→ 分享），选「添加到主屏幕」。', en: 'In Safari tap Share (or ··· → Share), then "Add to Home Screen".' },
  other: { zh: '在浏览器菜单里选「添加到主屏幕」或「安装应用」。', en: 'In the browser menu choose "Add to Home screen" or "Install app".' },
};
const CSS = '.si-a2{position:fixed;left:50%;bottom:calc(var(--bnh,56px) + 12px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:125;display:flex;align-items:flex-start;gap:4px;width:max-content;max-width:calc(100vw - 24px);box-sizing:border-box;padding:10px 4px 10px 14px;background:var(--card);color:var(--card);border:1px solid var(--ink);border-radius:14px;box-shadow:0 8px 28px rgba(30,27,75,.22);font:14px/1.45 system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif}'
  + '.si-a2 b{display:block;color:var(--link)}.si-a2 small{display:block;font-size:12.5px;color:var(--link);margin-top:2px}'
  + '#siFsAsk{top:calc(52px + env(safe-area-inset-top,0px));bottom:auto;padding:6px 8px 6px 12px;align-items:center;gap:8px;font-size:13px}#siFsAsk>div{display:flex;align-items:center;gap:8px;flex-wrap:nowrap}#siFsAsk b{display:inline;white-space:nowrap}#siFsAsk small{display:none}.fa-r{display:flex;gap:6px;margin:0}.fa-r button{min-height:44px;padding:0 12px;border-radius:999px;border:1px solid var(--ink);background:var(--card);color:var(--link);font-weight:600;font-size:14px;line-height:1;font-family:inherit;cursor:pointer}.fa-r .fa-y{background:var(--link);border-color:var(--line);color:var(--ink)}'
  + '#siA2hs button{flex:none;width:36px;height:36px;margin-top:-6px;border:0;background:none;font-size:20px;color:var(--link);cursor:pointer}';

/* R21: ask before going full screen (Android & co.) — the tap on "full screen" is the gesture the API needs */
const ASK: Record<'q' | 'w' | 'y' | 'n', Bi> = {
  q: { zh: '全屏看更大？', en: 'Full screen?' },
  w: { zh: '也可以以后在 ⚙ 设置里开。', en: 'Or later in ⚙ Settings.' },
  y: { zh: '⛶ 全屏', en: '⛶ Full' },
  n: { zh: '不用了', en: 'No thanks' },
};
/** first-visit help (welcome card on screen, coach marks, tour) goes first: ask a bit later, a few times at most */
const busy = () => !!document.querySelector('.ob-bub,#tour,.l4-ob') || [...document.querySelectorAll('.ob-wel')].some((e) => { const r = e.getBoundingClientRect(); return r.height > 0 && r.bottom > 0 && r.top < innerHeight; });
export function askFS(enter: () => void, tries = 0) {
  if (document.getElementById('siA2hs') || document.getElementById('siFsAsk')) return;
  if (busy()) { if (tries < 12) setTimeout(() => askFS(enter, tries + 1), 5000); return; }
  const b = box('siFsAsk');
  const t = document.createElement('div'), r = document.createElement('div'), y = document.createElement('button'), n = document.createElement('button');
  r.className = 'fa-r'; y.type = n.type = 'button'; y.className = 'fa-y'; y.dataset.fs = 'yes'; n.dataset.fs = 'no';
  const txt = () => { const l = useApp.getState().lang, h = document.createElement('b'), m = document.createElement('small'); h.textContent = '📱 ' + ASK.q[l]; m.textContent = ASK.w[l]; t.replaceChildren(h, m); y.textContent = ASK.y[l]; n.textContent = ASK.n[l]; };
  txt();
  const un = useApp.subscribe((s, p) => { if (s.lang !== p.lang) txt(); });
  const close = () => { un(); clearTimeout(tm); b.remove(); };
  y.onclick = () => { close(); enter(); };
  n.onclick = () => { close(); try { localStorage.setItem('si.fs', '0'); } catch { /* fine */ } };
  r.append(y, n); t.append(r); b.append(t); document.body.appendChild(b);
  try { localStorage.setItem('si.fs.ask', '1'); } catch { /* fine */ }
  const tm = setTimeout(close, 9000);
}
function box(id: string) {
  if (!document.getElementById('siA2hsCss')) { const s = document.createElement('style'); s.id = 'siA2hsCss'; s.textContent = CSS; document.head.appendChild(s); }
  const b = document.createElement('div'); b.id = id; b.className = 'si-a2'; b.setAttribute('role', 'note'); return b;
}

export function showTip(ios: boolean, force = false) {
  if (document.getElementById('siA2hs')) return;
  try { if (!force && localStorage.getItem('si.a2hs')) return; localStorage.setItem('si.a2hs', '1'); } catch { /* fine */ }
  const b = box('siA2hs');
  const t = document.createElement('div'), x = document.createElement('button'); x.type = 'button'; x.innerHTML = IC.x;
  const txt = () => { const l = useApp.getState().lang; t.innerHTML = ''; const h = document.createElement('b'), m = document.createElement('small'); h.textContent = '📲 ' + TIP[l]; m.textContent = HOW[ios ? 'ios' : 'other'][l]; t.append(h, m); x.setAttribute('aria-label', tx('ui.close', l)); x.title = tx('ui.close', l); };
  txt();
  const un = useApp.subscribe((s, p) => { if (s.lang !== p.lang) txt(); });
  const close = () => { un(); b.remove(); };
  x.onclick = close;
  b.append(t, x); document.body.appendChild(b);
  setTimeout(close, 15000);
}
