/* R13: the home (T1) diagram is the whole stack, top → bottom (you → agent app → LLM → Transformer → NN parts → multimodal
   side branch → training → compute → MATH K1–K5) with labelled "supports" lines. Checked live at 360/390/430, zh + en:
   nothing squeezed or rewrapped at runtime, labels inside their boxes, no overlap, no horizontal overflow, every box opens
   its popup, every 🔍 badge drills to its station (each station one tap from home), fullscreen portrait + landscape. */
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Lang = 'zh' | 'en';
type SI = { __si: { state(): { station: string; popup: { id: string } | null } } };
const KB = JSON.parse(readFileSync(new URL('../../src/legacy/gen/kb.json', import.meta.url), 'utf8')) as { TABORDER: string[] };
const ready = (page: Page, S: string, lang: Lang) => page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached' });
const state = (page: Page) => page.evaluate(() => (window as unknown as SI).__si.state());
const SVG = 'section#T1 .m-stage svg#svgT1';
async function home(page: Page, lang: Lang) { await page.goto(`./?lang=${lang}#T1`); await ready(page, 'T1', lang); await page.locator(SVG).waitFor(); }

/** geometry of the live diagram, in svg user units */
const geo = (page: Page, sel: string) => page.locator(sel).evaluate((svg: SVGSVGElement) => {
  const R = (e: SVGGraphicsElement) => { const b = e.getBBox(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
  const vb = svg.viewBox.baseVal;
  const hit = (a: { x: number; y: number; w: number; h: number }, b: typeof a, m = 0) => a.x < b.x + b.w + m && b.x < a.x + a.w + m && a.y < b.y + b.h + m && b.y < a.y + a.h + m;
  const bad: string[] = [], boxes: { id: string; r: ReturnType<typeof R> }[] = [];
  svg.querySelectorAll<SVGGElement>('.comp[data-id]').forEach((g) => {
    const m = g.querySelector<SVGRectElement>('rect.main')!, r = R(m), id = g.dataset.id!; boxes.push({ id, r });
    g.querySelectorAll<SVGTextElement>(':scope>text').forEach((t) => {
      if (!t.textContent || t.classList.contains('zm-h')) return; const b = R(t);
      if (b.x < r.x + 2 || b.x + b.w > r.x + r.w - 2 || b.y < r.y + 1 || b.y + b.h > r.y + r.h - 1) bad.push(`text "${t.textContent}" leaves box ${id}`);
    });
  });
  /* the drill badge (drawn where the 🔍 marker sits) stays inside its box */
  svg.querySelectorAll<SVGGElement>('.dd-b').forEach((d) => {
    const own = d.closest<SVGGElement>('.comp')?.dataset.id ?? d.dataset.ddid, b = boxes.find((x) => x.id === own), r = R(d.querySelector<SVGCircleElement>('.dd-c0')!);
    if (!b) bad.push(`drill badge without a box (${own})`); else if (r.x < b.r.x || r.x + r.w > b.r.x + b.r.w || r.y < b.r.y || r.y + r.h > b.r.y + b.r.h) bad.push(`drill badge leaves box ${own}`);
  });
  boxes.forEach((a, i) => boxes.slice(i + 1).forEach((b) => { if (hit(a.r, b.r)) bad.push(`boxes overlap ${a.id}/${b.id}`); }));
  const labs = [...svg.querySelectorAll<SVGTextElement>('text.lbl, text.elab')].filter((t) => t.textContent).map((t) => ({ s: t.textContent!, r: R(t) }));
  for (const l of labs) {
    if (l.r.x < vb.x - 0.5 || l.r.x + l.r.w > vb.x + vb.width + 0.5) bad.push(`label "${l.s}" outside the picture`);
    for (const b of boxes) if (hit(l.r, b.r, -1)) bad.push(`label "${l.s}" on box ${b.id}`);
  }
  labs.forEach((a, i) => labs.slice(i + 1).forEach((b) => { if (hit(a.r, b.r, -1)) bad.push(`labels overlap "${a.s}"/"${b.s}"`); }));
  /* visible badges (train / read-only) stay off other boxes and labels */
  svg.querySelectorAll<SVGGElement>('.badge').forEach((g) => {
    if (getComputedStyle(g).display === 'none') return; const rc = g.querySelector('rect'); if (!rc) return;
    const r = R(rc), own = g.closest<SVGGElement>('.comp')?.dataset.id;
    for (const b of boxes) if (b.id !== own && hit(r, b.r, -1)) bad.push(`badge of ${own} on box ${b.id}`);
    for (const l of labs) if (hit(r, l.r, -1)) bad.push(`badge of ${own} on label "${l.s}"`);
  });
  /* the runtime fitter had nothing to fix: no rewrap, no shrink, no squeeze */
  const fixed = svg.querySelectorAll('[data-fit],[data-fitc],[data-fs2],[textLength]').length;
  return { bad, fixed, comps: boxes.map((b) => b.id), bands: svg.querySelectorAll('rect.band').length, sup: svg.querySelectorAll('path.arrow.sup').length };
});

for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang}: the full-stack diagram is clean, complete and fits the phone`, async ({ page }) => {
    await home(page, lang);
    const g = await geo(page, SVG);
    expect(g.bad).toEqual([]);
    expect(g.fixed, 'no label had to be rewrapped or shrunk').toBe(0);
    expect(g.bands).toBe(9); expect(g.sup).toBe(6);
    for (const id of ['user', 'app', 'llm', 'blocks', 'attn', 'nnHub', 'mmenc', 'trainsys', 'infra', 'mK1', 'mK2', 'mK3', 'mK4', 'mK5']) expect(g.comps, id).toContain(id);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    /* the old R12 list is gone; the band titles read in this language */
    await expect(page.locator('section#T1 .km-l')).toHaveCount(0);
    const math = lang === 'zh' ? '数学基础' : 'Math foundations';
    await expect(page.locator(`${SVG} text.lbl`, { hasText: math })).toHaveCount(1);
    if (lang === 'en') expect(await page.locator(SVG).evaluate((s) => s.textContent ?? '')).not.toMatch(/[\u3400-\u9fff]/);
  });

  test(`${lang}: every 🔍 badge drills to its station — every station is one tap from home`, async ({ page }) => {
    test.setTimeout(150_000);
    await home(page, lang);
    const dd = await page.locator(`${SVG} .dd-b[data-dd]`).evaluateAll((bs) => bs.map((b) => (b as SVGElement).dataset.dd!));
    expect(dd.length).toBe(36);
    expect(KB.TABORDER.filter((S) => S !== 'T1' && !dd.includes(S))).toEqual([]);
    for (const S of [...new Set(dd)]) {
      if ((await state(page)).station !== 'T1') await home(page, lang);
      await page.locator(`${SVG} .dd-b[data-dd="${S}"]`).first().evaluate((b) => b.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
      await ready(page, S, lang);
      await expect.poll(async () => (await state(page)).station, S).toBe(S);
    }
  });

  test(`${lang}: every box opens its popup`, async ({ page }, ti) => {
    test.setTimeout(150_000);
    await home(page, lang);
    let ids = await page.locator(`${SVG} .comp[data-id]`).evaluateAll((gs) => gs.map((g) => (g as SVGGElement).dataset.id!));
    expect(ids.length).toBeGreaterThanOrEqual(50);
    if (ti.project.name !== 'm360') ids = ids.filter((_, i) => i % 6 === 0);
    for (const id of ids) {
      await page.locator(`${SVG} .comp[data-id="${id}"]`).evaluate((g) => g.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
      await expect.poll(async () => (await state(page)).popup?.id ?? null, id).toBe(id);
      await expect(page.locator('#modal.open .m-head h3')).not.toBeEmpty();
      if (lang === 'en') await expect(page.locator('#modal.open .m-head h3')).not.toContainText(/[\u3400-\u9fff]/);
      await page.keyboard.press('Escape');
      await expect.poll(async () => (await state(page)).popup).toBe(null);
    }
  });

  test(`${lang}: fullscreen shows the whole stack, portrait (phone layout) and landscape (wide layout), width-fitted`, async ({ page }) => {
    await home(page, lang);
    await page.locator('section#T1 .m-stage [data-vz=full]').click();
    await expect(page.locator('#dgFull.open #fsHost svg')).toBeVisible();
    const fit = () => page.evaluate(() => { const h = document.getElementById('fsHost')!, s = h.querySelector('svg')!; return { hw: h.clientWidth, sw: s.getBoundingClientRect().width, n: s.querySelectorAll('.comp[data-id]').length, k: s.querySelectorAll('.comp[data-id^="mK"]').length, orig: s.classList.contains('fs-orig') }; });
    let f = await fit();
    expect(f.orig).toBe(false); expect(Math.abs(f.sw - f.hw)).toBeLessThan(2); expect(f.k).toBe(5);
    await page.keyboard.press('Escape'); await expect(page.locator('#dgFull.open')).toHaveCount(0);
    const vp = page.viewportSize()!;
    await page.setViewportSize({ width: vp.height, height: vp.width });
    await page.locator('section#T1 .m-stage [data-vz=full]').click();
    await expect(page.locator('#dgFull.open #fsHost svg.fs-orig')).toBeVisible();
    await expect.poll(async () => { f = await fit(); return Math.abs(f.sw - f.hw) < 2; }).toBe(true);
    expect(f.k).toBe(5); expect(f.n).toBeGreaterThanOrEqual(50);
    const g = await geo(page, '#fsHost svg.fs-orig');
    expect(g.bad).toEqual([]); expect(g.fixed).toBe(0);
    await page.keyboard.press('Escape');
    await page.setViewportSize(vp);
  });
}
