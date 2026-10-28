import { defineConfig, devices } from '@playwright/test';

// Browser suites for the quilt frontend. Each run starts a production preview that uses the
// in-memory store (empty Appwrite variables plus the test harness), so nothing touches a
// real backend. Suites share one server and run serially in one worker.
const port = Number(process.env.PORT ?? 4173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

const harnessEnv = {
  NODE_ENV: 'development',
  PLAYWRIGHT_A11Y_HARNESS: '1',
  APPWRITE_ENDPOINT: '',
  APPWRITE_PROJECT_ID: '',
  APPWRITE_API_KEY: '',
  PLUNK_SECRET_KEY: '',
  PUBLIC_APPWRITE_ENDPOINT: 'https://appwrite.test',
  PUBLIC_APPWRITE_PROJECT_ID: 'e2e',
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  timeout: 45_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: 'disabled', caret: 'hide' },
  },
  snapshotPathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}{ext}',
  use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    {
      name: 'functional',
      testMatch: /functional\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'responsiveness',
      testMatch: /responsiveness\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    { name: 'visual', testMatch: /visual\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
    {
      name: 'accessibility',
      testMatch: /accessibility\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `${process.env.PLAYWRIGHT_USE_PREBUILT === '1' ? '' : 'bun run build && '}bun run preview --host 127.0.0.1 --port ${port} --strictPort`,
        url: `${baseURL}/en`,
        reuseExistingServer: false,
        timeout: 180_000,
        env: harnessEnv,
      },
});
