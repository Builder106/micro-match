import { chromium, devices } from '@playwright/test';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:5173';
const OUT = join(process.cwd(), 'test-results', 'mobile-audit');

const viewports = [
  { name: 'iphone13', device: devices['iPhone 13'] },
  { name: 'pixel7', device: devices['Pixel 7'] },
];

const pages = [
  { slug: 'landing', path: '/' },
  { slug: 'login', path: '/login' },
  { slug: 'signup', path: '/signup' },
  { slug: 'forgot-password', path: '/forgot-password' },
  { slug: 'tasks', path: '/tasks' },
  { slug: 'dashboard', path: '/dashboard' },
  { slug: 'profile', path: '/profile' },
];

async function run() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();

  for (const vp of viewports) {
    const context = await browser.newContext({ ...vp.device });
    const page = await context.newPage();
    for (const p of pages) {
      const url = BASE + p.path;
      try {
        const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 20_000 });
        await page.waitForTimeout(800);
        const file = join(OUT, `${vp.name}-${p.slug}.png`);
        await page.screenshot({ path: file, fullPage: true });
        const status = resp?.status() ?? 0;
        const finalUrl = page.url();
        console.log(`${vp.name} ${p.slug.padEnd(18)} ${status}  ${finalUrl}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`${vp.name} ${p.slug.padEnd(18)} ERR  ${msg}`);
      }
    }
    await context.close();
  }

  await browser.close();
  console.log(`\nScreenshots in ${OUT}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
