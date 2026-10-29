import { test, expect, type Page } from '@playwright/test';
import { textIssues } from './small-text.js';
/* R42b: no text anywhere is under 12 px, covered, clipped, cut, scrolled sideways or badly wrapped —
   geometric checks (tests/e2e/small-text.js) over the main pages, charts, cards, sheets, share and quiz, zh and en.
   m360 runs at 360×640 (the shortest supported phone) instead of its usual 360×740. */
const ORIGIN = 'http://localhost:4173';
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: [{ name: 'si.fs', value: '0' }, { name: 'si.a2hs', value: '1' }, { name: 'si.onb', value: '1' }] }] } });

const PAGES = ['#home', '#R', '#P', '#S', '#L1', '#L2', '#L3', '#L3/X', '#L3/U5', '#L4', '#L4/us/1', '#L5', '#L5/M2d', '#L5/M3a', '#L5/M5a', '#L5/M6c', '#L5/M8', '#L2~KB01', '#L4~K06', '#L5~KM03', '#L3~KC03', '#P/q1', '#Q/done'];
async function check(p: Page, hash: string, lang: string, act?: (p: Page) => Promise<void>) {
  await p.goto(`./?lang=${lang}${hash}`); await p.locator('#l4').waitFor({ state: 'attached', timeout: 20000 });
  await p.waitForTimeout(900); if (act) { await act(p); await p.waitForTimeout(600); }
  return (await p.evaluate(textIssues, 12)).map((x) => `${hash} ${x.k} ${x.cls} “${x.txt.slice(0, 30)}”${x.px ? ' ' + x.px + 'px' : ''}${x.by ? ' by ' + x.by : ''}${x.why ? ' ' + x.why : ''}`);
}
for (const lang of ['zh', 'en']) {
  test.describe(`R42b text fits (${lang})`, () => {
    test.beforeEach(async ({ page }, ti) => { if (ti.project.name === 'm360') await page.setViewportSize({ width: 360, height: 640 }); });
    test(`pages and charts`, async ({ page }) => {
      test.setTimeout(120_000); const bad: string[] = [];
      for (const h of PAGES) bad.push(...(await check(page, h, lang)));
      expect(bad).toEqual([]);
    });
    test(`sheets, drawer, share picker, quiz`, async ({ page }) => {
      test.setTimeout(180_000); const bad: string[] = [];
      const C = (sel: string) => async (p: Page) => { await p.waitForSelector(sel, { state: 'attached', timeout: 10000 }); await p.evaluate((s) => (document.querySelector(s) as HTMLElement).click(), sel); await p.waitForTimeout(600); };
      bad.push(...(await check(page, '#L2~KB01', lang, C('.l4-sheet .g-next[data-s="flip"]'))));
      bad.push(...(await check(page, '#home', lang, C('[data-a="set"]'))));
      bad.push(...(await check(page, '#L4', lang, C('[data-a="menu"]'))));
      for (const n of [2, 9]) bad.push(...(await check(page, '#Q', lang, async (p) => { await C('[data-px="qgo"]')(p); for (let i = 1; i < n; i++) await C('.l4-nav [data-a="next"]')(p); })));
      bad.push(...(await check(page, '#P/q1', lang, async (p) => { for (const k of [1, 3, 0, 2]) { await C(`[data-px="pick:${k}"]`)(p); await C('.l4-nav [data-a="next"]')(p); } })));
      bad.push(...(await check(page, '#S', lang, C('[data-px="pk"]'))));
      bad.push(...(await check(page, '#home', lang, C('[data-a="menu"]'))));
      expect(bad).toEqual([]);
    });
  });
}
