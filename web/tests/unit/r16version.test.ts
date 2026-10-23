import { afterEach, describe, expect, it, vi } from 'vitest';
import { check, decide, freshURL, remoteId, banner, _reset, FRESH_MS, VKEY, THROTTLE_MS } from '../../src/boot/version';
import { cleanURL } from '../../src/boot/stale';
import { buildId, versionJson } from '../../scripts/build-id.mjs';
import { useApp } from '../../src/store/app';

const okJson = (id: unknown) => vi.fn(async () => new Response(JSON.stringify({ id }), { status: 200 }));
const mockLoc = (rep: (u: string) => void) => vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, pathname: '/SI/', search: '?lang=en', hash: '#T5/labGradCheck', replace: rep } as unknown as Location);

describe('R16 version.json stale-cache check', () => {
  afterEach(() => { _reset(); sessionStorage.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('freshURL keeps path, ?lang and the hash route; replaces old v/_r; stale guard strips _r but keeps v', () => {
    expect(freshURL({ pathname: '/SI/', search: '?lang=en', hash: '#T3/llm' }, 'abc', 7)).toBe('/SI/?lang=en&v=abc&_r=7#T3/llm');
    expect(freshURL({ pathname: '/SI/', search: '?v=old&_r=1&lang=zh', hash: '' }, 'new', 8)).toBe('/SI/?lang=zh&v=new&_r=8');
    expect(cleanURL({ pathname: '/SI/', search: '?lang=en&v=abc&_r=7', hash: '#T3' })).toBe('/SI/?lang=en&v=abc#T3');
  });
  it('decide: same / unknown id → nothing; fresh & untouched → reload once; else banner', () => {
    const b = { cur: 'a', remote: 'b', reloadedTo: null, age: 1000, touched: false };
    expect(decide({ ...b, remote: 'a' })).toBe('none');
    expect(decide({ ...b, remote: '' })).toBe('none');
    expect(decide(b)).toBe('reload');
    expect(decide({ ...b, reloadedTo: 'b' })).toBe('banner');
    expect(decide({ ...b, touched: true })).toBe('banner');
    expect(decide({ ...b, age: FRESH_MS + 1 })).toBe('banner');
    expect(decide({ ...b, reloadedTo: 'older' })).toBe('reload');
  });
  it('remoteId: no-store fetch with ?t=; 404 / bad JSON / bad id → ""', async () => {
    const f = okJson('x1'); vi.stubGlobal('fetch', f);
    expect(await remoteId('/SI/', 5)).toBe('x1');
    expect(f).toHaveBeenCalledWith('/SI/version.json?t=5', { cache: 'no-store' });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 404 }))); expect(await remoteId('/SI/')).toBe('');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>', { status: 200 }))); expect(await remoteId('/SI/')).toBe('');
    vi.stubGlobal('fetch', okJson('<script>')); expect(await remoteId('/SI/')).toBe('');
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); })); expect(await remoteId('/SI/')).toBe('');
  });
  it('mismatch: ONE reload (hash + lang kept, v=<id>), the next mismatch shows the banner instead', async () => {
    useApp.getState().set({ lang: 'zh' });
    vi.stubGlobal('fetch', okJson('new1'));
    vi.spyOn(performance, 'now').mockReturnValue(1500);
    const rep = vi.fn(); mockLoc(rep);
    expect(await check(() => false, { cur: 'old', base: '/SI/' })).toBe('reload');
    expect(rep).toHaveBeenCalledTimes(1);
    expect(rep.mock.calls[0]?.[0]).toMatch(/^\/SI\/\?lang=en&v=new1&_r=\d+#T5\/labGradCheck$/);
    expect(sessionStorage.getItem(VKEY)).toBe('new1');
    _reset(); // the reloaded page (still stale): same remote id → banner, never a second reload
    expect(await check(() => false, { cur: 'old', base: '/SI/' })).toBe('banner');
    expect(rep).toHaveBeenCalledTimes(1);
    expect(document.getElementById('siUpd')?.textContent).toContain('有新版本，点此刷新');
  });
  it('touched or opened long ago → banner (no reload); same id → nothing; 404 → nothing', async () => {
    const rep = vi.fn(); mockLoc(rep);
    vi.stubGlobal('fetch', okJson('n2'));
    vi.spyOn(performance, 'now').mockReturnValue(500);
    expect(await check(() => true, { cur: 'old', base: '/SI/' })).toBe('banner');
    _reset(); vi.spyOn(performance, 'now').mockReturnValue(FRESH_MS + 5000);
    expect(await check(() => false, { cur: 'old', base: '/SI/' })).toBe('banner');
    _reset(); expect(await check(() => false, { cur: 'n2', base: '/SI/' })).toBe('none');
    _reset(); vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })));
    expect(await check(() => false, { cur: 'old', base: '/SI/' })).toBe('none');
    expect(rep).not.toHaveBeenCalled();
    expect(document.getElementById('siUpd')).toBeNull();
  });
  it('re-checks are throttled to once per 5 minutes unless forced', async () => {
    const f = okJson('same'); vi.stubGlobal('fetch', f);
    let t = 1_000_000; vi.spyOn(Date, 'now').mockImplementation(() => t);
    await check(() => true, { cur: 'same', base: '/' });
    t += 60_000; expect(await check(() => true, { cur: 'same', base: '/' })).toBe('none');
    expect(f).toHaveBeenCalledTimes(1);
    t += THROTTLE_MS; await check(() => true, { cur: 'same', base: '/' });
    expect(f).toHaveBeenCalledTimes(2);
    await check(() => true, { cur: 'same', base: '/', force: true });
    expect(f).toHaveBeenCalledTimes(3);
  });
  it('banner: zh/en text follows the language; tap → reload to the new version; × closes', () => {
    const rep = vi.fn(); mockLoc(rep);
    useApp.getState().set({ lang: 'zh' });
    banner('id9');
    const go = document.querySelector<HTMLButtonElement>('#siUpd .upd-go');
    expect(go?.textContent).toBe('有新版本，点此刷新');
    useApp.getState().set({ lang: 'en' });
    expect(go?.textContent).toBe('A new version is available, tap to refresh');
    banner('id9'); expect(document.querySelectorAll('#siUpd')).toHaveLength(1);
    go?.click(); expect(rep.mock.calls[0]?.[0]).toMatch(/v=id9/);
    document.querySelector<HTMLButtonElement>('#siUpd .upd-x')?.click();
    expect(document.getElementById('siUpd')).toBeNull();
    useApp.getState().set({ lang: 'zh' });
  });
  it('build id: stable, 12 hex, depends on the base; version.json = {"id":…}', () => {
    const web = process.cwd();
    const a = buildId(web, '/SI/'), b = buildId(web, '/SI/'), c = buildId(web, '/SI/next/');
    expect(a).toMatch(/^[0-9a-f]{12}$/); expect(a).toBe(b); expect(c).not.toBe(a);
    expect(JSON.parse(versionJson(a))).toEqual({ id: a });
  });
});
