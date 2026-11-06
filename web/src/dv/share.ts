/* One share dialog for a station, a badge and the certificate.
   The picture carries a real progress line and one question from that station.
   The link is the friend landing: #D/ch/<station> with fa / fm when we have them. */
import { tx, type L } from '../l4/txt';
import type { Data } from '../l4/share/draw';
import { mlGet } from './prog';
import { DV_NM, dvI } from './links';

const sum = (a: number[] | undefined) => (a ?? []).reduce((s, n) => s + (Number.isFinite(n) ? n : 0), 0);

/** honest line: “这一站换了 N 组数都算对” only when every recorded set was right */
export function progressLine(k: string, l: L): string {
  const S = mlGet(k), right = sum(S.c), tries = sum(S.v), wrong = Math.max(0, tries - right);
  if (l === 'en') {
    if (right > 0 && wrong === 0) return `All ${right} number sets on this stop came out right`;
    if (right > 0) return `${right} number sets right on this stop`;
    return 'No number set right on this stop yet';
  }
  if (right > 0 && wrong === 0) return `这一站换了 ${right} 组数都算对`;
  if (right > 0) return `这一站算对了 ${right} 组数`;
  return '这一站还没算对一组数';
}

export async function sharePack(k: string, l: L, title: string, head: string): Promise<Data> {
  const [{ CH, chUrl }, { QQ }, { fillDvText }, D] = await Promise.all([
    import('./ch'), import('../vf/data'), import('./nums'), import('../l4/share/draw'),
  ]);
  const qid = CH[k], Q = qid ? QQ[qid] : undefined;
  const q = Q ? fillDvText(tx(Q.q, l), l).replace(/`/g, '') : title;
  const name = tx(DV_NM[dvI(k)] ?? [title, title], l);
  return {
    site: tx(D.SITE_N, l), url: chUrl(k, l),
    lv: l === 'zh' ? `第 ${k} 站` : `Stop ${k}`, lvC: '#4f46e5', path: '', icon: '✎',
    name, idea: q, parts: [], co: '', why: '',
    head, badge: '✎',
    scan: l === 'zh' ? '扫码做这道题' : 'Scan to try the question',
    how: '', whyT: '',
    pts: [head, q.slice(0, 90), l === 'zh' ? '答对才看讲解' : 'The explanation waits until the answer is right'],
    sub: l === 'zh' ? '一层层看懂 AI' : 'AI, layer by layer',
  };
}

/** station / badge / certificate all open this dialog */
export async function openShare(host: HTMLElement, l: L, k: string, title: string, head: string, kind: string, file: string, lock = false) {
  const data = await sharePack(k, l, title, head);
  const { mountShare } = await import('../l4/share/modal');
  await mountShare(host, { l, title, file, data, kind, lock });
}
