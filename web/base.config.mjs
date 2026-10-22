// Single source of truth for where the app is served on GitHub Pages.
// During the migration the new app lives at /SI/next/ (old single-file page stays at /SI/).
// At cutover (R5) deploy with --target root, which builds with base '/SI/'.
// Override any time with SI_BASE=/some/path/ (must start and end with '/').
export const TARGETS = {
  next: { base: '/SI/next/', dir: 'next' },
  root: { base: '/SI/', dir: '.' },
};
export function resolveBase(env = process.env) {
  const b = env.SI_BASE || TARGETS[env.SI_TARGET || 'next']?.base || TARGETS.next.base;
  if (!/^\/(.*\/)?$/.test(b)) throw new Error(`SI_BASE must start and end with "/": got ${b}`);
  return b;
}
