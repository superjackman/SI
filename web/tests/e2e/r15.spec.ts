/* R15: the plain-language pilot (T1, K1, K2) on real phones: every card opens with a plain block and the full text sits
   in a closed "Go deeper"; opening it shows fitted formulas with their symbol notes, nothing wider than the screen;
   tapping a symbol opens the glossary at that symbol; search finds the glossary; English shows no Chinese. */
import { test, expect, type Page } from '@playwright/test';

type Lang = 'zh' | 'en';
const ready = (page: Page, S: string, lang: Lang) => page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached' });
const CJK = /[\u3400-\u9fff]/;
const wide = (page: Page, sel: string) => page.evaluate((sel) => {
  const cw = document.documentElement.clientWidth;
  return [...document.querySelectorAll<HTMLElement>(sel)].filter((e) => e.getClientRects().length && e.getBoundingClientRect().right > cw + 0.5).map((e) => e.className + ':' + (e.textContent ?? '').slice(0, 30));
}, sel);

for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang}: plain openings first, "Go deeper" closed by default (T1, K1, K2)`, async ({ page }) => {
    for (const S of ['T1', 'K1', 'K2']) {
      await page.goto(`./?lang=${lang}#${S}`); await ready(page, S, lang);
      const sec = page.locator(`section#${S}`);
      expect(await sec.locator('.plain').count(), S).toBeGreaterThanOrEqual(4);
      const deep = sec.locator('details.deep');
      expect(await deep.count(), S).toBeGreaterThanOrEqual(3);
      expect(await deep.evaluateAll((d) => d.filter((x) => (x as HTMLDetailsElement).open).length), S).toBe(0);
      const first = sec.locator(`.pl-top[data-pl="${S}"] .plain`); // R21: the first plain opening is the top card
      await expect(first).toBeVisible();
      if (lang === 'en') expect(await sec.locator('.plain, details.deep > summary').allInnerTexts()).not.toContainEqual(expect.stringMatching(CJK));
      expect(await wide(page, `section#${S} .plain, section#${S} details.deep > summary`), S).toEqual([]);
    }
  });

  test(`${lang}: opening "Go deeper" shows fitted formulas with symbol notes, nothing too wide`, async ({ page }) => {
    for (const S of ['K1', 'K2']) {
      await page.goto(`./?lang=${lang}#${S}`); await ready(page, S, lang);
      await page.evaluate((S) => {
        document.querySelectorAll<HTMLElement>(`section#${S} .card.cc-closed .cc-h`).forEach((h) => h.click());
        document.querySelectorAll<HTMLDetailsElement>(`section#${S} details.deep`).forEach((d) => { d.open = true; });
      }, S);
      await page.waitForTimeout(300);
      const kx = page.locator(`section#${S} .kx`), sn = page.locator(`section#${S} .kx + .sn`);
      expect(await kx.count()).toBeGreaterThan(3);
      expect(await sn.count()).toBe(await kx.count()); // every display formula is directly followed by its notes
      await expect(sn.first()).toBeVisible();
      expect(await wide(page, `section#${S} .sn, section#${S} .sn li, section#${S} .sn-s, section#${S} .pl-more, section#${S} .kx`)).toEqual([]);
      /* the formula itself still fits (math.ts picks the stacked twin or scrolls inside its own box, never the page) */
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      if (lang === 'en') expect(CJK.test(await page.locator(`section#${S}`).innerText())).toBe(false);
    }
  });

  test(`${lang}: tapping a symbol opens the glossary at that symbol; Esc and ✕ close it`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`./?lang=${lang}#K2`); await ready(page, 'K2', lang);
    const card = page.locator('section#K2 #c_K2_1');
    await card.locator('details.deep > summary').click();
    const btn = card.locator('.sn-s[data-sym="norm"]').first();
    await btn.scrollIntoViewIfNeeded(); await btn.click();
    const sheet = page.locator('#symSheet [role="dialog"]');
    await expect(sheet).toBeVisible();
    const hit = page.locator('#symSheet #sy-norm');
    await expect(hit).toHaveClass(/\bon\b/);
    await expect(hit).toBeInViewport();
    expect(await page.locator('#symSheet .sy-e').count()).toBeGreaterThan(60);
    expect(await wide(page, '#symSheet .sy-e, #symSheet h2, #symSheet h3')).toEqual([]);
    if (lang === 'en') expect(CJK.test(await sheet.innerText())).toBe(false);
    await page.keyboard.press('Escape');
    await expect(page.locator('#symSheet')).toHaveCount(0);
    await expect(card.locator('details.deep')).toHaveAttribute('open', '');
    /* the "all symbols" button opens it at the top; ✕ closes it */
    await card.locator('.sn-all').first().click();
    await expect(sheet).toBeVisible();
    await expect(page.locator('#symSheet .sy-e.on')).toHaveCount(0);
    await page.locator('#symSheet .sy-x').click();
    await expect(page.locator('#symSheet')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test(`${lang}: search finds the glossary and single symbols`, async ({ page }) => {
    await page.goto(`./?lang=${lang}#T1`); await ready(page, 'T1', lang);
    const find = async (q: string) => {
      if (!(await page.locator('#search').isVisible())) await page.locator('#mSearch').click();
      await page.locator('#search').fill(q);
      await expect(page.locator('#searchRes')).toHaveClass(/open/);
    };
    await find(lang === 'zh' ? '求和' : 'sum');
    const row = page.locator('#searchRes [data-kind="y"][data-id="sum"]');
    await expect(row).toHaveCount(1);
    if (lang === 'en') expect(CJK.test(await row.innerText())).toBe(false);
    await row.click();
    await expect(page.locator('#symSheet #sy-sum')).toHaveClass(/\bon\b/);
    await page.keyboard.press('Escape');
    await find(lang === 'zh' ? '符号' : 'symbol');
    await page.locator('#searchRes [data-kind="y"][data-id="*"]').click();
    await expect(page.locator('#symSheet [role="dialog"]')).toBeVisible();
  });
}
