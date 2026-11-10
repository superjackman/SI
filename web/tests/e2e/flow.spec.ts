import { test, expect, type Page } from '@playwright/test';
import { DV_KEY, DV_N } from '../../src/dv/links';

/* Empty storage: the root address is station 0, then … → 16. One forward control on each screen, and no solid skip before the station is done. */
const ORIGIN = 'http://localhost:' + (process.env.SI_E2E_PORT || '4173');
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: [] }] } });

const fwd = (p: Page) => p.locator('[data-fwd="1"]:visible');

async function oneForward(p: Page, where: string) {
  const n = await fwd(p).count();
  expect(n, where).toBe(1);
  const inColumn = await p.locator('.hm [data-fwd="1"]:visible, .dv [data-fwd="1"]:visible').count();
  expect(inColumn, where).toBe(1);
  await expect(p.locator('.g-next:visible'), where).toHaveCount(0);
  await expect(p.locator('.dv-so:visible'), where).toHaveCount(0);
}

test('empty storage walks station 0 through 16 with one forward and no skip', async ({ page }) => {
  test.setTimeout(900_000);
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto('./?lang=zh');
  await page.locator('.st-article .st-h').waitFor();
  await expect(page).toHaveURL(/#D\/0$/);
  await expect(page.locator('#l4')).not.toContainText('继续学习');

  for (let i = 0; i < DV_KEY.length; i++) {
    const k = DV_KEY[i]!;
    await expect(page).toHaveURL(new RegExp(`#D/${k}$`));
    await page.waitForFunction((key) => document.querySelector('.ly.ml')?.getAttribute('data-ml-k') === key, k);
    await expect(page.locator('.st-out')).toBeVisible();
    await expect(page.locator('.st-article')).toBeVisible();
    await expect(page.locator('.st-side, .st-tabs, .ly-dep, .ly-pg, .ly-go, .ml-goal')).toHaveCount(0);
    await expect(page.locator('.ly-l:not([hidden])')).toHaveCount(5);
    const figs = await page.locator('[data-fig]').evaluateAll((els) => els.map((e) => e.getAttribute('data-fig') || ''));
    expect(new Set(figs).size, k).toBe(figs.length);
    expect(figs.length, k).toBeGreaterThan(0);
    await expect(page.locator('.ml-q').first()).toBeAttached();
    await expect(page.locator('.dv-take li')).toHaveCount(3);
    await expect(page.locator('.dv-pos')).toContainText(`第 ${i + 1}/${DV_N} 站`);
    await expect(page.locator('.l4-tt')).toContainText(`第 ${i + 1}/${DV_N} 站`);
    await oneForward(page, `enter ${k}`);
    await page.locator('.dv-end [data-fwd="1"]').click();
  }
  await expect(page).toHaveURL(/#me$/);
  expect(errs).toEqual([]);
});

test('next day opens the station that was entered and not finished, with reviews under that card', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-07T10:00:00+08:00') });
  await page.goto('./?lang=zh');
  await page.locator('.st-article .st-h').waitFor();
  await expect(page).toHaveURL(/#D\/0$/);
  await page.locator('.ml-q').first().waitFor();
  await page.clock.setSystemTime(new Date('2026-11-08T10:00:00+08:00'));
  await page.evaluate(() => localStorage.setItem('si.rv', JSON.stringify({ s0a: { b: 0, due: 1, t: 1, w: 1, f: 0 } })));
  await page.goto('./?lang=zh');
  await expect(page).toHaveURL(/#D\/0$/);
  await expect(page.locator('.st-article .st-h')).toHaveText('用样本找函数');
  await expect(page.locator('#l4')).not.toContainText('继续学习');
  await expect(page.locator('#l4')).not.toContainText('继续上次');
  await expect(page.locator('.hm-go, .hm-bell')).toHaveCount(0);
});
