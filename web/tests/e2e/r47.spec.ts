import { test, expect, type Page } from '@playwright/test';
import { textIssues } from './small-text.js';
import { contrastIssues } from './contrast.js';
import { DV_KEY } from '../../src/dv/links';
/* R47 自底向上 · 推导之路: home entry → the chain (#D) → each stage (#D/0–16); step bar, ↑, crumbs, cards both ways;
   no history entries; readable at 360 / 390 / 430 in zh and en. */
const ORIGIN = 'http://localhost:' + (process.env.SI_E2E_PORT || '4173');
const DONE = [{ name: 'si.fs', value: '0' }, { name: 'si.a2hs', value: '1' }, { name: 'si.onb', value: '1' }];
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: DONE }] } });
async function open(p: Page, q: string) {
  const errs: string[] = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(q); await p.locator('#l4').waitFor({ state: 'attached', timeout: 30000 }); await p.waitForTimeout(600);
  return errs;
}
const re = (h: string) => new RegExp(h.replace(/[/?~]/g, '\\$&') + '$');
const hl = (p: Page) => p.evaluate(() => history.length);
const px = (p: Page, v: string) => expect(p.locator('#l4')).toHaveAttribute('data-px', v);

test.describe('R47 derivation path', () => {
  test('home → chain → stages (next, dot, back, the step it came from) → ↑ chain → ↑ home; no history entries; Back leaves', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('about:blank');
    const errs = await open(page, './?lang=zh#home'); const n0 = await hl(page);
    await expect(page.locator('.l4-tabs button')).toHaveCount(4);
    await page.locator('.hm-v[href="#D"]').click(); // R53: 两种看法 · 看推导 await expect(page).toHaveURL(re('#D')); await px(page, 'D.zh');
    await expect(page.locator('.dv-st')).toHaveCount(23); await expect(page.locator('.dv-lk')).toHaveCount(22); await expect(page.locator('.dv-gh')).toHaveCount(6);
    await expect(page.locator('.l4-nav')).toBeHidden();
    await page.locator('.dv-st[data-go="#D/0"]').click(); await expect(page).toHaveURL(re('#D/0')); await px(page, 'D/0.zh');
    await expect(page.locator('.l4-top .l4-tt')).toHaveText('第 0 站 · 用样本找函数'); await expect(page.locator('.l4-nav .g-n')).toHaveText('第 1 / 23 站');
    await expect(page.locator('.l4-nav [data-a="prev"]')).toBeDisabled();
    await page.locator('.l4-nav [data-a="next"]').click(); await expect(page).toHaveURL(re('#D/P')); await px(page, 'D/P.zh');
    await page.locator('.l4-nav [data-a="next"]').click(); await expect(page).toHaveURL(re('#D/1')); await px(page, 'D/1.zh');
    /* 23 many-dots wrap with fat ::after rings — click the node itself so a neighbour row cannot steal the tap */
    await page.locator('.l4-nav .g-dots [aria-label="第 5 站"]').evaluate((el: HTMLElement) => el.click()); await expect(page).toHaveURL(re('#D/5'));
    await page.locator('.l4-nav [data-a="prev"]').click(); await expect(page).toHaveURL(re('#D/4'));
    await page.locator('.dv-from').click(); await expect(page).toHaveURL(re('#D/3')); await expect(page.locator('.ly')).toHaveCount(1);
    await page.locator('.dv-nx').click(); await expect(page).toHaveURL(re('#D/4'));
    await page.locator('.l4-crumb a[href="#D"]').click(); await expect(page).toHaveURL(re('#D'));
    await expect(page.locator('.dv-st.seen')).toHaveCount(6); /* 0 P 1 5 4 3 */
    await page.locator('.dv-st[data-go="#D/16"]').click(); await expect(page.locator('.l4-nav [data-a="next"]')).toContainText('回链路');
    await page.locator('.l4-nav [data-a="next"]').click(); await expect(page).toHaveURL(re('#D'));
    await page.locator('.dv-st[data-go="#D/9"]').click(); await expect(page).toHaveURL(re('#D/9'));
    await page.locator('.l4-top [data-a="back"]').click(); await expect(page).toHaveURL(re('#D'));
    await page.locator('.l4-top [data-a="back"]').click(); await expect(page).toHaveURL(re('#home'));
    expect(await hl(page)).toBe(n0);
    await page.goBack(); await expect(page).toHaveURL('about:blank');
    expect(errs).toEqual([]);
  });
  test('a stage opens its cards on the same page; KM02 / KM10 / K11 / Transformer cards link back to their stage', async ({ page }) => {
    const errs = await open(page, './?lang=zh#D/2'); const n0 = await hl(page);
    await page.locator('.dv-ks .dv-kb[data-k="KM10"]').click(); await expect(page).toHaveURL(re('#D/2~KM10'));
    const sh = page.locator('.l4-sheet[data-card="KM10"]'); await expect(sh).toBeVisible();
    await sh.locator('.l4-kdv').click(); await expect(page.locator('.l4-sheet')).toHaveCount(0); await expect(page).toHaveURL(re('#D/2'));
    for (const [k, n, from] of [['KM02', '6', '#L5'], ['K11', '8b', '#L4'], ['K07', '8a', '#L4'], ['K01', '8b', '#L4'], ['KM10', '2', '#L5']] as const) {
      await page.evaluate((h) => { location.replace(h); }, `${from}~${k}`);
      const s = page.locator(`.l4-sheet[data-card="${k}"]`); await expect(s).toBeVisible();
      await expect(s.locator('.l4-kdv')).toContainText(`第 ${n} 站`); await s.locator('.l4-kdv').click();
      await expect(page).toHaveURL(re(`#D/${n}`)); await px(page, `D/${n}.zh`);
      await expect(page.locator(`.dv-ks .dv-kb[data-k="${k}"]`)).toHaveCount(1);
    }
    await page.locator('.dv-lv').click(); await expect(page).toHaveURL(re('#L5'));
    expect(await hl(page)).toBe(n0);
    expect(errs).toEqual([]);
  });
  test('the map sheet lists the chain and all 23 stations', async ({ page }) => {
    const errs = await open(page, './?lang=zh#map'); // R53: ☰ lives on the 地图 tab, not on home
    await page.locator('.l4-top [data-a="menu"]').click(); const ms = page.locator('.l4-ms'); await expect(ms).toBeVisible();
    await expect(ms.locator('a[href^="#D/"]')).toHaveCount(25); await expect(ms.locator('a[href="#D/8a"]')).toHaveCount(1); await expect(ms.locator('a[href="#D/8b"]')).toHaveCount(1); await expect(ms.locator('a[href="#D/map"]')).toHaveCount(1); await expect(ms.locator('a[href="#D/routes"]')).toHaveCount(1); await expect(ms.locator('a[href="#D"]')).toHaveCount(1);
    await ms.locator('a[href="#D/9"]').click(); await expect(ms).toHaveCount(0); await expect(page).toHaveURL(re('#D/9')); await px(page, 'D/9.zh');
    expect(errs).toEqual([]);
  });
  test('readable on this phone in zh and en: no small / cut / covered text, nothing wider than the screen; home still fits', async ({ page }) => {
    const bad: string[] = [];
    for (const l of ['zh', 'en']) {
      await open(page, `./?lang=${l}#home`);
      // R53: the new home scrolls down by design; it must never scroll sideways (tests/e2e/r53.spec.ts checks the rest)
      const hs = await page.evaluate(() => { const h = document.querySelector<HTMLElement>('.l4-home')!; return h.scrollWidth - h.clientWidth; }); if (hs > 1) bad.push(`${l} home scrolls sideways ${hs}`);
      for (const h of ['#D', '#D/0', '#D/4', '#D/8a', '#D/8b', '#D/9', '#D/11', '#D/12', '#D/14', '#D/16']) {
        await page.evaluate((x) => { location.replace(x); }, h); await px(page, `${h.slice(1)}.${l}`);
        for (const end of [false, true]) {
          if (end) await page.evaluate(() => { const e = document.querySelector<HTMLElement>('.l4-home')!; e.scrollTop = e.scrollHeight; });
          const w = await page.evaluate(() => { const e = document.querySelector<HTMLElement>('.l4-home')!; return [document.documentElement.scrollWidth - innerWidth, e.scrollWidth - e.clientWidth]; });
          if (w.some((x) => x > 1)) bad.push(`${l} ${h} wide ${w}`);
          for (const x of await page.evaluate(textIssues, 12)) bad.push(`${l} ${h}${end ? ' end' : ''} ${x.k} ${x.cls} “${x.txt}”${x.why ? ' ' + x.why : ''}`);
        }
        if (l === 'en') { const t = await page.locator('.l4-home').innerText(); if (/[\u3400-\u9fff]/.test(t)) bad.push(`en ${h} has Chinese`); }
      }
    }
    expect(bad).toEqual([]);
  });
  test('every label, chip, badge and line in the path reads: WCAG contrast ≥ 4.5:1 (icons ≥ 3:1) on every page, zh and en', async ({ page }) => {
    const bad: string[] = [], R = '.dv, .l4-top, .l4-crumb, .l4-nav';
    for (const l of ['zh', 'en']) {
      await open(page, `./?lang=${l}#D`); await px(page, `D.${l}`);
      for (const h of ['#D', ...DV_KEY.map((i) => `#D/${i}`), '#D']) { /* the chain again at the end: every step seen (✓, .seen) */
        await page.evaluate((x) => { location.replace(x); }, h); await px(page, `${h.slice(1)}.${l}`);
        await page.evaluate(() => { for (const d of document.querySelectorAll('.dv details')) (d as HTMLDetailsElement).open = true; });
        for (const x of await page.evaluate(contrastIssues, { root: R, min: 4.5, icon: 3 })) bad.push(`${l} ${h} ${x.cls} “${x.txt}” ${x.fg} on ${x.bg} = ${x.r}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
