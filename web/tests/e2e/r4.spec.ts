/* R4 shell: guided tour (vs the live capture), phase toggle + training panel, detail levels, the full More sheet,
   the drawer's history entry, native quiz answer/reset. Live-vs-next behaviour diffs: scripts/shelldiff.mjs. */
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Lang = 'zh' | 'en';
type SI = { __si: { state(): { station: string } } };
interface HL { p: string; hl: string[]; f: string; n: string; prev: boolean; next: string; dots: string }
const FIX = (l: Lang): HL[] => JSON.parse(readFileSync(new URL(`../fixtures/tour-hl.${l}.json`, import.meta.url), 'utf8')) as HL[];

function watch(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  return errors;
}
async function open(page: Page, lang: Lang, S: string) {
  await page.goto(`./?lang=${lang}#${S}`);
  await page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached' });
}
const station = (page: Page) => page.evaluate(() => (window as unknown as SI).__si.state().station);
/* R22: the old 更多 sheet is gone — detail level lives in the ☰ menu, phase / icons / map in ☰ → 🗺️, progress behind ✨ */
const menu = async (page: Page) => { await page.locator('#mMenu').click(); await expect(page.locator('#mDrawer')).toHaveClass(/open/); };
const sheet = async (page: Page) => { await menu(page); await page.locator('#dwMore').click(); await expect(page.locator('#dkSheet[data-k="more"]')).toHaveClass(/open/); };
const progSheet = async (page: Page) => { await page.locator('#bnav [data-bn="prog"]').click(); await expect(page.locator('#dkSheet[data-k="prog"]')).toHaveClass(/open/); };
/* the live fixture's encoding of what a step lit */
const lit = (page: Page, S: string) => page.evaluate((S) => [...document.getElementById(S)!.querySelectorAll<HTMLElement>('.tour-hl,[data-tourrun]')]
  .map((e) => (e.namespaceURI === 'http://www.w3.org/2000/svg' ? 'svg:' : 'html:') + e.dataset.id + '@' + (e.closest('.m-stage') ? 'stage' : e.closest('.card')?.id || '-')), S);
const LS = (page: Page, k: string) => page.evaluate((k) => localStorage.getItem('aiexp.v2.' + k), k);

for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang} tour: 15 steps light the same parts, chips, counters and dots as live; done → tourDone`, async ({ page }) => {
    const errors = watch(page), fx = FIX(lang);
    await open(page, lang, 'T1');
    await page.locator('#mMenu').click();
    await expect(page.locator('#mTour')).toHaveAttribute('aria-pressed', 'false');
    await page.locator('#mTour').click();
    await expect(page.locator('#tour')).toHaveClass(/open/);
    await expect(page.locator('#mDrawer')).not.toHaveClass(/open/);
    await expect(page.locator('body')).toHaveClass(/touring/);
    for (let i = 0; i < fx.length; i++) {
      const s = fx[i]!;
      if (i) await page.locator('#tourNext').click();
      await expect(page.locator('#tourN')).toHaveText(s.n);
      await expect.poll(() => station(page)).toBe(s.p);
      await expect.poll(() => lit(page, s.p), `step ${i + 1} highlights`).toEqual(s.hl);
      expect(await page.locator('#tourF').innerHTML()).toBe(s.f);
      expect(await page.locator('#tourPrev').isDisabled()).toBe(s.prev);
      await expect(page.locator('#tourNext')).toHaveText(s.next);
      expect(await page.locator('#tourDots i').evaluateAll((d) => d.map((x) => x.className).join(','))).toBe(s.dots);
    }
    /* ◀ goes back one step, then forward and done */
    await page.locator('#tourPrev').click();
    await expect(page.locator('#tourN')).toHaveText(fx[13]!.n);
    await page.locator('#tourNext').click(); await page.locator('#tourNext').click();
    await expect(page.locator('#tour.open')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveClass(/touring/);
    expect(await LS(page, 'tourDone')).toBe('1');
    await expect(page.locator('#toast')).toHaveText(lang === 'zh' ? '🎉 导览完成！可以去每页的“🧪 动手实验”自己试试。' : '🎉 Tour complete! Try the “🧪 Labs” on each stop yourself.');
    expect(await page.locator('[data-tourrun],.tour-hl').count()).toBe(0);
    expect(errors).toEqual([]);
  });
}

test('tour: starts at mid-level when on overview, × and Escape end it; 下一站 steps it, top-bar ◀ ▶ only change stops', async ({ page }) => {
  await open(page, 'zh', 'T1');
  await menu(page); await page.locator('#zoom [data-z="1"]').click(); await page.keyboard.press('Escape');
  expect(await LS(page, 'zoom')).toBe('1');
  await page.locator('#mMenu').click(); await page.locator('#mTour').click();
  await expect(page.locator('#tour')).toHaveClass(/open/);
  expect(await LS(page, 'zoom')).toBe('2');
  await expect(page.locator('#toast')).toHaveText('🎬 导览开始：点下方面板的按钮前进后退，× 退出');
  await page.locator('#bnav [data-bn="next"]').click();
  await expect(page.locator('#tourN')).toContainText('第 2 / 15 步');
  await page.locator('#bnav [data-bn="next"]').click();
  await expect(page.locator('#tourN')).toContainText('第 3 / 15 步');
  await expect.poll(() => station(page)).toBe('T2');
  await page.locator('#tourPrev').click();
  await expect(page.locator('#tourN')).toContainText('第 2 / 15 步');
  await expect.poll(() => station(page)).toBe('T1');
  /* the top-bar ▶ follows the stop order (T1 → U, the M2 overview) and leaves the tour step alone */
  await page.locator('#mNext').click();
  await expect.poll(() => station(page)).toBe('U');
  await expect(page.locator('#tourN')).toContainText('第 2 / 15 步');
  await page.locator('#mMenu').click();
  await expect(page.locator('#mTour')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#mTour')).toHaveClass(/on/);
  await expect(page.locator('#mTour span')).toHaveText('退出导览');
  await page.locator('#mDrawer .dw-x:not(#fsBtn)').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#tour.open')).toHaveCount(0);
  await page.locator('#mMenu').click(); await page.locator('#mTour').click();
  await expect(page.locator('#tour')).toHaveClass(/open/);
  await page.locator('#tourX').click();
  await expect(page.locator('#tour.open')).toHaveCount(0);
  expect(await LS(page, 'tourDone')).toBeNull();
});

for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang} phase: training ↔ in use (sheet and drawer), banners, the training panel on the Transformer stops`, async ({ page }) => {
    const errors = watch(page);
    await open(page, lang, 'T1');
    await expect(page.locator('body')).toHaveClass(/mode-use/);
    await sheet(page);
    await expect(page.locator('#useBanner')).toBeVisible(); await expect(page.locator('#trainBanner')).toBeHidden();
    await page.locator('#slotMode [data-mode="train"]').click();
    await expect(page.locator('body')).toHaveClass(/mode-train/);
    await expect(page.locator('#slotMode [data-mode="train"]')).toHaveClass(/active/);
    await expect(page.locator('#useBanner')).toBeHidden(); await expect(page.locator('#trainBanner')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.locator('#mMenu').click(); await page.locator('#mDrawer [data-dw="T4"], #mDrawer [data-go="T4"]').first().click();
    await page.locator(`html[data-si-ready="T4.${lang}"]`).waitFor({ state: 'attached' });
    const tp = page.locator('section#T4 #trainPanel');
    await expect(tp).toBeAttached();
    await tp.locator('.cc-h').first().click();
    await expect(tp.locator('svg').first()).toBeVisible();
    await page.locator('#mMenu').click();
    await expect(page.locator('#mDrawer [data-dwmode="train"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#mDrawer [data-dwmode="use"]').click();
    await expect(page.locator('body')).toHaveClass(/mode-use/);
    await expect(page.locator('#mDrawer [data-dwmode="use"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('section#T4 #trainPanel')).toBeHidden();
    expect(errors).toEqual([]);
  });
}

test('detail level: overview hides mid/detail cards with a note, the map follows, kept across a reload', async ({ page }) => {
  await open(page, 'en', 'T3');
  const shown = () => page.locator('section#T3 .card[data-z]').evaluateAll((c) => c.filter((e) => e.getClientRects().length > 0).length);
  const all = await shown();
  await menu(page); await page.locator('#zoom [data-z="1"]').click();
  await expect(page.locator('#toast')).toHaveText('🔭 Overview: just the one-line summary and diagram');
  await expect(page.locator('#zoom [data-z="1"]')).toHaveClass(/on/);
  await expect(page.locator('#zoom [data-z="1"]')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await sheet(page);
  await page.locator('#shMap > summary').click();
  const secRows = () => page.locator('#tree .tn.sec').count();
  const rows1 = await secRows();
  await page.keyboard.press('Escape');
  const one = await shown();
  expect(one).toBeLessThan(all);
  await expect(page.locator('#znT3')).toBeVisible();
  await expect(page.locator('#znT3')).toContainText('Current view: “Overview”');
  await page.locator('#znT3 [data-zset="3"]').click();
  expect(await shown()).toBe(all);
  await menu(page); await page.locator('#zoom [data-z="2"]').click(); await page.keyboard.press('Escape');
  await sheet(page); await page.locator('#shMap > summary').click();
  await expect.poll(secRows).toBeGreaterThan(rows1);
  await page.keyboard.press('Escape');
  await page.reload(); await page.locator('html[data-si-ready="T3.en"]').waitFor({ state: 'attached' });
  expect(await LS(page, 'zoom')).toBe('2');
  await menu(page); await expect(page.locator('#zoom [data-z="2"]')).toHaveClass(/on/);
});

test('✨ progress counts quiz answers, 下一站 changes stops, progress detail → T8; ☰ → 🗺️ icons + learning map navigate', async ({ page }) => {
  await open(page, 'zh', 'T1');
  await progSheet(page);
  await expect(page.locator('#shProgTxt')).toHaveText('已看 1 / 24 站 · 测验答对 0 / 97（已答 0）');
  await page.keyboard.press('Escape');
  await sheet(page);
  await expect(page.locator('#dkSheet .ic-leg span')).toHaveCount(18);
  await page.keyboard.press('Escape');
  await page.locator('#bnav [data-bn="next"]').click();
  await expect.poll(() => station(page)).toBe('U');
  await page.locator('#mMenu').click(); await page.locator('#mDrawer [data-dw="T2"], #mDrawer [data-go="T2"]').first().click();
  await expect.poll(() => station(page)).toBe('T2');
  await page.locator('html[data-si-ready="T2.zh"]').waitFor({ state: 'attached' });
  await page.locator('section#T2 #quizT2 .opt[data-q]').first().evaluate((b) => (b as HTMLElement).click());
  await progSheet(page);
  await expect(page.locator('#shProgTxt')).toContainText('已看 3 / 24 站');
  await expect(page.locator('#shProgTxt')).toContainText('（已答 1）');
  await page.keyboard.press('Escape');
  await sheet(page);
  await page.locator('#shMap > summary').click();
  await expect(page.locator('#tree .tn.cur')).toHaveCount(1);
  await page.locator('#tree a[data-go="T6"]').click();
  await expect.poll(() => station(page)).toBe('T6');
  await expect(page.locator('#dkSheet')).toHaveCount(0);
  await sheet(page);
  await page.locator('#shMap > summary').click();
  await page.locator('#tree a[data-sj="quizT6"]').click();
  await expect(page.locator('#quizT6')).toBeInViewport();
  await progSheet(page); await page.locator('#shProgDetail').click();
  await expect.poll(() => station(page)).toBe('T8');
  await expect(page.locator('#progCard')).toBeInViewport();
});

test('drawer: opening adds one history entry, Back closes it and stays on the stop; an item leaves no extra entry', async ({ page }) => {
  await open(page, 'zh', 'T3');
  const len0 = await page.evaluate(() => history.length);
  await page.locator('#mMenu').click();
  await expect(page.locator('#mDrawer')).toHaveClass(/open/);
  expect(await page.evaluate(() => history.length)).toBe(len0 + 1);
  await page.goBack();
  await expect(page.locator('#mDrawer')).not.toHaveClass(/open/);
  expect(await station(page)).toBe('T3');
  expect(new URL(page.url()).hash).toBe('#T3');
  await page.locator('#mMenu').click();
  await page.locator('#mDrawer [data-dw="T5"]').click();
  await expect.poll(() => station(page)).toBe('T5');
  await expect(page.locator('#mDrawer')).not.toHaveClass(/open/);
  expect(await page.evaluate(() => (history.state as { mDrawer?: number } | null)?.mDrawer ?? null)).toBeNull();
  /* the menu button toggles, Escape closes, both pop the entry */
  await page.locator('#mMenu').click(); await page.keyboard.press('Escape');
  await expect(page.locator('#mDrawer')).not.toHaveClass(/open/);
  await expect.poll(() => page.evaluate(() => (history.state as { mDrawer?: number } | null)?.mDrawer ?? null)).toBeNull();
  expect(await station(page)).toBe('T5');
});

test('native quiz: answer → explanation, score, toast; reset clears the station; T8 reset clears all', async ({ page }) => {
  await open(page, 'en', 'T1');
  const q = page.locator('#quizT1');
  await q.locator('.opt[data-q="T1.0"]').first().evaluate((b) => (b as HTMLElement).click());
  await expect(page.locator('#toast')).toHaveText(/^(✅ Correct!|❌ Check the explanation)$/);
  await expect(q.locator('.qsum')).toContainText('answered 1');
  expect(JSON.parse((await LS(page, 'quiz'))!)).toHaveProperty(['T1.0']);
  await q.locator('[data-qreset]').evaluate((b) => (b as HTMLElement).click());
  await expect(q.locator('.qsum')).toContainText('answered 0');
  expect(await LS(page, 'quiz')).toBe('{}');
});
