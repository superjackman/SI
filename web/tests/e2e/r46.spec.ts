import { test, expect, type Page } from '@playwright/test';
/* R46: moving inside the site never adds a browser history entry, so the phone's Back leaves the site in one step;
   the site's own controls (↑, crumbs, the map, ✕) still move inside it, ✕ back to the previous view. */
const ORIGIN = 'http://localhost:' + (process.env.SI_E2E_PORT || '4173');
const DONE = [{ name: 'si.fs', value: '0' }, { name: 'si.a2hs', value: '1' }, { name: 'si.onb', value: '1' }];
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: DONE }] } });
async function open(p: Page, q: string) {
  const errs: string[] = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(q); await p.locator('#l4').waitFor({ state: 'attached', timeout: 30000 }); await p.waitForTimeout(800);
  return errs;
}
const re = (h: string) => new RegExp(h.replace(/[/?]/g, '\\$&') + '$');
const hl = (p: Page) => p.evaluate(() => history.length);

test.describe('R46 Back leaves the site', () => {
  test('clicks inside the site keep history.length; one Back leaves', async ({ page }) => {
    await page.goto('about:blank');
    const errs = await open(page, './?lang=zh#map'); const n0 = await hl(page); // R53: the pyramid is the 地图 tab
    await page.locator('.l4-lv[data-go="#L1"]').click(); await expect(page).toHaveURL(re('#L1'));
    await page.locator('.l4-nav [data-a="next"]').click(); await expect(page).not.toHaveURL(re('#L1'));
    await page.locator('.l4-nav [data-a="next"]').click();
    const u = page.url(); await page.locator('.l4-crumb a').last().click(); await expect(page).not.toHaveURL(u);
    await page.locator('[data-a="menu"]:visible').first().click(); const ms = page.locator('.l4-ms'); await expect(ms).toBeVisible();
    const to = (await ms.locator('a[href^="#L4"]:not(.here)').first().getAttribute('href'))!;
    await ms.locator(`a[href="${to}"]`).first().click(); await expect(ms).toHaveCount(0); await expect(page).toHaveURL(re(to));
    const up = page.locator('.l4-top [data-a="back"]'); if (await up.isVisible()) await up.click(); else await page.locator('.l4-crumb a').last().click(); await expect(page).toHaveURL(re('#home'));
    expect(await hl(page)).toBe(n0);
    await page.goBack(); await expect(page).toHaveURL('about:blank');
    expect(errs).toEqual([]);
  });
  test('✕ on a full-page view returns to the previous in-site view, card included', async ({ page }) => {
    const errs = await open(page, './?lang=zh#L4~K06'); const n0 = await hl(page);
    await page.evaluate(() => { location.replace('#S/KA04.k'); }); await page.waitForTimeout(400);
    const dlg = page.locator('.px-s.g-modal .g-dlg'); await expect(dlg).toBeVisible();
    await dlg.locator('.g-x').click(); await expect(page).toHaveURL(re('#L4~K06'));
    await expect(page.locator('.l4-sheet[data-card="K06"]')).toBeVisible();
    expect(await hl(page)).toBe(n0);
    expect(errs).toEqual([]);
  });
  test('a deep link with nothing before it: ✕ goes home, refresh keeps working', async ({ page }) => {
    const errs = await open(page, './?lang=zh#S/KA04.k');
    await page.locator('.px-s.g-modal .g-x').click(); await expect(page).toHaveURL(re('#home'));
    await page.reload(); await page.locator('#l4').waitFor({ state: 'attached' }); await expect(page).toHaveURL(re('#home'));
    expect(errs).toEqual([]);
  });
});
