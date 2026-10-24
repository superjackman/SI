import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolveBase } from './base.config.mjs';
import { buildId, versionJson } from './scripts/build-id.mjs';
import { buildSeo, ORIGIN } from './scripts/seo.mjs';
import type { Plugin } from 'vite';
import { fileURLToPath } from 'node:url';

const base: string = resolveBase();
/* R16: content-hash build id → bundle (__SI_BUILD__) + <site>/version.json (dev server answers it too, so no 404 there) */
const BUILD = buildId(fileURLToPath(new URL('.', import.meta.url)), base);
const versionFile = (): Plugin => ({
  name: 'si-version-json',
  generateBundle() { this.emitFile({ type: 'asset', fileName: 'version.json', source: versionJson(BUILD) }); },
  configureServer(s) { s.middlewares.use((q, r, next) => { if ((q.url ?? '').split('?')[0] === base + 'version.json') { r.setHeader('content-type', 'application/json'); r.setHeader('cache-control', 'no-store'); r.end(versionJson(BUILD)); } else next(); }); },
});

/** R25 SEO: static per-stop pages (s/<S>/, en/s/<S>/), catalogues, sitemap.xml, robots.txt, 404.html — built from the
    same generated stop HTML on every build (scripts/seo.mjs); none of it is loaded by the app */
const seoFiles = (): Plugin => ({
  name: 'si-seo', apply: 'build',
  // the home canonical / JSON-LD url follow the build base, so a /SI/next/ preview build is self-consistent with its sitemap
  transformIndexHtml: (html) => html.split(`${ORIGIN}/SI/"`).join(`${ORIGIN}${base}"`),
  generateBundle() { for (const [fileName, source] of buildSeo({ web: fileURLToPath(new URL('.', import.meta.url)), base })) this.emitFile({ type: 'asset', fileName, source }); },
});

/** R16: the built index.html loses its source comments (HTML comments and whole-line block comments in the inline
    <script>/<style>) — they are for readers of web/index.html, and every first-load byte counts */
function stripHtmlComments(): Plugin {
  return {
    name: 'si-strip-html-comments', apply: 'build',
    transformIndexHtml: { order: 'post', handler: (html: string) => html.replace(/[ \t]*<!--(?!\[)[\s\S]*?-->[ \t]*\r?\n?/g, '').replace(/^[ \t]*\/\*[\s\S]*?\*\/[ \t]*\r?\n/gm, '') },
  };
}

export default defineConfig({
  base,
  plugins: [react(), versionFile(), seoFiles(), stripHtmlComments()],
  define: {
    __SI_BUILD__: JSON.stringify(BUILD),
    // analytics only counts on the production root (/SI/) unless forced; /SI/next/ never pollutes the dashboard
    __SI_ANALYTICS__: JSON.stringify(process.env.SI_ANALYTICS === '1' || (process.env.SI_ANALYTICS !== '0' && base === '/SI/')),
  },
  build: {
    target: 'es2019', // older in-app browsers (WeChat/QQ X5) still in use
    outDir: 'dist',
    emptyOutDir: true,
    manifest: true,
    assetsInlineLimit: 2048,
    cssCodeSplit: true,
    sourcemap: false,
  },
  preview: { port: 4173, strictPort: true },
  server: { port: 5173 },
});
