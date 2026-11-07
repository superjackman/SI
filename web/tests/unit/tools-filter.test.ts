/* Tool task filters are part of the address, and a tool page returns to that filtered list. */
import { describe, expect, it } from 'vitest';
import { toolsHash, toolsHtml, toolsListHash, toolsTask, wireTools } from '../../src/hub/view';

describe('tool filter URL', () => {
  it('reads the task out of the list address', () => {
    expect(toolsTask('')).toBe('all');
    expect(toolsTask('dify')).toBe('all');
    expect(toolsTask('t/code')).toBe('code');
    expect(toolsTask('t/nope')).toBe('all');
    expect(toolsHash('all')).toBe('#tools');
    expect(toolsHash('code')).toBe('#tools/t/code');
  });
  it('a code filter hides writing-only tools and marks the chip', () => {
    const host = document.createElement('div');
    host.innerHTML = toolsHtml('zh', 't/code');
    expect(host.querySelector('[data-task="code"]')!.getAttribute('aria-selected')).toBe('true');
    expect(host.querySelector('[data-task="all"]')!.classList.contains('on')).toBe(false);
    expect(host.querySelector('[data-tasks="write"]')!.hasAttribute('hidden')).toBe(true);
    expect(host.querySelector('[data-tasks="code read"]')!.hasAttribute('hidden')).toBe(false);
    const gone: string[] = [];
    wireTools(host, (h) => gone.push(h));
    (host.querySelector('[data-task="local"]') as HTMLButtonElement).click();
    expect(gone).toEqual(['#tools/t/local']);
  });
  it('the tool page links back to the filtered list that was saved', () => {
    sessionStorage.setItem('si.tools.scroll', '#tools/t/code\n120');
    expect(toolsListHash()).toBe('#tools/t/code');
    const html = toolsHtml('zh', 'dify');
    expect(html).toContain('href="#tools/t/code"');
    sessionStorage.removeItem('si.tools.scroll');
    expect(toolsHtml('zh', 'dify')).toContain('href="#tools"');
  });
});
