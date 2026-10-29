import { test, expect, type Page } from '@playwright/test';
/* R42: the share-card picker (search, pick, the QR follows), the per-card landing pages /c/<id>.html (og meta, redirect into
   the app with the card open, a no-JS fallback), the dark first paint, and the en practice list fits at every phone width. */
const ORIGIN = 'http://localhost:4173';
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: [{ name: 'si.fs', value: '0' }, { name: 'si.a2hs', value: '1' }, { name: 'si.onb', value: '1' }] }] } });

async function open(p: Page, q: string) {
  const errs: string[] = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(q); await p.locator('#l4').waitFor({ state: 'attached', timeout: 20000 });
  return errs;
}
async function at(p: Page, id: string, lang: string) {
  await p.evaluate((x) => { location.hash = x; }, '#' + id);
  await p.waitForFunction((want) => document.getElementById('l4')?.dataset.px === want, `${id.replace(/^S\/.*/, 'S')}.${lang}`, { timeout: 20000 });
}
async function layoutOk(p: Page) {
  return p.evaluate(() => {
    const bad: string[] = []; const W = innerWidth, H = innerHeight;
    const vis = (e: Element) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
    const R = (e: Element) => e.getBoundingClientRect();
    for (const s of ['.l4-top', '.l4-cr', '.l4-nav', '.l4-qp', '.l4-hb', '.l4-qk']) for (const e of document.querySelectorAll(s)) {
      if (!vis(e)) continue; const r = R(e); if (r.left < -0.5 || r.top < -0.5 || r.right > W + 0.5 || r.bottom > H + 0.5) bad.push(`out ${s} ${e.textContent?.slice(0, 16)}`);
    }
    // nothing in the content area is wider than the screen (vertical scroll inside .l4-home is allowed)
    for (const e of document.querySelectorAll('.px *, .l4-hb, .l4-qk')) { if (!vis(e)) continue; const r = R(e); if (r.left < -0.5 || r.right > W + 0.5) { bad.push(`wide ${e.className} ${e.textContent?.slice(0, 16)}`); break; } }
    const home = document.querySelector('.l4-home'); if (home && home.scrollWidth > home.clientWidth + 1) bad.push(`hscroll ${home.scrollWidth}>${home.clientWidth}`);
    for (const t of document.querySelectorAll<HTMLElement>('.l4-tt, .l4-r span, .l4-b, .px-o span, .px-it b, .px-st b, .l4-hr b, .l4-hr span, .l4-qp span')) if (vis(t) && (t.scrollWidth > t.clientWidth + 1 || t.scrollHeight > t.clientHeight + 1)) bad.push(`cut ${t.className} ${t.textContent?.slice(0, 20)}`);
    const bs = [...document.querySelectorAll('.px-o, .px-it, .l4-hr, .px-st > div')].filter(vis);
    for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
      const a = R(bs[i]!), b = R(bs[j]!);
      if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) bad.push(`overlap ${bs[i]!.textContent?.slice(0, 12)} × ${bs[j]!.textContent?.slice(0, 12)}`);
    }
    const fs = [...document.querySelectorAll<HTMLElement>('#l4 *')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())).map((e) => parseFloat(getComputedStyle(e).fontSize));
    if (Math.min(...fs) < 12) bad.push(`font ${Math.min(...fs)}`);
    return bad;
  });
}

test.describe('R42', () => {
  test('share picker: search, pick a card, the preview and QR follow it', async ({ page }) => {
    const errs = await open(page, './?lang=zh#S/K06.k'); await at(page, 'S/K06.k', 'zh');
    await expect(page.locator('.px-prev img')).toBeVisible();
    await page.locator('.px-pick').click();
    const pk = page.locator('.px-pk'); await expect(pk).toBeVisible();
    expect(await layoutOk(page)).toEqual([]);
    await page.locator('.px-pq').fill('交叉熵');
    const hit = pk.locator('.px-pi:visible'); await expect(hit.first()).toBeVisible();
    const id = ((await hit.first().getAttribute('data-px')) ?? '').replace('pc:', '');
    expect(id).toMatch(/^K/);
    await hit.first().click();
    await expect(page.locator('.px-pk')).toHaveCount(0);
    await expect(page.locator('.px-prev')).toHaveAttribute('data-url', new RegExp(`/c/${id}\\.html\\?lang=zh$`));
    expect(errs).toEqual([]);
  });
  test('landing page /c/<id>.html: og meta, then the app opens at the card (lang kept)', async ({ page }) => {
    await page.goto('./c/K06.html?lang=en');
    await page.waitForURL(/\?lang=en#L4~K06$/, { timeout: 20000 });
    await expect(page.locator('.l4-sheet[data-card="K06"]')).toBeVisible({ timeout: 20000 });
    await page.goto('./c/KA04.html?lang=zh');
    await page.waitForURL(/\?lang=zh#L1~KA04$/, { timeout: 20000 });
    await expect(page.locator('.l4-sheet[data-card="KA04"]')).toBeVisible({ timeout: 20000 });
  });
  test('landing page without JS: readable card + link into the app', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 640 } }), p = await ctx.newPage();
    await p.goto(baseURL + 'c/KM04.html');
    await expect(p.locator('h1')).toHaveText('softmax');
    await expect(p.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://superjackman.github.io/SI/og/KM04.jpg');
    await expect(p.locator('a.go')).toHaveAttribute('href', '../?lang=zh#L5~KM04');
    expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const img = await p.request.get(baseURL + 'og/KM04.jpg'); expect(img.status()).toBe(200); expect(img.headers()['content-type']).toContain('image/jpeg');
    await ctx.close();
  });
  test('first paint is dark (#0b1230), no white flash', async ({ page }) => {
    await page.route('**/assets/*.js', (r) => r.abort());
    await page.goto('./?lang=zh#home').catch(() => {});
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(11, 18, 48)');
    expect(await page.locator('meta[name="theme-color"]').getAttribute('content')).toBe('#0b1230');
  });
  for (const lang of ['en', 'zh']) test(`practice list fits (${lang})`, async ({ page }) => {
    const errs = await open(page, `./?lang=${lang}#P`); await at(page, 'P', lang);
    await expect(page.locator('.px-it').first()).toBeVisible();
    expect(await layoutOk(page)).toEqual([]);
    if (lang === 'en') for (const b of await page.locator('.px-it b').all()) { /* en names once squeezed into a letter-wide column */ const h = await b.evaluate((e) => e.getBoundingClientRect().width); expect(h).toBeGreaterThan(60); }
    expect(errs).toEqual([]);
  });
});
