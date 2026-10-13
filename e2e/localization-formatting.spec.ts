import { expect, test, type Page } from '@playwright/test';

const LOCALES = ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ar'] as const;
const ROUTES = ['/', '/tasks', '/how-it-works', '/for-ngos', '/for-volunteers', '/impact', '/login', '/signup', '/contact', '/help', '/docs/api'] as const;
const VIEWPORTS = [
  { name: 'narrow', width: 320, height: 800 },
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 }
] as const;

function localizedPath(locale: string, route: string): string {
  return `/${locale}${route === '/' ? '' : route}`;
}

async function expectNoHorizontalOverflow(page: Page, route: string, width: number): Promise<void> {
  await expect.poll(
    () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    { message: `${route} overflows horizontally at ${width}px` }
  ).toBe(true);
}

async function expectVisibleGeometry(page: Page): Promise<void> {
  const issues = await page.evaluate(() => {
    const selectors = 'h1, h2, h3, h4, label, button, a, input, select, textarea';
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    return [...document.querySelectorAll<HTMLElement>(selectors)].filter((element) => {
      const style = getComputedStyle(element);
      return !element.closest('[aria-hidden="true"]') && style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
    }).flatMap((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return [];
      const intersectsViewport = rect.bottom > -1 && rect.top < viewport.height + 1;
      if (!intersectsViewport) return [];
      const outside = rect.left < -1 || rect.right > viewport.width + 1;
      return outside ? [`${element.tagName.toLowerCase()} outside horizontal viewport (${Math.round(rect.left)}, ${Math.round(rect.right)})`] : [];
    });
  });

  expect(issues, 'Visible text and controls must remain inside the viewport').toEqual([]);
}

async function expectNoClippedConstrainedText(page: Page): Promise<void> {
  const issues = await page.evaluate(() => {
    const candidates = [...document.querySelectorAll<HTMLElement>('h1, h2, h3, h4, p, label, button, a, [class*="desc"], [class*="title"]')].filter((element) => !element.closest('[aria-hidden="true"]'));
    return candidates.flatMap((element) => {
      if (!element.getClientRects().length) return [];
      const style = getComputedStyle(element);
      const constrained = style.overflow === 'hidden' || style.overflowY === 'hidden' || style.overflowY === 'clip';
      return constrained && element.scrollHeight > element.clientHeight + 1
        ? [`${element.tagName.toLowerCase()} clips ${element.scrollHeight - element.clientHeight}px of text`]
        : [];
    });
  });

  expect(issues, 'Constrained text containers must not clip content').toEqual([]);
}

async function expectDesktopHeaderControls(page: Page): Promise<void> {
  const controls = page.locator('.header-nav a:visible, .header-signin:visible, .header-github:visible, .locale-trigger:visible, .header-actions .btn-coral:visible');
  const count = await controls.count();
  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    await expect(control, `Header control ${index} must remain single-line`).toHaveCSS('white-space', 'nowrap');
    await expect(control).toBeVisible();
  }
}

test.describe.configure({ mode: 'serial' });

for (const locale of LOCALES) {
  for (const viewport of VIEWPORTS) {
    test.describe(`${locale} ${viewport.name}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      for (const route of ROUTES) {
        test(`${localizedPath(locale, route)} formats correctly`, async ({ page }) => {
          await page.goto(localizedPath(locale, route), { waitUntil: 'networkidle' });
          await expect(page.locator('html')).toHaveAttribute('lang', locale);
          await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
          await expectNoHorizontalOverflow(page, route, viewport.width);
          await expectVisibleGeometry(page);
          await expectNoClippedConstrainedText(page);

          if (viewport.name === 'desktop') await expectDesktopHeaderControls(page);
        });
      }
    });
  }
}
