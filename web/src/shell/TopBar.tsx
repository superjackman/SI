import { recover } from '../boot/stale';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../store/app';
import { useT } from '../i18n/L';
import { KB, TABORDER, tabn } from '../legacy/kb';
import { go, openAnywhere } from '../nav';
import { dotClasses } from '../station/hydrate';
import { svgHtml } from './common';
import { toggleDrawer } from './drawer';
import type { Lang } from '../i18n/types';

type Roles = Record<string, { zh: string; en: string }>;
let rolesP: Promise<Roles> | null = null;
const loadRoles = () => (rolesP ||= import('../legacy/gen/search.json').then((m) => m.default as Roles, (e: unknown) => { rolesP = null; void recover(e); return {} as Roles; }));
/** live searchFind: name (both languages) + id first, then the one-line role (both languages); top 14 */
export function searchFind(q: string, roles: Roles | null): string[] {
  q = q.trim().toLowerCase(); if (!q) return [];
  const a: string[] = [], b: string[] = [];
  for (const [id, c] of Object.entries(KB.C)) {
    if ((c.n.zh + ' ' + c.n.en + ' ' + id).toLowerCase().includes(q)) a.push(id);
    else if (roles?.[id] && (roles[id].zh + ' ' + roles[id].en).toLowerCase().includes(q)) b.push(id);
  }
  return a.concat(b).slice(0, 14);
}

function Search({ lang }: { lang: Lang }) {
  const t = useT();
  const open = useApp((s) => s.searchOpen);
  const [q, setQ] = useState('');
  const [roles, setRoles] = useState<Roles | null>(null);
  const inp = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) { void loadRoles().then(setRoles); setTimeout(() => inp.current?.focus(), 30); } else inp.current?.blur(); }, [open]);
  const res = useMemo(() => searchFind(q, roles), [q, roles]);
  const pick = (id: string) => { useApp.getState().set({ searchOpen: false }); openAnywhere(id); };
  return (
    <div className="search">
      <input id="search" ref={inp} type="search" placeholder={t('search.placeholder')} autoComplete="off" enterKeyHint="search" aria-label={t('search.parts')}
        value={q} onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (res[0]) pick(res[0]); } else if (e.key === 'Escape') useApp.getState().set({ searchOpen: false }); }} />
      <div id="searchRes" className={q.trim() ? 'open' : undefined} onClick={(e) => { const o = (e.target as Element).closest<HTMLElement>('[data-open]'); if (o) { e.stopPropagation(); pick(o.dataset.open ?? ''); } }}>
        {q.trim() && !res.length ? <div style={{ cursor: 'default' }}>{t('search.none')}</div> : null}
        {res.map((id, i) => { const c = KB.C[id]; if (!c) return null; return (
          <div key={id} data-open={id} className={i === 0 ? 'on' : ''}>{c.n[lang]}<small>{tabn(c.t, lang)} · {roles?.[id]?.[lang] ?? ''}</small></div>
        ); })}
      </div>
    </div>
  );
}

export function TopBar() {
  const t = useT();
  const lang = useApp((s) => s.lang), S = useApp((s) => s.station), drawer = useApp((s) => s.drawerOpen), set = useApp((s) => s.set), setLang = useApp((s) => s.setLang);
  const i = TABORDER.indexOf(S), pv = TABORDER[i - 1], nx = TABORDER[i + 1];
  const prog = useRef<HTMLElement>(null);
  useEffect(() => {
    let p = false;
    const upd = () => { p = false; const d = document.documentElement, m = d.scrollHeight - window.innerHeight; if (prog.current) prog.current.style.width = (m > 0 ? Math.min(100, window.pageYOffset / m * 100) : 0) + '%'; };
    const on = () => { if (!p) { p = true; requestAnimationFrame(upd); } };
    addEventListener('scroll', on, { passive: true }); addEventListener('resize', on); document.addEventListener('si-station-ready', on);
    on();
    return () => { removeEventListener('scroll', on); removeEventListener('resize', on); document.removeEventListener('si-station-ready', on); };
  }, []);
  const pvL = pv ? t('nav.prevStop') + tabn(pv, lang) : t('nav.firstStop');
  const nxL = nx ? t('nav.nextStop') + tabn(nx, lang) : t('nav.lastStop');
  const langL = t('lang.switchTo');
  return (
    <div className="topbar" id="topbar">
      <i id="tbProg" ref={prog} aria-hidden="true" />
      <div className="tb-in">
        <button className="icon-btn tb-ic tb-menu" id="mMenu" aria-label={t('nav.menu.open')} title={t('nav.allStops')} aria-controls="mDrawer" aria-expanded={drawer ? 'true' : 'false'}
          onClick={toggleDrawer} {...svgHtml('menu')} />
        <button className="icon-btn tb-ic tb-nv" id="mPrev" disabled={!pv} aria-label={pvL} title={pvL} onClick={() => pv && go(pv)} {...svgHtml('prev')} />
        <div className="tb-where" id="tbWhere" aria-live="polite"><b>{tabn(S, lang)}</b><span className="tb-dots" aria-hidden="true">{dotClasses(S).map((c, k) => <i key={k} className={c} />)}<small>{i + 1}/{TABORDER.length}</small></span></div>
        <button className="icon-btn tb-ic tb-nv" id="mNext" disabled={!nx} aria-label={nxL} title={nxL} onClick={() => nx && go(nx)} {...svgHtml('next')} />
        <button className="icon-btn tb-ic" id="mSearch" aria-label={t('search.parts')} title={t('search.parts')} aria-controls="search"
          onClick={() => { const o = useApp.getState().searchOpen; set({ searchOpen: !o, sheetOpen: false, popup: null, cardStack: [], full: null }); }}>🔎</button>
        <button className="icon-btn tb-ic tb-lang" id="mLang" aria-label={langL} title={langL} lang={lang === 'en' ? 'zh-CN' : 'en'} onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}>{lang === 'en' ? '中' : 'EN'}</button>
        <Search lang={lang} />
      </div>
    </div>
  );
}
