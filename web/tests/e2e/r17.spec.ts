/* R17: graphical buttons. (1) the share icon sits in the header's top-right (next to search and the language switch) on
   every station and opens the share panel; (2) every icon-only button — header, station controls, labs, drawer, sheet,
   popup, full screen, share panel — carries an aria-label and a title in the page language; (3) their tap targets are
   ≥ 40×40; (4) the 360/390/430 header fits the title, the dots, search, share and EN; (5) labs keep working when their
   text is rewritten (the icon survives). */
import { test, expect, type Page } from '@playwright/test';

type Lang = 'zh' | 'en';
const ready = (page: Page, S: string, lang: Lang) => page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached', timeout: 15_000 });
const ORDER = ['T1', 'U', 'Ua', 'Ub', 'Uc', 'Ud', 'Up', 'T2', 'T3', 'N', 'T4', 'T4a', 'T4b', 'T5', 'T6', 'T7', 'T8', 'K1', 'K2', 'K3', 'K4', 'K5'];
const SHARE: Record<Lang, string> = { zh: '分享本页', en: 'Share this page' };

/** visible icon-only buttons (no visible text) with their label, title and size; the 22 stop dots under each station
    are slots of one 44px-tall scrub strip (R18, checked in r18.spec.ts), so a single dot is not held to 40×40 here */
const iconOnly = (page: Page, scope = 'body') => page.evaluate((scope) => {
  const TC = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent')!.get!;
  const out: { k: string; al: string; ti: string; w: number; h: number; dot: boolean }[] = [];
  for (const b of document.querySelectorAll<HTMLElement>(`${scope} button, ${scope} [role=button], ${scope} a.btn`)) {
    if (!b.getClientRects().length) continue;
    const r = b.getBoundingClientRect(), st = getComputedStyle(b);
    if (r.width < 1 || r.height < 1 || st.visibility === 'hidden' || r.bottom < 0 || r.top > innerHeight) continue;
    if ((TC.call(b) ?? '').trim() !== '') continue; // the rendered DOM text (labs' own textContent accessor bypassed)
    out.push({ k: (b.id ? '#' + b.id : '') + '.' + b.className.toString().replace(/\s+/g, '.'), al: b.getAttribute('aria-label') ?? '', ti: b.getAttribute('title') ?? '', w: Math.round(r.width), h: Math.round(r.height), dot: b.classList.contains('dt') });
  }
  return out;
}, scope);
const check = (rows: Awaited<ReturnType<typeof iconOnly>>, where: string) => {
  expect(rows.filter((r) => !r.al.trim() || !r.ti.trim()).map((r) => `${where} ${r.k}`), 'aria-label + title').toEqual([]);
  expect(rows.filter((r) => !r.dot && (r.w < 40 || r.h < 40)).map((r) => `${where} ${r.k} ${r.w}×${r.h}`), '≥ 40×40').toEqual([]);
};

test.beforeEach(async ({ page }) => { await page.addInitScript(() => localStorage.setItem('si.fs', '0')); });

for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang}: share icon top-right of the header on every station, opens the panel`, async ({ page }) => {
    test.setTimeout(120_000);
    const vw = page.viewportSize()!.width;
    for (const S of ORDER) {
      await page.goto(`./?lang=${lang}#${S}`); await ready(page, S, lang);
      const sh = page.locator('#topbar .tb-in').getByRole('button', { name: SHARE[lang], exact: true });
      await expect(sh).toBeVisible();
      await expect(sh).toHaveAttribute('title', SHARE[lang]);
      await expect(sh.locator('svg.ic')).toHaveCount(1);
      const b = (await sh.boundingBox())!, s = (await page.locator('#mSearch').boundingBox())!, l = (await page.locator('#mLang').boundingBox())!;
      expect(b.width).toBeGreaterThanOrEqual(40); expect(b.height).toBeGreaterThanOrEqual(40);
      expect(b.y).toBeLessThan(60); expect(b.x).toBeGreaterThan(vw / 2); // top-right
      expect(s.x + s.width).toBeLessThanOrEqual(b.x + 0.5); expect(b.x + b.width).toBeLessThanOrEqual(l.x + 0.5); // search | share | EN, no overlap
      expect(l.x + l.width).toBeLessThanOrEqual(vw + 0.5);
      await sh.tap();
      await expect(page.locator('#sharePanel')).toBeVisible();
      await expect(page.locator('#sharePanel .sp-what')).toContainText(await page.locator('#tbWhere b').innerText());
      await page.keyboard.press('Escape');
      await expect(page.locator('#sharePanel')).toHaveCount(0);
    }
  });

  test(`${lang}: header fits title, dots, search, share and EN (no clipped zh title, no overlap)`, async ({ page }) => {
    test.setTimeout(90_000);
    for (const S of ORDER) {
      await page.goto(`./?lang=${lang}#${S}`); await ready(page, S, lang);
      const r = await page.evaluate(() => {
        const q = (s: string) => document.querySelector(s) as HTMLElement, rc = (s: string) => q(s).getBoundingClientRect();
        const ids = ['#mMenu', '#mPrev', '#tbWhere', '#mNext', '#mSearch', '#mShare', '#mLang'], R = ids.map(rc);
        const overlap = R.slice(1).some((x, k) => x.left < R[k]!.right - 0.5);
        const b = q('#tbWhere b'), d = q('#tbWhere .tb-dots'), w = q('#tbWhere');
        return { overlap, out: R[6]!.right > document.documentElement.clientWidth + 0.5, title: b.scrollWidth - b.clientWidth, dots: d.getBoundingClientRect().right - w.getBoundingClientRect().right, cur: !!d.querySelector('i.on') && getComputedStyle(d.querySelector('i.on')!).display !== 'none', small: d.querySelector('small')!.getBoundingClientRect().right - w.getBoundingClientRect().right };
      });
      expect(r.overlap, S).toBe(false); expect(r.out, S).toBe(false);
      expect(r.dots, S).toBeLessThanOrEqual(0.5); expect(r.small, S).toBeLessThanOrEqual(0.5); expect(r.cur, S).toBe(true);
      expect(r.title, `${S} title clipped`).toBeLessThanOrEqual(1); // R18: long names wrap to two lines instead of '…'
    }
  });

  test(`${lang}: every icon-only button has aria-label + title and a ≥ 40×40 target`, async ({ page }) => {
    test.setTimeout(150_000);
    for (const S of ORDER) {
      await page.goto(`./?lang=${lang}#${S}`); await ready(page, S, lang);
      for (let y = 0, H = await page.evaluate(() => document.documentElement.scrollHeight); y < H; y += 700) {
        await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(30);
        check(await iconOnly(page), `${S}@${y}`);
      }
    }
    /* overlays */
    await page.goto(`./?lang=${lang}#T3`); await ready(page, 'T3', lang);
    await page.locator('#mMenu').tap(); await expect(page.locator('#mDrawer')).toBeVisible(); await page.waitForTimeout(300);
    check(await iconOnly(page, '#mDrawer'), 'drawer'); await page.keyboard.press('Escape');
    await page.locator('[data-bn="more"]').tap(); await expect(page.locator('#moreSheet')).toBeVisible(); await page.waitForTimeout(300);
    check(await iconOnly(page, '#moreSheet'), 'sheet'); await page.locator('#moreSheet .sh-x').tap();
    await page.locator('#mShare').tap(); await expect(page.locator('#sharePanel')).toBeVisible(); await page.waitForTimeout(300);
    check(await iconOnly(page, '#sharePanel'), 'share'); await page.keyboard.press('Escape');
    await page.locator('.mh-x[data-open]').first().tap(); await expect(page.locator('#modal')).toBeVisible(); await page.waitForTimeout(300);
    check(await iconOnly(page, '#modal'), 'popup'); await page.keyboard.press('Escape');
    const full = page.locator('.vz[data-vz="full"]').first(); await full.scrollIntoViewIfNeeded(); await full.tap(); await page.waitForTimeout(400);
    check(await iconOnly(page, '.fs-bar'), 'fullscreen');
  });

  test(`${lang}: lab controls are line icons that survive the labs rewriting their text`, async ({ page }) => {
    await page.goto(`./?lang=${lang}#T3`); await ready(page, 'T3', lang);
    const undo = page.locator('#ntUndo'), reset = page.locator('#ntReset'), next = page.locator('#bpNext');
    await next.scrollIntoViewIfNeeded();
    for (const b of [undo, reset]) { await expect(b.locator('svg.ic')).toHaveCount(1); expect((await b.getAttribute('aria-label'))?.trim()).toBeTruthy(); expect((await b.getAttribute('title'))?.trim()).toBeTruthy(); }
    await expect(next.locator('svg.ic')).toHaveCount(1); // text + icon
    await next.tap(); await next.tap();
    await expect(next.locator('svg.ic')).toHaveCount(1);
    await expect(page.locator('#bpPrev svg.ic')).toHaveCount(1);
    await page.goto(`./?lang=${lang}#T1`); await ready(page, 'T1', lang);
    const play = page.locator('#wPlay');
    if (await play.isVisible()) {
      await expect(play.locator('svg.ic')).toHaveCount(1); await play.tap(); await page.waitForTimeout(200);
      await expect(play.locator('svg.ic')).toHaveCount(1); await play.tap();
    }
  });
}
