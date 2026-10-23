/* R17: station controls drawn with the shared icon set (lazy: loaded with the station's labs, never on first load).
   Lab buttons keep their words where an icon alone would be unclear (▶ 播放训练 → icon + words); reset / undo and the
   diagram bar (− ＋ ⟲ ⛶) become icon-only with aria-label + title. The labs set button text through textContent
   (▶ 播放 ⇄ ⏸ 暂停), so each decorated button gets an own textContent accessor that repaints the icon and hands the
   labs back the text they set. */
import { IC } from '../shell/common';
import { IC2 } from '../ui/ic2';

const TC = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent') as PropertyDescriptor & { get(): string; set(v: string): void };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
/* [text pattern, icon, 0 = icon before the words | 1 = after | 2 = icon only] */
const RULES: Array<[RegExp, string, 0 | 1 | 2]> = [
  [/^▶\s*(.+)$/, IC2.play, 0],
  [/^⏸\s*(.+)$/, IC2.pause, 0],
  [/^(暂停|Pause|停止|Stop)$/, IC2.pause, 0],
  [/^(自动播放|Autoplay|自动运行|Auto-run|自动训练|Auto-train|自动旋转|Auto-rotate|自动扫完|Scan all)$/, IC2.play, 0],
  [/^◀\s*(.+)$/, IC.prev, 0],
  [/^(上一步|Back)$/, IC.prev, 0],
  [/^(.+?)\s*⏭$/, IC2.step, 1],
  [/^(.+?)\s*▶$/, IC.next, 1],
  [/^(下一步|Next)$/, IC.next, 1],
  [/^↗\s*(.+)$/, IC2.open, 0],
  [/^⟲$/, IC.reset, 2],
  [/^↶$/, IC2.undo, 2],
  [/^(重置|Reset)$/, IC.reset, 2],
];
/* glyph-only buttons need words for aria-label / title */
const WORD: Record<string, [string, string]> = { '⟲': ['重置', 'Reset'], '↶': ['撤销', 'Undo'] };
const VZ: Record<string, string> = { out: IC.minus, in: IC.plus, reset: IC.reset, full: IC.fs };
const raw = new WeakMap<HTMLElement, [string, string]>();

function paint(b: HTMLElement, v: string): boolean {
  const s = v.trim();
  for (const [re, svg, k] of RULES) {
    const m = re.exec(s); if (!m) continue;
    let lab = '';
    if (k === 2) {
      const l = b.getAttribute('aria-label') || (WORD[s] ? WORD[s][document.documentElement.lang.startsWith('en') ? 1 : 0] : s);
      b.setAttribute('aria-label', l); if (!b.title) b.title = l;
      b.classList.add('ib'); b.innerHTML = svg;
    } else {
      lab = m[1] ?? s;
      b.innerHTML = k ? `<span>${esc(lab)}</span>${svg}` : `${svg}<span>${esc(lab)}</span>`;
    }
    b.classList.add('has-ic');
    raw.set(b, [v, lab]);
    return true;
  }
  return false;
}
function hook(b: HTMLElement) {
  /* structured chips (<i>↗</i><span>words</span>; the words can be hidden on narrow cards): swap the glyph, label it */
  const g = b.querySelector(':scope>i[aria-hidden]'), w = b.querySelector(':scope>span');
  if (g && w) {
    if (g.textContent?.trim() === '↗') { g.innerHTML = IC2.open; b.classList.add('has-ic'); }
    const l = w.textContent?.trim(); if (l) { if (!b.hasAttribute('aria-label')) b.setAttribute('aria-label', l); if (!b.title) b.title = l; }
    return;
  }
  if (!paint(b, TC.get.call(b))) return;
  Object.defineProperty(b, 'textContent', {
    configurable: true,
    get() { const r = raw.get(b), n = TC.get.call(b); return r && r[1] === n ? r[0] : n; },
    set(v: string) { if (!paint(b, String(v))) { raw.delete(b); TC.set.call(b, v); } },
  });
}
/** decorate the station's controls (idempotent per element: a station re-render brings new elements) */
export function iconize(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('button.btn, button.dd-c').forEach(hook);
  root.querySelectorAll<HTMLElement>('.vz[data-vz]').forEach((b) => {
    const svg = VZ[b.dataset.vz ?? '']; if (!svg) return;
    b.innerHTML = svg; const l = b.getAttribute('aria-label'); if (l && !b.title) b.title = l;
  });
}
