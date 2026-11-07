import { test, expect, type Page } from '@playwright/test';
/* Search, an honest empty week, a bad progress code, and one on-demand picture. */
const ORIGIN = 'http://localhost:' + (process.env.SI_E2E_PORT || '4173');
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: [{ name: 'si.fs', value: '0' }, { name: 'si.a2hs', value: '1' }, { name: 'si.onb', value: '1' }] }] } });
async function open(p: Page, q: string) {
  const errs: string[] = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(q); await p.locator('#l4').waitFor({ state: 'attached', timeout: 30000 }); await p.waitForTimeout(400);
  return errs;
}

test('search finds a station from a Chinese query', async ({ page }) => {
  const errs = await open(page, './?lang=zh#home');
  if (await page.locator('.pt-q').isVisible()) { await page.locator('.pt-q').fill('注意力'); await page.locator('.pt-search').evaluate((f: HTMLFormElement) => f.requestSubmit()); }
  else { await page.locator('[data-h="find"]').click(); await page.locator('.si-q').fill('注意力'); }
  const hit = page.locator('.si-hit[href="#D/8a"]');
  await expect(hit).toBeVisible();
  await hit.click();
  await expect(page.locator('#l4')).toHaveAttribute('data-px', 'D/8a.zh');
  expect(errs).toEqual([]);
});

test('empty week and a bad progress code leave the record alone', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('si.vf', '["s0a"]'));
  const errs = await open(page, './?lang=zh#R');
  await expect(page.locator('[data-week="empty"]')).toContainText('这周还没有做题');
  await page.locator('[data-code="in"]').fill('SI1.not-a-real-code');
  await page.locator('[data-code="imp"]').click();
  await expect(page.locator('[data-code="msg"]')).toContainText('没动');
  await expect(page.locator('[data-code="ask"]')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('si.vf'))).toBe('["s0a"]');
  expect(errs).toEqual([]);
});

test('station 9 picture can be replayed and does not cover the page', async ({ page }) => {
  const errs = await open(page, './?lang=zh#D/9');
  const cont = page.locator('[data-ml-to="r"]');
  for (let i = 0; i < 3 && await cont.count() === 0; i++) await page.locator(`[data-ml-o="${i}"]`).click();
  await cont.click();
  const box = page.locator('[data-mot="9"]');
  await expect(box).toBeVisible();
  await expect(box.locator('[data-mot-go="replay"]')).toBeVisible();
  const cap = await box.locator('.ly-mcap').innerText();
  expect(cap).not.toMatch(/先猜|调查|推理|验证/);
  await box.locator('[data-mot-go="replay"]').click();
  await expect(box.locator('.mv-fig')).toBeVisible();
  expect(errs).toEqual([]);
});
