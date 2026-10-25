/* R28 pilot helpers for the older specs: on the pilot pages (src/shell/r28.ts) the header has no ‹ › / EN and the
   bottom bar is 目录 · 进度 · 下一站 (none on the home page). The specs keep testing the same jobs through the new places. */
import type { Page } from '@playwright/test';
import { isR28 } from '../../src/shell/r28set';
export { isR28 };
export const DOCK5 = ['toc', 'lab', 'quiz', 'prog', 'next'];
export const DOCK3 = ['toc', 'prog', 'next'];
export const dockOf = (S: string) => (isR28(S) ? (S === 'H' ? [] : DOCK3) : DOCK5);
/** the "next stop" control on page S: the header ▶ on the old skeleton, the bottom bar's 下一站 on the pilot pages */
export const nextSel = (S: string) => (isR28(S) ? '#bnav [data-bn="next"]' : '#mNext');
/** switch the language the way a reader would on that page: EN in the header, or ☰ → 中文 / English on the pilot pages */
export async function tapLang(page: Page) {
  /* the header EN: a DOM click, as before (the specs switch with a card open, which covers the header) */
  if (await page.locator('#mLang').count()) { await page.evaluate(() => document.getElementById('mLang')!.click()); return; }
  const want = (await page.evaluate(() => document.documentElement.lang)).startsWith('en') ? 'zh' : 'en';
  /* ☰ → 中文 / English; DOM clicks too, so a popup left open (the language switch keeps it) does not block the tap */
  await page.evaluate(() => document.getElementById('mMenu')!.click());
  await page.locator(`#mDrawer [data-setlang="${want}"]`).waitFor({ state: 'attached' });
  await page.evaluate((w) => document.querySelector<HTMLElement>(`#mDrawer [data-setlang="${w}"]`)!.click(), want);
}
/** the reader's swipe left (dir 1, next) / right (dir -1, previous) on a plain paragraph of the active page — the way back
    a stop on the pilot pages, which have no ‹ in the header (synthetic touch events, same handler as a finger) */
export async function swipe(page: Page, dir: 1 | -1) {
  await page.evaluate((dir) => {
    const NO = '.m-dg,.m-stage,input,textarea,select,canvas,.tscroll,.hm-wrap,.scroll,pre,table,.chips,.m-tabs,.sheet,#tour,#modal,.toks,.experts,.frames,[data-noswipe],button,a';
    const p = [...document.querySelectorAll<HTMLElement>('section.level.active p, section.level.active h1')].find((e) => !e.closest(NO) && e.getClientRects().length)!;
    const t = (x: number) => new Touch({ identifier: 1, target: p, clientX: x, clientY: 300 });
    const a = dir > 0 ? 300 : 60, b = dir > 0 ? 60 : 300;
    p.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [t(a)], changedTouches: [t(a)] }));
    p.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [t(b)] }));
  }, dir);
}
/** one stop back in the 27-stop order: the header ◀ on the old skeleton, a swipe on the pilot pages */
export async function prevStop(page: Page, S: string) { if (isR28(S)) await swipe(page, -1); else await page.locator('#mPrev').click(); }
/** R28: labs and the quiz live in the bottom bar's 目录 — open it, read the kinds of its rows (k-lab / k-quiz / …), close it */
export async function tocKinds(page: Page): Promise<string[]> {
  await page.locator('#bnav [data-bn="toc"]').click();
  await page.locator('#dkSheet[data-k="toc"].open #dkToc').waitFor();
  const k = await page.locator('#dkToc .dk-it').evaluateAll((b) => b.map((e) => [...e.classList].find((c) => c.startsWith('k-'))!.slice(2)));
  await page.locator('#bnav [data-bn="toc"]').click();
  await page.locator('#dkSheet.open').waitFor({ state: 'detached' }).catch(() => {});
  return k;
}
