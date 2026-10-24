/* R22: the bottom bar is 📑 目录 · 🧪 实验 · ✅ 小测 · ✨ 进度 · 下一站 (was a row of stops + 更多, which the ☰ menu and the
   top bar already cover). Each button on T1, a K stop, the last stop K5 and the lab-less T8; zh + en; every width:
   labels under icons, never cut off, no overlap, ≥ 44 px; the old 更多 extras now live in the ☰ menu. */
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';

type Lang = 'zh' | 'en';
const KEY: Record<string, number[]> = JSON.parse(fs.readFileSync(new URL('../../src/legacy/gen/qkey.json', import.meta.url), 'utf8')).key;
test.beforeEach(async ({ page }) => { await page.addInitScript(() => { localStorage.setItem('si.fs', '0'); localStorage.setItem('si.a2hs', '1'); }); });
async function at(page: Page, S: string, lang: Lang, q = '') {
  await page.goto(`./?lang=${lang}${q}#${S}`);
  await page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached', timeout: 15_000 });
}
const station = (page: Page) => page.evaluate(() => document.querySelector('section.level.active')?.id);
const bn = (page: Page, k: string) => page.locator(`#bnav [data-bn="${k}"]`);
const DOCK = ['toc', 'lab', 'quiz', 'prog', 'next'];
const LABEL = { zh: ['目录', '实验', '小测', '进度', '下一站'], en: ['Contents', 'Labs', 'Quiz', 'Progress', 'Next'] };

for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang}: the bar — 5 buttons in order, labels under icons, nothing cut off or overlapping, ≥ 44 px, inside the screen`, async ({ page }) => {
    for (const S of ['T1', 'K2', 'K5', 'T8']) {
      await at(page, S, lang);
      expect(await page.locator('#bnav button').evaluateAll((b) => b.map((e) => (e as HTMLElement).dataset.bn))).toEqual(DOCK);
      const r = await page.evaluate(() => {
        const cw = document.documentElement.clientWidth, bad: string[] = [], nav = document.getElementById('bnav')!.getBoundingClientRect();
        const bs = [...document.querySelectorAll<HTMLElement>('#bnav button')].map((b) => [b, b.getBoundingClientRect()] as const);
        bs.forEach(([b, R], i) => {
          const sp = b.querySelector('span')!, ic = b.querySelector('i')!, s = sp.getBoundingClientRect(), I = ic.getBoundingClientRect();
          if (R.width < 44 || R.height < 44) bad.push('small:' + b.dataset.bn);
          if (R.left < -0.5 || R.right > cw + 0.5) bad.push('out:' + b.dataset.bn);
          if (sp.scrollWidth > sp.clientWidth + 0.5 || s.left < R.left - 0.5 || s.right > R.right + 0.5) bad.push('cut:' + b.dataset.bn);
          if (I.bottom > s.top + 1) bad.push('notUnder:' + b.dataset.bn);
          const n = bs[i + 1]; if (n && R.right > n[1].left + 0.5) bad.push('overlap:' + b.dataset.bn);
          if (getComputedStyle(sp).textOverflow === 'ellipsis' && sp.scrollWidth > sp.clientWidth) bad.push('ellipsis:' + b.dataset.bn);
        });
        return { bad, bottom: Math.round(nav.bottom), vh: innerHeight, labels: bs.map(([b]) => b.querySelector('span')!.textContent), aria: bs.map(([b]) => b.getAttribute('aria-label') ?? '') };
      });
      expect(r.bad, S).toEqual([]);
      expect(r.labels).toEqual(LABEL[lang]);
      expect(r.aria.every((a) => a.length > 1)).toBe(true);
      expect(Math.abs(r.bottom - r.vh)).toBeLessThanOrEqual(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    }
  });

  test(`${lang}: 📑 contents sheet on T1 — lists the parts, marks where you are, a tap scrolls there and closes`, async ({ page }) => {
    await at(page, 'T1', lang);
    await bn(page, 'toc').click();
    const sh = page.locator('#dkSheet[data-k="toc"]'); await expect(sh).toHaveClass(/open/);
    await expect(sh).toHaveAttribute('role', 'dialog');
    await expect(bn(page, 'toc')).toHaveClass(/on/);
    const it = sh.locator('#dkToc .dk-it'); expect(await it.count()).toBeGreaterThan(3);
    await expect(sh.locator('#dkToc .dk-it.on')).toHaveCount(1);
    await expect(sh.locator('#dkToc .dk-it[aria-current]')).toHaveCount(1);
    const h = await it.evaluateAll((e) => e.map((x) => x.getBoundingClientRect().height));
    expect(Math.min(...h)).toBeGreaterThanOrEqual(43.5); // sub-pixel rounding of min-height:44px
    const y0 = await page.evaluate(() => scrollY);
    await it.nth(3).click();
    await expect(page.locator('#dkSheet')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(y0 + 100);
    let last = -1; await expect.poll(async () => { const y = await page.evaluate(() => scrollY); const same = y === last; last = y; return same; }, { intervals: [250] }).toBe(true);
    await bn(page, 'toc').click();
    expect(await page.locator('#dkToc .dk-it').evaluateAll((e) => e.findIndex((x) => x.classList.contains('on')))).toBe(3);
    await page.keyboard.press('Escape'); await expect(page.locator('#dkSheet')).toHaveCount(0);
    /* tapping 📑 again closes it */
    await bn(page, 'toc').click(); await expect(page.locator('#dkSheet')).toHaveCount(1);
    await bn(page, 'toc').click(); await expect(page.locator('#dkSheet')).toHaveCount(0);
    await bn(page, 'toc').click(); await page.mouse.click(180, 130); await expect(page.locator('#dkSheet')).toHaveCount(0);
  });

  test(`${lang}: 🧪 / ✅ — one lab opens at once (K2), several give a list (T3), none says so (T8); quiz scrolls and gets ✓ when lit`, async ({ page }) => {
    await at(page, 'K2', lang);
    await bn(page, 'lab').click();
    await expect(page.locator('#dkSheet')).toHaveCount(0);
    await expect(page.locator('section#K2 .card.lab').first()).toBeInViewport();
    await bn(page, 'quiz').click();
    await expect(page.locator('section#K2 .card.quiz[id^="quiz"]')).toBeInViewport();
    await expect(bn(page, 'quiz')).not.toHaveAttribute('data-st', 'ok');
    /* answer the quiz → lit → ✓ */
    for (const [i, r] of KEY.K2!.entries()) { const o = page.locator(`#quizK2 .opt[data-q="K2.${i}"][data-o="${r}"]`); await o.scrollIntoViewIfNeeded(); await o.click(); }
    await expect(bn(page, 'quiz')).toHaveAttribute('data-st', 'ok');
    await expect(bn(page, 'quiz')).toHaveAttribute('data-n', '✓');
    await expect(bn(page, 'prog')).toHaveAttribute('data-n', '1/27');
    await at(page, 'T3', lang);
    await expect(bn(page, 'lab')).toHaveAttribute('data-n', /^[2-9]$/);
    const n = Number(await bn(page, 'lab').getAttribute('data-n'));
    await bn(page, 'lab').click();
    await expect(page.locator('#dkSheet[data-k="lab"] #dkLabs [data-lab]')).toHaveCount(n);
    await page.locator('#dkLabs [data-lab]').nth(1).click();
    await expect(page.locator('#dkSheet')).toHaveCount(0);
    await at(page, 'T8', lang);
    await expect(bn(page, 'lab')).toHaveAttribute('data-st', 'off');
    await expect(bn(page, 'quiz')).toHaveAttribute('data-st', 'off');
    await bn(page, 'lab').click();
    await expect(page.locator('#toast')).toHaveText(lang === 'zh' ? '这一站没有动手实验。点「下一站」去找好玩的吧！' : 'This stop has no hands-on lab. Tap “Next” to find one!');
    await bn(page, 'quiz').click();
    await expect(page.locator('#toast')).toHaveText(lang === 'zh' ? '这一站没有小测验。' : 'This stop has no quiz.');
    await expect(page.locator('#dkSheet')).toHaveCount(0);
  });

  test(`${lang}: ✨ progress panel, 下一站 on K2 and the last stop K5`, async ({ page }) => {
    await at(page, 'K2', lang);
    await bn(page, 'prog').click();
    const sh = page.locator('#dkSheet[data-k="prog"]'); await expect(sh).toHaveClass(/open/);
    await expect(sh.locator('#shProgBar')).toBeAttached();
    await expect(sh.locator('#shProgTxt')).toContainText(lang === 'zh' ? '/ 27 站' : '/ 27');
    await expect(sh.locator('#dkLeft')).toBeVisible();
    await expect(sh.locator('#shProgCard')).toBeVisible();
    await sh.locator('.sh-x').click(); await expect(page.locator('#dkSheet')).toHaveCount(0);
    await bn(page, 'next').click();
    await expect.poll(() => station(page)).toBe('K3');
    await at(page, 'K5', lang);
    await bn(page, 'next').click();
    const last = page.locator('#dkSheet[data-k="next"]'); await expect(last).toHaveClass(/open/);
    await expect(last.locator('#dkSeeProg')).toBeVisible();
    await last.locator('#dkFirst').click();
    await expect.poll(() => station(page)).toBe('T1');
    await expect(page.locator('#dkSheet')).toHaveCount(0);
  });

  test(`${lang}: kids' route — ✨ shows k/6, 🧪 plays the route lab, 下一站 follows the route`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('aiexp.v2.route', 'kid'));
    await at(page, 'T2', lang);
    await expect(bn(page, 'prog')).toHaveAttribute('data-n', '0/6');
    await expect(bn(page, 'prog')).toHaveAttribute('data-st', 'rt');
    await bn(page, 'lab').click();
    await expect(page.locator('#dkSheet')).toHaveCount(0);
    await expect(page.locator('#labAgent')).toBeInViewport();
    await bn(page, 'prog').click();
    await expect(page.locator('#dkSheet .ob-rl')).toBeVisible();
    await page.keyboard.press('Escape');
    await bn(page, 'next').click();
    await expect.poll(() => station(page)).toBe('T3');
  });

  test(`${lang}: the ☰ menu holds what the old 更多 sheet had — detail level, my progress, map + icons + training/in use`, async ({ page }) => {
    await at(page, 'T3', lang);
    await page.locator('#mMenu').click(); await expect(page.locator('#mDrawer')).toHaveClass(/open/);
    await expect(page.locator('#mDrawer #zoom [data-z]')).toHaveCount(3);
    await page.locator('#zoom [data-z="1"]').click();
    await expect(page.locator('#zoom [data-z="1"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#zoom [data-z="3"]').click();
    await page.locator('#dwProg').click();
    await expect(page.locator('#dkSheet[data-k="prog"]')).toHaveClass(/open/);
    await expect(page.locator('#mDrawer')).not.toHaveClass(/open/);
    await page.keyboard.press('Escape');
    await page.locator('#mMenu').click(); await page.locator('#dwMore').click();
    const m = page.locator('#dkSheet[data-k="more"]'); await expect(m).toHaveClass(/open/);
    await expect(m.locator('#slotMode [data-mode="train"]')).toBeVisible();
    await expect(m.locator('.ic-leg')).toBeVisible();
    await expect(m.locator('#shMap')).toBeAttached();
    const fits = await m.evaluate((e) => e.scrollWidth <= e.clientWidth + 1);
    expect(fits).toBe(true);
  });
}

for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang}: with a sheet open the bar stays on top and tappable — another button switches straight to its action, the same one closes`, async ({ page }) => {
    await at(page, 'T3', lang);
    const sheet = page.locator('#dkSheet');
    /* the bar is above the mask and the sheet ends at the bar's top edge */
    await bn(page, 'toc').click(); await expect(page.locator('#dkSheet[data-k="toc"]')).toHaveClass(/open/);
    await page.waitForTimeout(350);
    const geo = await page.evaluate(() => {
      const nav = document.getElementById('bnav')!.getBoundingClientRect(), sh = document.getElementById('dkSheet')!.getBoundingClientRect();
      const hits = [...document.querySelectorAll<HTMLElement>('#bnav button')].map((b) => { const r = b.getBoundingClientRect(); return !!document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest(`#bnav [data-bn="${b.dataset.bn}"]`); });
      return { gap: Math.round(nav.top - sh.bottom), hits };
    });
    expect(geo.hits).toEqual([true, true, true, true, true]);
    expect(Math.abs(geo.gap)).toBeLessThanOrEqual(1);
    await expect(bn(page, 'toc')).toHaveClass(/on/);
    /* 目录 → 进度 */
    await bn(page, 'prog').click();
    await expect(page.locator('#dkSheet[data-k="prog"]')).toHaveClass(/open/);
    await expect(sheet).toHaveCount(1);
    await expect(bn(page, 'prog')).toHaveClass(/on/); await expect(bn(page, 'toc')).not.toHaveClass(/on/);
    /* 进度 → 🧪 (T3 has several labs: its list) */
    await bn(page, 'lab').click();
    await expect(page.locator('#dkSheet[data-k="lab"]')).toHaveClass(/open/);
    await expect(bn(page, 'lab')).toHaveClass(/on/);
    /* 🧪 again closes it */
    await bn(page, 'lab').click(); await expect(sheet).toHaveCount(0);
    /* 进度 → ✅ closes the sheet and goes to the quiz */
    await bn(page, 'prog').click(); await expect(page.locator('#dkSheet[data-k="prog"]')).toHaveClass(/open/);
    await bn(page, 'quiz').click(); await expect(sheet).toHaveCount(0);
    await expect(page.locator('section#T3 .card.quiz[id^="quiz"]')).toBeInViewport();
    /* 目录 → 下一站 closes the sheet and moves on */
    await bn(page, 'toc').click(); await expect(page.locator('#dkSheet[data-k="toc"]')).toHaveClass(/open/);
    await bn(page, 'next').click();
    await expect.poll(() => station(page)).toBe('N');
    await expect(sheet).toHaveCount(0);
    /* the mask (above the sheet) and Escape still close it */
    await bn(page, 'prog').click(); await expect(sheet).toHaveCount(1);
    await page.mouse.click(180, 120); await expect(sheet).toHaveCount(0);
    await bn(page, 'prog').click(); await expect(sheet).toHaveCount(1);
    await page.keyboard.press('Escape'); await expect(sheet).toHaveCount(0);
    /* last stop: 下一站's own sheet, 下一站 again closes it, 进度 switches from it */
    await at(page, 'K5', lang);
    await bn(page, 'next').click(); await expect(page.locator('#dkSheet[data-k="next"]')).toHaveClass(/open/);
    await bn(page, 'next').click(); await expect(sheet).toHaveCount(0);
    await bn(page, 'next').click(); await expect(page.locator('#dkSheet[data-k="next"]')).toHaveClass(/open/);
    await bn(page, 'prog').click(); await expect(page.locator('#dkSheet[data-k="prog"]')).toHaveClass(/open/);
  });

  test(`${lang}: no ☰ menu button text is cut off or squeezed`, async ({ page }) => {
    await at(page, 'T3', lang);
    for (const touring of [false, true]) {
      if (touring) { await page.locator('#mMenu').click(); await page.locator('#mTour').click(); await expect(page.locator('#tour')).toHaveClass(/open/); }
      await page.locator('#mMenu').click(); await expect(page.locator('#mDrawer')).toHaveClass(/open/); await page.waitForTimeout(350);
      const bad = await page.evaluate(() => {
        const out: string[] = [];
        for (const b of document.querySelectorAll<HTMLElement>('#mDrawer button')) {
          if (!b.getClientRects().length) continue;
          const els = [b, ...b.querySelectorAll<HTMLElement>('span,b')];
          for (const e of els) if (e.scrollWidth > e.clientWidth + 0.5 && getComputedStyle(e).overflowX !== 'visible' || (e !== b && e.getBoundingClientRect().right > b.getBoundingClientRect().right + 0.5)) out.push((b.id || b.className) + ':' + (b.textContent ?? '').trim().slice(0, 30));
        }
        return out;
      });
      expect(bad).toEqual([]);
      await expect(page.locator('#dwSearch span')).toHaveText(lang === 'zh' ? '搜索' : 'Search');
      await expect(page.locator('#dwSearch')).toHaveAttribute('aria-label', /.{4,}/);
      await page.keyboard.press('Escape');
    }
  });
}
