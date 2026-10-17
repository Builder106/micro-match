// Site map: which pages are public (smooth scroll and the motion engine) and which are app
// pages (native scroll), plus the navigation lists shared by the header and footer.
import { stripLocale, localizedHref, type Locale } from './locale';

export const PUBLIC_PATHS = [
  '/',
  '/how-it-works',
  '/for-nonprofits',
  '/for-volunteers',
  '/impact',
  '/about',
  '/contact',
  '/help',
  '/docs',
  '/docs/api',
  '/privacy',
  '/terms',
  '/cookies'
] as const;

const PUBLIC_SET: ReadonlySet<string> = new Set(PUBLIC_PATHS);

/** The path without its locale prefix and trailing slash. */
export function canonicalPath(pathname: string): string {
  const path = stripLocale(pathname);
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

/** Public pages run the motion engine; everything else scrolls natively. */
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_SET.has(canonicalPath(pathname));
}

/** True when `current` is `target` or a page inside it (used to mark the current nav item). */
export function isCurrent(current: string, target: string): boolean {
  const here = canonicalPath(current);
  if (target === '/') return here === '/';
  return here === target || here.startsWith(`${target}/`);
}

/** Internal href with the visitor's locale prefix. External and fragment links pass through. */
export function hrefFor(path: string, locale: Locale): string {
  if (/^(https?:|mailto:|#)/.test(path)) return path;
  const [pathname, search = ''] = path.split('?');
  return localizedHref(pathname, locale, search ? `?${search}` : '');
}

export type Role = 'anonymous' | 'user' | 'ngo' | 'volunteer';
export type NavItem = { href: string; label: string };

export const PUBLIC_NAV: NavItem[] = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/for-nonprofits', label: 'For nonprofits' },
  { href: '/for-volunteers', label: 'For volunteers' },
  { href: '/impact', label: 'The quilt' }
];

/** Links for a signed-in person, by role. */
export function appNav(role: Role, isAdmin: boolean): NavItem[] {
  const items: NavItem[] = [
    { href: '/dashboard', label: role === 'ngo' ? 'Reviews' : 'My block' },
    { href: '/tasks', label: 'Tasks' }
  ];
  if (role === 'ngo') {
    items.push({ href: '/org', label: 'Post a task' }, { href: '/badges/manage', label: 'Patches' });
  }
  if (isAdmin) items.push({ href: '/admin/verifications', label: 'Verifications' });
  items.push({ href: '/profile', label: 'Profile' });
  return items;
}

/** Same-origin path from a `next` query value, or the fallback (prevents open redirects). */
export function safeNext(raw: string | null | undefined, fallback = '/dashboard'): string {
  const value = raw ?? '';
  return value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}
