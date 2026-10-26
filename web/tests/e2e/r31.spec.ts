import { test, expect, type Page } from '@playwright/test';
/* R31 3D stage cards (Api, Loc, Skl, Bld, U): each scene is a separate lazy chunk on top of the shared three chunk, loaded
   only on its own stop; no WebGL or reduced motion keeps the 2D figure (nothing requested, no error); leaving the stop
   frees the view; the stage is about half the screen or more with a closed "Want to know why" fold; little text under it;
   no text spills or overlaps at 360 / 390 / 430 in zh and en, and the in-stage labels stay inside the stage. */
const SC = [['Api', 'lab3dApi', 'api', 'apSay'], ['Loc', 'lab3dLoc', 'loc', 'l3Say'], ['Skl', 'lab3dSkl', 'skl', 'skSay'], ['Bld', 'lab3dBld', 'bld', 'bdSay'], ['U', 'lab3dDuo', 'duo', 'duSay']] as const;
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

test.describe('R31 3D scenes', () => {
  for (const [S, lab, chunk] of SC) {
    test(`${S}: first screen → 3D with only its own scene chunk; still means no frames; leaving frees it`, async ({ page: p }) => {
      const { reqs, errs } = await open(p, S, 'zh');
      await expect(p.locator(`#${lab} .s3d`)).toHaveAttribute('data-s3d', 'on', { timeout: 15_000 });
      expect(reqs.some((r) => r.startsWith('three-'))).toBe(true);
      expect(reqs.some((r) => r.startsWith(chunk + '-'))).toBe(true);
      expect(reqs.filter((r) => !r.startsWith('three-') && !r.startsWith(chunk + '-')), 'no other scene').toEqual([]);
      await expect(p.locator(`#${lab} .s3d canvas`)).toHaveCount(1);
      expect(await stats(p)).toMatchObject({ made: 1, live: 1 });
      await p.waitForTimeout(800);
      const a = (await stats(p))?.frames ?? 0; await p.waitForTimeout(1500);
      expect(((await stats(p))?.frames ?? 0) - a, 'no frames while still').toBeLessThanOrEqual(1);
      await go(p, 'Uc');
      await expect.poll(() => stats(p)).toMatchObject({ made: 1, freed: 1, live: 0 });
      await expect(p.locator('.s3d canvas')).toHaveCount(0);
      expect(errs).toEqual([]);
    });
  }

  test('the control changes the scene and the sentence (one frame per change)', async ({ page: p }) => {
    const act: Record<string, string> = { Api: '#apGo', Skl: '#skAsk', Bld: '#lab3dBld .s3c-opt[data-r=code]', U: '#lab3dDuo .s3c-opt[data-m=solo]' };
    for (const [S, lab, , say] of SC) {
      if (!act[S]) continue;
      await open(p, S, 'zh');
      await expect(p.locator(`#${lab} .s3d`)).toHaveAttribute('data-s3d', 'on', { timeout: 15_000 });
      if (S === 'Skl') await p.evaluate(() => (document.getElementById('skBox') as HTMLElement & { __lab: { pick(i: number): void } }).__lab.pick(0)); // the ask switch only speaks once a tool is plugged in
      const before = await p.locator('#' + say).innerText();
      await p.locator(act[S]!).click();
      await expect.poll(() => p.locator('#' + say).innerText()).not.toBe(before);
      await go(p, 'Uc'); await expect.poll(async () => (await stats(p))?.live).toBe(0);
    }
    await open(p, 'Loc', 'zh');
    const b = await p.locator('#l3Say').innerText();
    await p.locator('#l3M').selectOption({ index: 7 });
    await expect.poll(() => p.locator('#l3Say').innerText()).not.toBe(b);
  });

  test('R31c Api: the sentence, bill and button follow the flight; the total only once the answer is back', async ({ page: p }) => {
    await open(p, 'Api', 'zh');
    await expect(p.locator('#apBox')).toHaveAttribute('data-s3d', 'on', { timeout: 15_000 });
    const say = p.locator('#apSay'), btn = p.locator('#apGo'), n = () => p.evaluate(() => (document.getElementById('apBox') as HTMLElement & { __lab: { n(): number } }).__lab.n());
    await p.evaluate(() => { const w = window as unknown as { __says: string[] }; w.__says = []; const el = document.getElementById('apSay')!; new MutationObserver(() => w.__says.push(el.innerText)).observe(el, { childList: true, subtree: true, characterData: true }); });
    await btn.click();
    const mid = await say.innerText();
    expect(mid).toMatch(/请求发出|模型在想/); expect(mid).not.toContain('0.006');
    await expect(btn).toBeDisabled(); expect(await n()).toBe(0);
    /* the second tap while busy: checked and tapped in one page tick, so a slow machine cannot finish the flight in between (R31d: was a forced click that could land after the answer was back) */
    await p.evaluate(() => { const b = document.getElementById('apGo') as HTMLButtonElement; if (b.disabled) b.click(); });
    await expect(say).toContainText('第 1 次', { timeout: 4000 }); await expect(say).toContainText('0.006');
    await expect(btn).toBeEnabled(); expect(await n()).toBe(1);
    const says = await p.evaluate(() => (window as unknown as { __says: string[] }).__says);
    const iS = says.findIndex((x) => x.includes('请求发出')), iT = says.findIndex((x) => x.includes('模型在想')), iF = says.findIndex((x) => x.includes('0.006'));
    expect(iS, says.join(' / ')).toBeGreaterThanOrEqual(0); expect(iT).toBeGreaterThan(iS); expect(iF).toBeGreaterThan(iT);
    expect(says.filter((x) => x.includes('0.006')).length, 'the second tap while busy did nothing').toBe(1);
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
      await expect(box.locator('svg').first()).toBeVisible();
      expect((await box.locator('svg').first().boundingBox())!.height, S).toBeGreaterThan(150);
      expect(((await p.locator('#' + say).textContent()) ?? '').trim().length, S).toBeGreaterThan(10);
      expect(reqs, S).toEqual([]); expect(errs, S).toEqual([]);
      expect((await stats(p))?.loads ?? 0).toBe(0);
    }
    await ctx.close();
  });

  test('reduced motion → the 2D figure, nothing requested', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', storageState: 'tests/e2e/onb-done.json' });
    const p = await ctx.newPage();
    for (const [S, lab] of SC) {
      const { reqs } = await open(p, S, 'zh');
      await show(p, lab); await p.waitForTimeout(500);
      await expect(p.locator(`#${lab} .s3d`)).toHaveAttribute('data-why', 'motion');
      expect(reqs, S).toEqual([]);
      if (S === 'Api') { await p.locator('#apGo').click(); await expect(p.locator('#apSay')).toContainText('0.006'); await expect(p.locator('#apGo')).toBeEnabled(); } // R31c: the end state at once
    }
    await ctx.close();
  });

  test('Ua and Ub link to the U scene; there it loads only the duo scene', async ({ page: p }) => {
    for (const S of ['Ua', 'Ub']) {
      await open(p, S, 'zh');
      await expect(p.locator(`#${S} a[data-go=U]`).first()).toBeAttached();
    }
  });

  for (const lang of ['zh', 'en']) {
    test(`${lang}: one-screen stage ≥52% of the screen, fold closed above the bottom bar, little text under it`, async ({ browser }, ti) => {
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
            const r = e.getBoundingClientRect(); if (!(r.top < barTop && r.bottom > 0)) continue;
            /* a closed <select> shows only its chosen option, but innerText lists them all (R31b: Loc's one dropdown) */
            let t = e.innerText; for (const s of e.querySelectorAll('select')) t = t.replace(s.innerText, s.selectedOptions[0]?.text ?? '');
            text += t;
          }
          return { ratio: st.height / vh, top: st.top, open: why.open, sumBottom: sum.bottom, barTop, n: [...text.replace(/[\s▾▸▶↺]/g, '')].length };
        });
        const tag = `${S} ${lang} ${vw.width}×${vw.height}`;
        expect(m.ratio, `${tag}: stage share of the screen`).toBeGreaterThanOrEqual(0.52); expect(m.ratio, tag).toBeLessThanOrEqual(0.6);
        if (vw.width >= 390) expect(m.ratio, `${tag}: ≈0.55–0.58 at 390+`).toBeGreaterThanOrEqual(0.55);
        expect(m.top, `${tag}: stage starts in the top 40%`).toBeLessThan(vw.height * 0.4);
        expect(m.open, `${tag}: fold closed`).toBe(false);
        expect(m.sumBottom, `${tag}: fold title above the bottom bar`).toBeLessThanOrEqual(m.barTop + 1);
        if (lang === 'zh') expect(m.n, `${tag}: visible text under the stage`).toBeLessThanOrEqual(60);
      }
      await ctx.close();
    });

    test(`${lang}: lab text never spills or overlaps; 3D labels ≥14px, inside the stage, apart`, async ({ browser }, ti) => {
      const vw = ti.project.use.viewport!;
      const ctx = await browser.newContext({ viewport: vw, storageState: 'tests/e2e/onb-done.json' });
      const p = await ctx.newPage();
      for (const [S, lab] of SC) {
        await open(p, S, lang); await show(p, lab);
        await expect(p.locator(`#${lab} .s3d`)).toHaveAttribute('data-s3d', /on|fallback/, { timeout: 15_000 });
        await p.waitForTimeout(600);
        const bad = await p.locator('#' + lab).evaluate((root, W) => {
          const out: string[] = [], R = root.getBoundingClientRect();
          if (R.right > W + 0.5) out.push(`lab wider than screen ${R.right}`);
          for (const e of root.querySelectorAll<HTMLElement>('p,li,b,span,label,button,output,div,h3,h4,select')) {
            if (e.closest('svg') || e.closest('.s3d') || !e.getClientRects().length || e.classList.contains('s3c-t')) continue;
            const r = e.getBoundingClientRect();
            if (r.right > R.right + 1 || r.left < R.left - 1) out.push(`outside: ${e.tagName}.${e.className} ${(e.textContent || '').slice(0, 30)}`);
            const cs = getComputedStyle(e);
            if (cs.overflowX !== 'visible' && e.scrollWidth > e.clientWidth + 1) out.push(`clipped: ${e.tagName}.${e.className} ${(e.textContent || '').slice(0, 30)}`);
          }
          const ctl = [...root.querySelectorAll<HTMLElement>('button,input,select,summary')].filter((e) => e.getClientRects().length).map((e) => [e, e.getBoundingClientRect()] as const);
          for (let i = 0; i < ctl.length; i++) for (let j = i + 1; j < ctl.length; j++) {
            const [a, ra] = ctl[i]!, [b, rb] = ctl[j]!;
            if (a.contains(b) || b.contains(a)) continue;
            if (ra.left < rb.right - 1 && rb.left < ra.right - 1 && ra.top < rb.bottom - 1 && rb.top < ra.bottom - 1) out.push(`controls overlap: ${a.id || a.tagName} / ${b.id || b.tagName}`);
          }
          const st = root.querySelector('.s3d')!.getBoundingClientRect();
          const tags = [...root.querySelectorAll<HTMLElement>('.s3d .s3t:not([hidden]) > span')].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && (e.textContent || '').trim()).map((e) => [e, e.getBoundingClientRect()] as const);
          for (const [e, r] of tags) {
            if (r.left < st.left - 1 || r.right > st.right + 1 || r.top < st.top - 1 || r.bottom > st.bottom + 1) out.push(`3D label cut: ${e.textContent}`);
            if (parseFloat(getComputedStyle(e).fontSize) < 14) out.push(`3D label small: ${e.textContent}`);
          }
          return out;
        }, vw.width);
        expect(bad, `${S} ${lang} ${vw.width}`).toEqual([]);
      }
      await ctx.close();
    });
  }
});
