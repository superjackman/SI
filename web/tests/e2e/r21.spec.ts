/* R21: a first visitor knows where to start and how to use the page. Welcome card (tour / kids' route / full route),
   one-time coach marks on the header and signpost, text labels under the header icons, the 🧒 opening on top, a row
   with "N labs" / "lit n/22" / route chip, next-stop links after the opening and after the quiz, one-time tips at ⤵,
   🔒 and the dot strip; menu entry to see the welcome card again. Fresh profile, every phone width, zh + en. */
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';

type Lang = 'zh' | 'en';
const KEY: Record<string, number[]> = JSON.parse(fs.readFileSync(new URL('../../src/legacy/gen/qkey.json', import.meta.url), 'utf8')).key;
const CJK = /[\u3400-\u9fff]/;
test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('si.fs', '0');
    const w = window as unknown as { __ev: string[] }; w.__ev = [];
    addEventListener('si-ev', (e) => w.__ev.push(String((e as CustomEvent).detail)));
  });
});
async function at(page: Page, url: string, S: string, lang: Lang) {
  await page.goto(url);
  await page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached', timeout: 15_000 });
  await page.locator('section.level.active .ob-row').waitFor({ state: 'attached', timeout: 15_000 });
}
const evs = (page: Page) => page.evaluate(() => (window as unknown as { __ev: string[] }).__ev.slice());
const act = 'section.level.active';
/** no element among sel sticks out of the screen, and no two overlap */
const clean = (page: Page, sel: string) => page.evaluate((sel) => {
  const cw = document.documentElement.clientWidth, bad: string[] = [];
  const rs = [...document.querySelectorAll<HTMLElement>(sel)].filter((e) => e.getClientRects().length).map((e) => [e, e.getBoundingClientRect()] as const);
  for (const [e, r] of rs) if (r.left < -0.5 || r.right > cw + 0.5) bad.push('out:' + e.className + ':' + (e.textContent ?? '').slice(0, 20));
  for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
    const [a, p] = rs[i]!, [b, q] = rs[j]!;
    if (a.contains(b) || b.contains(a)) continue;
    if (Math.min(p.right, q.right) - Math.max(p.left, q.left) > 1 && Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top) > 1) bad.push('overlap:' + (a.textContent ?? '').slice(0, 12) + '|' + (b.textContent ?? '').slice(0, 12));
  }
  return bad;
}, sel);
async function answer(page: Page, S: string) {
  for (const [i, r] of KEY[S]!.entries()) { const o = page.locator(`#quiz${S} .opt[data-q="${S}.${i}"][data-o="${r}"]`); await o.scrollIntoViewIfNeeded(); await o.click(); }
}

for (const lang of ['zh', 'en'] as Lang[]) {
  const q = lang === 'en' ? '?lang=en' : '';
  const home = async (page: Page) => {
    await page.goto(q || './');
    await page.locator(`html[data-si-ready="H.${lang}"]`).waitFor({ state: 'attached', timeout: 15_000 });
    await expect(page.locator(`${act} .hm-door`)).toBeVisible();
  };
  test(`${lang} R27 first visit on the home page: slim welcome strip, doorways still on the first screen, header labels, no overlap; 7 coach marks on request`, async ({ page }) => {
    await home(page);
    const w = page.locator(`${act} .hm .ob-hw`);
    await expect(w).toBeVisible({ timeout: 5000 });
    expect(await page.evaluate(() => document.querySelector('.ob-hw')!.previousElementSibling?.classList.contains('hm-s'))).toBe(true);
    if (lang === 'en') expect(CJK.test(await w.innerText())).toBe(false);
    await expect(page.locator('.ob-bub')).toHaveCount(0); /* nothing pops up on its own */
    await expect(page.locator('.ob-tl span:not([hidden])')).toHaveCount(6);
    /* the first row of doorways is still on the first screen, and nothing overlaps */
    const top = await page.locator(`${act} .hm-door .dr-m`).first().evaluate((e) => e.getBoundingClientRect().bottom);
    expect(top).toBeLessThan(await page.evaluate(() => innerHeight - (document.getElementById('bnav')?.offsetHeight ?? 0)));
    expect(await clean(page, `${act} .hm > *, ${act} .ob-hw > *, ${act} .hm-go > *, ${act} .hm-door .dr-m`)).toEqual([]);
    for (const b of await page.locator('.ob-hw button').all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(43);
    await page.locator('.ob-hw [data-ob="onb-btns"]').click();
    await expect(page.locator('.ob-hw')).toHaveCount(0);
    for (let i = 0; i < 7; i++) {
      const bub = page.locator('.ob-bub.coach');
      await expect(bub).toBeVisible();
      const bb = (await bub.boundingBox())!, vw = page.viewportSize()!.width;
      expect(bb.x).toBeGreaterThanOrEqual(0); expect(bb.x + bb.width).toBeLessThanOrEqual(vw + 0.5);
      if (lang === 'en') expect(CJK.test((await bub.innerText()).replace(/中/g, ''))).toBe(false);
      await page.locator('.ob-bub.coach [data-ob="coach-next"]').click();
    }
    await expect(page.locator('.ob-bub')).toHaveCount(0);
    expect(await page.evaluate(() => [localStorage.getItem('aiexp.v2.onb'), localStorage.getItem('aiexp.v2.coach'), localStorage.getItem('aiexp.v2.visited')])).toEqual(['1', '1', null]);
    expect(await evs(page)).toEqual(expect.arrayContaining(['onb-show', 'onb-btns', 'coach-done']));
  });
  test(`${lang} R27 home strip: × dismisses it for good (reload), the menu brings it back; a returning visitor never sees it`, async ({ page }) => {
    await home(page);
    await page.locator('.ob-hw [data-ob="onb-x"]').click();
    await expect(page.locator('.ob-hw')).toHaveCount(0);
    await expect(page.locator('.ob-bub.coach')).toHaveCount(0);
    await page.goto('about:blank'); await home(page); await page.waitForTimeout(600);
    await expect(page.locator('.ob-wel, .ob-tl, .ob-bub.coach')).toHaveCount(0);
    await page.locator('#mMenu').click();
    await page.locator('#obDw').click();
    await expect(page.locator(`${act} .ob-hw`)).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('aiexp.v2.visited'))).toBeNull(); /* home is never counted */
  });
  test(`${lang} R27 home strip: a doorway tap closes it and brings the coach marks on the zone`, async ({ page }) => {
    await home(page);
    await expect(page.locator('.ob-hw')).toBeVisible({ timeout: 5000 });
    await page.locator(`${act} .hm-door [data-go="Job"]`).click();
    await page.locator(`html[data-si-ready="Job.${lang}"]`).waitFor({ state: 'attached' });
    await expect(page.locator('.ob-bub.coach')).toBeVisible({ timeout: 3000 });
    expect(await evs(page)).toEqual(expect.arrayContaining(['onb-show', 'onb-door']));
    expect(await page.evaluate(() => localStorage.getItem('aiexp.v2.onb'))).toBe('1');
    await page.goto('about:blank'); await home(page); await page.waitForTimeout(600);
    await expect(page.locator('.ob-hw')).toHaveCount(0);
  });
  test(`${lang} first visit: welcome card on top, header labels, coach marks once, then never again`, async ({ page }) => {
    // R27: the bare URL is the home page (its own welcome); a first visit straight onto a stop gets the welcome card
    await at(page, q + '#T1', 'T1', lang);
    const w = page.locator(`${act} .ob-wel`);
    await expect(w).toBeVisible();
    await expect(w).toBeInViewport();
    // above the page head, and the first screen shows title + 3 steps + the tour button
    expect(await page.evaluate((a) => { const s = document.querySelector(a)!; return s.querySelector('.ob-wel')!.compareDocumentPosition(s.querySelector('.pagehead')!) & 4; }, act)).toBeTruthy();
    await expect(w.locator('.ob-steps li')).toHaveCount(3);
    await expect(page.locator('[data-ob="onb-tour"]')).toBeInViewport();
    // header text labels: one per visible icon, inside the screen, none overlapping
    await expect(page.locator('.ob-tl span:not([hidden])')).toHaveCount(6);
    expect(await clean(page, '.ob-tl span:not([hidden])')).toEqual([]);
    // and at least 4 px apart, so neighbouring words do not read as one ("ShareChinese")
    expect(await page.evaluate(() => { const r = [...document.querySelectorAll('.ob-tl span:not([hidden])')].map((e) => e.getBoundingClientRect()).sort((a, b) => a.left - b.left); return Math.min(...r.slice(1).map((q, i) => q.left - r[i]!.right)); })).toBeGreaterThanOrEqual(4);
    expect(await clean(page, `${act} .ob-wel .ob-b, ${act} .ob-wel .ob-x`)).toEqual([]);
    if (lang === 'en') expect(CJK.test((await w.innerText()) + (await page.locator('.ob-tl').innerText()))).toBe(false);
    // full route → coach marks: menu, prev/next, find/share/lang, signpost, the bottom bar (R22); each bubble inside the screen
    // R27: the doorways moved to the home page, so the card offers the two routes again
    await expect(w.locator('.ob-rr')).toHaveCount(1);
    await expect(w.locator('.m-door')).toHaveCount(0);
    await w.locator('[data-ob="onb-all"]').click();
    await expect(w).toHaveCount(0);
    for (let i = 0; i < 5; i++) {
      const b = page.locator('.ob-bub.coach');
      await expect(b).toBeVisible();
      expect(await clean(page, '.ob-bub')).toEqual([]);
      // the bubble sits below the whole top bar: it never covers the text labels under the icons
      expect(await clean(page, '.ob-bub, .ob-tl span:not([hidden])')).toEqual([]);
      expect(await page.locator('.ob-hl').count()).toBeGreaterThan(0);
      if (lang === 'en') expect(CJK.test((await b.innerText()).replace(/中/g, ''))).toBe(false);
      await page.locator('[data-ob="coach-next"]').click();
    }
    await expect(page.locator('.ob-bub.coach')).toHaveCount(0);
    // a one-time tip may follow the coach marks; only a tip may still mark a target
    await expect.poll(() => page.evaluate(() => document.querySelectorAll('.ob-hl').length - (document.querySelector('.ob-bub.tip') ? 1 : 0))).toBeLessThanOrEqual(0);
    expect(await evs(page)).toEqual(expect.arrayContaining(['onb-show', 'onb-all', 'coach-done']));
    expect(await page.evaluate(() => [localStorage.getItem('aiexp.v2.onb'), localStorage.getItem('aiexp.v2.coach'), localStorage.getItem('aiexp.v2.route')])).toEqual(['1', '1', 'all']);
    // never again, not even on reload; labels gone too once you are not on a first visit
    await page.goto('about:blank'); /* a real reload, not a hash change */
    await at(page, q + '#T1', 'T1', lang);
    await page.waitForTimeout(400);
    await expect(page.locator('.ob-wel')).toHaveCount(0);
    await expect(page.locator('.ob-bub.coach')).toHaveCount(0);
    await expect(page.locator('.ob-tl')).toHaveCount(0);
  });

  test(`${lang} welcome: × closes and skips coach marks can be skipped; menu brings the card back`, async ({ page }) => {
    await at(page, q + '#T1', 'T1', lang);
    await page.locator('[data-ob="onb-x"]').click();
    await expect(page.locator('.ob-wel')).toHaveCount(0);
    await expect(page.locator('.ob-bub.coach')).toBeVisible();
    await page.locator('[data-ob="coach-skip"]').click();
    await expect(page.locator('.ob-bub')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('aiexp.v2.coach'))).toBe('1');
    // menu: the first entry is the welcome card
    await page.locator('#mMenu').click();
    const e = page.locator('#obDw');
    await expect(e).toBeVisible();
    expect(await page.evaluate(() => document.getElementById('obDw')!.previousElementSibling?.classList.contains('dw-head'))).toBe(true);
    await e.click();
    await expect(page.locator(`${act} .ob-wel`)).toBeVisible();
    await expect(page.locator(`${act} .ob-wel`)).toBeInViewport();
    // 👀 replays the coach marks even though they were seen
    await page.locator('[data-ob="onb-btns"]').click();
    await expect(page.locator('.ob-bub.coach')).toBeVisible();
    expect(await evs(page)).toEqual(expect.arrayContaining(['onb-x', 'coach-skip', 'onb-reopen', 'onb-btns']));
  });

  test(`${lang} welcome: the big button starts the 15-step tour; coach marks follow when it ends`, async ({ page }) => {
    await at(page, q + '#T1', 'T1', lang);
    await page.locator('[data-ob="onb-tour"]').click();
    await expect(page.locator('#tour')).toBeVisible();
    await expect(page.locator('.ob-wel')).toHaveCount(0);
    await expect(page.locator('.ob-bub')).toHaveCount(0);
    await page.locator('#tourX').click();
    await expect(page.locator('#tour')).toHaveCount(0);
    await expect(page.locator('.ob-bub.coach')).toBeVisible({ timeout: 3000 });
  });

  test(`${lang} kids' route: 6 stops, route chip k/6, its lab, next stop on the route, after-quiz line`, async ({ page }) => {
    await at(page, q + '#T1', 'T1', lang);
    // the welcome card's 🧒 button picks the kids' route (it starts on T1, so we stay here)
    await page.locator(`${act} .ob-wel [data-ob="onb-kid"]`).click();
    await expect(page.locator(`${act} .ob-wel`)).toHaveCount(0);
    await expect(page.locator(`${act} .m-door`)).toHaveCount(0);
    await page.locator('[data-ob="coach-skip"]').click();
    const row = page.locator(`${act} .ob-row`);
    await expect(row.locator('[data-ob="route"]')).toContainText(lang === 'zh' ? '路线 1/6' : '1/6');
    expect(await clean(page, `${act} .ob-row .ob-c`)).toEqual([]);
    // the row sits under the page head, above the 🧒 opening; the next-stop link right after the opening
    expect(await page.evaluate((a) => { const s = document.querySelector(a)!; const ph = s.querySelector('.pagehead')!, r = s.querySelector('.ob-row')!, pl = s.querySelector('.pl-top')!, n = s.querySelector('.ob-n1')!;
      return ph.nextElementSibling === r && !!(r.compareDocumentPosition(pl) & 4) && pl.nextElementSibling === n; }, act)).toBe(true);
    await row.locator('[data-ob="route"]').click();
    await expect(page.locator('#obRp li')).toHaveCount(6);
    await expect(page.locator('#obRp li.on')).toHaveCount(1);
    if (lang === 'en') expect(CJK.test(await page.locator('#obRp').innerText())).toBe(false);
    // the lab chip opens the T1 demo
    await row.locator('[data-ob="lab"]').click();
    await expect(page.locator('#walkCard')).toBeInViewport({ ratio: 0.05 });
    // next on the route: T2, 2/6, its chip names the agent lab
    await page.locator(`${act} .ob-n1 [data-ob="next"]`).click();
    await page.locator(`html[data-si-ready="T2.${lang}"]`).waitFor({ state: 'attached' });
    await expect(page.locator(`${act} [data-ob="route"]`)).toContainText('2/6');
    await page.locator(`${act} [data-ob="lab"]`).click();
    await expect(page.locator('#labAgent')).toBeInViewport({ ratio: 0.05 });
    // quiz → "lit" count goes up, the after-quiz line points at T3 on the route
    await answer(page, 'T2');
    await expect(page.locator(`${act} [data-ob="lit"]`)).toContainText('1/27');
    const qn = page.locator(`${act} .ob-qn [data-ob="qnext"]`);
    await expect(qn).toBeVisible();
    await qn.click();
    await page.locator(`html[data-si-ready="T3.${lang}"]`).waitFor({ state: 'attached' });
    await expect(page.locator(`${act} [data-ob="route"]`)).toContainText('3/6');
    // off the route: "back to the route" leads to the first stop not lit yet
    await page.goto(`${q}#K1`);
    await page.locator(`html[data-si-ready="K1.${lang}"]`).waitFor({ state: 'attached' });
    await page.locator(`${act} [data-ob="route-back"]`).click();
    await page.locator(`html[data-si-ready="T1.${lang}"]`).waitFor({ state: 'attached' });
  });
}

test('full route: lab chip says how many labs, opens and starts the first; lit chip opens the progress card; tips once', async ({ page }) => {
  await page.addInitScript(() => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', '1'); localStorage.setItem('aiexp.v2.onb', '1'); localStorage.setItem('aiexp.v2.coach', '1'); } });
  await at(page, '#T3', 'T3', 'zh');
  // tips: the first of ⤵ badge / 🔒 / dot strip that comes into view gets a one-time bubble
  await page.locator(`${act} .dd-b`).first().scrollIntoViewIfNeeded();
  const tb = page.locator('.ob-bub.tip');
  await expect(tb).toBeVisible({ timeout: 4000 });
  expect(await clean(page, '.ob-bub')).toEqual([]);
  await page.locator('[data-ob="tip-x"]').click();
  await expect(tb).toHaveCount(0);
  const seen = await page.evaluate(() => JSON.parse(localStorage.getItem('aiexp.v2.obtips') || '[]') as string[]);
  expect(seen.length).toBe(1);
  await page.evaluate(() => window.scrollTo(0, 0));
  const n = await page.locator(`${act} .card.lab[id]`).count();
  const lab = page.locator(`${act} [data-ob="lab"]`);
  await expect(lab).toContainText(n === 1 ? '1 个实验' : `${n} 个实验`);
  const id = await page.locator(`${act} .card.lab[id]`).first().getAttribute('id');
  await lab.click();
  await expect(page.locator('#' + id)).toBeInViewport({ ratio: 0.05 });
  await expect(page.locator(`${act} [data-ob="next"]`)).toContainText('神经网络');
  await page.locator(`${act} [data-ob="lit"]`).click();
  await expect(page.locator('#cardPanel')).toBeVisible();
});

test('R27 returning visitor on the home page: no strip, labels or coach marks', async ({ page }) => {
  await page.addInitScript(() => { if (location.search.includes('ret')) localStorage.setItem('aiexp.v2.visited', '["T2"]'); });
  await page.goto('./?ret=1');
  await page.locator('html[data-si-ready="H.zh"]').waitFor({ state: 'attached', timeout: 15_000 });
  await page.waitForTimeout(800);
  await expect(page.locator('.ob-wel, .ob-tl, .ob-bub.coach')).toHaveCount(0);
});
test('R27 old hash link on a fresh profile: the stop gets the R21 welcome card, not the home strip', async ({ page }) => {
  await at(page, '#T4a', 'T4a', 'zh');
  await expect(page.locator(`${act} .ob-wel`)).toBeVisible();
  await expect(page.locator('.ob-hw')).toHaveCount(0);
});

test('nothing new on a returning visit: no welcome card, labels or coach marks', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('aiexp.v2.visited', '["T1","T2","T3"]'); });
  await at(page, '#T2', 'T2', 'zh');
  await page.waitForTimeout(500);
  await expect(page.locator('.ob-wel, .ob-tl, .ob-bub.coach')).toHaveCount(0);
  await expect(page.locator(`${act} [data-ob="next"]`)).toBeVisible();
});
