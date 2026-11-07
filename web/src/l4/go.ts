/* Old addresses stay working by landing on the nearest page in the eight-destination site. */
import { dvI } from '../dv/links';

const LAYER_STOP: Record<string, string> = { '1': 'D/15a', '2': 'D/13', '3': 'D/9', '4': 'D/6', '5': 'D/0' };

/** A replacement page id (no hash), or null when this id is already a live page. */
export function redirectTo(id: string): string | null {
  if (!id || id === 'home' || id === 'review' || id === 'me' || id === 'search' || id === 'settings') return null;
  if (id === 'news' || id.startsWith('news/') || id === 'tools' || id.startsWith('tools/') || id === 'W') return null;
  if (id.startsWith('W/')) return 'W';
  if (id.startsWith('D/') && !id.startsWith('D/map') && !id.startsWith('D/routes') && !id.startsWith('D/ch') && dvI(id.slice(2)) >= 0) return null;
  if (id === 'map' || id === 'D' || id === 'D/map' || id === 'D/routes' || id === 'about' || id === 'Q' || id === 'Q/done') return 'home';
  if (id === 'work') return 'W';
  if (id === 'S' || id.startsWith('S/')) return 'home';
  if (id === 'P' || id.startsWith('P/')) return 'review';
  if (id === 'R/rv' || /^R\/so\d/.test(id)) return 'review';
  if (id === 'R' || id.startsWith('R/')) return 'me';
  if (id === 'D/ch') return 'D/0';
  if (id.startsWith('D/ch/')) { const k = id.slice('D/ch/'.length); return dvI(k) >= 0 ? `D/${k}` : 'D/0'; }
  const layer = /^L([1-5])(?:\/|$)/.exec(id);
  if (layer) return LAYER_STOP[layer[1]!] ?? 'D/0';
  if (/^(TR|US|MY)\d$/.test(id) || id.startsWith('X:')) return 'D/6';
  return null;
}
