/* Static station pages must fill {#key} from the same table as the interactive pages. */
import { describe, it, expect, beforeAll } from 'vitest';
import { resolve } from 'node:path';
import { buildSeo, fillNums, numsFromSource, stepPhrase } from '../../scripts/seo.mjs';
import { NUMS, fillDvText } from '../../src/dv/nums';

const web = resolve(process.cwd());
const KEYS = ['0', 'P', '1', '2', '3', '4', '5', '6', '7', '8a', '8b', '9', 'E', '10', '11', '12', '13', '14', 'S', '15a', '15b', 'A', '16'];
let F: Map<string, string>;
const page = (k: string, lang: 'zh' | 'en') => F.get(`${lang === 'en' ? 'en/' : ''}s/${k}/index.html`)!;

beforeAll(() => { F = buildSeo({ web: web + '/', base: '/SI/', lastmod: '2026-11-06' }); }, 30_000);

describe('static numbers come from nums.ts', () => {
  it('the build reads every interactive number, with the same text fillDvText would write', () => {
    const nums = numsFromSource(web);
    expect(Object.keys(nums).sort()).toEqual(Object.keys(NUMS).sort());
    for (const [k, n] of Object.entries(NUMS)) {
      const got = nums[k]!;
      expect(got.zh, k).toBe(n.zh);
      expect(got.en, k).toBe(n.en);
      for (const l of ['zh', 'en'] as const) expect(fillNums(`{#${k}}`, l, nums), `${l} ${k}`).toBe(fillDvText(`{#${k}}`, l));
    }
  });
  it('no unresolved placeholder on any of the 23 stations, in either language', () => {
    expect(KEYS.length).toBe(23);
    for (const k of KEYS) for (const l of ['zh', 'en'] as const) {
      const html = page(k, l);
      expect(html, `${l} ${k}`).not.toMatch(/\{#/);
      expect(html, `${l} ${k}`).not.toMatch(/\{~/);
      expect(html, `${l} ${k}`).not.toMatch(/要算\s*次|p=\s*[，,]|T\s*=\s*1\s*→\s*[；;]/);
    }
  });
  it('stations 6, 9 and 12 show the shared worked example inside a native details', () => {
    const dot = fillDvText('{#dot}', 'zh').replace(/`/g, '');
    const bpe = fillDvText('{#bpe}', 'zh').replace(/`/g, '');
    const z6 = page('6', 'zh');
    expect(z6).toContain(dot);
    expect(z6).toContain(bpe.slice(0, 12));
    expect(z6).toContain('<details class="ex">');
    expect(z6).toMatch(/<details class="ex"><summary>[^<]*点积是多少？<\/summary><p>[^<]*8\.5[^<]*<\/p><\/details>/);
    const e6 = page('6', 'en');
    expect(e6).toContain(fillDvText('{#dot}', 'en').replace(/`/g, ''));
    expect(e6).toContain('lowest');
    expect(e6).toContain('<details class="ex">');

    const z9 = page('9', 'zh');
    for (const k of ['p0', 'p1', 'chN', 'chD', 'ch20', 'c6nd', 'tS', 't1', 't05', 't2'] as const) {
      const bit = fillDvText(`{#${k}}`, 'zh').replace(/`/g, '').replace(/\s*\{~[^}]+\}/, '').slice(0, 8);
      expect(z9, k).toContain(bit);
    }
    expect(z9).toMatch(/<details class="ex"><summary>[^<]*温度 T = 1[^<]*<\/summary><p>[^<]*90%[^<]*<\/p><\/details>/);
    expect(page('9', 'en')).toContain('70 billion');
    expect(page('9', 'en')).toContain('90% / 5.5% / 4.1%');

    const kv = fillDvText('{#kv100}', 'zh').replace(/`/g, '');
    const z12 = page('12', 'zh');
    expect(z12).toContain(kv);
    expect(z12).toContain('524,288');
    expect(z12).toMatch(/<details class="ex"><summary>[^<]*多少次 K、V？<\/summary><p>[^<]*5050[^<]*<\/p><\/details>/);
    expect(page('12', 'en')).toContain(fillDvText('{#kv100}', 'en').replace(/`/g, ''));
    expect(page('12', 'en')).toContain('<details');
  });
  it('old “第 N 步” station wording uses the station name; a gradient step stays a step', () => {
    const names = { '0': '用样本找函数', '6': '词向量', '9': '预训练', '12': '推理效率', '15a': '多模态', '15b': '推理模型与长上下文' };
    expect(stepPhrase('见第 6 步。', 'zh', names)).toBe('见「词向量」。');
    expect(stepPhrase('第 12、15 步再处理', 'zh', names)).toBe('「推理效率」、「多模态、推理模型与长上下文」再处理');
    expect(stepPhrase('第 1 步梯度 −4', 'zh', names)).toBe('第 1 步梯度 −4');
    expect(stepPhrase('see step 6.', 'en', { '6': 'Word vectors' })).toBe('see “Word vectors”.');
    expect(stepPhrase('step 1 gradient −4', 'en', { '1': 'Loss' })).toBe('step 1 gradient −4');
    expect(page('9', 'zh')).not.toMatch(/第\s*6\s*步/);
    expect(page('9', 'zh')).toContain('词向量');
    expect(page('2', 'zh')).toContain('第 1 步梯度');
    expect(page('2', 'en')).toMatch(/step 1 gradient/i);
  });
});
