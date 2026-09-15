import { expect, test, type Page } from '@playwright/test';

const LOCALES = ['en', 'fr', 'de', 'zh', 'ar'] as const;
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 375, height: 812 }
] as const;

async function prepareVisualState(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  await page.addStyleTag({ content: '.badge-sparkle { visibility: hidden !important; } *, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }' });
  await page.evaluate(async () => {
    if ('fonts' in document) await document.fonts.ready;
  });
}

async function expectHeaderGroupsFit(page: Page, width: number): Promise<void> {
  const groups = await page.evaluate(() => ['.header-brand', '.header-nav', '.header-actions'].map((selector) => {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) return { selector, visible: false, left: 0, right: 0 };
    const rect = element.getBoundingClientRect();
    return { selector, visible: getComputedStyle(element).display !== 'none', left: rect.left, right: rect.right };
  }));
  const visible = groups.filter((group) => group.visible).sort((left, right) => left.left - right.left);
  expect(visible, 'All desktop header groups must be rendered').toHaveLength(3);
  for (const group of visible) {
    expect(group.left, `${group.selector} starts inside the viewport`).toBeGreaterThanOrEqual(-1);
    expect(group.right, `${group.selector} ends inside the viewport`).toBeLessThanOrEqual(width + 1);
  }
  for (let index = 1; index < visible.length; index += 1) {
    expect(visible[index].left - visible[index - 1].right, `${visible[index - 1].selector} and ${visible[index].selector} need clearance`).toBeGreaterThanOrEqual(8);
  }
}

for (const locale of LOCALES) {
  for (const viewport of VIEWPORTS) {
    test.describe(`${locale} ${viewport.name}`, () => {
      test.use({ viewport });

      test('site header matches the localization baseline', async ({ page }) => {
        await page.goto(`/${locale}`, { waitUntil: 'networkidle' });
        await prepareVisualState(page);
        const header = page.locator('.site-header');
        await expect(header).toBeVisible();
        if (viewport.width === 1440) await expectHeaderGroupsFit(page, viewport.width);
        await expect(header).toHaveScreenshot(`${locale}-${viewport.name}-site-header.png`, { animations: 'disabled', caret: 'hide', scale: 'css' });
      });

      test('impact section matches the localization baseline', async ({ page }) => {
        await page.goto(`/${locale}`, { waitUntil: 'networkidle' });
        await prepareVisualState(page);
        const impact = page.locator('#impact');
        await impact.scrollIntoViewIfNeeded();
        await expect(impact).toBeVisible();
        await expect(impact).toHaveScreenshot(`${locale}-${viewport.name}-impact.png`, { animations: 'disabled', caret: 'hide', scale: 'css' });
      });
    });
  }
}
