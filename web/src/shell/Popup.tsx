import { recover } from '../boot/stale';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useApp } from '../store/app';
import { useT, tx } from '../i18n/L';
import { isStation, kids, part, PATH, tabn } from '../legacy/kb';
import { cardBack, closeInfo, drill, jumpFromCard, openFromCard, toast } from '../nav';
import { IC } from './common';
import { restoreTags } from '../legacy/restore';
import type { Lang } from '../i18n/types';

interface NodeCard { title: string; mc: string; body: string }
const loaders = import.meta.glob<Record<string, NodeCard>>('../legacy/gen/nodes/*.json', { import: 'default' });
const cache = new Map<string, Record<string, NodeCard>>();
async function loadCard(id: string, lang: Lang): Promise<NodeCard | null> {
  const c = part(id); if (!c) return null;
  const key = `../legacy/gen/nodes/${c.t}.${lang}.json`;
  let m = cache.get(key);
  if (!m) { const f = loaders[key]; if (!f) return null; m = await f(); cache.set(key, m); }
  return m[id] ?? null;
}
let uidN = 0;
const unesc = (s: string) => s.replace(/<[^>]*>/g, '').replace(/&(amp|lt|gt|quot|#39);/g, (_m, k: string) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[k] as string);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
function Chip({ cls, attr, icon, label, aria }: { cls?: string; attr: Record<string, string>; icon: string; label: string; aria?: string }) {
  return (
    <button type="button" className={'dd-c' + (cls ? ' ' + cls : '')} {...attr} aria-label={aria} title={aria || label}
      dangerouslySetInnerHTML={{ __html: icon + '<span>' + esc(label) + '</span>' }} />
  );
}
/** the sticky drill row under the title (live ddRow) */
function DrillRow({ id, cur, lang }: { id: string; cur: string; lang: Lang }) {
  const t = useT();
  const c = part(id); if (!c) return null;
  const it: JSX.Element[] = [];
  if (c.zoom && PATH[c.zoom] && c.zoom !== cur) it.push(<Chip key="z" cls="pri" attr={{ 'data-ddgo': c.zoom }} icon={IC.drill} label={tabn(c.zoom, lang)} aria={t('nav.drillTo') + tabn(c.zoom, lang)} />);
  kids(id).forEach((k) => { const n = part(k)?.n[lang] ?? k; it.push(<Chip key={'k' + k} attr={{ 'data-open': k }} icon={IC.down} label={n} aria={t('pop.down') + n} />); });
  (c.links ?? []).forEach((l, i) => it.push(<Chip key={'l' + i} cls="lk" attr={{ 'data-jump': l[0], 'data-lv': 'T4b' }} icon="" label={l[1][lang]} />));
  const up = c.up ? part(c.up) : undefined;
  if (c.up && up) it.push(<Chip key="u" cls="upc" attr={{ 'data-open': c.up }} icon={IC.up} label={up.n[lang]} aria={t('pop.up') + up.n[lang]} />);
  if (c.t !== cur) it.push(<Chip key="t" cls="upc" attr={{ 'data-ddgo': c.t }} icon={'<i aria-hidden="true">📌</i>'} label={tabn(c.t, lang)} aria={t('pop.here') + tabn(c.t, lang)} />);
  if (!it.length) return null;
  return <div className="m-dd" role="group" aria-label={t('pop.dd')}>{it}</div>;
}

export function Popup() {
  const t = useT();
  const popup = useApp((s) => s.popup), lang = useApp((s) => s.lang), cur = useApp((s) => s.station), stack = useApp((s) => s.cardStack), set = useApp((s) => s.set);
  const [card, setCard] = useState<{ id: string; lang: Lang; c: NodeCard; uid: string } | null>(null);
  const box = useRef<HTMLDivElement>(null), head = useRef<HTMLDivElement>(null), body = useRef<HTMLDivElement>(null);
  const open = !!popup && !!card && card.id === popup.id;

  useEffect(() => {
    if (!popup) return;
    let ok = true;
    void loadCard(popup.id, lang).then((c) => { if (ok && c) setCard({ id: popup.id, lang, c, uid: 'mt' + (++uidN) }); }, (e: unknown) => { void recover(e).then((r) => { if (!r && ok) toast(tx('st.loadfail', lang)); }); });
    return () => { ok = false; };
  }, [popup?.id, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  /* a new card starts at the top, focus on ×; head height for the sticky row */
  useLayoutEffect(() => {
    if (!open || !box.current) return;
    box.current.scrollTop = 0; box.current.style.transform = '';
    const h = head.current; if (h) box.current.style.setProperty('--mhh', h.offsetHeight + 'px');
  }, [open, card?.id, card?.lang]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) setTimeout(() => box.current?.querySelector<HTMLElement>('.close')?.focus({ preventScroll: true }), 30); }, [open, card?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  /* tabs: selection lives in the store so it survives a language switch */
  useLayoutEffect(() => {
    const b = body.current; if (!b || !open) return;
    restoreTags(b);
    const tabs = [...b.querySelectorAll<HTMLElement>('.m-tabs [role=tab]')];
    const sel = Math.min(popup?.tab ?? 0, Math.max(0, tabs.length - 1));
    tabs.forEach((x, i) => { const on = i === sel; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; const p = document.getElementById(x.getAttribute('aria-controls') ?? ''); if (p) p.hidden = !on; });
  }, [open, card, popup?.tab]);
  useEffect(() => {
    if (!popup) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (useApp.getState().full) return; closeInfo(); return; }
      const b = (e.target as Element).closest?.('.m-tabs [role=tab]'); if (!b || !body.current) return;
      const all = [...body.current.querySelectorAll<HTMLElement>('.m-tabs [role=tab]')], i = all.indexOf(b as HTMLElement);
      const j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? all.length - 1 : -2;
      if (j === -2) return; e.preventDefault();
      const n = (j + all.length) % all.length; set({ popup: { id: popup.id, tab: n } }); all[n]?.focus();
    };
    document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
  }, [popup, set]);

  const onClickCapture = (e: React.MouseEvent) => {
    const tg = e.target as Element, id = popup?.id; if (!id) return;
    const stop = () => { e.preventDefault(); e.stopPropagation(); };
    if (tg.closest('.m-back')) { stop(); cardBack(); return; }
    if (tg.closest('.close')) { stop(); closeInfo(); return; }
    const tab = tg.closest<HTMLElement>('.m-tabs [role=tab]');
    if (tab && body.current) { stop(); const all = [...body.current.querySelectorAll('.m-tabs [role=tab]')]; set({ popup: { id, tab: all.indexOf(tab) } }); tab.scrollIntoView({ block: 'nearest', inline: 'nearest' }); return; }
    const g = tg.closest<HTMLElement>('[data-go]'); if (g && g.dataset.go !== cur && isStation(g.dataset.go)) { stop(); drill(g.dataset.go, { open: id }); return; }
    const z = tg.closest<HTMLElement>('[data-zoom]'); if (z && isStation(z.dataset.zoom)) { stop(); drill(z.dataset.zoom, { open: id }); return; }
    const dd = tg.closest<HTMLElement>('[data-ddgo]'); if (dd && dd.dataset.ddgo) { stop(); drill(dd.dataset.ddgo, { open: id }); return; }
    const j = tg.closest<HTMLElement>('[data-jump]'); if (j) { stop(); jumpFromCard(j.dataset.jump ?? '', j.dataset.lv ?? ''); return; }
    const o = tg.closest<HTMLElement>('[data-open]'); if (o && o.dataset.open && part(o.dataset.open) && o.dataset.open !== id) { stop(); openFromCard(o.dataset.open); return; }
  };
  const pv = stack[stack.length - 1];
  const backL = pv ? t('pop.back') + (part(pv)?.n[lang] ?? '') : '';
  const c = card?.c;
  return (
    <div id="modal" role="dialog" aria-modal="true" className={open ? 'open' : undefined} aria-label={c && open ? unesc(c.title) : undefined}
      onClick={(e) => { if (e.target === e.currentTarget) closeInfo(); }}>
      <div className="box" id="modalBox" ref={box} style={{ '--mc': c?.mc ?? '' } as CSSProperties} onClickCapture={onClickCapture}>
        {c && open ? (
          <>
            <div className="m-head" ref={head}>
              <div className="m-grip" aria-hidden="true"><i /></div>
              <button className="close" aria-label={t('ui.close')}>×</button>
              <h3>{pv ? <button type="button" className="m-back" aria-label={backL} title={backL} dangerouslySetInnerHTML={{ __html: IC.prev }} /> : null}{unesc(c.title)}</h3>
              <DrillRow id={card.id} cur={cur} lang={lang} />
            </div>
            <div className="m-body" ref={body} dangerouslySetInnerHTML={{ __html: c.body.replace(/mt@/g, card.uid) }} />
          </>
        ) : null}
      </div>
    </div>
  );
}
