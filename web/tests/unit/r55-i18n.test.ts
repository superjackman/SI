// R55 localisation: layer-tab names, glossary words, no greeting kickers, EN cards use “loss” (not bare “error”)
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const W = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src');
const rd = (f: string) => fs.readFileSync(path.join(W, f), 'utf8');
const CJK = /[\u3400-\u9fff]/;

describe('R55 layer tabs and depth labels', () => {
  it('five teaching layers are 类比/Analogy … 小测/Check (not Hook)', () => {
    const ly = rd('dv/ly.ts'), hm = rd('l4/home.ts');
    expect(ly).toMatch(/\['类比', 'Analogy'\]/);
    expect(ly).not.toMatch(/\['类比', 'Hook'\]/);
    expect(hm).toMatch(/\['类比', 'Analogy'\]/);
    expect(hm).not.toMatch(/\['类比', 'hook'\]/);
    for (const f of ['dv/zh-st.json', 'dv/en-st.json']) {
      const t = rd(f);
      expect(t).not.toMatch(/钩子\s*→/);
      expect(t).not.toMatch(/hook\s*→\s*picture/i);
      expect(t).toMatch(/类比\s*→|analogy\s*→\s*picture/i);
    }
  });
  it('depth “30 秒” English is “30 sec” everywhere it is a depth label', () => {
    expect(rd('dv/ly.ts')).toMatch(/\['30 秒', '30 sec'\]/);
    expect(rd('l4/home.ts')).toMatch(/\['30 秒', '30 sec'\]/);
    expect(rd('l4/onb.ts')).toMatch(/\['30 秒', '30 sec'\]/);
  });
});

describe('R55 no greeting kickers', () => {
  it('onboarding kicker is 开始之前 / Before you start, not 欢迎 / Welcome', () => {
    const t = rd('l4/onb.ts');
    expect(t).toMatch(/\['开始之前', 'Before you start'\]/);
    expect(t).not.toMatch(/\['欢迎', 'Welcome'\]/);
  });
  it('home never hard-codes a personal welcome', () => {
    const t = rd('l4/home.ts');
    expect(t).not.toMatch(/欢迎回来|你好[，,]|晚上好|早上好|Welcome back|Hello,/);
  });
});

describe('R55 glossary on EN cards', () => {
  const EN_CARDS = ['l4/c/k-en.json', 'l4/c/k1-en.json', 'l4/c/k3-en.json'];
  it('training objective is “loss”, not bare “error”', () => {
    const OK = /(mean\s+squared\s+error|squared\s+error|approximation\s+error|quantisation\s+error|error\s+screenshot|Fix this error)/gi;
    for (const f of EN_CARDS) {
      const left = rd(f).replace(OK, '');
      expect(left.match(/\berror\b/gi), f).toBeNull();
    }
  });
  it('British spelling matches the stage glossary (quantisation / normalisation / regularisation / optimisers)', () => {
    for (const f of EN_CARDS) {
      const t = rd(f);
      expect(t, f).not.toMatch(/\bquantization\b/i);
      expect(t, f).not.toMatch(/\bnormalization\b/i);
      expect(t, f).not.toMatch(/\bregularization\b/i);
      expect(t, f).not.toMatch(/\boptimizers\b/i);
    }
  });
  it('post-training title names alignment and reasoning on both sides', () => {
    expect(rd('dv/links.ts')).toMatch(/Post-training: SFT \+ align/);
    expect(rd('dv/en-st.json')).toMatch(/Post-training: SFT \+ align/);
    expect(rd('dv/zh-st.json')).toMatch(/后训练：SFT、对齐与推理/);
  });
});

describe('R55 short UI labels: 概率 ↔ probability', () => {
  it('diagram “out” and Softmax 100% lines say probability, not odds', () => {
    const t = rd('l4/txt.ts');
    expect(t).toMatch(/Next-char probability/);
    expect(t).toMatch(/probabilities that sum to 100%/);
    expect(t).not.toMatch(/Next-char odds/);
    expect(rd('l4/sheet.ts')).toMatch(/\['概率', 'Probability'\]/);
  });
});

describe('R55 EN side of UI pairs has no CJK (aside from demos / lang switch)', () => {
  it('home / ly / onb / routes English strings are Latin-script', () => {
    for (const f of ['l4/home.ts', 'dv/ly.ts', 'l4/onb.ts', 'dv/routes.ts']) {
      // strip Chinese demo quotes and the intentional lang-switch glyph
      const t = rd(f)
        .replace(/天空是什么颜色？|蓝|绿|红|草|火|夜|结束|中文|切换到中文/g, '')
        .replace(/\[[^\]]*中[^\]]*\]/g, '');
      // only look at the English half of ['zh','en'] pairs roughly: after the comma quote
      for (const m of t.matchAll(/\['(?:\\.|[^'\\])*',\s*'((?:\\.|[^'\\])*)'\]/g)) {
        const en = m[1]!;
        if (en === '中' || en === '中文') continue;
        expect(CJK.test(en), `${f}: ${en}`).toBe(false);
      }
    }
  });
});

describe('R55 misconception punctuation', () => {
  it('误解 / 其实 carry a colon so Chinese does not run on', () => {
    const t = rd('vf/ui.ts');
    expect(t).toMatch(/误解：/);
    expect(t).toMatch(/其实：/);
    expect(t).toMatch(/Myth: /);
    expect(t).toMatch(/Actually: /);
  });
});
