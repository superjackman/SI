import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { useApp } from './store/app';
import { installStaleGuard } from './boot/stale';
import './legacy/gen/legacy.css';
import './styles/shell.css';

import { eventFor, isLocalHost } from './analyticsEvents';

declare const __SI_ANALYTICS__: boolean;

installStaleGuard();
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

/* R16 stale-cache check (src/boot/version.ts, own chunk): at idle after load, and again when the tab comes back
   (the chunk throttles that to once per 5 min). "touched" = any tap / key / wheel since the page opened. */
let touched = false;
for (const t of ['pointerdown', 'touchstart', 'keydown', 'wheel']) addEventListener(t, () => { touched = true; }, { capture: true, passive: true, once: true });
/* R16 full screen (src/boot/fs.ts, own chunk, loaded at idle): auto full screen on the first tap where the API
   exists, or the one-time add-to-home-screen tip where it does not */
/* (it also loads the iOS edge swipe-back guard, src/boot/edge.ts) */
const fsInit = () => { void import('./boot/fs').then((m) => m.installFS()).catch(() => { /* optional */ }); };
const vchk = () => { if (location.protocol !== 'file:') import('./boot/version').then((m) => m.check(() => touched)).catch(() => { /* optional */ }); };
const idle = () => { const w = window as unknown as { requestIdleCallback?: (f: () => void, o: object) => void }; const f = () => { vchk(); fsInit(); }; if (w.requestIdleCallback) w.requestIdleCallback(f, { timeout: 2500 }); else setTimeout(f, 300); };
if (document.readyState === 'complete') idle(); else addEventListener('load', idle, { once: true });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') vchk(); });

/* analytics: own chunk, only on the /SI/ build, only after 'load' — content never waits for it */
const h = location.hostname;
if (__SI_ANALYTICS__ && location.protocol !== 'file:' && !isLocalHost(h)) {
  /* lab / quiz events: capture-phase listeners from the start (passive, never prevent anything); names are queued
     until the chunk has loaded after 'load', then forwarded directly */
  const q: string[] = [];
  let send: ((n: string) => void) | null = null;
  const onEv = (e: Event) => { const n = eventFor(e); if (n) { if (send) send(n); else if (q.length < 50) q.push(n); } };
  addEventListener('click', onEv, { capture: true, passive: true });
  addEventListener('input', onEv, { capture: true, passive: true });
  addEventListener('si-ev', onEv);
  const start = () => setTimeout(() => {
    void import('./analytics').then((a) => {
      const run = () => { const s = useApp.getState(); a.count(s.lang, s.station, document.title); };
      run();
      useApp.subscribe(run);
      send = a.event;
      q.splice(0).forEach(a.event);
    }).catch(() => { /* analytics is optional */ });
  }, 0);
  if (document.readyState === 'complete') start(); else addEventListener('load', start, { once: true });
}

/* small read-mostly handle for tests and debugging (same role as the live page's window.__u) */
void import('./nav').then((n) => { (window as unknown as { __si: unknown }).__si = { go: n.go, openInfo: n.openInfo, drill: n.drill, back: n.back, state: () => useApp.getState() }; });
