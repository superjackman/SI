import { defineConfig } from 'vitest/config';
export default defineConfig({
  define: { __SI_ANALYTICS__: 'false' },
  test: { environment: 'jsdom', include: ['tests/unit/**/*.test.ts'], globals: false },
});
