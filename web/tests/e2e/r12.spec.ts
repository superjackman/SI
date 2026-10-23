/* R12: the home page opens with the knowledge map — all layers from "using agents" down to the maths, every station one
   tap away, taps land on the right station, it fits 360/390/430 without overflow or squeezed text, the counts match the
   rendered pages, and visited stations are marked. zh + en. */
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Lang = 'zh' | 'en';
type SI = { __si: { state(): { station: string } } };
const KB = JSON.parse(readFileSync(new URL('../../src/legacy/gen/kb.json', import.meta.url), 'utf8')) as { TABORDER: string[]; TABN: Record<string, { zh: string; en: string }> };
const XS = JSON.parse(readFileSync(new URL('../../src/legacy/gen/search-x.json', import.meta.url), 'utf8')) as string[][];
const LAYERS = 10;
const ready = (page: Page, S: string, lang: Lang) => page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached' });
const station = (page: Page) => page.evaluate(() => (window as unknown as SI).__si.state().station);
async function home(page: Page, lang: Lang) { await page.goto(`./?lang=${lang}`); await ready(page, 'T1', lang); await expect(page.locator('#kmap')).toBeVisible(); }
const inView = (page: Page, id: string) => page.evaluate((id) => { const r = document.getElementById(id)!.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }, id);

for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang}: home shows the whole knowledge map first, fitting the phone`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
    await home(page, lang);
    const km = page.locator('section#T1 #kmap');
    await expect(km).toHaveCount(1);
    await expect(km.locator('li.km-l')).toHaveCount(LAYERS);
    /* the map comes before the T1 diagram and starts on the first screen */
    const g = await page.evaluate(() => {
      const k = document.getElementById('kmap')!.getBoundingClientRect(), d = document.querySelector('section#T1 .m-stage')!.getBoundingClientRect();
      return { top: k.top + scrollY, bottom: k.bottom + scrollY, stage: d.top + scrollY, vh: innerHeight, vw: innerWidth, sw: document.documentElement.scrollWidth };
    });
    expect(g.stage).toBeGreaterThan(g.bottom);
    expect(g.top).toBeLessThan(g.vh * 0.35);
    /* compact: the whole spine is within about 1.4 screens on the smallest phone */
    expect(g.bottom - g.top).toBeLessThan(g.vh * 1.4);
    expect(g.sw).toBeLessThanOrEqual(g.vw);
    /* no squeezed / clipped text: every box and chip is inside the screen, nothing overflows its box, tap targets ≥ 26 px */
    const bad = await page.evaluate(() => {
      const out: string[] = [];
      document.querySelectorAll<HTMLElement>('#kmap .km-b, #kmap .km-x, #kmap .km-n > b, #kmap .km-r, #kmap .km-c').forEach((e) => {
        const r = e.getBoundingClientRect();
        if (r.left < 0 || r.right > innerWidth + 0.5) out.push('offscreen ' + e.className + ': ' + e.textContent);
        if (e.scrollWidth > e.clientWidth + 1) out.push('overflow ' + e.className + ': ' + e.textContent);
        if ((e.classList.contains('km-b') || e.classList.contains('km-x')) && r.height < 26) out.push('small ' + e.textContent);
        if (e.matches('.km-n > b') && r.width < 60) out.push('squeezed ' + e.textContent);
      });
      return out;
    });
    expect(bad).toEqual([]);
    /* layers run top to bottom in one straight column (no side-by-side boxes, no connectors to loop) */
    const ys = await km.locator('li.km-l').evaluateAll((ls) => ls.map((l) => l.getBoundingClientRect()).map((r) => [r.top, r.bottom]));
    for (let i = 1; i < ys.length; i++) expect((ys[i] as number[])[0]).toBeGreaterThanOrEqual((ys[i - 1] as number[])[1]! - 0.5);
    if (lang === 'en') expect(/[\u3400-\u9fff]/.test(await km.innerText())).toBe(false);
    /* counts on screen = cards / labs in the data */
    for (const li of await km.locator('li.km-l').all()) {
      const st = (await li.getAttribute('data-km'))!.split(' '), c = li.locator('.km-c');
      expect(Number(await c.getAttribute('data-labs')), st.join()).toBe(XS.filter((r) => st.includes(r[2]!) && r[0] === 'l').length);
      expect(Number(await c.getAttribute('data-cards')), st.join()).toBe(XS.filter((r) => st.includes(r[2]!) && r[0] === 'c').length);
    }
    expect(errors).toEqual([]);
  });

  test(`${lang}: every station is one tap from home, and each tap lands there`, async ({ page }) => {
    test.setTimeout(120_000);
    await home(page, lang);
    const targets = await page.locator('#kmap [data-go]').evaluateAll((bs) => bs.map((b) => (b as HTMLElement).dataset.go!));
    for (const S of KB.TABORDER) if (S !== 'T1') expect(targets, S).toContain(S);
    for (const S of [...new Set(targets)]) {
      await home(page, lang);
      const b = page.locator(`#kmap [data-go="${S}"]`).first();
      await b.evaluate((e) => e.scrollIntoView({ block: 'center' }));
      await b.tap();
      await ready(page, S, lang);
      expect(await station(page), S).toBe(S);
      await expect(page.locator(`section#${S} .pagehead`)).toBeVisible();
    }
  });

  test(`${lang}: the home row scrolls to the T1 diagram; the side entries open the map and the glossary; visits are marked`, async ({ page }) => {
    await home(page, lang);
    await page.locator('#kmap [data-sj="c_T1_0"]').tap();
    await expect.poll(() => inView(page, 'c_T1_0')).toBe(true);
    expect(await station(page)).toBe('T1');
    await home(page, lang);
    const gl = page.locator('#kmap [data-sj="c_T8_1"]');
    await gl.evaluate((e) => e.scrollIntoView({ block: 'center' })); await gl.tap();
    await ready(page, 'T8', lang);
    await expect.poll(() => inView(page, 'c_T8_1')).toBe(true);
    /* visit Ua, come home: the layer says seen 1/5 and the chip is ticked */
    await page.goto(`./?lang=${lang}#Ua`); await ready(page, 'Ua', lang);
    await home(page, lang);
    const li = page.locator('#kmap li.km-l[data-km^="U "]');
    await expect(li.locator('.km-p')).toHaveText(new RegExp(`(已看|seen) 1/5`));
    await expect(li.locator('.km-x[data-go="Ua"]')).toHaveClass(/\bv\b/);
    await expect(li.locator('.km-x[data-go="Ub"]')).not.toHaveClass(/\bv\b/);
  });
}
