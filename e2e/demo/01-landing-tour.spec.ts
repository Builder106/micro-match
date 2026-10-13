import { test, expect } from '@playwright/test';
import { dwellForDemo, setupDemoPage, patchFillForDemo, DEMO_TAIL_MS } from './helpers';

test.describe('01-landing-tour', () => {
  test.beforeEach(async ({ page }) => {
    patchFillForDemo();
    await setupDemoPage(page);
  });

  test.afterEach(async ({ page }) => {
    // Tail dwell so the final frame reads as a still image at the end of the GIF.
    if (process.env.DEMO === '1') {
      try { await page.waitForTimeout(DEMO_TAIL_MS); } catch {}
    }
  });

  test('the handoff table, from post to badge', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Make a big impact/i })).toBeVisible();
    await dwellForDemo(page, 1800);

    // One beat per scene: post, claim, work, proof, review, badge, then the live tasks.
    for (const progress of [0.08, 0.22, 0.42, 0.62, 0.78, 0.9, 1]) {
      await page.evaluate((p) => {
        const exchange = document.querySelector<HTMLElement>('.exchange');
        if (exchange) window.scrollTo({ top: exchange.offsetTop + (exchange.offsetHeight - window.innerHeight) * p, behavior: 'smooth' });
      }, progress);
      await dwellForDemo(page, 2000);
    }
  });
});
