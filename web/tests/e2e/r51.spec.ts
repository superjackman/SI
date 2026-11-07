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
  test('the whole lesson is on the page: picture, experiment, formula and questions, no depth switch', async ({ page }) => {
    const errs = await open(page, './?lang=zh#D/2'); await px(page, 'D/2.zh'); const h0 = await hl(page);
    await expect(vis(page)).toHaveCount(5);
    await expect(page.locator('.ly-dep, .ly-pg, .ly-go, .st-tabs, .st-side')).toHaveCount(0);
    await expect(page.locator('.ly-l[data-ly="1"]')).toContainText('梯度下降');
    await expect(page.locator('.ly-l[data-ly="2"] .vf-dm[data-dm="gd"]')).toBeVisible();
    await expect(page.locator('[data-fig="scene"]')).toHaveCount(1);
    await expect(page.locator('[data-fig="exp"]')).toHaveCount(1);
    await expect(page.locator('.ly-fx')).toContainText('∂L/∂w');
    await expect(page.locator('.vf-qz').first()).toBeVisible();
    await expect(page.locator('.st-code')).toBeVisible();
    await go(page, '#D/1'); await px(page, 'D/1.zh'); await expect(vis(page)).toHaveCount(5);
    await expect(page.locator('.ly-sm')).toContainText('62.5%');
    await expect(page.locator('[role=dialog]')).toHaveCount(0);
    await expect(page.locator('.dv-end [data-fwd="1"]')).toBeVisible();
    expect(await hl(page)).toBe(h0);
    expect(errs).toEqual([]);
  });
  test('every station is layered; old #D/8 opens 8a', async ({ page }) => {
    const errs = await open(page, './?lang=en#D/3'); await px(page, 'D/3.en');
    await expect(page.locator('.ly')).toHaveCount(1); await expect(page.locator('.ly-l')).toHaveCount(5);
    await go(page, '#D/8'); await px(page, 'D/8a.en'); await expect(page).toHaveURL(/#D\/8a$/); await expect(page.locator('.ly')).toHaveCount(1);
    expect(errs).toEqual([]);
  });
  test('8a: the attention animation steps, pauses and ends on the formula; 8b shows the block', async ({ page }) => {
    const errs = await open(page, './?lang=en#D/8a'); await px(page, 'D/8a.en');
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
    await go(page, '#D/8b'); await px(page, 'D/8b.en');
    await expect(page.locator('.ly-blk')).toContainText('Multi-head attention');
    expect(errs).toEqual([]);
  });
  test('reduced motion: no play button, frames are stepped', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 }, storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: DONE }] } });
    const page = await ctx.newPage(); const errs = await open(page, './?lang=zh#D/8a'); await px(page, 'D/8a.zh');
    const an = page.locator('.ly-anim'); await expect(an).toHaveClass(/rm/);
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
        await expect(vis(page)).toHaveCount(5); await expect(page.locator('.vf-qz').first()).toBeVisible();
        await page.locator('.ly details').evaluateAll((ds) => ds.forEach((d) => ((d as HTMLDetailsElement).open = true)));
        for (let k = 1; k <= 5; k++) {
          await page.locator(`.ly-l[data-ly="${k}"]`).evaluate((e) => e.scrollIntoView({ block: 'start' }));
          for (const x of await page.evaluate(contrastIssues, { root: `.ly-l[data-ly="${k}"]`, min: 4.5, icon: 3 })) bad.push(`${l} D/${i} ⓛ${k} ${x.cls} “${x.txt}” ${x.fg} on ${x.bg} = ${x.r}`);
          for (const x of await page.evaluate(textIssues, 12)) bad.push(`${l} D/${i} ⓛ${k} ${x.k} ${x.cls} “${x.txt}”${x.why ? ' ' + x.why : ''}`);
        }
        const w = await page.evaluate(() => { const e = document.querySelector<HTMLElement>('.l4-home')!; return [document.documentElement.scrollWidth - innerWidth, e.scrollWidth - e.clientWidth]; });
        if (w.some((x) => x > 1)) bad.push(`${l} D/${i} wide ${w}`);
        if (l === 'en' && /[\u3400-\u9fff]/.test((await page.locator('.ly').allInnerTexts()).join(''))) bad.push(`en D/${i} has Chinese`);
        const fs = await page.locator('.ly-l[data-ly="1"] p').first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
        if (fs < 15) bad.push(`${l} D/${i} body ${fs}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
