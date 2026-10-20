import { expect, test, type Page } from '@playwright/test';
import { signInAs } from './harness';

// No horizontal overflow at 320, 375, 768 and 1440 px, in English and, at the narrowest and
// widest widths, in every other locale (long German words, right-to-left Arabic). The phone's
// way around (the Contents tag, which replaces a menu) opens and folds back.

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
  // The corner tags are fixed, so they never widen the page; check that they stay on screen.
  await expect
    .poll(() => page.locator('.tags .tag').evaluateAll((els) => Math.max(...els.map((el) => el.getBoundingClientRect().right)) - window.innerWidth), { message: `${label} corner tags run off screen` })
    .toBeLessThanOrEqual(0);
  const panel = page.locator('.panel__scroll');
  if (await panel.count()) {
    await expect.poll(() => panel.evaluate((el) => el.scrollWidth - el.clientWidth), { message: `${label} panel overflows` }).toBeLessThanOrEqual(0);
  }
}

const OTHER_LOCALES = ['es', 'fr', 'de', 'pt', 'zh', 'ar'];
const inLocale = (path: string, locale: string) => path.replace(/^\/en/, `/${locale}`);

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

for (const locale of OTHER_LOCALES) {
  for (const width of [320, 1440]) {
    test.describe(`${locale} at ${width}px`, () => {
      test.use({ viewport: { width, height: width < 768 ? 800 : 900 } });

      for (const path of PUBLIC.map((p) => inLocale(p, locale))) {
        test(`${path} has no horizontal overflow`, async ({ page }) => {
          await page.goto(path);
          await expect(page.locator('html')).toHaveAttribute('lang', locale);
          await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
          await noOverflow(page, `${path} at ${width}px`);
        });
      }

      for (const { path, role } of SIGNED_IN) {
        test(`${inLocale(path, locale)} as ${role} has no horizontal overflow`, async ({ page, context }) => {
          await signInAs(context, role, `resp-${locale}${width}`);
          await page.goto(inLocale(path, locale));
          await noOverflow(page, `${inLocale(path, locale)} (${role}) at ${width}px`);
        });
      }
    });
  }
}

// Every quilt block holds its own text, in every language, on a short laptop and a small phone.
for (const viewport of [{ width: 1280, height: 720 }, { width: 320, height: 640 }]) {
  test(`quilt blocks hold their text in every locale at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const found: string[] = [];
    for (const locale of ['en', ...OTHER_LOCALES]) {
      await page.goto(`/${locale}`);
      await page.waitForTimeout(1200);
      const spill = await page.evaluate(() => {
        const out: string[] = [];
        for (const blk of document.querySelectorAll<HTMLElement>('.quilt-world > .block')) {
          const face = blk.querySelector('.block__face')!.getBoundingClientRect();
          for (const t of blk.querySelectorAll<HTMLElement>('h1, h2, p, a, li, button, summary')) {
            if (!t.textContent?.trim() || t.closest('.sr-only, [aria-hidden=true], details:not([open]) > ul')) continue;
            const r = t.getBoundingClientRect();
            if (!r.width) continue;
            const over = Math.max(face.top - r.top, r.bottom - face.bottom, face.left - r.left, r.right - face.right);
            if (over > 1) out.push(`${blk.dataset.block} ${t.tagName.toLowerCase()} by ${Math.round(over)}px`);
          }
        }
        return out;
      });
      found.push(...spill.map((s) => `/${locale}: ${s}`));
    }
    expect([...new Set(found)]).toEqual([]);
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
