import { test, expect, type Page } from '@playwright/test';
/* R39: layers 1, 2 (and 3, 5 once live) of the one-screen explorer. Every page opens; every card has page 1 (①–④) and
   page 2 (⑤) and closes with 返回; nothing sticks out, is cut or overlaps at 360×640 and 390×844 in zh and en; a box
   with + opens in place. */
import { LX, LIVE, lxHash } from '../../src/lx/ids';
const ORIGIN = 'http://localhost:4173';
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: [{ name: 'si.fs', value: '0' }, { name: 'si.a2hs', value: '1' }] }] } });

const LAYERS = ([1, 2, 3, 5] as const).filter((n) => LIVE.includes(n));
const PAGES = LAYERS.flatMap((n) => LX[n]);
const CARDS: Record<number, string[]> = {
  1: [1, 2, 3, 4, 5, 6].map((i) => 'KA0' + i), 2: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => 'KB0' + i),
  3: Array.from({ length: 12 }, (_, i) => 'KC' + String(i + 1).padStart(2, '0')), 5: Array.from({ length: 12 }, (_, i) => 'KM' + String(i + 1).padStart(2, '0')),
};
const ALLCARDS = LAYERS.flatMap((n) => CARDS[n]!);

async function open(p: Page, q: string) {
  const errs: string[] = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(q); await p.locator('#l4').waitFor({ state: 'attached', timeout: 20000 });
  return errs;
}
async function at(p: Page, id: string, lang: string) {
  const h = lxHash(id); await p.evaluate((x) => { location.hash = x; }, h);
  await p.waitForFunction((want) => document.getElementById('l4')?.dataset.lx === want, `${id}.${lang}`, { timeout: 20000 });
}
async function layoutOk(p: Page) {
  return p.evaluate(() => {
    const bad: string[] = []; const W = innerWidth, H = innerHeight;
    const vis = (e: Element) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
    const R = (e: Element) => e.getBoundingClientRect();
    for (const s of ['.l4-top', '.l4-cr', '.l4-info', '.l4-hint', '.l4-dots', '.l4-nav', '.lx-lb', '.lx-pn', '.lx-el', '.lx-fl']) for (const e of document.querySelectorAll(s)) {
      if (!vis(e)) continue; const r = R(e); if (r.left < -0.5 || r.top < -0.5 || r.right > W + 0.5 || r.bottom > H + 0.5) bad.push(`out ${s} ${e.textContent?.slice(0, 16)}`);
    }
    for (const t of document.querySelectorAll<HTMLElement>('.lx-lb, .lx-lb .t, .lx-lb .s, .lx-el, .lx-fl, .l4-tt, .l4-r span')) if (vis(t) && (t.scrollWidth > t.clientWidth + 1 || t.scrollHeight > t.clientHeight + 1)) bad.push(`cut ${t.className} ${t.textContent?.slice(0, 20)}`);
    for (const e of document.querySelectorAll<HTMLElement>('.lx-pn, .l4-info')) if (vis(e) && e.scrollHeight > e.clientHeight + 2) bad.push(`scroll ${e.className} ${e.scrollHeight}>${e.clientHeight}`);
    const parts = [...document.querySelectorAll('.lx-lb, .lx-pn')].filter(vis);
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
      const a = R(parts[i]!), b = R(parts[j]!);
      if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) bad.push(`overlap ${parts[i]!.textContent?.slice(0, 12)} × ${parts[j]!.textContent?.slice(0, 12)}`);
    }
    const fs = [...document.querySelectorAll<HTMLElement>('#l4 *')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())).map((e) => parseFloat(getComputedStyle(e).fontSize));
    if (Math.min(...fs) < 12) bad.push(`font ${Math.min(...fs)}`);
    return bad;
  });
}

test.describe('R39 layers', () => {
  test('home: the live layers open their first page; 学 starts at layer 1', async ({ page }) => {
    const errs = await open(page, './?lang=zh#home');
    await expect(page.locator('.l4-lv.live')).toHaveCount(LIVE.length);
    await page.locator('.l4-hr.pri').click(); await expect(page).toHaveURL(/#L1$/);
    await page.waitForFunction(() => document.getElementById('l4')?.dataset.lx === 'L1.zh');
    expect(errs).toEqual([]);
  });
  test('every page opens with a title, a crumb, a four-row info box and a card button; next walks the layer', async ({ page }) => {
    const errs = await open(page, './?lang=zh#L1');
    for (const id of PAGES) {
      await at(page, id, 'zh');
      await expect(page.locator('.l4-info dt')).toHaveCount(4);
      await expect(page.locator('.l4-cr')).toBeVisible();
      if (id !== 'L3' && id !== 'L5') expect(await page.locator('.lx-pn').count()).toBeGreaterThan(0); /* the layer-3 overview and the maths map are diagram-only */
    }
    await at(page, 'L1', 'zh'); await page.locator('[data-a="next"]').click(); await expect(page).toHaveURL(/#L1\/1$/);
    expect(errs).toEqual([]);
  });
  test('a box with + opens in place and the page changes', async ({ page }) => {
    const errs = await open(page, './?lang=zh#L1');
    for (const id of PAGES) {
      await at(page, id, 'zh'); const pl = page.locator('.lx-lb.plus'); if (!(await pl.count())) continue;
      const before = page.url(); await pl.first().click();
      await expect.poll(() => page.url()).not.toBe(before);
      await page.waitForFunction(() => !!document.getElementById('l4')?.dataset.lx);
      break;
    }
    await at(page, 'L2', 'zh'); await page.locator('.lx-lb.plus').first().click();
    await page.waitForFunction(() => /^L2-\d\.zh$/.test(document.getElementById('l4')?.dataset.lx ?? ''));
    expect(errs).toEqual([]);
  });
  for (const lang of ['zh', 'en']) test(`every card has ①–④ then ⑤ (续), 返回 closes (${lang})`, async ({ page }, ti) => {
    test.skip(ti.project.name !== 'm390', 'one project is enough'); test.setTimeout(240000);
    const errs = await open(page, `./?lang=${lang}#L1`);
    for (const k of ALLCARDS) {
      const base = k.startsWith('KM') ? '#L5' : k.startsWith('KC') ? '#L3' : k.startsWith('KB') ? '#L2' : '#L1';
      await page.evaluate((x) => { location.hash = x; }, `${base}~${k}`);
      const sh = page.locator(`.l4-sheet[data-card="${k}"]`); await expect(sh).toBeVisible();
      await expect(sh.locator('.l4-ks')).toHaveCount(4); await expect(sh.locator('.l4-kh.c1')).toBeVisible();
      await sh.locator('[data-s="flip"]').click();
      await expect(page.locator(`.l4-sheet[data-card="${k}"][data-p="2"] .l4-kh.c5`)).toBeVisible();
      await expect(page.locator('.l4-sheet .l4-ks')).toHaveCount(1);
      await page.locator('.l4-sheet [data-s="close"]').click(); await expect(page.locator('.l4-sheet')).toHaveCount(0);
    }
    expect(errs).toEqual([]);
  });
});

for (const [w, h] of [[360, 640], [390, 844], [430, 932]] as const) for (const lang of ['zh', 'en'] as const) {
  test(`R39 no overflow, cut text or overlap on any layer page at ${w}×${h} ${lang}`, async ({ page }, ti) => {
    test.skip(ti.project.name !== 'm360', 'one sweep is enough; it sets its own viewport');
    test.setTimeout(240000); await page.setViewportSize({ width: w, height: h });
    const errs = await open(page, `./?lang=${lang}#L1`); const bad: string[] = [];
    for (const id of PAGES) { await at(page, id, lang); await page.waitForTimeout(150); for (const b of await layoutOk(page)) bad.push(`${id}: ${b}`); }
    expect(bad).toEqual([]); expect(errs).toEqual([]);
  });
}
