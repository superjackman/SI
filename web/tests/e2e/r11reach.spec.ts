/* R11 (+R12/R13: max one tap per station from home): everything is reachable from T1 by tapping inside the content only — never the sidebar tree (More sheet), the
   drawer, the top-bar arrows or search. BFS by real clicks on the rendered pages: a station counts once a content link on an
   already-reached station takes us there; every card / lab / quiz sits on a reached station and every lab has a jump link
   on it; every part is linked from a reached page or from the popup of a reached part. zh + en, 360/390/430. */
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Lang = 'zh' | 'en';
type SI = { __si: { state(): { station: string; popup: { id: string } | null } } };
const KB = JSON.parse(readFileSync(new URL('../../src/legacy/gen/kb.json', import.meta.url), 'utf8')) as { TABORDER: string[]; C: Record<string, { t: string }> };
const ready = (page: Page, S: string, lang: Lang) => page.locator(`html[data-si-ready="${S}.${lang}"]`).waitFor({ state: 'attached' });
const station = (page: Page) => page.evaluate(() => (window as unknown as SI).__si.state().station);
const popup = (page: Page) => page.evaluate(() => (window as unknown as SI).__si.state().popup?.id ?? null);
/* content links of the active station, outside any chrome (tree, drawer, top bar, bottom nav live outside the section) */
const links = (page: Page, S: string) => page.evaluate((S) => {
  const sec = document.querySelector(`section#${S}`)!, go = new Set<string>(), open = new Set<string>(), jump = new Set<string>(), cards: [string, string][] = [];
  sec.querySelectorAll<HTMLElement>('[data-go]').forEach((e) => go.add(e.dataset.go!));
  sec.querySelectorAll<HTMLElement>('[data-ddgo]').forEach((e) => go.add(e.dataset.ddgo!));
  /* R13: the drill 🔍 badges on the full-stack T1 diagram */
  sec.querySelectorAll<SVGElement>('.dd-b[data-dd]').forEach((e) => go.add(e.dataset.dd!));
  sec.querySelectorAll<HTMLElement>('[data-open]').forEach((e) => open.add(e.dataset.open!));
  sec.querySelectorAll<HTMLElement>('.comp[data-id],.mini[data-id]').forEach((e) => open.add(e.dataset.id!));
  sec.querySelectorAll<HTMLElement>('[data-sj]').forEach((e) => jump.add(e.dataset.sj!));
  sec.querySelectorAll<HTMLElement>('[data-jump]').forEach((e) => jump.add(e.dataset.jump!));
  sec.querySelectorAll<HTMLElement>('.card[id]').forEach((c) => cards.push([c.id, c.className]));
  return { go: [...go], open: [...open], jump: [...jump], cards };
}, S);
const tap = (page: Page, sel: string) => page.locator(sel).first().evaluate((e) => e.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));

for (const lang of ['zh', 'en'] as Lang[]) test(`${lang}: every station, card, lab, quiz and part is reachable from T1 without the sidebar`, async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./?lang=${lang}#T1`); await ready(page, 'T1', lang);
  const via = new Map<string, string>([['T1', '']]), got = new Map<string, Awaited<ReturnType<typeof links>>>(), q = ['T1'];
  while (q.length) {
    const S = q.shift()!, P = via.get(S)!;
    if (P) { /* stand on the parent (already reached) and tap its content link to S */
      await page.goto(`./?lang=${lang}#${P}`); await ready(page, P, lang);
      await tap(page, `section#${P} [data-go="${S}"], section#${P} [data-ddgo="${S}"], section#${P} .dd-b[data-dd="${S}"]`);
      await ready(page, S, lang);
      expect(await station(page), `${P} → ${S}`).toBe(S);
    }
    const l = await links(page, S); got.set(S, l);
    for (const g of l.go) if (KB.TABORDER.includes(g) && !via.has(g)) { via.set(g, S); q.push(g); }
  }
  expect(KB.TABORDER.filter((S) => !via.has(S))).toEqual([]);
  /* R13: the home page's full-stack diagram (🔍 badges) links every station directly, so every station is one tap from T1 */
  expect(KB.TABORDER.filter((S) => S !== 'T1' && via.get(S) !== 'T1')).toEqual([]);
  /* cards / labs / quizzes: on a reached station; labs also have an explicit jump link on their station */
  let nCards = 0;
  for (const [S, l] of got) for (const [id, cls] of l.cards) { nCards++; if (/\blab\b/.test(cls) && !/lab-fail/.test(cls)) expect(l.jump, `${S}#${id}`).toContain(id); }
  expect(nCards).toBeGreaterThanOrEqual(218);
  /* parts: linked on a reached page, else from the popup of a reached part (opened by tapping its link) */
  /* the T8 cheat-sheet links every part, so it is left out here: each part must also be reachable from the teaching pages */
  const seen = new Map<string, string>(); for (const [S, l] of got) if (S !== 'T8') for (const p of l.open) if (KB.C[p] && !seen.has(p)) seen.set(p, S);
  const opened = new Set<string>();
  for (let guard = 0; guard < 400; guard++) {
    const miss = Object.keys(KB.C).filter((p) => !seen.has(p)); if (!miss.length) break;
    const p = [...seen.keys()].find((x) => !opened.has(x)); if (!p) break;
    opened.add(p); const S = seen.get(p)!;
    if ((await station(page)) !== S) { await page.goto(`./?lang=${lang}#${S}`); await ready(page, S, lang); }
    await tap(page, `section#${S} [data-open="${p}"], section#${S} .comp[data-id="${p}"], section#${S} .mini[data-id="${p}"], #modalBox [data-open="${p}"]`);
    await expect.poll(() => popup(page)).toBe(p);
    const more = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('#modalBox [data-open]')].map((e) => e.dataset.open!));
    for (const m of more) if (KB.C[m] && !seen.has(m)) seen.set(m, S);
    await page.keyboard.press('Escape'); await expect.poll(() => popup(page)).toBe(null);
  }
  expect(Object.keys(KB.C).filter((p) => !seen.has(p))).toEqual([]);
  console.log(`[reach ${lang}] stations ${via.size}, cards ${nCards}, parts ${seen.size} (popups opened ${opened.size})`);
  expect(errors).toEqual([]);
});
