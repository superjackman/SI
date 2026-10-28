import { test, expect, type Page } from '@playwright/test';
/* R40: 练 (experiments + quizzes), 记 (record), 享 (share cards), and the 10-minute quick path. Every area opens; a quiz
   runs end to end and lands in the record; the share card renders with a QR and never carries quiz text; the quick path
   walks all stops to the end; nothing sticks out, is cut or is under 12px at 360×640 and 390×844 in zh and en. */
import { QUIZ } from '../../src/px/quiz';
const ORIGIN = 'http://localhost:4173';
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: [{ name: 'si.fs', value: '0' }, { name: 'si.a2hs', value: '1' }] }] } });
const SHOTS = process.env.R40_SHOTS;

async function open(p: Page, q: string) {
  const errs: string[] = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(q); await p.locator('#l4').waitFor({ state: 'attached', timeout: 20000 });
  return errs;
}
async function at(p: Page, id: string, lang: string) {
  await p.evaluate((x) => { location.hash = x; }, '#' + id);
  await p.waitForFunction((want) => document.getElementById('l4')?.dataset.px === want, `${id.replace(/^S\/.*/, 'S')}.${lang}`, { timeout: 20000 });
}
async function layoutOk(p: Page) {
  return p.evaluate(() => {
    const bad: string[] = []; const W = innerWidth, H = innerHeight;
    const vis = (e: Element) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
    const R = (e: Element) => e.getBoundingClientRect();
    for (const s of ['.l4-top', '.l4-cr', '.l4-nav', '.l4-qp', '.l4-hb', '.l4-qk']) for (const e of document.querySelectorAll(s)) {
      if (!vis(e)) continue; const r = R(e); if (r.left < -0.5 || r.top < -0.5 || r.right > W + 0.5 || r.bottom > H + 0.5) bad.push(`out ${s} ${e.textContent?.slice(0, 16)}`);
    }
    // nothing in the content area is wider than the screen (vertical scroll inside .l4-home is allowed)
    for (const e of document.querySelectorAll('.px *, .l4-hb, .l4-qk')) { if (!vis(e)) continue; const r = R(e); if (r.left < -0.5 || r.right > W + 0.5) { bad.push(`wide ${e.className} ${e.textContent?.slice(0, 16)}`); break; } }
    const home = document.querySelector('.l4-home'); if (home && home.scrollWidth > home.clientWidth + 1) bad.push(`hscroll ${home.scrollWidth}>${home.clientWidth}`);
    for (const t of document.querySelectorAll<HTMLElement>('.l4-tt, .l4-r span, .l4-b, .px-o span, .px-it b, .px-st b, .l4-hr b, .l4-hr span, .l4-qp span')) if (vis(t) && (t.scrollWidth > t.clientWidth + 1 || t.scrollHeight > t.clientHeight + 1)) bad.push(`cut ${t.className} ${t.textContent?.slice(0, 20)}`);
    const bs = [...document.querySelectorAll('.px-o, .px-it, .l4-hr, .px-st > div')].filter(vis);
    for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
      const a = R(bs[i]!), b = R(bs[j]!);
      if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) bad.push(`overlap ${bs[i]!.textContent?.slice(0, 12)} × ${bs[j]!.textContent?.slice(0, 12)}`);
    }
    const fs = [...document.querySelectorAll<HTMLElement>('#l4 *')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())).map((e) => parseFloat(getComputedStyle(e).fontSize));
    if (Math.min(...fs) < 12) bad.push(`font ${Math.min(...fs)}`);
    return bad;
  });
}
const AREAS = ['P', 'P/x1', 'P/x2', 'P/x3', 'P/x4', 'P/x5', 'P/q1', 'P/q2', 'P/q3', 'P/q4', 'P/q5', 'R', 'S', 'S/ach', 'Q'];

test.describe('R40 练记享', () => {
  test('home has 学 练 记 享 and the quick-path entry; each opens its area', async ({ page }) => {
    const errs = await open(page, './?lang=zh#home');
    await expect(page.locator('.l4-home .l4-hr')).toHaveCount(4);
    await expect(page.locator('.l4-qk')).toContainText(/约 \d+ 分钟/);
    for (const [go, id] of [['#P', 'P'], ['#R', 'R'], ['#S', 'S'], ['#Q', 'Q']] as const) {
      await page.evaluate(() => { location.hash = '#home'; }); await expect(page.locator('.l4-home .l4-hr')).toHaveCount(4);
      await page.locator(`.l4-home [data-go="${go}"]`).click();
      await page.waitForFunction((w) => document.getElementById('l4')?.dataset.px === w, `${id}.zh`);
    }
    expect(errs).toEqual([]);
  });
  test('every area opens and has content; experiments compute and log runs', async ({ page }) => {
    const errs = await open(page, './?lang=zh#P');
    for (const id of AREAS) { await at(page, id, 'zh'); expect((await page.locator('.px').innerText()).length).toBeGreaterThan(10); }
    await at(page, 'P/x1', 'zh'); await expect(page.locator('.px-res')).toContainText('%');
    await page.locator('[data-xs="p"]').fill('95'); await expect(page.locator('.px-res')).toContainText('95');
    await at(page, 'P/x4', 'zh'); await expect(page.locator('.px-res .px-bar').first()).toBeVisible({ timeout: 20000 });
    await at(page, 'P/x5', 'zh'); await page.locator('[data-px="d:256"]').click(); await expect(page.locator('.px-res')).toContainText('16.00');
    const n = await page.evaluate(() => JSON.parse(localStorage.getItem('si.px.log') ?? '[]').filter((e: { k: string }) => e.k === 'exp').length);
    expect(n).toBeGreaterThanOrEqual(2);
    expect(errs).toEqual([]);
  });
  test('quiz: pick, see why tied to the card, finish, record updates', async ({ page }) => {
    const errs = await open(page, './?lang=zh#R');
    await at(page, 'R', 'zh'); const before = Number(await page.locator('.px-st b').nth(1).textContent());
    await at(page, 'P/q1', 'zh'); const set = QUIZ[1];
    for (let i = 0; i < set.length; i++) {
      await expect(page.locator('.px-qh b')).toContainText(`第 ${i + 1} 题`);
      const pick = i === 0 ? (set[i]!.a + 1) % 4 : set[i]!.a; // one wrong, the rest right
      await page.locator(`[data-px="pick:${pick}"]`).click();
      await expect(page.locator('.px-ex')).toContainText(set[i]!.k);
      await expect(page.locator('.px-o.ok')).toHaveCount(1);
      await expect(page.locator(`.px-ex [data-k="${set[i]!.k}.2"], .px-row [data-k="${set[i]!.k}.2"]`)).toHaveCount(1);
      await page.locator('[data-px="next"]').click();
    }
    await expect(page.locator('.px-big')).toContainText(new RegExp(`${set.length - 1} ?/ ?${set.length}`));
    await page.locator('.px-r [data-go="#R"]').click(); await page.waitForFunction(() => document.getElementById('l4')?.dataset.px === 'R.zh');
    expect(Number(await page.locator('.px-st b').nth(1).textContent())).toBe(before + set.length);
    await expect(page.locator('.px-rcs')).toContainText(new RegExp(`${set.length - 1} ?/ ?${set.length}`));
    await at(page, 'P', 'zh'); await expect(page.locator('.px-it').filter({ hasText: new RegExp(`${set.length - 1} ?/ ?${set.length}`) })).toHaveCount(1);
    expect(errs).toEqual([]);
  });
  test('share: card renders with a QR, both sizes, no quiz text; copy gives the deep link', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: ORIGIN });
    const errs = await open(page, './?lang=zh#S/KA04.k'); await at(page, 'S/KA04.k', 'zh');
    const box = page.locator('.px-prev'); await expect(box.locator('img')).toBeVisible();
    await expect(box).toHaveAttribute('data-w', '1080'); await expect(box).toHaveAttribute('data-h', '1920');
    expect(await box.getAttribute('data-url')).toMatch(/#L1\/?.*~KA04$/);
    const qs = QUIZ[1].map((q) => q.q[0]); const txt = (await box.getAttribute('data-text')) ?? '';
    for (const q of qs) expect(txt).not.toContain(q);
    // the QR in the bottom-right corner decodes to dark/light modules: sample it from the real PNG
    const qr = await page.evaluate(async () => {
      const img = document.querySelector<HTMLImageElement>('.px-prev img')!; await img.decode();
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext('2d')!; x.drawImage(img, 0, 0);
      const d = x.getImageData(c.width - 420, c.height - 420, 420, 420).data; let w = 0, k = 0;
      for (let i = 0; i < d.length; i += 4) { const v = d[i]! + d[i + 1]! + d[i + 2]!; if (v > 740) w++; else if (v < 120) k++; }
      return { w, k };
    });
    expect(qr.w).toBeGreaterThan(5000); expect(qr.k).toBeGreaterThan(2000);
    await page.locator('[data-px="fmt:post"]').click(); await expect(box).toHaveAttribute('data-h', '1350');
    for (const k of ['q', 'p', 'm']) { await page.locator(`[data-px="kind:${k}"]`).click(); await expect(box).toHaveAttribute('data-kind', k); await expect(box.locator('img')).toBeVisible(); }
    await page.locator('[data-px="copy"]').click(); await expect(page.locator('.px-cp')).toContainText('lang=zh');
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/share-ach-post.png` });
    expect(errs).toEqual([]);
  });
  test('quick path: estimate from the content, walk every stop with Next, finish and record it', async ({ page }) => {
    const errs = await open(page, './?lang=zh#Q'); await at(page, 'Q', 'zh');
    const NS = await page.locator('.px-stops li').count(); expect(NS).toBe(12); const PATH = { length: NS }, withCard = await page.locator('.px-stops li span').evaluateAll((l) => l.map((e) => / \+ K/.test(e.textContent ?? '')));
    await page.locator('[data-px="qgo"]').click();
    for (let i = 0; i < PATH.length; i++) {
      await expect(page.locator('.l4-qp')).toContainText(`${i + 1}/${PATH.length}`);
      if (SHOTS && i === 1) await page.screenshot({ path: `${SHOTS}/quick-stop2.png` });
      if (withCard[i]) { await page.locator('.l4-sheet [data-s="close"]').click(); await expect(page.locator('.l4-sheet')).toHaveCount(0); }
      await page.locator('[data-a="next"]').click();
    }
    await page.waitForFunction(() => document.getElementById('l4')?.dataset.px === 'Q/done.zh');
    await expect(page.locator('.px-r')).toContainText('用时');
    const n = await page.evaluate(() => JSON.parse(localStorage.getItem('si.px.log') ?? '[]').filter((e: { k: string }) => e.k === 'path').length);
    expect(n).toBe(1); await expect(page.locator('.l4-qp')).toBeHidden();
    expect(errs).toEqual([]);
  });
  for (const lang of ['zh', 'en'] as const) {
    test(`layout at this size, ${lang}: home and every area fit, nothing cut, ≥12px`, async ({ page }, info) => {
      test.skip(info.project.name === 'm430', 'checked at 360×640 and 390×844');
      if (info.project.name === 'm360') await page.setViewportSize({ width: 360, height: 640 });
      const errs = await open(page, `./?lang=${lang}#home`); await expect(page.locator('.l4-home .l4-hr')).toHaveCount(4);
      expect(await layoutOk(page), 'home').toEqual([]);
      if (SHOTS) await page.screenshot({ path: `${SHOTS}/${info.project.name}-${lang}-home.png` });
      for (const id of [...AREAS, 'S/K06.p']) {
        await at(page, id, lang); if (id === 'P/x4') await page.locator('.px-res .px-bar').first().waitFor({ timeout: 20000 });
        if (id.startsWith('S')) await page.locator('.px-prev img').waitFor();
        expect(await layoutOk(page), id).toEqual([]);
        if (SHOTS) await page.screenshot({ path: `${SHOTS}/${info.project.name}-${lang}-${id.replace(/\//g, '_')}.png` });
      }
      await at(page, 'P/q2', lang); await page.locator('[data-px="pick:0"]').click(); await expect(page.locator('.px-ex')).toBeVisible();
      expect(await layoutOk(page), 'quiz answered').toEqual([]);
      if (SHOTS) await page.screenshot({ path: `${SHOTS}/${info.project.name}-${lang}-quiz-answered.png` });
      expect(errs).toEqual([]);
    });
  }
});
