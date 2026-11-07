import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import guide from '../../src/hub/guide.json';
import { guideDetail, guideLead } from '../../scripts/guide-html.mjs';
import { toolsHtml } from '../../src/hub/view';
import { buildSeo } from '../../scripts/seo.mjs';

const IDS = ['dify', 'ragflow', 'flowise', 'ollama', 'lmstudio', 'llamacpp', 'vllm', 'openwebui'] as const;
const web = resolve(import.meta.dirname, '../..');
const FIELDS = ['适合', '不适合', '最小的一步', '文档里的结果', '许可', '部署要什么', '文档里写过的失败', '尚未实测', '核对 2026-11-07'];

describe('tool selection guide', () => {
  it('gives each first-batch tool the decision fields, in both languages, with a source', () => {
    for (const id of IDS) {
      const zh = guideDetail(guide, id, 'zh');
      const en = guideDetail(guide, id, 'en');
      expect(zh, id).toContain(`data-guide="${id}"`);
      for (const f of FIELDS) expect(zh, `${id} ${f}`).toContain(f);
      expect(en, id).toContain('Not measured');
      expect(en, id).toContain('License');
      expect(en, id).not.toMatch(/尚未实测|以官网为准/);
      expect(zh + en, id).not.toMatch(/以官网为准|\bstars?\b|★/);
      const item = guide.items[id as keyof typeof guide.items];
      expect(item.src.length).toBeGreaterThan(0);
      expect(zh).toContain(item.licUrl);
      expect(item.lic[0]).toMatch(/Apache|MIT|Open WebUI|条款/);
    }
  });
  it('states two or three real differences for each job, with no score', () => {
    const zh = guideLead(guide, 'zh');
    expect(zh).toContain('data-guide-diff="desk"');
    expect(zh).toContain('data-guide-diff="local"');
    for (const g of guide.groups) expect(g.diffs.length).toBeGreaterThanOrEqual(2);
    expect(zh).not.toMatch(/评分|\bscore\b/i);
    expect(guideDetail(guide, 'dify', 'zh')).toContain('多租户');
    expect(guideDetail(guide, 'lmstudio', 'zh')).toContain('404');
    expect(guideDetail(guide, 'openwebui', 'zh')).toContain('50');
  });
  it('renders on the tool page and on the static page', () => {
    expect(toolsHtml('zh', 'dify')).toContain('data-guide="dify"');
    expect(toolsHtml('en', 'ragflow')).toContain('Apache 2.0');
    const F = buildSeo({ web: web + '/', base: '/SI/', lastmod: '2026-11-07' });
    const zh = F.get('s/tools/dify/index.html')!;
    const en = F.get('en/s/tools/flowise/index.html')!;
    expect(zh).toContain('尚未实测');
    expect(zh).toContain('https://github.com/langgenius/dify/blob/main/LICENSE');
    expect(en).toContain('Not measured');
    expect(en).toContain('enterprise');
    expect(en).not.toContain('尚未实测');
    expect(F.get('s/tools/index.html')).toContain('data-guide-diff="desk"');
  });
});
