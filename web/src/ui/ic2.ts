/* R17: icons only lazy chunks use (station controls, share panel, tour …); same wrapper and look as shell/common.ts IC */
import { ic, IC } from '../shell/common';
export const IC2 = {
  play: ic('M8 5.5v13l10-6.5z'),
  pause: ic('M9 5.5v13M15 5.5v13'),
  step: ic('M6 6v12l8-6zM18 6v12'),
  undo: IC.back,
  img: ic('M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M16 9h.01'),
  copy: ic('M9 9h10v11H9zM15 5V4H5v11h1'),
  dl: ic('M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14'),
  open: ic('M14 4h6v6M20 4l-8.5 8.5M18 14v5H5V6h5'),
  chev: ic('M6 9.5l6 6 6-6'),
  mail: ic('M3.5 6h17v12h-17zM4 7l8 6 8-6'),
  plane: ic('M21 4L3 11l6.5 2.5L12 20l3-5M21 4l-11.5 9.5'),
  phone: ic('M7 3.5l3 4-2 2a12 12 0 0 0 6.5 6.5l2-2 4 3-2 3.5C11 20 4 13 3.5 5.5z'),
  chat: ic('M9.5 4C5.5 4 3 6.5 3 9.3c0 1.6.8 3 2.2 4L4.7 16l2.9-1.5c.6.2 1.2.3 1.9.3M14.5 9C18 9 21 11.2 21 14c0 1.4-.7 2.6-1.9 3.5l.4 2.5-2.6-1.3c-.8.2-1.6.3-2.4.3-3.6 0-6-2.2-6-5S11 9 14.5 9'),
} as const;
