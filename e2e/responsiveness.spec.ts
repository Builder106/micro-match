import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'audit-output');
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, 'screenshots');

// Ensure output directories exist
['mobile', 'tablet', 'desktop'].forEach((vp) => {
  fs.mkdirSync(path.join(SCREENSHOT_DIR, vp), { recursive: true });
});
fs.mkdirSync(path.join(OUTPUT_DIR, 'videos'), { recursive: true });

const pagesToAudit = [
  { name: 'home', path: '/' },
  { name: 'tasks', path: '/tasks' },
  { name: 'how-it-works', path: '/how-it-works' },
  { name: 'for-ngos', path: '/for-ngos' },
  { name: 'for-volunteers', path: '/for-volunteers' },
  { name: 'impact', path: '/impact' },
  { name: 'login', path: '/login' },
  { name: 'signup', path: '/signup' },
  { name: 'contact', path: '/contact' },
  { name: 'help', path: '/help' },
  { name: 'docs-api', path: '/docs/api' },
];

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 }
];

async function checkNoHorizontalOverflow(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return document.documentElement.scrollWidth <= window.innerWidth + 1; // 1px rounding margin
  });
}

test.describe('Responsiveness Audit - Screenshots & Layout Checks', () => {
  for (const vp of viewports) {
    test.describe(`Viewport: ${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const p of pagesToAudit) {
        test(`Audit page layout: ${p.name}`, async ({ page }) => {
          await page.goto(p.path, { waitUntil: 'networkidle' });
          await page.waitForTimeout(300);

          // Verify no horizontal overflow
          const noOverflow = await checkNoHorizontalOverflow(page);
          expect(noOverflow, `Page ${p.path} has horizontal scroll overflow at ${vp.width}px`).toBe(true);

          // Capture full-page screenshot
          const screenshotPath = path.join(SCREENSHOT_DIR, vp.name, `${p.name}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });
        });
      }
    });
  }
});

test.describe('Responsiveness Audit - Interactive Flow Videos', () => {
  test('Mobile User Flow Video', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 375, height: 812 });

    // Step 1: Home page
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    // Step 2: Open Mobile Menu
    const menuBtn = page.locator('.menu-toggle');
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.waitForTimeout(1000);
      // Close menu
      await menuBtn.click();
      await page.waitForTimeout(600);
    }

    // Step 3: Browse Tasks
    await page.goto('/tasks', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(800);

    // Step 4: Signup Flow
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const volunteerBtn = page.getByRole('button', { name: /I'm a Volunteer/i });
    if (await volunteerBtn.isVisible()) {
      await volunteerBtn.click();
      await page.waitForTimeout(1000);
    }

    // Step 5: How it Works
    await page.goto('/how-it-works', { waitUntil: 'domcontentloaded' });
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(1000);
  });

  test('Tablet User Flow Video', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 768, height: 1024 });

    // Step 1: Home page
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(800);

    // Step 2: For NGOs
    await page.goto('/for-ngos', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(800);

    // Step 3: Browse Tasks with filter
    await page.goto('/tasks', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const chip15 = page.getByRole('button', { name: /≤ 15 min/ });
    if (await chip15.isVisible()) {
      await chip15.click();
      await page.waitForTimeout(1000);
    }
  });

  test('Desktop User Flow Video', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 1440, height: 900 });

    // Step 1: Home page full scroll
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(800);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(800);

    // Step 2: Impact page
    await page.goto('/impact', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(800);

    // Step 3: API Docs page
    await page.goto('/docs/api', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(800);
  });
});
