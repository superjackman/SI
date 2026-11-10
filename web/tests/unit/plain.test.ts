import { describe, expect, it } from 'vitest';
import zh0 from '../../src/dv/zh';
import en0 from '../../src/dv/en';
import { deepFill, fillDvText } from '../../src/dv/nums';
import { DV_KEY, dvI } from '../../src/dv/links';
import { mk } from '../../src/dv/view';
import { html } from '../../src/dv/ly';
import { ML } from '../../src/dv/mld';
import type { Ly, Stage } from '../../src/dv/types';

const zh = deepFill(zh0, (s) => fillDvText(s, 'zh'));
const en = deepFill(en0, (s) => fillDvText(s, 'en'));

/** Words that stay out of the lesson until the optional program section. */
const JARGON = [/if-else/i, /函数调用/, /\bAPI\b/, /变量/, /循环/, /NumPy/i, /\bJSON\b/i, /Schema/i, /function call/i, /\bvariable\b/i, /\bloop\b/i];

const cut = (html: string, mark: string) => {
  const at = html.indexOf(mark);
  return at < 0 ? html : html.slice(0, at);
};
const textOf = (raw: string) => raw.replace(/<[^>]+>/g, ' ').replace(/⟦[a-z]:([^⟧]*)⟧/g, '$1');

const walk = (v: unknown, out: string[]) => {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) for (const x of v) walk(x, out);
  else if (v && typeof v === 'object') for (const x of Object.values(v)) walk(x, out);
};

describe('plain lesson prose', () => {
  it('keeps programmer jargon out until 写成程序', () => {
    const hits: string[] = [];
    for (const [D, l, mark] of [[zh, 'zh', '写成程序'], [en, 'en', 'As a program']] as const) {
      for (const k of DV_KEY) {
        const S = D.st[dvI(k)]! as Stage & { ly: Ly };
        const body = textOf(cut(html(S, `D/${k}`, l, mk, ''), mark));
        const bits: string[] = [body];
        walk(ML[k], bits);
        const blob = bits.join('\n');
        for (const re of JARGON) {
          const m = blob.match(re);
          if (m) hits.push(`${l} ${k} ${m[0]}`);
        }
      }
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });
});
