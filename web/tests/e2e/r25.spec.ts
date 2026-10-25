/* R25: the six "I want to…" doorways (R27: on the home page), the 🔌 Api and 💻 Loc stops (boundary line on top, cost and memory
   calculators), and their place in the drawer, search and prev/next. zh + en on 360/390/430. */
import { nextSel, prevStop } from './r28h';
import { test, expect, type Page } from '@playwright/test';

type Lang = 'zh' | 'en';
const CJK = /[\u3400-\u9fff]/;
const act = 'section.level.active';
async function open(page: Page, lang: Lang, S: string) {
  await page.goto(`./?lang=${lang}#${S}`);
  await page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached' });
  await expect(page.locator(`${act} .pagehead`)).toBeVisible();
}
const ready = (page: Page, S: string, lang: Lang) => page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached' });
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
/** every element in sel sits inside the screen */
const inside = (page: Page, sel: string) => page.evaluate((sel) => {
  const cw = document.documentElement.clientWidth;
  return [...document.querySelectorAll<HTMLElement>(sel)].filter((e) => e.getClientRects().length).map((e) => [e, e.getBoundingClientRect()] as const)
    .filter(([, r]) => r.left < -0.5 || r.right > cw + 0.5).map(([e]) => (e.textContent ?? '').slice(0, 20));
}, sel);
const startLab = async (page: Page, id: string) => { await page.locator(`#${id}`).scrollIntoViewIfNeeded(); await page.locator(`#${id} select`).first().focus(); };

for (const lang of ['zh', 'en'] as Lang[]) {
  const tr = (zh: string, en: string) => (lang === 'zh' ? zh : en);

  /* R27: the doorways moved to the home page (bare URL); their old shortcut chips became the zones' ⬇ links, the 🧠 door's route chips the T1 route map */
  test(`${lang} home doorways: six doors, inside the screen, each goes where it says; Uc / Up one ⬇ further; routes on T1`, async ({ page }) => {
    const home = async () => { await page.goto(`./?lang=${lang}`); await ready(page, 'H', lang); };
    await home();
    const d = page.locator(`${act} .m-door`);
    await expect(d.locator('.dr-m')).toHaveCount(6);
    await expect(d).toBeInViewport({ ratio: 0.3 });
    expect(await inside(page, `${act} .m-door .dr-m`)).toEqual([]);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    if (lang === 'en') expect(CJK.test(await d.innerText())).toBe(false);
    for (const S of ['Api', 'Loc', 'Job', 'Skl', 'Bld', 'T1'] as const) {
      await home();
      await page.locator(`${act} .m-door [data-go="${S}"]`).click();
      await ready(page, S, lang);
    }
    await expect(page.locator(`${act} .m-stage svg`).first()).toBeAttached(); /* the T1 diagram stays */
    for (const [Z, S] of [['Skl', 'Uc'], ['Job', 'Up']] as const) {
      await open(page, lang, Z);
      await page.locator(`${act} .m-zone .mz-dn [data-go="${S}"]`).click();
      await ready(page, S, lang);
    }
    await open(page, lang, 'T1');
    await page.locator(`${act} .m-rmap [data-route="all"]`).click();
    await ready(page, 'T2', lang);
    expect(await page.evaluate(() => localStorage.getItem('aiexp.v2.route'))).toBe('all');
    await open(page, lang, 'T1');
    await page.locator(`${act} .m-rmap [data-route="kid"]`).click();
    await expect(page.locator(`${act} [data-ob="route"]`)).toContainText('1/6');
  });

  for (const S of ['Api', 'Loc'] as const) test(`${lang} ${S}: boundary line on top, page fits, in drawer order, prev/next`, async ({ page }) => {
    await open(page, lang, S);
    const bd = page.locator(`${act} .pl-top .pl-bd`);
    await expect(bd).toBeVisible();
    await expect(bd).toContainText(tr('这里不讲', 'Not covered'));
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    if (lang === 'en') expect(CJK.test(await page.locator(`${act}`).innerText())).toBe(false);
    await expect(page.locator(`${act} .ph-lv`)).toContainText(S === 'Api' ? tr('第 8 站 / 共 27 站', 'Stop 8 of 27') : tr('第 9 站 / 共 27 站', 'Stop 9 of 27'));
    await page.locator(nextSel(S)).click();
    const N = S === 'Api' ? 'Loc' : 'Job';
    await ready(page, N, lang);
    await prevStop(page, N); /* R28 pilot (Job): no ‹ in the header, a swipe goes back */
    await ready(page, S, lang);
  });

  test(`${lang} Api cost calculator: per call, per day, per month; more output costs more; cache hits cost less`, async ({ page }) => {
    await open(page, lang, 'Api');
    await startLab(page, 'labCost');
    const out = page.locator('#ckOut2');
    await expect(out).toHaveAttribute('data-month', /\d/);
    const m0 = Number(await out.getAttribute('data-month'));
    expect(m0).toBeGreaterThan(0);
    await expect(out).toContainText(tr('元', 'yuan'));
    await page.locator('#ckOut').fill('2000'); await page.locator('#ckOut').dispatchEvent('input');
    await expect.poll(async () => Number(await out.getAttribute('data-month'))).toBeGreaterThan(m0);
    const m1 = Number(await out.getAttribute('data-month'));
    await page.locator('#ckHit').fill('80'); await page.locator('#ckHit').dispatchEvent('input');
    await expect.poll(async () => Number(await out.getAttribute('data-month'))).toBeLessThan(m1);
    await expect(page.locator('#labCost')).toContainText(tr('核对于 2026-10-24', 'checked 2026-10-24'));
    expect(await inside(page, '#labCost .ctrls label, #ckOut2, #ckBar')).toEqual([]);
    if (lang === 'en') expect(CJK.test(await page.locator('#labCost').innerText())).toBe(false);
  });

  test(`${lang} Loc memory calculator: 8B Q4 fits in 16 GB, 70B does not`, async ({ page }) => {
    await open(page, lang, 'Loc');
    await startLab(page, 'labMem');
    const out = page.locator('#lmOut');
    await expect(out).toHaveAttribute('data-verdict', 'ok');
    await page.locator('#lmP').selectOption('70');
    await expect(out).toHaveAttribute('data-verdict', 'no');
    await expect(out).toContainText(tr('装不下', 'Does not fit'));
    expect(await inside(page, '#labMem .ctrls label, #lmOut, #lmBar')).toEqual([]);
    if (lang === 'en') expect(CJK.test(await page.locator('#labMem').innerText())).toBe(false);
  });

  test(`${lang} search finds both new stops`, async ({ page }) => {
    await open(page, lang, 'T1');
    await page.locator('#mSearch').click();
    await page.locator('#search').fill(tr('密钥', 'API key'));
    await expect(page.locator('#searchRes')).toContainText(tr('密钥', 'key'));
    await page.locator('#search').fill(tr('量化', 'GGUF'));
    await expect(page.locator('#searchRes')).toContainText(tr('量化', 'GGUF'));
  });
}
