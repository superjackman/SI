import { test, expect } from '@playwright/test';
import { DV_KEY } from '../../src/dv/links';

/* Every station is an outline plus one lesson. Nothing is tucked behind a step control. */
const ORIGIN = 'http://localhost:' + (process.env.SI_E2E_PORT || '4173');
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: [{ name: 'si.onb', value: '1' }, { name: 'si.a2hs', value: '1' }] }] } });

test('every station is an outline and one article, with the lesson already in the page', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('./?lang=zh#D/0');
  await page.locator('.st-article').waitFor();
  for (const k of DV_KEY) {
    await page.evaluate((h) => { location.replace(h); }, `#D/${k}`);
    await expect(page.locator('#l4')).toHaveAttribute('data-px', `D/${k}.zh`);
    await expect(page.locator('.st-out')).toHaveCount(1);
    await expect(page.locator('.st-article')).toHaveCount(1);
    await expect(page.locator('.st-side, .st-tabs, .ly-dep, .ly-pg, .ly-go, .ml-goal, .ml-bar')).toHaveCount(0);
    await expect(page.locator('.ly-l:not([hidden])')).toHaveCount(5);
    await expect(page.locator('.st-code')).toBeAttached();
    await expect(page.locator('.ly-fx .fx-line').first()).toBeAttached();
    await expect(page.locator('.st-inline, .st-side')).toHaveCount(0);
    const adjacent = await page.evaluate(() => {
      const demo = document.querySelector('[data-vf-part="demo"]');
      return !!demo?.nextElementSibling?.classList.contains('st-live');
    });
    expect(adjacent, k).toBe(true);
    const text = await page.locator('.st-article').innerText();
    for (const s of ['先自己算，再填进去', '拖一下，从图到式子', '同一件事，写成图', '这几个词', '连对 0/', '用 NumPy']) expect(text, `${k} ${s}`).not.toContain(s);
    const dup = await page.evaluate(() => {
      const norm = (s: string) => s.replace(/\s+/g, '').trim();
      const blocks = [...document.querySelectorAll('.fx-line, .fx-sym p')].map((e) => norm(e.textContent || '')).filter((t) => t.length > 8);
      const seen = new Map<string, number>();
      for (const t of blocks) seen.set(t, (seen.get(t) || 0) + 1);
      return [...seen.entries()].filter(([, n]) => n > 1).map(([t]) => t);
    });
    expect(dup, k).toEqual([]);
    await expect(page.locator('.dv-take li')).toHaveCount(3);
    await expect(page.locator('.dv-end [data-fwd="1"]')).toHaveCount(1);
    const figs = await page.locator('[data-fig]').evaluateAll((els) => els.map((e) => e.getAttribute('data-fig') || ''));
    expect(new Set(figs).size, k).toBe(figs.length);
    await expect(page.locator('[data-fig="scene"] svg')).toBeVisible();
    const stacked = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.st-article .ml-num, .st-article .ml-pred, .st-article .st-q, .st-article .ml-i')].filter((el) => (el as HTMLElement).offsetParent);
      const paras = [...document.querySelectorAll('.st-article p')].filter((p) => !p.classList.contains('fx-line') && !p.classList.contains('formula') && !p.closest('.ml-num, .ml-pred, .st-q, .ml-i, .vf-qz'));
      const bad: string[] = [];
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i]!;
        const before = paras.filter((p) => p.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING);
        const last = before[before.length - 1];
        const n = (last?.textContent || '').replace(/\s+/g, '').length;
        const crossed = cards.slice(0, i).some((q) => last && (last.compareDocumentPosition(q) & Node.DOCUMENT_POSITION_FOLLOWING) && (q.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING));
        if (!last || n < 60 || crossed) bad.push(`${n}${crossed ? ' crossed' : ''} before ${card.className}`);
      }
      return bad;
    });
    expect(stacked, k).toEqual([]);
    const order = await page.evaluate(() => {
      const take = document.querySelector('.dv-take');
      if (!take) return ['no-take'];
      return [...document.querySelectorAll('.vf-qz, .ml-v, .ml-i')].filter((el) => take.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).map((el) => el.className);
    });
    expect(order, k).toEqual([]);
    const stray = await page.locator('.st-article').innerText();
    expect(stray.split('\n').map((s) => s.trim()).filter((s) => /^\[[0-9]+,\s*$/.test(s) || s === 'undefined' || s.startsWith('[object ')), k).toEqual([]);
    const width = await page.locator('.st-article').evaluate((el) => parseFloat(getComputedStyle(el).maxWidth));
    expect(width, k).toBeLessThanOrEqual(820);
    expect(width, k).toBeGreaterThanOrEqual(760);
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  }
});
