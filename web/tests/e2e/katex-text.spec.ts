/* r9 hotfix regression: pre-rendered KaTeX HTML must never appear as text. Visits every station in both languages (all
   collapsed cards opened, the page head notes expanded), opens every part popup, runs searches that hit math-bearing
   entries, and checks the visible text (<noscript> is raw text when JS runs, never shown — skipped), the text-bearing attributes and the document title for KaTeX or tag markup. */
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Lang = 'zh' | 'en';
type SI = { __si: { openInfo(id: string): void; state(): { popup: { id: string } | null } } };
const KB = JSON.parse(readFileSync(new URL('../../src/legacy/gen/kb.json', import.meta.url), 'utf8')) as { TABORDER: string[] };
const IDS = Object.keys(JSON.parse(readFileSync(new URL('../../src/legacy/gen/search.json', import.meta.url), 'utf8')) as Record<string, unknown>);

/** markup that leaked into text, in `root` (text nodes + title/aria-label/alt/placeholder), as short excerpts */
const leaks = (page: Page, root: string) => page.evaluate((root) => {
  const BAD = /katex|<\/?(span|math|annotation|semantics|b|i|p|div|sup|sub)\b|&lt;|&gt;|&amp;|&quot;|&#x?[0-9a-f]+;/i;
  const out: string[] = [];
  const el = document.querySelector(root); if (!el) return out;
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement?.closest('script,style,template,annotation,noscript') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  for (let n = w.nextNode(); n; n = w.nextNode()) { const s = n.textContent ?? ''; const i = s.search(BAD); if (i >= 0) out.push(`${n.parentElement?.className || n.parentElement?.tagName}: …${s.slice(Math.max(0, i - 40), i + 60)}…`); }
  el.querySelectorAll('[title],[aria-label],[alt],[placeholder]').forEach((e) => { for (const a of ['title', 'aria-label', 'alt', 'placeholder']) { const v = e.getAttribute(a); if (v && BAD.test(v)) out.push(`@${a}: ${v.slice(0, 100)}`); } });
  if (BAD.test(document.title)) out.push('document.title: ' + document.title);
  return out;
}, root);

async function open(page: Page, S: string, lang: Lang) {
  await page.goto(`./?lang=${lang}#${S}`);
  await page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached' });
}

for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang}: no KaTeX or tag markup as text on any station`, async ({ page }) => {
    test.setTimeout(180_000);
    const found: string[] = [];
    for (const S of KB.TABORDER) {
      await open(page, S, lang);
      await page.evaluate(() => {
        document.querySelectorAll<HTMLDetailsElement>('section.level.active details').forEach((d) => { d.open = true; });
        document.querySelectorAll('section.level.active .cc-closed').forEach((c) => c.classList.remove('cc-closed'));
      });
      found.push(...(await leaks(page, 'body')).map((x) => `${S}: ${x}`));
    }
    expect(found).toEqual([]);
  });

  test(`${lang}: no KaTeX or tag markup as text in any popup`, async ({ page }) => {
    test.setTimeout(240_000);
    await open(page, 'K2', lang);
    const found: string[] = []; let opened = 0;
    for (const id of IDS) {
      await page.evaluate((id) => (window as unknown as SI).__si.openInfo(id), id);
      if ((await page.evaluate(() => (window as unknown as SI).__si.state().popup?.id ?? null)) !== id) continue;
      await expect(page.locator('#modal.open .m-head h3')).toBeVisible();
      opened++;
      found.push(...(await leaks(page, '#modal')).map((x) => `${id}: ${x}`));
    }
    expect(IDS.length).toBeGreaterThanOrEqual(200);
    expect(opened).toBe(IDS.length);
    expect(found).toEqual([]);
  });

  test(`${lang}: no KaTeX or tag markup as text in search results`, async ({ page }) => {
    await open(page, 'K2', lang);
    await page.locator('#mSearch').click();
    const qs = lang === 'zh' ? ['导数', '矩阵', '雅可比', '梯度', '概率', '注意力', 'softmax'] : ['derivative', 'matrix', 'Jacobian', 'gradient', 'probability', 'attention', 'softmax'];
    const found: string[] = [];
    for (const q of qs) {
      await page.locator('#search').fill(q);
      await expect(page.locator('#searchRes [data-open]').first()).toBeVisible();
      found.push(...(await leaks(page, '#searchRes')).map((x) => `${q}: ${x}`));
    }
    expect(found).toEqual([]);
  });
}

/* R10: a math-bearing role line in the search results is shown as rendered KaTeX (lazy css), not as raw TeX */
for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang}: search results render math with KaTeX`, async ({ page }) => {
    const errs: string[] = []; page.on('pageerror', (e) => errs.push(e.message));
    await open(page, 'T1', lang);
    await page.locator('#mSearch').click();
    await page.locator('#search').fill(lang === 'zh' ? '链式法则' : 'Chain rule');
    const row = page.locator('#searchRes [data-open="kChain"]');
    await expect(row.locator('.sr-math .katex').first()).toBeVisible();
    await expect(page.locator('html[data-si-math="1"]')).toBeAttached();
    expect(await row.evaluate((e) => { const c = e.cloneNode(true) as HTMLElement; c.querySelectorAll('annotation').forEach((a) => a.remove()); return c.textContent ?? ''; })).not.toMatch(/\\circ|\\,/);
    expect(await leaks(page, '#searchRes')).toEqual([]);
    const box = await page.locator('#searchRes').boundingBox(); const vw = page.viewportSize()!.width;
    expect(box && box.x >= -1 && box.x + box.width <= vw + 1).toBe(true);
    expect(await row.evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
    expect(errs).toEqual([]);
  });
}

/* R10: the overseas-source note shows inside its source line without widening the page */
test('T7: overseas source note visible, no page overflow', async ({ page }) => {
  await open(page, 'T7', 'en');
  await page.evaluate(() => {
    document.querySelectorAll<HTMLDetailsElement>('section.level.active details').forEach((d) => { d.open = true; });
    document.querySelectorAll('section.level.active .cc-closed').forEach((c) => c.classList.remove('cc-closed'));
  });
  const n = page.locator('section.level.active .k-src .k-reach').first();
  await n.scrollIntoViewIfNeeded();
  await expect(n).toBeVisible();
  await expect(n).toContainText('not tested');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});
