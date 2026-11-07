import { test, expect } from '@playwright/test';
/* Retired surface. The hash now opens the nearest page in the eight-destination site. */
test('retired hash r42.spec.ts opens #home', async ({ page }) => {
  await page.goto('./?lang=zh#S');
  await expect(page).toHaveURL(/home$/);
  await expect(page.locator('[role="dialog"], .l4-sheet, .g-modal')).toHaveCount(0);
});
