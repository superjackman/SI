import { test, expect, type Page } from '@playwright/test';
/* R41: the L4 screens follow the reference images: title / worked example / live question (→ ?) on top, the reference crumbs,
   a four-row info box with a tall gold 知识卡 button on the right (no title row), round 地图 / 进度 / 下一步 buttons with
   the words inside, and the reference info rows with this site's real numbers. */
const ORIGIN = 'http://localhost:4173';
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: [{ name: 'si.fs', value: '0' }, { name: 'si.a2hs', value: '1' }, { name: 'si.onb', value: '1' }] }] } });
async function open(p: Page, q: string) {
  const errs: string[] = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(q); await p.waitForFunction(() => document.getElementById('l4')?.dataset.ready === '1', null, { timeout: 30000 });
  return errs;
}
const go = async (p: Page, h: string) => { await p.evaluate((x) => { location.hash = x; }, h); await p.waitForTimeout(250); };

test.describe('R41 reference layout', () => {
  test('overview, training, use and drill-down pages match the reference frame', async ({ page }) => {
    const errs = await open(page, './?lang=zh#L4');
    await expect(page.locator('.l4-tt')).toHaveText('Transformer：一堆字变成下一个字');
    await expect(page.locator('.l4-crumb')).toHaveText(/首页\s*›\s*第4层 Transformer 内部\s*›\s*全貌/);
    await expect(page.locator('.l4-mp')).toBeHidden();
    await expect(page.locator('.l4-ih')).toHaveCount(0);
    const kb = page.locator('.l4-info .l4-kb');
    await expect(kb).toHaveText('知识卡'); await expect(kb).toHaveAttribute('data-k', 'K01');
    const r = (await kb.boundingBox())!; expect(r.height).toBeGreaterThan(r.width); // a tall button, as in the reference
    await expect(page.locator('.l4-info dd').first()).toHaveText('把一段字变成「下一个字」的概率');
    // R44: ↑ / ☰ / ⚙ / EN are square icon buttons in the top bar; walking is the bottom step bar
    for (const [a, t] of [['back', '↑'], ['menu', '☰'], ['set', '⚙']] as const) {
      const b = page.locator(`.l4-top [data-a="${a}"]`); await expect(b).toHaveText(t);
      const q = (await b.boundingBox())!; expect(q.width).toBeGreaterThanOrEqual(page.viewportSize()!.width <= 380 ? 34 : 36); // ≤380 px: 34 px (+4 px hit ring) so the title keeps its room expect(Math.abs(q.width - q.height)).toBeLessThan(2);
    }
    await go(page, '#L4/tr/4');
    await expect(page.locator('.l4-tt')).toHaveText('例题：天空是什么颜色？ → 蓝');
    await expect(page.locator('.l4-crumb')).toHaveText(/^首页\s*›\s*第4层\s*›\s*看它怎么训练\s*›\s*④算误差$/);
    await expect(page.locator('.l4-hint')).toHaveText('› 进入下一层 · ⓘ 当前页看说明 · 底部切换上一步/下一步');
    for (const a of ['prev', 'next']) { const q = (await page.locator(`.l4-nav [data-a="${a}"]`).boundingBox())!; expect(q.height).toBeGreaterThanOrEqual(44); expect(q.width).toBeGreaterThanOrEqual(88); }
    await expect(page.locator('.l4-nav .g-n')).toHaveText('4 / 6');
    // the reference's −ln(12%) ≈ 2.1 is an example; here the real first-guess odds for 蓝 and their loss
    const how = await page.locator('.l4-info dd').nth(2).textContent();
    const m = /−ln\(([\d.]+)%\)≈([\d.]+)/.exec(how ?? ''); expect(m).not.toBeNull();
    expect(Math.abs(-Math.log(+m![1]! / 100) - +m![2]!)).toBeLessThan(0.06);
    await go(page, '#L4/us/5');
    await expect(page.locator('.l4-chips')).toHaveText('天空是什么颜色？→?');
    await go(page, '#L4/my/1');
    await expect(page.locator('.l4-tt')).toHaveText('自己出题，训练小模型');
    await go(page, '#L4/x/att.mask');
    await expect(page.locator('.l4-crumb')).toContainText('多头注意力'); await expect(page.locator('.l4-crumb')).toContainText('遮罩');
    await expect(page.locator('.l4-info dd').first()).toHaveText('让每个字只看自己和前面的字');
    await go(page, '#L4/x/att.dot');
    await expect(page.locator('.l4-info dd').nth(2)).toHaveText('对应相乘再相加，排成 8×8 表');
    // maths pages carry the live question → ? as in the reference, and bold info labels
    await go(page, '#L5/M1a'); await page.waitForTimeout(400);
    await expect(page.locator('.lx-cps').first()).toHaveText('天空是什么颜色？→?');
    expect(+(await page.locator('.l4-info dt').first().evaluate((e) => getComputedStyle(e).fontWeight))).toBeGreaterThanOrEqual(700);
    // training / use steps open with the reference step title; the dot-product page shows the reference pipeline strip
    await go(page, '#L4/tr/1'); await expect(page.locator('.l4-pn h4.l4-ph').first()).toHaveText('① 准备例题');
    await go(page, '#L4/us/9'); await expect(page.locator('.l4-pn h4.l4-ph').first()).toHaveText(/^⑨/);
    await go(page, '#L4/x/att.dot'); await expect(page.locator('.l4-pipe span.on')).toHaveText('点积'); await expect(page.locator('.l4-pipe span')).toHaveCount(8);
    // knowledge cards carry the reference footer hint
    await go(page, '#L4~K01'); await page.waitForTimeout(500);
    await expect(page.locator('.l4-sheet .l4-sfh')).toHaveText('下滑或点 ✕ 关闭（只是收起卡片，不换页）');
    // maths cards: inline gold formulas and 「看它在哪用 ›」 back to the M page, like the reference
    await go(page, '#L5~KM08'); await page.waitForTimeout(500);
    await expect(page.locator('.l4-sheet .l4-sfh')).toHaveText(/^下滑或点 ✕ 关闭（只是收起卡片，不换页）.*对应第5层·梯度$/);
    expect(await page.locator('.l4-sheet .formula').first().evaluate((e) => getComputedStyle(e).display)).toBe('inline');
    await page.locator('.l4-sheet .l4-b[data-s=jump]').click(); await expect(page).toHaveURL(/#L5\/M6a$/);
    expect(errs).toEqual([]);
  });
});
