import { expect, test, type Page } from '@playwright/test';
import { signInAs } from './harness';

// No horizontal overflow at 320, 375, 768 and 1440 px, and the phone's way around (the
// Contents tag, which replaces a menu) opens and folds back.

const PUBLIC = ['/en', '/en/how-it-works', '/en/for-volunteers', '/en/for-nonprofits', '/en/impact', '/en/about', '/en/contact', '/en/help', '/en/docs', '/en/docs/api', '/en/privacy', '/en/contents', '/en/tasks', '/en/login', '/en/signup', '/en/not-a-block'];
const SIGNED_IN = [
  { path: '/en/dashboard', role: 'volunteer' as const },
  { path: '/en/dashboard', role: 'ngo' as const },
  { path: '/en/org', role: 'ngo' as const },
  { path: '/en/badges/manage', role: 'ngo' as const }
];
const WIDTHS = [320, 375, 768, 1440];

async function noOverflow(page: Page, label: string) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), { message: `${label} overflows` })
    .toBeLessThanOrEqual(0);
  const panel = page.locator('.panel__scroll');
  if (await panel.count()) {
    await expect.poll(() => panel.evaluate((el) => el.scrollWidth - el.clientWidth), { message: `${label} panel overflows` }).toBeLessThanOrEqual(0);
  }
}

for (const width of WIDTHS) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: width < 768 ? 800 : 900 } });

    for (const path of PUBLIC) {
      test(`${path} has no horizontal overflow`, async ({ page }) => {
        await page.goto(path);
        await noOverflow(page, `${path} at ${width}px`);
      });
    }

    for (const { path, role } of SIGNED_IN) {
      test(`${path} as ${role} has no horizontal overflow`, async ({ page, context }) => {
        await signInAs(context, role, `resp${width}`);
        await page.goto(path);
        await noOverflow(page, `${path} (${role}) at ${width}px`);
      });
    }
  });
}

test.describe('phone way around', () => {
  test.use({ viewport: { width: 375, height: 800 }, hasTouch: true, isMobile: true });

  test('the Contents tag opens a panel and Fold back returns to the quilt', async ({ page }) => {
    await page.goto('/en');
    await page.getByRole('link', { name: 'Contents' }).first().tap();
    await expect(page).toHaveURL(/\/en\/contents$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Contents' })).toBeVisible();
    await page.getByRole('link', { name: 'Fold back' }).tap();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator('.panel')).toHaveCount(0);
  });

  test('blocks read as a vertical path and open as full-screen sheets', async ({ page }) => {
    await page.goto('/en');
    const order = await page.locator('.quilt-world > .block').evaluateAll((els) =>
      els.map((el) => ({ id: (el as HTMLElement).dataset.block, top: el.getBoundingClientRect().top })).sort((a, b) => a.top - b.top).map((b) => b.id)
    );
    expect(order.slice(0, 3)).toEqual(['title', 'community', 'tasks']);
    await page.getByRole('link', { name: 'Help', exact: true }).tap();
    const box = await page.locator('.panel').boundingBox();
    expect(box?.width).toBeGreaterThan(355);
  });
});
