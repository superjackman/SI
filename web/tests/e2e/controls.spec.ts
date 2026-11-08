import { test, expect } from '@playwright/test';
import { DV_KEY } from '../../src/dv/links';

/* Lesson controls: one action row, one card, no dashed answer box. See web/docs/ui-spec.md. */
const ORIGIN = 'http://localhost:' + (process.env.SI_E2E_PORT || '4173');
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: [{ name: 'si.onb', value: '1' }, { name: 'si.a2hs', value: '1' }] }] } });

test('lesson controls share a row, one card, and a solid answer panel', async ({ page }, info) => {
  test.skip(info.project.name !== 'd1440', 'measured once, at three viewports');
  test.setTimeout(300_000);
  for (const width of [1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./?lang=zh#D/0');
    await page.locator('.st-article').waitFor();
    for (const k of DV_KEY) {
      await page.evaluate((h) => { location.replace(h); }, `#D/${k}`);
      await expect(page.locator('#l4')).toHaveAttribute('data-px', `D/${k}.zh`);
      await page.locator('.vf-q, .ml-num').first().waitFor();
      const read = () => page.evaluate(() => {
        const art = document.querySelector('.st-article') as HTMLElement;
        const shown = (el: Element) => {
          const h = el as HTMLElement;
          if (h.hidden || h.closest('[hidden]')) return false;
          const s = getComputedStyle(h);
          if (s.display === 'none' || s.visibility === 'hidden') return false;
          const r = h.getBoundingClientRect();
          return r.width > 2 && r.height > 2;
        };
        const cy = (el: Element) => { const r = el.getBoundingClientRect(); return r.top + r.height / 2; };
        const edge = (el: HTMLElement) => el.getBoundingClientRect().right - parseFloat(getComputedStyle(el).paddingRight || '0');
        const rowBad: string[] = [];
        for (const input of [...art.querySelectorAll('.vf-in')].filter(shown)) {
          const row = input.closest('.vf-row') as HTMLElement | null;
          const ck = row?.querySelector('.vf-ck, .ml-ck');
          const sw = row?.querySelector('.vf-sw');
          if (!row || !ck || !shown(ck)) { rowBad.push('检查不在输入行'); continue; }
          if (!sw || !shown(sw)) rowBad.push('看解答不在输入行');
          if (Math.abs(cy(input) - cy(ck)) > 2) rowBad.push(`检查中线差 ${Math.abs(cy(input) - cy(ck)).toFixed(1)}`);
          if (sw && Math.abs(cy(input) - cy(sw)) > 2) rowBad.push(`看解答中线差 ${Math.abs(cy(input) - cy(sw)).toFixed(1)}`);
          const right = Math.max(...[...row.querySelectorAll('button')].filter(shown).map((b) => b.getBoundingClientRect().right));
          const gap = edge(row) - right;
          if (gap > 24 || gap < -2) rowBad.push(`行右距 ${Math.round(gap)}`);
        }
        for (const sw of [...art.querySelectorAll('.vf-foot .vf-sw')].filter(shown)) {
          const foot = sw.parentElement as HTMLElement;
          const gap = edge(foot) - sw.getBoundingClientRect().right;
          if (gap > 24 || gap < -2) rowBad.push(`选择页脚右距 ${Math.round(gap)}`);
          if (foot.querySelector('.vf-ck, .ml-ck')) rowBad.push('选择页脚里有检查');
        }
        const full = (el: Element) => {
          const s = getComputedStyle(el);
          return ['top', 'right', 'bottom', 'left'].every((side) => {
            const w = parseFloat(s.getPropertyValue(`border-${side}-width`));
            const st = s.getPropertyValue(`border-${side}-style`);
            return w >= 1 && st !== 'none' && st !== 'hidden';
          });
        };
        const nest: string[] = [];
        for (const card of art.querySelectorAll('.vf-q, .ml-p')) {
          for (const el of card.querySelectorAll('div, section, li, aside, ol, p')) {
            if (full(el)) nest.push((el as HTMLElement).className || el.tagName);
          }
        }
        const dash: string[] = [];
        for (const el of art.querySelectorAll('.vf-sol, .vf-fb, .ml-fb, .ml-dead, .ml-live, .ui-panel')) {
          const s = getComputedStyle(el);
          for (const side of ['top', 'right', 'bottom', 'left']) {
            if (s.getPropertyValue(`border-${side}-style`) === 'dashed') dash.push((el as HTMLElement).className || el.tagName);
          }
        }
        const ctl = art.querySelector('.vf-ctl');
        const play = ctl?.querySelector('button');
        const slider = ctl?.querySelector('input[type="range"]');
        if (ctl && play && slider && shown(play) && shown(slider)) {
          if (Math.abs(cy(play) - cy(slider)) > 2) rowBad.push(`播放中线差 ${Math.abs(cy(play) - cy(slider)).toFixed(1)}`);
          const gap = edge(ctl as HTMLElement) - play.getBoundingClientRect().right;
          if (gap > 24 || gap < -2) rowBad.push(`播放右距 ${Math.round(gap)}`);
        }
        return { rowBad, nest, dash };
      });
      const closed = await read();
      expect(closed.rowBad, `${width} ${k} row`).toEqual([]);
      expect(closed.nest, `${width} ${k} nest`).toEqual([]);
      expect(closed.dash, `${width} ${k} dash`).toEqual([]);
      const toggles = page.locator('.st-article .vf-sw[aria-expanded="false"]');
      const n = await toggles.count();
      for (let i = 0; i < n; i++) await page.locator('.st-article .vf-sw[aria-expanded="false"]').first().click();
      const open = await read();
      expect(open.rowBad, `${width} ${k} open row`).toEqual([]);
      expect(open.dash, `${width} ${k} open dash`).toEqual([]);
    }
  }
});
