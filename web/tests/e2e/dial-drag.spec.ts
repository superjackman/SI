import { test, expect } from '@playwright/test';
import { ML_AT_REASON } from './ml-open';

/* Dragging a knob through its centre must not reverse, and must not select text. */
const ORIGIN = 'http://localhost:' + (process.env.SI_E2E_PORT || '4173');
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: [{ name: 'si.onb', value: '1' }, { name: 'si.a2hs', value: '1' }, { name: 'si.ml', value: ML_AT_REASON }] }] } });

test('a knob drag through its centre rises one way, falls the other, and selects no text', async ({ page }, info) => {
  test.skip(info.project.name !== 'd1440', 'measured once');
  await page.goto('./?lang=zh#D/3');
  const knob = page.locator('.net-knob[data-i="16"]');
  await knob.waitFor();
  await knob.scrollIntoViewIfNeeded();
  const box = await knob.boundingBox();
  expect(box).toBeTruthy();
  expect(box!.width).toBeGreaterThanOrEqual(32);
  expect(box!.height).toBeGreaterThanOrEqual(32);
  const y = box!.y + box!.height / 2;
  const xL = box!.x + 2;
  const xR = box!.x + box!.width - 2;
  expect(xL).toBeLessThan(box!.x + box!.width / 2);
  expect(xR).toBeGreaterThan(box!.x + box!.width / 2);
  const read = () => knob.getAttribute('data-v').then((v) => Number(v));

  await page.mouse.move(xL, y);
  await page.mouse.down();
  const up: number[] = [await read()];
  for (let i = 1; i <= 8; i++) {
    await page.mouse.move(xL + (xR - xL) * i / 8, y);
    up.push(await read());
  }
  await expect(page.locator('.dial-read')).toBeVisible();
  const say = page.locator('[data-lab="net"] .lab-say');
  const sayBox = await say.boundingBox();
  if (sayBox) await page.mouse.move(sayBox.x + sayBox.width / 2, sayBox.y + sayBox.height / 2);
  await page.mouse.up();
  for (let i = 1; i < up.length; i++) expect(up[i]!).toBeGreaterThanOrEqual(up[i - 1]!);
  expect(up[up.length - 1]!).toBeGreaterThan(up[0]! + 0.05);
  expect(await page.evaluate(() => window.getSelection()?.toString() ?? '')).toBe('');

  await page.mouse.move(xR, y);
  await page.mouse.down();
  const down: number[] = [await read()];
  for (let i = 1; i <= 8; i++) {
    await page.mouse.move(xR - (xR - xL) * i / 8, y);
    down.push(await read());
  }
  await page.mouse.up();
  for (let i = 1; i < down.length; i++) expect(down[i]!).toBeLessThanOrEqual(down[i - 1]!);
  expect(down[down.length - 1]!).toBeLessThan(down[0]! - 0.05);
  expect(await page.evaluate(() => window.getSelection()?.toString() ?? '')).toBe('');
});
