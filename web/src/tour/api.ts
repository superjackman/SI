/* Guided tour (live startTour / endTour / tourGo): 15 steps through the stations; the panel itself is a lazy chunk.
   This module stays in the first-load bundle (tiny): it only flips state. */
import { useApp } from '../store/app';
import { closeInfo, toast } from '../nav';
import { setZoom } from '../shell/zoom';

export const TOUR_LEN = 15;
const st = () => useApp.getState();
const t2 = (zh: string, en: string) => (st().lang === 'en' ? en : zh);
export function clearHl() {
  document.querySelectorAll('.tour-hl').forEach((e) => e.classList.remove('tour-hl'));
  document.querySelectorAll<SVGElement>('.level [data-tourrun]').forEach((g) => { g.classList.remove('run'); delete g.dataset.tourrun; });
}
export function startTour() {
  if (st().zoom < 2) setZoom(2);
  closeInfo();
  st().set({ tour: 0 });
  document.body.classList.add('touring');
  toast(t2('🎬 导览开始：点下方面板的按钮前进后退，× 退出', '🎬 Tour started: use the buttons on the panel below to go forward and back; × to exit'));
}
export function endTour(done: boolean) {
  clearHl();
  document.body.classList.remove('touring');
  st().set({ tour: null });
  if (done) {
    try { localStorage.setItem('aiexp.v2.tourDone', '1'); } catch { /* private mode */ }
    toast(t2('🎉 导览完成！可以去每页的“🧪 动手实验”自己试试。', '🎉 Tour complete! Try the “🧪 Labs” on each stop yourself.'));
  }
}
export function tourGo(i: number) {
  if (i < 0) return;
  if (i >= TOUR_LEN) { endTour(true); return; }
  st().set({ tour: i });
}
/** ◀ ▶ (sheet, keyboard) step the tour while it is on (live stepPage) */
export function tourStep(d: number): boolean { const i = st().tour; if (i == null) return false; tourGo(i + d); return true; }
export const toggleTour = () => { if (st().tour != null) endTour(false); else startTour(); };
