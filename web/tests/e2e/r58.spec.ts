import { test, expect, type Page } from '@playwright/test';
import { textIssues } from './small-text.js';
import { contrastIssues } from './contrast.js';
/* Home entries, due-review banner, a 5-stop certificate, a pauseable drag, and station copy that does not name a procedure. */
const ORIGIN = 'http://localhost:' + (process.env.SI_E2E_PORT || '4173');
const DONE = [{ name: 'si.fs', value: '0' }, { name: 'si.a2hs', value: '1' }, { name: 'si.onb', value: '1' }];
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: DONE }] } });
async function open(p: Page, q: string) {
  const errs: string[] = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(q); await p.locator('#l4').waitFor({ state: 'attached', timeout: 30000 }); await p.waitForTimeout(500);
  return errs;
}
const px = (p: Page, v: string) => expect(p.locator('#l4')).toHaveAttribute('data-px', v);

test.describe('hub, reminder, certificate, demos', () => {
  test('three entries: news and tools link back to stations and show readership', async ({ page }) => {
    const errs = await open(page, './?lang=zh#home');
    await expect(page.locator('.hm-hub')).toContainText('学');
    await expect(page.locator('.hm-hub')).toContainText('查资讯');
    await page.locator('[data-h="tab:news"]').click();
    await expect(page.locator('[data-pane="news"] .hb-item').first()).toBeVisible();
    await expect(page.locator('[data-pane="news"]')).toContainText('读懂度');
    await expect(page.locator('[data-pane="news"]')).not.toContainText('往期留在下面');
    await expect(page.locator('[data-pane="news"]')).toContainText('2026-11-02');
    await expect(page.locator('[data-pane="news"] a[target="_blank"]').first()).toHaveAttribute('href', /^https:\/\//);
    await page.locator('[data-h="tab:tools"]').click();
    await expect(page.locator('[data-pane="tools"]')).toContainText('安全');
    await expect(page.locator('[data-pane="tools"] a[href="#D/S"]').first()).toBeVisible();
    const bad: string[] = [];
    for (const x of await page.evaluate(contrastIssues, { root: '.hm-hub, [data-pane="tools"]', min: 4.5, icon: 3 })) bad.push(x.txt);
    for (const x of await page.evaluate(textIssues, 12)) bad.push(`${x.k} ${x.txt}`);
    expect(bad).toEqual([]);
    expect(errs).toEqual([]);
  });
  test('a due review shows a banner; five mastered stops unlock a nameless certificate', async ({ page }) => {
    await page.addInitScript(() => {
      const day = (() => { const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); })();
      localStorage.setItem('si.rv', JSON.stringify({ s1a: { b: 0, due: day, t: day - 1, w: 1, f: 0 } }));
      const st = { m: [1, 1, 1], k: [2, 2, 2], v: [0, 0, 0], g: 0, s: 'v', p: [0, 0, 0] };
      localStorage.setItem('si.ml', JSON.stringify({ '0': st, P: st, '1': st, '2': st, '3': st }));
    });
    const errs = await open(page, './?lang=zh#home');
    await expect(page.locator('.hm-rv')).toContainText('上次错');
    await expect(page.locator('.hm-cta')).toBeVisible();
    await page.locator('[data-h="tab:learn"]').click();
    await page.evaluate(() => { location.hash = '#R'; });
    await px(page, 'R.zh');
    await expect(page.locator('[data-mm="cert"]')).toBeVisible();
    await page.locator('[data-mm="cert"]').click();
    const pv = page.locator('.g-pv');
    await expect(pv).toHaveAttribute('data-kind', 'cert');
    expect(await pv.getAttribute('data-text')).not.toMatch(/你好|欢迎/);
    expect(errs).toEqual([]);
  });
  test('station 1 drag can pause, and the page does not say 先猜 or 调查', async ({ page }) => {
    const errs = await open(page, './?lang=zh#D/1');
    await px(page, 'D/1.zh');
    const text = (await page.locator('.ml-goal, .ml-bar, .ly-top, .ml-i').allInnerTexts()).join('\n');
    expect(text).not.toMatch(/先猜|你会怎么做|调查|先预测|接着看|算一下|来算一下/);
    await expect(page.locator('.ml-ss, .ml-sg')).toHaveCount(0);
    expect((await page.locator('.ml-bar, .ly-pg').allInnerTexts()).join('\n')).not.toMatch(/[①②③④⑤]|问题|接着看|算一下/);
    if (await page.locator('[data-ml-to="r"]').count() === 0) {
      for (let i = 0; i < 3 && await page.locator('[data-ml-to="r"]').count() === 0; i++) await page.locator(`[data-ml-o="${i}"]`).click();
    }
    await page.locator('[data-ml-to="r"]').click();
    await page.locator('.ly-pg [data-ly-go="3"]').click();
    const play = page.locator('[data-dm="mse"] [data-vs="play"]');
    await expect(play).toBeVisible();
    await play.click();
    await expect(play).toHaveAttribute('aria-pressed', 'true');
    await play.click();
    await expect(play).toHaveAttribute('aria-pressed', 'false');
    expect(errs).toEqual([]);
  });
  test('share this stop: the card, title and link stay inside the sheet', async ({ page }) => {
    const errs = await open(page, './?lang=zh#D/0');
    const spill = async (tag: string) => {
      await page.locator('[data-ml-share]').click();
      const sheet = page.locator('.ml-share');
      await expect(sheet).toBeVisible();
      await expect(sheet.getByRole('button', { name: /保存图片|Save image/ })).toBeVisible();
      await expect(sheet.getByRole('button', { name: /复制链接|Copy link/ })).toBeVisible();
      await expect(sheet.getByRole('button', { name: /分享…|Share…/ })).toBeVisible();
      await expect(sheet.locator('img')).toBeVisible();
      await page.waitForFunction(() => { const img = document.querySelector<HTMLImageElement>('.ml-share img'); return !!img && img.complete && img.naturalWidth > 0; });
      const bad = await sheet.evaluate((root) => {
        const view = root.getBoundingClientRect(), out: string[] = [];
        if (view.width > innerWidth + 1) out.push(`sheet ${Math.round(view.width)} > ${innerWidth}`);
        for (const el of root.querySelectorAll<HTMLElement>('.g-dh, .g-pv img, .g-row, .g-meta')) {
          const r = el.getBoundingClientRect();
          const name = el.className || el.tagName;
          if (r.right > innerWidth + 1 || r.left < -1) out.push(`${name} x ${Math.round(r.left)}–${Math.round(r.right)}`);
        }
        return out;
      });
      expect(bad, tag).toEqual([]);
      await sheet.locator('[data-m="close"]').click();
      await expect(sheet).toHaveCount(0);
    };
    await spill('zh 0');
    await open(page, './?lang=en#D/15b');
    await spill('en 15b');
    expect(errs).toEqual([]);
  });
  test('a tool filter is part of the address and survives refresh and back', async ({ page }) => {
    const errs = await open(page, './?lang=zh#tools');
    await page.locator('[data-task="code"]').click();
    await expect(page).toHaveURL(/#tools\/t\/code$/);
    await expect(page.locator('[data-task="code"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.hb-list [data-tasks="write"]').first()).toBeHidden();
    await page.reload();
    await page.locator('[data-task="code"]').waitFor({ state: 'visible' });
    await expect(page.locator('[data-task="code"]')).toHaveAttribute('aria-selected', 'true');
    await page.goBack();
    await expect(page).toHaveURL(/#tools$/);
    await expect(page.locator('[data-task="all"]')).toHaveAttribute('aria-selected', 'true');
    expect(errs).toEqual([]);
  });
});
