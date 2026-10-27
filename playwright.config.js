import { defineConfig } from '@playwright/test';

// Runs against the production build (vite preview) in the system Chrome.
export default defineConfig({
  testDir: 'tests',
  timeout: 45_000,
  // One worker: the intro tests measure real timing, and parallel WebGL contexts skew it.
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173/',
    channel: 'chrome',
    trace: 'off',
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
