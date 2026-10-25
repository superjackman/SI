/* R28 (all 27 stops + home; was the H / Job / T4a pilot): the calm skeleton — header is ☰ · where am I · search · share; a ‹ up link; a 3-item bottom
   bar (目录 · 进度 · 下一站, none on the home page). Nothing in the header or the bar is cut off or overlapping, zh + en. */
import { test, expect } from '@playwright/test';

type Lang = 'zh' | 'en';
const ready = (page: import('@playwright/test').Page, S: string, lang: Lang) => page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached', timeout: 15_000 });
/** header + bar: everything inside the screen, no clipped text, no two overlapping */
const bad = (page: import('@playwright/test').Page) => page.evaluate(() => {
      const out: string[] = [], cw = document.documentElement.clientWidth;
      const els = [...document.querySelectorAll<HTMLElement>('#bnav button, #topbar .tb-in > *')].filter((e) => e.getClientRects().length);
      for (const e of els) {
        const r = e.getBoundingClientRect();
        if (r.left < -0.5 || r.right > cw + 0.5) out.push('out ' + e.id + e.dataset.bn);
        if (e.scrollWidth > e.clientWidth + 1) out.push('clipped ' + (e.id || e.dataset.bn) + ' ' + e.scrollWidth + '>' + e.clientWidth);
        for (const s of e.querySelectorAll<HTMLElement>('span,b,small')) if (s.getClientRects().length && s.scrollWidth > s.clientWidth + 1) out.push('clipped text ' + s.textContent);
      }
      for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
        const a = els[i]!.getBoundingClientRect(), b = els[j]!.getBoundingClientRect();
        if (els[i]!.contains(els[j]!) || els[j]!.contains(els[i]!)) continue;
        if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) out.push('overlap ' + (els[i]!.id || els[i]!.dataset.bn) + '/' + (els[j]!.id || els[j]!.dataset.bn));
      }
      return out;
    });
test.beforeEach(async ({ page }) => { await page.addInitScript(() => localStorage.setItem('si.fs', '0')); });

const ORDER = ['T1', 'U', 'Ua', 'Ub', 'Uc', 'Ud', 'Up', 'Api', 'Loc', 'Job', 'Skl', 'Bld', 'T2', 'T3', 'N', 'T4', 'T4a', 'T4b', 'T5', 'T6', 'T7', 'T8', 'K1', 'K2', 'K3', 'K4', 'K5'];
for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang}: every stop and home — header ☰ · name · search · share, "n/27" or zone under the name, ‹ parent, 3-item bar (none at home); fits, ≥ 44px, nothing clipped or overlapping`, async ({ page }) => {
    test.setTimeout(240_000);
    for (const S of ['H', ...ORDER]) {
      await page.goto(`./?lang=${lang}#${S}`); await ready(page, S, lang);
      expect(await page.evaluate(() => document.body.classList.contains('r28')), S).toBe(true);
      await expect(page.locator('#mPrev, #mNext, #mLang'), S).toHaveCount(0);
      for (const id of ['#mMenu', '#mSearch', '#mShare']) { const b = (await page.locator(id).boundingBox())!; expect(b.width, `${S} ${id}`).toBeGreaterThanOrEqual(44); expect(b.height, `${S} ${id}`).toBeGreaterThanOrEqual(44); }
      if (S === 'H') { await expect(page.locator('#bnav button'), S).toHaveCount(0); continue; }
      expect(await page.locator('#bnav button').evaluateAll((bs) => bs.map((b) => (b as HTMLElement).dataset.bn)), S).toEqual(['toc', 'prog', 'next']);
      const sub = (await page.locator('#tbWhere .tb-sub').innerText()).trim(), n = ORDER.indexOf(S) + 1;
      expect(lang === 'zh' ? sub === '专区' || sub.includes(`第 ${n} 站`) && sub.includes('27') : sub === 'Zone' || new RegExp(`\\b${n}\\b.*27`).test(sub), `${S} sub "${sub}"`).toBe(true);
      const up = page.locator('#crumb .cb-up'); await expect(up, S).toBeVisible(); expect((await up.boundingBox())!.height, `${S} ‹`).toBeGreaterThanOrEqual(44);
      expect(await up.evaluate((e) => e.scrollWidth <= e.clientWidth + 1), `${S} ‹ clipped`).toBe(true);
      expect(await bad(page), S).toEqual([]);
      for (const b of await page.locator('#bnav button').all()) expect((await b.boundingBox())!.height, S).toBeGreaterThanOrEqual(44);
    }
  });
}

for (const lang of ['zh', 'en'] as Lang[]) for (const S of ['Job', 'T4a']) {
  test(`${lang} ${S}: header and 3-item bar fit — no clipped label, no overlap`, async ({ page }) => {
    await page.goto(`./?lang=${lang}#${S}`); await ready(page, S, lang);
    expect(await page.locator('#bnav button').evaluateAll((bs) => bs.map((b) => (b as HTMLElement).dataset.bn))).toEqual(['toc', 'prog', 'next']);
    expect(await bad(page)).toEqual([]);
    for (const b of await page.locator('#bnav button').all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  });
}
