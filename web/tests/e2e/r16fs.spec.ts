/* R16 (t73u): (A) full screen — PWA manifest + meta, ⛶ in the ☰ menu (toggles where the API exists, otherwise the
   add-to-home-screen tip), one-time tip on iPhone (never in WeChat); (B) the phone's own swipe actions — overscroll /
   touch-action CSS, the iOS edge guard only prevents touchstart in the outer 20 px of <main>, vertical scrolling and
   the in-app station swipe still work. */
import { test, expect, type Page } from '@playwright/test';

type Lang = 'zh' | 'en';
const ready = (page: Page, S: string, lang: Lang) => page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached', timeout: 15_000 });
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const KEEP = 'a,button,label,summary,[role=button],[contenteditable],[tabindex],.m-dg,.m-stage,input,textarea,select,canvas,.tscroll,.hm-wrap,.scroll,pre,table,.chips,.m-tabs,.sheet,#tour,#modal,.toks,.experts,.frames,[data-noswipe]';
const WX_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.49(0x18003129) NetType/WIFI Language/zh_CN';
/** iPhone Safari has no page Fullscreen API: emulate that on Chromium */
const noFS = () => { delete (Element.prototype as { requestFullscreen?: unknown }).requestFullscreen; delete (Element.prototype as { webkitRequestFullscreen?: unknown }).webkitRequestFullscreen; };

async function touch(page: Page, pts: [number, number][], ms = 160) {
  const c = await page.context().newCDPSession(page);
  const [x0, y0] = pts[0]!;
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
  for (const [x, y] of pts.slice(1)) { await page.waitForTimeout(ms / pts.length); await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }); }
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await c.detach();
}

test.describe('(B) phone swipe gestures', () => {
  test('CSS: no overscroll on html/body/scrollers, main pan-y, sliders own their drag', async ({ page }) => {
    await page.goto('./?lang=zh#T5'); await ready(page, 'T5', 'zh');
    const css = await page.evaluate(() => {
      const g = (s: string) => { const e = document.querySelector(s); return e ? getComputedStyle(e) : null; };
      return {
        html: g('html')!.overscrollBehaviorX + '/' + g('html')!.overscrollBehaviorY, body: g('body')!.overscrollBehaviorX + '/' + g('body')!.overscrollBehaviorY,
        main: g('main')!.touchAction, chips: g('.chips')?.overscrollBehaviorX, range: g('input[type=range]')?.touchAction,
        minH: g('body')!.minHeight,
      };
    });
    expect(css.html).toBe('none/none'); expect(css.body).toBe('none/none');
    expect(css.main).toBe('pan-y pinch-zoom');
    expect(css.chips).toBe('none');
    if (css.range) expect(css.range).toBe('none');
    expect(parseFloat(css.minH)).toBeGreaterThan(300);
  });

  test('Android: no edge guard at all (vertical scroll from the very edge works)', async ({ page }) => {
    await page.goto('./?lang=zh#T3'); await ready(page, 'T3', 'zh');
    await page.evaluate(() => { const w = window as unknown as { __tp: boolean[] }; w.__tp = []; document.addEventListener('touchstart', (e) => w.__tp.push(e.defaultPrevented), { passive: true }); });
    await touch(page, Array.from({ length: 11 }, (_, i) => [3, 560 - i * 30] as [number, number]), 200);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(150);
    expect(await page.evaluate(() => (window as unknown as { __tp: boolean[] }).__tp)).toEqual([false]);
  });

  test.describe('iPhone UA', () => {
    test.use({ userAgent: IPHONE });
    test('touchstart is prevented only in the outer 20 px; taps, vertical scroll and the station swipe still work', async ({ page }) => {
      await page.goto('./?lang=zh#T3'); await ready(page, 'T3', 'zh');
      await page.evaluate(() => { const w = window as unknown as { __tp: [number, boolean][] }; w.__tp = []; document.addEventListener('touchstart', (e) => w.__tp.push([Math.round(e.touches[0]!.clientX), e.defaultPrevented]), { passive: true }); });
      // a plain paragraph row (not a diagram / scroller: those keep their own gestures and are not guarded)
      const row = () => page.evaluate((keep) => { for (const p of document.querySelectorAll<HTMLElement>('main p')) { const r = p.getBoundingClientRect(); if (r.height < 40 || p.closest(keep)) continue; scrollTo(0, scrollY + r.top - 200); const q = p.getBoundingClientRect(); const e = document.elementFromPoint(4, q.top + 20); if (e && !e.closest(keep)) return Math.round(q.top + 20); } return -1; }, KEEP);
      const y = await row();
      expect(y).toBeGreaterThan(0);
      const W = page.viewportSize()!.width;
      for (const x of [4, W - 4, 30, Math.round(W / 2), W - 30]) await page.touchscreen.tap(x, y);
      const got = await page.evaluate(() => (window as unknown as { __tp: [number, boolean][] }).__tp);
      expect(got).toEqual([[4, true], [W - 4, true], [30, false], [Math.round(W / 2), false], [W - 30, false]]);
      // a tap on a button at the edge strip is never blocked (the ☰ is in the header, outside <main>, anyway)
      await page.locator('#mMenu').tap(); await expect(page.locator('#mDrawer')).toHaveClass(/open/);
      await page.keyboard.press('Escape'); await expect(page.locator('#mDrawer')).not.toHaveClass(/open/);
      // vertical scroll from the middle
      await page.evaluate(() => scrollTo(0, 0));
      await touch(page, Array.from({ length: 11 }, (_, i) => [Math.round(W / 2), 560 - i * 30] as [number, number]), 200);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(150);
      // the app's own swipe is still the one that answers left/right
      const y2 = await row();
      await touch(page, [[W - 60, y2], [W - 120, y2 + 2], [W - 200, y2 + 4], [W - 260, y2 + 5]]);
      await expect.poll(() => page.evaluate(() => (window as unknown as { __si: { state(): { station: string } } }).__si.state().station)).not.toBe('T3');
      expect(page.url()).not.toContain('#T3');
    });
  });
});

test.describe('(A) full screen', () => {
  test('manifest + meta: display fullscreen → standalone, scope and start_url /SI/, icons served', async ({ page, request }) => {
    await page.goto('./?lang=zh#T1'); await ready(page, 'T1', 'zh');
    const href = await page.locator('link[rel=manifest]').evaluate((l) => (l as HTMLLinkElement).href);
    const m = await (await request.get(href)).json();
    expect(m.display).toBe('fullscreen'); expect(m.display_override).toEqual(['fullscreen', 'standalone']);
    const base = new URL('./', page.url()).href;
    expect(new URL(m.start_url, href).href).toBe(base); expect(new URL(m.scope, href).href).toBe(base);
    expect(new URL(base).pathname).toMatch(/\/$/);
    for (const i of m.icons) expect((await request.get(new URL(i.src, href).href)).headers()['content-type']).toContain('image/png');
    expect((await request.get(new URL('icon-180.png', base).href)).ok()).toBe(true);
    expect(await page.locator('meta[name=apple-mobile-web-app-capable]').getAttribute('content')).toBe('yes');
    expect(await page.locator('meta[name=apple-mobile-web-app-status-bar-style]').getAttribute('content')).toBe('black-translucent');
    expect(await page.locator('meta[name=viewport]').getAttribute('content')).toContain('viewport-fit=cover');
    expect(await page.evaluate(() => 'serviceWorker' in navigator ? navigator.serviceWorker.getRegistrations().then((r) => r.length) : 0)).toBe(0);
  });

  for (const lang of ['zh', 'en'] as const) test(`⛶ in the ☰ menu toggles full screen and exits cleanly (${lang})`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() => localStorage.setItem('si.fs', '0'));   // no auto full screen in this test
    await page.goto(`./?lang=${lang}#T2`); await ready(page, 'T2', lang);
    await page.locator('#mMenu').tap();
    const b = page.locator('#fsBtn');
    await expect(b).toBeVisible();
    await expect(b).toHaveAttribute('aria-label', lang === 'zh' ? '全屏' : 'Full screen');
    const head = await page.locator('.dw-head').evaluate((h) => { const r = h.getBoundingClientRect(); return [...h.children].every((c) => { const q = c.getBoundingClientRect(); return q.right <= r.right + 0.5 && q.left >= r.left - 0.5; }); });
    expect(head).toBe(true);
    await b.tap();
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
    await expect(page.locator('html')).toHaveClass(/is-fs/);
    await expect(page.locator('#mDrawer')).not.toHaveClass(/open/);
    await page.locator('#mMenu').tap();
    await expect(b).toHaveAttribute('aria-pressed', 'true');
    await expect(b).toHaveAttribute('aria-label', lang === 'zh' ? '退出全屏' : 'Exit full screen');
    await b.tap();
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
    await expect(page.locator('html')).not.toHaveClass(/is-fs/);
    await expect(page.locator('#mDrawer')).not.toHaveClass(/open/);
    await page.locator('#mMenu').tap();   // the button is stateless; it re-reads the state when the drawer opens
    await expect(b).toHaveAttribute('aria-pressed', 'false');
    await expect(b).toHaveAttribute('aria-label', lang === 'zh' ? '全屏' : 'Full screen');
    expect(await page.evaluate(() => localStorage.getItem('si.fs'))).toBe('0');
    expect(errors).toEqual([]);
  });

  /* R21 (P10): no silent full screen any more — a small card asks first; "full screen" enters it, "no thanks" or leaving
     full screen means never again */
  for (const lang of ['zh', 'en'] as Lang[]) test(`asks before going full screen; yes enters, no thanks / leaving it stops asking (${lang})`, async ({ page }) => {
    await page.goto(`./?lang=${lang}#T3`); await ready(page, 'T3', lang);
    await page.locator('main p').first().tap();
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => !!document.fullscreenElement)).toBe(false);   // a tap alone does nothing
    const ask = page.locator('#siFsAsk');
    await expect(ask).toBeVisible({ timeout: 9000 });
    await expect(ask).toContainText(lang === 'zh' ? '要全屏看吗？' : 'Go full screen?');
    expect(await ask.evaluate((t) => { const r = t.getBoundingClientRect(), b = document.querySelector('#bnav')?.getBoundingClientRect(); return r.left >= 0 && r.right <= document.documentElement.clientWidth && (!b || r.bottom <= b.top + 0.5); })).toBe(true);
    await ask.locator('[data-fs="yes"]').tap();
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
    await expect(page.locator('html')).toHaveClass(/is-fs/);
    await page.evaluate(() => document.exitFullscreen());
    await expect.poll(() => page.evaluate(() => localStorage.getItem('si.fs'))).toBe('0');
    await page.reload(); await ready(page, 'T3', lang); await page.waitForTimeout(5000);
    await expect(ask).toHaveCount(0);
    // "no thanks" on a fresh profile
    await page.evaluate(() => localStorage.removeItem('si.fs'));
    await page.reload(); await ready(page, 'T3', lang);
    await expect(ask).toBeVisible({ timeout: 9000 });
    await ask.locator('[data-fs="no"]').tap();
    await expect(ask).toHaveCount(0);
    expect(await page.evaluate(() => [!!document.fullscreenElement, localStorage.getItem('si.fs')])).toEqual([false, '0']);
  });

  test.describe('first visit', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('the full-screen question waits while first-visit help (welcome card / coach marks) is on screen', async ({ page }) => {
    await page.goto('./?lang=zh#T1'); await ready(page, 'T1', 'zh');
    await expect(page.locator('section.level.active .ob-wel')).toBeVisible({ timeout: 9000 });
    await page.waitForTimeout(5500);
    await expect(page.locator('#siFsAsk')).toHaveCount(0);           // not on top of the welcome card
    await page.locator('[data-ob="onb-x"]').click();                // → coach marks
    await page.locator('[data-ob="coach-skip"]').click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => { for (const e of document.querySelectorAll('.ob-bub')) e.remove(); });
    await expect(page.locator('#siFsAsk')).toBeVisible({ timeout: 12000 });
  });
  });

  test.describe('iPhone (no Fullscreen API)', () => {
    test.use({ userAgent: IPHONE });
    for (const lang of ['zh', 'en'] as const) test(`one-time add-to-home-screen tip, dismissible; ⛶ shows it again (${lang})`, async ({ page }) => {
      await page.addInitScript(noFS);
      await page.goto(`./?lang=${lang}#T1`); await ready(page, 'T1', lang);
      const tip = page.locator('#siA2hs');
      await expect(tip).toBeVisible({ timeout: 9000 });
      await expect(tip).toContainText(lang === 'zh' ? '添加到主屏幕后可全屏打开' : 'Add to Home Screen to open it full screen');
      const fit = await tip.evaluate((t) => { const r = t.getBoundingClientRect(); return r.left >= 0 && r.right <= document.documentElement.clientWidth; });
      expect(fit).toBe(true);
      await tip.locator('button').tap(); await expect(tip).toHaveCount(0);
      await page.reload(); await ready(page, 'T1', lang); await page.waitForTimeout(5000);
      await expect(tip).toHaveCount(0);
      await page.locator('#mMenu').tap(); await page.locator('#fsBtn').tap();
      await expect(tip).toBeVisible();
      expect(await page.evaluate(() => !!document.fullscreenElement)).toBe(false);
    });
  });
  test.describe('WeChat on iPhone', () => {
    test.use({ userAgent: WX_IOS });
    test('no tip and no auto full screen inside WeChat', async ({ page }) => {
      await page.addInitScript(noFS);
      await page.goto('./?lang=zh#T1'); await ready(page, 'T1', 'zh');
      await page.waitForTimeout(5500);
      await expect(page.locator('#siA2hs')).toHaveCount(0);
    });
  });
});
