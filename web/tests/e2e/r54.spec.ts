import { test, expect, type Page } from '@playwright/test';
import { contrastIssues } from './contrast.js';
import { textIssues } from './small-text.js';
/* R54 (1) the 地图 tab: the five layers are a plain list, macro (layer 1) at the top → micro (layer 5) at the bottom —
   equal-width rows with a title, a one-line summary, the card count and progress; no trapezoids, no pyramid shape.
   (2) on a layered stage page the depth switch and the five-layer bar stay pinned at the top of the scroll box, and a
   layer opened from the bar lands just below them, nothing covered. No in-site move adds a history entry. */
const ORIGIN = 'http://localhost:4173';
const DONE = [{ name: 'si.fs', value: '0' }, { name: 'si.a2hs', value: '1' }, { name: 'si.onb', value: '1' }];
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: DONE }] } });
async function open(p: Page, q: string) {
  const errs: string[] = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(q); await p.locator('#l4').waitFor({ state: 'attached', timeout: 30000 }); await p.waitForTimeout(600);
  return errs;
}
const hl = (p: Page) => p.evaluate(() => history.length);
async function issues(page: Page, tag: string) {
  const bad: string[] = [];
  for (const x of await page.evaluate(contrastIssues, { root: '#l4', min: 4.5, icon: 3 })) bad.push(`${tag} contrast ${x.cls} “${x.txt}” ${x.fg} on ${x.bg} = ${x.r}`);
  for (const x of await page.evaluate(textIssues, 12)) bad.push(`${tag} text ${x.k} ${x.cls} “${x.txt.slice(0, 30)}” ${x.why ?? ''} ${x.by ?? ''}`);
  return bad;
}

test.describe('R54 map list + pinned layer bar', () => {
  for (const lang of ['zh', 'en'] as const) {
    test(`地图 tab: five equal rows, 1 → 5, counts, no trapezoid, links work without history, readable (${lang})`, async ({ page }) => {
      const errs = await open(page, `./?lang=${lang}#map`); const n0 = await hl(page);
      const rows = page.locator('.l4-pyr .l4-lv'); await expect(rows).toHaveCount(5);
      const geo = await rows.evaluateAll((es) => es.map((e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return { w: Math.round(r.width), l: Math.round(r.left), clip: s.clipPath, go: e.getAttribute('data-go'), t: (e as HTMLElement).innerText }; }));
      expect(new Set(geo.map((g) => g.w)).size, 'equal widths').toBe(1); expect(new Set(geo.map((g) => g.l)).size, 'aligned').toBe(1);
      expect(geo.every((g) => g.clip === 'none'), 'no clip-path shapes').toBe(true);
      expect(geo.map((g) => g.go)).toEqual(['#L1', '#L2', '#L3', '#L4', '#L5']);
      const cards = [9, 9, 15, 16, 14]; geo.forEach((g, i) => expect(g.t).toContain(lang === 'zh' ? `${cards[i]} 张卡` : `${cards[i]} cards`));
      expect(geo[0]!.t).toMatch(lang === 'zh' ? /最宏观/ : /big picture/); expect(geo[4]!.t).toMatch(lang === 'zh' ? /最微观/ : /details/);
      expect(await page.evaluate(() => [...document.querySelectorAll('#l4 *')].some((e) => /polygon/.test(getComputedStyle(e).clipPath)))).toBe(false);
      await expect(page.locator('.l4-mh2')).toHaveText(lang === 'zh' ? '自顶向下 · 五层结构' : 'Top-down: five layers');
      expect(await issues(page, `map.${lang}`)).toEqual([]);
      await page.locator('.l4-bu').click(); await expect(page).toHaveURL(/#D$/); await page.goBack().catch(() => {});
      await page.goto(`./?lang=${lang}#map`); await page.waitForTimeout(400); const n1 = await hl(page);
      await page.locator('.l4-mls [data-go="#D/map"]').click(); await expect(page).toHaveURL(/#D\/map$/);
      await page.locator('.l4-tabs [data-go="#map"]').waitFor({ state: 'detached' }).catch(() => {});
      await page.evaluate(() => location.replace('#map')); await page.locator('.l4-mls [data-go="#D/routes"]').click(); await expect(page).toHaveURL(/#D\/routes$/);
      await page.evaluate(() => location.replace('#map')); await rows.nth(3).click(); await expect(page).toHaveURL(/#L4$/);
      expect(await hl(page)).toBe(n1); expect(n0).toBeGreaterThan(0);
      expect(errs).toEqual([]);
    });
  }
  test('home: the 看结构 card shows five equal rows, not a pyramid', async ({ page }) => {
    await open(page, './?lang=zh#home'); await page.waitForSelector('.hm-pyr i');
    const ws = await page.locator('.hm-pyr i').evaluateAll((es) => es.map((e) => Math.round(e.getBoundingClientRect().width)));
    expect(ws).toHaveLength(5); expect(new Set(ws).size).toBe(1);
  });
  for (const lang of ['zh', 'en'] as const) {
    test(`layered page: depth switch + five-layer bar stay pinned while reading; a layer lands below the bar; nothing covered (${lang})`, async ({ page }) => {
      await page.addInitScript(() => { if (sessionStorage.getItem('r54')) return; sessionStorage.setItem('r54', '1'); localStorage.setItem('si.ly.depth', 'd'); localStorage.setItem('si.ly.open', JSON.stringify({ 'D/2': 5, 'D/8a': 5 })); });
      for (const st of ['2', '8a']) {
        const errs = await open(page, `./?lang=${lang}#D/${st}`); await expect(page.locator('.ly-l:not([hidden])')).toHaveCount(5); const n0 = await hl(page);
        const box = () => page.evaluate(() => { const h = document.querySelector('.l4-home')!.getBoundingClientRect(), t = document.querySelector('.ly-top')!.getBoundingClientRect(); return { h: h.top, t: t.top, b: t.bottom }; });
        await page.evaluate(() => { document.querySelector('.l4-home')!.scrollTop = 1400; }); await page.waitForTimeout(300);
        let b = await box(); expect(Math.abs(b.t - b.h), 'pinned to the top').toBeLessThan(1.5);
        await expect(page.locator('.ly-pg [data-ly-go="3"]')).toBeInViewport(); await expect(page.locator('.ly-dep [data-ly-d="s"]')).toBeInViewport();
        expect(await issues(page, `D/${st}.${lang} scrolled`)).toEqual([]);
        for (const k of ['4', '1', '3']) {
          await page.locator(`.ly-pg [data-ly-go="${k}"]`).click(); await page.waitForTimeout(900);
          b = await box(); const ht = await page.locator(`.ly-l[data-ly="${k}"] .ly-h`).evaluate((e) => e.getBoundingClientRect().top);
          if (k !== '1') expect(ht, `layer ${k} heading below the bar`).toBeGreaterThanOrEqual(b.b - 0.5);
          await expect(page.locator('.ly-pg')).toBeInViewport();
        }
        expect(await issues(page, `D/${st}.${lang} after jumps`)).toEqual([]);
        expect(await hl(page)).toBe(n0); expect(errs).toEqual([]);
      }
    });
  }
});
