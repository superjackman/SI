/* R23: ⚠️ mix-up cards — rendered on their stations, nothing wider than the screen (zh + en, every width), found from
   the 📑 contents sheet and from search; labEmbOut steps through ①–⑤, the temperature slider changes the chances and
   drawing fills the sentence. */
import { test, expect, type Page } from '@playwright/test';
import { CF_IDS } from '../../m2/content/ext/m11';

type Lang = 'zh' | 'en';
test.beforeEach(async ({ page }) => { await page.addInitScript(() => { localStorage.setItem('si.fs', '0'); localStorage.setItem('si.a2hs', '1'); }); });
async function at(page: Page, S: string, lang: Lang) {
  await page.goto(`./?lang=${lang}#${S}`);
  await page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached', timeout: 15_000 });
}
const PRE = { zh: '⚠️ 容易混淆：', en: '⚠️ Easy to mix up: ' };

for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang}: every mix-up card renders, titled ⚠️, nothing overflows`, async ({ page }) => {
    const errs: string[] = []; page.on('pageerror', (e) => errs.push(e.message));
    for (const [S, ids] of Object.entries(CF_IDS)) {
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
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), S).toBe(true);
    }
    expect(errs).toEqual([]);
  });

  test(`${lang}: T4b dictionary vs scoring table and Q·K comparison — tables, memory line, cross-link`, async ({ page }) => {
    await at(page, 'T4b', lang);
    const a = page.locator('#cfEmbOut'); await a.scrollIntoViewIfNeeded();
    await expect(a.locator('table.cf-t')).toBeVisible();
    await expect(a).toContainText('50257');
    await expect(a.locator('ol.cf-ol > li')).toHaveCount(4);
    const b = page.locator('#cfQkOut'); await expect(b.locator('table.cf-t')).toBeVisible();
    await expect(b.locator('.cf-mem')).toBeVisible();
  });

  test(`${lang}: labEmbOut — five steps, temperature changes the chances, drawing fills the sentence`, async ({ page }) => {
    const errs: string[] = []; page.on('pageerror', (e) => errs.push(e.message));
    await at(page, 'T4b', lang);
    const lab = page.locator('#labEmbOut'); await lab.scrollIntoViewIfNeeded();
    const out = page.locator('#eoOut');
    await expect(out).toHaveAttribute('data-step', '0');
    await expect(out.locator('[data-k="row2"]')).toBeVisible();
    await expect(page.locator('#eoPrev')).toBeDisabled();
    await page.locator('#eoNext').click(); await expect(out).toHaveAttribute('data-step', '1');
    await expect(out.locator('[data-k="food"]')).toHaveText('5.64');
    await page.locator('#eoNext').click(); await expect(out).toHaveAttribute('data-step', '2');
    await expect(out.locator('[data-k="top"]')).toHaveText(lang === 'zh' ? '苹果' : 'apples');
    await expect(out.locator('[data-k="rawTop"]')).toHaveText(lang === 'zh' ? '跑步' : 'running');
    await lab.locator('[data-eo="3"]').click(); await expect(out).toHaveAttribute('data-step', '3');
    await expect(lab.locator('[data-eo="3"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(out.locator('[data-k="p0"]')).toHaveText('31.4%');
    const sl = page.locator('#eoT');
    await sl.fill('0.3'); await expect(out.locator('[data-k="p0"]')).toHaveText('59.4%'); await expect(page.locator('#eoTv')).toHaveText('0.3');
    await sl.fill('2'); await expect(out.locator('[data-k="p0"]')).toHaveText('24.2%');
    await page.locator('#eoNext').click(); await expect(out).toHaveAttribute('data-step', '4');
    await expect(page.locator('#eoNext')).toBeDisabled();
    await expect(out).toContainText(/T = 2\b/);
    await out.locator('[data-eo-act="20"]').click();
    await expect(out.locator('[data-k="n"]')).toHaveText('20');
    const sum = await out.locator('[data-k^="c"]').evaluateAll((e) => e.reduce((s, x) => s + Number(x.textContent), 0));
    expect(sum).toBe(20);
    await expect(out.locator('[data-k="sent"] b')).not.toHaveText('＿');
    await out.locator('[data-eo-act="0"]').click(); await expect(out.locator('[data-k="n"]')).toHaveText('0');
    for (const s of [0, 1, 2, 3, 4]) {
      await lab.locator(`[data-eo="${s}"]`).click();
      expect(await lab.evaluate((c) => { const R = c.getBoundingClientRect(); return [...c.querySelectorAll('*')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > R.right + 1; }).length; }), `step ${s}`).toBe(0);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(errs).toEqual([]);
  });

  test(`${lang}: reachable from 📑 contents and from search`, async ({ page }) => {
    await at(page, 'T4b', lang);
    await page.locator('#bnav [data-bn="toc"]').click();
    const it = page.locator('#dkToc .dk-it', { hasText: lang === 'zh' ? '前面的字典 vs 后面的打分表' : 'front dictionary vs back score table' });
    await expect(it).toHaveCount(1);
    await it.click();
    await expect(page.locator('#cfEmbOut')).toBeInViewport();
    for (const [q, id, S] of [[lang === 'zh' ? 'Q、K、V 各管什么' : 'what Q, K and V each do', 'cfQKV', 'T4a'], [lang === 'zh' ? 'MoE 的总参数' : 'MoE total vs active', 'cfMoeParams', 'T5']] as const) {
      await page.locator('#mSearch').click();
      await page.locator('#search').fill(q);
      const hit = page.locator('#searchRes [data-sx]', { hasText: q }).first(); await expect(hit).toBeVisible();
      await hit.click();
      await page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached', timeout: 15_000 });
      await expect(page.locator(`#${id}`)).toBeInViewport();
    }
    /* the 🧪 sheet on T4b now lists the new lab */
    await at(page, 'T4b', lang);
    await page.locator('#bnav [data-bn="lab"]').click();
    const lab = page.locator('#labEmbOut');
    if (await page.locator('#dkSheet').count()) await page.locator('#dkSheet .dk-it', { hasText: lang === 'zh' ? '我爱吃' : 'I love eating' }).click();
    await expect(lab).toBeInViewport();
  });
}
