import { test, expect, type Page } from '@playwright/test';
/* R38: the system explorer is the default. One screen: a standard Transformer drawn bottom → top (real three.js, 2D
   only without WebGL); a box with + opens in place (diagram to the left, glowing connector, panel); tapping the box
   again closes it. Every box has a four-row info card and a five-part 知识卡 (page 1 ①–④, 续 ⑤, 看数学 → L5 card).
   L4 only in this batch (L1/2/3/5 "即将上线"); the R34–R37 3D site and the classic site are gone. All numbers come from the real
   hand-written TS Transformer in a worker. */
const ORIGIN = 'http://localhost:4173';
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: [{ name: 'si.fs', value: '0' }, { name: 'si.a2hs', value: '1' }, { name: 'si.onb', value: '1' }] }] } });

async function open(p: Page, q: string, ready = true) {
  const errs: string[] = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(q); await p.locator('#l4').waitFor({ state: 'attached', timeout: 20000 });
  if (ready) await p.waitForFunction(() => document.getElementById('l4')?.dataset.ready === '1', null, { timeout: 30000 });
  return errs;
}
const page$ = (p: Page) => p.evaluate(() => document.getElementById('l4')!.dataset.page);
const box = (p: Page, n: string) => p.locator(`.l4-lb[data-nd="${n}"]`);

/** nothing sticks out of the screen, labels are not cut, and the diagram parts do not overlap each other */
async function layoutOk(p: Page) {
  return p.evaluate(() => {
    const bad: string[] = []; const W = innerWidth, H = innerHeight;
    const vis = (e: Element) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
    const R = (e: Element) => e.getBoundingClientRect();
    for (const s of ['.l4-top', '.l4-cr', '.l4-main', '.l4-ent', '.l4-info', '.l4-hint', '.l4-dots', '.l4-nav', '.l4-lb', '.l4-pn', '.l4-tag', '.l4-note', '.l4-fl']) for (const e of document.querySelectorAll(s)) {
      if (!vis(e)) continue; const r = R(e); if (r.left < -0.5 || r.top < -0.5 || r.right > W + 0.5 || r.bottom > H + 0.5) bad.push(`out ${s} ${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}`);
    }
    for (const t of document.querySelectorAll<HTMLElement>('.l4-lb .t, .l4-tag, .l4-chips, .l4-tt, .l4-r span')) if (vis(t) && t.scrollWidth > t.clientWidth + 1) bad.push(`cut ${t.textContent}`);
    for (const e of document.querySelectorAll<HTMLElement>('.l4-pn, .l4-info, .l4-home')) if (vis(e) && e.scrollHeight > e.clientHeight + 2) bad.push(`scroll ${e.className} ${e.scrollHeight}>${e.clientHeight}`);
    const parts = [...document.querySelectorAll('.l4-lb, .l4-pn, .l4-tag, .l4-note, .l4-fl')].filter(vis);
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
      const a = R(parts[i]!), b = R(parts[j]!);
      if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) bad.push(`overlap ${parts[i]!.className}|${parts[i]!.textContent?.slice(0, 12)} × ${parts[j]!.className}|${parts[j]!.textContent?.slice(0, 12)}`);
    }
    const fs = [...document.querySelectorAll<HTMLElement>('#l4 *')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())).map((e) => parseFloat(getComputedStyle(e).fontSize));
    if (Math.min(...fs) < 12) bad.push(`font ${Math.min(...fs)}`);
    return bad;
  });
}

test.describe('R38 explorer', () => {
  test('the default page is the explorer home: 5 layers, all live (R39: L1–L5); only 学 and 记 below', async ({ page }) => {
    const errs = await open(page, './?lang=zh', false);
    await expect(page.locator('#l4')).toHaveAttribute('data-v', 'home');
    await expect(page.locator('.l4-lv')).toHaveCount(5);
    await expect(page.locator('.l4-lv.live')).toHaveCount(5);
    await expect(page.locator('.l4-lv.live').filter({ hasText: 'Transformer' })).toHaveCount(1);
    await page.locator('.l4-lv.live').nth(4).click(); await expect(page.locator('#l4')).toHaveAttribute('data-v', 'lx'); await expect(page).toHaveURL(/#L5$/);
    await page.goto('./?lang=zh#home'); await page.locator('.l4-hr.pri').click(); await expect(page.locator('#l4')).toHaveAttribute('data-v', 'lx'); await expect(page).toHaveURL(/#L1$/);
    await page.goto('./?lang=zh#home');
    await expect(page.locator('.l4-home .l4-hr')).toHaveCount(4); await expect(page.locator('.l4-home a[href*="w=3d"], .l4-home a[href*="classic=1"]')).toHaveCount(0);
    await page.locator('.l4-home [data-go="#R"]').click(); await expect(page).toHaveURL(/#R$/); await expect(page.locator('.px-lvr').first()).toBeVisible(); /* R42: G3 progress page — five layer rows */
    expect(errs).toEqual([]);
  });
  test('old addresses (?w=3d, ?classic=1, #T1, #learn) land on the explorer home: the old sites are gone', async ({ page }) => {
    for (const u of ['./?w=3d&lang=zh', './?classic=1&lang=zh', './?lang=zh#T1', './?w=3d&lang=zh#learn']) {
      await page.goto(u); await expect(page.locator('#l4')).toHaveAttribute('data-v', 'home', { timeout: 20000 });
      expect(await page.locator('#p3, #mBoot .topbar, section.level').count()).toBe(0);
    }
  });
  test('L4 idle: the standard architecture bottom → top, a real WebGL stage, text fixed on top', async ({ page }) => {
    const errs = await open(page, './?lang=zh#L4');
    await expect(page.locator('#l4')).toHaveAttribute('data-gl', '3d');
    const ys = await page.locator('.l4-lb').evaluateAll((es) => es.map((e) => [(e as HTMLElement).dataset.nd, e.getBoundingClientRect().top] as [string, number]));
    expect(ys.map((x) => x[0]).join(' ')).toBe('in tok emb att an1 ffn an2 lin sm out');
    for (let i = 1; i < ys.length; i++) expect(ys[i]![1]).toBeLessThan(ys[i - 1]![1]);
    await expect(box(page, 'att')).toContainText('带遮罩的多头注意力');
    await expect(page.locator('.l4-tt')).toContainText('Transformer'); await expect(page.locator('.l4-crumb')).toContainText('全貌');
    await expect(page.locator('.l4-fl')).toContainText('解码块 × 2');
    await expect(page.locator('.l4-rl')).toHaveCount(2);
    await expect(page.locator('.l4-info dt')).toHaveCount(4);
    expect(errs).toEqual([]);
  });
  test('drill down in place: Transformer → attention → Q·K → one number → 看数学 → L5; tapping the box closes it', async ({ page }) => {
    const errs = await open(page, './?lang=zh#L4');
    await box(page, 'att').click(); await expect(page).toHaveURL(/#L4\/x\/att$/);
    await expect(page.locator('.l4-pn.xl[data-page="X:att"]')).toBeVisible();
    const lb = await box(page, 'att').boundingBox(), pn = await page.locator('.l4-pn').boundingBox();
    expect(lb!.x + lb!.width).toBeLessThan(pn!.x); // the diagram moved to the left of the panel
    await expect(box(page, 'att')).toHaveAttribute('aria-expanded', 'true');
    await page.locator('.l4-pn [data-go$="att.dot"]').click(); await expect(page).toHaveURL(/att\.dot$/);
    await expect(page.locator('.l4-grid .cell')).toHaveCount(64);
    await page.locator('.l4-grid .cell.gold').click(); await expect(page).toHaveURL(/att\.dot\.one$/);
    await expect(page.locator('.l4-tb tr')).toHaveCount(8);
    const txt = (await page.locator('.l4-pn').textContent())!;
    const m = /([−-]?\d+\.\d+) ÷ √8 = ([−-]?\d+\.\d+)/.exec(txt)!; expect(m).toBeTruthy();
    const num = (s: string) => Number(s.replace('−', '-')); expect(Math.abs(num(m[1]!) / Math.sqrt(8) - num(m[2]!))).toBeLessThan(0.006);
    await page.locator('.l4-mp').click(); await expect(page.locator('.l4-sheet')).toHaveAttribute('data-card', 'KM02');
    await page.locator('.l4-sheet [data-s="close"]').click(); await expect(page.locator('.l4-sheet')).toHaveCount(0);
    await page.goto('./?lang=zh#L4/x/att'); await page.waitForFunction(() => document.getElementById('l4')?.dataset.ready === '1');
    await box(page, 'att').click(); await expect(page).toHaveURL(/#L4$/); await expect(page.locator('.l4-pn')).toHaveCount(0);
    expect(errs).toEqual([]);
  });
  test('the five-part card: ①–④ on page 1, ⑤ on 续, 看数学 → the L5 card, 返回 closes, share is 1080×1920 / 1080×1350', async ({ page }) => {
    await open(page, './?lang=zh#L4'); await box(page, 'att').click();
    await page.locator('.l4-kb').click(); const sh = page.locator('.l4-sheet');
    await expect(sh).toHaveAttribute('data-card', 'K06'); await expect(sh).toHaveAttribute('data-p', '1');
    await expect(sh.locator('.l4-kh')).toHaveText([/①/, /②/, /③/, /④/]);
    await sh.locator('[data-s="flip"]').click(); await expect(sh).toHaveAttribute('data-p', '2'); await expect(sh.locator('.l4-kh')).toHaveText([/⑤/]);
    await expect(sh.locator('.t5').first()).toBeVisible();
    await sh.locator('[data-s="share"]').click(); const img = page.locator('.l4-shr');
    await expect(img).toHaveAttribute('data-w', '1080'); await expect(img).toHaveAttribute('data-h', '1920');
    await page.locator('[data-f="post"]').click(); await expect(img).toHaveAttribute('data-h', '1350');
    await sh.locator('[data-s="math"]').click(); await expect(page.locator('.l4-sheet')).toHaveAttribute('data-card', /^KM/);
    await page.locator('.l4-sheet [data-s="close"]').click(); await expect(page.locator('.l4-sheet')).toHaveCount(0);
  });
  test('see it train: real first guess, real loss, back-pass in orange, after 200 steps 蓝 wins', async ({ page }) => {
    await open(page, './?lang=zh#L4/tr/3');
    const p3 = (await page.locator('.l4-pn').textContent())!; expect(p3).toMatch(/\d+\.\d%/);
    await page.locator('[data-a="next"]').click(); await expect(page).toHaveURL(/tr\/4$/); await expect(page.locator('.l4-pn')).toContainText('−ln(');
    await page.locator('[data-a="next"]').click(); await expect(page).toHaveURL(/tr\/5$/);
    await expect(page.locator('.l4-tag')).toHaveCount(6); await expect(page.locator('.l4-lb.st-back')).toHaveCount(10);
    await page.locator('[data-a="next"]').click(); await expect(page).toHaveURL(/tr\/6$/); await expect(page.locator('.l4-pn')).toContainText('200');
    await expect(page.locator('.l4-pn .l4-curve')).toBeVisible();
  });
  test('see it answer: 9 steps through the real forward pass, ending with 蓝', async ({ page }) => {
    await open(page, './?lang=zh#L4/us/1');
    for (let i = 2; i <= 9; i++) { await page.locator('[data-a="next"]').click(); await expect(page).toHaveURL(new RegExp(`us/${i}$`)); await expect(page.locator('.l4-dots i.on')).toHaveCount(1); }
    await expect(page.locator('.l4-pn')).toContainText('蓝'); await expect(page.locator('.l4-chips')).toContainText('蓝');
  });
  test('my training: write lines, train 300 real steps (pause/resume), then ask it', async ({ page }) => {
    test.setTimeout(120000);
    await open(page, './?lang=zh#L4/my/1');
    await page.locator('[data-my="lines"]').fill('天空是什么颜色？→蓝\n草地是什么颜色？→绿');
    await page.locator('[data-act="my-train"]').click(); await expect(page).toHaveURL(/my\/2$/);
    await expect(page.locator('.l4-pn .l4-pbar')).toBeVisible();
    // a fast machine can finish all 300 steps before the tap lands; then there is nothing to pause
    if (await page.locator('[data-act="my-pause"]').click({ timeout: 4000 }).then(() => true, () => false)) {
      // …or the last steps were already on their way when the tap landed: then it ends instead of pausing
      const rs = page.locator('[data-act="my-resume"]'), fin = page.locator('.l4-pn [data-go="#L4/my/3"]');
      await expect(rs.or(fin)).toBeVisible(); if (await rs.isVisible()) await rs.click(); }
    await expect(page.locator('.l4-pn [data-go="#L4/my/3"]')).toBeVisible({ timeout: 90000 });
    await page.locator('.l4-pn [data-go="#L4/my/3"]').click(); await page.locator('[data-my="q"]').fill('草地是什么颜色？');
    await page.locator('[data-act="my-test"]').click(); await expect(page.locator('.l4-pn .l4-big')).toContainText('绿', { timeout: 20000 });
    await page.locator('[data-a="back"]').click();
    await page.goto('./?lang=zh#L4/my/1'); await page.locator('[data-my="lines"]').fill('没有箭头的一行');
    await page.locator('[data-act="my-train"]').click(); await expect(page.locator('.l4-err')).toBeVisible(); await expect(page).toHaveURL(/my\/1$/);
  });
  test('no WebGL (?fb=1) → the flat 2D stage, same labels', async ({ page }) => {
    await open(page, './?fb=1&lang=en#L4');
    await expect(page.locator('#l4')).toHaveAttribute('data-gl', '2d'); await expect(box(page, 'att')).toContainText(/Masked/);
  });
  test('map lists every page and marks seen ones; progress counts them; language switch keeps the page', async ({ page }) => {
    const go = async (hs: string) => { await page.evaluate(() => document.querySelectorAll('.l4-ms').forEach((e) => e.remove())); await page.evaluate((x) => { location.hash = x; }, hs); await expect(page).toHaveURL(new RegExp(hs.replace(/\//g, '\\/') + '$')); };
    await open(page, './?lang=zh#L4/us/2');
    await page.locator('[data-a="map"]').click(); expect(await page.locator('.l4-ms a').count()).toBeGreaterThanOrEqual(19);
    await expect(page.locator('.l4-ms a.here')).toHaveCount(1);
    await page.locator('.l4-ms a[href$="#L4/tr/2"]').click(); await expect(page).toHaveURL(/tr\/2$/);
    await go('#L4/tr/3'); await page.locator('[data-a="map"]').click(); await expect(page.locator('.l4-ms a.seen').first()).toBeVisible();
    await go('#L4/tr/2'); await page.locator('[data-a="prog"]').click(); await expect(page).toHaveURL(/#R$/);
    await expect.poll(async () => Number(/\d+/.exec((await page.locator('.px-lvr[data-go="#L4"] i').first().textContent()) ?? '')?.[0] ?? 0)).toBeGreaterThanOrEqual(2); /* R42: per-layer seen count */
    await expect(page.locator('.l4-home a[href*="w=3d"], .l4-home a[href*="classic=1"]')).toHaveCount(0);
    await go('#L4/tr/2');
    await page.locator('[data-a="lang"]').click(); await expect(page.locator('#l4')).toHaveAttribute('data-lang', 'en'); expect(await page$(page)).toBe('TR2');
  });
  test('every inner part is a tap away: attention flow → mask / heads, usage step 5 → heads / mask, FFN and add+norm show their insides', async ({ page }) => {
    const errs = await open(page, './?lang=zh#L4/x/att');
    await expect(page.locator('.l4-pn .l4-flw .l4-fb')).toHaveCount(6);
    await page.locator('.l4-pn .l4-flw [data-go$="att.mask"]').click(); await expect(page).toHaveURL(/att\.mask$/); await expect(page.locator('.l4-lg')).toContainText('被挡住');
    await page.goto('./?lang=zh#L4/x/att'); await page.waitForFunction(() => document.getElementById('l4')?.dataset.ready === '1');
    await page.locator('.l4-pn .l4-flw [data-go$="att.heads"]').click(); await expect(page).toHaveURL(/att\.heads$/);
    await page.goto('./?lang=zh#L4/us/5'); await page.waitForFunction(() => document.getElementById('l4')?.dataset.ready === '1');
    await page.locator('.l4-pn [data-go$="att.mask"]').click(); await expect(page).toHaveURL(/att\.mask$/);
    await page.goto('./?lang=zh#L4/x/ffn'); await page.waitForFunction(() => document.getElementById('l4')?.dataset.ready === '1');
    await expect(page.locator('.l4-pn .l4-flw')).toContainText('16 → 64'); await expect(page.locator('.l4-pn .l4-flw')).toContainText('ReLU');
    await page.goto('./?lang=zh#L4/x/an1'); await page.waitForFunction(() => document.getElementById('l4')?.dataset.ready === '1');
    for (const x of ['① 残差相加', '② 归一化']) await expect(page.locator('.l4-pn .l4-ph', { hasText: x })).toHaveCount(1);
    expect(errs).toEqual([]);
  });
  test('training really lowers the error: the TR6 curve ends far below where it started', async ({ page }) => {
    await open(page, './?lang=en#L4/tr/6');
    const t = (await page.locator('.l4-pn').textContent())!, m = /(\d+\.\d+) → (\d+\.\d+)/.exec(t)!;
    expect(Number(m[2])).toBeLessThan(Number(m[1]) / 4); await expect(page.locator('.l4-pn .l4-fm')).toContainText('new = old');
  });
  test('a card that does not fit fades at the bottom until scrolled', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 }); await open(page, './?lang=zh#L4/us/5~K06');
    const sb = page.locator('.l4-sbody'); await sb.waitFor();
    const over = await sb.evaluate((e) => e.scrollHeight > e.clientHeight + 4);
    if (over) { await expect(sb).toHaveClass(/more/); await sb.evaluate((e) => { e.scrollTop = e.scrollHeight; e.dispatchEvent(new Event('scroll')); }); await expect(sb).not.toHaveClass(/more/); }
  });
  test('landscape shows the rotate hint', async ({ page }) => {
    await open(page, './?lang=zh#L4', false); await page.setViewportSize({ width: 740, height: 360 });
    await expect(page.locator('.l4-rot')).toBeVisible();
  });
});

const SHOTS = ['#home', '#L4', '#L4/x/att', '#L4/x/att.dot', '#L4/x/att.dot.one', '#L4/x/att.heads', '#L4/x/att.mask', '#L4/x/ffn', '#L4/x/an1', '#L4/x/tok', '#L4/x/emb', '#L4/x/an2', '#L4/x/lin', '#L4/x/sm',
  '#L4/tr/1', '#L4/tr/2', '#L4/tr/3', '#L4/tr/4', '#L4/tr/5', '#L4/tr/6', ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `#L4/us/${i}`), '#L4/my/1', '#L4/my/2', '#L4/my/3', '#L5'];
for (const [w, h] of [[360, 640], [390, 844], [430, 932]] as const) for (const lang of ['zh', 'en'] as const) {
  test(`no overlap or cut text at ${w}×${h} ${lang}, every page`, async ({ page }, ti) => {
    test.skip(ti.project.name !== 'm360', 'one sweep is enough; it sets its own viewport');
    test.setTimeout(240000); await page.setViewportSize({ width: w, height: h });
    const errs = await open(page, `./?lang=${lang}#L4`); const bad: string[] = [];
    for (const s of SHOTS) {
      await page.evaluate((hs) => { location.hash = hs; }, s); await page.waitForTimeout(250);
      for (const x of await layoutOk(page)) bad.push(`${s}: ${x}`);
    }
    for (const c of ['K06', 'K06.2', 'KM02']) {
      await page.evaluate((hs) => { location.hash = hs; }, `#L4~${c}`); await page.locator('.l4-sheet').waitFor();
      const r = await page.locator('.l4-sin').boundingBox(); if (!r || r.y < 0 || r.y + r.height > h + 0.5) bad.push(`card ${c} off screen`);
      const cut = await page.locator('.l4-sheet .l4-b').evaluateAll((es) => es.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent)); if (cut.length) bad.push(`card ${c} cut ${cut.join(',')}`);
    }
    expect(bad).toEqual([]); expect(errs).toEqual([]);
  });
}
