import { describe, it, expect } from 'vitest';
import { iconize } from '../../src/station/icons';

describe('R17 iconize', () => {
  it('keeps words, paints an icon, and hands labs back their text', () => {
    document.body.innerHTML = '<div id="r"><button class="btn">▶ 播放</button><button class="btn">⟲</button><button class="dd-c pri"><i aria-hidden="true">↗</i><span>打开完整卡片</span></button></div>';
    const r = document.getElementById('r')!;
    iconize(r);
    const [play, reset, chip] = Array.from(r.querySelectorAll('button')) as unknown as [HTMLElement, HTMLElement, HTMLElement];
    expect(play.querySelector('svg.ic')).not.toBeNull();
    expect(play.querySelector('span')!.textContent).toBe('播放');
    expect(play.textContent).toBe('▶ 播放');
    play.textContent = '⏸ 暂停';
    expect(play.textContent).toBe('⏸ 暂停');
    expect(play.querySelector('svg.ic')).not.toBeNull();
    expect(play.querySelector('span')!.textContent).toBe('暂停');
    play.textContent = '完成';
    expect(play.querySelector('svg')).toBeNull();
    expect(play.textContent).toBe('完成');
    expect(reset.getAttribute('aria-label')).toMatch(/^(重置|Reset)$/);
    expect(reset.title).toBeTruthy();
    expect(reset.querySelector('svg.ic')).not.toBeNull();
    expect(chip.getAttribute('aria-label')).toBe('打开完整卡片');
    expect(chip.title).toBe('打开完整卡片');
    expect(chip.querySelector('i svg.ic')).not.toBeNull();
  });
});
