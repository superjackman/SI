/* M4–M6 extension cards on legacy stations: each card renders once in both languages at 360/390/430, sits in the page
   map and outline before the labs, its part popup opens, drill buttons route, the labs compute exact values, the quiz
   key covers the new question, no CJK leaks into English, no overflow, no console errors, no external requests. */
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Lang = 'zh' | 'en';
type SI = { __si: { state(): { station: string; popup: { id: string } | null } } };
const KEY = (JSON.parse(readFileSync(new URL('../../src/legacy/gen/qkey.json', import.meta.url), 'utf8')) as { key: Record<string, number[]> }).key;
const X: Record<string, { cards: string[]; parts: string[]; labs: string[]; dd?: [string, string] }> = {
  T2: { cards: ['xStruct', 'xRerank'], parts: ['xstruct', 'xrerank'], labs: [] },
  T3: { cards: ['xReason', 'xHalluc', 'xIcl'], parts: ['xreason', 'xhalluc', 'xicl'], labs: ['labVote'], dd: ['xReason', 'T7'] },
  T7: { cards: ['xPar', 'xData', 'xAgentRl', 'xSafety', 'xEval', 'xScale', 'xReg'], parts: ['xpar', 'xdata', 'xagentrl', 'xsafety', 'xeval', 'xscale', 'xreg'], labs: [], dd: ['xAgentRl', 'T2'] },
  T6: { cards: ['xVoice', 'xDoc', 'xEdit'], parts: ['xvoice', 'xdoc', 'xedit'], labs: [] },
  T1: { cards: ['xComply'], parts: ['xcomply'], labs: [] },
};

async function open(page: Page, S: string, lang: Lang) {
  await page.goto(`./?lang=${lang}#${S}`);
  await page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached' });
  await expect(page.locator('section.level.active .pagehead')).toBeVisible();
}
async function reveal(page: Page, sel: string) {
  for (let i = 0; i < 4; i++) {
    const cardId = await page.evaluate((sel) => {
      const c = document.querySelector(sel)?.closest('.cc-closed') as HTMLElement | null; if (!c) return null;
      if (!c.id) c.id = 'tmp-cc-' + Math.random().toString(36).slice(2); return c.id;
    }, sel);
    if (!cardId) break;
    await page.locator(`#${cardId} > h2 > .cc-h, #${cardId} > h3 > .cc-h`).first().click();
  }
  await page.locator(sel).scrollIntoViewIfNeeded();
}
const popup = (page: Page) => page.evaluate(() => (window as unknown as SI).__si.state().popup?.id ?? null);

for (const [S, x] of Object.entries(X)) for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang} ${S}: extension cards and labs render, order, popups, quiz, fit the phone`, async ({ page }) => {
    const errors: string[] = [], external: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('request', (r) => { const u = new URL(r.url()); if (!['localhost', '127.0.0.1'].includes(u.hostname) && u.protocol !== 'data:') external.push(r.url()); });
    await open(page, S, lang);
    const sec = page.locator(`section#${S}`);
    await expect(sec.locator('.st-fail')).toHaveCount(0);
    for (const id of [...x.cards, ...x.labs]) {
      await expect(sec.locator(`#${id}`)).toHaveCount(1);
      await expect(sec.locator(`.ph-map button[data-sj="${id}"]`)).toHaveCount(1);
    }
    /* order: extension cards after the legacy cards and before the lab divider; extension labs right before the quiz */
    const order = await page.evaluate((S) => [...document.querySelectorAll(`section#${S} .card[id], section#${S} .lab-divider`)].map((e) => e.id || 'DIV'), S);
    const quiz = order.indexOf(`quiz${S}`), div = order.includes('DIV') ? order.indexOf('DIV') : quiz; /* T1 has no labs */
    for (const id of x.cards) expect(order.indexOf(id)).toBeLessThan(div);
    x.cards.forEach((id, i) => { if (i) expect(order.indexOf(id)).toBe(order.indexOf(x.cards[i - 1]!) + 1); });
    for (const id of x.labs) { expect(order.indexOf(id)).toBeGreaterThan(div); expect(order.indexOf(id)).toBeLessThan(quiz); }
    /* each card has a source line with https links that open in a new tab */
    for (const id of x.cards) {
      await reveal(page, `#${id} .k-src`);
      const bad = await page.evaluate((id) => [...document.querySelectorAll<HTMLAnchorElement>(`#${id} a[href^="http"]`)].filter((a) => a.target !== '_blank' || !a.rel.includes('noopener') || !a.href.startsWith('https://')).map((a) => a.href), id);
      expect(bad).toEqual([]);
      expect(await page.locator(`#${id} .k-src a`).count()).toBeGreaterThan(0);
    }
    /* popups for every new part */
    for (const id of x.parts) {
      await reveal(page, `section#${S} [data-open="${id}"]`);
      await page.locator(`section#${S} [data-open="${id}"]`).first().click();
      await expect.poll(() => popup(page)).toBe(id);
      /* the title text never runs under the close button */
      await expect(page.locator('#modalBox .m-head h3')).toBeVisible();
      await expect(page.locator('#modalBox .m-head .close')).toBeVisible();
      const hit = await page.evaluate(() => {
        const h = document.querySelector('#modalBox .m-head h3')!, c = document.querySelector('#modalBox .m-head .close')!.getBoundingClientRect();
        const r = document.createRange(); r.selectNodeContents(h);
        return [...r.getClientRects()].some((t) => t.right > c.left && t.left < c.right && t.bottom > c.top && t.top < c.bottom);
      });
      expect(hit).toBe(false);
      await page.keyboard.press('Escape');
      await expect.poll(() => popup(page)).toBe(null);
    }
    if (lang === 'en') {
      const cjk = await page.evaluate((ids) => {
        const re = /[\u3400-\u9fff]/, out: string[] = [];
        for (const id of ids) {
          const tw = document.createTreeWalker(document.getElementById(id)!, NodeFilter.SHOW_TEXT);
          for (let n = tw.nextNode(); n; n = tw.nextNode()) if (re.test(n.nodeValue ?? '')) out.push(id + ': ' + (n.nodeValue ?? '').trim().slice(0, 40));
        }
        return out;
      }, [...x.cards, ...x.labs]);
      expect(cjk).toEqual([]);
    }
    /* quiz: the whole key, including the extension question */
    await reveal(page, `#quiz${S}`);
    const key = KEY[S]!;
    for (let i = 0; i < key.length; i++) await page.locator(`#quiz${S} .opt[data-q="${S}.${i}"][data-o="${key[i]}"]`).click();
    await expect(page.locator(`#quiz${S} .qsum`)).toContainText(lang === 'en' ? `answered ${key.length} , correct ${key.length}` : `已答 ${key.length}`);
    await page.waitForTimeout(300);
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(o.sw).toBeLessThanOrEqual(o.cw);
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
  });
}

test('T3 labVote: exact majority-vote numbers, verdict flips at p = 0.5, and the legacy T3 labs still run', async ({ page }) => {
  await open(page, 'T3', 'en');
  await reveal(page, '#labVote #voOut');
  const set = (id: string, v: string) => page.locator(`#${id}`).evaluate((e, v) => { (e as HTMLInputElement).value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  await set('voP', '0.6'); await set('voN', '3'); await set('voL', '800');
  await expect(page.locator('#voOut [data-k="acc"]')).toHaveText('0.648');
  await expect(page.locator('#voOut [data-k="tok"]')).toHaveText('2,400');
  await expect(page.locator('#voNv')).toHaveText('3');
  await set('voP', '0.7'); await set('voN', '5');
  await expect(page.locator('#voOut [data-k="acc"]')).toHaveText('0.837');
  await set('voP', '0.4');
  await expect(page.locator('#voOut [data-k="verdict"]')).toContainText('amplifies');
  await set('voP', '0.5');
  await expect(page.locator('#voOut [data-k="acc"]')).toHaveText('0.5');
  /* the island labs on the same station still mount (merged loader) */
  await reveal(page, '#labNext');
  await expect.poll(() => page.locator('#labNext').innerText().then((s) => s.length)).toBeGreaterThan(40);
});

for (const [S, x] of Object.entries(X)) if (x.dd) test(`${S}: the drill button in ${x.dd[0]} goes to ${x.dd[1]}`, async ({ page }) => {
  await open(page, S, 'zh');
  const b = page.locator(`#${x.dd![0]} .m-ddrow [data-ddgo="${x.dd![1]}"]`);
  await reveal(page, `#${x.dd![0]} .m-ddrow`);
  await b.click();
  await page.locator(`html[data-si-ready="${x.dd![1]}.zh"]`).waitFor({ state: 'attached' });
  expect(await page.evaluate(() => (window as unknown as SI).__si.state().station)).toBe(x.dd![1]);
});

for (const lang of ['zh', 'en'] as Lang[]) test(`${lang} T7 xPar diagram: every label sits inside its box and the svg, and no two labels overlap`, async ({ page }) => {
  await open(page, 'T7', lang);
  await reveal(page, '#xPar svg.x-dia');
  const r = await page.evaluate(() => {
    const svg = document.querySelector('#xPar svg.x-dia') as SVGSVGElement, sb = svg.getBoundingClientRect(), out: string[] = [];
    const texts = [...svg.querySelectorAll('text')], boxes = texts.map((t) => t.getBoundingClientRect());
    texts.forEach((t, i) => {
      const b = boxes[i]!, s = t.textContent ?? '';
      if (b.left < sb.left - 0.5 || b.right > sb.right + 0.5 || b.top < sb.top - 0.5 || b.bottom > sb.bottom + 0.5) out.push('svg:' + s);
      const rect = t.parentElement?.classList.contains('xg') ? t.parentElement.querySelector('rect')!.getBoundingClientRect() : null;
      if (rect && (b.left < rect.left + 1 || b.right > rect.right - 1 || b.top < rect.top || b.bottom > rect.bottom)) out.push('box:' + s);
      for (let j = 0; j < i; j++) { const c = boxes[j]!; if (b.left < c.right - 0.5 && b.right > c.left + 0.5 && b.top < c.bottom - 0.5 && b.bottom > c.top + 0.5) out.push('overlap:' + s + '|' + (texts[j]!.textContent ?? '')); }
    });
    return { out, n: texts.length, w: sb.width };
  });
  expect(r.n).toBe(4 * (1 + 4 * 2 + 1));
  expect(r.w).toBeGreaterThan(250);
  expect(r.out).toEqual([]);
});
