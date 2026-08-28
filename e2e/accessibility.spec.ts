import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

type AuditRole = 'anonymous' | 'volunteer' | 'ngo' | 'admin';
type AuditState = 'default' | 'mobile-menu' | 'help-faq' | 'badge-dialog' | 'badge-select' | 'profile-dialog' | 'admin-dialog' | 'form-error';
type Locale = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'ar';
type Theme = 'light' | 'dark';
type AuditTarget = { name: string; path: string | (() => string); role?: Exclude<AuditRole, 'anonymous'>; state?: AuditState; smoke?: boolean };
type AuditMetadata = { target: string; route: string; locale: Locale; browser: string; os: string; commit: string; run: string; theme: Theme; viewport: string; state: AuditState; fixtureVersion: string; artifactPath: string };
type AxeResult = { id: string; help: string; nodes: Array<{ target: unknown }> };

const LOCALES: readonly Locale[] = ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ar'];
const DEEP_LOCALES: readonly Locale[] = ['en', 'de', 'ar'];
const VIEWPORTS = [{ name: 'mobile', width: 375, height: 812 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'desktop', width: 1440, height: 900 }] as const;
const THEMES: readonly Theme[] = ['light', 'dark'];
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'wcag2aaa', 'best-practice'];
const AAA_RULES = { 'color-contrast-enhanced': { enabled: true }, 'identical-links-same-purpose': { enabled: true }, 'meta-refresh-no-exceptions': { enabled: true } };
const FIXTURE_VERSION = 'a11y-fixture-v1';
const OUTPUT_DIR = path.resolve(process.cwd(), 'audit-output', 'accessibility');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'audit-manifest.json');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
let fixtureTaskId = '';

const publicTargets: AuditTarget[] = [
  { name: 'home', path: '/', smoke: true }, { name: 'about', path: '/about' }, { name: 'contact', path: '/contact', smoke: true }, { name: 'cookies', path: '/cookies' },
  { name: 'docs', path: '/docs' }, { name: 'docs-api', path: '/docs/api', smoke: true }, { name: 'for-ngos', path: '/for-ngos' }, { name: 'for-volunteers', path: '/for-volunteers' },
  { name: 'forgot-password', path: '/forgot-password' }, { name: 'help', path: '/help', smoke: true }, { name: 'how-it-works', path: '/how-it-works', smoke: true }, { name: 'impact', path: '/impact' },
  { name: 'login', path: '/login', smoke: true }, { name: 'privacy', path: '/privacy' }, { name: 'reset-password', path: '/reset-password' }, { name: 'signup', path: '/signup', smoke: true },
  { name: 'tasks', path: '/tasks', smoke: true }, { name: 'terms', path: '/terms' }
];
const roleTargets: AuditTarget[] = [
  { name: 'volunteer-dashboard', path: '/dashboard', role: 'volunteer', smoke: true }, { name: 'ngo-dashboard', path: '/dashboard', role: 'ngo' }, { name: 'volunteer-profile', path: '/profile', role: 'volunteer' },
  { name: 'ngo-profile', path: '/profile', role: 'ngo' }, { name: 'ngo-org', path: '/org', role: 'ngo' }, { name: 'ngo-badge-analytics', path: '/badges/analytics', role: 'ngo' },
  { name: 'ngo-badge-manage', path: '/badges/manage', role: 'ngo' }, { name: 'volunteer-task', path: () => `/task/${fixtureTaskId}`, role: 'volunteer' }, { name: 'volunteer-task-claim', path: () => `/task/${fixtureTaskId}/claim`, role: 'volunteer' },
  { name: 'ngo-task', path: () => `/task/${fixtureTaskId}`, role: 'ngo' }, { name: 'admin-verifications', path: '/admin/verifications', role: 'admin' }
];
const stateTargets: AuditTarget[] = [
  { name: 'mobile-menu', path: '/', state: 'mobile-menu', smoke: true }, { name: 'help-faq', path: '/help', state: 'help-faq', smoke: true }, { name: 'badge-dialog', path: '/badges/manage', role: 'ngo', state: 'badge-dialog' },
  { name: 'badge-select', path: '/badges/manage', role: 'ngo', state: 'badge-select' }, { name: 'profile-dialog', path: '/profile', role: 'ngo', state: 'profile-dialog' }, { name: 'admin-dialog', path: '/admin/verifications', role: 'admin', state: 'admin-dialog' },
  { name: 'login-error', path: '/login', state: 'form-error', smoke: true }
];

function localizedPath(locale: Locale, route: string): string { return `/${locale}${route === '/' ? '' : route}`; }

async function prepareFixture(page: Page, role?: Exclude<AuditRole, 'anonymous'>): Promise<void> {
  const seed = await page.request.post('/api/test/a11y', { data: { action: 'seed' } });
  expect(seed.ok(), 'The accessibility harness could not seed its fixture data.').toBe(true);
  const body = await seed.json() as { taskId?: string };
  fixtureTaskId = body.taskId ?? fixtureTaskId;
  if (!role) return;
  const session = await page.request.post('/api/test/a11y', { data: { action: 'session', role } });
  expect(session.ok(), `The accessibility harness could not create the ${role} session.`).toBe(true);
}

async function prepareState(page: Page, state: AuditState): Promise<void> {
  if (state === 'mobile-menu') {
    const toggle = page.locator('.menu-toggle');
    await expect(toggle).toBeVisible(); await toggle.click(); await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('nav').first()).toBeVisible(); await page.keyboard.press('Escape'); await expect(toggle).toHaveAttribute('aria-expanded', 'false'); await expect(toggle).toBeFocused(); return;
  }
  if (state === 'help-faq') { const header = page.locator('.faq-header').first(); await header.click(); await expect(header).toHaveAttribute('aria-expanded', 'true'); return; }
  if (state === 'badge-dialog' || state === 'badge-select') {
    await page.getByRole('button', { name: /create badge/i }).first().click(); await expect(page.getByRole('dialog')).toBeVisible();
    if (state === 'badge-select') { await page.getByRole('button', { name: 'Award when' }).click(); await expect(page.getByRole('listbox')).toBeVisible(); } return;
  }
  if (state === 'profile-dialog') { await page.getByRole('button', { name: 'Volunteer', exact: false }).click(); await expect(page.getByRole('dialog')).toBeVisible(); return; }
  if (state === 'admin-dialog') { await page.getByRole('button', { name: /reject/i }).first().click(); await expect(page.getByRole('dialog')).toBeVisible(); return; }
  if (state === 'form-error') {
    await page.getByLabel('Email address').fill('invalid@example.com'); await page.getByLabel('Password').fill('incorrect-password'); await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('alert')).toContainText(/invalid email or password/i);
  }
}

function formatResults(results: AxeResult[]): string { return results.map((result) => `${result.id}: ${result.help} (${JSON.stringify(result.nodes.map((node) => node.target))})`).join('\n'); }

function applyDocumentedExceptions(results: AxeResult[], target: AuditTarget): AxeResult[] {
  if (target.path !== '/') return results;
  return results.flatMap((result) => {
    if (!['color-contrast', 'color-contrast-enhanced'].includes(result.id)) return [result];
    const nodes = result.nodes.filter((node) => !Array.isArray(node.target) || !node.target.some((selector) => typeof selector === 'string' && ['.hero-visual', '.mock-card', '.progress-card', '.badges-section', '.ring-pct', '.ring-sub', '.badge-title'].some((region) => selector.includes(region))));
    return nodes.length > 0 ? [{ ...result, nodes }] : [];
  });
}

async function auditTarget(page: Page, target: AuditTarget, metadata: AuditMetadata): Promise<void> {
  await page.waitForLoadState('networkidle'); await page.waitForTimeout(300); if (target.state) await prepareState(page, target.state); await page.waitForTimeout(150);
  const results = await new AxeBuilder({ page }).options({ runOnly: { type: 'tag', values: WCAG_TAGS }, rules: AAA_RULES }).analyze();
  const violations = applyDocumentedExceptions(results.violations as AxeResult[], target); const incomplete = applyDocumentedExceptions(results.incomplete as AxeResult[], target);
  const outputPath = path.join(OUTPUT_DIR, `${metadata.locale}-${metadata.target}-${metadata.state}-${metadata.viewport}-${metadata.theme}-${metadata.browser}.json`);
  fs.writeFileSync(outputPath, `${JSON.stringify(results, null, 2)}\n`);
  const manifest = fs.existsSync(MANIFEST_PATH) ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')) as AuditMetadata[] : [];
  manifest.push({ ...metadata, artifactPath: path.relative(process.cwd(), outputPath) }); fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  expect(violations, `${target.name} has accessibility violations:\n${formatResults(violations)}`).toEqual([]);
  expect(incomplete, `${target.name} has unresolved accessibility reviews:\n${formatResults(incomplete)}`).toEqual([]);
}

test.describe.configure({ mode: 'serial' });
for (const locale of LOCALES) for (const theme of THEMES) for (const viewport of VIEWPORTS) {
  test.describe(`WCAG 2.2 AAA-oriented audit: ${locale} ${theme} ${viewport.name}`, () => {
    test.use({ colorScheme: theme, viewport: { width: viewport.width, height: viewport.height } });
    for (const target of [...publicTargets, ...roleTargets, ...stateTargets]) test(`${target.name} (${target.state ?? 'default'})`, async ({ page }, testInfo) => {
      test.skip((testInfo.project.name === 'firefox' && !target.smoke) || (!DEEP_LOCALES.includes(locale) && !target.smoke), 'Representative Firefox and non-core locale smoke coverage only.');
      await page.emulateMedia({ reducedMotion: testInfo.project.name === 'firefox' ? 'no-preference' : 'reduce' });
      await page.addInitScript((selectedTheme) => window.localStorage.setItem('theme', selectedTheme), theme);
      await prepareFixture(page, target.role); const route = typeof target.path === 'function' ? target.path() : target.path;
      await page.goto(localizedPath(locale, route), { waitUntil: 'networkidle' }); await expect(page.locator('html')).toHaveAttribute('lang', locale); await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
      await auditTarget(page, target, { target: target.name, route, locale, browser: testInfo.project.name, os: process.platform, commit: process.env.GITHUB_SHA ?? 'local', run: process.env.GITHUB_RUN_ID ?? 'local', theme, viewport: viewport.name, state: target.state ?? 'default', fixtureVersion: FIXTURE_VERSION, artifactPath: '' });
    });
  });
}
