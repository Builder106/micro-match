import { expect, test, type Page } from '@playwright/test';

const PAGES = ['/', '/tasks', '/how-it-works', '/for-ngos', '/for-volunteers', '/impact', '/login', '/signup', '/contact', '/help', '/docs/api'];
const VIEWPORTS = [{ name: 'narrow', width: 320, height: 800 }, { name: 'mobile', width: 375, height: 812 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'desktop', width: 1440, height: 900 }] as const;
const REDUCED_MOTION_PAGES = ['/en', '/en/how-it-works', '/en/for-ngos', '/en/for-volunteers', '/en/tasks'];
const REDUCED_MOTION_VIEWPORTS = [{ name: 'narrow', width: 320, height: 800 }, { name: 'desktop', width: 1440, height: 900 }] as const;

async function expectNoOverflow(page: Page, route: string, width: number): Promise<void> {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), { message: `${route} overflows at ${width}px` }).toBe(true);
}

async function expectFocusableControl(page: Page): Promise<void> {
  const control = page.locator('a:visible, button:visible, input:visible, select:visible, textarea:visible').first();
  if (await control.count()) { await control.focus(); await expect(control).toBeFocused(); }
}

test.describe.configure({ mode: 'serial' });
for (const viewport of VIEWPORTS) test.describe(`Responsive layout: ${viewport.name}`, () => {
  test.use({ viewport: { width: viewport.width, height: viewport.height } });
  for (const route of PAGES) test(`${route} has no overflow and keyboard focus`, async ({ page }) => {
    await page.goto(`/en${route === '/' ? '' : route}`, { waitUntil: 'networkidle' }); await expectNoOverflow(page, route, viewport.width); await expectFocusableControl(page);
  });
});

for (const route of REDUCED_MOTION_PAGES) for (const viewport of REDUCED_MOTION_VIEWPORTS) {
  test(`reduced motion disables animation on ${route} at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route, { waitUntil: 'networkidle' });

    const violations = await page.evaluate(() => {
      const declarations: Array<{ selector: string; pseudoElement: string; property: string; value: string }> = [];
      const pseudoElements = ['', '::before', '::after'];
      const elements = [...document.querySelectorAll<HTMLElement>('*')];

      for (const element of elements) {
        const selector = element.tagName.toLowerCase() + (element.id ? `#${element.id}` : '') + (element.className && typeof element.className === 'string' ? `.${element.className.trim().split(/\s+/).join('.')}` : '');
        for (const pseudoElement of pseudoElements) {
          const style = getComputedStyle(element, pseudoElement || undefined);
          if (style.animationName !== 'none') declarations.push({ selector, pseudoElement, property: 'animationName', value: style.animationName });
          if (style.transitionDuration !== '0s') declarations.push({ selector, pseudoElement, property: 'transitionDuration', value: style.transitionDuration });
        }
      }

      const animations = document.getAnimations().map((animation) => ({
        effect: animation.effect?.constructor.name ?? 'unknown',
        playState: animation.playState,
        target: animation.effect instanceof KeyframeEffect && animation.effect.target instanceof Element ? animation.effect.target.tagName.toLowerCase() : 'unknown'
      }));
      return { declarations, animations };
    });

    expect(violations, `Reduced-motion violations on ${route} at ${viewport.width}px`).toEqual({ declarations: [], animations: [] });
  });
}

test('forced colors keeps the page usable', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' }); await page.goto('/en/tasks', { waitUntil: 'networkidle' }); await expect(page.locator('main')).toBeVisible(); await expectNoOverflow(page, '/tasks', 1440); await expectFocusableControl(page);
});

test('mobile menu opens, closes, and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 }); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/en', { waitUntil: 'networkidle' }); const toggle = page.locator('.menu-toggle'); await expect(toggle).toBeVisible();
  await toggle.click(); await expect(toggle).toHaveAttribute('aria-expanded', 'true'); await page.keyboard.press('Escape'); await expect(toggle).toHaveAttribute('aria-expanded', 'false'); await expect(toggle).toBeFocused();
});
