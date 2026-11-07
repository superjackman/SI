import { test, expect } from '@playwright/test';
/* Retired surface. The hash now opens the nearest page in the eight-destination site. */
test('retired hash r38.spec.ts opens #D/6', async ({ page }) => {
  await page.goto('./?lang=zh#L4/tr/1');
  await expect(page).toHaveURL(/D\/6$/);
  await expect(page.locator('[role="dialog"], .l4-sheet, .g-modal')).toHaveCount(0);
});
