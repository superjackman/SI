/* M2 "how to use an agent": stops U/Ua/Ub/Uc/Ud in both languages on 360/390/430, the four labs, quiz scoring,
   drill-down from usage parts into the principles and the links back up, navigation placement, analytics paths/events. */
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolveBase } from '../../base.config.mjs';

type Lang = 'zh' | 'en';
type SI = { __si: { state(): { station: string; popup: { id: string } | null }; openInfo(id: string): void; go(s: string): void } };
const M2 = ['U', 'Ua', 'Ub', 'Uc', 'Ud'] as const;
const LABS: Record<string, string[]> = { U: ['labPick'], Ua: ['labSession', 'labClick'], Ub: ['labFan', 'labCron'], Uc: ['labCtxLoad'], Ud: ['labPrompt'] };
const KEY = (JSON.parse(readFileSync(new URL('../../src/legacy/gen/qkey.json', import.meta.url), 'utf8')) as { key: Record<string, number[]> }).key;
const QN: Record<string, number> = { U: 3, Ua: 4, Ub: 7, Uc: 6, Ud: 5 }; // R10: +3 Ub, +2 Uc, +1 Ud

function watch(page: Page) {
  const errors: string[] = [], external: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('request', (r) => { const u = new URL(r.url()); if (!['localhost', '127.0.0.1'].includes(u.hostname) && u.protocol !== 'data:') external.push(r.url()); });
  return { errors, external };
}
async function open(page: Page, lang: Lang, S: string) {
  await page.goto(`./?lang=${lang}#${S}`);
  await page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached' });
  await expect(page.locator('section.level.active .pagehead')).toBeVisible();
}
const station = (page: Page) => page.evaluate(() => (window as unknown as SI).__si.state().station);
const popupId = (page: Page) => page.evaluate(() => (window as unknown as SI).__si.state().popup?.id ?? null);
const openCard = (page: Page, id: string) => page.evaluate((id) => (window as unknown as SI).__si.openInfo(id), id);
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
async function noHorizontalOverflow(page: Page) {
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(o.sw, 'horizontal overflow').toBeLessThanOrEqual(o.cw);
}
/** diagram: every label stays in its box, and no two boxes' labels overlap each other */
async function diagramClean(page: Page) {
  const r = await page.evaluate(() => {
    const out: string[] = [], boxes: { id: string; R: DOMRect }[] = [];
    document.querySelectorAll('section.level.active .m-stage g.comp').forEach((g) => {
      const rect = g.querySelector(':scope>rect.main'); if (!rect) return;
      const R = rect.getBoundingClientRect(); if (!R.width) return;
      const id = (g as HTMLElement).dataset.id ?? '?'; boxes.push({ id, R });
      g.querySelectorAll(':scope>text').forEach((t) => {
        if ((t.textContent ?? '').includes('🔍') || !t.textContent?.trim()) return;
        const T = t.getBoundingClientRect(), tol = 1.5;
        if (T.left < R.left - tol || T.right > R.right + tol || T.top < R.top - tol || T.bottom > R.bottom + tol) out.push('outside ' + id + ': ' + t.textContent);
      });
    });
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!.R, b = boxes[j]!.R;
      const ov = Math.min(a.right, b.right) - Math.max(a.left, b.left), oh = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      const inside = (x: DOMRect, y: DOMRect) => x.left >= y.left - 1 && x.right <= y.right + 1 && x.top >= y.top - 1 && x.bottom <= y.bottom + 1;
      if (ov > 1 && oh > 1 && !inside(a, b) && !inside(b, a)) out.push('boxes overlap ' + boxes[i]!.id + ' / ' + boxes[j]!.id);
    }
    return out;
  });
  expect(r, 'diagram layout').toEqual([]);
}
const cjkOnPage = (page: Page) => page.evaluate(() => {
  const re = /[\u3400-\u9fff]/; const out: string[] = [];
  const tw = document.createTreeWalker(document.getElementById('shellMain')!, NodeFilter.SHOW_TEXT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) { const p = n.parentElement; if (p?.closest('#mLang,[lang="zh-CN"],script,style')) continue; if (re.test(n.nodeValue ?? '')) out.push((n.nodeValue ?? '').trim().slice(0, 40)); }
  return out;
});

for (const lang of ['zh', 'en'] as Lang[]) {
  for (const S of M2) {
    test(`${lang} ${S}: renders, diagram clean, lab + quiz present, bottom-bar badges, fits the phone, no errors / external requests`, async ({ page }) => {
      const w = watch(page);
      await open(page, lang, S);
      await expect(page.locator(`section#${S}.level.active .m-stage svg`).first()).toBeVisible();
      await expect(page.locator(`section#${S} .st-fail`)).toHaveCount(0);
      await expect(page.locator(`section#${S} .tag.demo`).first()).toHaveText(lang === 'zh' ? '示意' : 'Illustrative');
      const lab = LABS[S] ?? [];
      await expect(page.locator(`section#${S} .card.lab`)).toHaveCount(lab.length);
      for (const id of lab) await expect(page.locator(`#${id}`)).toBeAttached();
      await expect(page.locator('#bnav [data-bn="lab"]')).toHaveAttribute('data-st', lab.length ? '' : 'off');
      await expect(page.locator('#bnav [data-bn="quiz"]')).not.toHaveAttribute('data-st', 'off');
      await reveal(page, `#quiz${S}`);
      await expect(page.locator(`#quiz${S} .qz`)).toHaveCount(QN[S]!);
      await expect(page.locator(`section#${S} .card.m3ph`)).toHaveCount(0);
      await page.waitForTimeout(300);
      await noHorizontalOverflow(page);
      await diagramClean(page);
      if (lang === 'en') expect(await cjkOnPage(page), 'Chinese text on the English page').toEqual([]);
      expect(w.errors).toEqual([]);
      expect(w.external).toEqual([]);
    });
  }
}

test('navigation: U stops in the all-stops list, not the bottom bar; 下一站 and ▶ walk T1 → U → Ua … Ud → Up → T2; ◀ back', async ({ page }) => {
  await open(page, 'zh', 'T1');
  for (const s of M2) await expect(page.locator(`#bnav [data-bn="${s}"]`)).toHaveCount(0);
  await page.locator('#bnav [data-bn="next"]').click();
  await expect.poll(() => station(page)).toBe('U');
  await page.locator('#mMenu').click();
  await expect(page.locator('#mDrawer')).toHaveClass(/open/);
  for (const s of M2) await expect(page.locator(`#mDrawer [data-dw="${s}"], #mDrawer [data-go="${s}"]`).first()).toBeAttached();
  await page.locator('#mDrawer [data-dw="T1"], #mDrawer [data-go="T1"]').first().click();
  await expect.poll(() => station(page)).toBe('T1');
  for (const s of [...M2, 'Up', 'T2']) { await page.locator('#mNext').click(); await expect.poll(() => station(page)).toBe(s); }
  for (const s of ['Up', 'Ud', 'Uc', 'Ub', 'Ua', 'U', 'T1']) { await page.locator('#mPrev').click(); await expect.poll(() => station(page)).toBe(s); }
});

test('the U diagram: tap a group box → its popup → ⤵ chip zooms into the sub-stop; ↩ returns', async ({ page }) => {
  await open(page, 'zh', 'U');
  await page.locator('section#U .m-stage .comp[data-id="uWith"]').first().click();
  await expect.poll(() => popupId(page)).toBe('uWith');
  const modal = page.locator('#modal.open');
  await expect(modal.locator('.m-head h3')).toContainText('跟它一起干');
  await modal.locator('.m-dd .dd-c.pri[data-ddgo="Ua"]').click();
  await expect.poll(() => station(page)).toBe('Ua');
  await page.locator('#crumb .cb-back').click();
  await expect.poll(() => station(page)).toBe('U');
});

for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang} drill-down and back links: usage part → principle part (dn) → back up to the usage part (use) → its stop`, async ({ page }) => {
    const w = watch(page);
    await open(page, lang, 'Ua');
    await openCard(page, 'uChat');
    const modal = page.locator('#modal.open');
    await expect(modal.locator('.m-head h3')).toHaveText(/对话助手|Chat assistant/);
    for (const d of ['loop', 'memory', 'ctxwin']) await expect(modal.locator(`.m-dd .dd-c.dn[data-open="${d}"]`)).toBeVisible();
    await expect(modal.locator('.m-dd .dd-c.upc[data-open="uWith"]')).toBeVisible();
    await modal.locator('.m-dd .dd-c.dn[data-open="memory"]').click();
    await expect.poll(() => popupId(page)).toBe('memory');
    await expect(modal.locator('.m-back')).toBeVisible();
    /* the principle card links back up to every usage part that relies on it */
    await expect(modal.locator('.m-dd .dd-c.use[data-open="uChat"]')).toBeVisible();
    await expect(modal.locator('.m-dd .dd-c.use[data-open="uCtx"]')).toBeVisible();
    await modal.locator('.m-back').click();
    await expect.poll(() => popupId(page)).toBe('uChat');
    /* from T2 (the agent stop): the loop card links up into the M2 hub, the hub zooms into U */
    await page.keyboard.press('Escape');
    await open(page, lang, 'T2');
    await openCard(page, 'loop');
    await modal.locator('.m-dd .dd-c.use[data-open="uHub"]').click();
    await expect.poll(() => popupId(page)).toBe('uHub');
    /* a card on another stop drills there (with ↩ back), like every other cross-stop card */
    await expect.poll(() => station(page)).toBe('U');
    await expect(modal.locator('.m-dd .dd-c.pri[data-ddgo="Ua"], .m-dd [data-open="uWith"]').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await page.locator('#crumb .cb-back').click();
    await expect.poll(() => station(page)).toBe('T2');
    /* from T1: the user box links to the hub too */
    await open(page, lang, 'T1');
    await openCard(page, 'user');
    await expect(page.locator('#modal.open .m-dd .dd-c.use[data-open="uHub"]')).toBeVisible();
    /* T3-side part: MCP (on T2) → uMcp (Uc) and the drill row offers ⤵ T3 principles from uCtx */
    await openCard(page, 'uCtx');
    await expect(page.locator('#modal.open .m-dd .dd-c.dn[data-open="ctxwin"]')).toBeVisible();
    await expect(page.locator('#modal.open .m-dd .dd-c.dn[data-open="tokenizer"]')).toBeVisible();
    expect(w.errors).toEqual([]);
  });
}

test('search finds the usage parts (zh + en) and opens them', async ({ page }) => {
  await open(page, 'zh', 'T1');
  await page.locator('#mSearch').click();
  await page.locator('#search').fill('对话助手');
  await page.locator('#searchRes [data-open="uChat"]').click();
  await expect.poll(() => popupId(page)).toBe('uChat');
  await page.keyboard.press('Escape');
  await page.locator('#mSearch').click();
  await page.locator('#search').fill('Skills');
  await expect(page.locator('#searchRes [data-open="uSkill"]')).toBeVisible();
});

for (const lang of ['zh', 'en'] as Lang[]) {
  const tr = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  test(`${lang} labPick: presets and traits → recommendation; risky adds a confirmation; the result opens its part`, async ({ page }) => {
    const w = watch(page);
    await open(page, lang, 'U');
    await reveal(page, '#labPick');
    await page.locator('#pkPre [data-pre="fix"]').click();
    await expect(page.locator('#pkOut')).toHaveAttribute('data-way', 'uIde');
    await expect(page.locator('#pkOut .u-confirm')).toHaveCount(0);
    await page.locator('#pkPre [data-pre="report"]').click();
    await expect(page.locator('#pkOut')).toHaveAttribute('data-way', 'uRoutine');
    await page.locator('#pkFeat input[data-k="risk"]').check();
    await expect(page.locator('#pkOut')).toHaveAttribute('data-way', 'uRoutine');
    await expect(page.locator('#pkOut .u-confirm')).toBeVisible();
    await page.locator('#pkPre [data-pre="tests"]').click();
    await expect(page.locator('#pkOut')).toHaveAttribute('data-way', 'uMulti');
    await expect(page.locator('#pkFeat input[data-k="split"]')).toBeChecked();
    await page.locator('#pkFeat input[data-k="split"]').uncheck();
    await expect(page.locator('#pkOut')).toHaveAttribute('data-way', 'uBg');
    await page.locator('#pkOut [data-open]').first().click();
    await expect.poll(() => popupId(page)).toBe('uBg');
    await expect(page.locator('#modal.open .m-head h3')).toContainText(tr('后台', 'ackground'));
    expect(w.errors).toEqual([]);
  });

  test(`${lang} labSession: permission levels decide the stops; reject ends; auto-run warns and finishes`, async ({ page }) => {
    const w = watch(page);
    await open(page, lang, 'Ua');
    await reveal(page, '#labSession');
    await page.locator('#ssPerm').selectOption('ask');
    const log = page.locator('#ssLog li');
    await expect(log).toHaveCount(1);
    let asks = 0;
    for (let i = 0; i < 20; i++) {
      if (await page.locator('#ssAsk').isVisible()) { asks++; await page.locator('#ssYes').click(); continue; }
      if (await log.last().evaluate((l) => l.classList.contains('ok') || l.classList.contains('bad'))) break;
      await page.locator('#ssNext').click();
    }
    expect(asks).toBe(3);
    await expect(log.last()).toHaveClass(/ok/);
    await expect(page.locator('#ssStat')).toContainText(tr('问了你 3 次', '3 time(s)'));
    /* edits free: only the test command asks; rejecting it ends the session */
    await page.locator('#ssPerm').selectOption('edit');
    await expect(log).toHaveCount(1);
    for (let i = 0; i < 10 && !(await page.locator('#ssAsk').isVisible()); i++) await page.locator('#ssNext').click();
    await expect(page.locator('#ssAskT')).toBeVisible();
    await page.locator('#ssNo').click();
    await expect(page.locator('#ssAsk')).toBeHidden();
    await expect(page.locator('#ssStat')).toContainText(tr('问了你 1 次', '1 time(s)'));
    /* no tests: it ends "unverified" */
    await page.locator('#ssTest').uncheck();
    await page.locator('#ssPerm').selectOption('auto');
    await expect(page.locator('#ssWarn')).toBeVisible();
    await page.locator('#ssAuto').click();
    await expect(log.last()).toHaveClass(/bad/, { timeout: 8000 });
    await expect(page.locator('#ssStat')).toContainText(tr('问了你 0 次', '0 time(s)'));
    /* auto with asks: pauses at the command, resumes after Allow */
    await page.locator('#ssTest').check();
    await page.locator('#ssPerm').selectOption('edit');
    await expect(page.locator('#ssWarn')).toBeHidden();
    await page.locator('#ssAuto').click();
    await expect(page.locator('#ssAsk')).toBeVisible({ timeout: 8000 });
    await page.locator('#ssYes').click();
    await expect(log.last()).toHaveClass(/ok/, { timeout: 8000 });
    await page.locator('#ssReset').click();
    await expect(log).toHaveCount(1);
    expect(w.errors).toEqual([]);
  });

  test(`${lang} labCtxLoad: all-at-once vs on-demand, warning above a quarter, one call loads one manual`, async ({ page }) => {
    const w = watch(page);
    await open(page, lang, 'Uc');
    await reveal(page, '#labCtxLoad');
    await expect(page.locator('#clStat')).toHaveAttribute('data-pct', '12.5');
    await page.locator('#clN').selectOption('30');
    await expect(page.locator('#clStat')).toHaveAttribute('data-pct', '37.5');
    await expect(page.locator('#clStat')).toHaveClass(/warn/);
    await page.locator('#clMode').selectOption('lazy');
    await expect(page.locator('#clStat')).toHaveAttribute('data-pct', '2.8');
    await expect(page.locator('#clStat')).not.toHaveClass(/warn/);
    await page.locator('#clCall').click();
    await expect(page.locator('#clOut')).toBeVisible();
    await expect(page.locator('#clOut')).toContainText('{');
    await expect(page.locator('#clStat')).toHaveAttribute('data-pct', '4.1');
    await expect(page.locator('#clBar > *')).not.toHaveCount(0);
    await page.locator('#clReset').click();
    await expect(page.locator('#clStat')).toHaveAttribute('data-pct', '12.5');
    await expect(page.locator('#clOut')).toBeHidden();
    await noHorizontalOverflow(page);
    expect(w.errors).toEqual([]);
  });

  test(`${lang} labPrompt: the four switches raise the score, irrelevant documents lower it`, async ({ page }) => {
    const w = watch(page);
    await open(page, lang, 'Ud');
    await reveal(page, '#labPrompt');
    await expect(page.locator('#prOut')).toHaveAttribute('data-score', '10');
    await page.locator('#prFlags input[data-k="goal"]').check();
    await expect(page.locator('#prOut')).toHaveAttribute('data-score', '40');
    for (const k of ['background', 'constraints', 'acceptance']) await page.locator(`#prFlags input[data-k="${k}"]`).check();
    await expect(page.locator('#prOut')).toHaveAttribute('data-score', '100');
    await page.locator('#prDocs').fill('3');
    await expect(page.locator('#prDocsV')).toHaveText('3');
    await expect(page.locator('#prOut')).toHaveAttribute('data-score', '64');
    await expect(page.locator('#prBar > *')).not.toHaveCount(0);
    await noHorizontalOverflow(page);
    expect(w.errors).toEqual([]);
  });
}

test('quiz scoring on the M2 stops: right / wrong answers count per stop and in the overall progress', async ({ page }) => {
  await open(page, 'zh', 'U');
  await reveal(page, '#quizU');
  const key = KEY.U!;
  await page.locator(`#quizU .opt[data-q="U.0"][data-o="${key[0]}"]`).click();
  await page.locator(`#quizU .opt[data-q="U.1"][data-o="${(key[1]! + 1) % 4}"]`).click();
  await page.locator(`#quizU .opt[data-q="U.2"][data-o="${key[2]}"]`).click();
  await expect(page.locator('#quizU .qsum')).toContainText('本页 3 题，已答 3 题，答对 2 题');
  await expect(page.locator('#quizU .opt.right')).toHaveCount(3);
  await expect(page.locator('#quizU .opt.wrong')).toHaveCount(1);
  await page.locator('#bnav [data-bn="prog"]').click();
  await expect(page.locator('#dkSheet #shProgTxt')).toContainText('测验答对 2 / 89（已答 3）');
  await page.keyboard.press('Escape');
  /* every M2 stop's key matches its rendered options (all right → full marks), in English too */
  for (const S of ['Ua', 'Ub', 'Uc', 'Ud']) {
    await open(page, 'en', S);
    await reveal(page, `#quiz${S}`);
    for (let i = 0; i < KEY[S]!.length; i++) await page.locator(`#quiz${S} .opt[data-q="${S}.${i}"][data-o="${KEY[S]![i]}"]`).click();
    await expect(page.locator(`#quiz${S} .qsum`)).toContainText(`answered ${QN[S]} , correct ${QN[S]}`);
  }
  await page.locator(`#quizUd [data-qreset="Ud"]`).click();
  await expect(page.locator('#quizUd .qsum')).toContainText('answered 0');
});

/* analytics on a real-looking host (needs the repo layout under /SI/): page path /<lang>/<stop>, lab and quiz events */
const BASE: string = resolveBase();
const REPO = process.env.SI_E2E_SERVE === 'repo' && BASE === '/SI/';
const GC = 'https://superjackman-si.goatcounter.com/count';
test('analytics: M2 stops count as /zh/U …, lab-labPick and quiz-U events (intercepted, not sent)', async ({ playwright }) => {
  test.skip(!REPO, 'needs SI_TARGET=root SI_E2E_SERVE=repo');
  const b = await playwright.chromium.launch({ channel: 'chrome', args: ['--host-resolver-rules=MAP si.test 127.0.0.1'] });
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const hits: string[] = [];
    await ctx.route(GC + '**', (r) => { hits.push(r.request().url()); return r.fulfill({ status: 200, contentType: 'image/gif', body: Buffer.from('R0lGODlhAQABAAAAACw=', 'base64') }); });
    await ctx.route((u) => u.hostname !== 'si.test' && !u.href.startsWith(GC), (r) => r.abort());
    const p = await ctx.newPage();
    await p.goto(`http://si.test:4173${BASE}?lang=zh#U`);
    await p.locator('html[data-si-ready="U.zh"]').waitFor({ state: 'attached', timeout: 15_000 });
    await expect.poll(() => hits.length).toBe(1);
    expect(new URL(hits[0]!).searchParams.get('p')).toBe('/zh/U');
    await reveal(p, '#labPick');
    await p.locator('#pkPre [data-pre="fix"]').click();
    await reveal(p, '#quizU');
    await p.locator('#quizU .opt').first().click();
    await expect.poll(() => hits.length).toBe(3);
    expect(hits.slice(1).map((h) => new URL(h).searchParams.get('p'))).toEqual(['evt-lab-labPick', 'evt-quiz-U']);
    await p.evaluate(() => (window as unknown as SI).__si.go('Uc'));
    await p.locator('html[data-si-ready="Uc.zh"]').waitFor({ state: 'attached' });
    await expect.poll(() => hits.length).toBe(4);
    expect(new URL(hits[3]!).searchParams.get('p')).toBe('/zh/Uc');
  } finally { await b.close(); }
});

test('each M2 stop is its own lazy chunk: T1 fetches only its neighbour U (prefetch), not Ua–Ud or Up', async ({ page }) => {
  const js: string[] = [];
  page.on('request', (r) => { if (r.url().endsWith('.js')) js.push(new URL(r.url()).pathname.split('/').pop()!); });
  await open(page, 'zh', 'T1');
  await page.waitForTimeout(800);
  const m2 = () => js.filter((f) => /^U[a-dp]?[.-]/.test(f));
  expect(m2().every((f) => /^U\.zh-/.test(f)), m2().join()).toBe(true);
  await page.evaluate(() => (window as unknown as SI).__si.go('Ua'));
  await page.locator('html[data-si-ready="Ua.zh"]').waitFor({ state: 'attached' });
  expect(js.some((f) => /^Ua\.zh-/.test(f))).toBe(true);
  expect(js.filter((f) => /^(Uc|Ud)[.-]/.test(f))).toEqual([]);
  expect(js.filter((f) => /\.en-/.test(f))).toEqual([]);
});

/* r10 labs: labClick (Ua), labFan and labCron (Ub) */
for (const lang of ['zh', 'en'] as Lang[]) {
  test(`${lang} labClick: clicks drawn on the page; a hidden instruction leaks without defences, is ignored with them`, async ({ page }) => {
    const w = watch(page);
    await open(page, lang, 'Ua');
    await reveal(page, '#labClick');
    const log = page.locator('#ckLog li');
    const run = async () => { for (let i = 0; i < 12 && (await page.locator('#ckNext').isEnabled()); i++) await page.locator('#ckNext').click(); };
    await expect(log).toHaveCount(1);
    await page.locator('#ckNext').click();
    await expect(page.locator('#ckScr .ck-dot')).toHaveText('1');
    await run();
    await expect(log.last()).toHaveAttribute('data-k', 'done');
    await expect(page.locator('#ckScr .ck-hid')).toHaveCount(0);
    await page.locator('#ckInj').check();
    await expect(log).toHaveCount(1);
    await run();
    await expect(log.last()).toHaveAttribute('data-k', 'leaked');
    await expect(log.last()).toHaveClass(/bad/);
    await expect(page.locator('#ckScr .ck-to')).toContainText('pay@evil.example');
    await page.locator('#ckGuard').check();
    await run();
    await expect(page.locator('#ckLog li[data-k="ignore"]')).toHaveCount(1);
    await expect(log.last()).toHaveAttribute('data-k', 'doneFlag');
    await expect(page.locator('#ckScr .ck-hid')).toBeVisible();
    const box = await page.locator('#ckScr').boundingBox(), dot = await page.locator('#ckScr .ck-dot').boundingBox();
    expect(dot!.x >= box!.x && dot!.x + dot!.width <= box!.x + box!.width + 1).toBe(true);
    await page.locator('#ckReset').click();
    await expect(log).toHaveCount(1);
    expect(w.errors).toEqual([]);
  });

  test(`${lang} labFan + labCron: parallel gain vanishes with dependencies; draft-first waits, auto gets the trap wrong`, async ({ page }) => {
    const w = watch(page);
    await open(page, lang, 'Ub');
    await reveal(page, '#labFan');
    const st = page.locator('#fnStat');
    await expect(st).toHaveAttribute('data-min', '5');
    await expect(page.locator('#fnLanes .fn-lane')).toHaveCount(4);
    await page.locator('#fnN').selectOption('1');
    await expect(st).toHaveAttribute('data-min', '16');
    await expect(page.locator('#fnLanes .fn-lane')).toHaveCount(1);
    await page.locator('#fnDep').check();
    await page.locator('#fnN').selectOption('4');
    await expect(st).toHaveAttribute('data-min', '20');
    await expect(st).toHaveAttribute('data-conf', '3');
    await expect(page.locator('#fnLanes .wait')).toHaveCount(3);
    for (const sp of await page.locator('#fnLanes .fn-track').all()) {
      const t = (await sp.boundingBox())!;
      for (const b of await sp.locator('span').all()) { const r = (await b.boundingBox())!; expect(r.x + r.width).toBeLessThanOrEqual(t.x + t.width + 1); }
    }
    await reveal(page, '#labCron');
    const cs = page.locator('#crStat');
    await page.locator('#crAct').selectOption('reply');
    await expect(cs).toHaveAttribute('data-wait', '5');
    await expect(cs).toHaveAttribute('data-bad', '0');
    await page.locator('#crMode').selectOption('auto');
    await expect(cs).toHaveAttribute('data-bad', '1');
    await expect(page.locator('#crLog li.bad')).toHaveCount(1);
    await page.locator('#crTrig').selectOption('mail');
    await expect(page.locator('#crLog li')).toHaveCount(6);
    await page.locator('#crAct').selectOption('digest');
    await expect(cs).toHaveAttribute('data-done', '6');
    await expect(cs).toHaveAttribute('data-bad', '0');
    expect(w.errors).toEqual([]);
  });
}
