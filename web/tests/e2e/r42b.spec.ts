import { test, expect } from '@playwright/test';
/* Retired surface. The hash now opens the nearest page in the eight-destination site. */
test('retired hash r42b.spec.ts opens #D/13', async ({ page }) => {
  await page.goto('./?lang=zh#L2');
  await expect(page).toHaveURL(/D\/13$/);
  await expect(page.locator('[role="dialog"], .l4-sheet, .g-modal')).toHaveCount(0);
});
