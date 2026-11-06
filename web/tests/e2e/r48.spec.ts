import { test, expect, type Page } from '@playwright/test';
import { textIssues } from './small-text.js';
import { contrastIssues } from './contrast.js';
import { CARD_DV, DV_BORN, DV_LV, DV_N, cardLv, dvI, dvK } from '../../src/dv/links';
/* R48 two views, one body of knowledge: every card sheet and every stage page carries the same
   「自顶向下·看结构 / 自底向上·看推导」 switch and a gold 「换个角度看」 box that links to the other view;
   jumps land on the card (focus ring), never add history entries, and read at 360 / 390 / 430 in zh and en. */
const ORIGIN = 'http://localhost:' + (process.env.SI_E2E_PORT || '4173');
const DONE = [{ name: 'si.fs', value: '0' }, { name: 'si.a2hs', value: '1' }, { name: 'si.onb', value: '1' }, { name: 'si.ly.depth', value: 'd' }, { name: 'si.ly.open', value: JSON.stringify({"D/0": 5, "D/P": 5, "D/1": 5, "D/2": 5, "D/3": 5, "D/4": 5, "D/5": 5, "D/6": 5, "D/7": 5, "D/8a": 5, "D/8b": 5, "D/9": 5, "D/E": 5, "D/10": 5, "D/11": 5, "D/12": 5, "D/13": 5, "D/14": 5, "D/S": 5, "D/15a": 5, "D/15b": 5, "D/A": 5, "D/16": 5}) }];
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: DONE }] } });
async function open(p: Page, q: string) {
  const errs: string[] = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(q); await p.locator('#l4').waitFor({ state: 'attached', timeout: 30000 }); await p.waitForTimeout(600);
  return errs;
}
const re = (h: string) => new RegExp(h.replace(/[/?~]/g, '\\$&') + '$');
const hl = (p: Page) => p.evaluate(() => history.length);
const px = (p: Page, v: string) => expect(p.locator('#l4')).toHaveAttribute('data-px', v);
const IDS = Object.keys(CARD_DV);
const at = (k: string) => `#L${cardLv(k)}~${k}`;

test.describe('R48 two views', () => {
  test('card ⇄ stage: switch, born-at, used-again, same-layer sibling, focus ring; no history entries', async ({ page }) => {
    await page.goto('about:blank');
    const errs = await open(page, `./?lang=zh${at('K09')}`); const n0 = await hl(page);
    let sh = page.locator('.l4-sheet[data-card="K09"]'); await expect(sh).toBeVisible();
    await expect(sh.locator('.l4-vsw [aria-checked="true"]')).toHaveText('自顶向下·看结构');
    await expect(sh.locator('.l4-kalt h3')).toHaveText('换个角度看');
    await expect(sh.locator('.l4-kdv')).toHaveCount(1); await expect(sh.locator('.l4-kdv .dv-sb')).toHaveText('第 4 站');
    await expect(sh.locator('.l4-kwhy')).toContainText('多层网络的梯度怎么求');
    /* sibling: K14 is born in step 4 on layer 4 too */
    await sh.locator('.l4-ksib[data-k="K14"]').click(); await expect(page).toHaveURL(re('#L4~K14'));
    await expect(page.locator('.l4-sheet[data-card="K14"]')).toBeVisible();
    await page.evaluate((h) => { location.replace(h); }, at('K09'));
    sh = page.locator('.l4-sheet[data-card="K09"]'); await expect(sh).toBeVisible();
    /* the switch → the stage it is born in, card ringed */
    await sh.locator('.l4-vsw [data-s="dv"]').click(); await expect(page.locator('.l4-sheet')).toHaveCount(0);
    await expect(page).toHaveURL(re('#D/4')); await px(page, 'D/4.zh');
    await page.locator('.l4-top [data-a="menu"]').click();
    await expect(page.locator('.l4-ms .dv-vsw [aria-checked="true"]')).toHaveText('自底向上·看推导');
    await page.locator('.l4-ms [data-s="x"]').click();
    await expect(page.locator('.dv-kb.on')).toHaveCount(1); await expect(page.locator('.dv-kb.on')).toHaveAttribute('data-k', 'K09');
    await page.locator('.dv-kb.on').scrollIntoViewIfNeeded(); await expect(page.locator('.dv-kb.on')).toBeInViewport();
    /* the view switch lives in ☰; it opens this step’s layer on the card born here */
    await page.locator('.l4-top [data-a="menu"]').click();
    await page.locator('.l4-ms .dv-vsw [data-go]').click(); await expect(page).toHaveURL(re(`#L5~${DV_BORN[dvI(4)]!.find((k) => cardLv(k) === 5)}`));
    /* used again: K09 → step 8b (组装成 Transformer) */
    await page.evaluate((h) => { location.replace(h); }, at('K09'));
    sh = page.locator('.l4-sheet[data-card="K09"]'); await sh.locator(`.l4-kst[data-n="${dvI('8b')}"]`).click();
    await expect(page).toHaveURL(re('#D/8b')); await expect(page.locator('.dv-kb.on')).toHaveAttribute('data-k', 'K09');
    /* the ring is one-shot: a later visit does not ring again */
    await page.locator('.l4-nav [data-a="prev"]').click(); await page.locator('.l4-nav [data-a="next"]').click(); await expect(page).toHaveURL(re('#D/8b'));
    await expect(page.locator('.dv-kb.on')).toHaveCount(0);
    expect(await hl(page)).toBe(n0);
    expect(errs).toEqual([]);
  });
  test('every card has the switch and the gold box; every stage lists its cards with square 第n层 / round 第n步 badges', async ({ page }) => {
    test.setTimeout(150000);
    const errs = await open(page, './?lang=zh#home'), bad: string[] = [];
    for (const k of IDS) {
      await page.evaluate((h) => { location.replace(h); }, at(k));
      const sh = page.locator(`.l4-sheet[data-card="${k}"]`); await expect(sh).toBeVisible();
      if ((await sh.locator('.l4-vsw button').count()) !== 2) bad.push(`${k} switch`);
      if ((await sh.locator('.l4-kalt .l4-kdv .dv-sb').count()) !== 1) bad.push(`${k} born-at`);
      const also = CARD_DV[k]!.slice(1); if ((await sh.locator('.l4-kst').count()) !== also.length) bad.push(`${k} used-again ${also}`);
    }
    for (let i = 0; i < DV_N; i++) {
      await page.evaluate((h) => { location.replace(h); }, `#D/${dvK(i)}`); await px(page, `D/${dvK(i)}.zh`);
      await page.locator('.l4-top [data-a="menu"]').click();
      if ((await page.locator('.l4-ms .dv-vsw button').count()) !== 2) bad.push(`D/${i} switch`);
      await page.locator('.l4-ms [data-s="x"]').click();
      const kb = page.locator('.dv-kb'), n = await kb.count();
      for (let j = 0; j < n; j++) { const b = kb.nth(j); if ((await b.locator('.l4-lt').count()) + (await b.locator('.dv-sb').count()) !== 1) bad.push(`D/${i} badge ${j}`); }
      if (DV_LV[i] && (await page.locator('.dv-lv').innerText()) !== `↓ 去金字塔 第${DV_LV[i]}层`) bad.push(`D/${i} lv`);
    }
    expect(bad).toEqual([]);
    expect(errs).toEqual([]);
  });
  test('the new parts read: contrast ≥ 4.5:1, no small / cut / covered text, nothing wider than the screen (zh, en)', async ({ page }) => {
    const bad: string[] = [];
    for (const l of ['zh', 'en']) {
      await open(page, `./?lang=${l}#home`);
      for (const k of ['K09', 'KM09', 'K01', 'KC07', 'KA07', 'KM13']) {
        await page.evaluate((h) => { location.replace(h); }, at(k));
        const sh = page.locator(`.l4-sheet[data-card="${k}"]`); await expect(sh).toBeVisible();
        for (const x of await page.evaluate(contrastIssues, { root: '.l4-vsw, .l4-kalt', min: 4.5, icon: 3 })) bad.push(`${l} ${k} ${x.cls} “${x.txt}” ${x.fg} on ${x.bg} = ${x.r}`);
        await sh.locator('.l4-kalt').scrollIntoViewIfNeeded();
        for (const x of await page.evaluate(textIssues, 12)) bad.push(`${l} ${k} ${x.k} ${x.cls} “${x.txt}”${x.why ? ' ' + x.why : ''}`);
        if (l === 'en') { const t = await sh.locator('.l4-vsw, .l4-kalt').allInnerTexts(); if (/[\u3400-\u9fff]/.test(t.join(''))) bad.push(`en ${k} has Chinese`); }
      }
      for (const i of [0, 4, '8a', '8b', 10, '15a', 16]) {
        await page.evaluate((h) => { location.replace(h); }, `#D/${i}`); await px(page, `D/${i}.${l}`);
        await page.locator('.l4-top [data-a="menu"]').click();
        for (const x of await page.evaluate(contrastIssues, { root: '.l4-ms .dv-vsw', min: 4.5, icon: 3 })) bad.push(`${l} D/${i} ${x.cls} “${x.txt}” ${x.fg} on ${x.bg} = ${x.r}`);
        await page.locator('.l4-ms [data-s="x"]').click();
        for (const x of await page.evaluate(contrastIssues, { root: '.dv-ks', min: 4.5, icon: 3 })) bad.push(`${l} D/${i} ${x.cls} “${x.txt}” ${x.fg} on ${x.bg} = ${x.r}`);
        await page.locator('.dv-ks').scrollIntoViewIfNeeded();
        for (const x of await page.evaluate(textIssues, 12)) bad.push(`${l} D/${i} ${x.k} ${x.cls} “${x.txt}”${x.why ? ' ' + x.why : ''}`);
        const w = await page.evaluate(() => { const e = document.querySelector<HTMLElement>('.l4-home')!; return [document.documentElement.scrollWidth - innerWidth, e.scrollWidth - e.clientWidth]; });
        if (w.some((x) => x > 1)) bad.push(`${l} D/${i} wide ${w}`);
      }
    }
    expect(bad).toEqual([]);
  });
  test('知识地图 #D/map: every card once, in the cell of its birth step × its layer; gold cell = the step’s own layer; entries from ☰, the chain and each stage', async ({ page }) => {
    const errs = await open(page, './?lang=zh#map'); const n0 = await hl(page); // R53: ☰ lives on the 地图 tab
    await page.locator('.l4-top [data-a="menu"]').click(); await page.locator('.l4-ms a[href="#D/map"]').click();
    await expect(page).toHaveURL(re('#D/map')); await px(page, 'D/map.zh');
    await expect(page.locator('.l4-top .l4-tt')).toHaveText('知识地图 · 两个坐标');
    await expect(page.locator('.dv-mg .dv-mk')).toHaveCount(IDS.length); await expect(page.locator('.dv-mr[id]')).toHaveCount(DV_N);
    const bad: string[] = [];
    for (let i = 0; i < DV_N; i++) {
      const row = page.locator(`#s${dvK(i)}`), cells = row.locator('.dv-mx');
      for (let c = 0; c < 5; c++) {
        const n = 5 - c, ks = await cells.nth(c).locator('.dv-mk').allInnerTexts();
        const want = DV_BORN[i]!.filter((k) => cardLv(k) === n); if (ks.join() !== want.join()) bad.push(`s${i} L${n} ${ks} ≠ ${want}`);
        if ((await cells.nth(c).evaluate((e) => e.classList.contains('own'))) !== (DV_LV[i] === n)) bad.push(`s${i} L${n} gold`);
      }
    }
    expect(bad).toEqual([]);
    await page.locator('.dv-mk[data-k="K09"]').click(); await expect(page).toHaveURL(re('#D/map~K09')); await expect(page.locator('.l4-sheet[data-card="K09"]')).toBeVisible();
    await page.locator('.l4-sheet [data-s="close"]').first().click(); await expect(page).toHaveURL(re('#D/map'));
    await page.locator('#s9 .dv-ms').click(); await expect(page).toHaveURL(re('#D/9')); await px(page, 'D/9.zh');
    await page.locator('.dv-ks .dv-mp').click(); await expect(page).toHaveURL(re('#D/map')); await expect(page.locator('#s9.on')).toBeInViewport();
    await page.locator('.dv-mlh[data-go="#L3"]').click(); await expect(page).toHaveURL(re('#L3'));
    await page.evaluate(() => { location.replace('#D'); }); await page.locator('.dv-ch .dv-mp').click(); await expect(page).toHaveURL(re('#D/map'));
    await expect(page.locator('.dv-mr.on')).toHaveCount(0);
    expect(await hl(page)).toBe(n0);
    expect(errs).toEqual([]);
  });
  test('知识地图 reads on this phone (zh, en): contrast, no small / cut / covered text, nothing wider than the screen', async ({ page }) => {
    const bad: string[] = [];
    for (const l of ['zh', 'en']) {
      await open(page, `./?lang=${l}#D/map`); await px(page, `D/map.${l}`);
      for (const end of [0, 0.5, 1]) {
        await page.evaluate((f) => { const e = document.querySelector<HTMLElement>('.l4-home')!; e.scrollTop = (e.scrollHeight - e.clientHeight) * f; }, end);
        const w = await page.evaluate(() => { const e = document.querySelector<HTMLElement>('.l4-home')!; return [document.documentElement.scrollWidth - innerWidth, e.scrollWidth - e.clientWidth]; });
        if (w.some((x) => x > 1)) bad.push(`${l} wide ${w}`);
        for (const x of await page.evaluate(textIssues, 12)) bad.push(`${l} @${end} ${x.k} ${x.cls} “${x.txt}”${x.why ? ' ' + x.why : ''}`);
      }
      for (const x of await page.evaluate(contrastIssues, { root: '.dv, .l4-top, .l4-crumb', min: 4.5, icon: 3 })) bad.push(`${l} ${x.cls} “${x.txt}” ${x.fg} on ${x.bg} = ${x.r}`);
      if (l === 'en') { const t = await page.locator('.l4-home').innerText(); if (/[\u3400-\u9fff]/.test(t)) bad.push('en has Chinese'); }
    }
    expect(bad).toEqual([]);
  });
});
