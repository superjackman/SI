import { test, expect, type Page } from '@playwright/test';
/* R31d principles-line 3D stage cards (N, T4, T4b, T5, T2, K2, K3, T6 at the top of their stop; T3's "next word" further
   down): each scene is its own lazy chunk on top of the shared three chunk; still means no frames; leaving frees it;
   the one control changes the sentence; no WebGL or reduced motion keeps the 2D figure; text never spills; the 3D labels
   stay ≥14px, inside the stage and apart. */
const SC = [
  ['N', 'lab3dNet', 'nn', 'nnSay', '#nnW', 'range:-2'], ['T4', 'lab3dBlk', 'blk', 'bkSay', '#bkGo', 'click'],
  ['T4b', 'lab3dScore', 'score', 'scSay', '#scGo', 'click'], ['T5', 'lab3dMoe', 'moe', 'moSay', '#moGo', 'click'],
  ['T2', 'lab3dLoop', 'loop', 'lpSay', '#lpGo', 'click'], ['K2', 'lab3dGrid', 'grid', 'grSay', '#grA', 'range:0'],
  ['K3', 'lab3dDice', 'dice', 'dcSay', '#dcGo', 'click'], ['T6', 'lab3dPatch', 'patch', 'ptSay', '#ptG', 'range:4'],
  ['T3', 'lab3dNext', 'next', 'nxSay', '#nxT', 'range:0.2'],
] as const;
const CH = /^(three|vec|attn|valley|api|loc|skl|bld|duo|nn|blk|score|moe|loop|grid|dice|patch|next)-[\w-]+\.js$/;
type St = { made: number; freed: number; live: number; loads: number; frames?: number } | undefined;
const stats = (p: Page) => p.evaluate(() => (window as unknown as { __si3d?: St }).__si3d);
const go = (p: Page, S: string) => p.evaluate((s) => (window as unknown as { __si: { go(s: string): void } }).__si.go(s), S);

async function open(p: Page, S: string, lang: string) {
  const reqs: string[] = [], errs: string[] = [];
  p.on('request', (r) => { const f = new URL(r.url()).pathname.split('/').pop()!; if (CH.test(f)) reqs.push(f); });
  p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(`?lang=${lang}#${S}`);
  await p.locator('html[data-si-ready]').waitFor({ state: 'attached' });
  await p.waitForTimeout(800);
  return { reqs, errs };
}
const show = (p: Page, lab: string) => p.locator(`#${lab} .s3d`).evaluate((e) => e.scrollIntoView({ block: 'center' }));
async function act(p: Page, sel: string, how: string) {
  if (how === 'click') return p.locator(sel).click();
  const v = how.split(':')[1]!;
  await p.locator(sel).fill(v); await p.locator(sel).dispatchEvent('input');
}

test.describe('R31d 3D scenes', () => {
  for (const [S, lab, chunk] of SC) {
    test(`${S}: its stage → 3D with only its own scene chunk (T3: after the word-space one); still means no frames; leaving frees it`, async ({ page: p }) => {
      const { reqs, errs } = await open(p, S, 'zh');
      if (S === 'T3') await show(p, lab);
      await expect(p.locator(`#${lab} .s3d`)).toHaveAttribute('data-s3d', 'on', { timeout: 15_000 });
      expect(reqs.some((r) => r.startsWith('three-'))).toBe(true);
      expect(reqs.some((r) => r.startsWith(chunk + '-'))).toBe(true);
      expect(reqs.filter((r) => !r.startsWith('three-') && !r.startsWith(chunk + '-') && !(S === 'T3' && r.startsWith('vec-'))), 'no other scene').toEqual([]);
      await expect(p.locator(`#${lab} .s3d canvas`)).toHaveCount(1);
      expect((await stats(p))?.live, 'one scene alive at a time').toBe(1);
      await p.waitForTimeout(1200);
      const a = (await stats(p))?.frames ?? 0; await p.waitForTimeout(1500);
      expect(((await stats(p))?.frames ?? 0) - a, 'no frames while still').toBeLessThanOrEqual(1);
      await go(p, 'Uc');
      await expect.poll(async () => (await stats(p))?.live).toBe(0);
      await expect(p.locator('.s3d canvas')).toHaveCount(0);
      expect(errs).toEqual([]);
    });
  }

  test('the one control changes the sentence', async ({ page: p }) => {
    for (const [S, lab, , say, sel, how] of SC) {
      await open(p, S, 'zh'); await show(p, lab);
      await expect(p.locator(`#${lab} .s3d`)).toHaveAttribute('data-s3d', 'on', { timeout: 15_000 });
      const before = await p.locator('#' + say).innerText();
      await act(p, sel, how);
      await expect.poll(() => p.locator('#' + say).innerText(), S).not.toBe(before);
      await go(p, 'Uc'); await expect.poll(async () => (await stats(p))?.live).toBe(0);
    }
  });

  test('no WebGL → the 2D figure and the same sentence, nothing requested, no error', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: 'tests/e2e/onb-done.json' });
    await ctx.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, k: string, ...a: unknown[]) { return /webgl/.test(k) ? null : (g as (...x: unknown[]) => unknown).call(this, k, ...a); } as typeof g; });
    const p = await ctx.newPage();
    for (const [S, lab, , say] of SC) {
      const { reqs, errs } = await open(p, S, 'en');
      await show(p, lab); await p.waitForTimeout(600);
      const box = p.locator(`#${lab} .s3d`);
      await expect(box).toHaveAttribute('data-s3d', 'fallback'); await expect(box).toHaveAttribute('data-why', 'nogl');
      expect((await box.locator('svg').first().boundingBox())!.height, S).toBeGreaterThan(150);
      expect(await box.locator('svg').first().evaluate((s) => s.childElementCount), `${S}: 2D figure drawn`).toBeGreaterThan(2);
      expect(((await p.locator('#' + say).textContent()) ?? '').trim().length, S).toBeGreaterThan(10);
      expect(reqs, S).toEqual([]); expect(errs, S).toEqual([]);
    }
    await ctx.close();
  });

  test('reduced motion → the 2D figure, nothing requested; the control still works', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', storageState: 'tests/e2e/onb-done.json' });
    const p = await ctx.newPage();
    for (const [S, lab, , say, sel, how] of SC) {
      const { reqs } = await open(p, S, 'zh');
      await show(p, lab); await p.waitForTimeout(400);
      await expect(p.locator(`#${lab} .s3d`)).toHaveAttribute('data-why', 'motion');
      const before = await p.locator('#' + say).innerText();
      await act(p, sel, how);
      await expect.poll(() => p.locator('#' + say).innerText(), S).not.toBe(before);
      expect(reqs, S).toEqual([]);
    }
    await ctx.close();
  });

  for (const lang of ['zh', 'en']) {
    test(`${lang}: the stage fills most of the first screen, fold closed above the bottom bar`, async ({ browser }, ti) => {
      const vw = ti.project.use.viewport!;
      const ctx = await browser.newContext({ viewport: vw, storageState: 'tests/e2e/onb-done.json', reducedMotion: 'reduce' });
      const p = await ctx.newPage();
      for (const [S, lab] of SC) {
        await open(p, S, lang);
        if (S === 'T3') await p.locator('#' + lab).evaluate((e) => scrollBy(0, e.getBoundingClientRect().top - 60));
        await p.waitForTimeout(300);
        /* the stage starts at its CSS height and fitStage refits it on the next frames (and again at 400/1500 ms); under a
           loaded run that refit can land after a fixed wait, so wait until fonts are in and two reads (stage height, fold title) 150 ms apart agree */
        await p.evaluate(() => document.fonts.ready.then(() => undefined));
        const stageH = () => p.locator('#' + lab).evaluate((r) => `${Math.round(r.querySelector('.s3d')!.getBoundingClientRect().height)}/${Math.round(r.querySelector('details.s3c-why summary')!.getBoundingClientRect().bottom)}`);
        for (let i = 0, a = await stageH(); i < 20; i++) { await p.waitForTimeout(150); const b = await stageH(); if (b === a && i >= 1) break; a = b; }
        const m = await p.locator('#' + lab).evaluate((root) => {
          const vh = innerHeight, st = root.querySelector('.s3d')!.getBoundingClientRect(), why = root.querySelector('details.s3c-why') as HTMLDetailsElement;
          const bars = [...document.querySelectorAll<HTMLElement>('nav,footer,[class*="bar"]')].filter((e) => getComputedStyle(e).position === 'fixed' && e.getBoundingClientRect().top > vh / 2).map((e) => e.getBoundingClientRect().top);
          return { ratio: st.height / vh, open: why.open, sumBottom: why.querySelector('summary')!.getBoundingClientRect().bottom, barTop: Math.min(vh, ...bars) };
        });
        const tag = `${S} ${lang} ${vw.width}×${vw.height}`;
        /* at 390+ the stage gets ≈0.55–0.58; at 360×740 a stop with a two-line head (and English two-line sentences) leaves less room,
           and the stage gives way so the fold title stays above the bar (measured 0.43–0.55) */
        if (vw.width >= 390) expect(m.ratio, tag).toBeGreaterThanOrEqual(lang === 'zh' ? 0.55 : 0.5);
        else expect(m.ratio, tag).toBeGreaterThanOrEqual(lang === 'zh' ? 0.5 : 0.42);
        expect(m.ratio, tag).toBeLessThanOrEqual(0.6);
        expect(m.open, `${tag}: fold closed`).toBe(false);
        expect(m.sumBottom, `${tag}: fold title above the bottom bar`).toBeLessThanOrEqual(m.barTop + 1);
      }
      await ctx.close();
    });

    test(`${lang}: lab text never spills; 3D labels ≥14px, inside the stage, apart`, async ({ browser }, ti) => {
      const vw = ti.project.use.viewport!;
      const ctx = await browser.newContext({ viewport: vw, storageState: 'tests/e2e/onb-done.json' });
      const p = await ctx.newPage();
      for (const [S, lab, , , sel, how] of SC) {
        await open(p, S, lang); await show(p, lab);
        await expect(p.locator(`#${lab} .s3d`)).toHaveAttribute('data-s3d', /on|fallback/, { timeout: 15_000 });
        for (const step of [0, 1]) {
          if (step) { await act(p, sel, how); await p.waitForTimeout(900); } else await p.waitForTimeout(600);
          const bad = await p.locator('#' + lab).evaluate((root, W) => {
            const out: string[] = [], R = root.getBoundingClientRect();
            if (R.right > W + 0.5) out.push(`lab wider than screen ${R.right}`);
            for (const e of root.querySelectorAll<HTMLElement>('p,li,b,span,label,button,output,div,select')) {
              if (e.closest('svg') || e.closest('.s3d') || !e.getClientRects().length || e.classList.contains('s3c-t')) continue;
              const r = e.getBoundingClientRect();
              if (r.right > R.right + 1 || r.left < R.left - 1) out.push(`outside: ${e.tagName}.${e.className} ${(e.textContent || '').slice(0, 30)}`);
              const cs = getComputedStyle(e);
              if (cs.overflowX !== 'visible' && e.scrollWidth > e.clientWidth + 1) out.push(`clipped: ${e.tagName}.${e.className} ${(e.textContent || '').slice(0, 30)}`);
            }
            const st = root.querySelector('.s3d')!.getBoundingClientRect();
            const tags = [...root.querySelectorAll<HTMLElement>('.s3d .s3t:not([hidden]) > span')].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && (e.textContent || '').trim()).map((e) => [e, e.getBoundingClientRect()] as const);
            for (const [e, r] of tags) {
              if (r.left < st.left - 1 || r.right > st.right + 1 || r.top < st.top - 1 || r.bottom > st.bottom + 1) out.push(`3D label cut: ${e.textContent}`);
              if (parseFloat(getComputedStyle(e).fontSize) < 14) out.push(`3D label small: ${e.textContent}`);
            }
            for (let i = 0; i < tags.length; i++) for (let j = i + 1; j < tags.length; j++) {
              const [a, ra] = tags[i]!, [b, rb] = tags[j]!;
              if (ra.left < rb.right - 1 && rb.left < ra.right - 1 && ra.top < rb.bottom - 1 && rb.top < ra.bottom - 1) out.push(`3D labels overlap: ${a.textContent} / ${b.textContent}`);
            }
            return out;
          }, vw.width);
          expect(bad, `${S} ${lang} ${vw.width} step ${step}`).toEqual([]);
        }
      }
      await ctx.close();
    });
  }
});
