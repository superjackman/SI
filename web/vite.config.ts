import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolveBase } from './base.config.mjs';

const base: string = resolveBase();

export default defineConfig({
  base,
  plugins: [react()],
  define: {
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
