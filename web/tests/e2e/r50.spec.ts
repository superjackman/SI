import { test, expect, type Page } from '@playwright/test';
import { textIssues } from './small-text.js';
import { contrastIssues } from './contrast.js';
import { DV_KEY, cardLv } from '../../src/dv/links';
import { QQ } from '../../src/vf/data';
import { VF_Q } from '../../src/vf/ids';
/* R50 验证优化: every stage page (and the maths cards) ends with ✎ 自己算一算 (typed / picked answers → instant ✓ ✗,
   a hint on a miss, the working on demand, ticks on the chain and the map) and ⚠ 常见误解; three slider demos.
   Nothing in it adds a history entry; everything reads at 360 / 390 / 430 in zh and en. */
const ORIGIN = 'http://localhost:4173';
const DONE = [{ name: 'si.fs', value: '0' }, { name: 'si.a2hs', value: '1' }, { name: 'si.onb', value: '1' },
  // R51 the layered pilot pages (1, 2, 8a, 8b): every layer open, as a reader on 深入 who has gone through all five
  { name: 'si.ly.depth', value: 'd' }, { name: 'si.ly.open', value: JSON.stringify({ 'D/0': 5, 'D/P': 5, 'D/1': 5, 'D/2': 5, 'D/3': 5, 'D/4': 5, 'D/5': 5, 'D/6': 5, 'D/7': 5, 'D/8a': 5, 'D/8b': 5, 'D/9': 5, 'D/E': 5, 'D/10': 5, 'D/11': 5, 'D/12': 5, 'D/13': 5, 'D/14': 5, 'D/S': 5, 'D/15a': 5, 'D/15b': 5, 'D/A': 5, 'D/16': 5 }) }];
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: DONE }] } });
async function open(p: Page, q: string) {
  const errs: string[] = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(q); await p.locator('#l4').waitFor({ state: 'attached', timeout: 30000 }); await p.waitForTimeout(600);
  return errs;
}
const hl = (p: Page) => p.evaluate(() => history.length);
const px = (p: Page, v: string) => expect(p.locator('#l4')).toHaveAttribute('data-px', v);
const go = (p: Page, h: string) => p.evaluate((x) => { location.replace(x); }, h);

test.describe('R50 self-check', () => {
  test('stage 2: wrong → hint, right → ✓ + ratio, working on demand; ticks on the chain and map; no history entries', async ({ page }) => {
    const errs = await open(page, './?lang=zh#D/2'); await px(page, 'D/2.zh');
    const h0 = await hl(page);
    const qz = page.locator('.vf-qz'); await expect(qz).toBeVisible();
    await expect(qz.locator('.vf-pc')).toHaveText('做对 0/4');
    const q = qz.locator('.vf-q[data-q="s2a"]');
    await q.locator('.vf-in').fill('0.6'); await q.locator('.vf-ck').click();
    await expect(q).toHaveAttribute('data-st', 'bad'); await expect(q.locator('.vf-fb')).toContainText('提示');
    await q.locator('.vf-in').fill('1.2'); await q.locator('.vf-in').press('Enter');
    await expect(q).toHaveAttribute('data-st', 'ok'); await expect(q.locator('.vf-tk')).toBeVisible();
    await expect(qz.locator('.vf-pc')).toHaveText('做对 1/4');
    await q.locator('.vf-sw').click(); await expect(q.locator('.vf-sol')).toBeVisible(); await expect(q.locator('.vf-sol')).toContainText('1.20');
    // typed the phone way: comma-free, full-width digits
    const q3 = qz.locator('.vf-q[data-q="s2c"]'); await q3.locator('.vf-in').fill('４.４'); await q3.locator('.vf-ck').click(); await expect(q3).toHaveAttribute('data-st', 'ok');
    expect(await hl(page)).toBe(h0);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('si.vf') || '[]'))).toEqual(['s2a', 's2c']);
    await go(page, '#D'); await px(page, 'D.zh');
    await expect(page.locator('.dv-st[data-go="#D/2"] .dv-qt')).toHaveText('✎ 2/4');
    await expect(page.locator('.dv-rd .dv-qr')).toContainText(/掌握 2\/|Self-check 2\/|2\//);
    await go(page, '#D/map'); await px(page, 'D/map.zh');
    await expect(page.locator('#s2 .dv-ms .dv-qt')).toHaveText('✎ 2/4');
    // the same question on card KM10 is already ticked
    await go(page, `#L${cardLv('KM10')}~KM10`); const sh = page.locator('.l4-sheet[data-card="KM10"]'); await expect(sh).toBeVisible();
    await expect(sh.locator('.vf-q[data-q="s2a"].done')).toHaveCount(1); await expect(sh.locator('.vf-pc')).toHaveText('做对 2/4');
    expect(errs).toEqual([]);
  });
  test('choice question: a wrong pick is marked, the right one ticks (en)', async ({ page }) => {
    const errs = await open(page, './?lang=en#D/10'); await px(page, 'D/10.en');
    const q = page.locator('.vf-q[data-q="s10c"]'), A = QQ.s10c!;
    const right = q.locator('.vf-op[data-vf="pick:0"]'), wrong = q.locator('.vf-op[data-vf="pick:1"]');
    await wrong.click(); await expect(wrong).toHaveClass(/bad/); await expect(q.locator('.vf-fb')).toContainText('Hint');
    await right.click(); await expect(right).toHaveClass(/ok/); await expect(q).toHaveAttribute('data-st', 'ok');
    await expect(right).toContainText(A.o![0]![1].replace(/[`*]/g, '').slice(0, 20));
    expect(errs).toEqual([]);
  });
  test('every stage and every maths card shows its questions and misconceptions', async ({ page }) => {
    await open(page, './?lang=zh#D/0'); const bad: string[] = [];
    for (const i of DV_KEY) {
      await go(page, `#D/${i}`); await px(page, `D/${i}.zh`);
      await expect(page.locator('.vf-qz')).toBeVisible();
      if ((await page.locator('.vf-q').count()) !== VF_Q[`D/${i}`]!.length) bad.push(`D/${i} questions`);
      if ((await page.locator('.vf-mc .vf-m').count()) < 1) bad.push(`D/${i} misconceptions`);
    }
    for (let i = 1; i <= 13; i++) {
      const k = 'KM' + String(i).padStart(2, '0'); await go(page, `#L${cardLv(k)}~${k}`);
      const sh = page.locator(`.l4-sheet[data-card="${k}"]`); await expect(sh).toBeVisible(); await expect(sh.locator('.vf-qz')).toBeVisible();
      if ((await sh.locator('.vf-q').count()) !== VF_Q[k]!.length) bad.push(k);
    }
    expect(bad).toEqual([]);
  });
});

test.describe('R50 demos', () => {
  test('gradient descent, temperature and attention sliders show the shared numbers', async ({ page }) => {
    const errs = await open(page, './?lang=en#D/2'); await px(page, 'D/2.en'); const h0 = await hl(page);
    const gd = page.locator('.vf-dm[data-dm="gd"]');
    await expect(gd).toContainText('w = 0.00, 1.20, 1.68, 1.87, 1.95');
    await gd.locator('input[data-vs="eta"]').fill('1.1'); await expect(gd).toContainText('diverges'); await expect(gd).toContainText('4.40, −0.88');
    await gd.locator('input[data-vs="eta"]').fill('1'); await expect(gd).toContainText('Bounces');
    await go(page, '#D/9'); await px(page, 'D/9.en');
    const sm = page.locator('.vf-dm[data-dm="sm"]'); await expect(sm).toContainText('90.4%');
    await sm.locator('input[data-vs="T"]').fill('0.5'); await expect(sm.locator('output')).toHaveText('0.5'); await expect(sm).toContainText('sharper');
    await sm.locator('input[data-vs="T"]').fill('2'); await expect(sm).toContainText('flatter');
    await go(page, '#D/8'); await px(page, 'D/8a.en'); await expect(page).toHaveURL(/#D\/8a$/);
    const at = page.locator('.vf-dm[data-dm="att"]'); await expect(at).toContainText('66.5%'); await expect(at).toContainText('[2.00, 1.00, 0.00]');
    await at.locator('input[data-vs="dk"]').fill('0'); await expect(at.locator('output')).toHaveText('1'); await expect(at).toContainText('no scaling'); await expect(at).toContainText('100.0%');
    expect(await hl(page)).toBe(h0 + 0);
    expect(errs).toEqual([]);
  });
});

test.describe('R50 reads on this phone', () => {
  test('contrast ≥ 4.5:1, no small / cut / covered text, nothing wider than the screen (zh, en)', async ({ page }) => {
    const bad: string[] = [];
    for (const l of ['zh', 'en'] as const) {
      await open(page, `./?lang=${l}#D/0`);
      for (const i of [1, 2, '8a', '8b', 10, 12, 16]) {
        await go(page, `#D/${i}`); await px(page, `D/${i}.${l}`); await expect(page.locator('.vf-qz')).toBeVisible();
        // a wrong answer, an open working, so the hint and the working are checked too
        const q = page.locator('.vf-q').first();
        if (await q.locator('.vf-in').count()) { await q.locator('.vf-in').fill('99999'); await q.locator('.vf-ck').click(); } else await q.locator('.vf-op').last().click();
        await q.locator('.vf-sw').click();
        for (const sel of ['.vf-dm', '.vf-qz', '.vf-mc']) {
          if (!(await page.locator(sel).count())) continue;
          await page.locator(sel).evaluate((e) => e.scrollIntoView({ block: 'start' }));
          for (const x of await page.evaluate(contrastIssues, { root: '.vf', min: 4.5, icon: 3 })) bad.push(`${l} D/${i} ${x.cls} “${x.txt}” ${x.fg} on ${x.bg} = ${x.r}`);
          for (const x of await page.evaluate(textIssues, 12)) bad.push(`${l} D/${i} ${sel} ${x.k} ${x.cls} “${x.txt}”${x.why ? ' ' + x.why : ''}`);
        }
        const w = await page.evaluate(() => { const e = document.querySelector<HTMLElement>('.l4-home')!; return [document.documentElement.scrollWidth - innerWidth, e.scrollWidth - e.clientWidth]; });
        if (w.some((x) => x > 1)) bad.push(`${l} D/${i} wide ${w}`);
        if (l === 'en' && /[\u3400-\u9fff]/.test((await page.locator('.vf').allInnerTexts()).join(''))) bad.push(`en D/${i} has Chinese`);
      }
      for (const k of ['KM10', 'KM07', 'KC13']) {
        await go(page, `#L${cardLv(k)}~${k}`); const sh = page.locator(`.l4-sheet[data-card="${k}"]`); await expect(sh.locator('.vf')).toBeVisible();
        for (const sel of ['.vf-qz', '.vf-mc']) {
          await sh.locator(sel).evaluate((e) => e.scrollIntoView({ block: 'start' }));
          for (const x of await page.evaluate(contrastIssues, { root: '.l4-sheet .vf', min: 4.5, icon: 3 })) bad.push(`${l} ${k} ${x.cls} “${x.txt}” ${x.fg} on ${x.bg} = ${x.r}`);
          for (const x of await page.evaluate(textIssues, 12)) bad.push(`${l} ${k} ${sel} ${x.k} ${x.cls} “${x.txt}”${x.why ? ' ' + x.why : ''}`);
        }
      }
      await go(page, '#D'); await px(page, `D.${l}`);
      for (const x of await page.evaluate(textIssues, 12)) bad.push(`${l} chain ${x.k} ${x.cls} “${x.txt}”${x.why ? ' ' + x.why : ''}`);
      await go(page, '#D/map'); await px(page, `D/map.${l}`);
      for (const x of await page.evaluate(textIssues, 12)) bad.push(`${l} map ${x.k} ${x.cls} “${x.txt}”${x.why ? ' ' + x.why : ''}`);
    }
    expect(bad).toEqual([]);
  });
});
