/* R33 pilot: the line icons of the shell (24 px grid, stroke = currentColor) */
const S = (d: string) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const IC = {
  menu: S('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  search: S('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
  share: S('<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1"/>'),
  back: S('<path d="M15 5l-7 7 7 7"/>'),
  map: S('<path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>'),
  prog: S('<path d="M3 17l5.5-5.5 4 4L21 7"/><path d="M15 7h6v6"/>'),
  next: S('<path d="M4 12h15M13 6l6 6-6 6"/>'),
  bulb: S('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2V16h5v-.0c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>'),
  zoom: S('<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5M10.5 7.5v6M7.5 10.5h6"/>'),
  close: S('<path d="M6 6l12 12M18 6L6 18"/>'),
  check: S('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
};
