import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolveBase } from '../../base.config.mjs';
/* R5 cutover checks on the committed repo layout served like GitHub Pages (SI_E2E_SERVE=repo, base /SI/):
   old shared links, /SI/legacy.html, the /SI/next/ redirect, the analytics pixel (intercepted, never sent) and
   recovery for a browser that still has the old /SI/next/index.html cached. */
const BASE: string = resolveBase();
const REPO = process.env.SI_E2E_SERVE === 'repo' && BASE === '/SI/';
const PORT = 4173;
const GC = 'https://superjackman-si.goatcounter.com/count';
const git = (...a: string[]) => execFileSync('git', a, { cwd: new URL('../../..', import.meta.url).pathname });

async function ready(page: Page, key: string) {
  await page.locator(`html[data-si-ready="${key}"]`).waitFor({ state: 'attached', timeout: 15_000 });
  /* R27: the home page H has its own top (.hm), no .pagehead */
  await expect(page.locator(key.startsWith('H.') ? 'section#H.level.active .hm' : 'section.level.active .pagehead')).toBeVisible();
}
const path = (page: Page) => { const u = new URL(page.url()); return u.pathname + u.search + u.hash; };

test.describe('cutover (repo layout under /SI/)', () => {
  test.skip(!REPO, 'needs SI_TARGET=root SI_E2E_SERVE=repo');

  /* R27: a bare ?lang=en opens the home page H (it used to open T1) */
  for (const [link, key] of [['?lang=en', 'H.en'], ['#T3&lang=en', 'T3.en'], ['?lang=zh#T5', 'T5.zh'], ['?lang=en#T4a', 'T4a.en'], ['#N', 'N.zh'], ['#/T6?lang=en', 'T6.en']] as const) {
    test(`old shared link /SI/${link} opens ${key}`, async ({ page }) => {
      await page.goto(BASE + link);
      await ready(page, key);
      expect(await page.evaluate(() => document.documentElement.lang)).toBe(key.endsWith('en') ? 'en' : 'zh-CN');
    });
  }

  test('/SI/legacy.html is the old page byte for byte and still works on its own', async ({ page }) => {
    const errors: string[] = [], external: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('request', (r) => { const u = new URL(r.url()); if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1' && u.protocol !== 'data:') external.push(r.url()); });
    const body = await (await page.request.get(BASE + 'legacy.html')).body();
    const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
    expect(sha(body)).toBe(sha(git('show', 'a7eba9d:index.html')));
    await page.goto(BASE + 'legacy.html?lang=en#T3');
    await page.waitForFunction(() => (window as unknown as { __explainerReady?: boolean }).__explainerReady === true);
    await expect(page.locator('section#T3.active')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');
    expect(await page.evaluate(() => (window as unknown as { __gc: { off: boolean } }).__gc.off)).toBe(true); // no count from localhost
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
  });

  for (const [from, to, key] of [
    ['next/?lang=en#T3', '?lang=en#T3', 'T3.en'],
    ['next/#T3&lang=en', '#T3&lang=en', 'T3.en'],
    ['next?lang=en#T5', '?lang=en#T5', 'T5.en'],
    ['next/?_r=123&lang=en#T4', '?lang=en#T4', 'T4.en'],
    ['next/', '', 'H.zh'], // R27: a bare address opens the home page H
    ['next/index.html#T7', '#T7', 'T7.zh'],
  ] as const) {
    test(`/SI/${from} → /SI/${to}`, async ({ page }) => {
      await page.goto(BASE + from);
      await expect.poll(() => path(page)).toBe(BASE + to);
      await ready(page, key);
    });
  }

  test('a browser with the old /SI/next/index.html cached (its assets are gone) ends up on /SI/ with query + hash', async ({ page }) => {
    const oldNext = git('show', '38cc174:next/index.html').toString();
    let served = 0;
    await page.route((u) => u.pathname === BASE + 'next/', (r) => {
      if (served++) return r.fallback();
      return r.fulfill({ status: 200, contentType: 'text/html', headers: { 'cache-control': 'max-age=600' }, body: oldNext });
    });
    const missing: string[] = [];
    page.on('response', (r) => { if (r.status() === 404) missing.push(new URL(r.url()).pathname); });
    await page.goto(BASE + 'next/?lang=en#T3');
    await expect.poll(() => path(page), { timeout: 15_000 }).toBe(BASE + '?lang=en#T3');
    await ready(page, 'T3.en');
    expect(missing.some((m) => m.startsWith(BASE + 'next/assets/index-'))).toBe(true);
    expect(served).toBe(2); // the stale copy once, then the cache-busting reload got the redirect page
  });

  test('analytics: one GoatCounter pixel per stop and language + live lab/quiz events, only after load, never from localhost (intercepted, not sent)', async ({ playwright, page }) => {
    /* localhost: nothing */
    const local: string[] = [];
    page.on('request', (r) => { if (r.url().startsWith(GC)) local.push(r.url()); });
    await page.goto(BASE + '?lang=en#T3'); await ready(page, 'T3.en');
    await page.locator('#labTok button').first().click();
    await page.locator('#quizT3 .opt').first().click();
    await page.waitForTimeout(1500);
    expect(local).toEqual([]);

    /* a real-looking host (si.test → 127.0.0.1) */
    const b = await playwright.chromium.launch({ channel: 'chrome', args: ['--host-resolver-rules=MAP si.test 127.0.0.1'] });
    try {
      const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
      /* a returning visitor: a first visit also sends the welcome / tip events (evt-onb-show, evt-tip-*: events, not page views; covered in r29.spec) */
      await ctx.addInitScript(() => { try { localStorage.setItem('aiexp.v2.onb', '1'); localStorage.setItem('aiexp.v2.coach', '1'); localStorage.setItem('aiexp.v2.obtips', '["dd","ro","dots"]'); } catch { /* */ } });
      const hits: string[] = [];
      await ctx.route(GC + '**', (r) => { hits.push(r.request().url()); return r.fulfill({ status: 200, contentType: 'image/gif', body: Buffer.from('R0lGODlhAQABAAAAACw=', 'base64') }); });
      await ctx.route((u) => u.hostname !== 'si.test' && !u.href.startsWith(GC), (r) => r.abort());
      const p = await ctx.newPage();
      await p.addInitScript(() => {
        const w = window as unknown as { __loadFired: boolean; __imgSets: { src: string; rs: string; load: boolean }[] };
        w.__loadFired = false; w.__imgSets = [];
        addEventListener('load', () => { w.__loadFired = true; }, { capture: true });
        const d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')!;
        Object.defineProperty(HTMLImageElement.prototype, 'src', { ...d, set(v: string) { if (String(v).includes('goatcounter')) w.__imgSets.push({ src: v, rs: document.readyState, load: w.__loadFired }); d.set!.call(this, v); } });
      });
      await p.goto(`http://si.test:${PORT}${BASE}?lang=en#T3`);
      await ready(p, 'T3.en');
      await expect.poll(() => hits.length).toBe(1);
      const u = new URL(hits[0]!);
      expect(u.origin + u.pathname).toBe(GC);
      expect([...u.searchParams.keys()]).toEqual(['p', 't', 's', 'rnd']);
      expect(u.searchParams.get('p')).toBe('/en/T3');
      expect(u.searchParams.get('t')).not.toBe('');
      expect(u.searchParams.get('s')).toBe('390,844,3');
      expect(u.searchParams.get('rnd')).toMatch(/^[a-z0-9]{1,7}$/);
      const sets = await p.evaluate(() => (window as unknown as { __imgSets: { rs: string; load: boolean }[] }).__imgSets);
      expect(sets.length).toBe(1);
      expect(sets[0]).toMatchObject({ rs: 'complete', load: true });
      /* lab / quiz events, live scheme: first use of each lab, first answer in each quiz, once per page load */
      await p.locator('#labTok button').first().click();
      await p.locator('#labTok button').first().click();
      await p.locator('#labTok input').first().dispatchEvent('input');
      await p.locator('#quizT3 .opt').first().click();
      await p.locator('#quizT3 .opt').last().click();
      await p.locator('#quizT3 [data-qreset]').click();
      await expect.poll(() => hits.length).toBe(3);
      await p.waitForTimeout(800);
      expect(hits.length).toBe(3);
      const evs = hits.slice(1).map((h) => new URL(h).searchParams);
      expect(evs.map((q) => q.get('p'))).toEqual(['evt-lab-labTok', 'evt-quiz-T3']);
      for (const q of evs) { expect([...q.keys()]).toEqual(['p', 't', 'e', 's', 'rnd']); expect(q.get('t')).toBe(q.get('p')); expect(q.get('e')).toBe('true'); expect(q.get('s')).toBe('390,844,3'); }
      /* stop change → one more; the same stop again (opening a sheet etc.) → none. R27: T1 counts as /en/T1, home H as /en/home */
      await p.evaluate(() => (window as unknown as { __si: { go(s: string): void } }).__si.go('T1'));
      await ready(p, 'T1.en');
      await expect.poll(() => hits.length).toBe(4);
      expect(new URL(hits[3]!).searchParams.get('p')).toBe('/en/T1');
      await p.locator('#bnav [data-bn="prog"]').click(); await expect(p.locator('#dkSheet[data-k="prog"]')).toHaveClass(/open/);
      await p.waitForTimeout(800);
      expect(hits.length).toBe(4);
      await p.evaluate(() => (window as unknown as { __si: { go(s: string): void } }).__si.go('H'));
      await ready(p, 'H.en');
      await expect.poll(() => hits.length).toBe(5);
      expect(new URL(hits[4]!).searchParams.get('p')).toBe('/en/home');
      /* legacy.html keeps its own counter (same virtual paths, same event scheme) */
      await p.goto(`http://si.test:${PORT}${BASE}legacy.html?lang=zh#T5`);
      await expect.poll(() => hits.length, { timeout: 10_000 }).toBe(6);
      expect(new URL(hits[5]!).searchParams.get('p')).toBe('/zh/T5');
      await p.locator('section#T5 #labKv input').first().dispatchEvent('input');
      await p.locator('#quizT5 .opt').first().dispatchEvent('click');
      await expect.poll(() => hits.length).toBe(8);
      const lev = hits.slice(6).map((h) => new URL(h).searchParams);
      expect(lev.map((q) => q.get('p'))).toEqual(['evt-lab-labKv', 'evt-quiz-T5']);
      for (const q of lev) { expect([...q.keys()]).toEqual(['p', 't', 'e', 's', 'rnd']); expect(q.get('t')).toBe(q.get('p')); expect(q.get('e')).toBe('true'); }

      /* an interaction before 'load' is queued, sent only after load (after the page view) */
      const p2 = await ctx.newPage();
      let release!: () => void; const held = new Promise<void>((r) => { release = r; });
      await p2.route('**/slow.gif', async (r) => { await held; await r.fulfill({ status: 200, contentType: 'image/gif', body: Buffer.from('R0lGODlhAQABAAAAACw=', 'base64') }); });
      await p2.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const i = document.createElement('img'); i.src = '/slow.gif'; i.alt = ''; document.body.appendChild(i); }); });
      const n0 = hits.length;
      await p2.goto(`http://si.test:${PORT}${BASE}?lang=en#T3`, { waitUntil: 'domcontentloaded' });
      await ready(p2, 'T3.en');
      expect(await p2.evaluate(() => document.readyState)).not.toBe('complete');
      await p2.locator('#labNext button').first().dispatchEvent('click');
      await p2.waitForTimeout(500);
      expect(hits.length).toBe(n0);
      release();
      await expect.poll(() => hits.length).toBe(n0 + 2);
      expect(hits.slice(n0).map((h) => new URL(h).searchParams.get('p'))).toEqual(['/en/T3', 'evt-lab-labNext']);
    } finally { await b.close(); }
  });
});
