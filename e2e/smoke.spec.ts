import { test, expect } from './functional-fixtures';

// Smoke tests: pages and interactions a logged-out visitor can reach. The
// functional config provides local Appwrite fallbacks and browser fixtures so
// this gate does not depend on credentials or third-party network resources.

test.describe('public pages', () => {
  test('landing page renders the hero', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/MicroMatch/);
    await expect(page.getByRole('heading', { name: /Make a big impact/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Find a Task/i }).first()).toBeVisible();
  });

  test('homepage Lottie fallback stays static when reduced motion is preferred', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/en', { waitUntil: 'networkidle' });
    const animation = page.locator('.empty-mascot-icon .lottie-animation');
    await expect(animation).toBeVisible();
    await expect(animation).toHaveAttribute('data-lottie-ready', 'false');
  });

  test('homepage Lottie uses the local player in normal motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/en', { waitUntil: 'networkidle' });
    await expect(
      page.locator('.empty-mascot-icon .lottie-animation[data-lottie-ready="true"]'),
    ).toBeVisible();
  });

  test('landing page renders its impact progress section', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByRole('heading', { name: 'Track Your Impact' })).toBeVisible();
    await expect(page.locator('.progress-ring')).toBeVisible();
    await expect(page.getByText('Level 12 Volunteer', { exact: true })).toBeVisible();
  });

  test('feed page renders the search + filter chips', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page.getByPlaceholder(/Search tasks/i)).toBeVisible();
    // Time filter chips
    await expect(page.getByRole('button', { name: /≤ 15 min/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /≤ 20 min/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /≤ 30 min/ })).toBeVisible();
  });

  test('login page renders form + brand panel', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    await expect(page.getByPlaceholder(/jane@example\.com/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();
    // Forgot-password link present
    await expect(page.getByRole('link', { name: /Forgot password/i })).toBeVisible();
  });

  test('signup page shows the role picker first', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: /Choose your path/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /I'm a Volunteer/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /I represent an NGO/i })).toBeVisible();
  });

  test('signup → choose role → reveals email form', async ({ page }) => {
    // waitUntil: 'networkidle' ensures SvelteKit hydration + Iconify icon
    // fetches finish before we click — otherwise onclick handlers aren't
    // attached yet and the click hits inert SSR HTML.
    await page.goto('/signup', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /I'm a Volunteer/i }).click();
    await expect(page.getByRole('heading', { name: /Create your account/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'First name' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Last name' })).toBeVisible();
  });

  test('signup back-button returns to role picker', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /I'm a Volunteer/i }).click();
    await expect(page.getByRole('heading', { name: /Create your account/i })).toBeVisible();
    await page.getByRole('button', { name: /Back/i }).click();
    await expect(page.getByRole('heading', { name: /Choose your path/i })).toBeVisible();
  });

  test('forgot-password page renders the form', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: /Forgot password/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Send reset link/i })).toBeVisible();
  });

  test('protected /admin/verifications redirects to login when unauthenticated', async ({
    page,
  }) => {
    const response = await page.goto('/admin/verifications');
    // Either redirects to /login (303) or returns the login page
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/(login|admin)/);
  });

  test('protected /dashboard redirects to login when unauthenticated', async ({ page }) => {
    const response = await page.goto('/dashboard');
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/login/);
  });

  test('feed → click "Find a Task" CTA navigates to feed', async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('link', { name: /Find a Task/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/tasks/);
  });

  test('theme toggle button switches theme between light and dark', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const toggleBtn = page.getByRole('button', { name: /Toggle color theme/i });
    await expect(toggleBtn).toBeVisible();

    const isDarkBefore = await page.evaluate(() =>
      document.documentElement.classList.contains('dark'),
    );
    await toggleBtn.click();
    await page.waitForTimeout(300);
    const isDarkAfter = await page.evaluate(() =>
      document.documentElement.classList.contains('dark'),
    );
    expect(isDarkAfter).not.toBe(isDarkBefore);
  });

  test('for-ngos page renders its task-review hero scene', async ({ page }) => {
    await page.goto('/for-ngos');
    await expect(page.getByRole('heading', { level: 1, name: /Post tasks/i })).toBeVisible();
    await expect(page.locator('[data-motion-scene="ngo-document-review"]')).toBeAttached();
    await expect(
      page.locator('[data-motion-scene="ngo-document-review"] .lottie-animation'),
    ).toBeAttached();
    await expect(page.getByText('Task brief')).toBeVisible();
    await expect(page.getByText('Volunteer submission')).toBeVisible();
    await expect(page.getByText('NGO review')).toBeVisible();
  });

  test('for-ngos mission planner turns backlog into a transparent posting plan', async ({
    page,
  }) => {
    await page.goto('/for-ngos', { waitUntil: 'networkidle' });
    const plan = page.locator('.mission-plan');

    await expect(
      page.getByRole('heading', { name: /Plan a batch that volunteers can finish/i }),
    ).toBeVisible();
    await expect(plan.getByText('48', { exact: true })).toBeVisible();
    await expect(plan.getByText('12 on your busiest day', { exact: true })).toBeVisible();
    await expect(plan.getByText('2 hr 24 min to review', { exact: true })).toBeVisible();
    await expect(plan.getByText('Day 4', { exact: true })).toBeVisible();

    await page.getByRole('radio', { name: /30 minutes/i }).check();
    await expect(plan.getByText('24', { exact: true })).toBeVisible();
    await expect(plan.getByText('6 on your busiest day', { exact: true })).toBeVisible();
    await expect(plan.getByText('1 hr 12 min to review', { exact: true })).toBeVisible();

    await page.getByRole('radio', { name: '2 days' }).check();
    await expect(plan.getByText('12 on your busiest day', { exact: true })).toBeVisible();
    await expect(plan.getByText('Day 2', { exact: true })).toBeVisible();
    await expect(
      page.getByText('Based on 3 minutes for each completed mission.', { exact: true }),
    ).toBeVisible();
  });

  test('for-ngos mission planner stays within narrow viewports', async ({ page }) => {
    await page.goto('/for-ngos', { waitUntil: 'networkidle' });

    for (const width of [320, 375, 414, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.locator('.mission-plan')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    }
  });

  test('for-volunteers page renders its contribution hero scene', async ({ page }) => {
    await page.goto('/for-volunteers');
    await expect(page.getByRole('heading', { level: 1, name: /Real impact/i })).toBeVisible();
    await expect(page.locator('[data-motion-scene="volunteer-helping"]')).toBeAttached();
    await expect(
      page.locator('[data-motion-scene="volunteer-helping"] .lottie-animation'),
    ).toBeAttached();
    await expect(page.getByText('Sample task', { exact: true })).toBeVisible();
  });

  test('campaign Lottie scenes stay static when reduced motion is preferred', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/for-volunteers', { waitUntil: 'networkidle' });
    const scene = page.locator('[data-motion-scene="volunteer-helping"]');
    await expect(scene.locator('.static-fallback')).toBeVisible();
    await expect(scene.locator('.lottie-animation')).toHaveCount(0);
  });

  test('campaign Lottie scenes use the local player in normal motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/for-volunteers', { waitUntil: 'networkidle' });
    await expect(
      page.locator(
        '[data-motion-scene="volunteer-helping"] .lottie-animation[data-lottie-ready="true"]',
      ),
    ).toBeVisible();
  });

  test('for-volunteers time-cap tabs switch the local sample tasks', async ({ page }) => {
    await page.goto('/for-volunteers', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /5-Minute Quickies/i }).click();
    await expect(
      page.getByText('Tag 10 historical photos for digital archive', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText('Translate medical dosage flyer to Spanish', { exact: true }),
    ).toHaveCount(0);
  });

  test('how-it-works page renders process ribbon', async ({ page }) => {
    await page.goto('/how-it-works');
    await expect(
      page.getByRole('heading', { level: 1, name: /How Micro-Volunteering/i }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /1\. Browse/i })).toBeVisible();
  });

  test('terms of service page renders legal sections', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.getByRole('heading', { level: 1, name: /Terms of Service/i })).toBeVisible();
    await expect(page.getByText(/Educational & Non-Commercial Notice/i).first()).toBeVisible();
  });

  test('privacy policy page renders sub-processors and data policy', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1, name: /Privacy Policy/i })).toBeVisible();
    await expect(page.getByText(/Zero AI Model Training Guarantee/i)).toBeVisible();
  });
});
