/* K1–K5 math stops: render in both languages on 360/390/430 with locally served KaTeX (stylesheet loaded only when a math
   stop opens), no display formula overflows its box (line-broken twins swap in), diagram labels fit, every lab responds
   to its controls with the right numbers, math chips in model popups drill down, quizzes, no external requests. */
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Lang = 'zh' | 'en';
type SI = { __si: { state(): { station: string; popup: { id: string } | null }; openInfo(id: string): void } };
const KEY = (JSON.parse(readFileSync(new URL('../../src/legacy/gen/qkey.json', import.meta.url), 'utf8')) as { key: Record<string, number[]> }).key;
const KS = ['K1', 'K2', 'K3', 'K4', 'K5'];

async function open(page: Page, S: string, lang: Lang) {
  await page.goto(`./?lang=${lang}#${S}`);
  await page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached' });
  await expect(page.locator('section.level.active .pagehead')).toBeVisible();
}
async function revealAll(page: Page, S: string) {
  for (let i = 0; i < 12; i++) {
    const h = page.locator(`section#${S} .cc-closed > h2 > .cc-h, section#${S} .cc-closed > h3 > .cc-h`).first();
    if (!(await h.count())) break;
    await h.click();
  }
}
const val = (page: Page, k: string) => page.locator(`[data-k="${k}"]`).first().innerText().then((s) => Number(s.replace('−', '-').replace(/[^\d.eE+-]/g, '')));
/* labs mount when they scroll into view (IntersectionObserver), so each block scrolls to its output first */
const setR = (page: Page, id: string, v: string) => page.locator('#' + id).fill(v);

for (const lang of ['zh', 'en'] as Lang[]) {
  for (const S of KS) {
    test(`${lang} ${S}: renders with local KaTeX, formulas fit, labels fit, quiz, no external requests`, async ({ page }) => {
      const errors: string[] = [], external: string[] = [];
      page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('request', (r) => { const u = new URL(r.url()); if (!['localhost', '127.0.0.1'].includes(u.hostname) && u.protocol !== 'data:') external.push(r.url()); });
      await open(page, S, lang);
      await expect(page.locator('html[data-si-math="1"]')).toHaveCount(1);
      await expect(page.locator(`section#${S} .st-fail`)).toHaveCount(0);
      await expect(page.locator(`section#${S} .katex`).first()).toBeAttached();
      await expect(page.locator(`section#${S} .m-stage svg`).first()).toBeVisible();
      const outside = await page.evaluate((S) => {
        const out: string[] = [];
        document.querySelectorAll(`section#${S} .m-stage g.comp`).forEach((g) => {
          const R = g.querySelector(':scope>rect.main')!.getBoundingClientRect();
          g.querySelectorAll(':scope>text').forEach((t) => { const T = t.getBoundingClientRect(); if (t.textContent?.trim() && !t.textContent.includes('🔍') && (T.left < R.left - 1.5 || T.right > R.right + 1.5)) out.push(t.textContent); });
        });
        return out;
      }, S);
      expect(outside).toEqual([]);
      await revealAll(page, S);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);
      const over = await page.evaluate((S) => [...document.querySelectorAll<HTMLElement>(`section#${S} .kx`)]
        .filter((k) => k.offsetParent !== null && k.scrollWidth > k.clientWidth + 1).map((k) => `${k.closest('[id^=c_]')?.id}:${k.scrollWidth}>${k.clientWidth}`), S);
      expect(over).toEqual([]);
      /* every split box shows exactly one form */
      const shown = await page.evaluate((S) => [...document.querySelectorAll(`section#${S} .kx-w`)].map((w) => [...w.children].filter((c) => (c as HTMLElement).offsetParent !== null).length).filter((n) => n !== 1), S);
      expect(shown).toEqual([]);
      for (let i = 0; i < KEY[S]!.length; i++) await page.locator(`#quiz${S} .opt[data-q="${S}.${i}"][data-o="${KEY[S]![i]}"]`).click();
      await expect(page.locator(`#quiz${S} .qsum`)).toContainText(lang === 'zh' ? `${KEY[S]!.length}` : `correct ${KEY[S]!.length}`);
      if (lang === 'en') {
        const cjk = await page.evaluate(() => {
          const re = /[\u3400-\u9fff]/, out: string[] = [];
          const tw = document.createTreeWalker(document.getElementById('shellMain')!, NodeFilter.SHOW_TEXT);
          for (let n = tw.nextNode(); n; n = tw.nextNode()) { if (n.parentElement?.closest('#mLang,[lang="zh-CN"],script,style')) continue; if (re.test(n.nodeValue ?? '')) out.push((n.nodeValue ?? '').trim().slice(0, 40)); }
          return out;
        });
        expect(cjk).toEqual([]);
      }
      const bad = await page.evaluate((S) => [...document.querySelectorAll<HTMLAnchorElement>(`section#${S} a[href^="http"]`)].filter((a) => a.target !== '_blank' || a.rel !== 'noopener noreferrer' || !a.href.startsWith('https://')).map((a) => a.href), S);
      expect(bad).toEqual([]);
      const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      expect(o.sw).toBeLessThanOrEqual(o.cw);
      expect(errors).toEqual([]);
      expect(external).toEqual([]);
    });
  }
}

test('KaTeX stylesheet and fonts are not fetched on a model stop, only once a math stop opens', async ({ page }) => {
  const got: string[] = [];
  page.on('request', (r) => { if (/katex|KaTeX_|\.woff2?$/.test(r.url())) got.push(r.url()); });
  await open(page, 'T1', 'zh');
  await page.waitForTimeout(500);
  expect(got).toEqual([]);
  await expect(page.locator('html[data-si-math]')).toHaveCount(0);
  await page.evaluate(() => (window as unknown as SI).__si.openInfo('nBp'));
  await page.locator('#modal.open .math[data-ddgo="K5"]').first().click();
  await page.locator('html[data-si-ready="K5.zh"]').waitFor({ state: 'attached' });
  await expect(page.locator('html[data-si-math="1"]')).toHaveCount(1);
  expect(got.some((u) => /katex/i.test(u) && u.includes('.css'))).toBe(true);
  expect(got.every((u) => new URL(u).hostname === new URL(page.url()).hostname)).toBe(true);
});

test('labs: secant → tangent, determinant, softmax, gradient-descent regimes, gradient check', async ({ page }) => {
  await open(page, 'K1', 'en'); await revealAll(page, 'K1'); await page.locator('#secOut').scrollIntoViewIfNeeded(); await page.locator('#secOut [data-k]').first().waitFor();
  expect(await val(page, 'slope')).toBeCloseTo(3, 6); expect(await val(page, 'deriv')).toBeCloseTo(2, 6);
  await setR(page, 'secH', '4');
  await expect.poll(() => val(page, 'slope')).toBeCloseTo(2.001, 6);
  expect(await val(page, 'err')).toBeCloseTo(0.001, 6);
  await page.locator('#secF').selectOption('sin'); await setR(page, 'secX', '0');
  await expect.poll(() => val(page, 'deriv')).toBeCloseTo(1, 6);
  expect(await page.locator('#secPlot polyline').count()).toBe(1);

  await open(page, 'K2', 'en'); await revealAll(page, 'K2'); await page.locator('#matOut').scrollIntoViewIfNeeded(); await page.locator('#matOut [data-k]').first().waitFor();
  expect(await val(page, 'det')).toBeCloseTo(1.5, 6);
  await setR(page, 'matA', '1'); await setR(page, 'matB', '2'); await setR(page, 'matC', '1'); await setR(page, 'matD', '1');
  await expect.poll(() => val(page, 'det')).toBeCloseTo(-1, 6);
  expect(await val(page, 'area')).toBeCloseTo(1, 6);

  await open(page, 'K3', 'en'); await revealAll(page, 'K3'); await page.locator('#smOut').scrollIntoViewIfNeeded(); await page.locator('#smOut [data-k]').first().waitFor();
  const sum = async () => (await val(page, 'p0')) + (await val(page, 'p1')) + (await val(page, 'p2'));
  expect(await sum()).toBeCloseTo(1, 2);
  const h1 = await val(page, 'H');
  await setR(page, 'smT', '6');
  await expect.poll(() => val(page, 'H')).toBeGreaterThan(h1);
  expect(await sum()).toBeCloseTo(1, 2);

  await open(page, 'K4', 'en'); await revealAll(page, 'K4'); await page.locator('#gdOut').scrollIntoViewIfNeeded(); await page.locator('#gdOut [data-k]').first().waitFor();
  await expect(page.locator('[data-k="regime"]')).toHaveAttribute('data-r', 'mono');
  await setR(page, 'gdE', '0.5'); await expect(page.locator('[data-k="regime"]')).toHaveAttribute('data-r', 'one');
  await setR(page, 'gdE', '0.75'); await expect(page.locator('[data-k="regime"]')).toHaveAttribute('data-r', 'osc');
  await setR(page, 'gdE', '1'); await expect(page.locator('[data-k="regime"]')).toHaveAttribute('data-r', 'cycle');
  expect(Math.abs(await val(page, 'x12'))).toBeCloseTo(3, 6);
  await setR(page, 'gdE', '1.2'); await expect(page.locator('[data-k="regime"]')).toHaveAttribute('data-r', 'div');

  await open(page, 'K5', 'en'); await revealAll(page, 'K5'); await page.locator('#gcOut').scrollIntoViewIfNeeded(); await page.locator('#gcOut [data-k]').first().waitFor();
  await expect(page.locator('[data-k="verdict"]')).toHaveClass(/k-ok/);
  expect(await val(page, 'bp0')).toBeCloseTo(await val(page, 'num0'), 6);
  await setR(page, 'gcW1', '3'); await setR(page, 'gcW2', '-2');
  await expect(page.locator('[data-k="verdict"]')).toHaveClass(/k-ok/);
  expect(await val(page, 'bp1')).toBeCloseTo(await val(page, 'num1'), 6);
  await setR(page, 'gcW1', '0'); await expect.poll(() => val(page, 'sp')).toBeCloseTo(0.25, 6);
});
