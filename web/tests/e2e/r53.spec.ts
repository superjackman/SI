import { test, expect } from '@playwright/test';

/* Home is one primary button plus the layered path. No chooser sheet, no greeting. */
test('first visit: one button to station 1, the path, no dialog', async ({ page }) => {
  await page.goto('./?lang=zh#home');
  await expect(page.locator('#l4')).toHaveAttribute('data-hm', 'first.zh');
  await expect(page.locator('.hm-h')).toContainText('从一个数学函数出发');
  await expect(page.locator('.hm-k')).toContainText('零基础');
  await expect(page.locator('.hm-cta')).toHaveCount(1);
  await expect(page.locator('.hm-cta')).toHaveAttribute('data-go', '#D/0');
  await expect(page.locator('.hm-layer')).toHaveCount(6);
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  expect(await page.locator('#l4').innerText()).not.toMatch(/欢迎|你好|Welcome/);
});

test('returning home continues the open station and shows the four ratios', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('si.dv.seen', JSON.stringify(['0'])));
  await page.goto('./?lang=zh#home');
  await expect(page.locator('#l4')).toHaveAttribute('data-hm', 'back.zh');
  await expect(page.locator('.hm-go')).toBeVisible();
  await expect(page.locator('.hm-cta')).toHaveCount(1);
  await expect(page.locator('.hm-ratios [data-k="D"] b')).toContainText('/23');
  await expect(page.locator('.hm-ratios')).toHaveAttribute('data-ditr', /D:\d+\/23/);
});
