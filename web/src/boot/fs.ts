/* R16 full screen on phones (first-load, tiny). The Fullscreen API needs a user tap and does not exist for pages on
   iPhone Safari; there "Add to Home Screen" (manifest display:fullscreen → standalone, apple-mobile-web-app-capable)
   is the only way, so a one-time tip says so (lazy chunk ./a2hs; never inside WeChat).
   - where requestFullscreen exists (Android Chrome, Samsung, Firefox, iPad Safari …) R21: a small card asks first
     ("full screen?" yes / no thanks; lazy ./a2hs) — on touch screens only, never inside WeChat / an installed app /
     an iframe, and never again after "no thanks" or once the reader has left full screen (si.fs = 0);
   - ⛶ in the ☰ menu toggles it (or shows the tip where it cannot work). */
type El = HTMLElement & { webkitRequestFullscreen?: () => void };
type Doc = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void; webkitFullscreenEnabled?: boolean };
const d = document as Doc, de = d.documentElement as El, ua = navigator.userAgent;
const ls = (k: string, v?: string) => { try { if (v == null) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { /* private mode */ } return null; };
export const inWx = /MicroMessenger/i.test(ua);
export const isIOS = /iP(hone|od|ad)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
export const fsEl = () => d.fullscreenElement ?? d.webkitFullscreenElement ?? null;
export const canFS = () => !!(de.requestFullscreen || de.webkitRequestFullscreen) && (d.fullscreenEnabled ?? d.webkitFullscreenEnabled) !== false;
export const installed = () => matchMedia('(display-mode: standalone),(display-mode: fullscreen)').matches || (navigator as { standalone?: boolean }).standalone === true;
const coarse = () => matchMedia('(pointer: coarse)').matches;
const quiet = (p: unknown) => { (p as Promise<void> | undefined)?.catch?.(() => { /* refused: fine */ }); };
export function enterFS() { try { quiet(de.requestFullscreen ? de.requestFullscreen({ navigationUI: 'hide' }) : de.webkitRequestFullscreen?.()); } catch { /* refused */ } }
export function exitFS() { try { quiet(d.exitFullscreen ? d.exitFullscreen() : d.webkitExitFullscreen?.()); } catch { /* not in full screen */ } }
export const tip = (force = false) => { void import('./a2hs').then((m) => m.showTip(isIOS, force)).catch(() => { /* optional */ }); };
export function toggleFS() { if (!canFS()) tip(true); else if (fsEl()) exitFS(); else enterFS(); }

export function installFS() {
  if (isIOS) void import('./edge').then((m) => m.installEdgeGuard(d.querySelector('main'))).catch(() => { /* optional */ });
  let was = false;
  const sync = () => { const on = !!fsEl(); de.classList.toggle('is-fs', on); if (was && !on) ls('si.fs', '0'); was = on; };
  d.addEventListener('fullscreenchange', sync); d.addEventListener('webkitfullscreenchange', sync);
  if (inWx || installed() || !coarse() || self !== top) return;
  if (canFS()) {
    if (ls('si.fs') === '0') return;
    setTimeout(() => { if (!fsEl()) void import('./a2hs').then((m) => m.askFS(enterFS)).catch(() => { /* optional */ }); }, 4000);
  } else if (!ls('si.a2hs')) setTimeout(() => tip(), 4000);
}
