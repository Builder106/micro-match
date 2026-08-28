import { expect, test, type Page } from '@playwright/test';

const PAGES = ['/', '/tasks', '/how-it-works', '/for-ngos', '/for-volunteers', '/impact', '/login', '/signup', '/contact', '/help', '/docs/api'];
const VIEWPORTS = [{ name: 'narrow', width: 320, height: 800 }, { name: 'mobile', width: 375, height: 812 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'desktop', width: 1440, height: 900 }] as const;

async function expectNoOverflow(page: Page, route: string, width: number): Promise<void> {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), { message: `${route} overflows at ${width}px` }).toBe(true);
}

async function expectFocusableControl(page: Page): Promise<void> {
  const control = page.locator('a, button, input, select, textarea').first();
  if (await control.count()) { await control.focus(); await expect(control).toBeFocused(); }
}

test.describe.configure({ mode: 'serial' });
for (const viewport of VIEWPORTS) test.describe(`Responsive layout: ${viewport.name}`, () => {
  test.use({ viewport: { width: viewport.width, height: viewport.height } });
  for (const route of PAGES) test(`${route} has no overflow and keyboard focus`, async ({ page }) => {
    await page.goto(`/en${route === '/' ? '' : route}`, { waitUntil: 'networkidle' }); await expectNoOverflow(page, route, viewport.width); await expectFocusableControl(page);
  });
});

test('reduced motion disables active animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/en', { waitUntil: 'networkidle' });
  const animated = await page.locator('*').evaluateAll((elements) => elements.filter((element) => { const style = getComputedStyle(element); return style.animationName !== 'none' || style.transitionDuration !== '0s'; }).length);
  expect(animated, 'Reduced-motion pages must not retain active CSS animation or transition declarations.').toBe(0);
});

test('forced colors keeps the page usable', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' }); await page.goto('/en/tasks', { waitUntil: 'networkidle' }); await expect(page.locator('main')).toBeVisible(); await expectNoOverflow(page, '/tasks', 1440); await expectFocusableControl(page);
});

test('mobile menu opens, closes, and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 }); await page.goto('/en', { waitUntil: 'networkidle' }); const toggle = page.locator('.menu-toggle'); await expect(toggle).toBeVisible();
  await toggle.click(); await expect(toggle).toHaveAttribute('aria-expanded', 'true'); await page.keyboard.press('Escape'); await expect(toggle).toHaveAttribute('aria-expanded', 'false'); await expect(toggle).toBeFocused();
});
