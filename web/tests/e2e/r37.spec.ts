import { test, expect, type Page } from '@playwright/test';
/* R37: three parts. 学 Learn is the knowledge tree: every station has a level (L0 what you see -> L5 the math) and a
   parent; a station page has a drill bar (up a level / how the parts fit and why / go deeper) that walks from the user's
   view down to the math. 练 Practice sits outside the tree: labs, quizzes and the learning record. 享 Share sits on top:
   milestone and knowledge cards (PNG, portrait 1080x1920 or 4:5) with a QR code to the site, never a quiz question.
   Everything is portrait first: 360x640 and 390x700 (short phones) as well as the 3 phone projects; landscape still works. */
type St = { r: { v: string; s?: string; p?: number }; kind: string; right: number };
type Rec = { st: Record<string, { seen?: number; lab?: number; r?: number; w?: number }>; mis: string[]; days: string[] };
type W3 = { state(): St; rec(): Rec };
const ready = (p: Page) => p.waitForFunction(() => document.getElementById('p3')?.dataset.ready === '1', null, { timeout: 30000 });
async function go(p: Page, hash: string, kind?: string) {
  await p.evaluate((h) => { location.hash = h; }, hash);
  await p.waitForFunction(([h, k]) => {
    const w = (window as unknown as { __w3?: W3 }).__w3; if (!w) return false;
    return location.hash === h && document.getElementById('p3')?.dataset.ready === '1' && (!k || w.state().kind === k);
  }, [hash, kind ?? ''] as const, { timeout: 30000 });
}
const st = (p: Page) => p.evaluate(() => (window as unknown as { __w3: W3 }).__w3.state());
const rec = (p: Page) => p.evaluate(() => (window as unknown as { __w3: W3 }).__w3.rec());
/** visible boxes of a selector, with cut-off and off-screen checks */
const boxes = (p: Page, sel: string) => p.evaluate((s) => [...document.querySelectorAll<HTMLElement>(s)].filter((e) => e.offsetParent !== null || getComputedStyle(e).position === 'fixed').map((e) => {
  const r = e.getBoundingClientRect(); return { t: (e.textContent ?? '').trim().slice(0, 30), x: r.left, y: r.top, r: r.right, b: r.bottom, cut: e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1 };
}), sel);
type B = Awaited<ReturnType<typeof boxes>>[number];
const ov = (a: B, c: B) => Math.min(a.r, c.r) - Math.max(a.x, c.x) > 1 && Math.min(a.b, c.b) - Math.max(a.y, c.y) > 1;
function tidy(bs: B[], w: number, where: string, apart = true) {
  for (const a of bs) { expect(a.cut, `${where}: "${a.t}" cut off`).toBe(false); expect(a.x, `${where}: "${a.t}" off left`).toBeGreaterThanOrEqual(-1); expect(a.r, `${where}: "${a.t}" off right`).toBeLessThanOrEqual(w + 1); }
  if (apart) for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) expect(ov(bs[i]!, bs[j]!), `${where}: "${bs[i]!.t}" overlaps "${bs[j]!.t}"`).toBe(false);
}
const SIZES = [[360, 640], [390, 700]] as const;

test.describe('R37 learn / practice / share', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.setTimeout(300_000);
  test.beforeEach(async ({ context }) => { await context.addInitScript(() => { try { localStorage.setItem('si.fs', '0'); localStorage.setItem('si.a2hs', '1'); localStorage.setItem('si.w3.hi', '1'); } catch { /* */ } }); });

  for (const lang of ['zh', 'en'] as const) test(`${lang}: the three areas, portrait (short phones too) and landscape`, async ({ page }) => {
    const errs: string[] = []; page.on('pageerror', (e) => errs.push(String(e)));
    await page.goto(`./?lang=${lang}#learn`); await ready(page);
    for (const [w, h] of [...SIZES, [page.viewportSize()!.width, page.viewportSize()!.height] as const]) {
      await page.setViewportSize({ width: w, height: h });
      for (const a of ['learn', 'practice', 'share'] as const) {
        await go(page, `#${a}`);
        await expect(page.locator('.w3-ap .w3-ax .w3-at')).toHaveCount(3);
        await expect(page.locator(`.w3-ap .w3-at.on[data-h="#${a}"]`)).toHaveCount(1);
        await expect(page.locator(`.w3-ap .w3-ab[data-area="${a}"]`)).toBeVisible();
        const where = `${lang} ${w}x${h} #${a}`;
        tidy(await boxes(page, '.w3-ap .w3-at'), w, where);
        const ap = (await boxes(page, '.w3-ap'))[0]!, bot = (await boxes(page, '.p3-bot'))[0]!, stage = (await boxes(page, '.p3-stage'))[0]!;
        expect(ap.b, `${where}: panel runs under the round buttons`).toBeLessThanOrEqual(bot.y + 1);
        expect(stage.b - stage.y, `${where}: the tree has room`).toBeGreaterThan(150);
        // the tree: 6 level names in 3D, none cut off or overlapping
        await page.waitForFunction(() => document.querySelectorAll('.p3l').length === 6, null, { timeout: 15000 });
        tidy(await boxes(page, '.p3l'), w, `${where} tree`);
        // the visible panel rows stay inside the screen
        const rows = (await boxes(page, '.w3-ap .w3-chip, .w3-ap .w3-pb, .w3-ap .w3-tile, .w3-ap .w3-ms')).filter((b) => b.b > ap.y && b.y < ap.b);
        tidy(rows, w, `${where} rows`, false);
      }
    }
    // a tab tap switches the area; a chip opens its station
    await page.locator('.w3-at[data-h="#practice"]').click(); await expect(page).toHaveURL(/#practice$/);
    await page.locator('.w3-at[data-h="#learn"]').click(); await expect(page).toHaveURL(/#learn$/);
    await page.locator('.w3-chip[data-s="T4"]').scrollIntoViewIfNeeded(); await page.locator('.w3-chip[data-s="T4"]').click();
    await ready(page); expect((await st(page)).r.s).toBe('T4');
    await expect(page.locator('.p3-crumb .w3-lv')).toHaveText('L3');
    // the bottom tree button and the menu reach the areas
    await page.locator('.p3-bot [data-act="learn"]').click(); await expect(page).toHaveURL(/#learn$/);
    await page.locator('[data-act="menu"]').first().click();
    await expect(page.locator('.p3-sheet .w3-ar')).toHaveCount(3);
    // landscape still works: tree and panel side by side
    await page.setViewportSize({ width: 844, height: 390 }); await go(page, '#practice'); await page.waitForTimeout(300);
    const ap = (await boxes(page, '.w3-ap'))[0]!, stg = (await boxes(page, '.p3-stage'))[0]!;
    expect(ov(ap, stg)).toBe(false); await expect(page.locator('.w3-rot')).toBeVisible();
    expect(errs).toEqual([]);
  });

  for (const lang of ['zh', 'en'] as const) test(`${lang}: every zone drills down to the math (L5) and back up`, async ({ page }) => {
    const errs: string[] = []; page.on('pageerror', (e) => errs.push(String(e)));
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto(`./?lang=${lang}#home`); await ready(page);
    for (const s0 of ['U', 'Api', 'Job', 'Skl', 'T1', 'T6', 'K1']) {
      await go(page, `#${s0}`, 'ideas');
      const path: string[] = [s0]; let lv = -1;
      for (let i = 0; i < 9; i++) {
        await expect(page.locator('.w3-dr')).toBeVisible();
        const where = `${lang} ${path.join('>')}`;
        tidy(await boxes(page, '.w3-dr .w3-db'), 360, where);
        const dr = (await boxes(page, '.w3-dr'))[0]!, bot = (await boxes(page, '.p3-bot'))[0]!, top = (await boxes(page, '.p3-top'))[0]!;
        expect(dr.b, `${where}: drill bar under the buttons`).toBeLessThanOrEqual(bot.y + 1);
        const cb = (await boxes(page, '.p3-crumb b'))[0]!; expect(cb.b, `${where}: name below the top bar`).toBeLessThanOrEqual(top.b + 1); expect(cb.y).toBeGreaterThanOrEqual(top.y - 1);
        const l = Number((await page.locator('.p3-crumb .w3-lv').textContent())!.slice(1));
        expect(l, `${where}: levels go down`).toBeGreaterThanOrEqual(lv); lv = l;
        // how the parts fit and why: one tap explains it
        if (i === 0) { await page.locator('.w3-dr .co').click(); await expect(page.locator('.w3-card:not([hidden]) .w3-ch')).toHaveCount(2); const cd = (await boxes(page, '.w3-card'))[0]!; tidy([cd], 360, `${where} card`); await page.locator('.w3-card [data-act="cclose"]').click(); await expect(page.locator('.w3-card:not([hidden])')).toHaveCount(0); }
        const h = await page.locator('.w3-dr .dn').getAttribute('data-h');
        if (h === '#learn') break;
        await page.evaluate(() => document.querySelector<HTMLElement>('.w3-dr .dn')!.click());
        await go(page, h!, 'ideas'); path.push(h!.slice(1));
      }
      expect(lv, `${lang}: ${path.join('>')} ends at the math`).toBe(5);
      expect(path.length).toBeGreaterThan(1);
      // up a level goes to the parent, one level higher
      const uh = (await page.locator('.w3-dr .up').getAttribute('data-h'))!;
      await page.evaluate(() => document.querySelector<HTMLElement>('.w3-dr .up')!.click());
      await page.waitForFunction((h) => location.hash === h && document.getElementById('p3')?.dataset.ready === '1', uh, { timeout: 30000 });
      if (uh !== '#learn') await expect(page.locator('.p3-crumb .w3-lv')).toHaveText(new RegExp(`^L[0-${lv}]$`));
    }
    // a lab or quiz page leads back to its idea
    await go(page, '#T4/2'); await expect(page.locator('.w3-dr .bk')).toHaveAttribute('data-h', '#T4');
    expect(errs).toEqual([]);
  });

  test('a quiz answer updates the learning record, the practice page and the 3D tree', async ({ page }) => {
    const errs: string[] = []; page.on('pageerror', (e) => errs.push(String(e)));
    await page.setViewportSize({ width: 390, height: 700 });
    await page.goto('./?lang=zh#T1'); await ready(page);
    expect((await rec(page)).st.T1?.seen ?? 0).toBeGreaterThan(0); // opening it marks it seen
    const n = await page.locator('.w3-tab').count();
    await go(page, `#T1/${n - 2}`, 'quiz');
    await page.waitForFunction(() => document.querySelectorAll('.p3l[data-pick]').length >= 2, null, { timeout: 15000 });
    const s = await st(page), m = await page.locator('.p3l[data-pick]').count();
    await page.locator(`.p3l[data-pick="${(s.right + 1) % m}"]`).click(); // wrong first
    await page.waitForTimeout(400);
    await page.locator(`.p3l[data-pick="${s.right}"]`).click();
    await page.waitForTimeout(400);
    const r = await rec(page);
    expect(r.st.T1!.w).toBe(1); expect(r.mis).toContain('T1/0'); expect(r.days.length).toBe(1);
    await go(page, '#practice');
    await expect(page.locator('.w3-mis')).toHaveCount(1);
    await expect(page.locator('.w3-mis')).toHaveAttribute('data-h', /^#T1\//);
    await expect(page.locator('.w3-pr[data-s="T1"] .w3-sd')).not.toHaveClass(/s0/);
    await expect(page.locator('.w3-tile').first().locator('b')).not.toHaveText('0');
    // the first milestone is open now
    await go(page, '#share');
    await expect(page.locator('.w3-ms').first()).not.toHaveClass(/off/);
    expect(errs).toEqual([]);
  });

  for (const lang of ['zh', 'en'] as const) test(`${lang}: share cards are portrait PNGs with a knowledge point and a QR, never a question`, async ({ page }) => {
    const errs: string[] = []; page.on('pageerror', (e) => errs.push(String(e)));
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto(`./?lang=${lang}#T4`); await ready(page);
    // the quiz questions of T4, to make sure none lands on a card
    const n = await page.locator('.w3-tab').count(); await go(page, `#T4/${n - 2}`, 'quiz');
    const q = ((await page.locator('.p3-say').textContent()) ?? '').trim();
    await go(page, '#T4', 'ideas');
    await page.locator('.p3-top [data-act="share"]').click();
    const sc = page.locator('.w3-sc'); await expect(sc).toBeVisible({ timeout: 20000 });
    await expect(sc).toHaveAttribute('data-w', '1080'); await expect(sc).toHaveAttribute('data-h', '1920');
    expect(Number(await sc.getAttribute('data-bytes'))).toBeGreaterThan(30000);
    expect(await sc.getAttribute('data-url')).toBe(`https://superjackman.github.io/SI/?lang=${lang}#T4`);
    const text = (await sc.getAttribute('data-text'))!;
    expect(text.length).toBeGreaterThan(30); expect(text).not.toMatch(/[?？]\s*$/m);
    if (q.length > 8) expect(text).not.toContain(q.slice(0, 12));
    // the picture: the QR corner is a busy black and white square, the card is not empty
    const px = await page.evaluate(async () => {
      const img = document.querySelector<HTMLImageElement>('.w3-sc img')!; await img.decode();
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const g = c.getContext('2d')!; g.drawImage(img, 0, 0);
      const zone = (x: number, y: number, w: number, h: number) => { const d = g.getImageData(x, y, w, h).data; let dk = 0, n = 0, flips = 0, last = -1; for (let i = 0; i < d.length; i += 4) { const v = d[i]! + d[i + 1]! + d[i + 2]! < 300 ? 1 : 0; dk += v; n++; if (last >= 0 && v !== last) flips++; last = v; } return { dark: dk / n, flips }; };
      return { w: c.width, h: c.height, qr: zone(c.width - 330, c.height - 400, 300, 300), mid: zone(100, 500, 880, 600) };
    });
    expect(px.w).toBe(1080);
    expect(px.qr.dark).toBeGreaterThan(0.2); expect(px.qr.dark).toBeLessThan(0.8); expect(px.qr.flips).toBeGreaterThan(2000);
    expect(px.mid.flips).toBeGreaterThan(200);
    tidy(await boxes(page, '.w3-sc-a .p3-btn, .w3-sc-f button'), 360, `${lang} share dialog`);
    const im = (await boxes(page, '.w3-sc img'))[0]!; expect(im.b).toBeLessThanOrEqual(640); expect(im.y).toBeGreaterThanOrEqual(0);
    // 4:5 post
    await sc.locator('[data-f="post"]').click(); await expect(sc).toHaveAttribute('data-h', '1350');
    // save works without the Web Share API
    const dl = page.waitForEvent('download'); await sc.locator('[data-x="save"]').click(); expect((await dl).suggestedFilename()).toMatch(/^ai-explained-T4-post\.png$/);
    await sc.locator('.w3-scx').click(); await expect(sc).toHaveCount(0);
    // the share area: a knowledge chip makes a card, a milestone needs progress first
    await go(page, '#share');
    await expect(page.locator('.w3-ms button[disabled]').first()).toBeVisible();
    await page.locator('.w3-chip[data-act="card"][data-s="K2"]').scrollIntoViewIfNeeded(); await page.locator('.w3-chip[data-act="card"][data-s="K2"]').click();
    await expect(page.locator('.w3-sc')).toHaveAttribute('data-kind', 'node', { timeout: 20000 });
    expect(await page.locator('.w3-sc').getAttribute('data-url')).toContain('#K2');
    // #share/<station> opens that card straight away (a shared link)
    await page.goto(`./?lang=${lang}#share/T2`); await ready(page);
    await expect(page.locator('.w3-sc')).toHaveAttribute('data-url', new RegExp('#T2$'), { timeout: 20000 });
    // a milestone card carries its headline and a station
    await page.evaluate(() => (window as unknown as { __w3: { share(k: string, s: string, h?: string): Promise<unknown> } }).__w3.share('score', 'T3', '3/4'));
    await expect(page.locator('.w3-sc')).toHaveAttribute('data-kind', 'score');
    expect(await page.locator('.w3-sc').getAttribute('data-text')).toContain('3/4');
    expect(errs).toEqual([]);
  });
});
