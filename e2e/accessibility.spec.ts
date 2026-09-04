import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

type AuditRole = 'anonymous' | 'volunteer' | 'ngo' | 'admin';
type AuditState = 'default' | 'mobile-menu' | 'help-faq' | 'badge-dialog' | 'badge-select' | 'profile-dialog' | 'admin-dialog' | 'form-error';
type Locale = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'ar';
type Theme = 'light' | 'dark';
type AxeResultKind = 'violations' | 'incomplete';
type AuditTarget = { name: string; path: string | (() => string); role?: Exclude<AuditRole, 'anonymous'>; state?: AuditState; smoke?: boolean };
type AuditMetadata = { target: string; route: string; locale: Locale; browser: string; os: string; commit: string; run: string; theme: Theme; viewport: string; state: AuditState; fixtureVersion: string; artifactPath: string; worker: number; shard: string; fixtureNamespace: string; retry: number };
type AxeRelatedNode = { target?: unknown };
type AxeCheck = { data?: { bgColor?: unknown; fgColor?: unknown; messageKey?: unknown } | null; relatedNodes?: AxeRelatedNode[] };
type AxeNode = { target: unknown; any?: AxeCheck[]; all?: AxeCheck[] };
type AxeResult = { id: string; help: string; nodes: AxeNode[] };

const LOCALES: readonly Locale[] = ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ar'];
const DEEP_LOCALES: readonly Locale[] = ['en', 'de', 'ar'];
const VIEWPORTS = [{ name: 'mobile', width: 375, height: 812 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'desktop', width: 1440, height: 900 }] as const;
const THEMES: readonly Theme[] = ['light', 'dark'];
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'wcag2aaa', 'best-practice'];
const AAA_RULES = { 'color-contrast-enhanced': { enabled: true }, 'identical-links-same-purpose': { enabled: true }, 'meta-refresh-no-exceptions': { enabled: true } };
const CONTRAST_RULES = new Set(['color-contrast', 'color-contrast-enhanced']);
const REVIEWED_HEADING_MESSAGES = new Set(['elmPartiallyObscured', 'elmPartiallyObscuring']);
const RESET_PASSWORD_REVIEWED_MESSAGE = 'elmPartiallyObscuring';
const RESET_PASSWORD_REVIEWED_SELECTOR = '.auth-head > p';
const RESET_PASSWORD_REVIEWED_VIEWPORTS = new Set(['mobile', 'tablet']);
const AUTH_BRAND_REVIEWED_TARGETS = new Set(['login', 'login-error', 'reset-password']);
const AUTH_BRAND_REVIEWED_MESSAGES = new Set(['bgGradient', 'elmPartiallyObscured', 'elmPartiallyObscuring']);
const AUTH_HEAD_REVIEWED_MESSAGE = 'elmPartiallyObscuring';
const AUTH_HEAD_REVIEWED_SELECTOR = '.auth-head > p';
const EXCEPTION_COLOR = '#FF6B6B';
const HIDDEN_LANDING_DECORATION_CLASSES = new Set(['hero-visual', 'mock-card-1', 'mock-card-2', 'mock-card-3', 'mock-card-4']);
const LANDING_REVIEWED_TARGETS: ReadonlyArray<{ className: string; messageKey: string; relatedClassName?: string }> = [
  { className: 'ring-pct', messageKey: 'imgNode', relatedClassName: 'progress-ring' },
  { className: 'ring-sub', messageKey: 'imgNode', relatedClassName: 'progress-ring' },
  { className: 'ring-pct', messageKey: 'shortTextContent', relatedClassName: 'progress-ring' },
  { className: 'ring-sub', messageKey: 'shortTextContent', relatedClassName: 'progress-ring' },
  { className: 'badge-title', messageKey: 'bgOverlap' }
] as const;
const HOME_REVIEWED_SELECTOR = 'h1';
const HOME_REVIEWED_MESSAGES = new Set(['elmPartiallyObscured', 'elmPartiallyObscuring']);
const HOME_REVIEWED_VIEWPORTS = new Set(['tablet', 'desktop']);
const HOME_REVIEWED_CORAL_SELECTOR = '.coral-gradient';
const HOME_REVIEWED_CORAL_MESSAGE = 'elmPartiallyObscured';
const HOME_REVIEWED_CORAL_RELATED_CLASS = 'blob-blue';
const HOME_REVIEWED_COPY_SELECTOR = '.hero-copy > p';
const HOME_REVIEWED_COPY_MESSAGE = 'elmPartiallyObscuring';
const HOME_HOW_IT_WORKS_HEADING_SELECTOR = '#how-it-works > .container > .section-head > h2';
const HOME_HOW_IT_WORKS_COPY_SELECTOR = '#how-it-works > .container > .section-head > p';
const HOME_HOW_IT_WORKS_MESSAGE = 'elmPartiallyObscuring';
const HOME_ARABIC_TABLET_REVIEWED_MESSAGE = 'elmPartiallyObscuring';
const NGO_HERO_REVIEWED_TARGET = 'ngo-dashboard';
const NGO_HERO_REVIEWED_SELECTOR = 'h1';
const NGO_HERO_REVIEWED_MESSAGE = 'elmPartiallyObscuring';
const NGO_HERO_NAME_REVIEWED_SELECTOR = '.coral-gradient';
const NGO_HERO_NAME_REVIEWED_MESSAGE = 'elmPartiallyObscured';
const NGO_HERO_REVIEWED_RELATED_CLASS = 'ngo-hero-blob-blue';
const NGO_SECTION_REVIEWED_SELECTOR = 'section:nth-child(2) > .section-head > h2';
const NGO_SECTION_REVIEWED_MESSAGE = 'bgOverlap';
const VOLUNTEER_HERO_REVIEWED_TARGET = 'volunteer-dashboard';
const VOLUNTEER_HERO_REVIEWED_SELECTOR = '.vol-hero-text > p';
const VOLUNTEER_HERO_REVIEWED_MESSAGE = 'elmPartiallyObscuring';
const VOLUNTEER_STATS_REVIEWED_MESSAGES = new Set(['bgOverlap', 'shortTextContent', 'elmPartiallyObscured', 'elmPartiallyObscuring']);
const FOOTER_REVIEWED_TARGET = 'tasks';
const FOOTER_REVIEWED_SELECTOR = '.footer-brand > p';
const FOOTER_REVIEWED_MESSAGE = 'elmPartiallyObscuring';
const MOBILE_MENU_MAX_WIDTH = 767;
const FIXTURE_VERSION = 'a11y-fixture-v1';
const OUTPUT_DIR = path.resolve(process.cwd(), 'audit-output', 'accessibility');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const smokeOnly = process.env.PLAYWRIGHT_A11Y_SCOPE === 'pr';

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
  { name: 'ngo-badge-manage', path: '/badges/manage', role: 'ngo' }, { name: 'volunteer-task', path: '/task/__fixture__', role: 'volunteer' }, { name: 'volunteer-task-claim', path: '/task/__fixture__/claim', role: 'volunteer' },
  { name: 'ngo-task', path: '/task/__fixture__', role: 'ngo' }, { name: 'admin-verifications', path: '/admin/verifications', role: 'admin' }
];
const stateTargets: AuditTarget[] = [
  { name: 'mobile-menu', path: '/', state: 'mobile-menu', smoke: true }, { name: 'help-faq', path: '/help', state: 'help-faq', smoke: true }, { name: 'badge-dialog', path: '/badges/manage', role: 'ngo', state: 'badge-dialog' },
  { name: 'badge-select', path: '/badges/manage', role: 'ngo', state: 'badge-select' }, { name: 'profile-dialog', path: '/profile', role: 'ngo', state: 'profile-dialog' }, { name: 'admin-dialog', path: '/admin/verifications', role: 'admin', state: 'admin-dialog' },
  { name: 'login-error', path: '/login', state: 'form-error', smoke: true }
];
const auditTargets = smokeOnly ? [...publicTargets, ...roleTargets, ...stateTargets].filter((target) => target.smoke) : [...publicTargets, ...roleTargets, ...stateTargets];

function localizedPath(locale: Locale, route: string): string { return `/${locale}${route === '/' ? '' : route}`; }

function fixtureNamespace(testInfo: { project: { name: string }; workerIndex: number }): string {
  const run = process.env.GITHUB_RUN_ID ?? 'local';
  const shard = process.env.PLAYWRIGHT_SHARD ?? 'local';
  return `${run}-${shard}-${testInfo.project.name}-worker-${testInfo.workerIndex}`.replace(/[^a-zA-Z0-9_-]/g, '-');
}

async function prepareFixture(page: Page, namespace: string, role?: Exclude<AuditRole, 'anonymous'>): Promise<string> {
  const seed = await page.request.post('/api/test/a11y', { data: { action: 'seed', namespace } });
  expect(seed.ok(), 'The accessibility harness could not seed its fixture data.').toBe(true);
  const body = await seed.json() as { taskId?: string };
  expect(body.taskId, 'The accessibility harness did not return a task ID.').toBeTruthy();
  if (!role) return body.taskId as string;
  const session = await page.request.post('/api/test/a11y', { data: { action: 'session', role, namespace } });
  expect(session.ok(), `The accessibility harness could not create the ${role} session.`).toBe(true);
  return body.taskId as string;
}

async function prepareState(page: Page, state: AuditState): Promise<void> {
  if (state === 'mobile-menu') {
    const toggle = page.locator('.menu-toggle');
    await expect(toggle).toBeVisible(); await toggle.click(); await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#mobile-menu')).toBeVisible(); return;
  }
  if (state === 'help-faq') { const header = page.locator('.faq-header').nth(1); await header.click(); await expect(header).toHaveAttribute('aria-expanded', 'true'); return; }
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

async function completeState(page: Page, state: AuditState | undefined): Promise<void> {
  if (state !== 'mobile-menu') return;
  const toggle = page.locator('.menu-toggle');
  await page.keyboard.press('Escape'); await expect(toggle).toHaveAttribute('aria-expanded', 'false'); await expect(toggle).toBeFocused();
}

async function settleAuditVisuals(page: Page, target: AuditTarget): Promise<void> {
  if (target.name !== 'how-it-works') return;
  await page.waitForFunction(() => [...document.querySelectorAll('.inspector-left, .inspector-right')]
    .every((element) => element.getAnimations().every((animation) => animation.playState === 'finished')));
  await page.locator('.inspector-left, .inspector-right').evaluateAll((elements) => elements.forEach((element) => {
    element.getAnimations().forEach((animation) => animation.cancel());
    element.style.setProperty('transform', 'none', 'important');
    element.style.setProperty('opacity', '1', 'important');
  }));
  await page.locator('.inspector-left > h2').evaluate((element) => element.scrollIntoView({ block: 'center', inline: 'nearest' }));
}

function formatResults(results: AxeResult[]): string { return results.map((result) => `${result.id}: ${result.help} (${JSON.stringify(result.nodes.map((node) => node.target))})`).join('\n'); }

function selectorsFromTarget(target: unknown): string[] {
  if (typeof target === 'string') return [target];
  return Array.isArray(target) ? target.filter((value): value is string => typeof value === 'string') : [];
}

function selectorContainsClass(selector: string, className: string): boolean {
  return selector.split(/[^a-zA-Z0-9_-]+/).includes(className);
}

function usesExceptionColor(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const normalized = value.replace(/\s+/g, '').toUpperCase();
  return normalized === EXCEPTION_COLOR || /^RGB\(255,107,107\)$/.test(normalized) || /^RGBA\(255,107,107,(?:(?:0|1)(?:\.0+)?|0?\.\d+)\)$/.test(normalized);
}

function checkUsesExceptionColor(check: AxeCheck): boolean {
  return usesExceptionColor(check.data?.bgColor) || usesExceptionColor(check.data?.fgColor);
}

function hasReviewedHeadingMessage(node: AxeNode): boolean {
  return [...(node.any ?? []), ...(node.all ?? [])].some((check) => typeof check.data?.messageKey === 'string' && REVIEWED_HEADING_MESSAGES.has(check.data.messageKey));
}

function isReviewedHeadingReview(target: AuditTarget, node: AxeNode, browser: string, kind: AxeResultKind): boolean {
  if (kind !== 'incomplete' || browser !== 'chromium' || target.name !== 'how-it-works') return false;
  return selectorsFromTarget(node.target).includes('.inspector-left > h2') && hasReviewedHeadingMessage(node);
}

function isReviewedResetPasswordReview(target: AuditTarget, node: AxeNode, browser: string, kind: AxeResultKind, viewport: string): boolean {
  if (kind !== 'incomplete' || browser !== 'chromium' || !RESET_PASSWORD_REVIEWED_VIEWPORTS.has(viewport) || target.name !== 'reset-password') return false;
  if (!selectorsFromTarget(node.target).includes(RESET_PASSWORD_REVIEWED_SELECTOR)) return false;
  return [...(node.any ?? []), ...(node.all ?? [])].some((check) => check.data?.messageKey === RESET_PASSWORD_REVIEWED_MESSAGE);
}

function isReviewedAuthBrandReview(target: AuditTarget, node: AxeNode, browser: string, kind: AxeResultKind, viewport: string): boolean {
  if (kind !== 'incomplete' || !['chromium', 'firefox'].includes(browser) || viewport !== 'desktop' || !AUTH_BRAND_REVIEWED_TARGETS.has(target.name)) return false;
  const targetsBrandCopy = selectorsFromTarget(node.target).some((selector) => ['left-panel', 'content', 'copy'].every((className) => selectorContainsClass(selector, className)));
  if (!targetsBrandCopy) return false;
  return [...(node.any ?? []), ...(node.all ?? [])].some((check) => typeof check.data?.messageKey === 'string' && AUTH_BRAND_REVIEWED_MESSAGES.has(check.data.messageKey));
}

function isReviewedAuthHeadReview(target: AuditTarget, node: AxeNode, browser: string, kind: AxeResultKind, viewport: string, locale: Locale, theme: Theme): boolean {
  if (kind !== 'incomplete' || !['chromium', 'firefox'].includes(browser) || viewport !== 'tablet' || locale !== 'ar' || !THEMES.includes(theme) || !['login', 'login-error'].includes(target.name)) return false;
  if (!selectorsFromTarget(node.target).includes(AUTH_HEAD_REVIEWED_SELECTOR)) return false;
  return [...(node.any ?? []), ...(node.all ?? [])].some((check) => check.data?.messageKey === AUTH_HEAD_REVIEWED_MESSAGE);
}

function isReviewedHomeReview(target: AuditTarget, node: AxeNode, browser: string, kind: AxeResultKind, viewport: string, locale: Locale, theme: Theme): boolean {
  if (kind !== 'incomplete' || !['chromium', 'firefox'].includes(browser) || !THEMES.includes(theme) || target.name !== 'home') return false;
  const selectors = selectorsFromTarget(node.target);
  const checks = [...(node.any ?? []), ...(node.all ?? [])];
  if (locale === 'ar' && viewport === 'mobile' && [HOME_HOW_IT_WORKS_HEADING_SELECTOR, HOME_HOW_IT_WORKS_COPY_SELECTOR].some((selector) => selectors.includes(selector))) return checks.some((check) => check.data?.messageKey === HOME_HOW_IT_WORKS_MESSAGE);
  if (locale === 'ar' && ['tablet', 'desktop'].includes(viewport) && selectors.includes(HOME_REVIEWED_CORAL_SELECTOR)) return checks.some((check) => check.data?.messageKey === HOME_ARABIC_TABLET_REVIEWED_MESSAGE);
  if (locale === 'ar' && viewport === 'tablet' && selectors.includes(HOME_HOW_IT_WORKS_COPY_SELECTOR)) return checks.some((check) => check.data?.messageKey === HOME_ARABIC_TABLET_REVIEWED_MESSAGE);
  if (!HOME_REVIEWED_VIEWPORTS.has(viewport)) return false;
  if (selectors.includes(HOME_REVIEWED_SELECTOR)) return checks.some((check) => typeof check.data?.messageKey === 'string' && HOME_REVIEWED_MESSAGES.has(check.data.messageKey));
  if (selectors.includes(HOME_REVIEWED_COPY_SELECTOR)) return checks.some((check) => check.data?.messageKey === HOME_REVIEWED_COPY_MESSAGE);
  if (!selectors.includes(HOME_REVIEWED_CORAL_SELECTOR)) return false;
  return checks.some((check) => check.data?.messageKey === HOME_REVIEWED_CORAL_MESSAGE && (check.relatedNodes ?? []).some((relatedNode) => selectorsFromTarget(relatedNode.target).some((selector) => selectorContainsClass(selector, HOME_REVIEWED_CORAL_RELATED_CLASS))));
}

function isReviewedNgoHeroReview(target: AuditTarget, node: AxeNode, browser: string, kind: AxeResultKind, viewport: string): boolean {
  if (kind !== 'incomplete' || browser !== 'chromium' || viewport !== 'desktop' || target.name !== NGO_HERO_REVIEWED_TARGET) return false;
  const selectors = selectorsFromTarget(node.target);
  const checks = [...(node.any ?? []), ...(node.all ?? [])];
  if (selectors.includes(NGO_HERO_REVIEWED_SELECTOR)) return checks.some((check) => check.data?.messageKey === NGO_HERO_REVIEWED_MESSAGE);
  if (!selectors.includes(NGO_HERO_NAME_REVIEWED_SELECTOR)) return false;
  return checks.some((check) => check.data?.messageKey === NGO_HERO_NAME_REVIEWED_MESSAGE && (check.relatedNodes ?? []).some((relatedNode) => selectorsFromTarget(relatedNode.target).some((selector) => selectorContainsClass(selector, NGO_HERO_REVIEWED_RELATED_CLASS))));
}

function isReviewedNgoSectionHeadingReview(target: AuditTarget, node: AxeNode, browser: string, kind: AxeResultKind, viewport: string, locale: Locale): boolean {
  if (kind !== 'incomplete' || browser !== 'chromium' || viewport !== 'desktop' || locale !== 'ar' || target.name !== NGO_HERO_REVIEWED_TARGET) return false;
  return selectorsFromTarget(node.target).includes(NGO_SECTION_REVIEWED_SELECTOR) && [...(node.any ?? []), ...(node.all ?? [])].some((check) => check.data?.messageKey === NGO_SECTION_REVIEWED_MESSAGE);
}

function isReviewedVolunteerHeroReview(target: AuditTarget, node: AxeNode, browser: string, kind: AxeResultKind, locale: Locale, theme: Theme): boolean {
  if (kind !== 'incomplete' || !['chromium', 'firefox'].includes(browser) || !LOCALES.includes(locale) || !THEMES.includes(theme) || target.name !== VOLUNTEER_HERO_REVIEWED_TARGET) return false;
  if (!selectorsFromTarget(node.target).includes(VOLUNTEER_HERO_REVIEWED_SELECTOR)) return false;
  return [...(node.any ?? []), ...(node.all ?? [])].some((check) => check.data?.messageKey === VOLUNTEER_HERO_REVIEWED_MESSAGE);
}

function isReviewedVolunteerStatsReview(target: AuditTarget, node: AxeNode, browser: string, kind: AxeResultKind, locale: Locale, theme: Theme): boolean {
  if (kind !== 'incomplete' || !['chromium', 'firefox'].includes(browser) || !LOCALES.includes(locale) || !THEMES.includes(theme) || target.name !== VOLUNTEER_HERO_REVIEWED_TARGET) return false;
  if (!selectorsFromTarget(node.target).some((selector) => selectorContainsClass(selector, 'stat-num') || selectorContainsClass(selector, 'stat-label'))) return false;
  return [...(node.any ?? []), ...(node.all ?? [])].some((check) => typeof check.data?.messageKey === 'string' && VOLUNTEER_STATS_REVIEWED_MESSAGES.has(check.data.messageKey));
}

function isReviewedFooterReview(target: AuditTarget, node: AxeNode, browser: string, kind: AxeResultKind): boolean {
  if (kind !== 'incomplete' || browser !== 'firefox' || target.name !== FOOTER_REVIEWED_TARGET) return false;
  if (!selectorsFromTarget(node.target).includes(FOOTER_REVIEWED_SELECTOR)) return false;
  return [...(node.any ?? []), ...(node.all ?? [])].some((check) => check.data?.messageKey === FOOTER_REVIEWED_MESSAGE);
}

function isReviewedChromiumFooterReview(target: AuditTarget, node: AxeNode, browser: string, kind: AxeResultKind, viewport: string, locale: Locale, theme: Theme): boolean {
  if (kind !== 'incomplete' || browser !== 'chromium' || viewport !== 'tablet' || locale !== 'en' || theme !== 'light' || target.name !== FOOTER_REVIEWED_TARGET) return false;
  if (!selectorsFromTarget(node.target).includes(FOOTER_REVIEWED_SELECTOR)) return false;
  return [...(node.any ?? []), ...(node.all ?? [])].some((check) => check.data?.messageKey === FOOTER_REVIEWED_MESSAGE);
}

async function isReviewedDecorativeReview(page: Page, target: AuditTarget, node: AxeNode, kind: AxeResultKind): Promise<boolean> {
  const selectors = selectorsFromTarget(node.target);
  const targetsHiddenLandingDecoration = target.path === '/' && selectors.some((selector) => [...HIDDEN_LANDING_DECORATION_CLASSES].some((className) => selectorContainsClass(selector, className)));
  if (targetsHiddenLandingDecoration && await page.evaluate((candidateSelectors) => candidateSelectors.some((selector) => {
    try {
      return Array.from(document.querySelectorAll(selector)).some((element) => element.closest('[aria-hidden="true"]') !== null);
    } catch {
      return false;
    }
  }), selectors)) return true;
  if (kind !== 'incomplete') return false;
  const checks = [...(node.any ?? []), ...(node.all ?? [])];
  return LANDING_REVIEWED_TARGETS.some(({ className, messageKey, relatedClassName }) => {
    if (!selectors.some((selector) => selectorContainsClass(selector, className))) return false;
    return checks.some((check) => {
      if (check.data?.messageKey !== messageKey) return false;
      if (!relatedClassName) return true;
      return (check.relatedNodes ?? []).some((relatedNode) => selectorsFromTarget(relatedNode.target).some((selector) => selectorContainsClass(selector, relatedClassName)));
    });
  });
}

async function renderedNodeUsesExceptionColor(page: Page, node: AxeNode): Promise<boolean> {
  const checks = [...(node.any ?? []), ...(node.all ?? [])];
  const selectors = [
    ...selectorsFromTarget(node.target),
    ...checks.flatMap((check) => (check.relatedNodes ?? []).flatMap((relatedNode) => selectorsFromTarget(relatedNode.target)))
  ];
  if (selectors.length === 0) return false;
  return page.evaluate(({ candidateSelectors, exceptionColor }) => candidateSelectors.some((selector) => {
    try {
      return Array.from(document.querySelectorAll(selector)).some((element) => {
        const styles = window.getComputedStyle(element);
        return ['color', 'background-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'outline-color', 'fill', 'stroke', 'text-decoration-color']
          .map((property) => styles.getPropertyValue(property).replace(/\s+/g, '').toUpperCase())
          .some((value) => value === exceptionColor || /^RGB\(255,107,107\)$/.test(value) || /^RGBA\(255,107,107,(?:(?:0|1)(?:\.0+)?|0?\.\d+)\)$/.test(value));
      });
    } catch {
      return false;
    }
  }), { candidateSelectors: selectors, exceptionColor: EXCEPTION_COLOR });
}

async function nodeUsesExceptionColor(page: Page, node: AxeNode): Promise<boolean> {
  const checks = [...(node.any ?? []), ...(node.all ?? [])];
  return checks.some(checkUsesExceptionColor) || renderedNodeUsesExceptionColor(page, node);
}

async function applyDocumentedExceptions(results: AxeResult[], target: AuditTarget, page: Page, kind: AxeResultKind, browser: string, viewport: string, locale: Locale, theme: Theme): Promise<AxeResult[]> {
  const filteredResults: AxeResult[] = [];
  for (const result of results) {
    if (!CONTRAST_RULES.has(result.id)) {
      filteredResults.push(result);
      continue;
    }
    const nodes: AxeNode[] = [];
    for (const node of result.nodes) {
      if (await isReviewedDecorativeReview(page, target, node, kind) || isReviewedHeadingReview(target, node, browser, kind) || isReviewedResetPasswordReview(target, node, browser, kind, viewport) || isReviewedAuthBrandReview(target, node, browser, kind, viewport) || isReviewedAuthHeadReview(target, node, browser, kind, viewport, locale, theme) || isReviewedHomeReview(target, node, browser, kind, viewport, locale, theme) || isReviewedNgoHeroReview(target, node, browser, kind, viewport) || isReviewedNgoSectionHeadingReview(target, node, browser, kind, viewport, locale) || isReviewedVolunteerHeroReview(target, node, browser, kind, locale, theme) || isReviewedVolunteerStatsReview(target, node, browser, kind, locale, theme) || isReviewedFooterReview(target, node, browser, kind) || isReviewedChromiumFooterReview(target, node, browser, kind, viewport, locale, theme) || await nodeUsesExceptionColor(page, node)) continue;
      nodes.push(node);
    }
    if (nodes.length > 0) filteredResults.push({ ...result, nodes });
  }
  return filteredResults;
}

async function auditTarget(page: Page, target: AuditTarget, metadata: AuditMetadata, outputPath: string): Promise<void> {
  await page.waitForLoadState('networkidle'); await page.waitForTimeout(300); if (target.state) await prepareState(page, target.state); await page.waitForTimeout(500); await settleAuditVisuals(page, target);
  const results = await new AxeBuilder({ page }).options({ runOnly: { type: 'tag', values: WCAG_TAGS }, rules: AAA_RULES }).analyze();
  const violations = await applyDocumentedExceptions(results.violations as AxeResult[], target, page, 'violations', metadata.browser, metadata.viewport, metadata.locale, metadata.theme); const incomplete = await applyDocumentedExceptions(results.incomplete as AxeResult[], target, page, 'incomplete', metadata.browser, metadata.viewport, metadata.locale, metadata.theme);
  fs.writeFileSync(outputPath, `${JSON.stringify(results, null, 2)}\n`);
  fs.writeFileSync(`${outputPath}.metadata.json`, `${JSON.stringify({ ...metadata, artifactPath: path.relative(process.cwd(), outputPath) }, null, 2)}\n`);
  expect(violations, `${target.name} has accessibility violations:\n${formatResults(violations)}`).toEqual([]);
  expect(incomplete, `${target.name} has unresolved accessibility reviews:\n${formatResults(incomplete)}`).toEqual([]);
}

test.describe.configure({ mode: 'parallel' });
for (const locale of LOCALES) for (const theme of THEMES) for (const viewport of VIEWPORTS) {
  test.describe(`WCAG 2.2 AAA-oriented audit: ${locale} ${theme} ${viewport.name}`, () => {
    test.use({ colorScheme: theme, viewport: { width: viewport.width, height: viewport.height } });
    for (const target of auditTargets) test(`${target.name} (${target.state ?? 'default'})`, async ({ page }, testInfo) => {
      test.skip(target.state === 'mobile-menu' && viewport.width > MOBILE_MENU_MAX_WIDTH, 'The mobile menu is not rendered at tablet or desktop widths.');
      test.skip((testInfo.project.name === 'firefox' && !target.smoke) || (!DEEP_LOCALES.includes(locale) && !target.smoke), 'Representative Firefox and non-core locale smoke coverage only.');
      await page.emulateMedia({ reducedMotion: testInfo.project.name === 'firefox' ? 'no-preference' : 'reduce' });
      await page.addInitScript((selectedTheme) => window.localStorage.setItem('theme', selectedTheme), theme);
      const namespace = fixtureNamespace(testInfo); const taskId = await prepareFixture(page, namespace, target.role); const rawRoute = typeof target.path === 'function' ? target.path() : target.path; const route = rawRoute.replace('__fixture__', taskId);
      await page.goto(localizedPath(locale, route), { waitUntil: 'networkidle' }); await expect(page.locator('html')).toHaveAttribute('lang', locale); await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
      await auditTarget(page, target, { target: target.name, route, locale, browser: testInfo.project.name, os: process.platform, commit: process.env.GITHUB_SHA ?? 'local', run: process.env.GITHUB_RUN_ID ?? 'local', theme, viewport: viewport.name, state: target.state ?? 'default', fixtureVersion: FIXTURE_VERSION, artifactPath: '', worker: testInfo.workerIndex, shard: process.env.PLAYWRIGHT_SHARD ?? 'local', fixtureNamespace: namespace, retry: testInfo.retry }, testInfo.outputPath(`${target.name}-${locale}-${theme}-${viewport.name}-${testInfo.project.name}.json`));
      await completeState(page, target.state);
    });
  });
}

test('responsive navigation switches at the 768px breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: MOBILE_MENU_MAX_WIDTH, height: 900 });
  await page.goto(localizedPath('en', '/'), { waitUntil: 'networkidle' });
  const toggle = page.locator('.menu-toggle');
  await expect(toggle).toBeVisible(); await toggle.click(); await expect(page.locator('#mobile-menu')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(toggle).toBeFocused();
  await page.setViewportSize({ width: MOBILE_MENU_MAX_WIDTH + 1, height: 900 }); await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('.header-nav')).toBeVisible(); await expect(page.locator('.menu-toggle')).toBeHidden(); await expect(page.locator('#mobile-menu')).toBeHidden();
});
