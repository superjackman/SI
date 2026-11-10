import { test, expect } from '@playwright/test';

/* The old home address is the lesson. Progress numbers stay on 我的. */
test('first visit: station 1, no landing, no dialog', async ({ page }) => {
  await page.goto('./?lang=zh');
  await page.locator('.st-article .st-h').waitFor();
  await expect(page).toHaveURL(/#D\/0$/);
  await expect(page.locator('.st-article .st-h')).toHaveText('用样本找函数');
  await expect(page.locator('.st-article p').first()).toBeVisible();
  await expect(page.locator('.hm-cta, .hm-hero, .hm-go')).toHaveCount(0);
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  expect(await page.locator('#l4').innerText()).not.toMatch(/欢迎|你好|Welcome|继续学习|继续上次/);
});

test('saved progress opens that station, and the ratios stay on 我的', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('si.dv.seen', JSON.stringify(['0'])));
  await page.goto('./?lang=zh#home');
  await page.locator('.st-article .st-h').waitFor();
  await expect(page).toHaveURL(/#D\/0$/);
  await expect(page.locator('.hm-go, .hm-ratios')).toHaveCount(0);
  await page.locator('a[data-pt="me"]').click();
  await expect(page).toHaveURL(/#me$/);
  await expect(page.locator('.hm-ratios [data-k="D"] b')).toContainText('/23');
  await expect(page.locator('.hm-ratios')).toHaveAttribute('data-ditr', /D:\d+\/23/);
});
