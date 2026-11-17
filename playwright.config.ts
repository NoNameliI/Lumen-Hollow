import { defineConfig } from '@playwright/test';

// Uses an installed browser channel so no browser download is needed.
const channel = process.env.PW_CHANNEL ?? 'msedge';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: {
    channel,
    viewport: { width: 1440, height: 810 },
    baseURL: 'http://localhost:4173',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
