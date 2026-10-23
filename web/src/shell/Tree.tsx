/* Learning map in the More sheet (live #tree / buildTree / openPath / spy): stations as a nested tree, each with its
   visible cards; open/closed state in localStorage aiexp.v2.open. The card outline is a lazy chunk per language. */
import { useEffect, useState, type ReactNode } from 'react';
import { useApp } from '../store/app';
import { useT } from '../i18n/L';
import type { Lang } from '../i18n/types';
import { PATH, TABORDER, tabn } from '../legacy/kb';
import { visited } from '../nav';

type Row = [string, string, '' | 'lab' | 'quiz', number];
const OUT = import.meta.glob<Record<string, Row[]>>('../legacy/gen/outline.*.json', { import: 'default' });
type N = [string, N[]];
const TREE: N[] = [['T1', [['U', [['Ua', []], ['Ub', []], ['Uc', []], ['Ud', []]]], ['T2', [['T3', [['N', []], ['T4', [['T4a', []], ['T4b', []]]]]]]]]], ['T5', []], ['T6', []], ['T7', []], ['T8', []]];
const LSK = 'aiexp.v2.open';
function loadOpen(): Record<string, number> { try { const v = JSON.parse(localStorage.getItem(LSK) ?? 'null') as unknown; if (v && typeof v === 'object') return v as Record<string, number>; } catch { /* */ } return { T1: 1, T2: 1, T3: 1, T4: 1 }; }
const saveOpen = (o: Record<string, number>) => { try { localStorage.setItem(LSK, JSON.stringify(o)); } catch { /* private mode */ } };

/** live spy(): the card under the top bar */
function spyId(S: string, rows: Row[] | undefined): string | null {
  let best: string | null = null; const y = (document.getElementById('topbar')?.offsetHeight || 58) + 40;
  for (const [id] of rows ?? []) {
    const c = id ? document.getElementById(id) : null; if (!c || c.classList.contains('zhide') || !c.closest('#' + CSS.escape(S))) continue;
    const r = c.getBoundingClientRect(); if (r.top <= y + 80 && r.bottom > y) best = best || c.id; if (r.top <= y + 80) best = c.id;
  }
  return best;
}

export function Tree({ active }: { active: boolean }) {
  const t = useT();
  const lang = useApp((s) => s.lang), S = useApp((s) => s.station), zoom = useApp((s) => s.zoom);
  const [out, setOut] = useState<{ lang: Lang; o: Record<string, Row[]> } | null>(null);
  const [open, setOpen] = useState(loadOpen);
  const [vis, setVis] = useState<string[]>(visited);
  const [on, setOn] = useState<string | null>(null);
  /* live openPath on every go */
  useEffect(() => { setOpen((o) => { const n = { ...o }; (PATH[S] ?? []).forEach((k) => { n[k] = 1; }); saveOpen(n); return n; }); setVis(visited()); }, [S]);
  useEffect(() => {
    if (!active) return;
    setVis(visited());
    if (out?.lang !== lang) void OUT[`../legacy/gen/outline.${lang}.json`]?.().then((o) => setOut({ lang, o })).catch(() => { /* offline: map stays stations-only */ });
  }, [active, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const p = () => setVis(visited());
    document.addEventListener('si-progress', p); return () => document.removeEventListener('si-progress', p);
  }, []);
  const rows = out?.lang === lang ? out.o : null;
  useEffect(() => {
    if (!active || !rows) return;
    const f = requestAnimationFrame(() => setOn(spyId(S, rows[S])));
    return () => cancelAnimationFrame(f);
  }, [active, rows, S, zoom]);
  const node = ([id, kids]: N): ReactNode => {
    const o = !!open[id], num = TABORDER.indexOf(id) + 1, cur = id === S, v = vis.includes(id);
    return (
      <li key={id} className={o ? '' : 'closed'} data-node={id}>
        <div className={'tn' + (cur ? ' cur' : '') + (v ? ' vis' : '')}>
          <button className="car" aria-label={t('tree.toggle') + tabn(id, lang)} aria-expanded={o} data-tg={id}
            onClick={(e) => { e.stopPropagation(); setOpen((x) => { const n = { ...x, [id]: x[id] ? 0 : 1 }; saveOpen(n); return n; }); }}>▶</button>
          <a data-go={id} aria-current={cur ? 'page' : undefined}><span className="num">{num}</span>{tabn(id, lang)}</a>
          <span className="ck" title={v ? t('tree.vis') : t('tree.notVis')}>{v ? '✓' : '○'}</span>
        </div>
        <ul>
          {(rows?.[id] ?? []).filter(([cid, , , z]) => cid && z <= zoom).map(([cid, txt, k]) => (
            <li key={cid}><div className={'tn sec' + (k === 'lab' ? ' lab' : k === 'quiz' ? ' quizn' : '') + (on === cid && id === S ? ' on' : '')} data-secid={cid}><span className="car sp" /><a data-sj={cid} data-sp={id}>{txt}</a></div></li>
          ))}
          {kids.map(node)}
        </ul>
      </li>
    );
  };
  return <nav id="tree" aria-label={t('tree.aria')}><ul>{TREE.map(node)}</ul></nav>;
}
