import { test, expect } from '@playwright/test';
import { DV_KEY } from '../../src/dv/links';
import { ML_AT_REASON } from './ml-open';

/* Every numeric drag on every station: through the centre, the value moves one way only. */
const ORIGIN = 'http://localhost:' + (process.env.SI_E2E_PORT || '4173');
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: [{ name: 'si.onb', value: '1' }, { name: 'si.a2hs', value: '1' }, { name: 'si.ml', value: ML_AT_REASON }] }] } });

test('every station drag follows the hand and selects no text', async ({ page }, info) => {
  test.skip(info.project.name !== 'd1440', 'measured once');
  test.setTimeout(300_000);
  const seen: string[] = [];
  for (const k of DV_KEY) {
    await page.goto('./?lang=zh#D/' + k);
    await page.locator('.st-article').waitFor();
    await page.waitForTimeout(1200);
    const n = await page.locator('[data-drag]').count();
    for (let i = 0; i < n; i++) {
      const h = page.locator('[data-drag]').nth(i);
      if (!(await h.isVisible())) continue;
      await h.scrollIntoViewIfNeeded();
      const box = await h.evaluate((el) => {
        const c = el.querySelector('circle');
        const r = (c || el).getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      });
      if (box.width < 20 || box.height < 20) continue;
      const meta = await h.evaluate((el) => {
        const node = el as HTMLElement;
        const v = node instanceof HTMLInputElement ? node.valueAsNumber : Number(node.dataset.v);
        const min = node instanceof HTMLInputElement ? Number(node.min) : Number(node.getAttribute('aria-valuemin'));
        const max = node instanceof HTMLInputElement ? Number(node.max) : Number(node.getAttribute('aria-valuemax'));
        return { v, min, max, kind: node.dataset.drag || '' };
      });
      if (!Number.isFinite(meta.v)) continue;
      const mid = Number.isFinite(meta.min) && Number.isFinite(meta.max) ? (meta.min + meta.max) / 2 : meta.v - 1;
      const dir = meta.v <= mid ? 1 : -1;
      const y = box.y + box.height / 2;
      const x0 = box.x + Math.min(8, box.width / 4);
      const x1 = box.x + box.width - Math.min(8, box.width / 4);
      const from = dir > 0 ? x0 : x1;
      const to = dir > 0 ? x1 : x0;
      const read = () => h.evaluate((el) => {
        const node = el as HTMLElement;
        return node instanceof HTMLInputElement ? node.valueAsNumber : Number(node.dataset.v);
      });
      await page.mouse.move(from, y);
      await page.mouse.down();
      const samples = [await read()];
      for (let s = 1; s <= 6; s++) {
        await page.mouse.move(from + (to - from) * s / 6, y);
        samples.push(await read());
      }
      await page.mouse.up();
      const bad = samples.some((v, j) => j > 0 && (dir > 0 ? v < samples[j - 1]! - 1e-6 : v > samples[j - 1]! + 1e-6));
      const moved = dir > 0 ? samples[samples.length - 1]! > samples[0]! + 1e-4 : samples[samples.length - 1]! < samples[0]! - 1e-4;
      const sel = await page.evaluate(() => window.getSelection()?.toString() ?? '');
      expect(bad, `${k} ${meta.kind} ${i} ${samples.join(',')}`).toBe(false);
      expect(moved, `${k} ${meta.kind} ${i} stuck ${samples.join(',')}`).toBe(true);
      expect(sel, `${k} ${meta.kind} ${i}`).toBe('');
      seen.push(`${k}:${meta.kind}`);
    }
  }
  expect(seen.filter((s) => s.endsWith(':knob')).length).toBeGreaterThan(10);
  expect(seen.some((s) => s.startsWith('2:orbit'))).toBe(true);
  expect(seen.some((s) => s.startsWith('6:orbit'))).toBe(true);
  expect(seen.some((s) => s.endsWith(':range'))).toBe(true);
});
