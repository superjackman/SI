/* M3 products stop (Up): renders in both languages on 360/390/430, filter chips + checkboxes, official links open in a
   new tab without being intercepted, the way headings open the M2 part popup, quiz, no layout overflow, no external
   requests on load (links are only followed when tapped). */
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Lang = 'zh' | 'en';
type SI = { __si: { state(): { station: string; popup: { id: string } | null } } };
const KEY = (JSON.parse(readFileSync(new URL('../../src/legacy/gen/qkey.json', import.meta.url), 'utf8')) as { key: Record<string, number[]> }).key;

async function open(page: Page, lang: Lang) {
  await page.goto(`./?lang=${lang}#Up`);
  await page.locator(`html[data-si-ready="Up.${lang}"]`).waitFor({ state: 'attached' });
  await expect(page.locator('section.level.active .pagehead')).toBeVisible();
}
async function reveal(page: Page, sel: string) {
  for (let i = 0; i < 4; i++) {
    const cardId = await page.evaluate((sel) => {
      const c = document.querySelector(sel)?.closest('.cc-closed') as HTMLElement | null; if (!c) return null;
      if (!c.id) c.id = 'tmp-cc-' + Math.random().toString(36).slice(2); return c.id;
    }, sel);
    if (!cardId) break;
    await page.locator(`#${cardId} > h2 > .cc-h, #${cardId} > h3 > .cc-h`).first().click();
  }
  await page.locator(sel).scrollIntoViewIfNeeded();
}
const count = (page: Page) => page.locator('#upCount').getAttribute('data-n').then(Number);
const visibleNames = (page: Page) => page.evaluate(() => [...new Set([...document.querySelectorAll<HTMLElement>('#upList .up-i')].filter((li) => li.offsetParent !== null).map((li) => li.dataset.n!))]);
const total = (page: Page) => page.evaluate(() => new Set([...document.querySelectorAll<HTMLElement>('#upList .up-i')].map((li) => li.dataset.n)).size);

for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang} Up: renders, diagram labels fit, list + filters work, links are new-tab and safe, fits the phone`, async ({ page }) => {
    const errors: string[] = [], external: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('request', (r) => { const u = new URL(r.url()); if (!['localhost', '127.0.0.1'].includes(u.hostname) && u.protocol !== 'data:') external.push(r.url()); });
    await open(page, lang);
    await expect(page.locator('section#Up .m-stage svg').first()).toBeVisible();
    await expect(page.locator('#bnav [data-bn="lab"]')).toHaveAttribute('data-st', 'off'); // R22: no lab here, the 🧪 button says so
    await expect(page.locator('section#Up .st-fail')).toHaveCount(0);
    await expect(page.locator('section#Up .card.lab')).toHaveCount(0);
    await expect(page.locator('section#Up .tag.demo')).toHaveCount(0);
    await expect(page.locator('section#Up')).toContainText(lang === 'zh' ? '最后核对：2026-10-23' : '2026-10-23');
    /* diagram: 9 way boxes, every label inside its box */
    await expect(page.locator('section#Up .m-stage g.comp')).toHaveCount(9);
    const outside = await page.evaluate(() => {
      const out: string[] = [];
      document.querySelectorAll('section#Up .m-stage g.comp').forEach((g) => {
        const R = g.querySelector(':scope>rect.main')!.getBoundingClientRect();
        g.querySelectorAll(':scope>text').forEach((t) => { const T = t.getBoundingClientRect(); if (t.textContent?.trim() && !t.textContent.includes('🔍') && (T.left < R.left - 1.5 || T.right > R.right + 1.5)) out.push(t.textContent); });
      });
      return out;
    });
    expect(outside).toEqual([]);
    /* list + filter */
    await reveal(page, '#upList');
    const all = await total(page);
    expect(all).toBeGreaterThan(40);
    await expect.poll(() => count(page)).toBe(all);
    await expect(page.locator('#upCount')).toHaveText(lang === 'zh' ? `显示 ${all} 个产品` : `Showing ${all} products`);
    await page.locator('#upF button[data-f="uCli"]').click();
    await expect(page.locator('#upF button[data-f="uCli"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#upF button[data-f="all"]')).toHaveAttribute('aria-pressed', 'false');
    const cli = await page.locator('#upList .up-g[data-g="uCli"] .up-i').count();
    await expect.poll(() => count(page)).toBe(cli);
    expect((await visibleNames(page)).length).toBe(cli);
    await expect(page.locator('#upList .up-g:not([hidden])')).toHaveCount(1);
    expect(await visibleNames(page)).toContain('Claude Code');
    await page.locator('#upCn').check();
    await expect.poll(() => count(page)).toBe(0);
    await expect(page.locator('#upCount')).toHaveText(lang === 'zh' ? '没有符合条件的产品' : 'No products match');
    await page.locator('#upF button[data-f="all"]').click();
    await expect.poll(() => count(page)).toBe(17);
    for (const n of await visibleNames(page)) expect(await page.locator(`#upList .up-i[data-n="${n}"]`).first().getAttribute('data-cn')).toBe('1');
    await page.locator('#upCn').uncheck();
    await page.locator('#upOs').check();
    await expect.poll(() => count(page)).toBe(14);
    expect(await visibleNames(page)).toContain('MCP');
    await page.locator('#upOs').uncheck();
    await expect.poll(() => count(page)).toBe(all);
    /* links */
    const bad = await page.evaluate(() => [...document.querySelectorAll<HTMLAnchorElement>('section#Up a[href^="http"]')]
      .filter((a) => a.target !== '_blank' || a.rel !== 'noopener noreferrer' || !a.href.startsWith('https://')).map((a) => a.href));
    expect(bad).toEqual([]);
    if (lang === 'en') {
      const cjk = await page.evaluate(() => {
        const re = /[\u3400-\u9fff]/, out: string[] = [];
        const tw = document.createTreeWalker(document.getElementById('shellMain')!, NodeFilter.SHOW_TEXT);
        for (let n = tw.nextNode(); n; n = tw.nextNode()) { if (n.parentElement?.closest('#mLang,[lang="zh-CN"],script,style')) continue; if (re.test(n.nodeValue ?? '')) out.push((n.nodeValue ?? '').trim().slice(0, 40)); }
        return out;
      });
      expect(cjk).toEqual([]);
      await expect(page.locator('#upList')).toContainText('Doubao (豆包)');
    }
    await page.waitForTimeout(300);
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(o.sw).toBeLessThanOrEqual(o.cw);
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
  });
}

test('tapping an official link opens a new tab (not the in-app router), and a way heading opens the part popup', async ({ page, context }) => {
  await context.route((u) => !['localhost', '127.0.0.1'].includes(u.hostname), (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>stub</title>' }));
  await open(page, 'zh');
  await reveal(page, '#upList');
  const link = page.locator('#upList .up-g[data-g="uKit"] a.up-a').first();
  const href = await link.getAttribute('href');
  const [tab] = await Promise.all([context.waitForEvent('page'), link.click()]);
  await tab.waitForLoadState();
  expect(new URL(tab.url()).href).toBe(new URL(href!).href);
  await tab.close();
  expect(await page.evaluate(() => (window as unknown as SI).__si.state().station)).toBe('Up');
  await page.locator('#upList .up-g[data-g="uCli"] h4 [data-open="uCli"]').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as SI).__si.state().popup?.id ?? null)).toBe('uCli');
});

test('the diagram box for a way opens its popup; U card links to Up; quiz key matches', async ({ page }) => {
  await page.goto('./?lang=zh#U');
  await page.locator('html[data-si-ready="U.zh"]').waitFor({ state: 'attached' });
  await reveal(page, '#c_U_m3 [data-go="Up"]');
  await page.locator('#c_U_m3 [data-go="Up"]').first().click();
  await page.locator('html[data-si-ready="Up.zh"]').waitFor({ state: 'attached' });
  await page.locator('section#Up .m-stage .comp[data-id="uMulti"]').first().click();
  await expect.poll(() => page.evaluate(() => (window as unknown as SI).__si.state().popup?.id ?? null)).toBe('uMulti');
  await page.keyboard.press('Escape');
  await open(page, 'en');
  await reveal(page, '#quizUp');
  for (let i = 0; i < KEY.Up!.length; i++) await page.locator(`#quizUp .opt[data-q="Up.${i}"][data-o="${KEY.Up![i]}"]`).click();
  await expect(page.locator('#quizUp .qsum')).toContainText('answered 3 , correct 3');
});
