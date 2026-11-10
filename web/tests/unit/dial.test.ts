import { afterEach, describe, expect, it } from 'vitest';
import { bindRange, dialFromDrag } from '../../src/ui/dial';
import { mount } from '../../src/dv/net';

if (typeof PointerEvent === 'undefined') {
  class PE extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: MouseEventInit & { pointerId?: number } = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
    }
  }
  (globalThis as unknown as { PointerEvent: typeof PE }).PointerEvent = PE;
}

afterEach(() => { document.body.innerHTML = ''; document.body.className = ''; document.body.style.userSelect = ''; });

describe('linear dial', () => {
  it('grows with dx − dy and stops at the ends', () => {
    expect(dialFromDrag(0, 90, 0, -2, 2)).toBeCloseTo(2, 5);
    expect(dialFromDrag(0, 0, 90, -2, 2)).toBeCloseTo(-2, 5);
    expect(dialFromDrag(0, 45, 90, -2, 2)).toBeCloseTo(-1, 5);
    expect(dialFromDrag(1.5, 200, 0, -2, 2)).toBe(2);
    expect(dialFromDrag(-1.5, 0, 200, -2, 2)).toBe(-2);
  });

  it('a drag that crosses the centre keeps rising, and the reverse keeps falling', () => {
    document.body.innerHTML = '<p>可以选中的一段说明文字</p>';
    const host = document.createElement('div');
    document.body.appendChild(host);
    mount(host, 'curve', 'zh');
    const svg = host.querySelector('.net-knobs')!;
    const read = () => Number(svg.querySelector('[data-i="16"]')!.getAttribute('data-v'));
    const fire = (type: string, x: number, y: number) => {
      const ev = new PointerEvent(type, { clientX: x, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1, pointerId: 1, bubbles: true, cancelable: true });
      svg.querySelector('[data-i="16"]')!.dispatchEvent(ev);
      return ev;
    };
    const down = fire('pointerdown', 0, 40);
    expect(down.defaultPrevented).toBe(true);
    expect(document.body.style.userSelect).toBe('none');
    const up: number[] = [read()];
    for (const x of [10, 20, 40, 60, 80]) { fire('pointermove', x, 40); up.push(read()); }
    for (let i = 1; i < up.length; i++) expect(up[i]!).toBeGreaterThanOrEqual(up[i - 1]!);
    expect(up[up.length - 1]!).toBeGreaterThan(up[0]!);
    expect(document.querySelector('.dial-read')?.textContent).toBe(up[up.length - 1]!.toFixed(2));
    fire('pointerup', 80, 40);
    expect(document.body.style.userSelect).toBe('');
    expect(document.body.classList.contains('dial-drag')).toBe(false);
    expect(window.getSelection()?.toString() ?? '').toBe('');
    const down2 = fire('pointerdown', 80, 40);
    expect(down2.defaultPrevented).toBe(true);
    const downWay: number[] = [read()];
    for (const x of [60, 40, 20, 0]) { fire('pointermove', x, 40); downWay.push(read()); }
    for (let i = 1; i < downWay.length; i++) expect(downWay[i]!).toBeLessThanOrEqual(downWay[i - 1]!);
    expect(downWay[downWay.length - 1]!).toBeLessThan(downWay[0]!);
    fire('pointerup', 0, 40);
  });

  it('a range uses the same drag, wheel and arrow keys', () => {
    document.body.innerHTML = '<input type="range" min="0" max="10" step="0.1" value="5">';
    const input = document.querySelector('input')!;
    bindRange(input);
    const move = (type: string, x: number, y = 0) => input.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1, pointerId: 2, bubbles: true, cancelable: true }));
    move('pointerdown', 0, 0);
    const vals = [input.valueAsNumber];
    for (const x of [20, 40, 60]) { move('pointermove', x, 0); vals.push(input.valueAsNumber); }
    for (let i = 1; i < vals.length; i++) expect(vals[i]!).toBeGreaterThanOrEqual(vals[i - 1]!);
    expect(vals[vals.length - 1]!).toBeGreaterThan(5);
    move('pointerup', 60, 0);
    const wheel = new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true });
    input.dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(true);
    const after = input.valueAsNumber;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
    expect(input.valueAsNumber).toBeLessThan(after);
  });
});
