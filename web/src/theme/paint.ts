/** Resolved palette color for canvas and WebGL. Reads the live token, so light and dark stay in sync. */
export function paint(name: string): string {
  if (typeof document !== 'undefined') {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--' + name).trim();
    if (v) return v;
  }
  return '';
}
