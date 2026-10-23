import { defineConfig, devices } from '@playwright/test';
import { resolveBase } from './base.config.mjs';

const base: string = resolveBase();
const port = 4173;
// Uses the locally installed Google Chrome (no 150 MB browser download, works behind the GFW).
// Set CHROME_PATH to point at another Chromium, or PW_BUNDLED=1 to use `npx playwright install chromium`.
const chrome = process.env.PW_BUNDLED
  ? {}
  : process.env.CHROME_PATH
    ? { launchOptions: { executablePath: process.env.CHROME_PATH } }
    : { channel: 'chrome' as const };

const phone = (name: string, width: number, height: number) => ({
  name,
  use: { ...devices['Pixel 7'], ...chrome, viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
});

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  retries: 0,
  use: { baseURL: `http://localhost:${port}${base}`, locale: 'zh-CN', trace: 'off' },
  projects: [phone('m360', 360, 740), phone('m390', 390, 844), phone('m430', 430, 932)],
  webServer: {
    // serves the *built* dist under the real base, like GitHub Pages does; SI_E2E_SERVE=repo serves the committed
    // repo files instead (root build, legacy.html, next/ redirect) with a Pages-like static server (R5 cutover checks);
    // SI_E2E_ROOT=<dir> serves another directory with the same layout (a staged copy, before deploying)
    command: process.env.SI_E2E_SERVE === 'repo' ? `node scripts/pages-serve.mjs --port ${port} --prefix ${base}${process.env.SI_E2E_ROOT ? ` --root ${process.env.SI_E2E_ROOT}` : ''}` : `npx vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}${base}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
