/* R18: (1) the top-bar station name is never cut with '…' — it wraps to two lines at a smaller size — on every station, zh
   and en, at 360 and 412 px, without growing the bar or touching the arrows / search / share / EN; (2) the stop-dot strip
   under each station is one ≥ 44px-tall scrub control: a tap lands on the nearest dot, press-and-slide shows the stop name
   and goes on lift, dragging out of the strip cancels; keyboard (Enter on a dot) and the arrows still work. */
import { test, expect, type Page } from '@playwright/test';
import { isR28, swipe } from './r28h';

type Lang = 'zh' | 'en';
const ready = (page: Page, S: string, lang: Lang) => page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached', timeout: 15_000 });
const ORDER = ['T1', 'U', 'Ua', 'Ub', 'Uc', 'Ud', 'Up', 'Api', 'Loc', 'Job', 'Skl', 'Bld', 'T2', 'T3', 'N', 'T4', 'T4a', 'T4b', 'T5', 'T6', 'T7', 'T8', 'K1', 'K2', 'K3', 'K4', 'K5'];
const station = (page: Page) => page.evaluate(() => (window as unknown as { __si: { state(): { station: string } } }).__si.state().station);
const strip = (page: Page) => page.locator('section.level.active .m-pn .pn-dots').first();
async function toStrip(page: Page) {
  for (let k = 0; k < 3; k++) { await strip(page).evaluate((e) => e.scrollIntoView({ block: 'center' })); await page.waitForTimeout(250); }
  return (await strip(page).boundingBox())!;
}

test.beforeEach(async ({ page }) => { await page.addInitScript(() => localStorage.setItem('si.fs', '0')); });

for (const w of [360, 412]) for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang} ${w}px: every station name is readable in the top bar (no '…', ≤ 2 lines, no overlap, bar height kept)`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: w, height: 800 });
    for (const S of ORDER) {
      await page.goto(`./?lang=${lang}#${S}`); await ready(page, S, lang);
      await page.evaluate(() => document.fonts.ready);
      const r = await page.evaluate(() => {
        const b = document.querySelector('#tbWhere b') as HTMLElement, rc = (s: string) => document.querySelector(s)!.getBoundingClientRect();
        const lh = parseFloat(getComputedStyle(b).lineHeight), wh = rc('#tbWhere');
        return { name: b.textContent, title: b.title, dx: b.scrollWidth - b.clientWidth, dy: b.scrollHeight - b.clientHeight, lines: Math.round(b.getBoundingClientRect().height / lh),
          fs: parseFloat(getComputedStyle(b).fontSize), /* R28 pilot pages: no ‹ ›, the name sits between ☰ and search */ gapL: wh.left - rc(document.querySelector('#mPrev') ? '#mPrev' : '#mMenu').right, gapR: rc(document.querySelector('#mNext') ? '#mNext' : '#mSearch').left - wh.right,
          inBar: wh.top >= rc('#topbar').top - 0.5 && wh.bottom <= rc('#topbar').bottom + 0.5, bar: rc('#topbar').height };
      });
      expect(r.title, S).toBe(r.name);
      expect(r.dx, `${S} "${r.name}" cut sideways`).toBeLessThanOrEqual(1);
      expect(r.dy, `${S} "${r.name}" cut below`).toBeLessThanOrEqual(1);
      expect(r.lines, `${S} lines`).toBeLessThanOrEqual(2);
      expect(r.fs, `${S} font`).toBeGreaterThanOrEqual(11.5);
      expect(r.gapL, S).toBeGreaterThanOrEqual(-0.5); expect(r.gapR, S).toBeGreaterThanOrEqual(-0.5);
      expect(r.inBar, S).toBe(true); expect(r.bar, S).toBeLessThanOrEqual(58);
    }
  });
}

/* R28: the dot strip at the end of a stop is gone (its job, "jump to any stop", is the ☰ list; next / back are the bar's
   下一站 and a swipe). On the R28 skeleton the same two checks run against those owners. */
const R = isR28('T3');
const openDw = async (page: Page) => { await page.locator('#mMenu').click(); await expect(page.locator('#mDrawer')).toHaveClass(/open/);
  await page.waitForFunction(() => { const e = document.querySelector('#mDrawer [data-dw="T1"]'); if (!e) return false; const l = e.getBoundingClientRect().left; const w = window as unknown as { __dwl?: number }; const ok = l >= 0 && w.__dwl === l; w.__dwl = l; return ok; }, null, { polling: 100 }); };
for (const lang of ['zh', 'en'] as Lang[]) {
  if (R) {
    test(`${lang}: R28 — no dot strip at the stop end; ☰ lists all 27 stops as ≥ 44px rows inside the screen, each named`, async ({ page }) => {
      await page.goto(`./?lang=${lang}#T3`); await ready(page, 'T3', lang);
      await page.evaluate(() => window.scrollTo(0, 1e6)); await page.waitForTimeout(300);
      await expect(page.locator('section.level.active .m-pn .pn-dots')).toBeHidden();
      await openDw(page);
      const f = await page.evaluate((O) => O.map((S) => { const e = document.querySelector<HTMLElement>(`#mDrawer [data-dw="${S}"]`); if (!e) return S + ' missing'; e.scrollIntoView({ block: 'nearest' }); const r = e.getBoundingClientRect();
        return r.height < 44 ? `${S} ${r.height}px` : r.left < -0.5 || r.right > innerWidth + 0.5 ? `${S} outside` : !(e.getAttribute('aria-label') ?? '').length ? `${S} no name` : e.scrollWidth > e.clientWidth + 1 ? `${S} cut` : ''; }).filter(Boolean), ORDER);
      expect(f).toEqual([]);
      await expect(page.locator('#mDrawer [data-dw="T3"]')).toHaveAttribute('aria-current', 'page');
    });

    test(`${lang}: R28 — ☰ row → that stop; Enter on a row works; bar 下一站 → next; swipe → back`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.goto(`./?lang=${lang}#T3`); await ready(page, 'T3', lang);
      await openDw(page); await page.locator('#mDrawer [data-dw="T4"]').tap();
      await ready(page, 'T4', lang); expect(await station(page)).toBe('T4');
      await openDw(page); await page.locator('#mDrawer [data-dw="K1"]').focus(); await page.keyboard.press('Enter');
      await ready(page, 'K1', lang); expect(await station(page)).toBe('K1');
      await page.locator('#bnav [data-bn="next"]').tap(); await ready(page, 'K2', lang);
      await swipe(page, -1); await ready(page, 'K1', lang); expect(await station(page)).toBe('K1');
    });
    continue;
  }
  test(`${lang}: the stop-dot strip is one ≥ 44px scrub control that fits next to the arrows`, async ({ page }) => {
    await page.goto(`./?lang=${lang}#T3`); await ready(page, 'T3', lang);
    const bb = await toStrip(page);
    expect(bb.height).toBeGreaterThanOrEqual(44); expect(bb.width).toBeGreaterThanOrEqual(40 * 4);
    const g = strip(page);
    await expect(g).toHaveAttribute('role', 'group'); expect((await g.getAttribute('aria-label'))!.length).toBeGreaterThan(4);
    const f = await page.evaluate(() => {
      const s = document.querySelector('section.level.active .m-pn .pn-dots')!, row = s.closest('.pn-row')!, d = [...s.querySelectorAll<HTMLElement>('.dt')];
      return { n: d.length, labels: d.every((x) => !!x.getAttribute('aria-label') && !!x.title), rowOver: row.scrollWidth - row.clientWidth, docOver: document.documentElement.scrollWidth - innerWidth,
        inside: d.every((x) => { const r = x.getBoundingClientRect(), q = s.getBoundingClientRect(); return r.left >= q.left - 0.5 && r.right <= q.right + 0.5; }) };
    });
    expect(f.n).toBe(ORDER.length); expect(f.labels).toBe(true); expect(f.inside).toBe(true);
    expect(f.rowOver).toBeLessThanOrEqual(0); expect(f.docOver).toBeLessThanOrEqual(0);
  });

  test(`${lang}: tap a dot → that stop; slide → tip names the stop, lift goes; drag out cancels; Enter and arrows work`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(`./?lang=${lang}#T3`); await ready(page, 'T3', lang);
    let bb = await toStrip(page);
    const ctr = (k: number) => page.evaluate((k) => { const r = document.querySelectorAll('section.level.active .m-pn .pn-dots .dt')[k]!.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, k);
    /* tap on the dot of stop 12 (T4) — top edge of the 44px strip, not the dot itself */
    let [x] = await ctr(ORDER.indexOf('T4')); await page.touchscreen.tap(x!, bb.y + 3);
    await ready(page, 'T4', lang); expect(await station(page)).toBe('T4');
    /* press-and-slide from T4's dot to K1's: the tip names K1 while pressed; lift → K1 */
    bb = await toStrip(page);
    [x] = await ctr(ORDER.indexOf('T4')); const [x2] = await ctr(ORDER.indexOf('K1'));
    await page.mouse.move(x!, bb.y + bb.height / 2); await page.mouse.down();
    await page.mouse.move(x2!, bb.y + bb.height / 2, { steps: 6 });
    const tip = page.locator('section.level.active .pn-tip');
    await expect(tip).toBeVisible(); await expect(tip).toContainText(lang === 'en' ? 'Calculus' : '微积分');
    await page.mouse.up(); await ready(page, 'K1', lang); expect(await station(page)).toBe('K1');
    /* press, slide, then drag well below the strip and lift → stays */
    bb = await toStrip(page);
    [x] = await ctr(ORDER.indexOf('T1'));
    await page.mouse.move(x!, bb.y + bb.height / 2); await page.mouse.down(); await page.mouse.move(x!, bb.y + bb.height + 80, { steps: 4 });
    await page.mouse.up(); await page.waitForTimeout(400);
    expect(await station(page)).toBe('K1'); await expect(tip).toHaveCount(0);
    /* keyboard: Enter on a focused dot */
    await page.locator('section.level.active .m-pn .pn-dots .dt').nth(ORDER.indexOf('T2')).focus(); await page.keyboard.press('Enter');
    await ready(page, 'T2', lang); expect(await station(page)).toBe('T2');
    /* arrows */
    await toStrip(page);
    await page.locator('section.level.active .m-pn .pn-b.pri').first().tap(); await ready(page, 'T3', lang);
    await toStrip(page);
    await page.locator('section.level.active .m-pn .pn-b:not(.pri)').first().tap(); await ready(page, 'T2', lang);
  });
}
