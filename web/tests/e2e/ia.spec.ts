import { test, expect } from '@playwright/test';

/* The eight-destination site: no dialog, one home action, old hashes land nearby. */
const LIVE = ['#home', '#review', '#me', '#tools', '#news', '#W', '#search', '#settings', '#D/0', '#D/2', '#D/16'];
const OLD: [string, RegExp][] = [
  ['#map', /#D\/0$/],
  ['#D', /#D\/0$/],
  ['#D/map', /#D\/0$/],
  ['#D/routes', /#D\/0$/],
  ['#L5', /#D\/0$/],
  ['#L4', /#D\/6$/],
  ['#L3', /#D\/9$/],
  ['#L2', /#D\/13$/],
  ['#L1', /#D\/15a$/],
  ['#Q', /#D\//],
  ['#S', /#D\//],
  ['#P', /#review$/],
  ['#R', /#me$/],
  ['#R/rv', /#review$/],
  ['#R/so2', /#review$/],
  ['#D/ch/2', /#D\/2$/],
  ['#about', /#D\//],
];

test('no dialog or sheet is in the DOM on the live routes', async ({ page }) => {
  const bad: string[] = [];
  for (const hash of LIVE) {
    await page.goto('./?lang=zh' + hash);
    await page.locator('#l4').waitFor({ state: 'attached' });
    await page.waitForTimeout(250);
    const hit = await page.evaluate(() => {
      const dialogs = document.querySelectorAll('[role="dialog"], [role="alertdialog"], .l4-sheet, .g-modal, .l4-ob, .hm-sh').length;
      const overlays = [...document.querySelectorAll('body *')].filter((e) => {
        if (!(e instanceof HTMLElement) || e.id === 'l4') return false;
        const s = getComputedStyle(e);
        if (s.position !== 'fixed') return false;
        const r = e.getBoundingClientRect();
        return r.width > innerWidth * 0.7 && r.height > innerHeight * 0.7;
      }).map((e) => (e as HTMLElement).className || e.tagName);
      return { dialogs, overlays };
    });
    if (hit.dialogs || hit.overlays.length) bad.push(`${hash} dialogs=${hit.dialogs} overlays=${hit.overlays.join(',')}`);
  }
  expect(bad).toEqual([]);
});

test('the old home address opens the lesson, and the top nav is still there', async ({ page }) => {
  await page.goto('./?lang=zh#home');
  await page.locator('.st-article .st-h').waitFor();
  await expect(page).toHaveURL(/#D\/0$/);
  await expect(page.locator('.hm-cta, .hm-go')).toHaveCount(0);
  await expect(page.locator('.pt-links a')).toHaveCount(6);
  await expect(page.locator('a[data-pt="learn"]')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.pt-set')).toHaveAttribute('href', '#settings');
});

test('old hashes redirect to the nearest new page', async ({ page }) => {
  for (const [from, to] of OLD) {
    await page.goto('./?lang=zh' + from);
    await expect(page).toHaveURL(to);
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  }
});
