/** A new week replaces only that week’s list. Older weeks stay. */
export interface Week<T> { week: string; items: T[] }
export function keepWeek<T>(prev: readonly Week<T>[], next: Week<T>): Week<T>[] {
  const map = new Map(prev.map((w) => [w.week, w]));
  map.set(next.week, next);
  return [...map.values()].sort((a, b) => (a.week < b.week ? 1 : -1));
}
