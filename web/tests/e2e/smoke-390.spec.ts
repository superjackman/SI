import { test, expect } from '@playwright/test';

/* Phone is a single column that must not scroll sideways. Desktop is the real layout. */
const pages = ['#home', '#D/2', '#P', '#R', '#tools', '#news', '#map'];

test('390: home, station, practice, progress, tools, news and the map do not scroll sideways', async ({ page }) => {
  await page.goto('./?lang=zh#home');
  await page.locator('#l4').waitFor({ state: 'attached' });
  const bad: string[] = [];
  for (const hash of pages) {
    await page.evaluate((h) => { location.replace(h); }, hash);
    await page.locator('#l4').waitFor({ state: 'attached' });
    await page.waitForTimeout(400);
    const over = await page.evaluate(() => {
      const home = document.querySelector<HTMLElement>('.l4-home');
      const box = home && !home.hidden ? home : document.documentElement;
      return box.scrollWidth - box.clientWidth;
    });
    if (over > 2) bad.push(`${hash} ${over}`);
  }
  expect(bad).toEqual([]);
});
