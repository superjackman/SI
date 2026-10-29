import { test, expect, type Page } from '@playwright/test';
/* R41b / G4: the settings sheet from the reference. Gear in the top bar → 设置 with 语言 / 动画 / 清除学习记录 / 完成.
   No 声音 row: the site has no sound or vibration, so a sound switch would do nothing. */
const ORIGIN = 'http://localhost:4173';
const REC = ['si.l4.seen', 'si.l4.cards', 'si.px.log', 'si.px.days', 'si.px.q'];
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: [{ name: 'si.fs', value: '0' }, { name: 'si.a2hs', value: '1' },
  ...REC.map((name) => ({ name, value: '["x"]' })), { name: 'si.l4.my', value: '{"keep":1}' }] }] } });
async function open(p: Page, q: string) {
  const errs: string[] = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(q); await p.waitForFunction(() => document.getElementById('l4')?.dataset.ready === '1', null, { timeout: 30000 });
  return errs;
}
const ls = (p: Page, k: string) => p.evaluate((x) => localStorage.getItem(x), k);

test.describe('R41b settings sheet (G4)', () => {
  test('gear opens 设置; language, animation and clear work and persist', async ({ page }) => {
    const errs = await open(page, './?lang=zh#L4');
    const gear = page.locator('[data-a=set]');
    await expect(gear).toBeVisible(); await expect(gear).toHaveAttribute('aria-label', '设置');
    await gear.click();
    const dlg = page.locator('.l4-set[role=dialog]');
    await expect(dlg).toBeVisible(); await expect(dlg).toContainText('设置');
    await expect(dlg).toContainText('语言'); await expect(dlg).toContainText('动画'); await expect(dlg).toContainText('清除学习记录');
    await expect(dlg).not.toContainText('声音');
    // fits the viewport, nothing under 12px
    const vp = page.viewportSize()!;
    const bb = (await dlg.boundingBox())!;
    expect(bb.x).toBeGreaterThanOrEqual(0); expect(bb.y).toBeGreaterThanOrEqual(0);
    expect(bb.x + bb.width).toBeLessThanOrEqual(vp.width + 0.5); expect(bb.y + bb.height).toBeLessThanOrEqual(vp.height + 0.5);
    const small = await dlg.evaluate((el) => [...el.querySelectorAll('*')].filter((e) => e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()) && parseFloat(getComputedStyle(e).fontSize) < 12).map((e) => e.textContent));
    expect(small).toEqual([]);

    // animation off → html[data-anim=off], si.anim=0, no SMIL motion, CSS animations stopped; persists over reload
    const sw = dlg.locator('.l4-sw[role=switch]');
    const was = await sw.getAttribute('aria-checked');
    if (was === 'false') { await sw.click(); await expect(sw).toHaveAttribute('aria-checked', 'true'); }
    await sw.click();
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    await expect(page.locator('html')).toHaveAttribute('data-anim', 'off');
    expect(await ls(page, 'si.anim')).toBe('0');
    expect(await page.locator('animateMotion').count()).toBe(0);
    expect(await page.evaluate(() => [...document.querySelectorAll('*')].filter((e) => { const s = getComputedStyle(e); return s.animationName !== 'none' && s.animationPlayState === 'running'; }).length)).toBe(0);

    // clear → confirm step → record keys gone, trained model kept
    await dlg.locator('.l4-clr').click();
    const cfm = dlg.locator('.l4-cfm'); await expect(cfm).toBeVisible();
    await cfm.locator('[data-v=no]').click(); await expect(cfm).toHaveCount(0);
    for (const k of REC) expect(await ls(page, k)).not.toBeNull();
    await dlg.locator('.l4-clr').click(); await dlg.locator('.l4-cfm [data-v=yes]').click();
    await expect(dlg.locator('.l4-sok')).toBeVisible();
    for (const k of REC) expect(await ls(page, k)).toBeNull();
    expect(await ls(page, 'si.l4.my')).toBe('{"keep":1}');

    // language → English, persisted
    await dlg.locator('.l4-seg [data-v=en]').click();
    await expect(page.locator('.l4-set')).toContainText('Settings');
    await expect(page.locator('.l4-set .l4-seg [data-v=en]')).toHaveAttribute('aria-pressed', 'true');
    expect(await ls(page, 'aiexp.lang')).toContain('en');

    // 完成 closes
    await page.locator('.l4-set [data-v=done]').click();
    await expect(page.locator('.l4-set')).toHaveCount(0);
    await expect(page.locator('[data-a=set]')).toHaveAttribute('aria-label', 'Settings');

    await page.goto('./#L4'); await page.waitForFunction(() => document.getElementById('l4')?.dataset.ready === '1', null, { timeout: 30000 });
    await expect(page.locator('html')).toHaveAttribute('data-anim', 'off');
    await expect(page.locator('[data-a=set]')).toHaveAttribute('aria-label', 'Settings');
    expect(await page.locator('animateMotion').count()).toBe(0);
    // Esc closes too
    await page.locator('[data-a=set]').click(); await expect(page.locator('.l4-set')).toBeVisible();
    await page.keyboard.press('Escape'); await expect(page.locator('.l4-set')).toHaveCount(0);
    expect(errs).toEqual([]);
  });
});
