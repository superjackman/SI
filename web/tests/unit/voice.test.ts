// Rendered lesson text: a sentence is not said twice, rebuttals do not share a long connective,
// and the plain drawings fill their frame.
import { describe, expect, it } from 'vitest';
import zh0 from '../../src/dv/zh';
import en0 from '../../src/dv/en';
import { deepFill, fillDvText } from '../../src/dv/nums';
import { DV_KEY, dvI } from '../../src/dv/links';
import { mk } from '../../src/dv/view';
import { html } from '../../src/dv/ly';
import { life } from '../../src/dv/ill';
import type { Ly, Stage } from '../../src/dv/types';

const zh = deepFill(zh0, (s) => fillDvText(s, 'zh'));
const en = deepFill(en0, (s) => fillDvText(s, 'en'));
const PLAIN = ['P', '3', '4', '5', '13', '14', 'S', '15a', '15b', 'A'];

const sentences = (text: string, lang: 'zh' | 'en') => {
  const parts = lang === 'zh' ? text.split(/(?<=[。！？])/) : text.split(/(?<=[.!?])\s+/);
  return parts.map((s) => s.replace(/\s+/g, '')).filter((s) => [...s].length >= 12);
};

const render = (k: string, l: 'zh' | 'en') => {
  const D = l === 'zh' ? zh : en;
  const S = D.st[dvI(k)]! as Stage & { ly: Ly };
  const el = document.createElement('div');
  el.innerHTML = html(S, `D/${k}`, l, mk, '');
  return el;
};

describe('lesson text', () => {
  it('no sentence of 12 or more characters is said twice on a station', () => {
    const bad: string[] = [];
    for (const l of ['zh', 'en'] as const) for (const k of DV_KEY) {
      const el = render(k, l);
      const seen = new Map<string, number>();
      for (const s of sentences(el.textContent || '', l)) seen.set(s, (seen.get(s) || 0) + 1);
      for (const [s, n] of seen) if (n > 1) bad.push(`${l} ${k} ×${n} ${s.slice(0, 48)}`);
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('no 8-character stretch of a rebuttal appears in more than three stations', () => {
    const where = new Map<string, string[]>();
    for (const k of DV_KEY) {
      const el = render(k, 'zh');
      const raw = [...el.querySelectorAll('.ly-why')].map((p) => p.textContent || '').join('');
      const norm = raw.replace(/[\s，。、：；！？“”"'「」『』（）()【】\-—–·×÷=+]/g, '');
      const chars = [...norm];
      const seen = new Set<string>();
      for (let i = 0; i + 8 <= chars.length; i++) seen.add(chars.slice(i, i + 8).join(''));
      for (const w of seen) {
        const list = where.get(w) ?? [];
        list.push(k);
        where.set(w, list);
      }
    }
    const bad = [...where].filter(([, ks]) => ks.length > 3).map(([w, ks]) => `${w} @ ${ks.join(',')}`);
    expect(bad, bad.slice(0, 12).join('\n')).toEqual([]);
  });
});

const attrs = (s: string) => {
  const o: Record<string, number> = {};
  for (const m of s.matchAll(/([\w-]+)="([^"]*)"/g)) {
    const n = Number(m[2]);
    if (Number.isFinite(n)) o[m[1]!] = n;
  }
  return o;
};

describe('plain drawings fill the frame', () => {
  it('visual shapes cover at least 75% of the picture', () => {
    const low: string[] = [];
    for (const k of PLAIN) {
      const svg = life(k, 'zh');
      const box = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
      const W = Number(box?.[1]), H = Number(box?.[2]);
      const cols = 60, rows = 30;
      const g = new Uint8Array(cols * rows);
      const mark = (inside: (x: number, y: number) => boolean) => {
        for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
          const x = ((i + 0.5) / cols) * W, y = ((j + 0.5) / rows) * H;
          if (inside(x, y)) g[j * cols + i] = 1;
        }
      };
      const rects = [...svg.matchAll(/<rect\b([^>]*?)\/?>/g)].slice(1);
      for (const m of rects) {
        const a = attrs(m[1]!);
        mark((x, y) => x >= a.x! && x <= a.x! + a.width! && y >= a.y! && y <= a.y! + a.height!);
      }
      for (const m of svg.matchAll(/<circle\b([^>]*?)\/?>/g)) {
        const a = attrs(m[1]!);
        mark((x, y) => (x - a.cx!) ** 2 + (y - a.cy!) ** 2 <= a.r! ** 2);
      }
      const hit = g.reduce((s, v) => s + v, 0) / g.length;
      if (hit < 0.75) low.push(`${k} ${hit.toFixed(2)}`);
    }
    expect(low, low.join('\n')).toEqual([]);
  });
});
