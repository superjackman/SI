/* R24: second round of ⚠️ mix-up cards — rendered on K1–K5 / Uc / Ua / N / T6, nothing wider than the screen
   (zh + en, every width), found from the 📑 contents sheet and from search; labBatch counts 1000 ÷ 32 → 32 steps,
   31 with drop_last, and warns when a dropped batch leaves no step. */
import { test, expect, type Page } from '@playwright/test';
import { CF2_IDS } from '../../m2/content/ext/m12';

type Lang = 'zh' | 'en';
test.beforeEach(async ({ page }) => { await page.addInitScript(() => { localStorage.setItem('si.fs', '0'); localStorage.setItem('si.a2hs', '1'); }); });
async function at(page: Page, S: string, lang: Lang) {
  await page.goto(`./?lang=${lang}#${S}`);
  await page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached', timeout: 15_000 });
}
const PRE = { zh: '⚠️ 容易混淆：', en: '⚠️ Easy to mix up: ' };
const noOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang}: every R24 card renders, titled ⚠️, nothing overflows`, async ({ page }) => {
    const errs: string[] = []; page.on('pageerror', (e) => errs.push(e.message));
    for (const [S, ids] of Object.entries(CF2_IDS)) {
      await at(page, S, lang);
      for (const id of ids) {
        const c = page.locator(`section#${S} #${id}`); await c.scrollIntoViewIfNeeded(); await expect(c).toBeVisible();
        if (id.startsWith('cf')) await expect(c.locator('h3').first()).toContainText(PRE[lang]);
        const bad = await c.evaluate((card) => {
          const cw = document.documentElement.clientWidth, out: string[] = [], R = card.getBoundingClientRect();
          if (R.right > cw + 0.5 || R.left < -0.5) out.push('card');
          card.querySelectorAll<HTMLElement>('*').forEach((e) => { const r = e.getBoundingClientRect(); if (r.width && r.right > R.right + 1) out.push(e.tagName + '.' + e.className); });
          card.querySelectorAll<HTMLElement>('.cf-tw').forEach((w) => { if (w.scrollWidth > w.clientWidth + 1) out.push('tableScroll'); });
          return out;
        });
        expect(bad, `${S}/${id}`).toEqual([]);
      }
      expect(await noOverflow(page), S).toBe(true);
    }
    expect(errs).toEqual([]);
  });

  test(`${lang}: labBatch — steps per epoch, last batch, drop_last and the no-step warning`, async ({ page }) => {
    const errs: string[] = []; page.on('pageerror', (e) => errs.push(e.message));
    await at(page, 'K4', lang);
    const lab = page.locator('#labBatch'); await lab.scrollIntoViewIfNeeded();
    const out = page.locator('#bcOut'), k = (n: string) => out.locator(`[data-k="${n}"]`);
    await expect(k('per')).toHaveText('32'); await expect(k('last')).toHaveText('8'); await expect(k('total')).toHaveText('96');
    await expect(page.locator('#bcBar .bc-b')).toHaveCount(32); await expect(page.locator('#bcBar .bc-b.short')).toHaveCount(1);
    await page.locator('#bcD').check();
    await expect(k('per')).toHaveText('31'); await expect(k('total')).toHaveText('93'); await expect(page.locator('#bcBar .bc-b.gone')).toHaveCount(1);
    await page.locator('#bcE').fill('1'); await expect(page.locator('#bcEv')).toHaveText('1'); await expect(k('total')).toHaveText('31');
    await page.locator('#bcN').fill('5000'); await page.locator('#bcB').fill('8');
    await expect(k('per')).toHaveText('625'); await expect(page.locator('#bcBar .bc-more')).toHaveText('+565');
    await page.locator('#bcN').fill('100'); await page.locator('#bcB').fill('512');
    await expect(k('per')).toHaveText('0'); await expect(k('zero')).toBeVisible();
    await page.locator('#bcD').uncheck(); await expect(k('per')).toHaveText('1'); await expect(k('last')).toHaveText('100'); await expect(k('zero')).toHaveCount(0);
    expect(await lab.evaluate((c) => { const R = c.getBoundingClientRect(); return [...c.querySelectorAll('*')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > R.right + 1; }).length; })).toBe(0);
    expect(await noOverflow(page)).toBe(true);
    expect(errs).toEqual([]);
  });

  test(`${lang}: reachable from 📑 contents and from search`, async ({ page }) => {
    await at(page, 'K4', lang);
    await page.locator('#bnav [data-bn="toc"]').click();
    const it = page.locator('#dkToc .dk-it', { hasText: 'batch vs epoch vs step' });
    await expect(it).toHaveCount(1);
    await it.click();
    await expect(page.locator('#cfBatch')).toBeInViewport();
    for (const [q, id, S] of [
      [lang === 'zh' ? '交叉熵 vs KL' : 'cross-entropy vs KL', 'cfCeKl', 'K3'],
      [lang === 'zh' ? '工具 vs MCP' : 'tools vs MCP', 'cfToolMcpSkill', 'Uc'],
      [lang === 'zh' ? '导数 vs 偏导数' : 'derivative vs partial', 'cfDerivGrad', 'K1'],
      [lang === 'zh' ? '对话助手 vs 编程 Agent' : 'chat assistant vs coding agent', 'cfChatCode', 'Ua'],
    ] as const) {
      await page.locator('#mSearch').click();
      await page.locator('#search').fill(q);
      const hit = page.locator('#searchRes [data-sx]', { hasText: q }).first(); await expect(hit).toBeVisible();
      await hit.click();
      await page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached', timeout: 15_000 });
      await expect(page.locator(`#${id}`)).toBeInViewport();
    }
  });
}
