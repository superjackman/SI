import { afterEach, describe, expect, it, vi } from 'vitest';
import { bustURL, cleanURL, entryOf, isChunkError, buildId, reloadOnce, RKEY } from '../../src/boot/stale';

describe('stale-deploy recovery', () => {
  afterEach(() => { sessionStorage.clear(); document.head.innerHTML = ''; vi.restoreAllMocks(); });
  it('recognises chunk load failures of Chrome, Firefox and Safari', () => {
    expect(isChunkError(new TypeError('Failed to fetch dynamically imported module: https://x/SI/next/assets/T1-a.js'))).toBe(true);
    expect(isChunkError(new TypeError('error loading dynamically imported module'))).toBe(true);
    expect(isChunkError(new TypeError('Importing a module script failed.'))).toBe(true);
    expect(isChunkError(new Error('Unable to preload CSS for /assets/x.css'))).toBe(true);
    expect(isChunkError(new Error('x is not a function'))).toBe(false);
  });
  it('cache-busting URL keeps path, query and hash; cleanURL removes only _r', () => {
    const loc = { pathname: '/SI/next/', search: '?lang=en&_r=1', hash: '#T3' };
    expect(bustURL(loc, 42)).toBe('/SI/next/?lang=en&_r=42#T3');
    expect(bustURL({ pathname: '/SI/next/', search: '', hash: '' }, 5)).toBe('/SI/next/?_r=5');
    expect(cleanURL(loc)).toBe('/SI/next/?lang=en#T3');
    expect(cleanURL({ pathname: '/p/', search: '?_r=9', hash: '#N' })).toBe('/p/#N');
    expect(cleanURL({ pathname: '/p/', search: '?lang=zh', hash: '' })).toBeNull();
  });
  it('build id = entry script of the running page / of a fetched index.html', () => {
    document.head.innerHTML = '<script type="module" src="/SI/next/assets/index-AAA.js"></script>';
    expect(buildId()).toBe('index-AAA.js');
    expect(entryOf('<script type="module" crossorigin src="/SI/next/assets/index-BBB.js"></script>')).toBe('index-BBB.js');
  });
  it('reloads at most once per build per session', () => {
    const rep = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, pathname: '/SI/next/', search: '', hash: '#T1', replace: rep } as Location);
    expect(reloadOnce('index-AAA.js')).toBe(true);
    expect(sessionStorage.getItem(RKEY)).toBe('index-AAA.js');
    expect(reloadOnce('index-AAA.js')).toBe(false);
    expect(rep).toHaveBeenCalledTimes(1);
    expect(String(rep.mock.calls[0]?.[0])).toMatch(/^\/SI\/next\/\?_r=\d+#T1$/);
    expect(reloadOnce('index-CCC.js')).toBe(true); // a different (newer) build may reload once more
  });
});
