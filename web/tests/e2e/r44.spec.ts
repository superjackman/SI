import { test, expect, type Page } from '@playwright/test';
/* R44: one way to move everywhere — the bottom step bar (‹ 上一步 · dots · n / N · 下一步 ›) on layer pages, the L4 walks,
   quiz, experiments, card pages and onboarding; ↑ goes up one level; ☰ opens the map / progress sheet; sharing is a dialog
   (preview on top, format switch, ✕ / Esc / backdrop close, an honest empty state). */
const ORIGIN = 'http://localhost:4173';
const DONE = [{ name: 'si.fs', value: '0' }, { name: 'si.a2hs', value: '1' }, { name: 'si.onb', value: '1' }];
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: DONE }] } });
async function open(p: Page, q: string) {
  const errs: string[] = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(q); await p.locator('#l4').waitFor({ state: 'attached', timeout: 30000 }); await p.waitForTimeout(800);
  return errs;
}
const hashTo = async (p: Page, h: string) => { await p.evaluate((x) => { location.hash = x; }, h); await p.waitForTimeout(400); };
const nav = (p: Page, a: string) => p.locator(`.l4-nav [data-a="${a}"]`);
const re = (h: string) => new RegExp(h.replace(/[/?]/g, '\\$&') + '$');

test.describe('R44 step bar', () => {
  test('layer pages: next / prev / counter / dots', async ({ page }) => {
    const errs = await open(page, './?lang=zh#L1/2');
    const n = page.locator('.l4-nav .g-n'); const t0 = (await n.textContent())!; const m = /^(\d+) \/ (\d+)$/.exec(t0.trim())!; expect(m).toBeTruthy();
    await expect(page.locator('.l4-nav .g-dots [data-a="dot"]')).toHaveCount(Number(m[2]));
    await nav(page, 'next').click(); await expect(page).toHaveURL(re('#L1/3')); await expect(n).toHaveText(`${+m[1]! + 1} / ${m[2]}`);
    await nav(page, 'prev').click(); await expect(page).toHaveURL(re('#L1/2')); await expect(n).toHaveText(t0.trim());
    await page.locator('.l4-nav [data-a="dot"][data-i="0"]').click(); await expect(n).toHaveText(`1 / ${m[2]}`);
    expect(errs).toEqual([]);
  });
  test('L4 walk: prev and next move one step', async ({ page }) => {
    const errs = await open(page, './?lang=zh#L4/tr/4');
    await expect(page.locator('.l4-nav .g-n')).toHaveText('4 / 6');
    await nav(page, 'prev').click(); await expect(page).toHaveURL(/tr\/3$/); await expect(page.locator('.l4-nav .g-n')).toHaveText('3 / 6');
    await nav(page, 'next').click(); await expect(page).toHaveURL(/tr\/4$/);
    expect(errs).toEqual([]);
  });
  test('quiz: prev off on question 1, next waits for an answer', async ({ page }) => {
    const errs = await open(page, './?lang=zh#P/q1');
    await expect(nav(page, 'prev')).toBeDisabled();
    await expect(nav(page, 'next')).toBeDisabled();
    await page.locator('[data-px="pick:0"]').click(); await expect(nav(page, 'next')).toBeEnabled();
    await nav(page, 'next').click(); await expect(page.locator('.px-qh b')).toContainText('第 2 题'); await expect(nav(page, 'prev')).toBeEnabled();
    await nav(page, 'prev').click(); await expect(page.locator('.px-qh b')).toContainText('第 1 题');
    expect(errs).toEqual([]);
  });
  test('experiments: prev / next across labs, the last one leads to the quiz', async ({ page }) => {
    const errs = await open(page, './?lang=zh#P/x2');
    await nav(page, 'prev').click(); await expect(page).toHaveURL(re('#P/x1'));
    await nav(page, 'next').click(); await expect(page).toHaveURL(re('#P/x2'));
    await hashTo(page, '#P/x5'); await nav(page, 'next').click(); await expect(page).toHaveURL(re('#P/q1'));
    expect(errs).toEqual([]);
  });
  test('card sheet: page 1 / 2 with ‹ 上页 · 下页 ›', async ({ page }) => {
    await open(page, './?lang=zh#L4~K06'); const sh = page.locator('.l4-sheet[data-card="K06"]');
    await expect(sh.locator('.g-prev')).toBeDisabled(); await sh.locator('.g-next').click(); await expect(sh).toHaveAttribute('data-p', '2');
    await expect(sh.locator('.g-next')).toBeDisabled(); await sh.locator('.g-prev').click(); await expect(sh).toHaveAttribute('data-p', '1');
  });
  test('onboarding: 上一步 / 下一步 through three steps, 跳过 closes', async ({ page }) => {
    await page.addInitScript(() => { if (!sessionStorage.getItem('r44')) { sessionStorage.setItem('r44', '1'); localStorage.removeItem('si.onb'); } });
    await open(page, './?lang=zh#home'); const ob = page.locator('.l4-ob'); await expect(ob).toBeVisible();
    const n = ob.locator('.g-n'); await expect(n).toHaveText('1 / 3'); await expect(ob.locator('[data-o="prev"]')).toBeDisabled();
    await ob.locator('[data-o="next"]').click(); await expect(n).toHaveText('2 / 3');
    await expect(ob.locator('.g-jump')).toHaveCount(1); await expect(ob.locator('.g-info')).toHaveCount(1); await expect(ob.locator('.g-act')).toHaveCount(1);
    await ob.locator('[data-o="prev"]').click(); await expect(n).toHaveText('1 / 3');
    await ob.locator('[data-o="next"]').click(); await ob.locator('[data-o="next"]').click(); await expect(n).toHaveText('3 / 3');
    await expect(ob.locator('[data-o="quick"]')).toBeVisible(); await expect(ob.locator('[data-o="next"]')).toHaveCount(0);
    await ob.locator('.ob-skip').click(); await expect(ob).toHaveCount(0);
  });
});

test.describe('R44 ↑ and ☰', () => {
  test('↑ goes up one level', async ({ page }) => {
    const errs = await open(page, './?lang=zh#L1/2');
    const up = page.locator('.l4-top [data-a="back"]');
    await up.click(); await expect(page).toHaveURL(re('#L1'));
    await up.click(); await expect(page).toHaveURL(re('#home'));
    await hashTo(page, '#L4/tr/3'); await up.click(); await expect(page).toHaveURL(re('#L4'));
    await hashTo(page, '#P/q1'); await up.click(); await expect(page).toHaveURL(re('#P'));
    expect(errs).toEqual([]);
  });
  test('☰ opens the map with a progress tab and closes', async ({ page }) => {
    const errs = await open(page, './?lang=zh#L4/us/2');
    await page.locator('.l4-top [data-a="menu"]').click(); const ms = page.locator('.l4-ms'); await expect(ms).toBeVisible();
    const tabs = ms.locator('[role="tab"]'); await expect(tabs).toHaveCount(2); await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    await expect(ms.locator('a.here')).toHaveCount(1);
    await tabs.nth(1).click(); await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true'); await expect(ms.locator('.l4-mpg .rw')).toHaveCount(5); await expect(ms.locator('a.here')).toHaveCount(0);
    await tabs.first().click(); await expect(ms.locator('a.here')).toHaveCount(1);
    await ms.locator('[data-s="x"]').click(); await expect(ms).toHaveCount(0); await expect(page).toHaveURL(/us\/2$/);
    expect(errs).toEqual([]);
  });
});

test.describe('R44 share dialog', () => {
  test('#S: preview in a dialog, format switch, ✕ / Esc / backdrop close, empty state', async ({ page }) => {
    const errs = await open(page, './?lang=zh#P'); await hashTo(page, '#S/KA04.k');
    const m = page.locator('.px-s.g-modal'), dlg = m.locator('.g-dlg'), pv = dlg.locator('.g-pv');
    await expect(dlg).toBeVisible(); await expect(pv.locator('img')).toBeVisible();
    const db = (await dlg.boundingBox())!, vb = page.viewportSize()!; expect(db.y).toBeGreaterThanOrEqual(0); expect(db.y + db.height).toBeLessThanOrEqual(vb.height + 1);
    await expect(pv).toHaveAttribute('data-h', '1920');
    await dlg.locator('[data-px="fmt:post"]').click(); await expect(pv).toHaveAttribute('data-h', '1350'); await expect(dlg.locator('[data-px="fmt:post"]')).toHaveAttribute('aria-checked', 'true');
    await dlg.locator('[data-px="fmt:story"]').click(); await expect(pv).toHaveAttribute('data-h', '1920');
    await dlg.locator('.g-x').click(); await expect(page).toHaveURL(re('#P')); await expect(m).toHaveCount(0);
    await hashTo(page, '#S/KA04.k'); await expect(dlg).toBeVisible(); await page.keyboard.press('Escape'); await expect(page).toHaveURL(re('#P'));
    await hashTo(page, '#S/KA04.k'); await expect(dlg).toBeVisible(); await m.click({ position: { x: 2, y: 2 } }); await expect(page).toHaveURL(re('#P'));
    await hashTo(page, '#S/KA04.k'); await dlg.locator('[data-px="kind:m"]').click();
    await expect(dlg.locator('.g-pv .g-emt')).toBeVisible(); await expect(dlg.locator('.g-pv img')).toHaveCount(0);
    await expect(dlg.locator('[data-px="save"]')).toBeDisabled(); await expect(dlg.locator('[data-px="share"]')).toBeDisabled();
    await expect(dlg.locator('[data-px="fmt:post"]')).toBeEnabled();
    expect(errs).toEqual([]);
  });
  test('card share: dialog over the card, Esc and backdrop close it, the card stays', async ({ page }) => {
    await open(page, './?lang=zh#L4~K06'); const sh = page.locator('.l4-sheet[data-card="K06"]');
    const shm = page.locator('.l4-shm');
    await sh.locator('[data-s="share"]').click(); await expect(shm.locator('.g-dlg')).toBeVisible(); await expect(shm.locator('.g-pv')).toHaveAttribute('data-kind', 'card');
    await page.keyboard.press('Escape'); await expect(shm).toHaveCount(0); await expect(sh).toBeVisible();
    await sh.locator('[data-s="share"]').click(); await expect(shm.locator('.g-dlg')).toBeVisible();
    await shm.click({ position: { x: 2, y: 2 } }); await expect(shm).toHaveCount(0); await expect(sh).toBeVisible();
  });
});
