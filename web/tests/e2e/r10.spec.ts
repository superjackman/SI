/* r10: labFit dropout + early stopping (T7, gap audit A6) and the other r10 additions on legacy stations */
import { test, expect, type Page } from '@playwright/test';

type Lang = 'zh' | 'en';
type Fit = { reset(): void; train(n: number): void; verdict(): string; state(): { step: number; best: number | null; stopped: boolean; tr: number; va: number } };
function watch(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  return errors;
}
async function open(page: Page, lang: Lang, S: string) {
  await page.goto(`./?lang=${lang}#${S}`);
  await page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached' });
  await page.evaluate(() => { document.querySelectorAll('section.level.active .cc-closed').forEach((c) => c.classList.remove('cc-closed')); document.querySelectorAll<HTMLDetailsElement>('section.level.active details').forEach((d) => { d.open = true; }); });
}
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); }

for (const lang of ['zh', 'en'] as Lang[]) {
  const tr = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  test(`${lang} labFit: dropout tames the degree-9 overfit; early stopping stops, restores the best step and draws the line`, async ({ page }) => {
    const errors = watch(page);
    await open(page, lang, 'T7');
    await page.locator('#labFit').scrollIntoViewIfNeeded();
    await expect(page.locator('#labFit .ctrls #ftDO')).toBeAttached();
    await expect(page.locator('#labFit .ctrls #ftES')).toBeAttached();
    const run = (dp: boolean, es: boolean) => page.evaluate(([dp, es]) => {
      const d = document.getElementById('ftD') as HTMLInputElement; d.value = '9'; d.dispatchEvent(new Event('input'));
      (document.getElementById('ftDO') as HTMLInputElement).checked = dp; (document.getElementById('ftES') as HTMLInputElement).checked = es;
      const F = (window as unknown as { __labFit: Fit }).__labFit; F.reset(); for (let i = 0; i < 300; i++) F.train(100);
      return { ...F.state(), v: F.verdict() };
    }, [dp, es] as const);
    const plain = await run(false, false), drop = await run(true, false), es = await run(false, true);
    expect(plain.v).toBe(tr('过拟合', 'Overfitting'));
    expect(drop.va).toBeLessThan(plain.va * 0.7);
    expect(drop.v).not.toBe(tr('过拟合', 'Overfitting'));
    expect(es.stopped).toBe(true);
    expect(es.step).toBeLessThan(30000);
    expect(es.va).toBeLessThan(plain.va);
    await expect(page.locator('#ftEx')).toContainText(tr(`停在第 ${es.step} 步`, `stopped at step ${es.step}`));
    /* the UI path: tick early stopping, run, it stops by itself */
    await page.locator('#ftES').check();
    await page.locator('#ftRun').click();
    await expect(page.locator('#ftEx')).toBeVisible({ timeout: 15000 });
    await page.locator('#ftDO').check();
    await expect(page.locator('#ftEx')).toContainText('Dropout');
    await expect(page.locator('#ftEx')).not.toContainText(tr('停在第', 'stopped at'));
    await page.locator('#ftDO').uncheck(); await page.locator('#ftES').uncheck();
    await expect(page.locator('#ftEx')).toHaveCount(0);
    await noOverflow(page);
    expect(errors).toEqual([]);
  });
}

/* M7 (gap audit A10): labPool on T7 — exact changed-cell counts for shifts 0, 1, 2; grids fit the phone */
for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang} labPool: shift 1 barely changes the pooled map, shift 2 moves it`, async ({ page }) => {
    const errors = watch(page);
    await open(page, lang, 'T7');
    const out = page.locator('#labPool #plOut');
    await out.scrollIntoViewIfNeeded();
    const set = (v: string) => page.evaluate((v) => { const s = document.getElementById('plS') as HTMLInputElement; s.value = v; s.dispatchEvent(new Event('input')); }, v);
    const read = async () => [await out.locator('[data-k="raw"]').textContent(), await out.locator('[data-k="pooled"]').textContent()];
    expect(await read()).toEqual(['0', '0']);
    await expect(out.locator('table.pl-g.in td')).toHaveCount(64);
    await expect(out.locator('table.pl-g.out td')).toHaveCount(16);
    await set('1'); expect(await read()).toEqual(['18', '2']);
    await expect(page.locator('#plSv')).toHaveText('1');
    await set('2'); expect(await read()).toEqual(['15', '11']);
    expect(await out.locator('table.pl-g.in td.sw').count()).toBeGreaterThan(0);
    const box = await out.boundingBox(), card = await page.locator('#labPool').boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(card!.x + card!.width + 0.5);
    await noOverflow(page);
    expect(errors).toEqual([]);
  });
}

/* R10 gap audit D8–D13: the six U-station cards render in both languages, nothing overflows the phone,
   flow / checklist / two-way boxes keep their text inside, and the drill-down rows go to T2 / T5 */
const UCARDS: [string, string, string | null][] = [['Uc', 'c_Uc_4', 'T2'], ['Uc', 'c_Uc_5', 'T5'], ['Ub', 'c_Ub_5', 'T2'], ['Ub', 'c_Ub_6', null], ['Ub', 'c_Ub_7', null], ['Ud', 'c_Ud_5', null]];
for (const lang of ['zh', 'en'] as Lang[]) {
  for (const S of ['Ub', 'Uc', 'Ud']) test(`${lang} ${S}: R10 cards fit the phone, boxes hold their text, sources open in a new tab`, async ({ page }) => {
    const errors = watch(page);
    await open(page, lang, S);
    for (const [s, id] of UCARDS) if (s === S) {
      const c = page.locator(`section.level.active #${id}`);
      await c.scrollIntoViewIfNeeded();
      await expect(c).toBeVisible();
      await expect(c.locator('.k-src a').first()).toHaveAttribute('target', '_blank');
      const bad = await c.evaluate((el) => {
        const out: string[] = []; const cr = el.getBoundingClientRect();
        el.querySelectorAll<HTMLElement>('ol.u-flow>li, ul.u-chk>li, .u-dec>div, table.gl td, .m-ddrow button').forEach((b, i) => {
          const r = b.getBoundingClientRect();
          if (b.scrollWidth > b.clientWidth + 1) out.push(`${i} text wider than box`);
          if (r.left < cr.left - 1 || r.right > cr.right + 1) out.push(`${i} box outside card`);
          if (!b.matches('.m-ddrow button') && r.width < 120) out.push(`${i} box squeezed to ${Math.round(r.width)}px`);
        });
        /* flow boxes: stacked top to bottom with a gap for the arrow, never overlapping */
        const f = [...el.querySelectorAll<HTMLElement>('ol.u-flow>li')].map((b) => b.getBoundingClientRect());
        for (let i = 1; i < f.length; i++) if (f[i]!.top - f[i - 1]!.bottom < 16) out.push(`flow ${i} gap ${f[i]!.top - f[i - 1]!.bottom}`);
        return out;
      });
      expect(bad, id).toEqual([]);
    }
    await noOverflow(page);
    expect(errors).toEqual([]);
  });
}
for (const [S, id, to] of UCARDS) if (to) test(`zh ${id}: the drill-down row at the top goes to ${to}`, async ({ page }) => {
  await open(page, 'zh', S);
  const b = page.locator(`section.level.active #${id} .cc-body > .m-ddrow:first-child [data-ddgo="${to}"]`);
  await b.scrollIntoViewIfNeeded();
  await b.click();
  await page.locator(`html[data-si-ready="${to}.zh"]`).waitFor({ state: 'attached' });
  expect(await page.evaluate(() => location.hash)).toContain(to);
});
test('en c_Uc_5: the quantisation link opens its T5 popup', async ({ page }) => {
  await open(page, 'en', 'Uc');
  const a = page.locator('section.level.active #c_Uc_5 [data-open="quant"]').first();
  await a.scrollIntoViewIfNeeded();
  await a.click();
  await expect(page.locator('#modal.open .m-head h3')).toContainText(/quanti/i);
});
