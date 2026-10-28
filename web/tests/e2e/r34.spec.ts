import { test, expect, type Page, type Browser } from '@playwright/test';
import { resolveBase } from '../../base.config.mjs';
/* R34: the all-3D site is the default. Every page is a three.js scene: welcome → home island (5 zones) → zone hall →
   station (idea stands → experiment → quiz → medal) → next station / progress map. Classic pages stay one tap away
   (?classic=1, remembered until ?w=3d); hash links (#T1) open stations; only one scene is alive; no WebGL → flat. */
type St = { r: { v: string; s?: string; p?: number; z?: number }; kind: string; foc: number | null; why: boolean; live: boolean; qi: number; right: number; lab: boolean; wrong: number };
const W3 = (p: Page) => p.evaluate(() => (window as unknown as { __w3: { state(): St } }).__w3.state());
const ready = (p: Page) => p.waitForFunction(() => document.getElementById('p3')?.dataset.ready === '1', null, { timeout: 30000 });
async function open(p: Page, q: string) {
  const errs: string[] = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(q); await ready(p);
  return errs;
}
/** walk an experiment to its end through the scene's own pick handler (the same one a tap or a label button calls) */
async function solveLab(p: Page) {
  for (let t = 0; t < 6 && !(await W3(p)).lab; t++) {
    await p.evaluate((t) => {
      const w = (window as unknown as { __w3: { view(): { set(x: object): void; slider?: { min: number; max: number } }; state(): St } }).__w3, v = w.view(), s = v.slider;
      const inp = document.querySelector<HTMLInputElement>('.w3-len input')!;
      if (s) for (const val of [s.min, (s.min + s.max) / 2, s.max, s.max, s.min]) { inp.value = String(val); inp.dispatchEvent(new Event('input', { bubbles: true })); }
      for (let i = 0; i < 8; i++) for (let b = 0; b < 9; b++) { v.set({ pick: i }); v.set({ pick: b }); if (w.state().lab) return; }
      for (let i = 0; i < 20; i++) v.set({ pick: (i + t) % 6 });
    }, t);
    await p.waitForTimeout(300);
  }
}

test.describe('R34 all-3D site', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.setTimeout(150_000); // software WebGL on the test box: a scene takes a few seconds
  test.beforeEach(async ({ context }) => { await context.addInitScript(() => { try { localStorage.setItem('si.fs', '0'); localStorage.setItem('si.a2hs', '1'); } catch { /* */ } }); });

  test('first visit: 3D by default, the welcome card, then the home island of five zones', async ({ page }) => {
    const got: string[] = []; page.on('request', (r) => { if (/\/assets\/classic-[\w-]+\.js$/.test(r.url())) got.push(r.url()); });
    const errs = await open(page, './?lang=zh');
    await expect(page.locator('#p3')).toHaveAttribute('data-mode', '3d');
    await expect(page.locator('.p3-stage canvas')).toHaveCount(1);
    await expect(page.locator('.w3-wel')).toBeVisible();
    await page.locator('[data-act=start]').click(); await ready(page);
    expect((await W3(page)).r.v).toBe('home');
    await expect(page.locator('.p3l')).toHaveCount(5); // five zone emblems on the island
    expect(got).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)).toBe(true);
    /* a second visit skips the welcome */
    await page.goto('./?lang=zh'); await ready(page); expect((await W3(page)).r.v).toBe('home');
    expect(errs).toEqual([]);
  });

  test('home → zone → station flow; a station: ideas with bubble, why, experiment, quiz with a hint, medal, next', async ({ page }) => {
    const errs = await open(page, './?lang=zh#z1');
    expect((await W3(page)).r).toEqual({ v: 'zone', z: 1, i: 0 });
    await page.locator('[data-act=next]').click(); await ready(page);
    let s = await W3(page); expect(s.r).toEqual({ v: 'st', s: 'T1', p: 0 }); expect(s.kind).toBe('ideas');
    await expect(page.locator('.p3-dot')).toHaveCount(5);
    await page.locator('.p3l[data-pick="0"]').click();
    const bub = page.locator('.p3b:not([hidden]) .p3b-in'); await expect(bub).toBeVisible();
    /* R35: the bubble teaches in one go: the idea, why it matters, and what to try in the lab (no separate why button) */
    await expect(bub.locator('p.w3-w')).toBeVisible(); await expect(bub.locator('p.w3-try')).toContainText('🔬');
    await page.locator('.p3b:not([hidden]) [data-act=deep]').click(); await ready(page);
    s = await W3(page); expect(s.kind).toBe('lab'); expect(page.url()).toContain('#T1/2');
    await expect(page.locator('.w3-bulb')).toBeVisible();
    await solveLab(page); expect((await W3(page)).lab).toBe(true);
    await expect(page.locator('[data-act=next].w3-glow')).toHaveCount(1);
    await page.locator('.p3-bot [data-act=next]').click(); await ready(page);
    s = await W3(page); expect(s.kind).toBe('quiz');
    await expect(page.locator('.p3-bot [data-act=next]')).toBeHidden();
    /* a wrong block: the lightbulb hint, try again */
    await page.locator(`.p3l[data-pick="${(s.right + 1) % 3}"]`).click();
    await expect(page.locator('#p3')).toHaveAttribute('data-q', 'bad');
    expect((await W3(page)).why).toBe(true); await expect(page.locator('.p3-say')).toContainText('💡');
    for (let g = 0; g < 4 && (await W3(page)).kind === 'quiz'; g++) {
      await page.locator(`.p3l[data-pick="${(await W3(page)).right}"]`).click();
      await page.waitForTimeout(2900); // R35: the right answer's why stays up a little longer
    }
    await ready(page); s = await W3(page); expect(s.kind).toBe('reward');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('si.w3.done') ?? '[]'))).toContain('T1');
    await expect(page.locator('.w3-rb [data-act=next]')).toBeVisible();
    await page.locator('.w3-rb [data-act=next]').click(); await ready(page);
    expect((await W3(page)).r).toEqual({ v: 'st', s: 'U', p: 0 });
    await expect(page.locator('.p3-stage canvas')).toHaveCount(1); // one scene alive
    expect(errs).toEqual([]);
  });

  test('map, menu, search, progress, language, back', async ({ page }) => {
    const errs = await open(page, './?lang=zh#map');
    await expect(page.locator('.p3l')).toHaveCount(5);
    await page.locator('.p3l[data-pick="2"]').click(); await ready(page);
    expect((await W3(page)).r).toEqual({ v: 'zone', z: 3, i: 0 });
    await page.locator('[data-act=search]').click(); await page.fill('.p3-q', '苹果');
    await expect(page.locator('.p3-res .p3-row').first()).toBeVisible({ timeout: 8000 });
    await page.locator('.p3-res .p3-row').first().click(); await ready(page);
    expect((await W3(page)).r.s).toBe('T4a');
    await page.locator('[data-act=prog]').click(); await expect(page.locator('.p3-sheet h2')).toContainText('/ 27');
    await page.locator('[data-act=sclose]').click();
    await page.locator('.p3-back').click(); await ready(page);
    expect((await W3(page)).r.v).toBe('zone');
    await page.locator('[data-act=menu]').click(); await page.locator('.p3-sheet [data-act=lang]').click(); await ready(page);
    await expect(page.locator('#p3')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.p3-say')).toContainText('station');
    await page.goBack(); await ready(page); expect((await W3(page)).r.s).toBe('T4a');
    expect(errs).toEqual([]);
  });

  test('classic version: one tap away, remembered, and ?w=3d comes back', async ({ page }) => {
    await open(page, './?lang=zh#T3');
    await page.locator('[data-act=menu]').click(); await page.locator('.p3-sheet [data-act=classic]').click();
    await page.locator('html[data-si-ready]').waitFor({ state: 'attached', timeout: 20000 });
    expect(page.url()).toContain('classic=1'); expect(page.url()).toContain('#T3');
    await expect(page.locator('#p3')).toHaveCount(0);
    await page.goto('./?lang=zh'); await page.locator('html[data-si-ready]').waitFor({ state: 'attached', timeout: 20000 });
    await expect(page.locator('#p3')).toHaveCount(0);
    await page.goto('./?w=3d&lang=zh'); await ready(page);
    await expect(page.locator('#p3')).toHaveAttribute('data-mode', '3d');
  });

  test('no WebGL: the same flow on flat cards (quiz answers are buttons)', async ({ page }) => {
    const errs = await open(page, './?fb=1&lang=en#T2/2');
    await expect(page.locator('#p3')).toHaveAttribute('data-mode', 'flat');
    await expect(page.locator('.p3-stage canvas')).toHaveCount(0);
    expect((await W3(page)).kind).toBe('lab');
    await page.locator('.p3-bot [data-act=next]').click(); await ready(page);
    for (let g = 0; g < 4 && (await W3(page)).kind === 'quiz'; g++) { await page.locator(`.p3-card[data-pick="${(await W3(page)).right}"]`).click(); await page.waitForTimeout(800); }
    expect((await W3(page)).kind).toBe('reward');
    expect(errs).toEqual([]);
  });

  test('a hidden tab frees the scene; coming back builds it again', async ({ page }) => {
    await open(page, './?lang=zh#K2/2');
    expect((await W3(page)).live).toBe(true);
    await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    expect((await W3(page)).live).toBe(false); await expect(page.locator('.p3-stage canvas')).toHaveCount(0);
    await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await ready(page); expect((await W3(page)).live).toBe(true);
  });
});

/* page views in the 3D site, on the committed repo layout (real-looking host, pixels intercepted, never sent) */
const BASE: string = resolveBase();
const REPO = process.env.SI_E2E_SERVE === 'repo' && BASE === '/SI/';
const GC = 'https://superjackman-si.goatcounter.com/count';
test.describe('R34 visit counting in the 3D site', () => {
  test.skip(!REPO, 'needs SI_TARGET=root SI_E2E_SERVE=repo');
  let b: Browser;
  test.beforeAll(async ({ playwright }) => { b = await playwright.chromium.launch({ channel: 'chrome', args: ['--host-resolver-rules=MAP si.test 127.0.0.1'] }); });
  test.afterAll(async () => { await b?.close(); });
  test('a station link counts that station; moving to another station counts it', async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const hits: string[] = [];
    await ctx.route(GC + '**', (r) => { hits.push(new URL(r.request().url()).searchParams.get('p')!); return r.fulfill({ status: 200, contentType: 'image/gif', body: Buffer.from('R0lGODlhAQABAAAAACw=', 'base64') }); });
    await ctx.route((u) => u.hostname !== 'si.test' && !u.href.startsWith(GC), (r) => r.abort());
    const p = await ctx.newPage();
    await p.goto(`http://si.test:4173${BASE}?lang=zh#T3`);
    await expect.poll(() => hits, { timeout: 15_000 }).toContain('/zh/T3');
    await p.evaluate(() => { location.hash = '#T4a'; });
    await expect.poll(() => hits, { timeout: 15_000 }).toContain('/zh/T4a');
    await ctx.close();
  });
});
