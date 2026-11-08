import { test, expect } from '@playwright/test';
import { DV_KEY } from '../../src/dv/links';

/* Figures stay inside the text column and lesson buttons sit on the right of their row. */
const ORIGIN = 'http://localhost:' + (process.env.SI_E2E_PORT || '4173');
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: [{ name: 'si.onb', value: '1' }, { name: 'si.a2hs', value: '1' }] }] } });

test('lesson figures stay within the text column and buttons sit on the right', async ({ page }, info) => {
  test.skip(info.project.name !== 'd1440', 'measured once, at three viewports');
  test.setTimeout(300_000);
  for (const width of [1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./?lang=zh#D/0');
    await page.locator('.st-article').waitFor();
    for (const k of DV_KEY) {
      await page.evaluate((h) => { location.replace(h); }, `#D/${k}`);
      await expect(page.locator('#l4')).toHaveAttribute('data-px', `D/${k}.zh`);
      await page.locator('[data-fig="scene"] svg').waitFor();
      const bad = await page.evaluate(() => {
        const art = document.querySelector('.st-article') as HTMLElement;
        const artW = art.getBoundingClientRect().width;
        const shown = (el: Element) => {
          const h = el as HTMLElement;
          if (h.hidden || h.closest('[hidden]')) return false;
          const s = getComputedStyle(h);
          if (s.display === 'none' || s.visibility === 'hidden') return false;
          const r = h.getBoundingClientRect();
          return r.width > 2 && r.height > 2;
        };
        const figs = [...art.querySelectorAll('[data-fig], svg, canvas, .vf-plot, .ly-anim, .ly-stage')].filter(shown);
        const wide = figs.filter((el) => {
          const r = el.getBoundingClientRect();
          const exp = el.getAttribute('data-fig') === 'exp';
          return r.width > artW + 2 || (!exp && r.height > 420);
        }).map((el) => {
          const r = el.getBoundingClientRect();
          const kids = [...el.children].map((c) => `${c.className || c.tagName}:${Math.round(c.getBoundingClientRect().height)}`).join(' ');
          return `${el.getAttribute('data-fig') || ''} ${el.className || el.tagName} ${Math.round(r.width)}x${Math.round(r.height)} [${kids}]`;
        });
        const contentRight = (el: HTMLElement) => {
          const r = el.getBoundingClientRect();
          return r.right - parseFloat(getComputedStyle(el).paddingRight || '0');
        };
        const buttons = [...art.querySelectorAll('button')].filter(shown) as HTMLElement[];
        const rows = new Set(buttons.map((b) => b.parentElement).filter(Boolean) as HTMLElement[]);
        const align: string[] = [];
        for (const row of rows) {
          const mates = [...row.querySelectorAll(':scope > button')].filter(shown) as HTMLElement[];
          if (!mates.length) continue;
          const edge = contentRight(row);
          const cluster = Math.max(...mates.map((b) => b.getBoundingClientRect().right));
          const gap = edge - cluster;
          if (gap > 24 || gap < -2) align.push(`${mates[0]!.textContent?.trim().slice(0, 16)} gap ${Math.round(gap)}`);
        }
        return { wide, align };
      });
      expect(bad.wide, `${width} ${k} fig`).toEqual([]);
      expect(bad.align, `${width} ${k} btn`).toEqual([]);
    }
  }
});
