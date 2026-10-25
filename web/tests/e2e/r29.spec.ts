import { test, expect, type Browser, type BrowserContext } from '@playwright/test';
import { resolveBase } from '../../base.config.mjs';
/* R29 visit counting on the committed repo layout (real-looking host si.test, pixels intercepted, never sent):
   exactly one page view per real navigation. The live site sent a second page view (same stop, referrer = the site
   itself) when it reloaded itself: the stale-version auto-reload, chunk recovery, the update banner. */
const BASE: string = resolveBase();
const REPO = process.env.SI_E2E_SERVE === 'repo' && BASE === '/SI/';
const GC = 'https://superjackman-si.goatcounter.com/count';
const GIF = Buffer.from('R0lGODlhAQABAAAAACw=', 'base64');
type Hit = { p: string; r: string | null; q: string | null };
async function site(b: Browser, opt: { returning?: boolean; newer?: boolean } = {}): Promise<{ ctx: BrowserContext; hits: Hit[]; docs: string[] }> {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const hits: Hit[] = [], docs: string[] = [];
  await ctx.route(GC + '**', (r) => { const s = new URL(r.request().url()).searchParams; hits.push({ p: s.get('p')!, r: s.get('r'), q: s.get('q') }); return r.fulfill({ status: 200, contentType: 'image/gif', body: GIF }); });
  await ctx.route((u) => u.hostname !== 'si.test' && !u.href.startsWith(GC), (r) => r.abort());
  /* a deploy happened after this page was cached: version.json names a newer build → the app reloads itself once */
  if (opt.newer) await ctx.route(/version\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"id":"newer000001"}' }));
  if (opt.returning) await ctx.addInitScript(() => { try { localStorage.setItem('aiexp.v2.onb', '1'); localStorage.setItem('aiexp.v2.coach', '1'); localStorage.setItem('aiexp.v2.obtips', '["dd","ro","dots"]'); } catch { /* */ } });
  ctx.on('request', (r) => { if (r.isNavigationRequest() && r.frame() === r.frame().page()?.mainFrame()) docs.push(new URL(r.url()).pathname + new URL(r.url()).search); });
  return { ctx, hits, docs };
}
const views = (h: Hit[]) => h.filter((x) => !x.p.startsWith('evt-'));
const url = (path: string) => `http://si.test:4173${BASE}${path}`;

test.describe('R29 one page view per real navigation', () => {
  test.skip(!REPO, 'needs SI_TARGET=root SI_E2E_SERVE=repo');
  let b: Browser;
  test.beforeAll(async ({ playwright }) => { b = await playwright.chromium.launch({ channel: 'chrome', args: ['--host-resolver-rules=MAP si.test 127.0.0.1'] }); });
  test.afterAll(async () => { await b?.close(); });

  test('first visit: one page view + the welcome event (evt-onb-show is an event, not a second visit)', async () => {
    const { ctx, hits } = await site(b);
    const p = await ctx.newPage();
    await p.goto(url('?lang=zh#T3'));
    await expect.poll(() => hits.map((h) => h.p), { timeout: 15_000 }).toContain('evt-onb-show');
    await p.waitForTimeout(2500);
    expect(views(hits).map((h) => h.p)).toEqual(['/zh/T3']);
    expect(hits.filter((h) => h.p.startsWith('evt-')).every((h) => /^evt-(onb|tip|coach)-/.test(h.p))).toBe(true);
    await ctx.close();
  });

  for (const [path, view] of [['?lang=zh#T3', '/zh/T3'], ['', '/zh/home'], ['?lang=en&from=wechat#T4a', '/en/T4a']] as const) {
    test(`stale cached page ${path || '(home)'} reloads itself once and still counts one page view ${view}`, async () => {
      const { ctx, hits, docs } = await site(b, { returning: true, newer: true });
      const p = await ctx.newPage();
      await p.goto(url(path));
      /* the auto-reload really happens (second document load with ?v=<new id>) … */
      await expect.poll(() => docs.length, { timeout: 15_000 }).toBe(2);
      expect(docs[1]).toContain('v=newer000001');
      await p.locator('html[data-si-ready]').waitFor({ state: 'attached', timeout: 15_000 });
      await p.waitForTimeout(2500);
      /* … but the visit is counted once (the live site sent a second one here, r = the site's own address) */
      expect(views(hits).map((h) => h.p)).toEqual([view]);
      expect(views(hits)[0]!.r ?? '').not.toContain('si.test');
      if (path.includes('from=')) { expect(views(hits)[0]!.q).toBe('?campaign=wechat&ref=wechat'); expect(hits.filter((h) => h.p === 'evt-from-wechat').length).toBe(1); }
      /* navigating on afterwards counts as usual */
      await p.evaluate(() => (window as unknown as { __si: { go(s: string): void } }).__si.go('T5'));
      await expect.poll(() => views(hits).length).toBe(2);
      expect(views(hits)[1]!.p).toMatch(/^\/(zh|en)\/T5$/);
      await ctx.close();
    });
  }

  test('a reload by the visitor (no marker) is a new page view; /SI/next/ counts once where it lands; SEO pages send nothing', async () => {
    const { ctx, hits } = await site(b, { returning: true });
    const p = await ctx.newPage();
    await p.goto(url('?lang=zh#T3'));
    await expect.poll(() => views(hits).length, { timeout: 15_000 }).toBe(1);
    await p.reload();
    await expect.poll(() => views(hits).length, { timeout: 15_000 }).toBe(2);
    expect(views(hits).map((h) => h.p)).toEqual(['/zh/T3', '/zh/T3']);
    await p.goto(url('next/'));
    await p.locator('html[data-si-ready="H.zh"]').waitFor({ state: 'attached', timeout: 15_000 });
    await expect.poll(() => views(hits).length, { timeout: 15_000 }).toBe(3);
    await p.waitForTimeout(1200);
    expect(views(hits).length).toBe(3);
    expect(views(hits)[2]!.p).toBe('/zh/home');
    await p.goto(url('s/T3/'));
    await p.waitForLoadState('load'); await p.waitForTimeout(1500);
    expect(views(hits).length).toBe(3);
    await ctx.close();
  });
});
