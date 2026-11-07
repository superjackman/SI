import { test, expect } from '@playwright/test';
/* Retired surface. The hash now opens the nearest page in the eight-destination site. */
test('retired hash r41b.spec.ts opens #settings', async ({ page }) => {
  await page.goto('./?lang=zh#settings');
  await expect(page).toHaveURL(/settings$/);
  await expect(page.locator('[role="dialog"], .l4-sheet, .g-modal')).toHaveCount(0);
});
