/* R20: reasons to pass the site on. Quiz challenge (考考朋友) links with a comparison and a challenge-back, a progress card
   "lit X/22" and a certificate, lab setup links ("你能调出更好的吗？"), and gentle one-per-session share prompts. Everything
   is local; every link carries from=<source>; anything read from a link is checked, clamped and cleaned. */
import { test, expect, type Page } from '@playwright/test';
import jsQR from 'jsqr';
import fs from 'node:fs';

type Lang = 'zh' | 'en';
const KEY: Record<string, number[]> = JSON.parse(fs.readFileSync(new URL('../../src/legacy/gen/qkey.json', import.meta.url), 'utf8')).key;
const ORDER = ['T1', 'U', 'Ua', 'Ub', 'Uc', 'Ud', 'Up', 'T2', 'T3', 'N', 'T4', 'T4a', 'T4b', 'T5', 'T6', 'T7', 'T8', 'K1', 'K2', 'K3', 'K4', 'K5'];
const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64url');
async function at(page: Page, url: string, S: string, lang: Lang) {
  await page.goto(url);
  await page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached', timeout: 15_000 });
  await page.locator('section.level.active[data-late]').waitFor({ state: 'attached', timeout: 15_000 });
}
async function answer(page: Page, S: string, wrong: number[] = []) {
  for (const [i, r] of KEY[S]!.entries()) {
    const o = page.locator(`#quiz${S} .opt[data-q="${S}.${i}"][data-o="${wrong.includes(i) ? (r + 1) % 3 : r}"]`);
    await o.scrollIntoViewIfNeeded(); await o.click();
  }
}
async function qrText(page: Page): Promise<string | null> {
  const px = await page.locator('#cardPanel img.cp-img').evaluate(async (im: HTMLImageElement) => {
    await im.decode(); const [x, y, s] = im.dataset.qr!.split(',').map(Number) as [number, number, number], m = 24;
    const c = document.createElement('canvas'); c.width = c.height = s + 2 * m; const g = c.getContext('2d')!;
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, x - m, y - m, s + 2 * m, s + 2 * m, 0, 0, s + 2 * m, s + 2 * m);
    return { w: c.width, d: Array.from(g.getImageData(0, 0, c.width, c.width).data) };
  });
  return jsQR(Uint8ClampedArray.from(px.d), px.w, px.w)?.data ?? null;
}
const fresh = (page: Page) => page.evaluate(() => { const fs0 = localStorage.getItem('si.fs'); localStorage.clear(); sessionStorage.clear(); if (fs0) localStorage.setItem('si.fs', fs0); });
const evs = (page: Page) => page.evaluate(() => (window as unknown as { __ev: string[] }).__ev.slice());

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('si.fs', '0');
    const w = window as unknown as { __ev: string[] }; w.__ev = [];
    addEventListener('si-ev', (e) => w.__ev.push(String((e as CustomEvent).detail)));
  });
});

test('challenge: finish → 考考朋友 → link + image (QR = same link, from=chcard) → friend sees the banner, compares, can challenge back', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
  await at(page, './?lang=zh#T3', 'T3', 'zh');
  const q = page.locator('section.level.active .vr-q');
  await expect(q).toBeHidden();
  await answer(page, 'T3', [0]);
  const n = KEY.T3!.length;
  await expect(q).toContainText('把这站的小测发给朋友');
  await q.locator('[data-share-ch=challenge]').click();
  const img = page.locator('#cardPanel img.cp-img[data-kind=challenge]'); await img.waitFor();
  expect(await img.getAttribute('data-fit')).toBe('1');
  await page.fill('#cpNick', '小明<script>');
  await expect.poll(() => page.locator('#cardPanel .cp-url').inputValue()).toContain('-' + b64('小明script'));
  const url = await page.locator('#cardPanel .cp-url').inputValue();
  expect(url).toMatch(new RegExp(`\\?lang=zh&ch=${ORDER.indexOf('T3')}-${n - 1}-${n}-[\\w-]+&from=challenge#T3$`));
  const qr = await qrText(page);
  expect(qr).toBe(url.replace('from=challenge', 'from=chcard'));
  expect(await page.evaluate(() => localStorage.getItem('si.nick'))).toBe('小明script');
  await page.keyboard.press('Escape');

  /* the friend: new device (storage cleared) */
  await fresh(page);
  await at(page, url, 'T3', 'zh');
  expect(page.url()).not.toContain('ch=');
  expect(page.url()).toContain('from=challenge');
  const ban = page.locator('section.level.active .vr-ban.ch');
  await expect(ban).toBeInViewport();
  await expect(ban).toContainText(`小明script在「`); await expect(ban).toContainText(`答对了 ${n - 1}/${n} 题`);
  expect(await ban.innerHTML()).not.toContain('<script');
  await expect(q).toContainText(`小明script答对了 ${n - 1}/${n} 题。答完这一站的题，就能比一比。`);
  await ban.locator('[data-share-ch=challenge-go]').click();
  await expect(page.locator('#quizT3')).toBeInViewport({ ratio: 0.05 });
  await answer(page, 'T3');
  await expect(q).toContainText(`你答对 ${n}/${n} 题，小明script答对 ${n - 1}/${n} 题。`);
  await expect(q.locator('.vr-verdict')).toHaveText('你赢了！🎉');
  expect((await evs(page)).filter((e) => e === 'challenge-done')).toHaveLength(1);
  expect(await evs(page)).toContain('challenge-open');
  await q.locator('[data-share-ch=challenge-back]').click();
  await page.locator('#cardPanel img.cp-img[data-kind=challenge]').waitFor();
  const back = await page.locator('#cardPanel .cp-url').inputValue();
  expect(back).toContain(`ch=${ORDER.indexOf('T3')}-${n}-${n}`); expect(back).toContain('from=chback');
  expect(errors).toEqual([]);
});

test('challenge: tampered or hostile links show no banner and run nothing', async ({ page }) => {
  const n = KEY.T3!.length, i = ORDER.indexOf('T3');
  for (const raw of [`${i}-${n + 1}-${n}`, `${i}-1-${n + 2}`, `99-1-${n}`, `${ORDER.indexOf('T8')}-1-1`, `${i}-1-${n}-%3Cimg%3E`, 'x'.repeat(200)]) {
    await at(page, `./?lang=zh&ch=${raw}#T3`, 'T3', 'zh');
    await expect(page.locator('.vr-ban.ch')).toHaveCount(0);
    expect(await evs(page)).toContain('challenge-bad');
    expect(page.url()).not.toContain('ch=');
    await fresh(page);
  }
  await page.goto('about:blank');
  await at(page, `./?lang=en&ch=${i}-2-${n}-${b64('<img src=x onerror=window.__x=1>')}#T3`, 'T3', 'en');
  const ban = page.locator('.vr-ban.ch'); await expect(ban).toBeVisible();
  await expect(ban.locator('img')).toHaveCount(0);
  expect(await ban.textContent()).not.toMatch(/[<>]/);
  expect(await page.evaluate(() => (window as unknown as { __x?: number }).__x)).toBeUndefined();
  /* closing the banner keeps it closed for this session */
  await ban.locator('.vr-x').click(); await expect(ban).toHaveCount(0);
  await at(page, './?lang=en#T3', 'T3', 'en'); await page.reload(); await page.locator('section.level.active[data-late]').waitFor({ state: 'attached' });
  await expect(page.locator('.vr-ban.ch')).toHaveCount(0);
});

test('progress card + certificate: the rule is stated, the map fits, the certificate needs all 22 + 60 %, name stays local', async ({ page }) => {
  test.setTimeout(60_000);
  const ans: Record<string, number> = {}; for (const [S, k] of Object.entries(KEY)) k.forEach((r, i) => { ans[S + '.' + i] = r; });
  await at(page, './?lang=zh#T1', 'T1', 'zh');
  await page.evaluate(([o, a]) => { localStorage.setItem('aiexp.v2.visited', JSON.stringify(o)); localStorage.setItem('aiexp.v2.quiz', JSON.stringify(a)); }, [ORDER.slice(0, 15), ans] as const);
  const pc = page.locator('section.level.active .m-pn .pn-pc').last(); await pc.scrollIntoViewIfNeeded(); await pc.click();
  const img = page.locator('#cardPanel img.cp-img[data-kind=progress]'); await img.waitFor();
  expect(await img.evaluate((i: HTMLImageElement) => [i.naturalWidth, i.naturalHeight, i.dataset.fit, i.dataset.lit, i.dataset.cert])).toEqual([1080, 1920, '1', '15', '0']);
  await expect(page.locator('#cardPanel')).toContainText('点亮规则：打开过这一站，并做完它的小测');
  await expect(page.locator('#cardPanel [data-act=cert]')).toHaveCount(0);
  expect(await qrText(page)).toMatch(/\/\?lang=zh&from=progress#T1$/);
  await page.keyboard.press('Escape');
  for (const L of ['en', 'zh'] as Lang[]) {
    await at(page, `./?lang=${L}#T1`, 'T1', L);
    await page.locator('section.level.active .m-pn .pn-pc').last().click();
    await expect(page.locator('#cardPanel img.cp-img[data-kind=progress]')).toHaveAttribute('data-fit', '1');
    await page.keyboard.press('Escape');
  }
  /* all 22 opened: certificate offered; from the menu too */
  await page.evaluate((o) => localStorage.setItem('aiexp.v2.visited', JSON.stringify(o)), ORDER);
  await page.locator('#bnav [data-bn="more"]').click();
  await expect(page.locator('#moreSheet')).toHaveClass(/open/);
  await page.locator('#shProgCard').click();
  await page.locator('#cardPanel img.cp-img[data-kind=progress][data-cert="1"]').waitFor();
  await page.locator('#cardPanel [data-act=cert]').click();
  const cert = page.locator('#cardPanel img.cp-img[data-kind=cert]'); await cert.waitFor();
  await page.fill('#cpName', '李小辉<b>'); await page.locator('#cpName').press('Enter');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('si.name'))).toBe('李小辉b');
  await expect(cert).toHaveAttribute('data-fit', '1');
  expect(await qrText(page)).toMatch(/from=cert#T1$/);
  expect(await page.evaluate(() => localStorage.getItem('si.done'))).toMatch(/^\d{4}-\d\d-\d\d$/);
});

test('lab setup: share → link restores the setup (checked + clamped) → "你能调出更好的吗？"; a broken link leaves the lab alone', async ({ page }) => {
  test.setTimeout(60_000);
  await at(page, './?lang=zh#K4', 'K4', 'zh');
  const row = page.locator('.vr-lab[data-for=labGD]'); await row.scrollIntoViewIfNeeded();
  await expect(row.locator('[data-share-ch=lab-share]')).toHaveText('分享这个设置');
  await page.locator('#gdE').evaluate((e: HTMLInputElement) => { e.dispatchEvent(new FocusEvent('focusin', { bubbles: true })); e.value = '0.65'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.evaluate(() => { Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); });
  await row.locator('[data-share-ch=lab-share]').click();
  const url = await row.locator('.vr-url').inputValue();
  expect(url).toMatch(/\?lang=zh&lab=labGD\.[\w-]+&from=lab#K4\/labGD$/);
  await fresh(page);
  await at(page, url, 'K4', 'zh');
  await expect(page.locator('.vr-ban.lab')).toContainText('你能调出更好的吗？');
  await expect(page.locator('#gdE')).toHaveValue('0.65');
  expect(page.url()).not.toContain('lab=');
  /* out of range → clamped to the slider's max; junk values ignored */
  await at(page, `./?lang=zh&lab=labGD.${b64(JSON.stringify({ gdE: '99', zz: '<x>' }))}#K4/labGD`, 'K4', 'zh');
  await expect(page.locator('.vr-ban.lab')).toBeVisible();
  await expect(page.locator('#gdE')).toHaveValue('1.2');
  await at(page, `./?lang=zh&lab=labGD.@@@#K4`, 'K4', 'zh');
  await expect(page.locator('.vr-ban.lab')).toContainText('看不懂');
  await expect(page.locator('#gdE')).toHaveValue('0.2');
  expect(await evs(page)).toContain('lab-bad');
});

test('prompts: inline (never a dialog), at most one per session, a dismissed kind stays dismissed', async ({ page }) => {
  test.setTimeout(60_000);
  await at(page, './?lang=en#T3', 'T3', 'en');
  await answer(page, 'T3');
  const nd = page.locator('section.level.active .vr-q .vr-nudge[data-kind=quiz]');
  await expect(nd).toContainText('All correct! Want to challenge a friend?');
  await expect(page.locator('#cardPanel')).toHaveCount(0);
  await expect(page.locator('#moreSheet')).not.toHaveClass(/open/);
  expect(await evs(page)).toContain('nudge-quiz');
  /* a second all-correct in the same session: no second prompt */
  await at(page, './?lang=en#T4', 'T4', 'en'); await answer(page, 'T4');
  await expect(page.locator('section.level.active .vr-q')).toBeVisible();
  await expect(page.locator('.vr-nudge')).toHaveCount(0);
  /* dismiss → remembered across sessions */
  await page.evaluate(() => { sessionStorage.clear(); const q = JSON.parse(localStorage.getItem('aiexp.v2.quiz') || '{}'); for (const k of Object.keys(q)) if (k.startsWith('T3.')) delete q[k]; localStorage.setItem('aiexp.v2.quiz', JSON.stringify(q)); });
  await at(page, './?lang=en#T3', 'T3', 'en'); await page.reload(); await page.locator('section.level.active[data-late]').waitFor({ state: 'attached' });
  await answer(page, 'T3');
  await nd.locator('.vr-x').click(); await expect(nd).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('si.nudge.off'))).toBe('["quiz"]');
  await page.evaluate(() => { sessionStorage.clear(); const q = JSON.parse(localStorage.getItem('aiexp.v2.quiz') || '{}'); for (const k of Object.keys(q)) if (k.startsWith('T3.')) delete q[k]; localStorage.setItem('aiexp.v2.quiz', JSON.stringify(q)); });
  await page.reload(); await page.locator('section.level.active[data-late]').waitFor({ state: 'attached' });
  await answer(page, 'T3');
  await expect(page.locator('section.level.active .vr-q')).toBeVisible();
  await expect(page.locator('.vr-nudge')).toHaveCount(0);
});

test('first load stays small: the R20 code is lazy (cards only on demand)', async ({ page, request }) => {
  const got: string[] = []; page.on('request', (r) => { if (/\/assets\/[\w-]+\.js$/.test(r.url())) got.push(r.url().split('/').pop()!); });
  const html = await (await request.get('./')).text();
  expect(html).not.toMatch(/late-|cards-|codec-/);
  await at(page, './?lang=zh#T3', 'T3', 'zh');
  expect(got.some((u) => u.startsWith('cards-'))).toBe(false);
  await answer(page, 'T3'); await page.locator('.vr-q [data-share-ch=challenge]').click(); await page.locator('#cardPanel img.cp-img').waitFor();
  expect(got.some((u) => u.startsWith('cards-'))).toBe(true);
});

for (const w of [360, 412, 430]) test(`layout ${w}px: the new rows, banners, prompts and sheets fit without squeezed text`, async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: w, height: 860 });
  for (const lang of ['zh', 'en'] as Lang[]) {
    await fresh(page).catch(() => {});
    const n = KEY.T3!.length;
    await at(page, `./?lang=${lang}&ch=${ORDER.indexOf('T3')}-1-${n}-${b64('Alexandra小明')}#T3`, 'T3', lang);
    await answer(page, 'T3');
    const bad = await page.evaluate(() => {
      const out: string[] = [];
      if (document.documentElement.scrollWidth > innerWidth + 1) out.push('page overflow ' + document.documentElement.scrollWidth);
      for (const e of document.querySelectorAll<HTMLElement>('section.level.active :is(.pn-acts button, .vr-ban, .vr-ban button, .vr-q, .vr-q button, .vr-q p, .vr-lab button, .vr-nudge, .vr-nudge button, .vr-row button)')) {
        if (!e.offsetParent) continue;
        const r = e.getBoundingClientRect();
        if (r.right > innerWidth + 1 || r.left < -1) out.push('off-screen ' + e.className + ' ' + r.left + '-' + r.right);
        if (e.scrollWidth > e.clientWidth + 1) out.push('clipped ' + e.className + ' ' + e.textContent);
        if (e.tagName === 'BUTTON' && r.width < 44) out.push('narrow ' + e.className + ' ' + r.width);
        const lh = parseFloat(getComputedStyle(e).lineHeight) || 20;
        if (e.tagName === 'BUTTON' && !e.classList.contains('vr-x') && r.height > lh * 3 + 24) out.push('squeezed ' + e.textContent + ' ' + r.height);
        if (e.tagName === 'P' && r.width < 160) out.push('thin text ' + r.width);
      }
      return out;
    });
    expect(bad, `${lang} ${w}`).toEqual([]);
    await page.locator('.vr-q [data-share-ch=challenge-back]').click();
    await page.locator('#cardPanel img.cp-img').waitFor();
    const sheet = await page.evaluate(() => {
      const out: string[] = [];
      for (const e of document.querySelectorAll<HTMLElement>('#cardPanel :is(.cp-f, .cp-f input, .cp-b, .cp-url, .cp-note, img.cp-img)')) {
        const r = e.getBoundingClientRect();
        if (r.right > innerWidth + 1 || r.left < -1) out.push('off-screen ' + e.className);
        if (e.tagName !== 'INPUT' && e.scrollWidth > e.clientWidth + 1) out.push('clipped ' + e.className);
      }
      return out;
    });
    expect(sheet, `sheet ${lang} ${w}`).toEqual([]);
    await page.keyboard.press('Escape');
  }
});

test('prompts: after real play in a lab (≥ 4 changes, ≥ 6 s) and at the end of a stop (≥ 20 s here)', async ({ page }) => {
  test.setTimeout(60_000);
  await page.clock.install();
  await at(page, './?lang=zh#K4', 'K4', 'zh');
  const e = page.locator('#gdE'); await e.scrollIntoViewIfNeeded(); await e.focus();
  for (let i = 0; i < 4; i++) { await page.keyboard.press('ArrowRight'); await page.clock.fastForward(2000); }
  await expect(page.locator('.vr-lab[data-for=labGD] .vr-nudge[data-kind=lab]')).toContainText('把这个设置发给朋友');
  expect(await evs(page)).toContain('nudge-lab');
  /* new session, prompt kinds not dismissed: the stop prompt shows once the end is on screen after 20 s */
  await page.evaluate(() => sessionStorage.clear());
  await at(page, './?lang=zh#T2', 'T2', 'zh');
  const end = page.locator('section.level.active .pn-acts').last(); await end.scrollIntoViewIfNeeded();
  await page.clock.fastForward(21_000);
  await expect(page.locator('section.level.active .vr-nudge[data-kind=stop]')).toContainText('读完这一站啦');
});
