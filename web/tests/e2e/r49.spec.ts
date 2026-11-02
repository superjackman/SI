import { test, expect, type Page } from '@playwright/test';
import { NUM } from '../../src/dv/nums';
/* R49 C12 one canonical example: the card holds it, the stage page's ④ reuses the same numbers and shows the card as a chip. */
const ORIGIN = 'http://localhost:4173';
const DONE = [{ name: 'si.fs', value: '0' }, { name: 'si.a2hs', value: '1' }, { name: 'si.onb', value: '1' }];
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: DONE }] } });
async function open(p: Page, q: string) {
  const errs: string[] = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(q); await p.locator('#l4').waitFor({ state: 'attached', timeout: 30000 }); await p.waitForTimeout(600);
  return errs;
}
const plain = (s: string) => s.replace(/`/g, '');

test.describe('R49 shared examples', () => {
  for (const l of ['zh', 'en'] as const) {
    test(`stage 2 and card KM10 show the same gradient-descent numbers (${l})`, async ({ page }) => {
      const errs = await open(page, `./?lang=${l}#D/2`);
      const s4 = page.locator('.l4-ks').nth(3);
      await expect(s4).toContainText(NUM.gd03[l]); await expect(s4).toContainText(plain(NUM.gdL[l]));
      await expect(s4.locator('.dv-ex .dv-kb[data-k="KM10"]')).toBeVisible();
      await s4.locator('.dv-ex .dv-kb[data-k="KM10"]').click();
      const sh = page.locator('.l4-sheet[data-card="KM10"]'); await expect(sh).toBeVisible();
      await expect(sh).toContainText(NUM.gd03[l]); await expect(sh).toContainText(plain(NUM.gdL[l]));
      expect(errs).toEqual([]);
    });
  }
  test('every stage with an example of its own shows its canonical card chips in ④', async ({ page }) => {
    await open(page, './?lang=zh#D/0'); const bad: string[] = [];
    for (let i = 0; i < 16; i++) {
      await page.evaluate((h) => { location.replace(h); }, `#D/${i}`); await expect(page.locator('#l4')).toHaveAttribute('data-px', `D/${i}.zh`);
      if ((await page.locator('.l4-ks').nth(3).locator('.dv-ex .dv-kb').count()) < 1) bad.push(`D/${i}`);
    }
    expect(bad).toEqual([]);
  });
});
