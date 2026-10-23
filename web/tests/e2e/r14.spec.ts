/* R14: labChin (T7, right after the scaling-laws card) and labBpe (T3, right after the tokenizer lab) compute exact
   values, react to every control, fit the phone (360/390/430 via the projects), have no CJK in English, are one tap
   from T1's hand-off block and are found by the search box. Expected values come from src/m2/zmath.ts (unit-tested
   against the papers' numbers). */
import { test, expect, type Page } from '@playwright/test';
import { big, chinLoss, chinOpt } from '../../src/m2/zmath';

type Lang = 'zh' | 'en';
type SI = { __si: { state(): { station: string } } };
async function open(page: Page, S: string, lang: Lang) {
  await page.goto(`./?lang=${lang}#${S}`);
  await page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached' });
  await expect(page.locator('section.level.active .pagehead')).toBeVisible();
}
const station = (page: Page) => page.evaluate(() => (window as unknown as SI).__si.state().station);
const set = (page: Page, id: string, v: string) => page.locator(`#${id}`).evaluate((e, v) => { (e as HTMLInputElement).value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, v);
const k = (page: Page, out: string, key: string) => page.locator(`#${out} [data-k="${key}"]`);
const inView = (page: Page, id: string) => page.evaluate((id) => { const r = document.getElementById(id)!.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }, id);
const n4 = (x: number, d: number) => Number(x.toFixed(d)).toString().replace('-', '−');
async function fits(page: Page, id: string, lang: Lang) {
  const r = await page.evaluate((id) => {
    const el = document.getElementById(id)!, b = el.getBoundingClientRect(), wide: string[] = [];
    el.querySelectorAll<HTMLElement>('*').forEach((e) => { const q = e.getBoundingClientRect(); if (q.width && (q.right > b.right + 1 || q.left < b.left - 1)) wide.push(e.tagName + '.' + e.className); });
    const re = /[\u3400-\u9fff]/, cjk: string[] = [], tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) if (re.test(n.nodeValue ?? '')) cjk.push((n.nodeValue ?? '').trim().slice(0, 30));
    return { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, wide, cjk, w: b.width };
  }, id);
  expect(r.sw).toBeLessThanOrEqual(r.cw);
  expect(r.wide).toEqual([]);
  if (lang === 'en') expect(r.cjk).toEqual([]);
  expect(r.w).toBeLessThanOrEqual(r.cw);
}
function watch(page: Page) {
  const errors: string[] = [], external: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => { const u = new URL(r.url()); if (!['localhost', '127.0.0.1'].includes(u.hostname) && u.protocol !== 'data:') external.push(r.url()); });
  return { errors, external };
}

for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang} T7 labChin: exact compute-optimal N, D and loss; Gopher budget; off-optimum penalty; fits the phone`, async ({ page }) => {
    const w = watch(page);
    await open(page, 'T7', lang);
    const order = await page.evaluate(() => [...document.querySelectorAll('section#T7 .card[id]')].map((e) => e.id));
    expect(order[order.indexOf('xScale') + 1]).toBe('labChin');
    await page.locator('#labChin').scrollIntoViewIfNeeded();
    await expect(k(page, 'chOut', 'n')).toBeVisible();
    await expect(page.locator('#labChin .tag-note').first()).toContainText(lang === 'en' ? 'not a measurement of any product' : '不是对任何产品或模型的实测');
    /* default slider: C = 10^23.8 */
    const o0 = chinOpt(10 ** 23.8);
    await expect(k(page, 'chOut', 'n')).toHaveText(big(o0.N, lang));
    await expect(k(page, 'chOut', 'l')).toHaveText(n4(o0.L, 3));
    /* the Gopher budget: ≈ 32.2 B parameters, ≈ 2.98 T tokens, L ≈ 1.931 */
    await page.locator('#chG').click();
    await expect(k(page, 'chOut', 'n')).toHaveText(lang === 'en' ? '32.2 B' : '322 亿');
    await expect(k(page, 'chOut', 'd')).toHaveText(lang === 'en' ? '2.98 T' : '2.98 万亿');
    await expect(k(page, 'chOut', 'r')).toHaveText('92.6');
    await expect(k(page, 'chOut', 'l')).toHaveText('1.931');
    await expect(k(page, 'chOut', 'a')).toHaveText('0.452');
    await expect(k(page, 'chOut', 'b')).toHaveText('0.548');
    await expect(k(page, 'chOut', 'c')).toHaveText('5.76×1023');
    /* k = −4 keeps the Gopher budget: 1/16 of the optimum, 16× the tokens, a higher loss */
    await set(page, 'chK', '-4');
    const g = chinOpt(5.76e23), N = g.N / 16, D = 5.76e23 / (6 * N);
    await expect(k(page, 'chOut', 'c')).toHaveText('5.76×1023');
    await expect(k(page, 'chOut', 'yn')).toHaveText(big(N, lang));
    await expect(k(page, 'chOut', 'yd')).toHaveText(big(D, lang));
    await expect(k(page, 'chOut', 'yl')).toHaveText(n4(chinLoss(N, D), 3));
    await expect(k(page, 'chOut', 'dl')).toHaveText(n4(chinLoss(N, D) - g.L, 4));
    await set(page, 'chK', '3');
    await expect(k(page, 'chOut', 'dl')).toHaveText(n4(chinLoss(g.N * 8, 5.76e23 / (6 * g.N * 8)) - g.L, 4));
    /* moving the budget slider leaves the exact Gopher value: C = 1e21 → ≈ 1.82 B, L ≈ 2.329 */
    await set(page, 'chK', '0'); await set(page, 'chC', '21');
    await expect(k(page, 'chOut', 'n')).toHaveText(lang === 'en' ? '1.82 B' : '18.2 亿');
    await expect(k(page, 'chOut', 'l')).toHaveText('2.329');
    await expect(k(page, 'chOut', 'dl')).toHaveText('0');
    await expect(page.locator('#chCv')).toHaveText('21');
    await expect(page.locator('#chOut svg.x-fig circle')).toHaveCount(2);
    await fits(page, 'labChin', lang);
    expect(w.errors).toEqual([]); expect(w.external).toEqual([]);
  });

  test(`${lang} T3 labBpe: the paper's 10 merges step by step, vocabulary growth, typed words; fits the phone`, async ({ page }) => {
    const w = watch(page);
    await open(page, 'T3', lang);
    const order = await page.evaluate(() => [...document.querySelectorAll('section#T3 .card[id]')].map((e) => e.id));
    expect(order[order.indexOf('labTok') + 1]).toBe('labBpe');
    await page.locator('#labBpe').scrollIntoViewIfNeeded();
    await expect(k(page, 'bpOut', 'vsize')).toHaveText('11');
    await expect(k(page, 'bpOut', 'next')).toHaveText('e + s → es');
    await expect(page.locator('#bpOut tr.on td.n')).toHaveText('9');
    await expect(k(page, 'bpOut', 'tok').locator('.bp-t')).toHaveText(['l', 'o', 'w', 'e', 's', 't', '_']);
    await expect(page.locator('#bpPrev')).toBeDisabled();
    const want = [['e + s → es', '9'], ['es + t → est', '9'], ['est + _ → est_', '9'], ['l + o → lo', '7'], ['lo + w → low', '7'], ['n + e → ne', '6'], ['ne + w → new', '6'], ['new + est_ → newest_', '6'], ['low + _ → low_', '5'], ['w + i → wi', '3']];
    for (let i = 0; i < 10; i++) {
      await expect(k(page, 'bpOut', 'next')).toHaveText(want[i]![0]!);
      await expect(page.locator('#bpOut tr.on td.n')).toHaveText(want[i]![1]!);
      await page.locator('#bpNext').click();
      await expect(page.locator('#bpKv')).toHaveText(String(i + 1));
      await expect(k(page, 'bpOut', 'vsize')).toHaveText(String(12 + i));
    }
    await expect(page.locator('#bpNext')).toBeDisabled();
    await expect(k(page, 'bpOut', 'merges')).toContainText('10. w+i');
    await expect(page.locator('#bpOut tr.on')).toHaveCount(0);
    await expect(k(page, 'bpOut', 'tok').locator('.bp-t')).toHaveText(['low', 'est_']);
    await expect(k(page, 'bpOut', 'ntok')).toHaveText('2');
    await expect(page.locator('#bpOut table').first().locator('tr').nth(2)).toContainText('newest_');
    await page.locator('#bpW').fill('Quiz!');
    await expect(k(page, 'bpOut', 'tok').locator('.bp-t')).toHaveText(['q', 'u', 'i', 'z', '_']);
    await expect(k(page, 'bpOut', 'tok').locator('.bp-t.unk')).toHaveCount(3);
    await page.locator('#bpW').fill('lowest'); await set(page, 'bpK', '3');
    await expect(k(page, 'bpOut', 'tok').locator('.bp-t')).toHaveText(['l', 'o', 'w', 'est_']);
    await page.locator('#bpPrev').click();
    await expect(k(page, 'bpOut', 'tok').locator('.bp-t')).toHaveText(['l', 'o', 'w', 'est', '_']);
    await fits(page, 'labBpe', lang);
    expect(w.errors).toEqual([]); expect(w.external).toEqual([]);
  });

  test(`${lang}: T1's hand-off block jumps straight to both labs`, async ({ page }) => {
    for (const [S, id] of [['T7', 'labChin'], ['T3', 'labBpe']] as const) {
      await open(page, 'T1', lang);
      const b = page.locator(`section#T1 nav.m-hand [data-sj="${id}"][data-sp="${S}"]`);
      await expect(b).toHaveCount(1);
      await b.scrollIntoViewIfNeeded(); await b.click();
      await page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached' });
      expect(await station(page)).toBe(S);
      await expect.poll(() => inView(page, id)).toBe(true);
    }
  });

  test(`${lang}: search finds both labs and goes there`, async ({ page }) => {
    for (const [q, S, id] of [['Chinchilla', 'T7', 'labChin'], ['BPE', 'T3', 'labBpe']] as const) {
      await open(page, 'T1', lang);
      if (!(await page.locator('#search').isVisible())) await page.locator('#mSearch').click();
      await page.locator('#search').fill(q);
      const hit = page.locator(`#searchRes [data-kind="l"][data-id="${id}"]`);
      await expect(hit).toHaveCount(1);
      await hit.click();
      await page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached' });
      await expect.poll(() => inView(page, id)).toBe(true);
    }
  });
}
