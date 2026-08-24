import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 5173);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: /(?:responsiveness|accessibility)\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    headless: true,
    video: {
      mode: 'on',
      size: { width: 1280, height: 720 }
    },
    screenshot: 'on'
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
      command: `bun run dev -- --port ${PORT}`,
      url: BASE_URL,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        PLAYWRIGHT_A11Y_HARNESS: '1'
      }
    }
});
