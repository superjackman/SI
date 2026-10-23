/* R11: the hand-off block ends every station (go deeper / one level up / labs / concepts), its buttons route and fit the
   phone; the search box finds stations, cards and labs and takes you there; the seven M8 labs compute exact values. */
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Lang = 'zh' | 'en';
type SI = { __si: { state(): { station: string; popup: { id: string } | null } } };
const KB = JSON.parse(readFileSync(new URL('../../src/legacy/gen/kb.json', import.meta.url), 'utf8')) as { TABORDER: string[] };

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
const station = (page: Page) => page.evaluate(() => (window as unknown as SI).__si.state().station);
const set = (page: Page, id: string, v: string) => page.locator(`#${id}`).evaluate((e, v) => { (e as HTMLInputElement).value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, v);
const k = (page: Page, out: string, key: string) => page.locator(`#${out} [data-k="${key}"]`);
const inView = (page: Page, id: string) => page.evaluate((id) => { const r = document.getElementById(id)!.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }, id);

for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang}: every station ends with a hand-off block that fits the phone, with no CJK in English`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    for (const S of KB.TABORDER) {
      await open(page, S, lang);
      const h = page.locator(`section#${S} nav.m-hand`);
      await expect(h, S).toHaveCount(1);
      await h.scrollIntoViewIfNeeded();
      await expect(h).toBeVisible();
      const bad = await page.evaluate((S) => {
        const cw = document.documentElement.clientWidth, out: string[] = [];
        for (const b of document.querySelectorAll<HTMLElement>(`section#${S} nav.m-hand button, section#${S} nav.m-hand p`)) { const r = b.getBoundingClientRect(); if (r.right > cw + 0.5 || r.left < -0.5 || b.scrollWidth > b.clientWidth + 1) out.push(S + ': ' + (b.textContent ?? '').slice(0, 30)); }
        return out;
      }, S);
      expect(bad).toEqual([]);
      if (lang === 'en') expect(/[\u3400-\u9fff]/.test(await h.innerText()), S).toBe(false);
      const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(o, S).toBeLessThanOrEqual(0);
    }
    expect(errors).toEqual([]);
  });

  test(`${lang}: following "go deeper" from T1 walks the guided path to K5, and "one level up" goes back`, async ({ page }) => {
    await open(page, 'T1', lang);
    const seen: string[] = ['T1'];
    for (let i = 0; i < 40; i++) {
      const S = await station(page);
      const nx = await page.evaluate((S) => [...document.querySelectorAll<HTMLElement>(`section#${S} nav.m-hand .mh-b.dn`)].map((b) => b.dataset.go ?? ''), S);
      const pick = nx.find((x) => !seen.includes(x)); if (!pick) break;
      const b = page.locator(`section#${S} nav.m-hand .mh-b.dn[data-go="${pick}"]`);
      await b.scrollIntoViewIfNeeded(); await b.click();
      await page.locator(`html[data-si-ready="${pick}.${lang}"]`).waitFor({ state: 'attached' });
      seen.push(pick);
    }
    expect(seen).toContain('K5');
    expect(seen.length).toBeGreaterThanOrEqual(10);
    await expect(page.locator('section#K5 nav.m-hand .mh-end')).toHaveCount(1);
    const up = page.locator('section#K5 nav.m-hand .mh-b.up').first();
    const to = await up.getAttribute('data-go');
    await up.scrollIntoViewIfNeeded(); await up.click();
    await page.locator(`html[data-si-ready="${to}.${lang}"]`).waitFor({ state: 'attached' });
    expect(await station(page)).toBe(to);
  });
}

test('a lab chip in the hand-off block scrolls to its lab; a concept chip opens its part popup', async ({ page }) => {
  await open(page, 'T7', 'zh');
  const chip = page.locator('section#T7 nav.m-hand [data-sj="labPool"]');
  await chip.scrollIntoViewIfNeeded(); await chip.click();
  await expect.poll(() => inView(page, 'labPool')).toBe(true);
  const c = page.locator('section#T7 nav.m-hand [data-open="kSoft"]');
  await c.scrollIntoViewIfNeeded(); await c.click();
  await expect.poll(() => page.evaluate(() => (window as unknown as SI).__si.state().popup?.id ?? null)).toBe('kSoft');
});

for (const lang of ['zh', 'en'] as Lang[]) test(`${lang}: search finds stations, cards and labs, and picking one goes there`, async ({ page }) => {
  await open(page, 'T1', lang);
  const find = async (q: string) => {
    if (!(await page.locator('#search').isVisible())) await page.locator('#mSearch').click();
    await page.locator('#search').fill(q);
    await expect(page.locator('#searchRes')).toHaveClass(/open/);
  };
  /* a lab on another station */
  await find(lang === 'zh' ? '困惑度' : 'perplexity');
  await expect(page.locator('#searchRes [data-open="xppl"]')).toHaveCount(1);
  const lab = page.locator('#searchRes [data-kind="l"][data-id="labPpl"]');
  await expect(lab).toContainText(lang === 'zh' ? '🧪 实验室 · 大模型' : '🧪 Lab · ');
  await lab.click();
  await page.locator(`html[data-si-ready="T3.${lang}"]`).waitFor({ state: 'attached' });
  await expect.poll(() => inView(page, 'labPpl')).toBe(true);
  /* a station */
  await find(lang === 'zh' ? '多模态' : 'Multimodal');
  await page.locator('#searchRes [data-kind="s"][data-id="T6"]').click();
  await page.locator(`html[data-si-ready="T6.${lang}"]`).waitFor({ state: 'attached' });
  expect(await station(page)).toBe('T6');
  /* a (closed) card on another station */
  await find(lang === 'zh' ? 'RoPE' : 'RoPE');
  const card = page.locator('#searchRes [data-kind="c"][data-id="xRope"]');
  await expect(card).toHaveCount(1);
  await card.click();
  await page.locator(`html[data-si-ready="T4a.${lang}"]`).waitFor({ state: 'attached' });
  await expect.poll(() => inView(page, 'xRope')).toBe(true);
  /* Enter picks the first hit; results never overflow the phone */
  await find(lang === 'zh' ? '小测验' : 'Quiz');
  const o = await page.evaluate(() => { const cw = document.documentElement.clientWidth; return [...document.querySelectorAll('#searchRes > div')].filter((d) => d.getBoundingClientRect().right > cw + 0.5).length; });
  expect(o).toBe(0);
});

test('M8 labs compute exact values (en)', async ({ page }) => {
  await open(page, 'T3', 'en');
  await reveal(page, '#bmOut');
  await expect(k(page, 'bmOut', 'best')).toHaveText('cat runs');
  await expect(k(page, 'bmOut', 'bestp')).toHaveText('0.2');
  await expect(k(page, 'bmOut', 'verdict')).toContainText('too narrow');
  await set(page, 'bmK', '2');
  await expect(k(page, 'bmOut', 'kept1')).toHaveText('cat (0.5), dog (0.4)');
  await expect(k(page, 'bmOut', 'best')).toHaveText('dog barks');
  await expect(k(page, 'bmOut', 'bestp')).toHaveText('0.36');
  await expect(k(page, 'bmOut', 'verdict')).toContainText('Found');
  await expect(page.locator('#bmKv')).toHaveText('2');
  await reveal(page, '#ppOut');
  for (const id of ['pp1', 'pp2', 'pp3', 'pp4']) await set(page, id, '0.5');
  await expect(k(page, 'ppOut', 'nll')).toHaveText('0.6931');
  await expect(k(page, 'ppOut', 'ppl')).toHaveText('2');
  await page.locator('#ppU').click();
  await expect(k(page, 'ppOut', 'ppl')).toHaveText('4');
  await expect(k(page, 'ppOut', 'nll')).toHaveText('1.3863');

  await open(page, 'T4a', 'en');
  await reveal(page, '#rpOut');
  await expect(k(page, 'rpOut', 'a')).toHaveText('−1.3197');
  await expect(k(page, 'rpOut', 'plain')).toHaveText('0.67');
  await set(page, 'rpS', '3');
  await expect(k(page, 'rpOut', 'b')).toHaveText('−1.3197');
  await expect(k(page, 'rpOut', 'd')).toHaveText('3');
  await expect(k(page, 'rpOut', 'eq')).toHaveText('yes');
  await set(page, 'rpM', '2'); await set(page, 'rpN', '5');
  await expect(k(page, 'rpOut', 'a')).toHaveText('−1.519');

  await open(page, 'T5', 'en');
  await reveal(page, '#loOut');
  await expect(k(page, 'loOut', 'full')).toHaveText('16,777,216');
  await expect(k(page, 'loOut', 'lora')).toHaveText('65,536');
  await expect(k(page, 'loOut', 'pct')).toHaveText('0.3906%');
  await page.locator('#loD').selectOption('1024');
  await expect(k(page, 'loOut', 'full')).toHaveText('4,194,304');
  await expect(k(page, 'loOut', 'lora')).toHaveText('40,960');

  await open(page, 'T7', 'en');
  await reveal(page, '#dpOut');
  await set(page, 'dpW', '0'); await set(page, 'dpL', '0');
  await expect(k(page, 'dpOut', 'm')).toHaveText('0');
  await expect(k(page, 'dpOut', 'loss')).toHaveText('0.6931');
  await expect(k(page, 'dpOut', 'w')).toHaveText('0.5');
  await set(page, 'dpW', '1'); await set(page, 'dpB', '1');
  await expect(k(page, 'dpOut', 'm')).toHaveText('1');
  await expect(k(page, 'dpOut', 'loss')).toHaveText('0.3133');
  await expect(k(page, 'dpOut', 'w')).toHaveText('0.2689');
  await reveal(page, '#scOut');
  await set(page, 'scW', '100'); await set(page, 'scT', '50'); await set(page, 'scC', '1');
  await expect(k(page, 'scOut', 'lr')).toHaveText('1.5×10−4');
  await expect(k(page, 'scOut', 'phase')).toContainText('warming');
  await expect(k(page, 'scOut', 'norm')).toHaveText('13');
  await expect(k(page, 'scOut', 'scale')).toHaveText('0.0769');
  await expect(k(page, 'scOut', 'g')).toHaveText('0.231, 0.308, 0.923');
  await set(page, 'scT', '1000');
  await expect(k(page, 'scOut', 'lr')).toHaveText('3×10−5');
  await expect(k(page, 'scOut', 'phase')).toContainText('cosine');
  await set(page, 'scC', '20');
  await expect(k(page, 'scOut', 'scale')).toHaveText('1');
  await reveal(page, '#pkOut');
  await set(page, 'pkN', '10'); await set(page, 'pkC', '3'); await set(page, 'pkK', '5');
  await expect(k(page, 'pkOut', 'pk')).toHaveText('0.9167');
  await expect(k(page, 'pkOut', 'naive')).toHaveText('0.8319');
  await set(page, 'pkK', '8');
  await expect(k(page, 'pkOut', 'pk')).toHaveText('1');
});

test('M8 labs in Chinese: same numbers, Chinese text', async ({ page }) => {
  await open(page, 'T3', 'zh');
  await reveal(page, '#bmOut');
  await set(page, 'bmK', '2');
  await expect(k(page, 'bmOut', 'best')).toHaveText('狗叫');
  await expect(k(page, 'bmOut', 'bestp')).toHaveText('0.36');
  await open(page, 'T5', 'zh');
  await reveal(page, '#loOut');
  await expect(k(page, 'loOut', 'full')).toHaveText('16,777,216');
  await open(page, 'T4a', 'zh');
  await reveal(page, '#rpOut');
  await expect(k(page, 'rpOut', 'eq')).toHaveText('是');
});
