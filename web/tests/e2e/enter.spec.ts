import { test, expect } from '@playwright/test';

/* The root address is the lesson. There is no continue-learning landing. */
test('root URL opens station 1: title, lesson text, no continue screen', async ({ page }) => {
  await page.goto('./?lang=zh');
  await page.locator('.st-article .st-h').waitFor();
  await expect(page).toHaveURL(/#D\/0$/);
  await expect(page.locator('.st-article .st-h')).toHaveText('用样本找函数');
  await expect(page.locator('.st-article .st-sec').first()).toBeVisible();
  await expect(page.locator('.st-out')).toBeVisible();
  const text = await page.locator('#l4').innerText();
  expect(text).not.toContain('继续学习');
  expect(text).not.toContain('继续上次');
  await expect(page.locator('.hm-cta, .hm-go, .hm-hero')).toHaveCount(0);
});

test('a returning visitor opens the station they last viewed', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('si.dv.at', '2'));
  await page.goto('./?lang=zh#home');
  await page.locator('.st-article .st-h').waitFor();
  await expect(page).toHaveURL(/#D\/2$/);
  await expect(page.locator('.st-article .st-h')).toHaveText('梯度下降');
  await expect(page.locator('#l4')).not.toContainText('继续学习');
});

test('学习 and the old home hash replace the address, so Back does not restore a landing', async ({ page }) => {
  await page.goto('./?lang=zh#review');
  await page.locator('.hm-h').waitFor();
  await page.locator('a[data-pt="learn"]').click();
  await expect(page).toHaveURL(/#D\/0$/);
  await page.goBack();
  await expect(page).not.toHaveURL(/#home/);
  await expect(page).not.toHaveURL(/#review/);
});
