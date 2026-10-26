import { test, expect, type Page } from '@playwright/test';
/* R30 three.js scenes (T3 word vectors, T4a attention beams, T7 loss valley): three.js is a separate lazy chunk that is
   requested only when a scene box comes on screen; no WebGL or reduced motion keeps the 2D figure (no request, no error);
   leaving the stop frees every view; the lab text never spills or overlaps at 360 / 390 / 430 in zh and en.
   R30b: the scene is the first screen of its stop (stage ≈ half the screen or more, one short sentence, a closed
   "Want to know why" fold above the bottom bar), so its chunk now loads right after the stop is ready. */
const SC = [['T3', 'lab3dVec', 'vec'], ['T4a', 'lab3dAttn', 'attn'], ['T7', 'lab3dValley', 'valley']] as const;
const is3d = (u: string) => /\/(three|vec|attn|valley|api|loc|skl|bld|duo|nn|blk|score|moe|loop|grid|dice|patch|next)-[\w-]+\.js$/.test(new URL(u).pathname); // R31/R31d: the newer scene chunks count too
type St = { made: number; freed: number; live: number; loads: number } | undefined;
const stats = (p: Page) => p.evaluate(() => (window as unknown as { __si3d?: St }).__si3d);

async function open(p: Page, S: string, lang: string) {
  const reqs: string[] = [], errs: string[] = [];
  p.on('request', (r) => { if (is3d(r.url())) reqs.push(new URL(r.url()).pathname.split('/').pop()!); });
  p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(`?lang=${lang}#${S}`);
  await p.locator('html[data-si-ready]').waitFor({ state: 'attached' });
  await p.waitForTimeout(800);
  return { reqs, errs };
}
const show = (p: Page, lab: string) => p.locator(`#${lab} .s3d`).evaluate((e) => e.scrollIntoView({ block: 'center' }));

test.describe('R30 3D scenes', () => {
  for (const [S, lab, chunk] of SC) {
    test(`${S}: the stage is the first screen → 3D with only its own chunk; leaving the stop frees it`, async ({ page: p }) => {
      const { reqs, errs } = await open(p, S, 'zh');
      await expect(p.locator(`#${lab} .s3d`)).toHaveAttribute('data-s3d', 'on', { timeout: 15_000 });
      expect(reqs.some((r) => r.startsWith('three-'))).toBe(true);
      expect(reqs.some((r) => r.startsWith(chunk + '-'))).toBe(true);
      expect(reqs.filter((r) => /^(vec|attn|valley)-/.test(r) && !r.startsWith(chunk + '-')), 'no other scene').toEqual([]);
      await expect(p.locator(`#${lab} .s3d canvas`)).toHaveCount(1);
      expect(await stats(p)).toMatchObject({ made: 1, live: 1 });
      await p.evaluate(() => (window as unknown as { __si: { go(s: string): void } }).__si.go('Uc'));
      await expect.poll(() => stats(p)).toMatchObject({ made: 1, freed: 1, live: 0 });
      await expect(p.locator('.s3d canvas')).toHaveCount(0);
      expect(errs).toEqual([]);
    });
  }

  test('power: once a scene is still it stops drawing; the valley animation runs at most 30 frames a second', async ({ page: p }) => {
    type F = { frames?: number };
    const fr = () => p.evaluate(() => (window as unknown as { __si3d?: F }).__si3d?.frames ?? 0);
    for (const [S, lab] of SC) {
      await open(p, S, 'zh'); await show(p, lab);
      await expect(p.locator(`#${lab} .s3d`)).toHaveAttribute('data-s3d', 'on', { timeout: 15_000 });
      await p.waitForTimeout(800);
      const a = await fr(); await p.waitForTimeout(2000);
      expect(await fr() - a, `${S}: no frames while nothing moves`).toBeLessThanOrEqual(1);
      expect(await p.locator(`#${lab} .s3d-sw`).count(), `${S}: no rotate switch`).toBe(0);
      if (S === 'T7') {
        await p.locator('#vlLr').fill('0.02'); await p.locator('#vlLr').dispatchEvent('input'); // 80 slow steps: still rolling after 2 s
        await p.locator('#vlPlay').click(); await p.waitForTimeout(300);
        const b = await fr(); await p.waitForTimeout(2000); const n = (await fr()) - b;
        expect(n, 'Play draws').toBeGreaterThan(5); expect(n, '≤ 30 fps').toBeLessThanOrEqual(64);
        await p.locator('#vlPlay').click(); await p.waitForTimeout(300); const c = await fr(); await p.waitForTimeout(1500);
        expect(await fr() - c, 'stops again').toBeLessThanOrEqual(1);
      }
      await p.evaluate(() => (window as unknown as { __si: { go(s: string): void } }).__si.go('Uc'));
      await expect.poll(() => p.evaluate(() => (window as unknown as { __si3d?: { live: number } }).__si3d?.live)).toBe(0);
    }
  });

  test('the home page and a stop without a scene never ask for three.js', async ({ page: p }) => {
    for (const S of ['H', 'Uc', 'K5']) {
      const { reqs } = await open(p, S, 'zh');
      await p.waitForTimeout(1200);
      expect(reqs, S).toEqual([]);
    }
  });

  test('no WebGL → the 2D figure and the same sentence, nothing requested, no error', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: 'tests/e2e/onb-done.json' });
    await ctx.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, k: string, ...a: unknown[]) { return /webgl/.test(k) ? null : (g as (...x: unknown[]) => unknown).call(this, k, ...a); } as typeof g; });
    const p = await ctx.newPage();
    for (const [S, lab] of SC) {
      const { reqs, errs } = await open(p, S, 'en');
      await show(p, lab); await p.waitForTimeout(800);
      const box = p.locator(`#${lab} .s3d`);
      await expect(box).toHaveAttribute('data-s3d', 'fallback'); await expect(box).toHaveAttribute('data-why', 'nogl');
      await expect(box.locator('svg.s3d-fb')).toBeVisible();
      expect((await box.locator('svg.s3d-fb').boundingBox())!.height).toBeGreaterThan(150);
      await expect(p.locator(`#${lab} .s3c-say`)).toBeVisible(); expect(((await p.locator(`#${lab} .s3c-say`).textContent()) ?? '').trim().length).toBeGreaterThan(10);
      expect(reqs, S).toEqual([]); expect(errs, S).toEqual([]);
      expect((await stats(p))?.loads ?? 0).toBe(0);
    }
    await ctx.close();
  });

  test('reduced motion → the 2D figure, nothing requested; the valley Play jumps to the end', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', storageState: 'tests/e2e/onb-done.json' });
    const p = await ctx.newPage();
    for (const [S, lab] of SC) {
      const { reqs } = await open(p, S, 'zh');
      await show(p, lab); await p.waitForTimeout(600);
      await expect(p.locator(`#${lab} .s3d`)).toHaveAttribute('data-why', 'motion');
      expect(reqs, S).toEqual([]);
    }
    await p.locator('#vlPlay').click();
    await expect(p.locator('#vlOut')).toContainText('60 / 60');
    await ctx.close();
  });

  test('valley: a big learning rate zigzags, Reset goes back to step 0', async ({ page: p }) => {
    await open(p, 'T7', 'zh'); await show(p, 'lab3dValley');
    await p.locator('#vlLr').fill('0.5'); await p.locator('#vlLr').dispatchEvent('input');
    await expect(p.locator('#vlOut')).toContainText('11');
    await p.locator('#vlPlay').click();
    await expect(p.locator('#vlOut')).toContainText('11 / 11', { timeout: 10_000 });
    await expect(p.locator('#vlOut')).toContainText('跳过去');
    await p.locator('#vlReset').click();
    await expect(p.locator('#vlOut')).toContainText('0 / 11');
  });

  for (const lang of ['zh', 'en']) {
    test(`${lang}: one-screen stage: about half the screen or more, short text under it, fold closed and above the bottom bar`, async ({ browser }, ti) => {
      const vw = ti.project.use.viewport!;
      const ctx = await browser.newContext({ viewport: vw, storageState: 'tests/e2e/onb-done.json', reducedMotion: 'reduce' });
      const p = await ctx.newPage();
      for (const [S, lab] of SC) {
        await open(p, S, lang);
        const m = await p.locator('#' + lab).evaluate((root) => {
          const vh = innerHeight, st = root.querySelector('.s3d')!.getBoundingClientRect(), why = root.querySelector('details.s3c-why') as HTMLDetailsElement;
          const sum = why.querySelector('summary')!.getBoundingClientRect();
          const bars = [...document.querySelectorAll<HTMLElement>('nav,footer,[class*="bar"]')].filter((e) => getComputedStyle(e).position === 'fixed' && e.getBoundingClientRect().top > vh / 2).map((e) => e.getBoundingClientRect().top);
          const barTop = Math.min(vh, ...bars);
          let text = '';
          for (const e of root.querySelectorAll<HTMLElement>('.s3c-sheet, details.s3c-why > summary')) {
            const r = e.getBoundingClientRect(); if (r.top < barTop && r.bottom > 0) text += e.innerText;
          }
          return { ratio: st.height / vh, top: st.top, open: why.open, sumBottom: sum.bottom, barTop, n: [...text.replace(/[\s▾▸▶↺]/g, '')].length };
        });
        const tag = `${S} ${lang} ${vw.width}×${vw.height}`;
        /* R30c: the stage takes at least 52% of the screen on every phone size, in both languages */
        expect(m.ratio, `${tag}: stage share of the screen`).toBeGreaterThanOrEqual(0.52); expect(m.ratio, tag).toBeLessThanOrEqual(0.6);
        expect(m.top, `${tag}: stage starts in the top 40% of the screen`).toBeLessThan(vw.height * 0.4);
        expect(m.open, `${tag}: fold closed`).toBe(false);
        expect(m.sumBottom, `${tag}: fold title above the bottom bar`).toBeLessThanOrEqual(m.barTop + 1);
        if (lang === 'zh') expect(m.n, `${tag}: visible text under the stage`).toBeLessThanOrEqual(60);
      }
      await ctx.close();
    });
    test(`${lang}: lab text never spills or overlaps, 2D labels apart`, async ({ browser }, ti) => {
      const vw = ti.project.use.viewport!;
      const ctx = await browser.newContext({ viewport: vw, storageState: 'tests/e2e/onb-done.json', reducedMotion: 'reduce' });
      const p = await ctx.newPage();
      for (const [S, lab] of SC) {
        await open(p, S, lang); await show(p, lab); await p.waitForTimeout(400);
        const bad = await p.locator('#' + lab).evaluate((root, W) => {
          const out: string[] = [], R = root.getBoundingClientRect();
          if (R.right > W + 0.5) out.push(`lab wider than screen ${R.right}`);
          for (const e of root.querySelectorAll<HTMLElement>('p,li,b,span,label,button,output,div,h3,h4')) {
            if (e.closest('svg') || !e.getClientRects().length || e.classList.contains('s3c-t')) continue; // s3c-t: screen-reader-only title
            const r = e.getBoundingClientRect();
            if (r.right > R.right + 1 || r.left < R.left - 1) out.push(`outside: ${e.tagName}.${e.className} ${(e.textContent || '').slice(0, 30)}`);
            const cs = getComputedStyle(e);
            if (cs.overflowX !== 'visible' && e.scrollWidth > e.clientWidth + 1 && !e.classList.contains('s3d')) out.push(`clipped: ${e.tagName}.${e.className} ${(e.textContent || '').slice(0, 30)}`);
          }
          const ctl = [...root.querySelectorAll<HTMLElement>('button,input,summary')].filter((e) => e.getClientRects().length).map((e) => [e, e.getBoundingClientRect()] as const);
          for (let i = 0; i < ctl.length; i++) for (let j = i + 1; j < ctl.length; j++) {
            const [a, ra] = ctl[i]!, [b, rb] = ctl[j]!;
            if (a.contains(b) || b.contains(a)) continue;
            if (ra.left < rb.right - 1 && rb.left < ra.right - 1 && ra.top < rb.bottom - 1 && rb.top < ra.bottom - 1) out.push(`controls overlap: ${a.id || a.tagName} / ${b.id || b.tagName}`);
          }
          const tx = [...root.querySelectorAll<SVGTextElement>('svg.s3d-fb text')].filter((t) => (t.textContent || '').trim()).map((t) => [t, t.getBoundingClientRect()] as const);
          const box = root.querySelector('.s3d')!.getBoundingClientRect();
          for (const [t, r] of tx) if (r.left < box.left - 1 || r.right > box.right + 1 || r.top < box.top - 1 || r.bottom > box.bottom + 1) out.push(`2D label cut: ${t.textContent}`);
          for (let i = 0; i < tx.length; i++) for (let j = i + 1; j < tx.length; j++) {
            const [a, ra] = tx[i]!, [b, rb] = tx[j]!;
            if (ra.left < rb.right - 1 && rb.left < ra.right - 1 && ra.top < rb.bottom - 1 && rb.top < ra.bottom - 1) out.push(`2D labels overlap: ${a.textContent} / ${b.textContent}`);
          }
          return out;
        }, vw.width);
        expect(bad, `${S} ${lang} ${vw.width}`).toEqual([]);
      }
      await ctx.close();
    });
  }
});

/* R30 follow-up: a cross-stop jump keeps its target in view when the content above grows late (slow phone), and never
   pulls the reader back once they scrolled themselves */
test.describe('R30 jump settle', () => {
  const late = (p: Page, userScroll: boolean) => p.evaluate((u) => {
    (document.querySelector('button.mh-x[data-sj=lab3dValley]') as HTMLButtonElement).click();
    window.setTimeout(() => {
      /* growth the browser's scroll anchoring cannot absorb (as when it lands mid smooth-scroll) */
      document.documentElement.style.overflowAnchor = 'none'; document.body.style.overflowAnchor = 'none';
      document.querySelectorAll<HTMLElement>('section.level').forEach((x) => (x.style.overflowAnchor = 'none'));
      if (u) { window.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 })); window.scrollTo({ top: 0 }); }
      const d = document.createElement('div'); d.id = 'growT7'; d.style.height = '900px';
      const sec = document.getElementById('T7')!; sec.insertBefore(d, sec.firstChild);
    }, 1900);
  }, userScroll);
  test('late growth above the target is followed', async ({ page }) => {
    await page.goto('?lang=zh#K1'); await page.locator('html[data-si-ready="K1.zh"]').waitFor({ state: 'attached' });
    await page.waitForTimeout(500);
    await late(page, false);
    await page.waitForTimeout(4800);
    await expect(page.locator('#growT7')).toHaveCount(1);
    await expect(page.locator('#lab3dValley')).toBeInViewport({ ratio: 0.05 });
  });
  test('a reader who scrolled away is left alone', async ({ page }) => {
    await page.goto('?lang=zh#K1'); await page.locator('html[data-si-ready="K1.zh"]').waitFor({ state: 'attached' });
    await page.waitForTimeout(500);
    await late(page, true);
    await page.waitForTimeout(4800);
    await expect(page.locator('#growT7')).toHaveCount(1);
    expect(await page.evaluate(() => window.pageYOffset)).toBeLessThan(5);
  });
});
