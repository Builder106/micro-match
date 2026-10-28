import { expect, test } from '@playwright/test';
import { signInAs } from './harness';

// Visual baselines for every page, desktop and phone. They run on a fresh server, so the
// quilt is in its honest zero state: an empty frame waiting for its first patch.

const PAGES = [
  ['home', '/en'],
  ['how-it-works', '/en/how-it-works'],
  ['for-volunteers', '/en/for-volunteers'],
  ['for-nonprofits', '/en/for-nonprofits'],
  ['impact', '/en/impact'],
  ['about', '/en/about'],
  ['contact', '/en/contact'],
  ['help', '/en/help'],
  ['docs', '/en/docs'],
  ['api', '/en/docs/api'],
  ['privacy', '/en/privacy'],
  ['terms', '/en/terms'],
  ['cookies', '/en/cookies'],
  ['contents', '/en/contents'],
  ['not-found', '/en/not-a-block'],
  ['tasks', '/en/tasks'],
  ['login', '/en/login'],
  ['signup', '/en/signup'],
  ['forgot-password', '/en/forgot-password'],
  ['reset-password', '/en/reset-password'],
] as const;
const SIGNED_IN = [
  ['volunteer-dashboard', '/en/dashboard', 'volunteer'],
  ['nonprofit-dashboard', '/en/dashboard', 'ngo'],
  ['post-a-task', '/en/org', 'ngo'],
  ['design-a-patch', '/en/badges/manage', 'ngo'],
] as const;

const SIZES = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, isMobile: false },
  { name: 'phone', viewport: { width: 390, height: 844 }, isMobile: true },
];

for (const size of SIZES) {
  test.describe(size.name, () => {
    test.use({ viewport: size.viewport, isMobile: size.isMobile, hasTouch: size.isMobile });
    test.beforeEach(async ({ page }) => {
      // Hold idle motion still, and skip the first-visit entrance so home is shot at rest
      // instead of mid-animation.
      await page.addInitScript(() => {
        localStorage.setItem('mm-still', '1');
        sessionStorage.setItem('mm-entered', '1');
      });
    });

    for (const [name, path] of PAGES) {
      test(name, async ({ page }) => {
        await page.goto(path, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1600);
        await expect(page).toHaveScreenshot(`${size.name}-${name}.png`);
      });
    }

    for (const [name, path, role] of SIGNED_IN) {
      test(name, async ({ page, context }) => {
        await signInAs(context, role, `visual-${size.name}`);
        await page.goto(path, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1600);
        await expect(page).toHaveScreenshot(`${size.name}-${name}.png`, {
          mask: [page.locator('.num')],
        });
      });
    }
  });
}
