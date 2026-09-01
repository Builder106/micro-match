import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT ?? 4173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const webServer = process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: `${process.env.PLAYWRIGHT_USE_PREBUILT === '1' ? '' : 'bun run build && '}PLAYWRIGHT_A11Y_HARNESS=1 bun run preview --host 127.0.0.1 --port ${port}`, url: baseURL, reuseExistingServer: false, timeout: 120_000, env: { NODE_ENV: 'development', PLAYWRIGHT_A11Y_HARNESS: '1' } };

const reporter = process.env.CI ? [['blob'] as const] : [['list'] as const, ['json', { outputFile: 'audit-output/accessibility.json' }] as const, ['html', { outputFolder: 'audit-output/accessibility-report', open: 'never' }] as const];
export default defineConfig({ testDir: './e2e', testMatch: /accessibility\.spec\.ts/, outputDir: 'test-results/accessibility-tests', fullyParallel: true, workers: Number(process.env.PLAYWRIGHT_A11Y_WORKERS ?? 1), retries: 0, timeout: 120_000, expect: { timeout: 10_000 }, reporter, use: { baseURL, headless: true, screenshot: 'only-on-failure', video: 'retain-on-failure', trace: 'retain-on-failure' }, projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }, { name: 'firefox', use: { ...devices['Desktop Firefox'] } }], webServer });
