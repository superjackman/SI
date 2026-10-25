/* R16: (1) stale cache — version.json checked at idle after content shows: a fresh, untouched page reloads ONCE to the
   new build (hash + lang kept), a later mismatch only shows the banner; the real (matching) version.json does nothing.
   (2) share the current page — header share icon (R17; was a crumb button), lazy panel with system share / channels / WeChat / QR / copy, links carry
   the station (and the card in view) and ?lang, WeChat UA gets the ··· hint, layouts fit at 360/390/430 in zh and en. */
import { test, expect, type Page, type Route } from '@playwright/test';
import { resolveBase } from '../../base.config.mjs';

type Lang = 'zh' | 'en';
const BASE: string = resolveBase();
const REPO = process.env.SI_E2E_SERVE === 'repo' && BASE === '/SI/';
const ready = (page: Page, S: string, lang: Lang) => page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached', timeout: 15_000 });
const vjson = (id: string) => (r: Route) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'cache-control': 'no-store' }, body: JSON.stringify({ id }) });
const overflow = (page: Page, sel: string) => page.evaluate((sel) => {
  const cw = document.documentElement.clientWidth, bad: string[] = [];
  for (const e of document.querySelectorAll<HTMLElement>(sel)) {
    if (!e.getClientRects().length) continue;
    const r = e.getBoundingClientRect();
    if (r.right > cw + 0.5 || r.left < -0.5) bad.push('out:' + e.className + ':' + (e.textContent ?? '').slice(0, 20));
    if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX === 'visible') bad.push('clip:' + e.className + ':' + (e.textContent ?? '').slice(0, 20));
  }
  return bad;
}, sel);

test.describe('stale cache: version.json', () => {
  test('mismatch on a fresh, untouched page → exactly one reload (hash + ?lang kept, ?v=<id>), then the banner', async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
    let navs = 0; page.on('load', () => navs++); // full document loads only (hash / replaceState changes do not count)
    const asked: string[] = [];
    await page.route('**/version.json*', (r) => { asked.push(r.request().url()); return vjson('e2e-new-build')(r); });
    await page.goto('./?lang=en#T3'); await ready(page, 'T3', 'en');
    await page.waitForURL(/[?&]v=e2e-new-build/, { timeout: 10_000 });
    await ready(page, 'T3', 'en');
    const u = new URL(page.url());
    expect(u.hash).toBe('#T3');
    expect(u.searchParams.get('lang')).toBe('en');
    expect(u.searchParams.get('_r')).toBeNull(); // the stale guard cleaned the bust token again
    await expect(page.locator('#siUpd .upd-go')).toHaveText('A new version is available, tap to refresh', { timeout: 10_000 });
    await page.waitForTimeout(1500);
    expect(navs).toBe(2); // first load + the one reload, no loop
    expect(asked.length).toBe(2);
    expect(asked.every((a) => /version\.json\?t=\d+$/.test(a))).toBe(true);
    expect(await page.evaluate(() => sessionStorage.getItem('si.vreload'))).toBe('e2e-new-build');
    expect(errors).toEqual([]);
  });

  test('a mismatch after the reader has started (touched) only shows the zh banner; tapping it reloads', async ({ page }) => {
    let open!: () => void; const gate = new Promise<void>((r) => { open = r; });
    await page.route('**/version.json*', async (r) => { await gate; return vjson('e2e-later')(r); });
    await page.goto('./?lang=zh#T2'); await ready(page, 'T2', 'zh');
    await page.locator('section.level.active .pagehead').tap();
    open();
    const b = page.locator('#siUpd');
    await expect(b.locator('.upd-go')).toHaveText('有新版本，点此刷新', { timeout: 10_000 });
    expect(new URL(page.url()).searchParams.get('v')).toBeNull(); // not reloaded
    const box = (await b.boundingBox())!, vw = page.viewportSize()!.width;
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(vw);
    expect(box.height).toBeLessThan(48); // one line (two lines ≈ 56 px): nothing squeezed
    await Promise.all([page.waitForURL(/[?&]v=e2e-later/), b.locator('.upd-go').tap()]);
    expect(new URL(page.url()).hash).toBe('#T2');
  });

  test('the real version.json matches the bundle: no reload, no banner, no errors (local preview)', async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    const got: number[] = []; page.on('response', (r) => { if (r.url().includes('version.json')) got.push(r.status()); });
    await page.goto('./?lang=zh#T1'); await ready(page, 'T1', 'zh');
    await expect.poll(() => got.length, { timeout: 8000 }).toBe(1);
    expect(got[0]).toBe(200);
    await page.waitForTimeout(1500);
    expect(new URL(page.url()).searchParams.get('v')).toBeNull();
    await expect(page.locator('#siUpd')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('missing version.json (404) is ignored silently', async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/version.json*', (r) => r.fulfill({ status: 404, body: 'nope' }));
    await page.goto('./#T1'); await ready(page, 'T1', 'zh');
    await page.waitForTimeout(2000);
    await expect(page.locator('#siUpd')).toHaveCount(0);
    expect(new URL(page.url()).searchParams.get('v')).toBeNull();
    expect(errors).toEqual([]);
  });
});

test.describe('share the current page', () => {
  test('first load does not fetch the share panel / QR encoder; the header share icon does, and fits', async ({ page }) => {
    const js: string[] = []; page.on('request', (r) => { if (/\.(js|css)$/.test(r.url())) js.push(r.url()); });
    for (const lang of ['zh', 'en'] as Lang[]) {
      await page.goto(`./?lang=${lang}#K3`); await ready(page, 'K3', lang);
      const btn = page.getByRole('button', { name: lang === 'zh' ? '分享本页' : 'Share this page', exact: true }).first();
      await expect(btn).toBeVisible();
      await expect(btn).toHaveId('mShare');
      const b = (await btn.boundingBox())!, vw = page.viewportSize()!.width;
      expect(b.x + b.width).toBeLessThanOrEqual(vw); expect(b.height).toBeGreaterThanOrEqual(40); expect(b.width).toBeGreaterThanOrEqual(40);
      expect(await page.locator('#crumb .cb-share').count()).toBe(0); // R17: the crumb text button is gone
      expect(await overflow(page, '#topbar .tb-t, #topbar h1')).toEqual([]);
    }
    expect(js.filter((u) => /\/panel-/.test(u))).toEqual([]);
    await page.locator('#mShare').tap();
    await expect(page.locator('#sharePanel')).toBeVisible();
    expect(js.filter((u) => /\/panel-/.test(u)).length).toBeGreaterThanOrEqual(1);
  });

  for (const lang of ['zh', 'en'] as Lang[]) {
    test(`${lang}: panel links share this stop with ?lang, QR + save, copy → toast, Escape closes, nothing squeezed`, async ({ page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
      await page.goto(`./?v=old&lang=${lang}#T4`); await ready(page, 'T4', lang);
      await page.locator('#mShare').tap();
      const p = page.locator('#sharePanel');
      await expect(p).toBeVisible();
      await expect(p.locator('.sp-head b')).toHaveText(lang === 'zh' ? '分享本页' : 'Share this page');
      const origin = new URL(page.url()).origin;
      /* R19: every link carries its source tag: ?lang=…&from=<channel>#T4 (the incoming ?v= is dropped) */
      const want = (ch: string) => `${origin}${BASE}?lang=${lang}&from=${ch}#T4`;
      await expect(p.locator('.sp-copy input')).toHaveValue(want('copy'));
      const href = async (ch: string) => (await p.locator(`[data-share-ch="${ch}"]`).getAttribute('href'))!;
      const e = (ch: string) => encodeURIComponent(want(ch));
      expect(await href('weibo')).toContain(`service.weibo.com/share/share.php?url=${e('weibo')}&title=`);
      expect(await href('qq')).toContain(`connect.qq.com/widget/shareqq/index.html?url=${e('qq')}`);
      expect(await href('qzone')).toContain(`sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${e('qzone')}`);
      expect(await href('x')).toMatch(new RegExp(`^https://x\\.com/intent/tweet\\?text=.+&url=${e('x').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
      expect(new URL(await href('facebook')).searchParams.get('u')).toBe(want('facebook'));
      expect(new URL(await href('telegram')).searchParams.get('url')).toBe(want('telegram'));
      expect(new URL(await href('linkedin')).searchParams.get('url')).toBe(want('linkedin'));
      expect(new URL(await href('whatsapp')).searchParams.get('text')).toContain(want('whatsapp'));
      expect(await href('email')).toMatch(/^mailto:\?subject=/);
      expect(await p.locator('a[data-share-ch][target="_blank"]').evaluateAll((a) => a.every((x) => (x as HTMLAnchorElement).rel.includes('noopener')))).toBe(true);
      /* QR: a local data: PNG with the caption; "save image" downloads it */
      const qr = p.locator('img.sp-qr');
      await expect(qr).toBeVisible();
      expect(await qr.getAttribute('src')).toMatch(/^data:image\/png;base64,/);
      await expect(p.locator('.sp-cap')).toContainText(lang === 'zh' ? '用微信「扫一扫」' : 'Scan this code with WeChat');
      expect(await p.locator('.sp-save').getAttribute('download')).toBe('SI-T4-qr.png');
      /* tapping "WeChat" in the grid highlights the QR block */
      await p.locator('[data-act="wx"]').tap();
      await expect(p.locator('#spWx')).toHaveClass(/flash/);
      /* fits: nothing outside the panel or clipped */
      const pb = (await p.boundingBox())!, vw = page.viewportSize()!.width;
      expect(pb.x).toBeGreaterThanOrEqual(0); expect(pb.x + pb.width).toBeLessThanOrEqual(vw);
      expect(await overflow(page, '#sharePanel .sp-ch span, #sharePanel .sp-cp, #sharePanel .sp-sys, #sharePanel .sp-card, #sharePanel .sp-head b, #sharePanel .sp-what, #sharePanel .sp-cap, #sharePanel .sp-save')).toEqual([]);
      expect(await p.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      const spans = await p.locator('.sp-ch span').evaluateAll((s) => s.map((x) => x.getBoundingClientRect().height));
      expect(Math.max(...spans)).toBeLessThan(34); // at most two short lines
      /* copy */
      await p.locator('.sp-cp').tap();
      await expect(page.locator('#toast')).toHaveText(lang === 'zh' ? '✅ 链接已复制' : '✅ Link copied');
      const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
      if (clip) expect(clip).toBe(want('copy'));
      /* close */
      await page.keyboard.press('Escape');
      await expect(p).toHaveCount(0);
      await page.locator('#mShare').tap(); await expect(page.locator('#sharePanel')).toBeVisible();
      await page.locator('#shareMask').click({ position: { x: 10, y: 10 } });
      await expect(page.locator('#sharePanel')).toHaveCount(0);
    });
  }

  test('scrolled down: the link carries the card in view, and opening it lands on that card', async ({ page, browser }) => {
    await page.goto('./?lang=zh#T1'); await ready(page, 'T1', 'zh');
    await page.locator('section.level.active[data-late]').waitFor({ state: 'attached' }); /* R27: late blocks in first, so nothing shifts after the scroll */
    const id = await page.evaluate(() => {
      const cs = [...document.querySelectorAll<HTMLElement>('section#T1 .card[id]')].filter((c) => !c.parentElement?.closest('.card') && c.getClientRects().length);
      const c = cs[Math.min(3, cs.length - 1)]!; window.scrollTo(0, c.getBoundingClientRect().top + window.pageYOffset - 80); return c.id;
    });
    await page.waitForTimeout(300);
    await page.evaluate(() => (document.getElementById('mShare') as HTMLButtonElement).click()); // crumb may be scrolled off; the header ⤴ is always there
    const v = await page.locator('#sharePanel .sp-copy input').inputValue();
    expect(v).toMatch(new RegExp(`\\?lang=zh&from=copy#T1/${id}$`));
    const p2 = await browser.newPage({ viewport: page.viewportSize()! });
    try {
      await p2.goto(v); await ready(p2, 'T1', 'zh');
      await expect.poll(() => p2.evaluate((id) => { const r = document.getElementById(id)!.getBoundingClientRect(); return r.top > -5 && r.top < innerHeight / 2; }, id), { timeout: 8000 }).toBe(true);
    } finally { await p2.close(); }
  });

  test('share stays reachable when the page is scrolled far down (R22: the header ⤴; the old More-sheet entry is gone)', async ({ page }) => {
    await page.goto('./?lang=en#K2'); await ready(page, 'K2', 'en');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await expect(page.locator('#mShare')).toBeInViewport();
    await page.locator('#mShare').tap();
    await expect(page.locator('#sharePanel .sp-head b')).toHaveText('Share this page');
  });

  test('inside WeChat (simulated UA): the ··· hint, QR still there, no system-share assumptions', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3, locale: 'zh-CN',
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.193 Mobile Safari/537.36 XWEB/1220067 MMWEBSDK/20240404 MMWEBID/1234 MicroMessenger/8.0.49.2600(0x28003133) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64',
    });
    try {
      const page = await ctx.newPage();
      await page.goto('./#T3'); await ready(page, 'T3', 'zh');
      await page.locator('#mShare').tap();
      const h = page.locator('#spWxHint');
      await expect(h).toBeVisible();
      await expect(h).toContainText('点右上角「···」');
      await expect(page.locator('#sharePanel img.sp-qr')).toBeVisible();
      await expect(page.locator('#sharePanel .sp-cap')).toContainText('长按二维码');
    } finally { await ctx.close(); }
  });

  test('without WeChat: no ··· hint', async ({ page }) => {
    await page.goto('./#T3'); await ready(page, 'T3', 'zh');
    await page.locator('#mShare').tap();
    await expect(page.locator('#sharePanel')).toBeVisible();
    await expect(page.locator('#spWxHint')).toHaveCount(0);
  });

  test('analytics: evt-share-<channel> once per channel (intercepted, not sent)', async ({ playwright }) => {
    test.skip(!REPO, 'needs SI_TARGET=root SI_E2E_SERVE=repo');
    const GC = 'https://superjackman-si.goatcounter.com/count';
    const b = await playwright.chromium.launch({ channel: 'chrome', args: ['--host-resolver-rules=MAP si.test 127.0.0.1'] });
    try {
      const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      const hits: string[] = [];
      await ctx.route(GC + '**', (r) => { hits.push(r.request().url()); return r.fulfill({ status: 200, contentType: 'image/gif', body: Buffer.from('R0lGODlhAQABAAAAACw=', 'base64') }); });
      await ctx.route((u) => u.hostname !== 'si.test' && !u.href.startsWith(GC), (r) => r.abort());
      const p = await ctx.newPage();
      await p.goto(`http://si.test:4173${BASE}?lang=zh#T3`);
      await p.locator('html[data-si-ready="T3.zh"]').waitFor({ state: 'attached', timeout: 15_000 });
      await expect.poll(() => hits.length).toBe(1);
      await p.locator('#mShare').tap();
      await p.locator('#sharePanel .sp-cp').tap();
      await p.locator('#sharePanel .sp-cp').tap();
      await p.locator('#sharePanel [data-share-ch="weibo"]').evaluate((a) => a.addEventListener('click', (e) => e.preventDefault()));
      await p.locator('#sharePanel [data-share-ch="weibo"]').click();
      await expect.poll(() => hits.length).toBe(3);
      await p.waitForTimeout(500);
      expect(hits.slice(1).map((h) => new URL(h).searchParams.get('p'))).toEqual(['evt-share-copy', 'evt-share-weibo']);
    } finally { await b.close(); }
  });
});
