/* R26: the 🤖 Job, 🧰 Skl and 🛠 Bld stops — scenario pickers switch panels (one shown at a time), the Skl catalogue
   lists real servers with official links, the T1 doorways and prev/next reach them, nothing is wider than the screen,
   and (fix a) the Loc / Api calculator dropdowns show their longest option without cutting it off. zh + en on 360/390/430. */
import { test, expect, type Page } from '@playwright/test';

type Lang = 'zh' | 'en';
const CJK = /[\u3400-\u9fff]/;
const act = 'section.level.active';
async function open(page: Page, lang: Lang, S: string) {
  await page.goto(`./?lang=${lang}#${S}`);
  await page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached' });
  await expect(page.locator(`${act} .pagehead`)).toBeVisible();
}
const ready = (page: Page, S: string, lang: Lang) => page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached' });
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const inside = (page: Page, sel: string) => page.evaluate((sel) => {
  const cw = document.documentElement.clientWidth;
  return [...document.querySelectorAll<HTMLElement>(sel)].filter((e) => e.getClientRects().length).map((e) => [e, e.getBoundingClientRect()] as const)
    .filter(([, r]) => r.left < -0.5 || r.right > cw + 0.5).map(([e]) => (e.className + ' ' + (e.textContent ?? '')).slice(0, 40));
}, sel);
const shown = (page: Page, out: string) => page.evaluate((out) => [...document.querySelectorAll<HTMLElement>(`#${out} .pk-v`)].filter((v) => !v.hidden && v.getClientRects().length).map((v) => v.dataset.pv), out);

for (const lang of ['zh', 'en'] as Lang[]) {
  const tr = (zh: string, en: string) => (lang === 'zh' ? zh : en);

  for (const [S, pk, n] of [['Job', 'pkJob', 10], ['Skl', 'pkSkl', 11], ['Bld', 'pkBld', 12]] as const) {
    test(`${lang} ${S}: boundary line, stop ${n} of 27, page fits, picker switches panels`, async ({ page }) => {
      await open(page, lang, S);
      await expect(page.locator(`${act} .ph-lv`)).toContainText(tr(`第 ${n} 站 / 共 27 站`, `Stop ${n} of 27`));
      await expect(page.locator(`${act} .pl-bd`).first()).toContainText(tr('这里不讲', 'Not covered'));
      expect(await overflow(page)).toBeLessThanOrEqual(0);
      const b = page.locator(`#${pk} .pk-b`), cnt = await b.count();
      expect(cnt).toBeGreaterThanOrEqual(5);
      await page.locator(`#${pk}`).scrollIntoViewIfNeeded();
      expect(await shown(page, pk + 'Out')).toHaveLength(1);
      for (const i of [cnt - 1, 1, 0]) {
        const k = await b.nth(i).getAttribute('data-pk');
        await b.nth(i).click();
        await expect(b.nth(i)).toHaveAttribute('aria-pressed', 'true');
        await expect.poll(() => shown(page, pk + 'Out')).toEqual([k]);
        expect(await page.locator(`#${pk} .pk-b[aria-pressed="true"]`).count()).toBe(1);
      }
      expect(await inside(page, `${act} .pk-b, ${act} .pk-v, ${act} .tbl-wrap, ${act} .card`)).toEqual([]);
      expect(await overflow(page)).toBeLessThanOrEqual(0);
      if (lang === 'en') expect(CJK.test(await page.locator(`#${pk}Out`).innerText())).toBe(false);
      /* outside links open in a new tab, safely */
      for (const a of await page.locator(`${act} a[href^="http"]`).all()) { await expect(a).toHaveAttribute('target', '_blank'); expect(await a.getAttribute('rel')).toContain('noopener'); }
    });
  }

  test(`${lang} Skl catalogue: 7 groups, real official links, each card inside the screen`, async ({ page }) => {
    await open(page, lang, 'Skl');
    const c = page.locator('#skCats .sk-cat');
    await expect(c).toHaveCount(7);
    await c.first().scrollIntoViewIfNeeded();
    for (const u of ['https://github.com/modelcontextprotocol/servers', 'https://github.com/github/github-mcp-server', 'https://registry.modelcontextprotocol.io'])
      expect(await page.locator(`#skCats a[href^="${u}"]`).count(), u).toBeGreaterThan(0);
    expect(await inside(page, '#skCats .sk-cat')).toEqual([]);
    await expect(page.locator(`${act} #cfSklMcpSkill`)).toContainText('⚠️');
  });

  test(`${lang} Job: overseas names carry no links; mainland media tools link out`, async ({ page }) => {
    await open(page, lang, 'Job');
    expect(await page.locator(`${act} .tag-note a`).count()).toBe(0);
    for (const u of ['https://jimeng.jianying.com', 'https://hailuoai.com']) expect(await page.locator(`${act} a[href="${u}"]`).count(), u).toBeGreaterThan(0);
  });

  test(`${lang} T1 doorways 🤖 🧰 🛠 land on Job / Skl / Bld; Loc → next is Job, Bld → next is T2`, async ({ page }) => {
    for (const S of ['Job', 'Skl', 'Bld']) {
      await open(page, lang, 'T1');
      await page.locator(`${act} .m-door .dr-m[data-go="${S}"]`).click();
      await ready(page, S, lang);
    }
    await open(page, lang, 'Loc'); await page.locator('#mNext').click(); await ready(page, 'Job', lang);
    await open(page, lang, 'Bld'); await page.locator('#mNext').click(); await ready(page, 'T2', lang);
    await open(page, lang, 'Job'); await page.locator('#mPrev').click(); await ready(page, 'Loc', lang);
  });

  /* fix (a): on a phone each dropdown takes the whole row, so its longest option is not cut off */
  for (const [S, lab] of [['Loc', 'labMem'], ['Api', 'labCost']] as const) test(`${lang} ${S} ${lab}: every option fits its dropdown`, async ({ page }) => {
    await open(page, lang, S);
    await page.locator(`#${lab}`).scrollIntoViewIfNeeded(); await page.locator(`#${lab} select`).first().focus();
    const bad = await page.evaluate((lab) => {
      const cx = document.createElement('canvas').getContext('2d')!, out: string[] = [];
      for (const s of document.querySelectorAll<HTMLSelectElement>(`#${lab} select`)) {
        const cs = getComputedStyle(s); cx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const room = s.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 20; // 20 px for the arrow
        for (const o of s.options) { const w = cx.measureText(o.text).width; if (w > room) out.push(`${o.text} ${Math.round(w)}>${Math.round(room)}`); }
      }
      return out;
    }, lab);
    expect(bad).toEqual([]);
    expect(await page.locator(`#${lab} select`).count()).toBeGreaterThan(0);
    expect(await inside(page, `#${lab} select`)).toEqual([]);
  });
}

// the Api cache-share slider: a short row (label, slider, %), the slider as wide as its row — no tall empty gap
for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang} Api calculator: the cache slider row is compact and full width`, async ({ page }) => {
    await open(page, lang, 'Api');
    const r = await page.evaluate(() => {
      const i = document.querySelector<HTMLElement>('#ckHit')!, l = i.parentElement!;
      return { lh: l.getBoundingClientRect().height, ih: i.getBoundingClientRect().height, iw: i.getBoundingClientRect().width, lw: l.getBoundingClientRect().width };
    });
    expect(r.ih).toBeLessThanOrEqual(40);
    expect(r.lh).toBeLessThan(120);
    expect(r.iw).toBeGreaterThan(r.lw * 0.9);
  });
}
