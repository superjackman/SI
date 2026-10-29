import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { atEdge, EDGE, installEdgeGuard, isIOSUA } from '../../src/boot/edge';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';
const web = process.cwd();

describe('R16 iOS edge swipe-back guard', () => {
  it('only the outer 20 px count, and never on links / buttons / sliders / scrollers', () => {
    document.body.innerHTML = '<main><p id="p">text</p><a id="a" href="#">x</a><input id="r" type="range"><div class="tscroll"><span id="s">s</span></div></main>';
    const $ = (id: string) => document.getElementById(id);
    expect(EDGE).toBe(20);
    expect(atEdge(5, 390, $('p'))).toBe(true);
    expect(atEdge(385, 390, $('p'))).toBe(true);
    expect(atEdge(19, 390, $('p'))).toBe(true);
    expect(atEdge(20, 390, $('p'))).toBe(false);
    expect(atEdge(200, 390, $('p'))).toBe(false);
    expect(atEdge(5, 390, $('a'))).toBe(false);
    expect(atEdge(5, 390, $('r'))).toBe(false);
    expect(atEdge(5, 390, $('s'))).toBe(false);
  });
  it('iOS only (iPhone, iPad, iPadOS desktop UA with touch)', () => {
    expect(isIOSUA(IPHONE, 5)).toBe(true);
    expect(isIOSUA('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', 5)).toBe(true);
    expect(isIOSUA('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', 0)).toBe(false);
    expect(isIOSUA(ANDROID, 5)).toBe(false);
  });
  it('non-passive touchstart on <main> prevents only edge touches; nothing at all off iOS', () => {
    document.body.innerHTML = '<main id="m"><p id="p">text</p></main>';
    const m = document.getElementById('m')!, p = document.getElementById('p')!;
    const fire = (x: number) => { const e = new Event('touchstart', { bubbles: true, cancelable: true }); Object.defineProperty(e, 'touches', { value: [{ clientX: x, clientY: 100 }] }); p.dispatchEvent(e); return e.defaultPrevented; };
    const un = installEdgeGuard(m, IPHONE, 5);
    expect(fire(4)).toBe(true);
    expect(fire(innerWidth - 4)).toBe(true);
    expect(fire(innerWidth / 2)).toBe(false);
    un();
    expect(fire(4)).toBe(false);
    const un2 = installEdgeGuard(m, ANDROID, 5);
    expect(fire(4)).toBe(false);
    un2();
  });
});

describe('R16 full screen + add-to-home-screen tip', () => {
  const mm = (coarse: boolean, standalone = false) => vi.fn((q: string) => ({ matches: q.includes('coarse') ? coarse : standalone, media: q, addEventListener() {}, removeEventListener() {} }));
  beforeEach(() => { vi.resetModules(); localStorage.clear(); document.body.innerHTML = ''; });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); delete (document.documentElement as { requestFullscreen?: unknown }).requestFullscreen; });

  it('asks first (R21 P10): a tap alone never goes full screen; ⛶ 全屏 does; leaving or 不用了 is remembered', async () => {
    vi.stubGlobal('matchMedia', mm(true));
    const req = vi.fn(() => Promise.resolve());
    (document.documentElement as { requestFullscreen?: unknown }).requestFullscreen = req;
    vi.useFakeTimers();
    const fs = await import('../../src/boot/fs');
    expect(fs.canFS()).toBe(true);
    fs.installFS();
    document.body.innerHTML = '<button id="b">x</button>';
    document.getElementById('b')!.click();
    expect(req).not.toHaveBeenCalled();           // no silent first-tap full screen any more
    await vi.advanceTimersByTimeAsync(4100);
    vi.useRealTimers();
    await vi.waitFor(() => expect(document.getElementById('siFsAsk')).not.toBeNull());
    expect(document.getElementById('siFsAsk')!.textContent).toMatch(/全屏|full screen/i);
    document.querySelector<HTMLElement>('#siFsAsk [data-fs=yes]')!.click();
    expect(req).toHaveBeenCalledTimes(1);
    expect(document.getElementById('siFsAsk')).toBeNull();
    // reader leaves full screen → remembered
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => document.documentElement });
    document.dispatchEvent(new Event('fullscreenchange'));
    expect(document.documentElement.classList.contains('is-fs')).toBe(true);
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => null });
    document.dispatchEvent(new Event('fullscreenchange'));
    expect(document.documentElement.classList.contains('is-fs')).toBe(false);
    expect(localStorage.getItem('si.fs')).toBe('0');
  });
  it('不用了 is remembered: never asked again', async () => {
    vi.stubGlobal('matchMedia', mm(true));
    const req = vi.fn(() => Promise.resolve());
    (document.documentElement as { requestFullscreen?: unknown }).requestFullscreen = req;
    const a = await import('../../src/boot/a2hs');
    a.askFS(req);
    document.querySelector<HTMLElement>('#siFsAsk [data-fs=no]')!.click();
    expect(req).not.toHaveBeenCalled();
    expect(localStorage.getItem('si.fs')).toBe('0');
    vi.useFakeTimers();
    vi.resetModules();
    (await import('../../src/boot/fs')).installFS();
    await vi.advanceTimersByTimeAsync(5000);
    expect(document.getElementById('siFsAsk')).toBeNull();
  });
  it('no auto full screen with a mouse', async () => {
    vi.stubGlobal('matchMedia', mm(false));
    const req = vi.fn(() => Promise.resolve());
    (document.documentElement as { requestFullscreen?: unknown }).requestFullscreen = req;
    (await import('../../src/boot/fs')).installFS();
    document.body.click();
    expect(req).not.toHaveBeenCalled();
  });
  it('without the API: the tip once (zh/en, dismissible); never when installed', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', mm(true));
    const fs = await import('../../src/boot/fs');
    expect(fs.canFS()).toBe(false);
    const a = await import('../../src/boot/a2hs');
    const { useApp } = await import('../../src/store/app');   // the instance the fresh chunk sees
    useApp.setState({ lang: 'zh' });
    a.showTip(true);
    const tip = document.getElementById('siA2hs')!;
    expect(tip.textContent).toContain('添加到主屏幕后可全屏打开');
    expect(tip.textContent).toContain('Safari');
    useApp.setState({ lang: 'en' });
    expect(tip.textContent).toContain('Add to Home Screen to open it full screen');
    (tip.querySelector('button') as HTMLButtonElement).click();
    expect(document.getElementById('siA2hs')).toBeNull();
    a.showTip(true);
    expect(document.getElementById('siA2hs')).toBeNull();     // one time
    a.showTip(true, true);                                      // ⛶ tapped: shown on request
    expect(document.getElementById('siA2hs')).not.toBeNull();
    vi.advanceTimersByTime(15001);
    expect(document.getElementById('siA2hs')).toBeNull();
  });
  it('installFS schedules the tip only outside WeChat / installed apps', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', mm(true, true));
    (await import('../../src/boot/fs')).installFS();
    await vi.advanceTimersByTimeAsync(5000);
    expect(localStorage.getItem('si.a2hs')).toBeNull();
  });

});

describe('R16 PWA manifest + meta', () => {
  it('display fullscreen → standalone, scope / start_url resolve to /SI/, icons exist', () => {
    const m = JSON.parse(readFileSync(join(web, 'public/manifest.webmanifest'), 'utf8'));
    expect(m.display).toBe('fullscreen');
    expect(m.display_override).toEqual(['fullscreen', 'standalone']);
    const base = 'https://superjackman.github.io/SI/manifest.webmanifest';
    expect(new URL(m.start_url, base).href).toBe('https://superjackman.github.io/SI/');
    expect(new URL(m.scope, base).href).toBe('https://superjackman.github.io/SI/');
    expect(m.theme_color).toBe('#0b1230'); // R42: dark, matches the app and the icons
    expect(m.background_color).toBe('#0b1230');
    for (const i of m.icons) expect(readFileSync(join(web, 'public', i.src)).subarray(1, 4).toString()).toBe('PNG');
    expect(m.icons.some((i: { purpose: string }) => i.purpose === 'maskable')).toBe(true);
    const html = readFileSync(join(web, 'index.html'), 'utf8');
    for (const s of ['rel="manifest"', 'apple-mobile-web-app-capable', 'apple-mobile-web-app-status-bar-style', 'apple-touch-icon', 'viewport-fit=cover']) expect(html).toContain(s);
  });
});
