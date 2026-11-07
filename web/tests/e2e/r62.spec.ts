import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
/* Phone shots of the tool guide, the three projects, the home week, and the import preview. */
const ORIGIN = 'http://localhost:' + (process.env.SI_E2E_PORT || '4173');
const OUT = '/opt/cursor/artifacts';
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: [{ name: 'si.fs', value: '0' }, { name: 'si.a2hs', value: '1' }, { name: 'si.onb', value: '1' }] }] } });

async function open(p: Page, q: string) {
  const errs: string[] = [];
  p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(q);
  await p.locator('#l4').waitFor({ state: 'attached', timeout: 30000 });
  await p.waitForTimeout(350);
  return errs;
}
const shot = async (p: Page, name: string) => {
  mkdirSync(OUT, { recursive: true });
  const wide = await p.evaluate(() => {
    const el = document.querySelector('.l4-home');
    return !!el && el.scrollWidth > el.clientWidth + 2;
  });
  if (wide) throw new Error('horizontal overflow');
  await p.screenshot({ path: `${OUT}/${name}-${test.info().project.name}.png` });
};

const TOOLS = ['dify', 'ragflow', 'flowise', 'ollama', 'lmstudio', 'llamacpp', 'vllm', 'openwebui'] as const;

test('tool guide pages at this width', async ({ page }) => {
  test.setTimeout(180_000);
  const errs = await open(page, './?lang=zh#tools/dify');
  for (const id of TOOLS) {
    await page.goto(`./?lang=zh#tools/${id}`);
    const box = page.locator(`[data-guide="${id}"]`);
    await expect(box).toBeVisible({ timeout: 20000 });
    await expect(box).toContainText('尚未实测');
    await expect(box).toContainText('许可');
    await shot(page, `guide-${id}`);
  }
  expect(errs).toEqual([]);
});

test('each starter project at this width', async ({ page }) => {
  test.setTimeout(120_000);
  const errs = await open(page, './?lang=zh#W/kb');
  await expect(page.locator('[data-work="kb"]')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('[data-work="kb"]')).toContainText('不是联网模型');
  await page.locator('[data-wk-q="food"]').click();
  await expect(page.locator('[data-wk-out]')).toContainText('没有');
  await shot(page, 'project-kb');

  await page.goto('./?lang=zh#W/ask');
  await expect(page.locator('[data-work="ask"]')).toBeVisible();
  await page.locator('[data-wk-ask="ask"]').click();
  await expect(page.locator('[data-wk-out="ask"]')).toBeVisible();
  await shot(page, 'project-ask');

  await page.goto('./?lang=zh#W/fix');
  await expect(page.locator('[data-work="fix"]')).toBeVisible();
  await expect(page.locator('.wk-tests .bad')).toHaveCount(2);
  await page.locator('[data-wk-fare="ok"]').click();
  await expect(page.locator('.wk-tests .ok')).toHaveCount(2);
  await shot(page, 'project-fix');
  expect(errs).toEqual([]);
});

test('home week and import preview at this width', async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => localStorage.setItem('si.dv.seen', '["6"]'));
  const errs = await open(page, './?lang=zh#home');
  const week = page.locator('[data-week="empty"]');
  await expect(week).toBeVisible({ timeout: 20000 });
  await expect(week).toContainText('这一周');
  await expect(week).toContainText('这周还没有做题');
  await shot(page, 'home-week');

  await page.goto('./?lang=zh#R');
  await page.waitForTimeout(400);
  const code = await page.evaluate(() => {
    const json = JSON.stringify({ v: 1, d: { 'si.dv.seen': '["13"]', 'si.rv': '{"qb":{"b":0,"due":4,"t":4,"w":0,"f":1}}' } });
    const b64 = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return 'SI1.' + b64;
  });
  await page.locator('[data-code="in"]').fill(code);
  await page.locator('[data-code="imp"]').click();
  const preview = page.locator('[data-code-preview]');
  await expect(preview).toBeVisible();
  await expect(page.locator('[data-code-older]')).toBeVisible();
  await expect(page.locator('[data-code="merge"]')).toBeVisible();
  await expect(page.locator('[data-code="yes"]')).toBeVisible();
  await preview.scrollIntoViewIfNeeded();
  await shot(page, 'import-preview');
  expect(errs).toEqual([]);
});
