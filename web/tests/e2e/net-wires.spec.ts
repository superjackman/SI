import { test, expect } from '@playwright/test';
import { ML_AT_REASON } from './ml-open';

/* The network picture: every connection is one unbroken path, and knobs/labels
   are not backed by an opaque rectangle that would slice the line. */
const ORIGIN = 'http://localhost:' + (process.env.SI_E2E_PORT || '4173');
test.use({ storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: [{ name: 'si.onb', value: '1' }, { name: 'si.a2hs', value: '1' }, { name: 'si.ml', value: ML_AT_REASON }] }] } });

test('network wires run end to end, with no opaque backing behind knobs or labels', async ({ page }, info) => {
  test.skip(info.project.name !== 'd1440', 'measured once, at 925 and 1280');
  for (const width of [925, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const hash of ['#D/3', '#D/4']) {
      await page.goto('./?lang=zh' + hash);
      const fig = page.locator('.net-knobs');
      await fig.waitFor();
      await fig.scrollIntoViewIfNeeded();
      await page.locator('.net-wire').first().waitFor({ state: 'attached' });
      const bad = await page.evaluate(() => {
        const svg = document.querySelector('.net-knobs');
        if (!svg) return ['missing'];
        const issues: string[] = [];
        const wires = [...svg.querySelectorAll<SVGPathElement>('path.net-wire')];
        if (wires.length !== 8) issues.push(`wires ${wires.length}`);
        for (const w of wires) {
          const d = (w.getAttribute('d') || '').replace(/\s+/g, '');
          if (!/^M[\d.-]+L[\d.-]+$/.test(d)) issues.push(`shape ${d}`);
          const x1 = Number(w.dataset.x1), y1 = Number(w.dataset.y1), x2 = Number(w.dataset.x2), y2 = Number(w.dataset.y2);
          const span = Math.hypot(x2 - x1, y2 - y1);
          if (!(w.getTotalLength() > span * 0.98)) issues.push(`short ${w.getTotalLength().toFixed(1)}/${span.toFixed(1)}`);
        }
        if (svg.querySelector('rect')) issues.push('rect');
        for (const c of svg.querySelectorAll<SVGCircleElement>('.net-knob circle')) {
          const fill = getComputedStyle(c).fill;
          const clear = fill === 'none' || /rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/.test(fill);
          if (!clear) issues.push(`knob ${fill}`);
        }
        return issues;
      });
      expect(bad, `${width} ${hash}`).toEqual([]);
    }
  }
});
