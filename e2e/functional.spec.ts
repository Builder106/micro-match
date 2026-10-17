import { expect, test, type Page, type Route } from '@playwright/test';
import { seedNonprofit, signInAs, type Seeded } from './harness';

// The real flows, end to end, against the in-memory store: browse and filter the feed, open
// a task, sign up and pick a role, sign in, claim a task with proof, a nonprofit approving
// it, and the badge and patch appearing.

test.describe.configure({ mode: 'serial' });

let seeded: Seeded;

test.beforeAll(async ({ browser }) => {
  seeded = await seedNonprofit(browser, 'flow', [
    { title: 'Translate a medical flyer into Spanish', minutes: 15, tags: ['translation', 'health'] },
    { title: 'Tag historical photos for an archive', minutes: 5, tags: ['data', 'history'] },
    { title: 'Proofread a plain-language climate explainer', minutes: 25, tags: ['environment'] }
  ]);
});

/** Stand in for Appwrite's browser API, which the test server does not have. */
async function fakeAppwrite(page: Page, { failSignIn = false } = {}) {
  const calls: { method: string; path: string; body: unknown }[] = [];
  await page.route('https://appwrite.test/**', async (route: Route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    calls.push({ method: req.method(), path, body: req.postDataJSON?.() ?? null });
    if (failSignIn && path.endsWith('/sessions/email')) return route.fulfill({ status: 401, json: { message: 'Invalid credentials', code: 401 } });
    if (path.endsWith('/jwts')) return route.fulfill({ status: 201, json: { jwt: 'e2e-jwt' } });
    return route.fulfill({ status: 201, json: { $id: 'e2e-user', email: 'e2e@example.test', name: 'E2E', prefs: {} } });
  });
  return calls;
}

test('browse the feed and filter it by time, search and tag', async ({ page }) => {
  await page.goto('/en/tasks');
  const cards = page.getByRole('region', { name: 'Open tasks' }).getByRole('article');
  await expect(cards).toHaveCount(3);

  await page.getByText('Up to 15 min', { exact: true }).click();
  await expect(cards).toHaveCount(2);
  await expect(page).toHaveURL(/max=15/);

  await page.getByRole('searchbox', { name: 'Search tasks' }).fill('photos');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Tag historical photos');

  await page.getByRole('button', { name: 'Clear filters' }).first().click();
  await page.getByRole('button', { name: /environment/ }).click();
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('25 min');
});

test('open a task and see the patch it becomes', async ({ page }) => {
  await page.goto('/en/tasks');
  await page.locator('[data-panel]').getByRole('link', { name: 'Translate a medical flyer into Spanish', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/en/task/${seeded.taskIds[0]}$`));
  await expect(page.getByRole('heading', { level: 1, name: 'Translate a medical flyer into Spanish' })).toBeVisible();
  await expect(page.getByText(`sewn in as a ${seeded.badge} patch`)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign in to claim' })).toHaveAttribute('href', new RegExp(`/en/login\\?next=/task/${seeded.taskIds[0]}/claim`));
});

test('sign up: the role comes first, then the account', async ({ page }) => {
  const calls = await fakeAppwrite(page);
  await page.goto('/en/signup');
  await expect(page.getByRole('heading', { level: 1, name: 'Which side of the quilt?' })).toBeVisible();
  await page.getByRole('button', { name: /I want to volunteer/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Join as a volunteer' })).toBeVisible();

  await page.getByLabel('First name').fill('Ada');
  await page.getByLabel('Email').fill('ada@example.test');
  await page.getByLabel('Password').fill('quilting-bee');
  await page.getByRole('button', { name: 'Create my account' }).click();

  await expect.poll(() => calls.find((c) => c.path.endsWith('/account/prefs'))?.body).toEqual({ prefs: { role: 'volunteer' } });
  expect(calls.find((c) => c.method === 'POST' && c.path.endsWith('/account'))?.body).toMatchObject({ email: 'ada@example.test', name: 'Ada' });
  // Without a real Appwrite the server cannot mint a session, so the dashboard sends us to sign in.
  await expect(page).toHaveURL(/\/en\/login/);
});

test('sign in sends the credentials, and a wrong password says so', async ({ page }) => {
  const calls = await fakeAppwrite(page, { failSignIn: true });
  await page.goto('/en/login?next=/tasks');
  await page.getByLabel('Email').fill('ada@example.test');
  await page.getByLabel('Password').fill('wrong');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toHaveText('That email and password do not match an account.');
  expect(calls.find((c) => c.path.endsWith('/sessions/email'))?.body).toEqual({ email: 'ada@example.test', password: 'wrong' });

  await page.unrouteAll();
  await fakeAppwrite(page);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/en\/tasks$/);
});

test('a volunteer claims a task and sends proof', async ({ page, context }) => {
  await signInAs(context, 'volunteer', 'flow');
  await page.goto(`/en/task/${seeded.taskIds[0]}/claim`);
  await expect(page.getByRole('heading', { level: 1, name: 'Send your work' })).toBeVisible();

  await page.getByRole('button', { name: 'Pin it for review' }).click();
  await expect(page.getByText('A full link starting with https:// or http://.')).toBeVisible();

  await page.getByLabel('Link to your work').fill('https://docs.example.org/flyer-es');
  await page.getByLabel(/A note for the reviewer/).fill('Kept the clinical terms exact.');
  await page.getByRole('button', { name: 'Pin it for review' }).click();

  await expect(page).toHaveURL(/\/en\/dashboard\?pinned=1/);
  await expect(page.getByRole('status').filter({ hasText: 'Your work is pinned' })).toBeVisible();
  await expect(page.locator('[data-panel]').getByRole('link', { name: 'Translate a medical flyer into Spanish', exact: true })).toBeVisible();
});

test('the nonprofit approves it, and the badge and patch appear', async ({ browser, page, context }) => {
  await signInAs(context, 'ngo', 'flow');
  await page.goto('/en/dashboard');
  const review = page.getByRole('listitem').filter({ hasText: 'Kept the clinical terms exact.' });
  await expect(review.getByRole('link', { name: 'Open their work' })).toHaveAttribute('href', 'https://docs.example.org/flyer-es');
  await review.getByRole('button', { name: 'Approve and sew in' }).click();
  await expect(review.getByRole('status')).toHaveText('Sewn in. 1 badge awarded.');

  const volunteer = await browser.newContext();
  await signInAs(volunteer, 'volunteer', 'flow');
  const badges = await (await volunteer.request.get('/api/badges')).json();
  expect(badges.map((b: { label: string }) => b.label)).toContain(seeded.badge);
  const vpage = await volunteer.newPage();
  await vpage.goto('/en/dashboard');
  const block = vpage.getByRole('group', { name: 'Your block, one patch' });
  await expect(block).toBeVisible();
  await expect(block.getByRole('button', { name: `${seeded.badge}, a 15 minute task` })).toBeVisible();
  // The same approval is also sewn into the community quilt behind the panel.
  await expect(vpage.getByRole('group', { name: 'The MicroMatch quilt, one patch' }).getByRole('button', { name: `${seeded.badge}, a 15 minute task` })).toBeAttached();
  await volunteer.close();

  await page.goto('/en');
  await expect(page.getByRole('group', { name: 'The MicroMatch quilt, one patch' })).toBeVisible();
});

test('a block unfolds into a panel and folds back into the quilt', async ({ page }) => {
  await page.goto('/en');
  await page.getByRole('link', { name: 'How a patch is made' }).click();
  await expect(page).toHaveURL(/\/en\/how-it-works$/);
  await expect(page.getByRole('heading', { level: 1, name: 'How a patch is made' })).toBeVisible();
  await expect(page.locator('[data-block="how"]')).toHaveClass(/is-open/);
  await page.getByRole('link', { name: 'Fold back' }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator('[data-block="how"]')).not.toHaveClass(/is-open/);
});
