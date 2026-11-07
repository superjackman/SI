import { test, expect } from '@playwright/test';
/* Retired surface. The hash now opens the nearest page in the eight-destination site. */
test('retired hash r40.spec.ts opens #review', async ({ page }) => {
  await page.goto('./?lang=zh#P');
  await expect(page).toHaveURL(/review$/);
  await expect(page.locator('[role="dialog"], .l4-sheet, .g-modal')).toHaveCount(0);
});
