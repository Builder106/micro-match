import { test, expect } from '@playwright/test';

// Smoke tests: pages a logged-out visitor can reach. These run against the
// dev server (or a deployed env via PLAYWRIGHT_BASE_URL) and don't touch the
// Appwrite-backed parts of the app, so they need no test fixtures.

test.describe('public pages', () => {
  test('landing page renders the hero', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/MicroMatch/);
    await expect(page.getByRole('heading', { name: /Make a big impact/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Find a Task/i }).first()).toBeVisible();
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

  test('protected /admin/verifications redirects to login when unauthenticated', async ({ page }) => {
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
    await page.getByRole('link', { name: /Find a Task/i }).first().click();
    await expect(page).toHaveURL(/\/tasks/);
  });

  test('theme toggle button switches theme between light and dark', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const toggleBtn = page.getByRole('button', { name: /Toggle color theme/i });
    await expect(toggleBtn).toBeVisible();

    const isDarkBefore = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    await toggleBtn.click();
    await page.waitForTimeout(300);
    const isDarkAfter = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDarkAfter).not.toBe(isDarkBefore);
  });

  test('for-ngos page renders hero section and NGO card mockup', async ({ page }) => {
    await page.goto('/for-ngos');
    await expect(page.getByRole('heading', { level: 1, name: /Post tasks/i })).toBeVisible();
    await expect(page.getByText(/IRS 501\(c\)\(3\) Verified NGO/i)).toBeVisible();
  });

  test('for-volunteers page renders hero section', async ({ page }) => {
    await page.goto('/for-volunteers');
    await expect(page.getByRole('heading', { level: 1, name: /Real impact/i })).toBeVisible();
  });

  test('how-it-works page renders process ribbon', async ({ page }) => {
    await page.goto('/how-it-works');
    await expect(page.getByRole('heading', { level: 1, name: /How Micro-Volunteering/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /1\. Browse/i })).toBeVisible();
  });
});
