/* Bring a station snapshot (live markup) to life: English label fitting, ⤵ badges, pan/zoom viewers,
   station nav, overflow hints, then the lab islands. Returns a disposer. */
import type { Lang } from '../i18n/types';
import { fitSvgs } from '../ui/diagram/fit';
import { markAll } from '../ui/diagram/drill';
import { Viewer } from '../ui/diagram/Viewer';
import { drill, openInfo, go, openAnywhere, jumpTo, closeInfo, toast, visited } from '../nav';
import { mountIslands, type Islands } from '../legacy/runtime';
import { PATH, TABORDER, tabn } from '../legacy/kb';
import { tx } from '../i18n/L';
import { restoreTags } from '../legacy/restore';
import { mountProgress } from './progress';
import { mountQuiz } from './quiz';
import { useApp } from '../store/app';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
const ICO = {
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
export { ICO };
/** live dotsHTML (English aria label fixed: live reads "Word  3 : …", here "Stop 3: …") */
export function dotClasses(L: string): string[] {
  const v = visited();
  return TABORDER.map((k, i) => {
    const prev = TABORDER[Math.max(0, i - 1)] as string;
    return (k === L ? 'on' : '') + (v.includes(k) ? ' v' : '') + ((PATH[k]?.length ?? 0) > (PATH[prev]?.length ?? 0) && i ? ' sub' : '');
  });
}
export function dotsHTML(L: string, tap: boolean, lang: Lang): string {
  const cls = dotClasses(L);
  return TABORDER.map((k, i) => {
    const c = cls[i] ?? '';
    return tap
      ? '<button type="button" class="dt ' + c + '" data-go="' + k + (lang === 'en' ? '" aria-label="Stop' : '" aria-label="第') + ' ' + (i + 1) + (lang === 'en' ? ': ' : ' 站：') + esc(tabn(k, lang)) + (k === L ? tx('nav.current', lang) : '') + '"><i></i></button>'
      : '<i class="' + c + '"></i>';
  }).join('');
}
/** stop numbers in the page head come from TABORDER (the snapshots were taken with 11 stops; M2 inserted U…Ud) */
export function renumber(root: ParentNode, S: string, lang: Lang) {
  const i = TABORDER.indexOf(S); if (i < 0) return;
  root.querySelectorAll('.pagehead .pg-n').forEach((e) => { e.textContent = String(i + 1); });
  root.querySelectorAll('.pagehead .ph-lv').forEach((e) => { e.textContent = lang === 'en' ? `Stop ${i + 1} of ${TABORDER.length} ` : `第 ${i + 1} 站 / 共 ${TABORDER.length} 站`; });
}
export function renderPN(root: ParentNode, lang: Lang) {
  root.querySelectorAll<HTMLElement>('.m-pn').forEach((nav) => {
    const L = nav.dataset.sec ?? '', i = TABORDER.indexOf(L), pv = TABORDER[i - 1], nx = TABORDER[i + 1];
    nav.innerHTML = '<div class="pn-row"><button type="button" class="pn-b"' + (pv ? ' data-go="' + pv + '" aria-label="' + tx('nav.prevStop', lang) + esc(tabn(pv, lang)) + '"' : ' disabled aria-label="' + tx('nav.firstStop', lang) + '"') + '>' + ICO.prev + '</button><div class="pn-dots">' + dotsHTML(L, true, lang) + '</div><button type="button" class="pn-b pri"' + (nx ? ' data-go="' + nx + '" aria-label="' + tx('nav.nextStop', lang) + esc(tabn(nx, lang)) + '"' : ' disabled aria-label="' + tx('nav.lastStopPn', lang) + '"') + '>' + ICO.next + '</button></div>' +
      '<p class="pn-cap">' + (i + 1) + ' / ' + TABORDER.length + ' · ' + (nx ? tx('nav.nextStop', lang).trim() + ' <button type="button" class="pn-l" data-go="' + nx + '">' + esc(tabn(nx, lang)) + ' ›</button>' : tx('nav.lastStopCap', lang)) + '</p>';
  });
}
/** live updHints: overflow shadows on scrollers */
export function updHints(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('.tscroll,.hm-wrap,.scroll').forEach((p) => {
    const o = p.scrollWidth > p.clientWidth + 2; p.classList.toggle('ovf', o);
    const n = p.nextElementSibling; if (n && n.classList.contains('thint')) n.classList.toggle('show', o);
  });
}
export function fitAndMark(root: ParentNode, st: string, lang: Lang) {
  if (lang === 'en') fitSvgs(root.querySelectorAll('svg'));
  markAll(root, st, lang);
}
type VHost = HTMLElement & { __v?: Viewer };
export function setupViewers(sec: HTMLElement): Viewer[] {
  const out: Viewer[] = [];
  sec.querySelectorAll<HTMLElement>('.m-dg').forEach((wrap) => {
    const dg = wrap.querySelector<VHost>(':scope>.diagram');
    if (!dg || dg.__v || !dg.querySelector('svg')) return;
    const v = new Viewer(dg, {
      onChange: (vv) => {
        const p = wrap.querySelector('.vp'); if (p) p.textContent = Math.round(vv.s * 100) + '%';
        const rb = wrap.querySelector<HTMLButtonElement>('[data-vz=reset]'); if (rb) rb.disabled = vv.s <= 1.001;
        wrap.classList.toggle('zoomed', vv.s > 1.001);
      },
      onTap: (id) => openInfo(id),
      onDrill: (to, src) => drill(to, { src }),
    });
    out.push(v);
    wrap.querySelector('.m-vbar')?.addEventListener('click', (e) => {
      const b = (e.target as Element).closest<HTMLElement>('[data-vz]'); if (!b) return;
      const k = b.dataset.vz;
      if (k === 'in') v.step(1.5); else if (k === 'out') v.step(1 / 1.5); else if (k === 'reset') v.reset(true);
      else if (k === 'full') useApp.getState().set({ full: { host: dg, station: useApp.getState().station } });
    });
  });
  return out;
}
export interface Hydrated { islands: Islands | null; dispose(): void }
export async function hydrate(sec: HTMLElement, S: string, lang: Lang, alive: () => boolean): Promise<Hydrated> {
  restoreTags(sec);
  renumber(sec, S, lang);
  renderPN(sec, lang);
  fitAndMark(sec, S, lang);
  const vs = setupViewers(sec);
  requestAnimationFrame(() => { vs.forEach((v) => v.apply()); updHints(sec); });
  if (lang === 'en' && document.fonts?.ready) void document.fonts.ready.then(() => { if (alive()) { fitAndMark(sec, S, lang); } });
  const islands = await mountIslands(S, sec, lang, { go: (s) => go(s), openInfo, openAnywhere, jumpTo, closeInfo, toast });
  /* the quiz runs right after the labs' start-up code, like on live (native since R4) */
  const quiz = await mountQuiz(sec, S, lang).catch((e: unknown) => { console.error('[quiz]', e); return () => {}; });
  /* live start-up order: the quiz is rendered first, then its tag moves into the card's meta row (normHead) */
  sec.querySelectorAll<HTMLElement>('.card.quiz.has-meta').forEach((c) => {
    const zl = c.querySelector(':scope>.zl'), h = c.querySelector(':scope>h2,:scope>h3');
    if (!zl || !h || c.querySelector(':scope>.cc-meta')) return;
    const m = document.createElement('div'); m.className = 'cc-meta'; m.appendChild(zl); c.insertBefore(m, h);
  });
  if (!alive()) { quiz(); islands?.dispose(); vs.forEach((v) => v.destroy()); return { islands: null, dispose() {} }; }
  const prog = mountProgress(sec, S, lang);
  return { islands, dispose() { quiz(); prog(); islands?.dispose(); vs.forEach((v) => v.destroy()); } };
}
