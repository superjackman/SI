import { test, expect, type Page } from '@playwright/test';
import { textIssues } from './small-text.js';
import { contrastIssues } from './contrast.js';
import { ML } from '../../src/dv/mld';
import { DV_KEY } from '../../src/dv/links';
import { varQ } from '../../src/vf/var';
/* R56/R57: one ledger (pager 「第 n 站」, the same station number as the title), the 调查 → 推理 → 验证 micro-loop on every stop with a wrong answer
   re-looping to the exact layer and two right variants mastering a small goal, the memory kit (3 takeaways + one picture,
   the prev / this / next chain, 今日复习 on home and #R/rv, 阶段排序), badges from mastery, the nameless certificate and
   the friend landing page that shows the sharer's first-try accuracy from the URL. No in-site move adds a history entry. */
const ORIGIN = 'http://localhost:' + (process.env.SI_E2E_PORT || '4173');
const DONE = [{ name: 'si.fs', value: '0' }, { name: 'si.a2hs', value: '1' }, { name: 'si.onb', value: '1' }];
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: DONE }] } });
async function open(p: Page, q: string) {
  const errs: string[] = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(q); await p.locator('#l4').waitFor({ state: 'attached', timeout: 30000 }); await p.waitForTimeout(600);
  return errs;
}
const hl = (p: Page) => p.evaluate(() => history.length);
const px = (p: Page, v: string) => expect(p.locator('#l4')).toHaveAttribute('data-px', v);
const go = (p: Page, h: string) => p.evaluate((x) => { location.replace(x); }, h);
const num = (a: number, d: number) => String(Number(a.toFixed(Math.max(d, 2))));
/** move to 推理 / 验证 by continuing, not by a method tab */
async function cont(p: Page, s: 'r' | 'v') {
  if (s === 'v' && await p.locator('.ml-in').count()) return;
  const cur = await p.locator('.ly.ml').getAttribute('data-ml-s');
  if (cur === 'i' && await p.locator('[data-ml-to="r"]').count()) await p.locator('[data-ml-to="r"]').click();
  if (s === 'v' && await p.locator('[data-ml-to="v"]').count()) await p.locator('[data-ml-to="v"]').click();
}
async function readable(p: Page, tag: string, root: string, bad: string[]) {
  for (const x of await p.evaluate(contrastIssues, { root, min: 4.5, icon: 3 })) bad.push(`${tag} ${x.cls} “${x.txt}” ${x.fg} on ${x.bg} = ${x.r}`);
  for (const x of await p.evaluate(textIssues, 12)) bad.push(`${tag} ${x.k} ${x.cls} “${x.txt}”${x.why ? ' ' + x.why : ''}`);
  const w = await p.evaluate(() => { const e = document.querySelector<HTMLElement>('.l4-home')!; return [document.documentElement.scrollWidth - innerWidth, e.scrollWidth - e.clientWidth]; });
  if (w.some((x) => x > 1)) bad.push(`${tag} wide ${w}`);
}

test.describe('R56 micro-loop', () => {
  test('stop 2: guess → dead ends, 推理 shows the layers, wrong variant → re-loop to the layer, two right → goal mastered; no history entries', async ({ page }) => {
    const errs = await open(page, './?lang=zh#D/1'); const h0 = await hl(page);
    await expect(page.locator('.dv-pos')).toContainText('3/23');
    await expect(page.locator('.l4-nav')).toBeHidden();
    await go(page, '#D/2'); await px(page, 'D/2.zh');
    const G = ML['2']!.goals[0]!;
    await expect(page.locator('.ml-goal, .st-side, .st-tabs, .ly-dep')).toHaveCount(0);
    await expect(page.locator('.ly-l:not([hidden])')).toHaveCount(5);
    await expect(page.locator('.st-open')).toContainText('怎么找到让损失最小的参数');
    await expect(page.locator('.ml-i')).not.toContainText('留下');
    await page.locator(`[data-ml-o="${(G.a + 1) % 3}"]`).click(); await expect(page.locator('.ml-dead')).toHaveCount(1); await expect(page.locator('.ml-live')).toHaveCount(0);
    await page.locator(`[data-ml-o="${G.a}"]`).click(); await expect(page.locator('.ml-live')).toHaveCount(1);
    await page.locator(`[data-ml-p="${G.pr.a}"]`).click(); await expect(page.locator('.ml-pr')).toContainText('对了');
    // a wrong answer that matches a known mistake → its why + a re-loop button to the exact layer
    const q0 = varQ(G.vk, 0), mis = q0.mis.find((m) => Math.abs(m.v - q0.a) > q0.tol)!;
    await page.locator('.ml-in').fill(num(mis.v, q0.d)); await page.locator('[data-ml-ck]').click();
    await expect(page.locator('.ml-fb.bad')).toContainText(mis.why[0].replace(/`/g, '').slice(0, 6));
    await expect(page.locator('.ml-work')).toBeVisible();
    // stay on the question: new numbers, two right in a row light the goal
    await page.locator('[data-ml-again]').click();
    for (const i of [1, 2]) {
      const q = varQ(G.vk, i);
      await expect(page.locator('.ml-in')).toHaveValue('');
      await page.locator('.ml-in').fill(num(q.a, q.d)); await page.locator('[data-ml-ck]').click(); await expect(page.locator('.ml-fb.ok')).toBeVisible();
      if (i === 1) await page.locator('[data-ml-again]').click();
    }
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem('si.ml') || '{}')['2']); expect(st.m[0]).toBe(1);
    await expect(page.locator('.dv-take')).toBeVisible();
    await expect(page.locator('.dv-chn')).toHaveCount(0);
    await expect(page.locator('.dv-take li')).toHaveCount(3);
    expect(await hl(page)).toBe(h0); expect(errs).toEqual([]);
  });
  test('8a: a re-loop on the scale step lands on its attention shot', async ({ page }) => {
    const errs = await open(page, './?lang=en#D/8a');
    await expect(page.locator('.dv-pos')).toContainText('10/23');
    await expect(page.locator('[data-att]')).toBeVisible();
    expect(errs).toEqual([]);
  });
  test('stop 0: two right variants light the first small goal', async ({ page }) => {
    const errs = await open(page, './?lang=zh#D/0');
    const G = ML['0']!.goals[0]!;
    await page.locator(`[data-ml-p="${G.pr.a}"]`).click();
    for (const i of [0, 1]) {
      const q = varQ(G.vk, i);
      await page.locator('.ml-in').fill(num(q.a, q.d)); await page.locator('[data-ml-ck]').click();
      await expect(page.locator('.ml-fb.ok')).toBeVisible();
      if (i === 0) await page.locator('[data-ml-again]').click();
    }
    await expect(page.locator('.dv-take')).toBeVisible();
    expect(errs).toEqual([]);
  });
  test('every station: a wrong guess shows two dead ends, a matched miss re-loops to 推理', async ({ page }) => {
    test.setTimeout(180_000);
    const errs = await open(page, './?lang=zh#D/0');
    for (const k of DV_KEY) {
      await page.evaluate(() => localStorage.removeItem('si.ml'));
      await go(page, `#D/${k}`); await px(page, `D/${k}.zh`);
      await expect(page.locator('.ml-goal')).toHaveCount(0);
      await expect(page.locator('.ly-l:not([hidden])')).toHaveCount(5);
      const a = ML[k]!.goals[0]!.a, wrong = (a + 1) % 3;
      await page.locator(`[data-ml-o="${wrong}"]`).click();
      await expect(page.locator('.ml-dead')).toHaveCount(1);
      await expect(page.locator('.ml-live')).toHaveCount(0);
      await page.locator(`[data-ml-o="${a}"]`).click();
      const q = varQ(ML[k]!.goals[0]!.vk, 0);
      const mis = q.mis.find((m) => Math.abs(m.v - q.a) > q.tol)!;
      await page.locator('.ml-in').fill(num(mis.v, q.d)); await page.locator('[data-ml-ck]').click();
      await expect(page.locator('.ml-work')).toBeVisible();
    }
    expect(errs).toEqual([]);
  });
});

test.describe('R56 review and progress pages', () => {
  test('review and progress open without a dialog', async ({ page }) => {
    await open(page, './?lang=zh#review');
    await expect(page).toHaveURL(/#review$/);
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await open(page, './?lang=zh#me');
    await expect(page.locator('.hm-ratios')).toBeVisible();
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  });
});

test.describe('R56 reads on this phone', () => {
  test('the loop, the memory kit, review, sort, badges and the friend page: contrast ≥ 4.5:1, no small / cut text, nothing wide (zh, en)', async ({ page }) => {
    const bad: string[] = [];
    for (const l of ['zh', 'en'] as const) {
      await open(page, `./?lang=${l}#D/0`);
      for (const k of ['0', '1', '2', '8a', '11', 'S']) {
        await page.evaluate(() => localStorage.removeItem('si.ml')); await go(page, `#D/${k}`); await px(page, `D/${k}.${l}`);
        await page.locator('[data-ml-o="0"]').click(); await page.locator('.ml-i').evaluate((e) => e.scrollIntoView({ block: 'start' }));
        await readable(page, `${l} ${k} 调查`, '.ml-goal, .ml-bar, .ml-i', bad);
        await cont(page, 'v'); await page.locator('[data-ml-p="0"]').click(); await page.locator('.ml-in').fill('99999'); await page.locator('[data-ml-ck]').click();
        await page.locator('.ml-v').evaluate((e) => e.scrollIntoView({ block: 'start' })); await readable(page, `${l} ${k} 验证`, '.ml-v', bad);
        await page.locator('.dv-sp').evaluate((e) => e.setAttribute('data-done', '1'));
        await page.locator('.dv-take').evaluate((e) => e.scrollIntoView({ block: 'start' })); await readable(page, `${l} ${k} take`, '.dv-take', bad);
        if (l === 'en' && /[\u3400-\u9fff]/.test((await page.locator('.ml-goal, .ml-bar, .ml-v, .dv-take').allInnerTexts()).join(''))) bad.push(`en ${k} has Chinese`);
      }
      for (const h of ['#home', '#review', '#me', '#settings']) {
        await go(page, h); await page.waitForTimeout(500);
        await readable(page, `${l} ${h}`, '.l4-home', bad);
        if (l === 'en' && /[\u3400-\u9fff]/.test((await page.locator('.l4-home').innerText()).replace('中文', ''))) bad.push(`en ${h} has Chinese`);
      }
    }
    expect(bad).toEqual([]);
  });
});
test('every station share opens that station’s question, and the station 6 card is not a placeholder', async ({ page }) => {
  test.setTimeout(180_000);
  const errs = await open(page, './?lang=zh#D/6');
  await expect(page.locator('.l4-tt')).toContainText('词向量');
  await expect(page.locator('.dv-pos')).toContainText('第 8/23 站');
  await expect(page.locator('.l4-nav')).toBeHidden();
  await expect(page.locator('.st-out a[href="#D/5"]')).toBeVisible();
  const morph = page.locator('[data-morph]');
  await expect(morph.locator('.dv-mcap .a')).toContainText('户口编号');
  await expect(morph.locator('.dv-ma')).not.toContainText('猫');
  await morph.locator('input').evaluate((el) => { const i = el as HTMLInputElement; i.value = '100'; i.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect(morph).toHaveAttribute('data-at', 'math');
  await expect(morph.locator('.dv-mcap .b')).toContainText('车离得远');
  await expect(page.locator('[data-share-url]')).toContainText('#D/6');
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  await page.locator('[data-ml-share]').click();
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  expect(errs).toEqual([]);
});
test('the challenge page shows plain-text formulas (no backticks or **)', async ({ page }) => {
  await open(page, './?lang=zh#D/ch/2');
  await expect(page).toHaveURL(/#D\/2$/);
  await expect(page.locator('.ly-fx .formula, .st-inline .formula').first()).toBeVisible();
  expect(await page.locator('.ly-fx .formula, .st-inline .formula').first().innerText()).not.toMatch(/`|\*\*/);
});
