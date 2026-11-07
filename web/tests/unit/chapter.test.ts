// A station is one chapter: the worked step sits under the experiment, and a formula or term block is not repeated.
import { describe, expect, it } from 'vitest';
import zh0 from '../../src/dv/zh';
import en0 from '../../src/dv/en';
import { deepFill, fillDvText } from '../../src/dv/nums';
import { DV_KEY, dvI } from '../../src/dv/links';
import { mk } from '../../src/dv/view';
import { html } from '../../src/dv/ly';
import type { Ly, Stage } from '../../src/dv/types';

const zh = deepFill(zh0, (s) => fillDvText(s, 'zh'));
const en = deepFill(en0, (s) => fillDvText(s, 'en'));
const BANNED = ['先自己算，再填进去', '拖一下，从图到式子', '同一件事，写成图', '这几个词', '用 NumPy', '连对 0/'];

describe('station chapter', () => {
  it('no formula or term block is repeated, and the worked step follows the experiment', () => {
    for (const [D, l] of [[zh, 'zh'], [en, 'en']] as const) for (const k of DV_KEY) {
      const S = D.st[dvI(k)]! as Stage & { ly: Ly };
      const el = document.createElement('div');
      el.innerHTML = html(S, `D/${k}`, l, mk, '');
      const demo = el.querySelector('[data-vf-part="demo"]');
      expect(demo?.nextElementSibling?.classList.contains('st-live'), `${l} ${k} step`).toBe(true);
      const figs = [...el.querySelectorAll('[data-fig]')].map((e) => e.getAttribute('data-fig') || '');
      expect(new Set(figs).size, `${l} ${k} fig`).toBe(figs.length);
      if (figs.includes('exp')) expect(figs.some((id) => id.startsWith('pic-') && id !== 'pic-att'), `${l} ${k} dup`).toBe(false);
      expect(el.querySelector('.st-inline'), `${l} ${k} tail`).toBeNull();
      const lines = (el.textContent || '').split('\n').map((s) => s.trim());
      expect(lines.filter((s) => /^(\[[0-9]+,|undefined|\[object )/.test(s)), `${l} ${k} stray`).toEqual([]);
      const norm = (s: string) => (s || '').replace(/\s+/g, '').trim();
      const blocks = [...el.querySelectorAll('.fx-line, .fx-sym p')].map((e) => norm(e.textContent || '')).filter((t) => t.length > 6);
      const seen = new Map<string, number>();
      for (const t of blocks) seen.set(t, (seen.get(t) || 0) + 1);
      expect([...seen].filter(([, n]) => n > 1).map(([t]) => t), `${l} ${k}`).toEqual([]);
      const text = el.textContent || '';
      for (const s of BANNED) expect(text.includes(s), `${l} ${k} ${s}`).toBe(false);
      const code = el.querySelector('.st-code');
      const formula = el.querySelector('.ly-fx');
      expect(formula && code && (formula.compareDocumentPosition(code) & Node.DOCUMENT_POSITION_FOLLOWING), `${l} ${k} code after formula`).toBeTruthy();
      const step = demo?.nextElementSibling;
      expect(step && formula && (step.compareDocumentPosition(formula) & Node.DOCUMENT_POSITION_FOLLOWING), `${l} ${k} formula after step`).toBeTruthy();
    }
  });
});
