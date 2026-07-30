import { test, expect } from '@playwright/test';
import {
  demoClick,
  dwellForDemo,
  setupDemoPage,
  patchFillForDemo,
  slowFill,
  signIn,
  signOut,
  DEMO_PASSWORD,
  VOLUNTEER_EMAIL,
  NGO_EMAIL,
  BADGE_LABEL,
  DEMO_TAIL_MS
} from './helpers';

// The closed loop — the thing MicroMatch has that a directory doesn't.
// docs/positioning.md: "Idealist hands you off to the org and disappears.
// Claim → submit → approve → badge is one product." This films that claim.
//
// Both halves run in a single browser context on purpose: Playwright records
// one video per context, so a second context for the NGO would split the story
// across two files. Hence the sign out / sign in in the middle — which also
// reads honestly, since the volunteer and the org really are two people.
//
// Requires `bun run seed` with SEED_DEMO_PASSWORD set. The seed also clears the
// volunteer's prior claims and badges, without which the approval mints nothing
// (processBadgeAwards skips labels the user already holds) and the payoff shot
// comes up empty.

const TASK_TITLE = 'Translate a medical flyer into Spanish';
const PROOF_URL = 'https://docs.google.com/document/d/1x-flyer-es-translation';
const NOTES =
  "Translated all 250 words into plain Spanish. Kept the clinical terms exact and flagged two for a pharmacist to double-check.";

test.describe('04-closed-loop', () => {
  // Three sign-ins, a form fill, and ~20 dwell beats — well past the 180s
  // default once slowMo is applied to every action.
  test.setTimeout(360_000);

  test.beforeEach(async ({ page }) => {
    patchFillForDemo();
    await setupDemoPage(page);
  });

  test.afterEach(async ({ page }) => {
    if (process.env.DEMO === '1') {
      try { await page.waitForTimeout(DEMO_TAIL_MS); } catch {}
    }
  });

  test('claim, submit, approve, badge', async ({ page }) => {
    expect(DEMO_PASSWORD, 'SEED_DEMO_PASSWORD must be set — run `bun run seed` first').not.toBe('');

    // ─────────── Act 1: the volunteer ───────────

    await signIn(page, VOLUNTEER_EMAIL, DEMO_PASSWORD);
    await dwellForDemo(page, 2000);

    // Beat 1: the vault starts locked. This is the "before" half of the payoff —
    // the same tile flips to earned at the end.
    //
    // Scroll to the tile, not the "Badge vault" heading: scrollIntoViewIfNeeded
    // moves the minimum distance, so anchoring on the heading parks it at the
    // bottom edge with the tiles themselves still below the fold.
    await page.getByText(BADGE_LABEL).first().scrollIntoViewIfNeeded();
    await expect(page.getByText(BADGE_LABEL).first()).toBeVisible();
    await dwellForDemo(page, 2500);

    // Beat 2: the feed
    await page.goto('/tasks');
    await page.getByRole('heading', { name: /Find your next/i }).waitFor({ state: 'visible' });
    await dwellForDemo(page, 2200);

    // Beat 3: open a task
    await demoClick(page.getByRole('link', { name: TASK_TITLE, exact: true }).first());
    await page.getByRole('heading', { name: TASK_TITLE }).waitFor({ state: 'visible' });
    await dwellForDemo(page, 1800);

    // Beat 4: the Verified chip — the ProPublica-backed trust signal, shown in
    // context rather than as a museum piece.
    await expect(page.getByTitle('Verification confirmed')).toBeVisible();
    await dwellForDemo(page, 2500);

    // Beat 5: claim it
    await demoClick(page.getByRole('link', { name: /Claim this task/i }));
    await page.getByRole('heading', { name: /Send your work for review/i }).waitFor({ state: 'visible' });
    await dwellForDemo(page, 1800);

    // Beat 6: submit proof of work — the step a directory has no place for
    await slowFill(page.getByPlaceholder(/docs\.google\.com/), PROOF_URL);
    await dwellForDemo(page, 800);
    await slowFill(page.getByPlaceholder(/Describe your approach/), NOTES);
    await dwellForDemo(page, 1200);

    await demoClick(page.getByRole('button', { name: /Submit for review/i }));

    // Beat 7: confetti + "Submission sent for review" toast. The money shot.
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
    await expect(page.getByText(/Submission sent for review/i)).toBeVisible();
    await dwellForDemo(page, 3200);

    // Beat 8: it's pending — nothing is awarded yet
    await page.getByRole('heading', { name: /Recent activity/i }).scrollIntoViewIfNeeded();
    await dwellForDemo(page, 2500);

    await signOut(page);
    await dwellForDemo(page, 1200);

    // ─────────── Act 2: the org ───────────

    await signIn(page, NGO_EMAIL, DEMO_PASSWORD);
    await dwellForDemo(page, 1800);

    // Beat 9: the submission is waiting in the org's review queue.
    // Scope to the review card — the task title also appears as a heading in
    // the "Your tasks" list further down the same page.
    await page.getByRole('heading', { name: /Awaiting your review/i }).scrollIntoViewIfNeeded();
    const reviewCard = page.getByRole('article').filter({ hasText: TASK_TITLE });
    await expect(reviewCard.getByRole('heading', { name: TASK_TITLE })).toBeVisible();
    await expect(reviewCard.getByText(/pharmacist/i)).toBeVisible();
    await dwellForDemo(page, 3000);

    // Beat 10: approve — this is what mints the badge
    await demoClick(reviewCard.getByRole('button', { name: /Approve/i }));
    await dwellForDemo(page, 3000);

    await signOut(page);
    await dwellForDemo(page, 1200);

    // ─────────── Act 3: the payoff ───────────

    await signIn(page, VOLUNTEER_EMAIL, DEMO_PASSWORD);
    await dwellForDemo(page, 2000);

    // Beat 11: the hero line now counts real work
    await expect(page.getByText(/1 task done/i)).toBeVisible();
    await dwellForDemo(page, 2500);

    // Beat 12: the locked tile is now earned. Closes the loop the whole demo
    // exists to show, so the tile has to actually be in frame — see Beat 1.
    const earnedBadge = page.getByText(BADGE_LABEL).first();
    await earnedBadge.scrollIntoViewIfNeeded();
    await expect(page.getByText(/1 earned/i)).toBeVisible();
    await expect(earnedBadge).toBeInViewport();
    await dwellForDemo(page, 3500);
  });
});
