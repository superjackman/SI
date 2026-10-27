/* R34: the classic site (React), now its own lazy chunk: it loads with ?classic=1 or after "classic version" in the menu */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { useApp } from './store/app';
import './legacy/gen/legacy.css';
import './styles/shell.css';
import './styles/r28.css';

export function mount() {
  createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
  /* small read-mostly handle for tests and debugging (same role as the live page's window.__u) */
  void import('./nav').then((n) => { (window as unknown as { __si: unknown }).__si = { go: n.go, openInfo: n.openInfo, drill: n.drill, back: n.back, state: () => useApp.getState() }; });
}
