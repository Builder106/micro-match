// Renders the brand HTML templates (banners, social preview) to PNG files.
// Run: bun run scripts/render-media.ts
// Prereq: bunx playwright install chromium  (one-time, ~150 MB browser binary)

import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

type Target = {
  html: string;
  png: string;
  width: number;
  height: number;
};

const targets: Target[] = [
  { html: 'static/social-preview.html', png: 'static/social-preview.png', width: 1280, height: 640 },
  { html: 'static/banner-light.html',   png: 'static/banner-light.png',   width: 1280, height: 320 },
  { html: 'static/banner-dark.html',    png: 'static/banner-dark.png',    width: 1280, height: 320 }
];

console.log('Launching headless Chromium…');
const browser = await chromium.launch();
try {
  for (const t of targets) {
    const htmlPath = resolve(root, t.html);
    const pngPath = resolve(root, t.png);

    const context = await browser.newContext({
      viewport: { width: t.width, height: t.height },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => (document as Document & { fonts: { ready: Promise<void> } }).fonts.ready);
    await page.screenshot({ path: pngPath, fullPage: false });
    await context.close();
    console.log(`✓ ${t.html} → ${t.png}`);
  }
} finally {
  await browser.close();
}
