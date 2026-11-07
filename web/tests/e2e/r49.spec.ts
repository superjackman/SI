import { test, expect } from '@playwright/test';
/* Retired surface. The hash now opens the nearest page in the eight-destination site. */
test('retired hash r49.spec.ts opens #D/15a', async ({ page }) => {
  await page.goto('./?lang=zh#L1');
  await expect(page).toHaveURL(/D\/15a$/);
  await expect(page.locator('[role="dialog"], .l4-sheet, .g-modal')).toHaveCount(0);
});
