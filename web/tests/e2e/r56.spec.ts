import { test, expect, type Page } from '@playwright/test';
import { textIssues } from './small-text.js';
import { contrastIssues } from './contrast.js';
import { ML } from '../../src/dv/mld';
import { DV_KEY } from '../../src/dv/links';
import { varQ } from '../../src/vf/var';
import { QQ } from '../../src/vf/data';
/* R56/R57: one ledger (pager 「第 n 站 · m/23」), the 调查 → 推理 → 验证 micro-loop on every stop with a wrong answer
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
  const cur = await p.locator('.ly.ml').getAttribute('data-ml-s');
  if (cur === 'i') {
    if (await p.locator('[data-ml-to="r"]').count() === 0) await p.locator('[data-ml-o="0"]').click();
    await p.locator('[data-ml-to="r"]').click();
  }
  if (s === 'v') await p.locator('[data-ml-to="v"]').click();
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
    await expect(page.locator('.l4-nav')).toContainText('第 1 站 · 3/23');
    await go(page, '#D/2'); await px(page, 'D/2.zh');
    const G = ML['2']!.goals[0]!, ly = page.locator('.ly.ml');
    await expect(page.locator('.ml-goal')).toContainText(ML['2']!.goal[0]); await expect(ly).toHaveAttribute('data-ml-s', 'i');
    await expect(page.locator('.ly-l').first()).toBeHidden(); await expect(page.locator('.ml-i')).toContainText('第 1 站留下');
    await page.locator(`[data-ml-o="${(G.a + 1) % 3}"]`).click(); await expect(page.locator('.ml-dead')).toHaveCount(2); await expect(page.locator('.ml-live')).toHaveCount(1);
    await page.locator('[data-ml-to="r"]').first().click(); await expect(ly).toHaveAttribute('data-ml-s', 'r'); await expect(page.locator('.ly-l').first()).toBeVisible();
    await page.locator('[data-ml-to="v"]').click(); await expect(ly).toHaveAttribute('data-ml-s', 'v');
    await page.locator(`[data-ml-p="${G.pr.a}"]`).click(); await expect(page.locator('.ml-pr')).toContainText('对了');
    // a wrong answer that matches a known mistake → its why + a re-loop button to the exact layer
    const q0 = varQ(G.vk, 0), mis = q0.mis.find((m) => Math.abs(m.v - q0.a) > q0.tol)!;
    await page.locator('.ml-in').fill(num(mis.v, q0.d)); await page.locator('[data-ml-ck]').click();
    await expect(page.locator('.ml-fb.bad')).toContainText(mis.why[0].replace(/`/g, '').slice(0, 6));
    await page.locator('.ml-re').click(); await expect(ly).toHaveAttribute('data-ml-s', 'r');
    await expect(page.locator(`.ly-tab[data-ly-go="${mis.ly}"], [data-ly-go="${mis.ly}"]`).first()).toBeVisible();
    // back to 验证: two new variants right in a row light the goal
    await page.locator('[data-ml-to="v"]').click(); await page.locator(`[data-ml-p="${G.pr.a}"]`).click();
    for (const i of [1, 2]) {
      const q = varQ(G.vk, i); await expect(page.locator('.ml-vn')).toContainText(`第 ${i + 1} 组数`);
      await page.locator('.ml-in').fill(num(q.a, q.d)); await page.locator('[data-ml-ck]').click(); await expect(page.locator('.ml-fb.ok')).toBeVisible();
      if (i === 1) await page.locator('[data-ml-again]').click();
    }
    await expect(page.locator('button[data-ml-g="0"]')).toHaveClass(/m/);
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem('si.ml') || '{}')['2']); expect(st.m[0]).toBe(1);
    // the memory kit under the loop
    await expect(page.locator('.dv-take li')).toHaveCount(3); await expect(page.locator('.dv-take .dv-tp')).toBeVisible();
    await expect(page.locator('.dv-chn .dv-cn')).toHaveCount(3);
    expect(await hl(page)).toBe(h0); expect(errs).toEqual([]);
  });
  test('8a: a re-loop on the scale step lands on its attention shot', async ({ page }) => {
    const errs = await open(page, './?lang=en#D/8a');
    await expect(page.locator('.ml-goal')).toContainText(ML['8a']!.goal[1]); await expect(page.locator('.l4-nav')).toContainText('Stop 8a · 10/23');
    await page.locator('[data-ml-g="1"]').click(); await cont(page, 'r');
    await expect(page.locator('.ml-lys [data-ml-fr]').first()).toBeVisible(); await page.locator('.ml-lys [data-ml-fr]').first().click();
    await expect(page.locator('[data-att]')).toBeVisible();
    expect(errs).toEqual([]);
  });
  test('stop 0: two right variants light the first small goal', async ({ page }) => {
    const errs = await open(page, './?lang=zh#D/0');
    const G = ML['0']!.goals[0]!;
    await cont(page, 'v');
    await page.locator(`[data-ml-p="${G.pr.a}"]`).click();
    for (const i of [0, 1]) {
      const q = varQ(G.vk, i);
      await page.locator('.ml-in').fill(num(q.a, q.d)); await page.locator('[data-ml-ck]').click();
      await expect(page.locator('.ml-fb.ok')).toBeVisible();
      if (i === 0) await page.locator('[data-ml-again]').click();
    }
    await expect(page.locator('button[data-ml-g="0"]')).toHaveClass(/m/);
    await expect(page.locator('.dv-take li')).toHaveCount(3);
    expect(errs).toEqual([]);
  });
  test('every station: a wrong guess shows two dead ends, a matched miss re-loops to 推理', async ({ page }) => {
    test.setTimeout(180_000);
    const errs = await open(page, './?lang=zh#D/0');
    for (const k of DV_KEY) {
      await page.evaluate(() => localStorage.removeItem('si.ml'));
      await go(page, `#D/${k}`); await px(page, `D/${k}.zh`);
      await expect(page.locator('.ml-goal')).toBeVisible();
      await expect(page.locator('.dv-take li')).toHaveCount(3);
      await page.locator('[data-ml-o="0"]').click();
      await expect(page.locator('.ml-dead')).toHaveCount(2);
      await cont(page, 'v');
      const q = varQ(ML[k]!.goals[0]!.vk, 0);
      const mis = q.mis.find((m) => Math.abs(m.v - q.a) > q.tol)!;
      await page.locator('.ml-in').fill(num(mis.v, q.d)); await page.locator('[data-ml-ck]').click();
      await expect(page.locator('.ml-re')).toHaveAttribute('data-ml-ly', String(mis.ly));
      await page.locator('.ml-re').click();
      await expect(page.locator('.ly.ml')).toHaveAttribute('data-ml-s', 'r');
    }
    expect(errs).toEqual([]);
  });
});

test.describe('R56 memory + badges + sharing', () => {
  test('今日复习: a wrong answer shows on home, #R/rv clears it; the wrong book empties; 错题清零 badge; no history entries', async ({ page }) => {
    await page.addInitScript(() => { if (sessionStorage.getItem('r56')) return; sessionStorage.setItem('r56', '1'); localStorage.setItem('si.ly.depth', 'd'); localStorage.setItem('si.ly.open', JSON.stringify({ 'D/0': 5 })); localStorage.setItem('si.ml', JSON.stringify({ '0': { m: [0, 0, 0], k: [0, 0, 0], v: [0, 0, 0], g: 0, s: 'r', p: [-1, -1, -1] } })); });
    const errs = await open(page, './?lang=zh#D/0'); const h0 = await hl(page);
    const q = page.locator('.vf-q').first(); await q.scrollIntoViewIfNeeded(); const id = (await q.getAttribute('data-q'))!, Q = QQ[id]!;
    if (Q.o) await q.locator(`[data-vf="pick:${Q.a === 0 ? 1 : 0}"]`).click(); else { await q.locator('.vf-in').fill('99999'); await q.locator('.vf-ck').click(); }
    await go(page, '#home'); await expect(page.locator('.hm-rv')).toContainText('上次错'); await expect(page.locator('.hm-wb')).toContainText('错题本 1');
    await page.locator('.hm-rv [data-go="#R/rv"]').click(); await px(page, 'R/rv.zh');
    const r = page.locator(`.mm-slot .vf-q[data-q="${id}"]`);
    if (Q.o) { const ops = r.locator('.vf-op'); const n = await ops.count(); for (let i = 0; i < n; i++) { await ops.nth(i).click(); if (await r.getAttribute('data-st') === 'ok') break; } }
    else { await r.locator('.vf-in').fill(num(Q.a, Q.d)); await r.locator('.vf-ck').click(); }
    await expect(page.locator('.mm-fin')).toContainText('今天复习完了');
    expect(await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('si.rv') || '{}')).filter((e) => (e as { w: number }).w).length)).toBe(0);
    await go(page, '#R'); await px(page, 'R.zh'); await expect(page.locator('.mm-bdg li.on', { hasText: '错题清零' })).toHaveCount(1);
    expect(await hl(page)).toBe(h0); expect(errs).toEqual([]);
  });
  test('阶段排序: locked until read; tapping in order solves it and lights the badge', async ({ page }) => {
    const errs = await open(page, './?lang=zh#R/so2'); await px(page, 'R/so2.zh'); await expect(page.locator('.mm-card')).toContainText('解锁');
    await page.evaluate(() => localStorage.setItem('si.dv.seen', JSON.stringify(['13', '14', 'S'])));
    const keys = ['13', '14', 'S'];
    await go(page, '#R'); await go(page, '#R/so2'); await px(page, 'R/so2.zh');
    for (const k of keys) await page.locator(`[data-so="k:${k}"]`).click();
    await page.locator('[data-so="ck"]').click(); await expect(page.locator('.mm-ok')).toContainText('排对了');
    await go(page, '#R'); await expect(page.locator('.mm-bdg li.on', { hasText: '阶段排序' })).toHaveCount(1);
    expect(errs).toEqual([]);
  });
  test('certificate: nameless 9:16 with a challenge QR once a layer is mastered; the friend page shows the sharer’s first try', async ({ page }) => {
    const errs = await open(page, './?lang=zh#R'); await expect(page.locator('.mm-cert')).toContainText('解锁');
    await page.evaluate(() => { const st = { m: [1, 1, 1], k: [2, 2, 2], v: [2, 2, 2], g: 0, s: 'v', p: [0, 0, 0] }; localStorage.setItem('si.ml', JSON.stringify({ '1': st, '2': st, '8a': st }));
      localStorage.setItem('si.rv', JSON.stringify({ s2a: { b: 0, due: 1e9, t: 0, w: 0, f: 1 }, s1a: { b: 0, due: 1e9, t: 0, w: 0, f: 0 } })); });
    // every question right → every stop mastered, so the certificate unlocks
    await page.evaluate((all) => localStorage.setItem('si.vf', JSON.stringify(all)), Object.keys(QQ));
    await go(page, '#home'); await go(page, '#R'); await px(page, 'R.zh');
    await page.locator('[data-mm="cert"]').click(); const pv = page.locator('.g-pv');
    await expect(pv).toHaveAttribute('data-kind', 'cert'); await expect(pv).toHaveAttribute('data-w', '1080'); await expect(pv).toHaveAttribute('data-h', '1920');
    const url = (await pv.getAttribute('data-url'))!, text = (await pv.getAttribute('data-text'))!;
    expect(url).toMatch(/\?lang=zh&fa=50&fm=\d+#D\/ch\//); expect(text).toContain('亲手推到了'); expect(text).not.toMatch(/欢迎|你好/);
    await page.goto(url.replace(/^https?:\/\/[^/]+\/[^?]*/, './')); await page.locator('#l4').waitFor({ state: 'attached' });
    await expect(page.locator('.dv-fr')).toContainText('分享者首答正确率 50%');
    await page.evaluate(() => localStorage.removeItem('si.vf'));
    expect(errs).toEqual([]);
  });
  test('friend landing: first try counts; bad numbers in the URL are ignored', async ({ page }) => {
    const errs = await open(page, './?lang=en&fa=77&fm=4#D/ch/2'); await expect(page.locator('.dv-fr')).toContainText('77%');
    const Q = QQ['s2a']!; await page.locator('.vf-in').fill('99999'); await page.locator('.vf-go').click(); await expect(page.locator('.dv-fy')).toContainText('First try 0/1');
    await page.locator('.vf-in').fill(num(Q.a, Q.d)); await page.locator('.vf-go').click(); await expect(page.locator('.vf-why')).toBeVisible(); await expect(page.locator('.dv-fy')).toContainText('First try 0/1');
    await expect(page.locator('.vf-why [data-go="#D/2"]')).toContainText('Start learning here');
    await open(page, './?lang=zh&fa=999&fm=4#D/ch/2'); await expect(page.locator('.dv-fr')).toHaveCount(0);
    expect(errs).toEqual([]);
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
        await page.locator('.dv-take').evaluate((e) => e.scrollIntoView({ block: 'start' })); await readable(page, `${l} ${k} take`, '.dv-take, .dv-chn', bad);
        if (l === 'en' && /[\u3400-\u9fff]/.test((await page.locator('.ml-goal, .ml-bar, .ml-v, .dv-take, .dv-chn').allInnerTexts()).join(''))) bad.push(`en ${k} has Chinese`);
      }
      for (const h of ['#home', '#R/rv', '#R', '#R/so5', '#P', '#D/ch/2']) {
        await go(page, h); await page.waitForTimeout(500);
        await readable(page, `${l} ${h}`, '.l4-home', bad);
        if (l === 'en' && /[\u3400-\u9fff]/.test((await page.locator('.l4-home').innerText()).replace('中文', ''))) bad.push(`en ${h} has Chinese`);
      }
    }
    expect(bad).toEqual([]);
  });
});
test('the challenge page shows plain-text formulas (no backticks or **)', async ({ page }) => {
  await open(page, './?lang=zh#D/ch/2'); await expect(page.locator('.dv-chq')).toBeVisible();
  expect(await page.locator('.dv-chq').innerText()).not.toMatch(/`|\*\*/);
});
