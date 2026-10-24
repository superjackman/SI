import { test, expect, type Page } from '@playwright/test';

type Lang = 'zh' | 'en';
const LANGS: Lang[] = ['zh', 'en'];
const STATIONS = ['T1', 'T2', 'T3', 'N', 'T4', 'T4a', 'T4b', 'T5', 'T6', 'T7', 'T8'] as const;
/* drill badges on the live diagrams (T4a, T5, T8 have none on live either) */
/* R22: the bottom bar is the same 5 page buttons on every stop */
const DOCK = ['toc', 'lab', 'quiz', 'prog', 'next'];
/* every station (R13: the T1 diagram drills into all of them, including U…, K1–K5) */
const ALLST = ['T1', 'U', 'Ua', 'Ub', 'Uc', 'Ud', 'Up', 'T2', 'T3', 'N', 'T4', 'T4a', 'T4b', 'T5', 'T6', 'T7', 'T8', 'K1', 'K2', 'K3', 'K4', 'K5'];
const BADGES: Record<string, number> = { T1: 31, T2: 1, T3: 14, N: 7, T4: 4, T4a: 0, T4b: 1, T5: 0, T6: 7, T7: 3, T8: 0 };
type SI = { __si: { state(): { station: string; popup: { id: string } | null }; openInfo(id: string): void } };

/** console errors/warnings and every request that leaves localhost (must be none: no CDNs, fonts or analytics on /next/) */
function watch(page: Page) {
  const errors: string[] = [], external: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('request', (r) => { const u = new URL(r.url()); if (!['localhost', '127.0.0.1'].includes(u.hostname) && u.protocol !== 'data:') external.push(r.url()); });
  return { errors, external };
}
async function open(page: Page, lang: Lang, hash: string) {
  await page.goto(`./?lang=${lang}#${hash}`);
  await page.waitForFunction(() => !!(window as unknown as Partial<SI>).__si);
  await page.locator('section.level.active .pagehead').waitFor();
  await page.locator(`html[data-si-ready="${hash.split(/[/?&]/)[0]}.${lang}"]`).waitFor({ state: 'attached' });
}
const station = (page: Page) => page.evaluate(() => (window as unknown as SI).__si.state().station);
const openCard = (page: Page, id: string) => page.evaluate((id) => (window as unknown as SI).__si.openInfo(id), id);
/** tap the language button and wait until the station is rebuilt in the other language and its labs are mounted again */
const switchLang = (page: Page) => page.evaluate(() => new Promise<void>((res) => {
  const want = document.documentElement.lang === 'en' ? 'zh' : 'en';
  const done = () => { if ((document.documentElement.dataset.siReady ?? '').endsWith('.' + want)) { document.removeEventListener('si-station-ready', done); res(); } };
  document.addEventListener('si-station-ready', done);
  document.getElementById('mLang')!.click();
}));
/** like a reader: open the collapsed card(s) around an element by tapping their headers, then scroll to it */
async function reveal(page: Page, sel: string) {
  for (let i = 0; i < 4; i++) {
    const cardId = await page.evaluate((sel) => {
      const c = document.querySelector(sel)?.closest('.cc-closed') as HTMLElement | null; if (!c) return null;
      if (!c.id) c.id = 'tmp-cc-' + Math.random().toString(36).slice(2); return c.id;
    }, sel);
    if (!cardId) break;
    await page.locator(`#${cardId} > h2 > .cc-h, #${cardId} > h3 > .cc-h`).first().click();
  }
  /* R15: the full text sits in a closed "Go deeper" under the plain opening; open it like a reader would */
  const deep = await page.evaluate((sel) => {
    const d = document.querySelector(sel)?.closest('details.deep:not([open])'); if (!d) return null;
    if (!d.id) d.id = 'tmp-dp-' + Math.random().toString(36).slice(2); return d.id;
  }, sel);
  if (deep) await page.locator(`#${deep} > summary`).click();
  await page.locator(sel).scrollIntoViewIfNeeded();
}
async function noHorizontalOverflow(page: Page) {
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(o.sw, 'horizontal overflow').toBeLessThanOrEqual(o.cw);
}
/** every label inside a diagram box stays inside the box (the English fitter must keep them in) */
async function labelsFit(page: Page) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    document.querySelectorAll('section.level.active .m-stage g.comp').forEach((g) => {
      const r = g.querySelector(':scope>rect.main'); if (!r) return;
      const R = r.getBoundingClientRect(); if (!R.width) return;
      g.querySelectorAll(':scope>text').forEach((t) => {
        if ((t.textContent ?? '').includes('🔍') || !t.textContent?.trim()) return;
        const T = t.getBoundingClientRect(), tol = 1.5;
        if (T.left < R.left - tol || T.right > R.right + tol || T.top < R.top - tol || T.bottom > R.bottom + tol) out.push(((g as HTMLElement).dataset.id ?? '?') + ': ' + t.textContent);
      });
    });
    return out;
  });
  expect(bad, 'labels outside their box').toEqual([]);
}

for (const lang of LANGS) {
  for (const S of STATIONS) {
    test(`${lang} ${S}: live content renders, no errors, no external requests, fits the phone`, async ({ page }) => {
      const w = watch(page);
      await open(page, lang, S);
      await expect(page.locator('html')).toHaveAttribute('lang', lang === 'en' ? 'en' : 'zh-CN');
      await expect(page).toHaveTitle(lang === 'en' ? /^\(Mobile\) .+ · AI, explained plainly$/ : /^（手机版）.+ · 大白话拆解 AI$/);
      await expect(page.locator(`section#${S}.level.active .m-stage .m-dg .m-vw svg`)).toBeVisible();
      expect(await page.locator('#bnav button').evaluateAll((bs) => bs.map((b) => (b as HTMLElement).dataset.bn))).toEqual(DOCK);
      await expect(page.locator('#crumb .chip.on')).toBeVisible();
      expect(await page.locator(`section#${S} .dd-b`).count(), 'drill badges (same as live)').toBe(BADGES[S]);
      await expect(page.locator(`section#${S} .st-fail`)).toHaveCount(0);
      await expect(page.locator(`section#${S} a[href*="#${S}&lang="]`), 'no "open the live page" placeholder').toHaveCount(0);
      await page.waitForTimeout(400);
      await noHorizontalOverflow(page);
      await labelsFit(page);
      if (lang === 'en') {
        const cjk = await page.evaluate(() => {
          const re = /[\u3400-\u9fff]/; const out: string[] = [];
          const tw = document.createTreeWalker(document.getElementById('shellMain')!, NodeFilter.SHOW_TEXT);
          for (let n = tw.nextNode(); n; n = tw.nextNode()) { const p = n.parentElement; if (p?.closest('#mLang,[lang="zh-CN"],script,style')) continue; if (re.test(n.nodeValue ?? '')) out.push((n.nodeValue ?? '').trim().slice(0, 40)); }
          return out;
        });
        expect(cjk, 'Chinese text on the English page').toEqual([]);
      }
      expect(w.errors).toEqual([]);
      expect(w.external).toEqual([]);
    });
  }
}

test('tap a diagram box → popup with sticky drill row; card → card → ↩ back; tabs', async ({ page }) => {
  const w = watch(page);
  await open(page, 'zh', 'T2');
  const comp = page.locator('section#T2 .m-stage .comp[data-id]').first();
  const id = await comp.getAttribute('data-id');
  await comp.click();
  const modal = page.locator('#modal.open');
  await expect(modal).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as unknown as SI).__si.state().popup?.id)).toBe(id);
  await openCard(page, 'llm');
  await expect(modal.locator('.m-head h3')).toContainText('大模型');
  const dd = modal.locator('.m-head .m-dd');
  await expect(dd.locator('.dd-c.pri[data-ddgo="T3"]')).toBeVisible();
  await modal.locator('#modalBox').evaluate((b) => { b.scrollTop = 400; });
  // the sheet may still be finishing its open/card-swap transition: poll until the head settles at the top
  await expect.poll(async () => {
    const hb = await modal.locator('.m-head').boundingBox(), bb = await modal.locator('#modalBox').boundingBox();
    return Math.abs(hb!.y - bb!.y);
  }, { message: 'head stays on top while the body scrolls', timeout: 3000 }).toBeLessThan(10);
  await expect(dd).toBeInViewport();
  await dd.locator('[data-open="tokenizer"]').click();
  await expect(modal.locator('.m-head h3')).toContainText('分词器');
  await expect(modal.locator('.m-back')).toBeVisible();
  await modal.locator('.m-back').click();
  await expect(modal.locator('.m-head h3')).toContainText('大模型');
  await expect(modal.locator('.m-back')).toHaveCount(0);
  const tabs = modal.locator('.m-tabs [role=tab]');
  expect(await tabs.count()).toBeGreaterThan(1);
  await tabs.nth(1).click();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(modal.locator('.m-panel').first()).toBeHidden();
  await modal.locator('.m-head .close').click();
  await expect(page.locator('#modal')).not.toHaveClass(/open/);
  expect(w.errors).toEqual([]);
});

test('⤵ badge drills down a station; ↩ returns to where you were', async ({ page }) => {
  await open(page, 'zh', 'T1');
  const badge = page.locator('section#T1 .m-stage .dd-b').last();
  const to = await badge.getAttribute('data-dd');
  await badge.evaluate((b) => window.scrollTo(0, Math.max(0, b.getBoundingClientRect().top + scrollY - 300)));
  await page.waitForTimeout(200);
  const y0 = await page.evaluate(() => scrollY);
  expect(y0).toBeGreaterThan(100);
  await badge.click();
  await expect.poll(() => station(page)).toBe(to);
  await expect(page.locator('#toast')).toContainText('点 ↩ 返回');
  const back = page.locator('#crumb .cb-back');
  await expect(back).toBeVisible();
  await back.click();
  await expect.poll(() => station(page)).toBe('T1');
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(y0 - 5);
  expect(await page.evaluate(() => scrollY)).toBeLessThan(y0 + 5);
  await expect(page.locator('#crumb .cb-back')).toHaveCount(0);
});

test('drill from a popup (⤵ chip), ↩ goes back and reopens the card', async ({ page }) => {
  await open(page, 'en', 'T2');
  await openCard(page, 'llm');
  await page.locator('#modal.open .m-dd [data-ddgo="T3"]').click();
  await expect.poll(() => station(page)).toBe('T3');
  await expect(page.locator('#modal')).not.toHaveClass(/open/);
  await page.locator('#crumb .cb-back').click();
  await expect.poll(() => station(page)).toBe('T2');
  await expect(page.locator('#modal.open .m-head h3')).toContainText('LLM');
});

test('language switch keeps station, popup and tab; the T1 lab keeps working (zh → en → zh)', async ({ page }) => {
  const w = watch(page);
  await open(page, 'zh', 'T1');
  await reveal(page, '#wNext');
  await page.locator('#wNext').click();
  await expect(page.locator('#wInfo')).toContainText('第 1 /');
  await openCard(page, 'app');
  const tabs = page.locator('#modal.open .m-tabs [role=tab]');
  await tabs.nth(1).click();
  await switchLang(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(await station(page)).toBe('T1');
  await expect(page.locator('#modal.open .m-head h3')).not.toContainText(/[\u3400-\u9fff]/);
  await expect(page.locator('#modal.open .m-tabs [role=tab]').nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#toast')).toContainText('English');
  expect(page.url()).toContain('lang=en');
  await page.locator('#modal.open .m-head .close').click();
  await reveal(page, '#wNext');
  await page.locator('#wNext').click();
  await expect(page.locator('#wInfo')).toContainText(/Step\s+\d+ \//);
  await expect(page.locator('#wStep')).not.toContainText(/[\u3400-\u9fff]/);
  await switchLang(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await page.locator('#wNext').click();
  await expect(page.locator('#wInfo')).toContainText('第');
  expect(w.errors).toEqual([]);
});

test('T2 labs: agent walkthrough + sandbox, still working after a language switch', async ({ page }) => {
  const w = watch(page);
  await open(page, 'zh', 'T2');
  const info = page.locator('#agStepInfo');
  await reveal(page, '#agNext');
  const before = await info.textContent();
  await page.locator('#agNext').click();
  await expect(info).not.toHaveText(before ?? '');
  await reveal(page, '#agTask');
  await expect.poll(() => page.locator('#agTask option').count()).toBeGreaterThan(1);
  await switchLang(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await reveal(page, '#agNext');
  const b2 = await info.textContent();
  await page.locator('#agNext').click();
  await expect(info).not.toHaveText(b2 ?? '');
  await expect(info).not.toContainText(/[\u3400-\u9fff]/);
  await expect.poll(() => page.locator('#agTask option').count()).toBeGreaterThan(1);
  expect(w.errors).toEqual([]);
});

test('T3 labs: relay game, tokenizer, context-window slider survive a language switch', async ({ page }) => {
  const w = watch(page);
  for (const lang of LANGS) {
    await open(page, lang, 'T3');
    const rs = page.locator('#relayStep');
    await reveal(page, '#relayStep');
    const n0 = await page.locator('#sentence .chip').count();
    expect(n0, 'relay sentence rendered at start').toBeGreaterThan(0);
    await rs.click();
    await expect.poll(() => page.locator('#sentence .chip').count()).toBe(n0 + 1);
    const tin = page.locator('#tokIn');
    await reveal(page, '#tokIn');
    await tin.fill(lang === 'en' ? 'hello world' : '今天天气');
    await expect.poll(() => page.locator('#tokOut').evaluate((e) => e.children.length)).toBeGreaterThan(0);
  }
  /* like the live page: sliders / checkboxes / selects keep their value across the switch (free text resets to the sample) */
  await reveal(page, '#cw');
  await page.locator('#cw').evaluate((e: HTMLInputElement) => { e.value = '12'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect(page.locator('#cwV')).toContainText('12');
  await switchLang(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.locator('#cw')).toHaveValue('12');
  await expect(page.locator('#cwV')).toContainText('12');
  await page.locator('#tokIn').fill('今天');
  await expect.poll(() => page.locator('#tokOut').evaluate((e) => e.children.length)).toBeGreaterThan(0);
  await page.locator('#relayStep').click();
  expect(w.errors).toEqual([]);
});

test('quiz answers count and survive a language switch', async ({ page }) => {
  await open(page, 'zh', 'T1');
  const opt = page.locator('#quizT1 .opt[data-q="T1.0"]').first();
  await reveal(page, '#quizT1');
  await opt.click();
  await expect(page.locator('#quizT1 .qsum')).toContainText('已答 1 题');
  await switchLang(page);
  await expect(page.locator('#quizT1 .qsum')).toContainText('1');
  await expect(page.locator('#quizT1 .qsum')).not.toContainText(/[\u3400-\u9fff]/);
});

test('full screen: portrait phone layout, landscape original wide diagram', async ({ page }) => {
  await open(page, 'zh', 'T2');
  await page.locator('section#T2 .m-stage [data-vz=full]').click();
  const fs = page.locator('#dgFull.open');
  await expect(fs).toBeVisible();
  await expect(fs.locator('#fsT')).toHaveText('Agent · 结构图');
  await expect(fs.locator('#fsHost svg')).toBeVisible();
  await fs.locator('[data-fz=close]').click();
  await expect(page.locator('#dgFull')).not.toHaveClass(/open/);
  await expect(page.locator('section#T2 .m-stage .m-vw svg')).toBeVisible();
  const vp = page.viewportSize()!;
  await page.setViewportSize({ width: vp.height, height: vp.width });
  await page.locator('section#T2 .m-stage [data-vz=full]').click();
  await expect(page.locator('#dgFull.open #fsHost svg.fs-orig')).toBeVisible();
  await expect(page.locator('#fsHint')).toContainText('原版宽图');
  await page.keyboard.press('Escape');
  await expect(page.locator('#dgFull')).not.toHaveClass(/open/);
});

test('bottom bar 下一站, drawer, prev/next, search, ☰ map sheet → T5', async ({ page }) => {
  const w = watch(page);
  await open(page, 'zh', 'T2');
  await page.locator('#bnav [data-bn="next"]').click();
  await expect.poll(() => station(page)).toBe('T3');
  expect(new URL(page.url()).hash).toBe('#T3');
  await page.locator('#mMenu').click();
  await expect(page.locator('#mDrawer')).toHaveClass(/open/);
  await page.locator('#mDrawer [data-dw="T2"]').click();
  await expect.poll(() => station(page)).toBe('T2');
  await expect(page.locator('#mDrawer')).not.toHaveClass(/open/);
  await page.locator('#mNext').click();
  await expect.poll(() => station(page)).toBe('T3');
  await page.locator('#mPrev').click();
  await expect.poll(() => station(page)).toBe('T2');
  await page.locator('#mSearch').click();
  await page.locator('#search').fill('注意力');
  const hit = page.locator('#searchRes [data-open]').first();
  await expect(hit).toBeVisible();
  await hit.click();
  await expect(page.locator('#modal.open .m-head h3')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal')).not.toHaveClass(/open/);
  await page.locator('#mMenu').click();
  await page.locator('#dwMore').click();
  await expect(page.locator('#dkSheet[data-k="more"]')).toHaveClass(/open/);
  await page.locator('#shMap summary').click();
  await page.locator('#slotTree [data-go="T5"]').first().click();
  await expect.poll(() => station(page)).toBe('T5');
  await expect(page.locator('#dkSheet')).toHaveCount(0);
  await expect(page.locator('section#T5.level.active .m-stage .m-vw svg')).toBeVisible();
  await expect(page.locator('section#T5 #labQuant')).toBeAttached();
  expect(w.errors).toEqual([]);
});

test('hash routes: live formats and the plan format', async ({ page }) => {
  await page.goto('./#/T2?lang=en');
  await page.locator('section#T2 .pagehead').waitFor();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  // in-page hash change with a lang token switches language (live lang.js), then survives a reload
  await page.goto('./#lang=zh&T3');
  await page.locator('section#T3 .pagehead').waitFor();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await page.reload();
  await page.locator('section#T3 .pagehead').waitFor();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await page.goto('./?lang=zh#T3/llm');
  await expect(page.locator('#modal.open .m-head h3')).toContainText('大模型');
});

test('loading skeleton paints before any script runs', async ({ page }) => {
  await page.route('**/assets/*.js', (r) => new Promise((res) => setTimeout(() => res(r.continue()), 800)));
  await page.goto('./?lang=zh#T1', { waitUntil: 'commit' });
  await expect(page.locator('#mBoot')).toBeVisible();
  await page.locator('section#T1 .pagehead').waitFor({ timeout: 15000 });
  await expect(page.locator('#mBoot')).toHaveCount(0);
});

/** a lab island reacts: tapping a control changes its card (DOM or canvas pixels) */
async function labReacts(page: Page, sel: string) {
  await reveal(page, sel);
  const snap = () => page.evaluate((sel) => {
    const c = (document.querySelector(sel)!.closest('.card') ?? document.querySelector(sel)!.parentElement)!;
    return c.innerHTML.replace(/\s+/g, ' ') + [...c.querySelectorAll('canvas')].map((k) => (k as HTMLCanvasElement).toDataURL()).join('');
  }, sel);
  const before = await snap();
  await page.locator(sel).click();
  await expect.poll(snap, { message: `${sel} changes its lab`, timeout: 5000 }).not.toBe(before);
}
const LAB_ACTIONS: Array<[string, string[]]> = [
  ['N', ['#acPick button:nth-child(3)', '#acShuf', '#tnRun']],
  ['T4', ['#bkAttn']],
  ['T4a', ['#maskToggle']],
  ['T4b', ['#ffnWords button:nth-child(2)', '#dotStep']],
  ['T5', ['#spStep', '#lbOn']],
  ['T6', ['#clipStep', '#vRegen']],
  ['T7', ['#tRun', '#prefA']],
];
for (const [S, acts] of LAB_ACTIONS) {
  test(`${S} labs react to taps in zh and after switching to en`, async ({ page }) => {
    const w = watch(page);
    await open(page, 'zh', S);
    for (const a of acts) await labReacts(page, a);
    await switchLang(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    for (const a of acts) await labReacts(page, a);
    expect(w.errors).toEqual([]);
  });
}

test('N, T4, T5, T7 draw their live entry labs (live go() redraw) without being scrolled to', async ({ page }) => {
  for (const [S, id] of [['N', 'acC'], ['N', 'tnC'], ['T5', 'q2C'], ['T7', 'ftC1']] as const) {
    await open(page, 'zh', S);
    await expect.poll(() => page.evaluate((id) => (document.getElementById(id) as HTMLCanvasElement | null)?.width ?? 0, id), { message: id }).toBeGreaterThan(300);
  }
});

test('every station with drill badges: a badge lands on its target station', async ({ page }) => {
  for (const S of STATIONS) {
    if (!BADGES[S]) continue;
    await open(page, 'zh', S);
    const n = await page.locator(`section#${S} .dd-b`).count();
    const targets = await page.locator(`section#${S} .dd-b`).evaluateAll((bs) => bs.map((b) => b.getAttribute('data-dd')));
    for (const t of targets) expect(ALLST, `${S} badge target`).toContain(t);
    /* tap the last badge (often in a collapsed card further down) like a reader would */
    await page.locator(`section#${S} .dd-b`).nth(n - 1).evaluate((b) => { b.id = 'e2e-dd'; });
    await reveal(page, '#e2e-dd');
    const b = page.locator('#e2e-dd');
    const to = await b.getAttribute('data-dd');
    await b.click();
    await expect.poll(() => station(page)).toBe(to);
    await expect(page.locator(`section#${to}.level.active .m-stage .m-vw svg`)).toBeVisible();
  }
});

test('popup on a new station (T6) with drill chip to another station', async ({ page }) => {
  const w = watch(page);
  await open(page, 'en', 'T6');
  const comp = page.locator('section#T6 .m-stage .comp[data-id]').first();
  const id = await comp.getAttribute('data-id');
  await comp.click();
  await expect(page.locator('#modal.open')).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as unknown as SI).__si.state().popup?.id)).toBe(id);
  await expect(page.locator('#modal.open .m-head h3')).not.toContainText(/[\u3400-\u9fff]/);
  expect(w.errors).toEqual([]);
});

test('T8: progress grid, cross-station lab jump, reset', async ({ page }) => {
  const w = watch(page);
  await open(page, 'zh', 'T1');
  await open(page, 'zh', 'T8');
  await reveal(page, '#progDetail');
  await expect(page.locator('#progDetail')).toContainText('去这一站');
  await expect(page.locator('#progDetail')).toContainText('✅');
  await page.locator('section#T8 [data-jump][data-lv]:not([data-lv="T8"])').first().evaluate((e) => { e.id = 'e2e-jump'; });
  await reveal(page, '#e2e-jump');
  const jump = page.locator('#e2e-jump');
  const [id, lv] = [await jump.getAttribute('data-jump'), await jump.getAttribute('data-lv')];
  await jump.click();
  await expect.poll(() => station(page)).toBe(lv);
  await expect(page.locator(`section#${lv} [id="${id}"]`)).toBeInViewport({ timeout: 5000 });
  await open(page, 'zh', 'T8');
  await reveal(page, '#progReset');
  await page.locator('#progReset').click();
  await expect(page.locator('#toast')).toContainText('进度和成绩已清空');
  expect(w.errors).toEqual([]);
});
