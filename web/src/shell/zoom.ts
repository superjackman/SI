/* Detail level (live applyZoom): cards and blocks carry data-z 1..3; above the chosen level they get .zhide.
   Each station's #zn<S> note says how many cards are folded away and offers to expand. Saved as aiexp.v2.zoom. */
import { useApp } from '../store/app';
import type { Lang } from '../i18n/types';
import { hooks, toast } from '../nav';

const t2 = (l: Lang, zh: string, en: string) => (l === 'en' ? en : zh);
export function applyZoomDom(root: ParentNode, S: string, z: number, l: Lang) {
  root.querySelectorAll<HTMLElement>('[data-z]').forEach((el) => el.classList.toggle('zhide', +(el.dataset.z ?? 0) > z));
  const sec = root instanceof HTMLElement && root.id === S ? root : document.getElementById(S);
  const zn = document.getElementById('zn' + S); if (!sec || !zn) return;
  const hid = sec.querySelectorAll('.card.zhide').length;
  if (!hid) { zn.style.display = 'none'; return; }
  zn.style.display = 'flex';
  zn.innerHTML = t2(l, '🔭 当前是“', '🔭 Current view: “') + (z === 1 ? t2(l, '远看', 'Overview') : t2(l, '近看', 'Mid-level')) + t2(l, '”视图：已收起 ', '”; collapsed ') + hid
    + t2(l, ' 张', ' ') + (z === 1 ? t2(l, '细节与演示', 'detail & demo') : t2(l, '动手演示与实验', 'hands-on demo & lab')) + t2(l, '卡片。', ' cards.')
    + (z === 1 ? t2(l, '<button class="btn" data-zset="2">展开到近看</button>', '<button class="btn" data-zset="2">Expand to mid-level</button>') : '')
    + t2(l, '<button class="btn primary" data-zset="3">展开到细看（全部）</button>', '<button class="btn primary" data-zset="3">Expand to detail (all)</button>');
}
const TOAST: [string, string][] = [['', ''], ['🔭 远看：只看一句话概括和结构图', '🔭 Overview: just the one-line summary and diagram'], ['🗺️ 近看：加上原理与“为什么”', '🗺️ Mid-level: adds principles and the “why”'], ['🔬 细看：全部细节、演示和实验', '🔬 Detail: all details, demos and labs']];
export function setZoom(z: 1 | 2 | 3, say = false) {
  const s = useApp.getState();
  try { localStorage.setItem('aiexp.v2.zoom', JSON.stringify(z)); } catch { /* private mode */ }
  const sec = document.getElementById(s.station);
  s.set({ zoom: z });
  if (sec) applyZoomDom(sec, s.station, z, s.lang);
  if (say) { const m = TOAST[z]; if (m) toast(s.lang === 'en' ? m[1] : m[0]); }
}
/** live ensureVisible: jumping to something folded away by the detail level shows everything */
export function ensureVisible(el: Element | null) {
  const c = el?.closest<HTMLElement>('[data-z]');
  if (c && +(c.dataset.z ?? 0) > useApp.getState().zoom) setZoom(3);
}
hooks.ensureVisible = ensureVisible;
