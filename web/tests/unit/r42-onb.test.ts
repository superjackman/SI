import { describe, expect, it } from 'vitest';
import { about } from '../../src/l4/onb';
import { plan } from '../../src/px/qpath';

describe('R42 onboarding time wording', () => {
  it('uses the real quick-path estimate', () => {
    const z = plan('zh').total; expect(about(z, 'zh')).toMatch(/^约 \d+ 分(半|钟)$/);
    expect(about(575, 'zh')).toBe('约 9 分半'); expect(about(540, 'zh')).toBe('约 9 分钟'); expect(about(590, 'zh')).toBe('约 10 分钟'); expect(about(575, 'en')).toBe('about 9½ min');
  });
});
