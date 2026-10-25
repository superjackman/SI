/* R27: the short home page and the 首页 → 专区 → 细节站 layers, in the real app: the bare URL opens the home page (old #T1 / #K3
   links still open their stop), the doorways drill into their zones, every stop shows its layer with ⬆ up / ⬇ down,
   T1 shows the principles route map with progress, the home share card and the ☰ drawer's 🏠 / 📣 rows work, and
   nothing is wider than the phone (zh + en on 360/390/430). */
import { test, expect, type Page } from '@playwright/test';

type Lang = 'zh' | 'en';
const act = 'section.level.active';
const ready = (page: Page, S: string, lang: Lang) => page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached' });
async function home(page: Page, lang: Lang) { await page.goto(`./?lang=${lang}`); await ready(page, 'H', lang); await expect(page.locator(`${act} .hm-t`)).toBeVisible(); }
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
/* tap targets in the new blocks: every visible one at least 40 px tall and inside the screen; no two overlap */
const layout = (page: Page, sel: string) => page.evaluate((sel) => {
  const cw = document.documentElement.clientWidth, bad: string[] = [];
  const rs = [...document.querySelectorAll<HTMLElement>(sel)].filter((e) => e.getClientRects().length).map((e) => [e, e.getBoundingClientRect()] as const);
  for (const [e, r] of rs) {
    const n = (e.textContent ?? '').trim().slice(0, 24);
    if (r.height < 40) bad.push('short ' + n + ' ' + r.height);
    if (r.left < -0.5 || r.right > cw + 0.5) bad.push('out ' + n);
  }
  for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
    const a = rs[i]![1], b = rs[j]![1];
    if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) bad.push('overlap ' + (rs[i]![0].textContent ?? '').trim().slice(0, 16) + ' / ' + (rs[j]![0].textContent ?? '').trim().slice(0, 16));
  }
  return bad;
}, sel);

for (const lang of ['zh', 'en'] as Lang[]) {
  const tr = (zh: string, en: string) => (lang === 'zh' ? zh : en);

  test(`${lang} home: short first screen — one line, 🎬, 🧒, six doorways; no counter, no trail; fits the phone`, async ({ page }) => {
    await home(page, lang);
    await expect(page.locator(`${act} .hm-door .dr-m`)).toHaveCount(6);
    await expect(page.locator(`${act} [data-tour=start]`)).toBeInViewport();
    await expect(page.locator(`${act} .hm [data-route=kid]`)).toBeInViewport();
    await expect(page.locator('#tbWhere b')).toHaveText(tr('首页', 'Home'));
    await expect(page.locator('#tbWhere .tb-dots')).toHaveCount(0);
    await expect(page.locator('#mPrev')).toBeDisabled();
    await expect(page.locator('#crumb')).toBeHidden();
    await expect(page.locator(`${act} details.hm-more`)).not.toHaveAttribute('open', '');
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    expect(await layout(page, `${act} .hm-b, ${act} .dr-m`)).toEqual([]);
    await page.locator(`${act} .hm-more>summary`).click();
    expect(await layout(page, `${act} .hm-b, ${act} .dr-m, ${act} .hm-more>summary`)).toEqual([]);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });

  for (const [S, n] of [['Api', 8], ['Loc', 9], ['Job', 10], ['Skl', 11], ['Bld', 12], ['T1', 1]] as const) {
    test(`${lang} doorway → ${S}: lands on stop ${n}, layer 2 strip, ⬆ back home, crumb starts at home`, async ({ page }) => {
      await home(page, lang);
      await page.locator(`${act} .hm-door [data-go="${S}"]`).click();
      await ready(page, S, lang);
      await expect(page.locator('#tbWhere small')).toHaveText(`${n}/27`);
      const z = page.locator(`${act} .m-zone.z2`);
      await expect(z).toBeVisible();
      await expect(z.locator('.mz-lv')).toContainText(tr('第 2 层', 'Level 2'));
      await expect(page.locator('#crumb .chip').first()).toHaveText(tr('⌂ 首页', '⌂ Home'));
      expect(await overflow(page)).toBeLessThanOrEqual(0);
      expect(await layout(page, `${act} .m-zone button`)).toEqual([]);
      if (S !== 'T1') {
        const d = z.locator('.mz-dn [data-go]').first(), to = (await d.getAttribute('data-go'))!;
        await d.click(); await ready(page, to, lang);
        await expect(page.locator(`${act} .m-zone .mz-up`)).toBeVisible();
        await page.goto(`./?lang=${lang}#${S}`); await ready(page, S, lang); /* stop changes replace the history entry */
      }
      await page.locator(`${act} .m-zone .mz-up`).click();
      await ready(page, 'H', lang);
      expect(new URL(page.url()).hash).toBe('');
    });
  }

  test(`${lang} detail stop: layer 3 strip goes ⬆ one layer up (T4a → T4 → T3)`, async ({ page }) => {
    await page.goto(`./?lang=${lang}#T4a`); await ready(page, 'T4a', lang);
    await expect(page.locator(`${act} .m-zone.z3 .mz-lv`)).toContainText(tr('第 3 层', 'Level 3'));
    await page.locator(`${act} .m-zone .mz-up`).click(); await ready(page, 'T4', lang);
    await page.locator(`${act} .m-zone .mz-up`).click(); await ready(page, 'T3', lang);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });

  test(`${lang} T1 route map: 16 stops, visited ones lit and counted`, async ({ page }) => {
    await page.goto(`./?lang=${lang}#T3`); await ready(page, 'T3', lang);
    await page.goto(`./?lang=${lang}#T1`); await ready(page, 'T1', lang);
    const m = page.locator(`${act} .m-rmap`);
    await expect(m.locator('.rm-s')).toHaveCount(16);
    await expect(m.locator('[data-rmc]')).toHaveText('2/16');
    await expect(m.locator('.rm-s.v')).toHaveCount(2);
    await expect(page.locator(`${act} .m-door`)).toHaveCount(0);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    expect(await layout(page, `${act} .m-rmap button`)).toEqual([]);
    await m.locator('[data-rm="K3"]').click(); await ready(page, 'K3', lang);
  });

  test(`${lang} share: the home card opens the share panel for the bare URL; the drawer has 🏠 home and 📣 share`, async ({ page }) => {
    await home(page, lang);
    await page.locator(`${act} [data-hm=share]`).click();
    const dlg = page.locator('#sharePanel');
    await expect(dlg).toBeVisible();
    await page.keyboard.press('Escape');
    await page.locator(`${act} .hm-more>summary`).click();
    await page.locator(`${act} [data-hm=drawer]`).click();
    await expect(page.locator('#mDrawer [data-dw="H"]')).toBeVisible();
    await expect(page.locator('#dwShare')).toContainText(tr('分享本站', 'Share this site'));
    await page.locator('#mDrawer [data-dw="T7"]').click(); await ready(page, 'T7', lang);
    await page.locator('#mMenu').click();
    await page.locator('#mDrawer [data-dw="H"]').click(); await ready(page, 'H', lang);
  });

  test(`${lang} old links: #T1, #K3 and a challenge-style #T4a link still open their stop; ▶ next from home is stop 1`, async ({ page }) => {
    for (const S of ['T1', 'K3', 'T4a']) { await page.goto(`./?lang=${lang}#${S}`); await ready(page, S, lang); }
    await home(page, lang);
    await page.locator('#mNext').click(); await ready(page, 'T1', lang);
  });
}
