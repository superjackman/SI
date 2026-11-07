import { test, expect } from '@playwright/test';
/* Retired surface. The hash now opens the nearest page in the eight-destination site. */
test('retired hash r50.spec.ts opens #D/9', async ({ page }) => {
  await page.goto('./?lang=zh#L3');
  await expect(page).toHaveURL(/D\/9$/);
  await expect(page.locator('[role="dialog"], .l4-sheet, .g-modal')).toHaveCount(0);
});
