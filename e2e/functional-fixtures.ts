import { test as base, expect } from '@playwright/test';

const placeholderImage = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect width="150" height="150" fill="#e2e8f0"/><circle cx="75" cy="60" r="24" fill="#94a3b8"/><path d="M28 140c6-35 27-52 47-52s41 17 47 52" fill="#94a3b8"/></svg>',
);

const applicationOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173')
  .origin;

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url());

      if (url.origin === applicationOrigin) {
        await route.continue();
        return;
      }

      if (url.origin === 'https://images.unsplash.com') {
        await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: placeholderImage });
        return;
      }

      if (url.origin === 'https://fonts.googleapis.com') {
        await route.fulfill({ status: 200, contentType: 'text/css', body: '' });
        return;
      }

      await route.abort();
    });

    await use(page);
  },
});

export { expect };
