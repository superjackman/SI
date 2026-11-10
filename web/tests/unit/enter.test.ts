import { describe, it, expect, beforeEach } from 'vitest';
import { DV_AT } from '../../src/dv/links';
import { lessonKey } from '../../src/l4/go';

describe('opening the site', () => {
  beforeEach(() => localStorage.clear());
  it('starts at station 1 when nothing is saved', () => {
    expect(lessonKey()).toBe('0');
  });
  it('opens the station last viewed', () => {
    localStorage.setItem(DV_AT, '12');
    localStorage.setItem('si.dv.seen', JSON.stringify(['0']));
    expect(lessonKey()).toBe('12');
  });
  it('uses an opened station from saved progress when no last station is stored', () => {
    localStorage.setItem('si.dv.seen', JSON.stringify(['2']));
    expect(lessonKey()).toBe('2');
  });
  it('ignores a last-station value that is not a station', () => {
    localStorage.setItem(DV_AT, 'nope');
    expect(lessonKey()).toBe('0');
  });
});
