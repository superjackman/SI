import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
/* R29: the app's own reloads (stale version auto-reload, chunk recovery, update banner) used to send a second
   page-view for the same stop. reloadTo() leaves a one-shot marker; the first view after it is skipped only when it is
   the same stop that was already counted in this tab. Every real navigation still counts exactly once. */
const sent: string[] = [];
class Img { onload: unknown = null; onerror: unknown = null; set src(u: string) { sent.push(new URL(u).searchParams.get('p')!); } }
const views = () => sent.filter((p) => !p.startsWith('evt-'));
async function fresh() { vi.resetModules(); return await import('../../src/analytics'); }
beforeEach(() => { sent.length = 0; sessionStorage.clear(); vi.stubGlobal('Image', Img); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('R29 one page-view per real navigation', () => {
  it('first load counts once; same stop again is ignored; a new stop counts', async () => {
    const a = await fresh();
    a.count('zh', 'T3', 't'); a.count('zh', 'T3', 't'); a.count('zh', 'T4', 't'); a.count('en', 'T4', 't');
    expect(views()).toEqual(['/zh/T3', '/zh/T4', '/en/T4']);
  });
  it('after our own reload to the same stop: no second page-view (the double the live site sent)', async () => {
    let a = await fresh(); a.count('zh', 'T3', 't');
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, replace: () => {} } as Location);
    const { reloadTo } = await import('../../src/boot/stale'); reloadTo('/SI/?v=x');
    a = await fresh(); a.count('zh', 'T3', 't');
    expect(views()).toEqual(['/zh/T3']);
    a.count('zh', 'T4', 't'); // navigating on after it counts as usual
    expect(views()).toEqual(['/zh/T3', '/zh/T4']);
    expect(sessionStorage.getItem('si.gcre')).toBeNull(); // marker is one-shot
  });
  it('a reload that lands on another stop, or a reload by the user (F5, no marker), counts', async () => {
    let a = await fresh(); a.count('zh', 'T3', 't');
    sessionStorage.setItem('si.gcre', '1');
    a = await fresh(); a.count('zh', 'H', 't');
    a = await fresh(); a.count('zh', 'H', 't');
    expect(views()).toEqual(['/zh/T3', '/zh/home', '/zh/home']);
  });
  it('a reload before anything was counted still counts once', async () => {
    sessionStorage.setItem('si.gcre', '1');
    const a = await fresh(); a.count('en', 'T2', 't');
    expect(views()).toEqual(['/en/T2']);
  });
});
