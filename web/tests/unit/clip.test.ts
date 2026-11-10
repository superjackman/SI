import { describe, expect, it } from 'vitest';
import { clipFor, clipHtml } from '../../src/dv/clip';

describe('lesson clips', () => {
  it('plays the page language, and falls back to Chinese when that language has no file', () => {
    expect(clipFor('3', 'zh', '/SI/')?.src).toBe('/SI/videos/zh/3.mp4');
    expect(clipFor('3', 'zh', '/SI/')?.vtt).toBe('/SI/videos/zh/3.vtt');
    expect(clipFor('3', 'en', '/SI/')?.src).toBe('/SI/videos/zh/3.mp4');
    expect(clipFor('3', 'en', '/SI/')?.srclang).toBe('zh');
    expect(clipFor('missing', 'en', '/SI/')).toBeNull();
    const html = clipHtml('3', 'zh', '/SI/');
    for (const r of ['1', '1.25', '1.5', '2']) expect(html).toContain(`data-clip-rate="${r}"`);
    expect(html).not.toContain('autoplay');
  });
});