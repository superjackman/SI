import { test, expect, type Page } from '@playwright/test';
/* R35: the 3D pages teach. Every station shows 2+ floating callouts tied to 3D points (ideas + lab), they never overlap
   each other or the bottom bar, a tap opens an info card (title, explanation, "try this"), the hint pill is readable
   (contrast >= 4.5, >= 14 px) and the page tabs are real word tabs (>= 36 px tall, >= 13 px text). */
const ST = ['U', 'Ua', 'Ub', 'Uc', 'Ud', 'Up', 'Api', 'Loc', 'Job', 'Skl', 'Bld', 'T1', 'T2', 'T3', 'N', 'T4', 'T4a', 'T4b', 'T5', 'T6', 'T7', 'T8', 'K1', 'K2', 'K3', 'K4', 'K5'];
type St = { r: { v: string; s?: string; p?: number; z?: number }; kind: string };
const ready = (p: Page) => p.waitForFunction(() => document.getElementById('p3')?.dataset.ready === '1', null, { timeout: 30000 });
async function go(p: Page, hash: string, kind?: string) {
  await p.evaluate((h) => { location.hash = h; }, hash);
  await p.waitForFunction(([h, k]) => {
    const w = (window as unknown as { __w3?: { state(): St } }).__w3; if (!w) return false;
    return location.hash === h && document.getElementById('p3')?.dataset.ready === '1' && (!k || w.state().kind === k);
  }, [hash, kind ?? ''] as const, { timeout: 30000 });
}
/** visible callout boxes and the top of the bottom bar, after the layout has settled */
async function boxes(p: Page, min: number) {
  await p.waitForFunction((m) => document.querySelectorAll('.w3n:not(.w3n-off)').length >= m, min, { timeout: 15000 }).catch(() => undefined);
  await p.waitForTimeout(400);
  return p.evaluate(() => {
    const bs = [...document.querySelectorAll<HTMLElement>('.w3n:not(.w3n-off)')].map((el) => {
      const b = (el.classList.contains('w3n-x') ? el : (el.firstElementChild as HTMLElement) ?? el).getBoundingClientRect();
      return { x: b.left, y: b.top, r: b.right, b: b.bottom, t: (el.textContent ?? '').trim().slice(0, 30) };
    }).filter((b) => b.r - b.x > 4 && b.b - b.y > 4);
    const tops = [...document.querySelectorAll<HTMLElement>('.p3-foot, .w3-len')].filter((e) => e.offsetParent).map((e) => e.getBoundingClientRect().top);
    return { bs, foot: Math.min(...tops, innerHeight), w: innerWidth };
  });
}
function clean(r: Awaited<ReturnType<typeof boxes>>, where: string) {
  for (const b of r.bs) {
    expect(b.b, `${where}: "${b.t}" crosses the bottom bar`).toBeLessThanOrEqual(r.foot + 1);
    expect(b.x, `${where}: "${b.t}" off the left edge`).toBeGreaterThanOrEqual(-1);
    expect(b.r, `${where}: "${b.t}" off the right edge`).toBeLessThanOrEqual(r.w + 1);
  }
  for (let i = 0; i < r.bs.length; i++) for (let j = i + 1; j < r.bs.length; j++) {
    const a = r.bs[i]!, c = r.bs[j]!, ov = Math.min(a.r, c.r) - Math.max(a.x, c.x) > 1 && Math.min(a.b, c.b) - Math.max(a.y, c.y) > 1;
    expect(ov, `${where}: "${a.t}" overlaps "${c.t}"`).toBe(false);
  }
}
const lum = (c: string) => {
  const m = c.match(/[\d.]+/g)!.map(Number), f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(m[0]!) + 0.7152 * f(m[1]!) + 0.0722 * f(m[2]!);
};

test.describe('R35 teaching callouts', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.setTimeout(600_000); // software WebGL: 27 stations x 2 pages
  test.beforeEach(async ({ context }) => { await context.addInitScript(() => { try { localStorage.setItem('si.fs', '0'); localStorage.setItem('si.a2hs', '1'); localStorage.setItem('si.w3.hi', '1'); } catch { /* */ } }); });

  for (const lang of ['zh', 'en'] as const) test(`${lang}: every station has 2+ callouts on its first idea and its lab, none overlapping`, async ({ page }) => {
    const errs: string[] = []; page.on('pageerror', (e) => errs.push(String(e)));
    await page.goto(`./?lang=${lang}#home`); await ready(page);
    const thin: string[] = [];
    for (const s of ST) {
      await go(page, `#${s}`, 'ideas');
      let r = await boxes(page, 2); if (r.bs.length < 2) thin.push(`${s} ideas ${r.bs.length}`); clean(r, `${s} ideas`);
      const n = await page.locator('.w3-tab').count(); expect(n).toBeGreaterThanOrEqual(4);
      await go(page, `#${s}/${n - 3}`, 'lab');
      r = await boxes(page, 2); if (r.bs.length < 2) thin.push(`${s} lab ${r.bs.length}`); clean(r, `${s} lab`);
    }
    expect(thin).toEqual([]);
    expect(errs).toEqual([]);
  });

  test('home, a zone and the map carry callouts too; tapping a lab callout opens an info card that closes', async ({ page }) => {
    const errs: string[] = []; page.on('pageerror', (e) => errs.push(String(e)));
    await page.goto('./?lang=zh#home'); await ready(page);
    for (const h of ['#home', '#z1', '#z4', '#map']) {
      await go(page, h); const r = await boxes(page, 2);
      expect(r.bs.length, `${h} callouts`).toBeGreaterThanOrEqual(2); clean(r, h);
    }
    /* an idea label: the bubble explains and says what to try */
    await go(page, '#T1', 'ideas'); await boxes(page, 2);
    await page.locator('.p3l[data-pick="0"]').click();
    const bub = page.locator('.p3b:not([hidden]) .p3b-in');
    await expect(bub.locator('p.w3-w')).toBeVisible(); await expect(bub.locator('p.w3-try')).toBeVisible();
    /* tapping the ⓘ marker on a 3D stand opens that stand's bubble too */
    await page.locator('.p3b:not([hidden]) .p3x').first().click().catch(() => undefined);
    await go(page, '#T2', 'ideas'); await boxes(page, 2);
    await page.locator('.w3n-d[data-pick]:not([hidden])').first().click();
    await expect(page.locator('.p3b:not([hidden]) .p3b-in p.w3-try')).toBeVisible();
    /* a lab callout: a card with a title, the explanation and a "try this" line; × and an outside tap both close it */
    await go(page, '#T4b/2', 'lab'); await boxes(page, 2);
    const note = page.locator('.w3n-x:not(.w3n-off)').first(); await expect(note).toBeVisible();
    await expect(note.locator('.w3n-i')).toHaveCount(1); // the ⓘ shows it can be tapped
    await note.click();
    const card = page.locator('.w3-card:not([hidden])'); await expect(card).toBeVisible();
    expect(((await card.locator('h3, b, strong').first().textContent()) ?? '').trim().length).toBeGreaterThan(1);
    expect(((await card.locator('p').first().textContent()) ?? '').trim().length).toBeGreaterThan(20);
    await expect(card.locator('.w3-try')).toBeVisible();
    await card.locator('[data-act=cclose]').click(); await expect(page.locator('.w3-card:not([hidden])')).toHaveCount(0);
    await note.click(); await expect(card).toBeVisible();
    await page.mouse.click(20, 300); await expect(page.locator('.w3-card:not([hidden])')).toHaveCount(0);
    /* the pulsing ⓘ on the 3D part itself is a 44 px target and opens the same card */
    const dot = page.locator('.w3n-d:not([hidden])').first(); await expect(dot).toBeVisible();
    const db = (await dot.boundingBox())!; expect(Math.min(db.width, db.height)).toBeGreaterThanOrEqual(44);
    await dot.click(); await expect(card).toBeVisible();
    await card.locator('[data-act=cclose]').click(); await expect(page.locator('.w3-card:not([hidden])')).toHaveCount(0);
    expect(errs).toEqual([]);
  });

  test('the hint pill is readable and the page tabs are word tabs big enough to tap', async ({ page }) => {
    await page.goto('./?lang=zh#T1/2'); await ready(page);
    for (const lang of ['zh', 'en']) {
      if (lang === 'en') { await page.goto('./?lang=en#T1/2'); await ready(page); }
      const say = page.locator('.p3-say'); await expect(say).toBeVisible();
      const c = await say.evaluate((e) => { const s = getComputedStyle(e); return { fg: s.color, bg: s.backgroundColor, fs: parseFloat(s.fontSize), op: s.opacity }; });
      const a = lum(c.fg), b = lum(c.bg), k = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      expect(k, `${lang} hint contrast ${c.fg} on ${c.bg}`).toBeGreaterThanOrEqual(4.5);
      expect(c.fs).toBeGreaterThanOrEqual(14); expect(c.op).toBe('1');
      const tabs = await page.locator('.w3-tab').evaluateAll((es) => es.map((e) => { const r = e.getBoundingClientRect(); return { h: r.height, r: r.right, fs: parseFloat(getComputedStyle(e).fontSize), t: (e.textContent ?? '').trim() }; }));
      expect(tabs.length).toBeGreaterThanOrEqual(4);
      for (const t of tabs) { expect(t.h).toBeGreaterThanOrEqual(36); expect(t.fs).toBeGreaterThanOrEqual(13); expect(t.t).toMatch(/[\p{L}]{2,}/u); expect(t.r).toBeLessThanOrEqual(page.viewportSize()!.width + 1); }
    }
  });
});
