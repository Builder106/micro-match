import { test, expect } from '@playwright/test';
import { demoClick, dwellForDemo, setupDemoPage, patchFillForDemo, slowFill, DEMO_TAIL_MS } from './helpers';

test.describe('03-feed-tour', () => {
  test.beforeEach(async ({ page }) => {
    patchFillForDemo();
    await setupDemoPage(page);
  });

  test.afterEach(async ({ page }) => {
    if (process.env.DEMO === '1') {
      try { await page.waitForTimeout(DEMO_TAIL_MS); } catch {}
    }
  });

  // Renamed from "…and empty state": the 2026-05 recording was filmed against
  // an unseeded feed, so it ended on the empty-state mascot. With seed data the
  // feed is populated the whole way through and the filters have real results
  // to narrow — which is the more useful thing to show anyway.
  test('search, time filters, and hashtag chips', async ({ page }) => {
    await page.goto('/tasks');
    await dwellForDemo(page, 1800);

    // Beat 1: header + search
    await expect(page.getByRole('heading', { name: /Find your next/i })).toBeVisible();
    await dwellForDemo(page, 1800);

    // Beat 2: type a search query
    await slowFill(page.getByPlaceholder(/Search tasks/i), 'translate');
    await dwellForDemo(page, 1500);

    // Beat 3: clear it via the X button
    await demoClick(page.getByLabel('Clear search'));
    await dwellForDemo(page, 800);

    // Beat 4: click each time-filter chip
    await demoClick(page.getByRole('button', { name: /≤ 15 min/ }));
    await dwellForDemo(page, 1200);
    await demoClick(page.getByRole('button', { name: /≤ 15 min/ })); // toggle off
    await dwellForDemo(page, 600);

    await demoClick(page.getByRole('button', { name: /≤ 30 min/ }));
    await dwellForDemo(page, 1200);

    // Beat 5: pick a hashtag
    await demoClick(page.getByRole('button', { name: /#design/ }));
    await dwellForDemo(page, 1800);

    // Beat 6: clear filters — the full feed comes back
    const clearBtn = page.getByRole('button', { name: /Clear filters/i });
    if (await clearBtn.isVisible().catch(() => false)) {
      await demoClick(clearBtn);
      await dwellForDemo(page, 1500);
    }

    // Beat 7: hold on the restored feed
    await expect(page.getByText(/8 tasks open/i)).toBeVisible();
    await dwellForDemo(page, 2500);
  });
});
