import { test, expect } from '@playwright/test';
import { DV_KEY } from '../../src/dv/links';

/* Every station is an outline plus one lesson. Nothing is tucked behind a step control. */
const ORIGIN = 'http://localhost:' + (process.env.SI_E2E_PORT || '4173');
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: [{ name: 'si.onb', value: '1' }, { name: 'si.a2hs', value: '1' }] }] } });

test('every station is an outline and one article, with the lesson already in the page', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('./?lang=zh#D/0');
  await page.locator('.st-article').waitFor();
  for (const k of DV_KEY) {
    await page.evaluate((h) => { location.replace(h); }, `#D/${k}`);
    await expect(page.locator('#l4')).toHaveAttribute('data-px', `D/${k}.zh`);
    await expect(page.locator('.st-out')).toHaveCount(1);
    await expect(page.locator('.st-article')).toHaveCount(1);
    await expect(page.locator('.st-side, .st-tabs, .ly-dep, .ly-pg, .ly-go, .ml-goal, .ml-bar')).toHaveCount(0);
    await expect(page.locator('.ly-l:not([hidden])')).toHaveCount(5);
    await expect(page.locator('.st-code')).toBeAttached();
    await expect(page.locator('.ly-fx, .st-inline .formula').first()).toBeAttached();
    await expect(page.locator('.dv-take li')).toHaveCount(3);
    await expect(page.locator('.dv-end [data-fwd="1"]')).toHaveCount(1);
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  }
});
