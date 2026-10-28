/* the two icons the boot banners use (update banner: reload ↻ and close ×) */
const ic = (d: string) => `<svg viewBox="0 0 24 24" aria-hidden="true" class="ic"><path d="${d}"/></svg>`;
export const IC = { x: ic('M6 6l12 12M18 6L6 18'), re: ic('M20 12a8 8 0 1 1-2.3-5.7L20 8.6M20 4v4.6h-4.6') };
