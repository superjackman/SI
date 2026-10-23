/** live __mShow/__mHide: closed layers are hidden from assistive tech and not focusable */
export function layer(open: boolean): Record<string, string | undefined> {
  return open ? { 'aria-hidden': 'false' } : { 'aria-hidden': 'true', inert: '' };
}
/* R17: one icon set: 24×24 stroke paths drawn by one wrapper; stroke, caps and joins come from the .ic CSS rule (shell.css).
   Header + shell icons live here (first load); icons only lazy chunks use are in ui/ic2.ts. */
export const ic = (d: string) => `<svg viewBox="0 0 24 24" aria-hidden="true" class="ic"><path d="${d}"/></svg>`;
export const IC = {
  menu: ic('M4 7h16M4 12h16M4 17h16'),
  drill: ic('M4 6h8.5v11.5M8.5 13.5l4 4 4-4'),
  down: ic('M12 5v13M6.5 12.5L12 18l5.5-5.5'),
  up: ic('M12 19V6M6.5 11.5L12 6l5.5 5.5'),
  back: ic('M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11'),
  prev: ic('M15 5l-7 7 7 7'),
  next: ic('M9 5l7 7-7 7'),
  share: ic('M12 15V4M7.5 8.5L12 4l4.5 4.5M5 12v6.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V12'),
  fs: ic('M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5'),
  search: ic('M17 10.5a6.5 6.5 0 1 1-13 0a6.5 6.5 0 1 1 13 0M15.5 15.5L20 20'),
  x: ic('M6 6l12 12M18 6L6 18'),
  img: ic('M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M16 9h.01'),
  plus: ic('M12 5v14M5 12h14'),
  minus: ic('M5 12h14'),
  reset: ic('M4 12a8 8 0 1 0 2.3-5.7L4 8.6M4 4v4.6h4.6'),
  re: ic('M20 12a8 8 0 1 1-2.3-5.7L20 8.6M20 4v4.6h-4.6'),
} as const;
export const svgHtml = (k: keyof typeof IC) => ({ dangerouslySetInnerHTML: { __html: IC[k] } });
