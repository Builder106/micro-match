import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT ?? 4173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const webServer = process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: `${process.env.PLAYWRIGHT_USE_PREBUILT === '1' ? '' : 'bun run build && '}PLAYWRIGHT_A11Y_HARNESS=1 bun run preview --host 127.0.0.1 --port ${port}`, url: baseURL, reuseExistingServer: false, timeout: 120_000, env: { NODE_ENV: 'development', PLAYWRIGHT_A11Y_HARNESS: '1' } };

export default defineConfig({ testDir: './e2e', testMatch: /responsiveness\.spec\.ts/, outputDir: 'test-results/responsiveness-tests', fullyParallel: false, workers: 1, retries: 0, timeout: 120_000, expect: { timeout: 10_000 }, reporter: [['list'], ['json', { outputFile: 'audit-output/responsiveness.json' }], ['html', { outputFolder: 'audit-output/responsiveness-report', open: 'never' }]], use: { baseURL, headless: true, screenshot: 'only-on-failure', video: 'retain-on-failure', trace: 'retain-on-failure' }, projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }], webServer });
