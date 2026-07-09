import { defineConfig } from '@playwright/test';

/**
 * `retries` + `trace: 'on-first-retry'` reduce a11y/visual flakiness:
 * on CI we retry once and capture a full trace for the retried attempt
 * (uploaded via the CI job's playwright-report artifact). Locally we
 * keep retries at 0 so flakes surface immediately.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }]]
    : [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'https://id-preview--b0469be3-ad0e-4993-92f9-ef6c0bbd1e01.lovable.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Snapshots determinísticos: sistema honra `prefers-reduced-motion`
    // e desliga transições, evitando diffs por animações no meio de frame.
    reducedMotion: 'reduce',
  },
});
