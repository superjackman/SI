import { test, expect } from '@playwright/test';
/* Retired surface. The hash now opens the nearest page in the eight-destination site. */
test('retired hash r54.spec.ts opens the lesson', async ({ page }) => {
  await page.goto('./?lang=zh#map');
  await expect(page).toHaveURL(/#D\/0$/);
  await expect(page.locator('[role="dialog"], .l4-sheet, .g-modal')).toHaveCount(0);
});
