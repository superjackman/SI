// After the demo moves, the check uses that state. A wrong tap explains only itself.
import { test, expect, type Page } from '@playwright/test';
import { liveQ, type DemoSnap } from '../../src/dv/liveq';

const DEMO0: DemoSnap = { eta: 0.3, n: 4, T: 1, dk: 3, pred: 4, ang: 40, layer: 0, rank: 4, len: 4, hit: 1 };

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
async function cont(p: Page, s: 'r' | 'v') {
  const cur = await p.locator('.ly.ml').getAttribute('data-ml-s');
  if (cur === 'i') {
    for (let i = 0; i < 3 && await p.locator('[data-ml-to="r"]').count() === 0; i++) {
      const b = p.locator(`[data-ml-o="${i}"]:not([aria-disabled="true"])`);
      if (await b.count()) await b.click();
    }
    await p.locator('[data-ml-to="r"]').click();
  }
  if (s === 'v') await p.locator('[data-ml-to="v"]').click();
}
const setRange = (p: Page, sel: string, value: string) => p.locator(sel).evaluate((el, v) => {
  const i = el as HTMLInputElement;
  i.value = v;
  i.dispatchEvent(new Event('input', { bubbles: true }));
}, value);

test('stations 6, 7 and 10: the check follows the demo, and a wrong tap can be retried', async ({ page }) => {
  const errs = await open(page, './?lang=zh#D/6');
  await page.locator('[data-dm="emb"] input[data-vs="ang"]').waitFor({ state: 'attached' });
  await setRange(page, '[data-dm="emb"] input[data-vs="ang"]', '90');
  await cont(page, 'v');
  const emb = liveQ('6', 0, { k: 'emb', s: { ...DEMO0, ang: 90 } })!;
  const pr = page.locator('.ml-pr');
  await expect(pr).toContainText('90');
  await expect(pr.locator(`[data-ml-p="${emb.a}"]`)).toContainText(emb.o[emb.a]![0]);
  const wrong = (emb.a + 1) % 3;
  await pr.locator(`[data-ml-p="${wrong}"]`).click();
  await expect(pr.locator('.ml-dead')).toHaveCount(1);
  await expect(pr.locator('.ml-live')).toHaveCount(0);
  await expect(pr).toContainText('还可以再选');
  await expect(pr).not.toContainText('对了');
  await pr.locator(`[data-ml-p="${(emb.a + 2) % 3}"]`).click();
  await expect(pr.locator('.ml-dead')).toHaveCount(2);
  await expect(pr.locator('.ml-live')).toHaveCount(0);
  await pr.locator(`[data-ml-p="${emb.a}"]`).click();
  await expect(pr.locator('.ml-live')).toHaveCount(1);
  await expect(pr).toContainText('对了');
  await setRange(page, '[data-dm="emb"] input[data-vs="ang"]', '40');
  const back = liveQ('6', 0, { k: 'emb', s: { ...DEMO0, ang: 40 } })!;
  await expect(pr).toContainText('40');
  await expect(pr.locator('.ml-live')).toHaveCount(0);
  await expect(pr.locator(`[data-ml-p="${back.a}"]`)).toContainText(back.o[back.a]![0]);

  await go(page, '#D/7');
  await expect(page.locator('#l4')).toHaveAttribute('data-px', 'D/7.zh');
  await page.locator('[data-morph] input').waitFor({ state: 'attached' });
  await setRange(page, '[data-morph] input', '0');
  await cont(page, 'v');
  const life = liveQ('7', 0, null)!;
  await expect(page.locator('.ml-pr')).toContainText('0%');
  await expect(page.locator('.ml-pr')).toContainText(life.o[0]![0].slice(0, 6));
  await setRange(page, '[data-morph] input', '100');
  const math = liveQ('7', 1, null)!;
  await expect(page.locator('.ml-pr')).toContainText('100%');
  await expect(page.locator(`.ml-pr [data-ml-p="${math.a}"]`)).toContainText(math.o[math.a]![0].slice(0, 6));

  await go(page, '#D/10');
  await expect(page.locator('#l4')).toHaveAttribute('data-px', 'D/10.zh');
  await cont(page, 'r');
  const row = await page.evaluate(() => {
    const d = document.querySelector('.ly-dep')!.getBoundingClientRect();
    const g = document.querySelector('.ly-pg')!.getBoundingClientRect();
    const b = document.querySelector('.ml-bar')!.getBoundingClientRect();
    const t = document.querySelector('.ly-top')!.getBoundingClientRect();
    const h = (sel: string) => document.querySelector(sel)!.getBoundingClientRect().height;
    return { same: Math.abs(d.top - g.top) < 8 && Math.abs(d.top - b.top) < 8, bar: t.height, dep: h('.ly-dep button'), dot: h('.ly-pg button') };
  });
  expect(row.same).toBe(true);
  expect(row.bar).toBeLessThan(72);
  expect(row.dep).toBeGreaterThanOrEqual(44);
  expect(row.dot).toBeGreaterThanOrEqual(44);
  await setRange(page, '[data-morph] input', '100');
  await cont(page, 'v');
  const ten = liveQ('10', 1, null)!;
  await expect(page.locator('.ml-pr')).toContainText('100%');
  await expect(page.locator(`.ml-pr [data-ml-p="${ten.a}"]`)).toContainText(ten.o[ten.a]![0].slice(0, 4));
  expect(errs).toEqual([]);
});
