// R48 一体两视角, content rules: R3 one set of words (词元 / 损失), R4 the same example numbers on both sides, R8 the shared “how it changed” sentences
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zh0 from '../../src/dv/zh';
import en0 from '../../src/dv/en';
import { deepFill, fillCardText, fillDvText } from '../../src/dv/nums';
import { dvI, type SK } from '../../src/dv/links';
// R49: pages read {#key} numbers from dv/nums.ts — test what the reader sees
const zh = deepFill(zh0, (s) => fillDvText(s, 'zh')), en = deepFill(en0, (s) => fillDvText(s, 'en'));

const W = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src');
const rd = (f: string) => fs.readFileSync(path.join(W, f), 'utf8');
type Card = { n: string; s: string[]; no?: string };
const cards = (l: 'zh' | 'en'): Record<string, Card> => deepFill(Object.assign({}, ...['k', 'k1', 'k3'].map((g) => JSON.parse(rd(`l4/c/${g}-${l}.json`)))), (s: string) => fillCardText(s, l));
const ZH = cards('zh'), EN = cards('en');
const txt = (c?: Card) => (c ? [c.n, c.no ?? '', ...c.s].join('\n') : '');
// a stage by its step key (8a / 8b are the two halves of step 8)
const stage = (d: typeof zh, n: SK) => JSON.stringify(d.st[dvI(n)]);
const ZH_FILES = ['dv/zh.ts', 'l4/c/k-zh.json', 'l4/c/k1-zh.json', 'l4/c/k3-zh.json', 'lx/m5-zh.json', 'lx/p3.ts', 'lx/p5.ts', 'lx/ids.ts', 'l4/pages.ts', 'l4/txt.ts', 'px/quiz.ts'];
const EN_FILES = ['dv/en.ts', 'lx/m5-en.json'];

const NORM = ['原版 Post-LN（本站图）→ GPT-2 起 Pre-LN → 新模型常用 RMSNorm', 'original Post-LN (this site’s diagram) → Pre-LN from GPT-2 on → RMSNorm in newer models'];
const POS = ['正弦（原论文）→ 可学习（GPT-1/2）→ RoPE（如今主流）', 'sinusoidal (original paper) → learned (GPT-1/2) → RoPE (mainstream today)'];
const ACT = ['ReLU（原版）→ GELU（GPT）→ SwiGLU（如今常用）', 'ReLU (original) → GELU (GPT) → SwiGLU (common today)'];
const TOK = ['本站中文演示里 1 个词元 ≈ 1 个字', 'in this site’s Chinese demo 1 token ≈ 1 character'];

describe('R3 one set of words', () => {
  it('zh: 损失 for the training objective; 误差 only in fixed single-sample phrases', () => {
    const OK = /均方误差|平方误差|误差平方|误差累积|小误差|近似误差|量化误差/g;
    for (const f of ZH_FILES) expect(rd(f).replace(OK, '').match(/.{0,8}误差.{0,8}/g), f).toBeNull();
  });
  it('zh: the unit is 词元 — no “下一个词预测 / 下一个词损失”', () => {
    for (const f of ZH_FILES) expect(rd(f).match(/下一个词(预测|损失)/g), f).toBeNull();
  });
  it('en: “loss”, and next-token (not next-word) prediction', () => {
    for (const f of EN_FILES) { expect(rd(f).replace(/(squared|approximation|quantisation) error|this error mean/gi, '').match(/\b[Ee]rror\b/g), f).toBeNull(); expect(rd(f)).not.toMatch(/next-word prediction/i); }
  });
  it('词元 note: 1 token ≈ 1 character in the Chinese demo, on 分词 K02, 预训练 KC04 and stage 9', () => {
    for (const k of ['K02', 'KC04']) { expect(txt(ZH[k])).toContain(TOK[0]); expect(txt(EN[k])).toContain(TOK[1]); }
    expect(stage(zh, 9)).toContain(TOK[0]); expect(stage(en, 9)).toContain(TOK[1]);
  });
});

describe('R4 the same example numbers on both sides', () => {
  it('LoRA / quantisation numbers: KC13 ↔ stage 11', () => {
    for (const n of ['65,536', '0.39%', '14 GB', '3.5 GB']) { expect(txt(ZH.KC13) + txt(EN.KC13), n).toContain(n); expect(stage(zh, 11) + stage(en, 11), n).toContain(n); }
  });
});

describe('R8 shared sentences, verbatim on both views', () => {
  const both = (ks: string[], st: SK, s: string[]) => {
    for (const k of ks) { expect(txt(ZH[k]), k).toContain(s[0]); expect(txt(EN[k]), k).toContain(s[1]); }
    expect(stage(zh, st)).toContain(s[0]); expect(stage(en, st)).toContain(s[1]);
  };
  it('normalisation: K09, K05, KM11 ↔ stage 8b', () => both(['K09', 'K05', 'KM11'], '8b', NORM));
  it('position: K04 ↔ stage 8b', () => both(['K04'], '8b', POS));
  it('FFN activation and 4× width: K10 ↔ stage 8b', () => { both(['K10'], '8b', ACT); expect(txt(ZH.K10)).toContain('4 倍'); expect(stage(zh, '8b')).toContain('4 倍'); });
  it('alignment: KC07 also names DPO and reasoning RL (stage 10)', () => {
    expect(txt(ZH.KC07)).toContain('如今也用 DPO、推理 RL'); expect(txt(EN.KC07)).toContain('DPO and reasoning RL');
    expect(stage(zh, 10)).toMatch(/DPO/); expect(stage(zh, 10)).toMatch(/推理/);
  });
  it('C7: stage 12 explains sampling and temperature, as a plain fact (no {~} mark)', () => {
    const s12 = dvI(12), i = zh.st[s12]!.i.find((s) => s.startsWith('**采样与温度**'))!, j = en.st[s12]!.i.find((s) => s.startsWith('**Sampling and temperature**'))!;
    expect(i).toBeTruthy(); expect(j).toBeTruthy(); expect(i).not.toContain('{~'); expect(j).not.toContain('{~'); expect(zh.st[s12]!.i.length).toBe(en.st[s12]!.i.length);
  });
  it('en has no CJK outside quoted demo words', () => {
    for (const k of ['K02', 'K04', 'K05', 'K09', 'K10', 'KM11', 'KC04', 'KC07']) expect(EN[k]!.s[2]).not.toMatch(/[\u4e00-\u9fff]/);
  });
});
