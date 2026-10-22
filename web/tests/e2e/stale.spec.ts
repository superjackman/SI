import { test, expect, type Page, type Route } from '@playwright/test';
import { resolveBase } from '../../base.config.mjs';
/* A browser that cached the previous index.html (Pages: max-age=600) asks for hashed assets a deploy removed.
   These tests fake exactly that with page.route and check: one cache-busting reload, never a loop, then ⟳. */

const BASE: string = resolveBase();
const isIndex = (u: string) => new URL(u).pathname === BASE;
async function realIndex(page: Page) { return (await page.request.get(BASE)).text(); }
const stale = (html: string) => html.replace(/\/assets\/index-[^"]+\.js/, '/assets/index-OLDBUILD0.js').replace(/\/assets\/index-[^"]+\.css/, '/assets/index-OLDBUILD0.css');
const newer = (html: string) => html.replace(/\/assets\/index-[^"]+\.js/, '/assets/index-NEWBUILD9.js');
const html = (r: Route, body: string) => r.fulfill({ status: 200, contentType: 'text/html', headers: { 'cache-control': 'max-age=600' }, body });
/** document loads of the app (navigations), with the reload marker they carried */
function docs(page: Page) { const out: string[] = []; page.on('request', (r) => { if (r.isNavigationRequest() && isIndex(r.url())) out.push(r.url()); }); return out; }
async function ready(page: Page, key: string) {
  await page.locator(`html[data-si-ready="${key}"]`).waitFor({ state: 'attached', timeout: 15_000 });
  await expect(page.locator('section.level.active .pagehead')).toBeVisible();
}

test.beforeEach(async ({ page }) => { await page.route('**/assets/*OLDBUILD0*', (r) => r.fulfill({ status: 404, body: 'gone' })); });

test('stale cached index.html (entry 404) → one cache-busting reload → app works, URL clean', async ({ page }) => {
  const real = await realIndex(page); let n = 0;
  await page.route((u) => isIndex(u.href), (r) => (r.request().isNavigationRequest() && n++ === 0 ? html(r, stale(real)) : r.continue()));
  const d = docs(page);
  await page.goto('./?lang=en#T3');
  await ready(page, 'T3.en');
  expect(d.length).toBe(2);
  expect(d[1]).toMatch(/[?&]_r=\d+/);
  expect(d[1]).toContain('lang=en');
  expect(new URL(d[1] ?? '').hash).toBe(''); // hash is not sent, but the page keeps it:
  expect(new URL(page.url()).pathname + new URL(page.url()).search + new URL(page.url()).hash).toBe(BASE + '?lang=en#T3'); // _r stripped after boot, hash kept
  expect(await page.evaluate(() => sessionStorage.getItem('si.reload'))).toBe('index-OLDBUILD0.js');
});

test('index.html stays stale → exactly one reload, then a retry button (no loop); retry works once fixed', async ({ page }) => {
  const real = await realIndex(page); let fixed = false;
  await page.route((u) => isIndex(u.href), (r) => (r.request().isNavigationRequest() && !fixed ? html(r, stale(real)) : r.continue()));
  const d = docs(page);
  await page.goto('./?lang=zh#T1');
  const btn = page.locator('#mBoot.boot-fail #bootRetry');
  await expect(btn).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#mBoot.boot-fail p')).toHaveText('页面没能加载，请检查网络。');
  await expect(btn).toHaveAttribute('aria-label', '重新加载');
  await page.waitForTimeout(1500);
  expect(d.length).toBe(2); // first load + one guarded reload, nothing more
  const bb = await btn.boundingBox(); expect(bb && bb.width >= 44 && bb.height >= 44).toBe(true);
  fixed = true;
  await btn.click();
  await ready(page, 'T1.zh');
  expect(d.length).toBe(3);
});

test('station chunk 404 and a newer build is deployed → cache-busting reload → station loads', async ({ page }) => {
  await page.goto('./?lang=zh#T1'); await ready(page, 'T1.zh');
  const real = await realIndex(page);
  const gone = '**/assets/T3.zh-*.js';
  await page.route(gone, (r) => r.fulfill({ status: 404, body: 'gone' }));
  await page.route((u) => isIndex(u.href), (r) => (r.request().isNavigationRequest() ? r.continue() : html(r, newer(real))));
  const d = docs(page);
  page.on('request', (r) => { if (r.isNavigationRequest() && /_r=/.test(r.url())) void page.unroute(gone).then(() => page.unroute((u) => isIndex(u.href))); });
  await page.evaluate(() => (window as unknown as { __si: { go(s: string): void } }).__si.go('T3'));
  await ready(page, 'T3.zh');
  expect(d.length).toBe(1);
  expect(d[0]).toMatch(/_r=\d+/);
  await expect(page.locator('.st-fail')).toHaveCount(0);
});

test('station chunk 404, same build (e.g. offline blip) → no reload, ⟳ card, ⟳ recovers', async ({ page }) => {
  await page.goto('./?lang=en#T1'); await ready(page, 'T1.en');
  const gone = '**/assets/T4.en-*.js';
  await page.route(gone, (r) => r.fulfill({ status: 404, body: 'gone' }));
  const d = docs(page);
  await page.evaluate(() => (window as unknown as { __si: { go(s: string): void } }).__si.go('T4'));
  const card = page.locator('.card.st-fail');
  await expect(card).toBeVisible();
  await expect(card.locator('p')).toHaveText('This stop could not be loaded. Check your connection.');
  const btn = card.getByRole('button', { name: 'Try again' });
  await expect(btn).toHaveText('⟳');
  await page.waitForTimeout(800);
  expect(d.length).toBe(0);
  await page.unroute(gone);
  await btn.click();
  await ready(page, 'T4.en');
  await expect(card).toHaveCount(0);
});

test('lab chunk 404, same build → text stays, ⟳ notice for the labs, ⟳ recovers', async ({ page }) => {
  await page.goto('./?lang=zh#T1'); await ready(page, 'T1.zh');
  const gone = '**/assets/T5-*.js';
  await page.route(gone, (r) => r.fulfill({ status: 404, body: 'gone' }));
  await page.evaluate(() => (window as unknown as { __si: { go(s: string): void } }).__si.go('T5'));
  const note = page.locator('.card.lab-fail');
  await expect(note).toBeVisible();
  await expect(page.locator('section#T5 .pagehead')).toBeVisible();
  await page.unroute(gone);
  await note.getByRole('button', { name: '重新加载' }).click();
  await ready(page, 'T5.zh');
  await expect(note).toHaveCount(0);
});

test('vite:preloadError → reload only when a newer build exists; never twice', async ({ page }) => {
  await page.goto('./?lang=zh#T2'); await ready(page, 'T2.zh');
  const real = await realIndex(page);
  const fire = () => page.evaluate(() => { const e = new Event('vite:preloadError', { cancelable: true }) as Event & { payload?: unknown }; e.payload = new Error('Unable to preload CSS for ' + location.pathname + 'assets/x.css'); dispatchEvent(e); return e.defaultPrevented; });
  const d = docs(page);
  expect(await fire()).toBe(true); // same build: handled, no reload
  await page.waitForTimeout(800);
  expect(d.length).toBe(0);
  await page.route((u) => isIndex(u.href), (r) => (r.request().isNavigationRequest() ? r.continue() : html(r, newer(real))));
  await fire();
  await ready(page, 'T2.zh');
  await expect.poll(() => d.length).toBe(1);
  await page.waitForFunction(() => !!(window as unknown as { __si?: unknown }).__si);
  await fire(); // newer build still advertised (fake), but this build already reloaded once: no loop
  await page.waitForTimeout(1200);
  expect(d.length).toBe(1);
});
