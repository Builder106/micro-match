import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT ?? 4173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

const functionalFixtureEnv = {
  NODE_ENV: 'development',
  PLAYWRIGHT_FUNCTIONAL_FIXTURES: '1',
  APPWRITE_ENDPOINT: '',
  APPWRITE_PROJECT_ID: '',
  APPWRITE_API_KEY: '',
  APPWRITE_DB_ID: '',
  APPWRITE_TASKS_TABLE_ID: '',
  APPWRITE_CLAIMS_TABLE_ID: '',
  APPWRITE_BADGES_TABLE_ID: '',
  PUBLIC_APPWRITE_ENDPOINT: 'https://placeholder.example.com',
  PUBLIC_APPWRITE_PROJECT_ID: 'functional-placeholder',
};

const webServer = process.env.PLAYWRIGHT_BASE_URL
  ? undefined
  : {
      command: `${process.env.PLAYWRIGHT_USE_PREBUILT === '1' ? '' : 'bun run build && '}bun run preview --host 127.0.0.1 --port ${port}`,
      url: baseURL,
      reuseExistingServer: false,
      timeout: 120_000,
      env: functionalFixtureEnv,
    };

export default defineConfig({
  testDir: './e2e',
  testMatch: /smoke\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer,
});
