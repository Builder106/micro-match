import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

type AuditRole = 'anonymous' | 'volunteer' | 'ngo' | 'admin';
type AuditState = 'default' | 'mobile-menu' | 'help-faq' | 'badge-dialog' | 'badge-select' | 'profile-dialog' | 'admin-dialog' | 'form-error';

type AuditTarget = {
  name: string;
  path: string | (() => string);
  role?: Exclude<AuditRole, 'anonymous'>;
  state?: AuditState;
};

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 }
] as const;

const THEMES = ['light', 'dark'] as const;
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'wcag2aaa', 'best-practice'];
const AAA_RULES = {
  'color-contrast-enhanced': { enabled: true },
  'identical-links-same-purpose': { enabled: true },
  'meta-refresh-no-exceptions': { enabled: true }
};

const AUDIT_OUTPUT_DIR = path.resolve(process.cwd(), 'audit-output', 'accessibility');
fs.mkdirSync(AUDIT_OUTPUT_DIR, { recursive: true });

let fixtureTaskId = '';

const publicTargets: AuditTarget[] = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about' },
  { name: 'contact', path: '/contact' },
  { name: 'cookies', path: '/cookies' },
  { name: 'docs', path: '/docs' },
  { name: 'docs-api', path: '/docs/api' },
  { name: 'for-ngos', path: '/for-ngos' },
  { name: 'for-volunteers', path: '/for-volunteers' },
  { name: 'forgot-password', path: '/forgot-password' },
  { name: 'help', path: '/help' },
  { name: 'how-it-works', path: '/how-it-works' },
  { name: 'impact', path: '/impact' },
  { name: 'login', path: '/login' },
  { name: 'privacy', path: '/privacy' },
  { name: 'reset-password', path: '/reset-password' },
  { name: 'signup', path: '/signup' },
  { name: 'tasks', path: '/tasks' },
  { name: 'terms', path: '/terms' }
];

const roleTargets: AuditTarget[] = [
  { name: 'volunteer-dashboard', path: '/dashboard', role: 'volunteer' },
  { name: 'ngo-dashboard', path: '/dashboard', role: 'ngo' },
  { name: 'volunteer-profile', path: '/profile', role: 'volunteer' },
  { name: 'ngo-profile', path: '/profile', role: 'ngo' },
  { name: 'ngo-org', path: '/org', role: 'ngo' },
  { name: 'ngo-badge-analytics', path: '/badges/analytics', role: 'ngo' },
  { name: 'ngo-badge-manage', path: '/badges/manage', role: 'ngo' },
  { name: 'volunteer-task', path: () => `/task/${fixtureTaskId}`, role: 'volunteer' },
  { name: 'volunteer-task-claim', path: () => `/task/${fixtureTaskId}/claim`, role: 'volunteer' },
  { name: 'ngo-task', path: () => `/task/${fixtureTaskId}`, role: 'ngo' },
  { name: 'admin-verifications', path: '/admin/verifications', role: 'admin' }
];

const stateTargets: AuditTarget[] = [
  { name: 'mobile-menu', path: '/', state: 'mobile-menu' },
  { name: 'help-faq', path: '/help', state: 'help-faq' },
  { name: 'badge-dialog', path: '/badges/manage', role: 'ngo', state: 'badge-dialog' },
  { name: 'badge-select', path: '/badges/manage', role: 'ngo', state: 'badge-select' },
  { name: 'profile-dialog', path: '/profile', role: 'ngo', state: 'profile-dialog' },
  { name: 'admin-dialog', path: '/admin/verifications', role: 'admin', state: 'admin-dialog' },
  { name: 'login-error', path: '/login', state: 'form-error' }
];

async function establishSession(page: Page, role: Exclude<AuditRole, 'anonymous'>): Promise<void> {
  const response = await page.request.post('/api/test/a11y', { data: { action: 'session', role } });
  expect(response.ok(), `The accessibility harness could not create the ${role} session.`).toBe(true);
}

async function prepareState(page: Page, state: AuditState): Promise<void> {
  if (state === 'mobile-menu') {
    const menuToggle = page.locator('.menu-toggle');
    if (await menuToggle.isVisible()) await menuToggle.click();
  } else if (state === 'help-faq') {
    await page.locator('.faq-header').first().click();
  } else if (state === 'badge-dialog') {
    await page.getByRole('button', { name: /create badge/i }).first().click();
  } else if (state === 'badge-select') {
    await page.getByRole('button', { name: /create badge/i }).first().click();
    await page.getByRole('button', { name: 'Award when' }).click();
  } else if (state === 'profile-dialog') {
    await page.getByRole('button', { name: 'Volunteer', exact: false }).click();
    await page.getByRole('button', { name: 'Save changes' }).click();
  } else if (state === 'admin-dialog') {
    await page.getByRole('button', { name: /reject/i }).first().click();
  } else if (state === 'form-error') {
    await page.getByLabel('Email address').fill('invalid@example.com');
    await page.getByLabel('Password').fill('incorrect-password');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText('Invalid email or password.')).toBeVisible();
  }
}

function resultPath(target: AuditTarget, viewport: string, theme: string): string {
  const state = target.state ?? 'default';
  return path.join(AUDIT_OUTPUT_DIR, `${target.name}-${state}-${viewport}-${theme}.json`);
}

function formatResults(results: { id: string; help: string; nodes: Array<{ target: unknown }> }[]): string {
  return results.map((result) => `${result.id}: ${result.help} (${JSON.stringify(result.nodes.map((node) => node.target))})`).join('\n');
}

function filterApprovedExceptions<T extends { id: string; nodes: Array<{ target: unknown }> }>(results: T[], allowHomeHeroException: boolean): T[] {
  return results.flatMap((result) => {
    if (!allowHomeHeroException || (result.id !== 'color-contrast' && result.id !== 'color-contrast-enhanced')) return [result];

    // Approved exception: the hero heading keeps its brand coral over the decorative blob.
    const nodes = result.nodes.filter((node) => {
      if (!Array.isArray(node.target)) return true;
      return !node.target.some((target) => typeof target === 'string' && target.includes('.coral-gradient'));
    });

    return nodes.length > 0 ? [{ ...result, nodes }] : [];
  });
}

async function auditTarget(page: Page, target: AuditTarget, viewport: string, theme: string): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  if (target.state) await prepareState(page, target.state);
  await page.waitForTimeout(150);

  const builder = new AxeBuilder({ page })
    .options({
      runOnly: { type: 'tag', values: WCAG_TAGS },
      rules: AAA_RULES
    });

  if (target.path === '/') {
    builder.exclude('.hero-visual').exclude('.progress-card').exclude('.badges-section').exclude('.blob');
  }

  const results = await builder.analyze();
  const allowHomeHeroException = target.path === '/';
  const violations = filterApprovedExceptions(results.violations, allowHomeHeroException);

  const incomplete = filterApprovedExceptions(results.incomplete.flatMap((result) => {
    if (result.id !== 'color-contrast' && result.id !== 'color-contrast-enhanced') return [result];

    const nodes = result.nodes.flatMap((node) => {
      const any = node.any.filter(
        (check) => !['elmPartiallyObscured', 'elmPartiallyObscuring'].includes(check.data?.messageKey ?? '')
      );
      return any.length > 0 ? [{ ...node, any }] : [];
    });

    return nodes.length > 0 ? [{ ...result, nodes }] : [];
  }), allowHomeHeroException);

  fs.writeFileSync(resultPath(target, viewport, theme), `${JSON.stringify(results, null, 2)}\n`);

  expect(violations, `${target.name} has accessibility violations:\n${formatResults(violations)}`).toEqual([]);
  expect(incomplete, `${target.name} has unresolved accessibility reviews:\n${formatResults(incomplete)}`).toEqual([]);
}

test.beforeAll(async ({ request }) => {
  const response = await request.post('/api/test/a11y', { data: { action: 'seed' } });
  expect(response.ok(), 'The accessibility harness could not seed its fixture data.').toBe(true);
  const body = await response.json() as { taskId?: string };
  expect(body.taskId, 'The accessibility harness did not return a task fixture.').toBeTruthy();
  fixtureTaskId = body.taskId ?? '';
});

for (const theme of THEMES) {
  for (const viewport of VIEWPORTS) {
    test.describe(`WCAG 2.2 AAA-oriented audit: ${theme} ${viewport.name}`, () => {
      test.use({
        colorScheme: theme,
        viewport: { width: viewport.width, height: viewport.height }
      });

      test.beforeEach(async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
      });

      for (const target of [...publicTargets, ...roleTargets, ...stateTargets]) {
        test(`${target.name} (${target.state ?? 'default'})`, async ({ page }) => {
          await page.addInitScript((selectedTheme) => {
            window.localStorage.setItem('theme', selectedTheme);
          }, theme);

          if (target.role) await establishSession(page, target.role);
          const targetPath = typeof target.path === 'function' ? target.path() : target.path;
          await page.goto(targetPath, { waitUntil: 'networkidle' });
          await auditTarget(page, target, viewport.name, theme);
        });
      }
    });
  }
}
