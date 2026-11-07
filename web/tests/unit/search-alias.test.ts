/* Reviewed aliases, Latin abbreviations, grouped hits, and focus returning to the search button. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolve } from 'node:path';
import { buildSearch } from '../../scripts/search-index.mjs';
import { grouped, search, whyOf } from '../../src/search/query';
import { clearSearchCache, openSearch } from '../../src/search/ui';

const web = resolve(import.meta.dirname, '../..');
const rows = buildSearch(web);
const has = (q: string, kind: string, id: string) => search(rows, q).some((h) => h.kind === kind && h.id === id);

describe('search aliases and abbreviations', () => {
  it('注意力, 梯度, 向量 and RAG land on the station that teaches them', () => {
    expect(search(rows, '注意力')[0]?.hash).toBe('#D/8a');
    expect(has('梯度', 'st', '2')).toBe(true);
    expect(has('向量', 'st', '6')).toBe(true);
    expect(has('RAG', 'st', '13')).toBe(true);
  });
  it('RAG’s first page includes the station, RAGFlow, Dify and LlamaIndex, not gradient or backprop', () => {
    const hits = search(rows, 'RAG');
    expect(has('RAG', 'tool', 'ragflow')).toBe(true);
    expect(has('RAG', 'tool', 'dify')).toBe(true);
    expect(has('RAG', 'tool', 'llamaindex')).toBe(true);
    expect(hits.some((h) => h.zh.includes('梯度下降') || h.zh.includes('反向传播') || h.id === '2' || h.id === '4')).toBe(false);
    expect(whyOf(hits.find((h) => h.id === 'dify')!, 'RAG').k).toBe('alias');
    const kinds = grouped(hits).map((g) => g.kind);
    expect(kinds[0]).toBe('st');
    expect(new Set(kinds).size).toBe(kinds.length);
  });
  it('检索增强 and 智能体 use the reviewed aliases', () => {
    expect(has('检索增强', 'st', '13')).toBe(true);
    expect(has('检索增强', 'tool', 'ragflow')).toBe(true);
    expect(has('知识库', 'tool', 'dify')).toBe(true);
    expect(has('智能体', 'st', '14')).toBe(true);
    expect(has('Agent', 'tool', 'dify')).toBe(true);
  });
  it('a two-letter Latin fragment does not fuzzy-match an unrelated English word', () => {
    expect(search(rows, 'ra').some((h) => h.id === '2' || h.id === '4')).toBe(false);
  });
});

describe('search dialog keyboard', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    clearSearchCache();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => rows.slice(0, 30) })));
  });
  it('arrow keys reach a result, and closing returns focus to the search button', async () => {
    const btn = document.createElement('button');
    btn.className = 'hm-find';
    const host = document.createElement('div');
    document.body.append(btn, host);
    btn.focus();
    openSearch(host, 'zh', btn);
    const input = host.querySelector<HTMLInputElement>('.si-q')!;
    input.value = 'RAG';
    input.dispatchEvent(new Event('input'));
    await vi.waitFor(() => expect(host.querySelectorAll('.si-hit').length).toBeGreaterThan(0));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement?.classList.contains('si-hit')).toBe(true);
    host.querySelector<HTMLButtonElement>('[data-si="x"]')!.click();
    expect(host.querySelector('.si-find')).toBeNull();
    expect(document.activeElement).toBe(btn);
  });
});
