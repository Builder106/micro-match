import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 4173);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results/audit-tests',
  testMatch: /(?:responsiveness|accessibility)\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['json', { outputFile: 'audit-output/audit.json' }], ['html', { outputFolder: 'audit-output/audit-report', open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    headless: true,
    video: {
      mode: 'retain-on-failure',
      size: { width: 1280, height: 720 }
    },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
      command: `bun run build && PLAYWRIGHT_A11Y_HARNESS=1 bun run preview --host 127.0.0.1 --port ${PORT}`,
      url: BASE_URL,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NODE_ENV: 'development',
        PLAYWRIGHT_A11Y_HARNESS: '1'
      }
    }
});
