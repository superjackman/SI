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

/** A specialist word may appear only after its picture has already been said. Greek letters wait for 记个简写. */
const EARLY: { re: RegExp; pic: RegExp }[] = [
  { re: /参数|parameters?/gi, pic: /旋钮|knobs?/i },
  { re: /拟合|overfit\w*/gi, pic: /背下来|背题|memor/i },
  { re: /梯度|gradients?/gi, pic: /坡|下山|碗|slope|downhill|bowl/i },
  { re: /向量|vectors?/gi, pic: /一排数|方向|坐标|row of numbers|direction/i },
  { re: /张量|tensors?/gi, pic: /表格|格子|table|grid/i },
  { re: /权重|weights?/gi, pic: /旋钮|份额|knobs?|share/i },
];
const GREEK = /[θΘηΗ∇∂σΣλμαβ]/;

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

  it('explains a picture before the specialist word, and keeps Greek letters in the shorthand', () => {
    const hits: string[] = [];
    for (const [D, l, mark] of [[zh, 'zh', '记个简写'], [en, 'en', 'A short note']] as const) {
      for (const k of DV_KEY) {
        const S = D.st[dvI(k)]! as Stage & { ly: Ly };
        const raw = html(S, `D/${k}`, l, mk, '');
        const at = raw.indexOf(mark);
        expect(at, `${l} ${k} shorthand`).toBeGreaterThan(0);
        const before = textOf(raw.slice(0, at));
        if (GREEK.test(before)) hits.push(`${l} ${k} greek`);
        for (const rule of EARLY) {
          rule.re.lastIndex = 0;
          let m: RegExpExecArray | null;
          while ((m = rule.re.exec(before))) {
            if (!rule.pic.test(before.slice(0, m.index))) hits.push(`${l} ${k} ${m[0]}`);
          }
        }
        const el = document.createElement('div');
        el.innerHTML = raw;
        const map = el.querySelector('.ly-map')?.textContent || '';
        const fx = [...el.querySelectorAll('.fx-line')].map((n) => n.textContent || '').join(' ');
        if ([...map.replace(/\s/g, '')].length < 40) hits.push(`${l} ${k} map short`);
        if (/θ/.test(fx) && !/旋钮|knob/i.test(map)) hits.push(`${l} ${k} theta`);
        if (/[∂∇]/.test(fx) && !/坡|slope/i.test(map)) hits.push(`${l} ${k} slope`);
      }
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });
});
