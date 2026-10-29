/* R41b: the 设置 sheet (reference G4): 语言 中文 / English, 动画 on/off, R42 全屏 on/off (CSS animations, the SVG flow dots and the 3D
   sway / pulse / moving lights / tilt all stop), 清除学习记录 with a confirm step, 完成. The reference also shows 声音,
   but the site plays no sound and has no vibration, so there is no switch for it (no dead control). */
import { tx, type L } from './txt';
import { animOn, clearRecord, setAnim } from '../store/prefs';
import { canFS, fsEl, installed, toggleFS } from '../boot/fs';

export interface SetApi { lang: () => L; setLang: (l: L) => void; anim: () => void; cleared: () => void }
const T = {
  t: ['设置', 'Settings'], lang: ['语言', 'Language'], anim: ['动画', 'Animation'], animS: ['关掉后画面不再动，3D 也停住', 'Off: nothing moves, the 3D stays still'],
  fs: ['全屏', 'Full screen'], fsS: ['藏起地址栏，画面更大。iPhone 的 Safari 不支持网页全屏，可用「分享 → 添加到主屏幕」', 'Hides the address bar for a bigger page. iPhone Safari has no web full screen: use Share → Add to Home Screen'],
  fsI: ['已从主屏幕打开，本来就是全屏', 'Opened from the home screen: already full screen'],
  clr: ['清除学习记录', 'Clear learning record'], clrQ: ['确定清除？', 'Clear everything?'],
  clrP: ['看过的页面、打开过的知识卡、小测答题、实验记录、连续天数和快速路径都会删除，不能恢复。你训练的模型会保留。', 'Pages seen, cards opened, quiz answers, experiment runs, streak days and the quick path are deleted for good. Your own trained model is kept.'],
  yes: ['清除', 'Clear'], no: ['取消', 'Cancel'], done: ['完成', 'Done'], ok: ['已清除学习记录', 'Learning record cleared'],
} as const;

export function openSettings(host: HTMLElement, api: SetApi) {
  host.querySelector('.l4-set')?.remove();
  const el = document.createElement('div'); el.className = 'l4-sheet l4-set'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
  let ask = false, msg = '';
  const draw = () => {
    const l = api.lang(), z = (k: keyof typeof T) => tx(T[k] as readonly [string, string], l), on = animOn(), inst = installed(), fs = inst || !!fsEl();
    el.setAttribute('aria-label', z('t'));
    el.innerHTML = `<div class="l4-sin"><header class="l4-sh l4-sth"><b class="l4-kn">${z('t')}</b></header><div class="l4-sbody">
<div class="l4-srow"><span>${z('lang')}</span><span class="l4-seg" role="group" aria-label="${z('lang')}"><button type="button" data-v="zh" aria-pressed="${l === 'zh'}"${l === 'zh' ? ' class="on"' : ''}>中文</button><button type="button" data-v="en" aria-pressed="${l === 'en'}"${l === 'en' ? ' class="on"' : ''}>English</button></span></div>
<div class="l4-srow"><span>${z('anim')}<small>${z('animS')}</small></span><button type="button" class="l4-sw${on ? ' on' : ''}" role="switch" aria-checked="${on}" aria-label="${z('anim')}" data-v="anim"><i></i></button></div>
<div class="l4-srow"><span>${z('fs')}<small>${z(inst ? 'fsI' : 'fsS')}</small></span><button type="button" class="l4-sw${fs ? ' on' : ''}" role="switch" aria-checked="${fs}" aria-label="${z('fs')}" data-v="fs"${inst ? ' disabled' : ''}><i></i></button></div>
<div class="l4-srow"><span>${z('clr')}</span><button type="button" class="l4-clr" data-v="clr">${z('clr')}</button></div>
${ask ? `<div class="l4-cfm" role="alertdialog" aria-label="${z('clrQ')}"><b>${z('clrQ')}</b><p>${z('clrP')}</p><div><button type="button" class="l4-b" data-v="no">${z('no')}</button><button type="button" class="l4-b l4-red" data-v="yes">${z('yes')}</button></div></div>` : ''}
${msg ? `<p class="l4-sok" role="status">${msg}</p>` : ''}
</div><footer class="l4-sf"><button type="button" class="l4-b pri l4-done" data-v="done">${z('done')}</button></footer></div>`;
  };
  const fsc = () => draw();
  const close = () => { el.remove(); removeEventListener('keydown', key); document.removeEventListener('fullscreenchange', fsc); document.removeEventListener('webkitfullscreenchange', fsc); };
  const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  el.addEventListener('click', (e) => {
    e.stopPropagation(); const t = e.target as HTMLElement; if (t === el) { close(); return; }
    const v = t.closest<HTMLElement>('[data-v]')?.dataset.v; if (!v) return;
    if (v === 'zh' || v === 'en') { if (v !== api.lang()) api.setLang(v); msg = ''; }
    else if (v === 'anim') { setAnim(!animOn()); api.anim(); msg = ''; }
    else if (v === 'fs') { if (!canFS()) { close(); toggleFS(); return; } toggleFS(); msg = ''; }
    else if (v === 'clr') { ask = true; msg = ''; }
    else if (v === 'no') ask = false;
    else if (v === 'yes') { clearRecord(); api.cleared(); ask = false; msg = tx(T.ok, api.lang()); }
    else if (v === 'done') { close(); return; }
    draw(); el.querySelector<HTMLElement>(v === 'clr' ? '[data-v="no"]' : `[data-v="${v === 'yes' || v === 'no' ? 'clr' : v}"]`)?.focus({ preventScroll: true });
  });
  addEventListener('keydown', key); document.addEventListener('fullscreenchange', fsc); document.addEventListener('webkitfullscreenchange', fsc);
  draw(); host.appendChild(el); el.querySelector<HTMLElement>('.l4-done')?.focus({ preventScroll: true });
  return { redraw: draw, close };
}
