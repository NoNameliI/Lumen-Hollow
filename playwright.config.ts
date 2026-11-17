import { defineConfig } from '@playwright/test';

// Uses an installed browser channel so no browser download is needed.
const channel = process.env.PW_CHANNEL ?? 'msedge';
// PW_DEV=1 runs against the dev server, which exposes the debug hook used by capture specs.
const dev = !!process.env.PW_DEV;
const port = dev ? 4174 : 4173;

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  use: {
    channel,
    viewport: { width: 1440, height: 810 },
    baseURL: `http://localhost:${port}`,
  },
  webServer: {
    command: dev
      ? `npm run dev -- --port ${port} --strictPort`
      : `npm run build && npm run preview -- --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
