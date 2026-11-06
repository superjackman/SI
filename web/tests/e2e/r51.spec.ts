import { test, expect, type Page } from '@playwright/test';
import { textIssues } from './small-text.js';
import { contrastIssues } from './contrast.js';
import { ML_AT_REASON } from './ml-open';
/* R51 逐层展开 pilot (steps 1, 2, 8a, 8b): a 5-part bar, 「懂了，下一层」, the depth switch 30 秒 / 5 分钟 / 深入 kept in
   localStorage, the softmax / bowl / block pictures and the attention animation (pause, step, reduced motion).
   Nothing adds a history entry; #D/8 still opens (as 8a); everything reads at 360 / 390 / 430 in zh and en. */
const ORIGIN = 'http://localhost:' + (process.env.SI_E2E_PORT || '4173');
const DONE = [{ name: 'si.fs', value: '0' }, { name: 'si.a2hs', value: '1' }, { name: 'si.onb', value: '1' },
  // R57: every station's micro-loop opens on 💡 推理, where the layered body lives
  { name: 'si.ml', value: ML_AT_REASON }];
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: DONE }] } });
async function open(p: Page, q: string) {
  const errs: string[] = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(q); await p.locator('#l4').waitFor({ state: 'attached', timeout: 30000 }); await p.waitForTimeout(600);
  return errs;
}
const hl = (p: Page) => p.evaluate(() => history.length);
const px = (p: Page, v: string) => expect(p.locator('#l4')).toHaveAttribute('data-px', v);
const go = (p: Page, h: string) => p.evaluate((x) => { location.replace(x); }, h);
const vis = (p: Page) => p.locator('.ly-l:not([hidden])');
const PILOT = ['1', '2', '8a', '8b'] as const;

test.describe('R51 layers', () => {
  test('5 分钟 by default: ① first, 懂了 opens ② and ③, then offers 深入; the bar jumps; depth and progress are kept; no history entries', async ({ page }) => {
    const errs = await open(page, './?lang=zh#D/2'); await px(page, 'D/2.zh'); const h0 = await hl(page);
    await expect(page.locator('.ly-dep [data-ly-d="m"]')).toHaveAttribute('aria-checked', 'true');
    await expect(vis(page)).toHaveCount(1); await expect(page.locator('.ly-l[data-ly="1"]')).toContainText('为什么要关心');
    await expect(page.locator('.ly-pg button')).toHaveCount(5);
    await page.locator('.ly-go').click(); await expect(vis(page)).toHaveCount(2); await expect(page.locator('.ly-bowl')).toBeVisible();
    await page.locator('.ly-go').click(); await expect(vis(page)).toHaveCount(3); await expect(page.locator('.ly-l[data-ly="3"] .vf-dm[data-dm="gd"]')).toBeVisible();
    await expect(page.locator('.vf-qz')).toBeHidden();
    await expect(page.locator('.ly-go')).toContainText('深入');
    await page.locator('.ly-go').click(); await expect(vis(page)).toHaveCount(4); await expect(page.locator('.ly-dep [data-ly-d="d"]')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('.ly-fx .ly-q')).toContainText('∂L/∂w1');
    await page.locator('.ly-pg [data-ly-go="5"]').click(); await expect(vis(page)).toHaveCount(5); await expect(page.locator('.vf-qz')).toBeVisible();
    await expect(page.locator('.ly-end')).toBeVisible();
    // 30 秒 shows only ①, and switching back up keeps what was opened
    await page.locator('.ly-dep [data-ly-d="s"]').click(); await expect(vis(page)).toHaveCount(1); await expect(page.locator('.ly-go')).toContainText('5 分钟');
    await page.locator('.ly-dep [data-ly-d="d"]').click(); await expect(vis(page)).toHaveCount(5);
    expect(await page.evaluate(() => [localStorage.getItem('si.ly.depth'), JSON.parse(localStorage.getItem('si.ly.open') || '{}')['D/2']])).toEqual(['d', 5]);
    await page.reload(); await page.locator('#l4').waitFor({ state: 'attached' }); await px(page, 'D/2.zh'); await expect(vis(page)).toHaveCount(5);
    // the depth carries to the other pilot pages; a page not yet read starts at ① (one idea per screen), tapping 深入 opens it all
    await go(page, '#D/1'); await px(page, 'D/1.zh'); await expect(vis(page)).toHaveCount(1); await expect(page.locator('.ly-dep [data-ly-d="d"]')).toHaveAttribute('aria-checked', 'true');
    await page.locator('.ly-dep [data-ly-d="d"]').click(); await expect(vis(page)).toHaveCount(5);
    await expect(page.locator('.ly-sm')).toContainText('62.5%');
    // the two-view switch, the map link and the next step still work
    await page.locator('.l4-top [data-a="menu"]').click();
    await expect(page.locator('.l4-ms .dv-vsw [data-go^="#L"]')).toBeVisible();
    await page.locator('.l4-ms [data-s="x"]').click();
    await expect(page.locator('.dv-ks .dv-mp')).toBeVisible(); await expect(page.locator('.dv-nx')).toContainText('第 2 步');
    expect(await hl(page)).toBe(h0);
    expect(errs).toEqual([]);
  });
  test('every station is layered; old #D/8 opens 8a', async ({ page }) => {
    const errs = await open(page, './?lang=en#D/3'); await px(page, 'D/3.en');
    await expect(page.locator('.ly')).toHaveCount(1); await expect(page.locator('.ly-pg [data-ly-go]')).toHaveCount(5);
    await go(page, '#D/8'); await px(page, 'D/8a.en'); await expect(page).toHaveURL(/#D\/8a$/); await expect(page.locator('.ly')).toHaveCount(1);
    expect(errs).toEqual([]);
  });
  test('8a: the attention animation steps, pauses and ends on the formula; 8b shows the block', async ({ page }) => {
    const errs = await open(page, './?lang=en#D/8a'); await px(page, 'D/8a.en');
    await page.locator('.ly-pg [data-ly-go="2"]').click();
    const an = page.locator('.ly-anim'); await expect(an).toBeVisible();
    await expect(an.locator('[data-at="play"]')).toBeVisible();
    await an.locator('[data-at="play"]').click(); // pause the auto-play (or start it) — then step by hand
    if ((await an.locator('[data-at="play"]').getAttribute('aria-pressed')) === 'true') await an.locator('[data-at="play"]').click();
    await an.locator('[data-at="prev"]').click(); await an.locator('[data-at="prev"]').click(); await an.locator('[data-at="prev"]').click(); await an.locator('[data-at="prev"]').click(); await an.locator('[data-at="prev"]').click(); await an.locator('[data-at="prev"]').click();
    await expect(an).toHaveAttribute('data-f', '1'); await expect(an.locator('.ly-acap')).toContainText('who is “it”');
    for (let k = 0; k < 4; k++) await an.locator('[data-at="next"]').click();
    await expect(an).toHaveAttribute('data-f', '5'); await expect(an).toContainText('66.5%'); await expect(an).toContainText('24.5%'); await expect(an).toContainText('9.0%');
    await an.locator('[data-at="next"]').click(); await an.locator('[data-at="next"]').click(); await an.locator('[data-at="next"]').click();
    await expect(an).toHaveAttribute('data-f', '7'); await expect(an.locator('.ly-afn')).toHaveText('Shot 7 / 7');
    await go(page, '#D/8b'); await px(page, 'D/8b.en'); await page.locator('.ly-pg [data-ly-go="2"]').click();
    await expect(page.locator('.ly-blk')).toContainText('Multi-head attention');
    expect(errs).toEqual([]);
  });
  test('reduced motion: no play button, frames are stepped', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 }, storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: DONE }] } });
    const page = await ctx.newPage(); const errs = await open(page, './?lang=zh#D/8a'); await px(page, 'D/8a.zh');
    await page.locator('.ly-pg [data-ly-go="2"]').click(); const an = page.locator('.ly-anim'); await expect(an).toHaveClass(/rm/);
    await expect(an.locator('[data-at="play"]')).toHaveCount(0); await page.waitForTimeout(5000); await expect(an).toHaveAttribute('data-f', '1');
    await an.locator('[data-at="next"]').click(); await expect(an).toHaveAttribute('data-f', '2');
    expect(errs).toEqual([]); await ctx.close();
  });
});

test.describe('R51 reads on this phone', () => {
  test('every layer of the pilot pages: contrast ≥ 4.5:1, no small / cut / covered text, nothing wider than the screen, no Chinese in en', async ({ page }) => {
    const bad: string[] = [];
    for (const l of ['zh', 'en'] as const) {
      await open(page, `./?lang=${l}#D/0`);
      await page.evaluate(() => localStorage.setItem('si.ly.depth', 'd'));
      for (const i of PILOT) {
        await go(page, `#D/${i}`); await px(page, `D/${i}.${l}`);
        await page.locator('.ly-pg [data-ly-go="5"]').click(); await expect(vis(page)).toHaveCount(5); await expect(page.locator('.vf-qz')).toBeVisible();
        await page.locator('.ly details').evaluateAll((ds) => ds.forEach((d) => ((d as HTMLDetailsElement).open = true)));
        for (let k = 1; k <= 5; k++) {
          await page.locator(`.ly-l[data-ly="${k}"]`).evaluate((e) => e.scrollIntoView({ block: 'start' }));
          for (const x of await page.evaluate(contrastIssues, { root: `.ly-l[data-ly="${k}"]`, min: 4.5, icon: 3 })) bad.push(`${l} D/${i} ⓛ${k} ${x.cls} “${x.txt}” ${x.fg} on ${x.bg} = ${x.r}`);
          for (const x of await page.evaluate(textIssues, 12)) bad.push(`${l} D/${i} ⓛ${k} ${x.k} ${x.cls} “${x.txt}”${x.why ? ' ' + x.why : ''}`);
        }
        await page.locator('.ly-top').evaluate((e) => e.scrollIntoView({ block: 'start' }));
        for (const x of await page.evaluate(contrastIssues, { root: '.ly-top', min: 4.5, icon: 3 })) bad.push(`${l} D/${i} top ${x.cls} “${x.txt}” ${x.fg} on ${x.bg} = ${x.r}`);
        const w = await page.evaluate(() => { const e = document.querySelector<HTMLElement>('.l4-home')!; return [document.documentElement.scrollWidth - innerWidth, e.scrollWidth - e.clientWidth]; });
        if (w.some((x) => x > 1)) bad.push(`${l} D/${i} wide ${w}`);
        if (l === 'en' && /[\u3400-\u9fff]/.test((await page.locator('.ly').allInnerTexts()).join(''))) bad.push(`en D/${i} has Chinese`);
        const fs = await page.locator('.ly-l[data-ly="1"] p').first().evaluate((e) => getComputedStyle(e).fontSize);
        if (fs !== '15px') bad.push(`${l} D/${i} body ${fs}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
