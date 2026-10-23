import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { useApp } from './store/app';
import { installStaleGuard } from './boot/stale';
import './legacy/gen/legacy.css';
import './styles/shell.css';

import { eventFor } from './analyticsEvents';

declare const __SI_ANALYTICS__: boolean;

installStaleGuard();
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

/* analytics: own chunk, only on the /SI/ build, only after 'load' — content never waits for it */
const h = location.hostname;
if (__SI_ANALYTICS__ && location.protocol !== 'file:' && h !== 'localhost' && h !== '127.0.0.1') {
  /* lab / quiz events: capture-phase listeners from the start (passive, never prevent anything); names are queued
     until the chunk has loaded after 'load', then forwarded directly */
  const q: string[] = [];
  let send: ((n: string) => void) | null = null;
  const onEv = (e: Event) => { const n = eventFor(e); if (n) { if (send) send(n); else if (q.length < 50) q.push(n); } };
  addEventListener('click', onEv, { capture: true, passive: true });
  addEventListener('input', onEv, { capture: true, passive: true });
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
