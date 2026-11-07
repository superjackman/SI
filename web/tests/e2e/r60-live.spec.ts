// After the demo moves, the check uses that state. A wrong tap explains only itself.
import { test, expect, type Page } from '@playwright/test';
import { ML } from '../../src/dv/mld';

const ML6 = ML['6']!.goals[0]!.pr;
const ML7 = ML['7']!.goals[0]!.pr;
const ML10 = ML['10']!.goals[0]!.pr;

const ORIGIN = 'http://localhost:' + (process.env.SI_E2E_PORT || '4173');
const DONE = [{ name: 'si.fs', value: '0' }, { name: 'si.a2hs', value: '1' }, { name: 'si.onb', value: '1' }];
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: DONE }] } });

async function open(p: Page, q: string) {
  const errs: string[] = [];
  p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(q);
  await p.locator('#l4').waitFor({ state: 'attached', timeout: 30000 });
  await p.waitForTimeout(500);
  return errs;
}
const go = (p: Page, h: string) => p.evaluate((x) => { location.replace(x); }, h);
async function cont(p: Page) {
  if (await p.locator('.ml-pr').count()) return;
}
test('stations 6, 7 and 10: the check is that part’s own question, and a wrong tap can be retried', async ({ page }) => {
  const errs = await open(page, './?lang=zh#D/6');
  await page.locator('[data-dm="emb"] input[data-vs="ang"]').waitFor({ state: 'attached' });
  await cont(page);
  const own = ML6;
  const pr = page.locator('.ml-pr');
  await expect(pr).toContainText(own.q[0].slice(0, 8));
  await expect(pr).not.toContainText('夹角拖到');
  const wrong = (own.a + 1) % 3;
  await pr.locator(`[data-ml-p="${wrong}"]`).click();
  await expect(pr.locator('.ml-dead')).toHaveCount(1);
  await expect(pr.locator('.ml-live')).toHaveCount(0);
  await expect(pr).toContainText('对不上这道题里的数');
  await expect(pr).not.toContainText('对了');
  await pr.locator(`[data-ml-p="${own.a}"]`).click();
  await expect(pr.locator('.ml-live')).toHaveCount(1);
  await expect(pr).toContainText('对了');

  await go(page, '#D/7');
  await expect(page.locator('#l4')).toHaveAttribute('data-px', 'D/7.zh');
  await cont(page);
  await expect(page.locator('.ml-pr')).toContainText(ML7.q[0].slice(0, 8));
  await expect(page.locator('.ml-pr')).not.toContainText('滑块在');

  await go(page, '#D/10');
  await expect(page.locator('#l4')).toHaveAttribute('data-px', 'D/10.zh');
  await expect(page.locator('.ly-dep, .ly-pg, .ml-bar, .st-tabs, .st-side')).toHaveCount(0);
  await expect(page.locator('.ly-l:not([hidden])')).toHaveCount(5);
  await expect(page.locator('.ml-pr')).toContainText(ML10.q[0].slice(0, 8));
  await expect(page.locator('.ml-pr')).not.toContainText('滑块在');
  expect(errs).toEqual([]);
});
