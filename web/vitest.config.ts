import { defineConfig } from 'vitest/config';
export default defineConfig({
  define: { __SI_ANALYTICS__: 'false', __SI_BUILD__: '"test-build"' },
  test: { environment: 'jsdom', include: ['tests/unit/**/*.test.ts'], globals: false },
});
