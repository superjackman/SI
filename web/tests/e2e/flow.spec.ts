import { test, expect, type Page } from '@playwright/test';
import { DV_KEY, DV_N } from '../../src/dv/links';
import { ML } from '../../src/dv/mld';
import { varQ } from '../../src/vf/var';

/* Empty storage: home → station 0 → … → 16. One forward control on each screen, and no solid skip before the station is done. */
const ORIGIN = 'http://localhost:' + (process.env.SI_E2E_PORT || '4173');
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: [] }] } });

const num = (a: number, d: number) => String(Number(a.toFixed(Math.max(d, 2))));
const fwd = (p: Page) => p.locator('[data-fwd="1"]:visible');

async function oneForward(p: Page, where: string) {
  const n = await fwd(p).count();
  expect(n, where).toBe(1);
  const inColumn = await p.locator('.hm [data-fwd="1"]:visible, .dv [data-fwd="1"]:visible').count();
  expect(inColumn, where).toBe(1);
  await expect(p.locator('.g-next:visible'), where).toHaveCount(0);
  await expect(p.locator('.dv-so:visible'), where).toHaveCount(0);
}

test('empty storage walks station 0 through 16 with one forward and no skip', async ({ page }) => {
  test.setTimeout(900_000);
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto('./?lang=zh#home');
  await page.locator('.hm-cta').waitFor();
  await oneForward(page, 'home');
  await expect(page.locator('.hm-cta')).toHaveAttribute('data-go', '#D/0');
  await expect(page.locator('.hm-pos')).toContainText(`1/${DV_N}`);
  await page.locator('.hm-cta').click();

  for (let i = 0; i < DV_KEY.length; i++) {
    const k = DV_KEY[i]!;
    await expect(page).toHaveURL(new RegExp(`#D/${k}$`));
    await page.waitForFunction((key) => document.querySelector('.ly.ml')?.getAttribute('data-ml-k') === key, k);
    await expect(page.locator('.ml-q').first()).toBeInViewport();
    await expect(page.locator('.dv-lead')).toBeInViewport();
    await expect(page.locator('.ml-dy:visible')).toHaveCount(0);
    await expect(page.locator('.dv-nx:visible')).toHaveCount(0);
    await expect(page.locator('.dv-pos')).toContainText(`第 ${i + 1}/${DV_N} 站`);
    await expect(page.locator('.l4-tt')).toContainText(`第 ${i + 1}/${DV_N} 站`);
    await oneForward(page, `enter ${k}`);
    const goals = ML[k]!.goals;
    for (let g = 0; g < goals.length; g++) {
      const G = goals[g]!;
      await page.locator(`.ml-i [data-ml-o="${G.a}"]`).click();
      await oneForward(page, `${k} after choice ${g}`);
      await page.locator('[data-ml-to="r"]').click();
      await oneForward(page, `${k} reason ${g}`);
      await expect(page.locator('.ly-nx .ly-go:visible')).toHaveCount(0);
      await page.locator('[data-ml-to="v"]').click();
      await oneForward(page, `${k} check ${g}`);
      await page.locator(`.ml-pr [data-ml-p="${G.pr.a}"]`).click();
      for (const vi of [0, 1]) {
        const q = varQ(G.vk, vi);
        await page.locator('.ml-in').fill(num(q.a, q.d));
        await page.locator('[data-ml-ck]').click();
        await expect(page.locator('.ml-fb.ok').last()).toBeVisible();
        if (vi === 0) await page.locator('[data-ml-again]').click();
      }
      if (g < goals.length - 1) await page.locator('[data-ml-next]').click();
    }
    await expect(page.locator('.dv-sp')).toHaveAttribute('data-done', '1');
    await expect(page.locator('.dv-take:visible li')).toHaveCount(3);
    await oneForward(page, `done ${k}`);
    if (i < DV_KEY.length - 1) await page.locator('.dv-nx').click();
    else await page.locator('.dv-end [data-fwd="1"]').click();
  }
  await expect(page).toHaveURL(/#me$/);
  expect(errs).toEqual([]);
});

test('next day opens the station that was entered and not finished, with reviews under that card', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-07T10:00:00+08:00') });
  await page.goto('./?lang=zh#home');
  await page.locator('.hm-cta').click();
  await expect(page).toHaveURL(/#D\/0$/);
  await page.locator('.ml-q').first().waitFor();
  await page.clock.setSystemTime(new Date('2026-11-08T10:00:00+08:00'));
  await page.evaluate(() => localStorage.setItem('si.rv', JSON.stringify({ s0a: { b: 0, due: 1, t: 1, w: 1, f: 0 } })));
  await page.goto('./?lang=zh#home');
  await expect(page.locator('.hm-card').first()).toHaveClass(/hm-go/);
  await expect(page.locator('.hm-gt')).toHaveText('用样本找函数');
  await expect(page.locator('.hm-cta')).toHaveAttribute('data-go', '#D/0');
  await expect(page.locator('.hm-go em')).toContainText('1/23');
  await expect(page.locator('.hm-go')).not.toContainText('0/10');
  await expect(page.locator('.hm-ratios')).toBeVisible();
  await expect(page.locator('.hm-ratio')).toHaveCount(4);
  await expect(page.locator('.hm-bell')).toHaveCount(0);
});
