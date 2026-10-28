import { defineConfig } from 'vite';
import { resolveBase } from './base.config.mjs';
import { buildId, versionJson } from './scripts/build-id.mjs';
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

/** the home canonical / JSON-LD url follow the build base (a /SI/next/ preview build stays self-consistent) */
const ORIGIN = 'https://superjackman.github.io';
const canonical = (): Plugin => ({ name: 'si-canonical', apply: 'build', transformIndexHtml: (html) => html.split(`${ORIGIN}/SI/"`).join(`${ORIGIN}${base}"`) });

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
  plugins: [versionFile(), canonical(), stripHtmlComments()],
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
    // three.js is one lazy chunk named three-*.js, fetched with the explorer's 3D stage (src/l4/scene3d.ts); nothing on
    // the first screen imports it
    rollupOptions: { output: { manualChunks: (id: string) => (/[\\/]node_modules[\\/]three[\\/]/.test(id) ? 'three' : undefined) } },
  },
  preview: { port: 4173, strictPort: true },
  server: { port: 5173 },
});
