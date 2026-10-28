import { test, expect, type Page } from '@playwright/test';
/* R36: the 3D pages teach on their own. A tap on a lab's 3D part says what it is (its card opens); every idea and lab
   page starts with a "look here" line and ends with a "you learned" line; the quiz and the medal carry callouts; every
   station on the home and zone carousels has a tag; and the 3D name labels never overlap or get cut off. */
const ST = ['U', 'Ua', 'Ub', 'Uc', 'Ud', 'Up', 'Api', 'Loc', 'Job', 'Skl', 'Bld', 'T1', 'T2', 'T3', 'N', 'T4', 'T4a', 'T4b', 'T5', 'T6', 'T7', 'T8', 'K1', 'K2', 'K3', 'K4', 'K5'];
type St = { r: { v: string; s?: string; p?: number; z?: number }; kind: string; lab: boolean };
type W3 = { state(): St; where(i: number): [number, number] | null };
const ready = (p: Page) => p.waitForFunction(() => document.getElementById('p3')?.dataset.ready === '1', null, { timeout: 30000 });
async function go(p: Page, hash: string, kind?: string) {
  await p.evaluate((h) => { location.hash = h; }, hash);
  await p.waitForFunction(([h, k]) => {
    const w = (window as unknown as { __w3?: W3 }).__w3; if (!w) return false;
    return location.hash === h && document.getElementById('p3')?.dataset.ready === '1' && (!k || w.state().kind === k);
  }, [hash, kind ?? ''] as const, { timeout: 30000 });
}
const settle = async (p: Page) => { await p.waitForFunction(() => document.querySelectorAll('.w3n:not(.w3n-off)').length >= 1, null, { timeout: 15000 }).catch(() => undefined); await p.waitForTimeout(300); };
/** the 3D name labels on screen (adopted ones included), the look line, and anything cut off */
const labels = (p: Page) => p.evaluate(() => {
  const ls = [...document.querySelectorAll<HTMLElement>('.s3t:not([hidden]):not(.w3n-off)>span')].filter((s) => { const r = s.getBoundingClientRect(); return r.width > 4 && r.height > 4 && getComputedStyle(s).opacity !== '0' && getComputedStyle(s.parentElement!).visibility !== 'hidden'; })
    .map((s) => { const r = s.getBoundingClientRect(); return { x: r.left, y: r.top, r: r.right, b: r.bottom, t: (s.textContent ?? '').trim().slice(0, 24), cut: s.scrollWidth > s.clientWidth + 1 || s.scrollHeight > s.clientHeight + 1 }; });
  const lk = document.querySelector<HTMLElement>('.w3-lk:not([hidden])');
  const look = lk ? { t: lk.textContent ?? '', cut: lk.scrollWidth > lk.clientWidth + 1 || lk.scrollHeight > lk.clientHeight + 1, r: lk.getBoundingClientRect().right, x: lk.getBoundingClientRect().left } : null;
  return { ls, look, w: innerWidth };
});
function clean(r: Awaited<ReturnType<typeof labels>>, where: string) {
  for (const a of r.ls) {
    expect(a.cut, `${where}: "${a.t}" is cut off`).toBe(false);
    expect(a.x, `${where}: "${a.t}" off the left edge`).toBeGreaterThanOrEqual(-1); expect(a.r, `${where}: "${a.t}" off the right edge`).toBeLessThanOrEqual(r.w + 1);
  }
  for (let i = 0; i < r.ls.length; i++) for (let j = i + 1; j < r.ls.length; j++) {
    const a = r.ls[i]!, c = r.ls[j]!, ov = Math.min(a.r, c.r) - Math.max(a.x, c.x) > 1 && Math.min(a.b, c.b) - Math.max(a.y, c.y) > 1;
    expect(ov, `${where}: name "${a.t}" overlaps "${c.t}"`).toBe(false);
  }
  if (r.look) { expect(r.look.cut, `${where}: look line cut off`).toBe(false); expect(r.look.x).toBeGreaterThanOrEqual(-1); expect(r.look.r).toBeLessThanOrEqual(r.w + 1); }
}

test.describe('R36 the 3D pages teach', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.setTimeout(600_000);
  test.beforeEach(async ({ context }) => { await context.addInitScript(() => { try { localStorage.setItem('si.fs', '0'); localStorage.setItem('si.a2hs', '1'); localStorage.setItem('si.w3.hi', '1'); } catch { /* */ } }); });

  for (const lang of ['zh', 'en'] as const) for (const part of [0, 1, 2]) test(`${lang} ${part + 1}/3: every idea and lab page has a look line and name labels that neither overlap nor get cut off`, async ({ page }) => {
    const errs: string[] = []; page.on('pageerror', (e) => errs.push(String(e)));
    await page.goto(`./?lang=${lang}#home`); await ready(page);
    const noLook: string[] = [];
    for (const s of ST.filter((_, i) => i % 3 === part)) {
      const n = await (async () => { await go(page, `#${s}`, 'ideas'); return page.locator('.w3-tab').count(); })();
      for (let p = 0; p <= n - 3; p++) {
        if (p) await go(page, `#${s}/${p}`);
        await settle(page);
        const r = await labels(page); clean(r, `${s}/${p}`);
        if (!r.look || !r.look.t.startsWith('👀')) noLook.push(`${s}/${p}`);
      }
    }
    expect(noLook).toEqual([]);
    expect(errs).toEqual([]);
  });

  test('a tap on a lab part opens its card; the look line turns into what you learned', async ({ page }) => {
    const errs: string[] = []; page.on('pageerror', (e) => errs.push(String(e)));
    await page.goto('./?lang=zh#Api/2'); await ready(page); await settle(page);
    const dots = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.w3n-d:not([hidden])')].map((d) => { const r = d.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] as const; }));
    expect(dots.length).toBeGreaterThanOrEqual(2);
    await page.addStyleTag({ content: '.w3n-layer{display:none!important}' }); // tap the 3D part itself, not its ⓘ
    const card = page.locator('.w3-card:not([hidden])');
    await page.touchscreen.tap(dots[0]![0], dots[0]![1]);
    await expect(card).toBeVisible(); expect(((await card.locator('b').first().textContent()) ?? '').trim().length).toBeGreaterThan(1);
    await page.touchscreen.tap(dots[0]![0], dots[0]![1]); // the second tap on the same part works the experiment and closes the card
    await expect(page.locator('.w3-card:not([hidden])')).toHaveCount(0);
    await page.touchscreen.tap(dots[1]![0], dots[1]![1]);
    await expect(card).toBeVisible();
    /* ideas: all things opened -> "learned" */
    await page.goto('./?lang=en#T1'); await ready(page); await settle(page);
    const lk = page.locator('.w3-lk'); await expect(lk).toBeVisible(); await expect(lk).toHaveText(/^👀 Look at: /);
    const n = await page.locator('.p3l[data-pick]').count(); expect(n).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < n; i++) { await page.evaluate((k) => { document.querySelector<HTMLElement>(`.p3l[data-pick="${k}"]`)?.click(); }, i); await page.waitForTimeout(250); }
    await expect(lk).toHaveText(/^✅ You learned: .{10,}/);
    expect(errs).toEqual([]);
  });

  test('the quiz and the medal carry callouts; every carousel station has a tag', async ({ page }) => {
    const errs: string[] = []; page.on('pageerror', (e) => errs.push(String(e)));
    await page.goto('./?lang=zh#T1/3'); await ready(page); await settle(page);
    expect(await page.locator('.w3n:not(.w3n-off)').count()).toBeGreaterThanOrEqual(2);
    await go(page, '#T1/4', 'reward'); await settle(page);
    const notes = page.locator('.w3n-x:not(.w3n-off)'); expect(await notes.count()).toBeGreaterThanOrEqual(2);
    await page.locator('.w3n-x:not(.w3n-off)', { hasText: '奖牌' }).first().click();
    await expect(page.locator('.w3-card:not([hidden]) .w3-try')).toContainText('记住这一句');
    await page.locator('[data-act=cclose]').click();
    for (const h of ['#home', '#z1']) {
      await go(page, h); await settle(page);
      const tags = await page.locator('.w3n-x:not(.w3n-off)').count();
      expect(tags, `${h}: side tags`).toBeGreaterThanOrEqual(3);
    }
    expect(errs).toEqual([]);
  });
});
