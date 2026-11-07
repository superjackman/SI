import { test, expect } from '@playwright/test';
/* Retired surface. The hash now opens the nearest page in the eight-destination site. */
test('retired hash r39.spec.ts opens #D/0', async ({ page }) => {
  await page.goto('./?lang=zh#L5');
  await expect(page).toHaveURL(/D\/0$/);
  await expect(page.locator('[role="dialog"], .l4-sheet, .g-modal')).toHaveCount(0);
});
