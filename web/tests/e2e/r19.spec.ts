/* R19: "finished this stop → make a share image". A 生成分享图 / Make share image button at the end of each of the 22 stops
   (hand-off block) and in the share panel opens a lazy sheet with a 1080×1350 card drawn locally on a canvas (site name,
   "I just learned: <stop>", a one-line plain takeaway, a local QR of the stop's link with from=card, the link as text);
   save (download; long-press hint for iPhone / WeChat) and system share with the file where supported. Every shared link
   carries from=<channel>; ?from=… on landing never breaks the router, ?lang or ?v. */
import { test, expect, type Page } from '@playwright/test';
import jsQR from 'jsqr';
import { resolveBase } from '../../base.config.mjs';

type Lang = 'zh' | 'en';
const BASE: string = resolveBase();
const REPO = process.env.SI_E2E_SERVE === 'repo' && BASE === '/SI/';
const ORDER = ['T1', 'U', 'Ua', 'Ub', 'Uc', 'Ud', 'Up', 'T2', 'T3', 'N', 'T4', 'T4a', 'T4b', 'T5', 'T6', 'T7', 'T8', 'K1', 'K2', 'K3', 'K4', 'K5'];
const ready = (page: Page, S: string, lang: Lang) => page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached', timeout: 15_000 });
const btn = (page: Page) => page.locator('section.level.active .m-pn .pn-card');
const label = (lang: Lang) => (lang === 'zh' ? '生成分享图' : 'Make share image');
async function openFromEnd(page: Page) {
  const b = btn(page); await b.scrollIntoViewIfNeeded(); await b.click();
  const img = page.locator('#cardPanel img.cp-img'); await img.waitFor({ state: 'visible', timeout: 10_000 });
  return img;
}
/** decode the QR on the card image (the region from data-qr) with jsQR */
async function qrText(page: Page): Promise<string | null> {
  const px = await page.locator('#cardPanel img.cp-img').evaluate(async (im: HTMLImageElement) => {
    await im.decode(); const [x, y, s] = im.dataset.qr!.split(',').map(Number) as [number, number, number], m = 24;
    const c = document.createElement('canvas'); c.width = c.height = s + 2 * m; const g = c.getContext('2d')!;
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, x - m, y - m, s + 2 * m, s + 2 * m, 0, 0, s + 2 * m, s + 2 * m);
    return { w: c.width, d: Array.from(g.getImageData(0, 0, c.width, c.width).data) };
  });
  return jsQR(Uint8ClampedArray.from(px.d), px.w, px.w)?.data ?? null;
}

test.beforeEach(async ({ page }) => { await page.addInitScript(() => localStorage.setItem('si.fs', '0')); });

for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang}: every stop ends with the share-image button; each card fits (name ≤ 3, takeaway ≤ 5 lines, text above the QR)`, async ({ page }) => {
    test.setTimeout(180_000);
    const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
    for (const S of ORDER) {
      await page.goto(`./?lang=${lang}#${S}`); await ready(page, S, lang);
      await expect(btn(page)).toHaveCount(1);
      await expect(btn(page)).toHaveText(label(lang));
      const img = await openFromEnd(page);
      expect(await img.evaluate((i: HTMLImageElement) => [i.naturalWidth, i.naturalHeight])).toEqual([1080, 1350]);
      expect(await img.getAttribute('data-fit'), `${S} ${lang} ${await img.getAttribute('data-lines')}`).toBe('1');
      expect(await page.locator('#cardPanel [data-act="save"]').getAttribute('download')).toBe(`SI-${S}-${lang}.png`);
      await page.keyboard.press('Escape');
      await expect(page.locator('#cardPanel')).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
}

test('the card chunk is not part of the first load; the button fetches it; QR = this stop with from=card', async ({ page }) => {
  const js: string[] = []; page.on('request', (r) => { if (/\/assets\/card-[\w-]+\.(js|css)$/.test(r.url())) js.push(r.url()); });
  await page.goto('./?lang=en#T4a'); await ready(page, 'T4a', 'en');
  await page.waitForTimeout(800);
  expect(js).toEqual([]);
  await openFromEnd(page);
  expect(js.some((u) => u.endsWith('.js'))).toBe(true);
  const origin = new URL(page.url()).origin;
  expect(await qrText(page)).toBe(`${origin}${BASE}?lang=en&from=card#T4a`);
  await expect(page.locator('#cardPanel .cp-head b')).toHaveText('Share image');
  expect(await page.locator('#cardPanel img.cp-img').getAttribute('alt')).toMatch(/^Share image: .+/);
});

test('zh K3: QR decodes, save downloads SI-K3-zh.png, ✕ and the mask close', async ({ page }) => {
  await page.goto('./?lang=zh#K3'); await ready(page, 'K3', 'zh');
  await openFromEnd(page);
  const origin = new URL(page.url()).origin;
  expect(await qrText(page)).toBe(`${origin}${BASE}?lang=zh&from=card#K3`);
  await expect(page.locator('#cardPanel .cp-hint')).toContainText('长按');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#cardPanel [data-act="save"]').click()]);
  expect(dl.suggestedFilename()).toBe('SI-K3-zh.png');
  await page.locator('#cardPanel .cp-x').click();
  await expect(page.locator('#cardPanel')).toHaveCount(0);
  await openFromEnd(page);
  await page.locator('#cardMask').click({ position: { x: 10, y: 10 } });
  await expect(page.locator('#cardPanel')).toHaveCount(0);
});

test('system share with the file where supported; a failure falls back to saving; cancel does nothing', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __shared: unknown[]; __mode: string };
    w.__shared = []; w.__mode = 'ok';
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: (d: { files?: File[] }) => !!d.files?.length });
    Object.defineProperty(navigator, 'share', { configurable: true, value: (d: { files: File[]; text?: string; url?: string; title?: string }) => {
      w.__shared.push({ name: d.files[0]!.name, type: d.files[0]!.type, size: d.files[0]!.size, text: d.text ?? '', url: d.url ?? '' });
      return w.__mode === 'ok' ? Promise.resolve() : Promise.reject(new DOMException('x', w.__mode));
    } });
  });
  await page.goto('./?lang=en#T3'); await ready(page, 'T3', 'en');
  await openFromEnd(page);
  const sh = page.locator('#cardPanel [data-act="share"]');
  await expect(sh).toBeVisible();
  await sh.click();
  const s = await page.evaluate(() => (window as unknown as { __shared: { name: string; type: string; size: number; text: string; url: string }[] }).__shared);
  expect(s.length).toBe(1);
  expect(s[0]!.name).toBe('SI-T3-en.png'); expect(s[0]!.type).toBe('image/png'); expect(s[0]!.size).toBeGreaterThan(20_000);
  expect(s[0]!.text + s[0]!.url).toContain('from=card');
  await page.evaluate(() => { (window as unknown as { __mode: string }).__mode = 'AbortError'; });
  if (await page.locator('#cardPanel').count() === 0) await openFromEnd(page);
  await page.locator('#cardPanel [data-act="share"]').click();
  await page.waitForTimeout(300);
  await page.evaluate(() => { (window as unknown as { __mode: string }).__mode = 'NotAllowedError'; });
  if (await page.locator('#cardPanel').count() === 0) await openFromEnd(page);
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }), page.locator('#cardPanel [data-act="share"]').click()]);
  expect(dl.suggestedFilename()).toBe('SI-T3-en.png');
});

test('no file sharing (desktop / old browsers): only Save, as the main button', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined }); });
  await page.goto('./?lang=zh#T2'); await ready(page, 'T2', 'zh');
  await openFromEnd(page);
  await expect(page.locator('#cardPanel [data-act="share"]')).toHaveCount(0);
  await expect(page.locator('#cardPanel [data-act="save"]')).toHaveClass(/pri/);
  await expect(page.locator('#cardPanel [data-act="save"]')).toHaveText('保存图片');
});

test('WeChat: long-press hint, no share button, save shows the hint instead of a dead download', async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3, locale: 'zh-CN',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.193 Mobile Safari/537.36 XWEB/1220067 MMWEBSDK/20240404 MMWEBID/1234 MicroMessenger/8.0.49.2600(0x28003133) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64',
  });
  try {
    const page = await ctx.newPage();
    await page.goto('./#T5'); await ready(page, 'T5', 'zh');
    const img = await openFromEnd(page);
    expect(await img.getAttribute('src')).toMatch(/^data:image\/png;base64,/); // long-press works on a data: image
    await expect(page.locator('#cardPanel .cp-hint')).toContainText('长按');
    await expect(page.locator('#cardPanel [data-act="share"]')).toHaveCount(0);
    let dls = 0; page.on('download', () => dls++);
    await page.locator('#cardPanel [data-act="save"]').tap();
    await expect(page.locator('#toast')).toContainText('长按');
    await page.waitForTimeout(500);
    expect(dls).toBe(0);
  } finally { await ctx.close(); }
});

test('share panel: the share-image button closes the panel and opens the card of this stop', async ({ page }) => {
  await page.goto('./?lang=en#K5'); await ready(page, 'K5', 'en');
  await page.locator('#mShare').tap();
  const b = page.locator('#sharePanel .sp-card');
  await expect(b).toHaveText('Make share image');
  await b.tap();
  await expect(page.locator('#sharePanel')).toHaveCount(0);
  await page.locator('#cardPanel img.cp-img').waitFor({ state: 'visible' });
  expect(await page.locator('#cardPanel [data-act="save"]').getAttribute('download')).toBe('SI-K5-en.png');
  const origin = new URL(page.url()).origin;
  expect(await qrText(page)).toBe(`${origin}${BASE}?lang=en&from=card#K5`);
});

for (const w of [360, 412, 430]) for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang} ${w}px: button and card sheet fit (≥ 44px tap target, nothing out of the screen or clipped)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: w === 360 ? 740 : 900 });
    for (const S of ['T1', 'T4b', 'K3']) {
      await page.goto(`./?lang=${lang}#${S}`); await ready(page, S, lang);
      const b = btn(page); await b.scrollIntoViewIfNeeded();
      const bb = (await b.boundingBox())!;
      expect(bb.height).toBeGreaterThanOrEqual(44); expect(bb.x).toBeGreaterThanOrEqual(0); expect(bb.x + bb.width).toBeLessThanOrEqual(w);
      expect(await b.evaluate((e) => e.scrollWidth <= e.clientWidth + 1 && e.getBoundingClientRect().height < 60)).toBe(true); // one line
      await openFromEnd(page);
      const r = await page.evaluate(() => {
        const cw = document.documentElement.clientWidth, ih = innerHeight, bad: string[] = [];
        for (const e of document.querySelectorAll<HTMLElement>('#cardPanel, #cardPanel .cp-img, #cardPanel .cp-b, #cardPanel .cp-hint, #cardPanel .cp-head b')) {
          const q = e.getBoundingClientRect();
          if (q.left < -0.5 || q.right > cw + 0.5 || q.bottom > ih + 0.5) bad.push('out:' + e.className);
          if (e.scrollWidth > e.clientWidth + 1) bad.push('clip:' + e.className);
        }
        const bs = [...document.querySelectorAll<HTMLElement>('#cardPanel .cp-b')].map((x) => x.getBoundingClientRect().height);
        return { bad, minB: Math.min(...bs) };
      });
      expect(r.bad).toEqual([]); expect(r.minB).toBeGreaterThanOrEqual(44);
      await page.keyboard.press('Escape');
    }
  });
}

test.describe('landing with a source tag', () => {
  /* posts may put the tag after the hash (#T3?from=zhihu): the route rewrite moves it before the hash instead of dropping it
     (on the live build analytics then records it and takes it out of the address bar; here, localhost, it stays) */
  for (const [h, S, want] of [['#T3?from=zhihu', 'T3', '?from=zhihu#T3'], ['#K2&from=xhs', 'K2', '?from=xhs#K2']] as const) {
    test(`${h} keeps the tag → ${want}`, async ({ page }) => {
      await page.goto(`./${h}`); await ready(page, S, 'zh');
      await expect.poll(() => new URL(page.url()).search + new URL(page.url()).hash).toBe(want);
    });
  }
  test('?lang=en&from=zhihu#T3 keeps from before the hash, lang and route', async ({ page }) => {
    await page.goto('./?lang=en&from=zhihu#T3'); await ready(page, 'T3', 'en');
    const u = new URL(page.url());
    expect(u.searchParams.get('from')).toBe('zhihu'); expect(u.searchParams.get('lang')).toBe('en'); expect(u.hash).toBe('#T3');
  });
  for (const [q, h, S, lang] of [['?from=zhihu', '#T3', 'T3', 'zh'], ['?from=xhs&lang=en', '#K1', 'K1', 'en'], ['?v=abc&from=v2ex&lang=en', '#T4a', 'T4a', 'en'], ['?lang=zh&from=bilibili', '#T5/labGradCheck', 'T5', 'zh'], ['?lang=en', '#T6&from=wechat', 'T6', 'en'], ['', '#from=card&T2', 'T2', 'zh']] as const) {
    test(`${q}${h} → ${S} ${lang}`, async ({ page }) => {
      const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(`./${q}${h}`); await ready(page, S, lang);
      expect(await page.locator('section.level.active').getAttribute('id')).toBe(S);
      /* arrows still route, the language toggle still works */
      await page.locator('#mNext').tap();
      await expect.poll(() => page.evaluate(() => (window as unknown as { __si: { state(): { station: string } } }).__si.state().station)).not.toBe(S);
      expect(errors).toEqual([]);
    });
  }
});

for (const [arrive, tag] of [['?lang=en&from=bilibili#T3', 'bilibili'], ['?lang=en#T3?from=zhihu', 'zhihu']] as const) test(`analytics: ${arrive} → campaign on the first page view, evt-from-${tag} once, address bar cleaned (intercepted)`, async ({ playwright }) => {
  test.skip(!REPO, 'needs SI_TARGET=root SI_E2E_SERVE=repo');
  const GC = 'https://superjackman-si.goatcounter.com/count';
  const b = await playwright.chromium.launch({ channel: 'chrome', args: ['--host-resolver-rules=MAP si.test 127.0.0.1'] });
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const hits: string[] = [];
    await ctx.route(GC + '**', (r) => { hits.push(r.request().url()); return r.fulfill({ status: 200, contentType: 'image/gif', body: Buffer.from('R0lGODlhAQABAAAAACw=', 'base64') }); });
    await ctx.route((u) => u.hostname !== 'si.test' && !u.href.startsWith(GC), (r) => r.abort());
    const p = await ctx.newPage();
    await p.goto(`http://si.test:4173${BASE}${arrive}`);
    await p.locator('html[data-si-ready="T3.en"]').waitFor({ state: 'attached', timeout: 15_000 });
    await expect.poll(() => hits.length).toBe(2);
    const u0 = new URL(hits[0]!), u1 = new URL(hits[1]!);
    expect(u0.searchParams.get('p')).toBe('/en/T3');
    expect(u0.searchParams.get('q')).toBe(`?campaign=${tag}&ref=${tag}`);
    expect(u1.searchParams.get('p')).toBe(`evt-from-${tag}`);
    const u = new URL(p.url());
    expect(u.searchParams.get('from')).toBeNull(); expect(u.searchParams.get('lang')).toBe('en'); expect(u.hash).toBe('#T3');
    await p.locator('section.level.active .m-pn .pn-card').scrollIntoViewIfNeeded();
    await p.locator('section.level.active .m-pn .pn-card').click();
    await expect.poll(() => hits.map((h) => new URL(h).searchParams.get('p'))).toContain('evt-share-card');
  } finally { await b.close(); }
});
