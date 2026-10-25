/* R25 SEO, in the browser against the built site: every sitemap URL is served (200, and it is that page — its
   canonical matches), robots.txt and 404 are served, the static pages fit a phone screen without sideways scroll,
   and the "open in the app" link lands on that stop. */
import { test, expect } from '@playwright/test';

const ORIGIN = 'https://superjackman.github.io';
const overflow = (page: import('@playwright/test').Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('every sitemap URL is served and is the page it claims to be; robots.txt names the sitemap', async ({ request, baseURL }) => {
  const base = new URL(baseURL!).pathname;
  const sm = await request.get('sitemap.xml');
  expect(sm.status()).toBe(200);
  const locs = [...(await sm.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
  expect(locs.length).toBe(1 + 2 + 54);
  for (const u of locs) {
    expect(u.startsWith(ORIGIN + base), u).toBe(true);
    const r = await request.get(u.slice(ORIGIN.length).replace(base, './'));
    expect(r.status(), u).toBe(200);
    const html = await r.text();
    expect(html, u).toContain(`<link rel="canonical" href="${u}">`);
  }
  const rb = await request.get('robots.txt');
  expect(rb.status()).toBe(200);
  expect(await rb.text()).toContain(`Sitemap: ${ORIGIN}${base}sitemap.xml`);
  const nf = await request.get('404.html');
  expect(await nf.text()).toContain('<meta name="robots" content="noindex">');
});

for (const [lang, S, path] of [['zh', 'Api', 's/Api/'], ['en', 'Loc', 'en/s/Loc/'], ['zh', 'T4a', 's/T4a/'], ['en', 'H', 'en/s/']] as const) /* R27: the catalogue opens the app's home page */ {
  test(`${lang} static page ${path}: fits the screen, links work, "open in the app" lands on ${S}`, async ({ page }) => {
    await page.goto(`./${path}`);
    await expect(page.locator('h1')).toBeVisible();
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    /* nothing hugs the screen edge: header, breadcrumb, main all keep a side margin */
    expect(await page.evaluate(() => [...document.querySelectorAll('header a, .bc li, main > *')].filter((e) => e.getClientRects().length).map((e) => e.getBoundingClientRect()).filter((r) => r.left < 8 || r.right > document.documentElement.clientWidth - 8).length)).toBe(0);
    if (lang === 'en') expect(/[\u3400-\u9fff]/.test((await page.locator('main').innerText()))).toBe(false);
    await page.locator('.open a').first().click();
    await page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached' });
    await expect(page.locator(S === 'H' ? 'section.level.active .hm-t' : 'section.level.active .pagehead')).toBeVisible();
  });
}

test('a stop page links to its neighbours and back to the catalogue', async ({ page }) => {
  await page.goto('./s/Api/');
  await page.locator('a[rel=next]').click();
  await expect(page.locator('h1')).toHaveText('本地跑模型');
  await page.locator('a[rel=prev]').click();
  await expect(page).toHaveURL(/\/s\/Api\/$/);
  await page.locator('a[href$="/s/"]').first().click();
  await expect(page.locator('ol li a')).toHaveCount(27);
});
