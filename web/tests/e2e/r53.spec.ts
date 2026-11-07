import { test, expect, type Page } from '@playwright/test';
import { pathMin } from '../../src/dv/prog';
import { DV_KEY } from '../../src/dv/links';
import { contrastIssues } from './contrast.js';
import { textIssues } from './small-text.js';
/* R53 the new home page: value line, live 天空是？ demo, one-line chooser + sheet, one gold button, 继续上次 + 我的掌握
   for a returning reader, five routes on one axis, 两种看法, 今天的挑战, and the 4 bottom tabs (学习 / 地图 / 练习 / 我的)
   on the four top-level pages only. No names, no greeting; tabs and choices add no history entries. */
const ORIGIN = 'http://localhost:4173';
const DONE = [{ name: 'si.fs', value: '0' }, { name: 'si.a2hs', value: '1' }];
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: DONE }] } });
const BACK: Record<string, string> = { 'si.goal': 'model', 'si.vf': JSON.stringify(['s6a', 's6b', 's7a', 's7b', 's0a', 's0b']), 'si.dv.seen': JSON.stringify(['0', '6', '7']) };
async function open(p: Page, q: string, ls: Record<string, string> = {}) {
  const errs: string[] = []; p.on('pageerror', (e) => errs.push(String(e)));
  if (Object.keys(ls).length) await p.addInitScript((o) => { if (sessionStorage.getItem('r53')) return; sessionStorage.setItem('r53', '1'); for (const [k, v] of Object.entries(o)) localStorage.setItem(k, v); }, ls);
  await p.goto(q); await p.waitForFunction(() => !!document.getElementById('l4')?.dataset.hm, null, { timeout: 30000 });
  return errs;
}
const hl = (p: Page) => p.evaluate(() => history.length);

test.describe('R53 home', () => {
  test('first visit: value line, demo, chooser, one gold button to station 0, no popup, no greeting, quiet top bar, 4 tabs', async ({ page }) => {
    await page.goto('about:blank');
    const errs = await open(page, './?lang=zh#home'); const n0 = await hl(page);
    await expect(page.locator('#l4')).toHaveAttribute('data-hm', 'first.zh');
    await expect(page.locator('.l4-ob')).toHaveCount(0);
    await expect(page.locator('.hm-h')).toContainText('从一个数学函数出发');
    expect(await page.locator('#l4').innerText()).not.toMatch(/欢迎|你好|晚上好|早上好|Welcome|Hello|Good (morning|evening)/);
    await expect(page.locator('.hm-k')).toContainText('零基础');
    await expect(page.locator('.hm-h')).toContainText('搭到大模型、安全与应用');
    await expect(page.locator('.hm-cta')).toHaveCount(1); await expect(page.locator('.hm-cta')).toHaveAttribute('data-go', '#D/0');
    await expect(page.locator('.hm-cta')).toContainText('用样本找函数');
    await expect(page.locator('.hm-start')).toHaveCount(0);
    await expect(page.locator('.l4-top [data-a="menu"]')).toBeHidden(); await expect(page.locator('.l4-top [data-a="back"]')).toBeHidden();
    await expect(page.locator('.l4-top [data-a="set"]')).toBeVisible(); await expect(page.locator('.l4-top [data-a="lang"]')).toBeVisible();
    await expect(page.locator('.l4-tabs button')).toHaveCount(4); await expect(page.locator('.l4-tabs button.on')).toHaveText('学习');
    // the demo: T up → the top word's share goes down; nothing moves by itself
    const p1 = await page.locator('.hm-bar b').first().innerText();
    await page.locator('[data-h="T"]').fill('3'); await expect(page.locator('.hm-demo output')).toHaveText('3.0');
    const p3 = await page.locator('.hm-bar b').first().innerText(); expect(parseInt(p3)).toBeLessThan(parseInt(p1));
    // choosing a route on home changes the button, not the address
    await page.locator('.hm-rc[data-h="goal:derive"]').click(); await expect(page.locator('.hm-cta')).toHaveText(/用样本找函数/);
    await expect(page.locator('.hm-cta')).toHaveAttribute('data-go', '#D/0');
    await expect(page).toHaveURL(/#home$/); expect(await page.evaluate(() => localStorage.getItem('si.goal'))).toBe('derive');
    // tabs: no history entries, Back leaves the site
    for (const h of ['#map', '#P', '#R', '#home']) {
      const desk = page.locator(`.pt-more a[href="${h}"], .pt-links a[href="${h}"]`);
      if (await desk.first().isVisible()) await desk.first().click();
      else await page.locator(`.l4-tabs [data-go="${h}"]`).click();
      await expect(page).toHaveURL(new RegExp(h + '$'));
      if (await page.locator('.l4-tabs').isVisible()) await expect(page.locator('.l4-tabs button.on')).toHaveAttribute('data-go', h);
    }
    await page.locator('.hm-cta').click(); await expect(page).toHaveURL(/#D\/0$/); await expect(page.locator('.l4-tabs')).toBeHidden();
    expect(await hl(page)).toBe(n0);
    await page.goBack(); await expect(page).toHaveURL('about:blank');
    expect(errs).toEqual([]);
  });
  test('returning: 继续上次 on the route, mastery ring and layer bars from answers, 挑战一个朋友 after a mastered station', async ({ page }) => {
    const errs = await open(page, './?lang=zh#home', BACK);
    await expect(page.locator('#l4')).toHaveAttribute('data-hm', 'back.zh');
    await expect(page.locator('.hm-go .hm-gh')).toContainText('继续上次'); await expect(page.locator('.hm-go em')).toHaveText('看懂大模型 2/10');
    await expect(page.locator('.hm-gt')).toHaveText('注意力：谁和谁有关'); // 6 and 7 mastered → 8a (not read yet)
    await expect(page.locator('.hm-cta')).toHaveCount(1); await expect(page.locator('.hm-cta')).toHaveAttribute('data-go', '#D/8a');
    await expect(page.locator('.hm-metro li')).toHaveCount(10); await expect(page.locator('.hm-metro li.done')).toHaveCount(2); await expect(page.locator('.hm-metro li.cur')).toHaveCount(1);
    await expect(page.locator('.hm-rw b')).toHaveText('3'); // stations 0, 6, 7
    await expect(page.locator('.hm-lvb li')).toHaveCount(5);
    await expect(page.locator('.hm-fr')).toBeHidden(); // no challenge-station mastered yet (6 and 7 have no choice question)
    expect(await page.locator('#l4').innerText()).not.toMatch(/欢迎|你好|晚上好|Welcome|Hello/);
    expect(errs).toEqual([]);
  });
  test('routes on one axis: five lines, 换这条 switches without navigating; 两种看法 open the pyramid and the chain', async ({ page }) => {
    const errs = await open(page, './?lang=zh#home');
    await expect(page.locator('.hm-rt')).toHaveCount(5); await expect(page.locator('.hm-rt.on')).toHaveCount(0);
    await expect(page.locator('.hm-rt').nth(1).locator('circle')).toHaveCount(10);
    await page.locator('.hm-rt [data-h="goal:agent"]').click(); await expect(page.locator('.hm-rt.on b')).toHaveText('做 Agent'); await expect(page).toHaveURL(/#home$/);
    await page.locator('.hm-v[href="#map"]').click(); await expect(page).toHaveURL(/#map$/); await expect(page.locator('.l4-lv')).toHaveCount(5);
    { const home = page.locator('.pt-links a[href="#home"]'); if (await home.isVisible()) await home.click(); else await page.locator('.l4-tabs [data-go="#home"]').click(); }
    await page.locator('.hm-v[href="#D"]').click(); await expect(page).toHaveURL(/#D$/);
    expect(errs).toEqual([]);
  });
  test('today’s challenge: answer on home; 挑战朋友 shows only after the right answer and opens the same question', async ({ page }) => {
    const errs = await open(page, './?lang=zh#home');
    const ch = page.locator('.hm-ch'); await expect(ch.locator('.hm-op')).toHaveCount(3); await expect(ch.locator('.hm-out')).toHaveCount(0);
    for (let i = 0; i < 3 && !(await ch.locator('.hm-op.ok').count()); i++) await ch.locator('.hm-op:not(.bad)').nth(0).click();
    await expect(ch.locator('.hm-op.ok')).toHaveCount(1); const out = ch.locator('.hm-out'); await expect(out).toBeVisible();
    const q = await ch.locator('.hm-chq').innerText(), to = (await out.getAttribute('data-go'))!; expect(to).toMatch(/^#D\/ch\//);
    await out.click(); await expect(page).toHaveURL(new RegExp(to.replace(/[/]/g, '\\/') + '$'));
    await page.waitForFunction(() => /^D\/ch\//.test(document.getElementById('l4')?.dataset.px ?? ''));
    await expect(page.locator('.dv-chq .l4-kbd p').first()).toHaveText(q);
    expect(errs).toEqual([]);
  });
  test('the sheet: depth and route save at once, 我是程序员 switch, start goes to the route’s next stop', async ({ page }) => {
    const errs = await open(page, './?lang=zh#home');
    await page.locator('.hm-dd').nth(1).click(); const sh = page.locator('.hm-sh'); await expect(sh).toBeVisible();
    await sh.locator('[data-s="d:d"]').click(); expect(await page.evaluate(() => localStorage.getItem('si.ly.depth'))).toBe('d');
    await expect(page.locator('.hm-dd').nth(1)).toContainText('深入'); await expect(page.locator('.hm-meta')).toContainText(`约 ${pathMin(DV_KEY)} 分钟`);
    await sh.locator('[data-s="g:interview"]').click(); await expect(sh.locator('[data-s="g:interview"]')).toHaveAttribute('aria-checked', 'true');
    await sh.locator('[data-s="jv"]').click(); expect(await page.evaluate(() => localStorage.getItem('si.ly.jv'))).toBe('1');
    await sh.locator('[data-s="go"]').click(); await expect(sh).toHaveCount(0); await expect(page).toHaveURL(/#D\/1$/);
    await page.waitForSelector('.ly-jv', { state: 'attached' }); expect(await page.locator('.ly-jv').evaluate((e) => (e as HTMLDetailsElement).open)).toBe(true);
    expect(errs).toEqual([]);
  });
  for (const lang of ['zh', 'en'] as const) {
    test(`contrast ≥ 4.5:1, text ≥ 12px and nothing sideways, first visit + returning + sheet, ${lang}`, async ({ page }) => {
      const bad: string[] = [];
      const chk = async (tag: string) => {
        for (const x of await page.evaluate(contrastIssues, { root: '#l4', min: 4.5, icon: 3 })) bad.push(`${tag} contrast ${x.cls} “${x.txt}” ${x.fg} on ${x.bg} = ${x.r}`);
        for (const x of await page.evaluate(textIssues, 12)) bad.push(`${tag} text ${x.k} ${x.cls} “${x.txt.slice(0, 30)}” ${x.why ?? ''}`);
        const W = page.viewportSize()!.width;
        bad.push(...(await page.evaluate((W) => [...document.querySelectorAll('.hm *')].filter((e) => !e.closest('.hm-chips')).filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.left < -0.5 || r.right > W + 0.5); }).map((e) => `wide ${e.className}`), W)).map((s) => `${tag} ${s}`));
        // the tab bar never covers the page: the home scroller ends where the tabs start
        const [hb, tt, shown] = await page.evaluate(() => { const t = document.querySelector('.l4-tabs') as HTMLElement | null; const on = !!t && getComputedStyle(t).display !== 'none'; return [document.querySelector('.l4-home')!.getBoundingClientRect().bottom, t ? t.getBoundingClientRect().top : 0, on]; });
        if (shown && hb > tt + 0.5) bad.push(`${tag} tabs cover the page`);
      };
      await open(page, `./?lang=${lang}#home`); await page.waitForSelector('.hm-ch .hm-op'); await chk('first');
      await page.evaluate(() => document.querySelector('.l4-home')!.scrollTo(0, 99999)); await page.waitForTimeout(150); await chk('first-end');
      await page.locator('.hm-dd').first().click(); await page.waitForTimeout(250);
      for (const x of await page.evaluate(contrastIssues, { root: '.hm-sh', min: 4.5, icon: 3 })) bad.push(`sheet contrast ${x.cls} “${x.txt}” ${x.fg} on ${x.bg} = ${x.r}`);
      await page.keyboard.press('Escape');
      await page.evaluate((o) => { for (const [k, v] of Object.entries(o)) localStorage.setItem(k, v); localStorage.setItem('si.vf', JSON.stringify(['s1a', 's1b', 's1c', 's1d', 's0a', 's0b', 's6a', 's6b'])); location.reload(); }, BACK);
      await page.waitForFunction((l) => document.getElementById('l4')?.dataset.hm === `back.${l}`, lang); await page.waitForSelector('.hm-fr');
      await chk('back'); await page.evaluate(() => document.querySelector('.l4-home')!.scrollTo(0, 99999)); await page.waitForTimeout(150); await chk('back-end');
      expect(bad).toEqual([]);
    });
  }
  test('zh and en have the same home structure', async ({ page }) => {
    const shape = () => page.evaluate(() => ['.hm-card', '.hm-rt', '.hm-rc', '.hm-cta', '.hm-dd', '.hm-op', '.hm-v', '.l4-tabs button'].map((s) => document.querySelectorAll(s).length));
    await open(page, './?lang=zh#home'); await page.waitForSelector('.hm-ch .hm-op'); const a = await shape();
    await page.locator('.hm-ft [data-a="lang"]').click(); await page.waitForFunction(() => document.getElementById('l4')?.dataset.hm === 'first.en'); await page.waitForSelector('.hm-ch .hm-op');
    expect(await shape()).toEqual(a);
  });
});
