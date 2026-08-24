import { redirect } from '@sveltejs/kit';

export const locales = ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ar'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
export const localeCookie = 'mm_locale';

export function directionForLocale(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function localeFromPath(pathname: string): Locale | undefined {
  const segment = pathname.split('/')[1];
  return isLocale(segment) ? segment : undefined;
}

export function stripLocale(pathname: string): string {
  const locale = localeFromPath(pathname);
  if (!locale) return pathname || '/';
  const remainder = pathname.slice(locale.length + 1);
  return remainder ? `/${remainder}` : '/';
}

function languageFromHeader(header: string | null): Locale | undefined {
  if (!header) return undefined;
  for (const item of header.split(',')) {
    const language = item.trim().split(';')[0]?.toLowerCase().split('-')[0];
    if (isLocale(language)) return language;
  }
  return undefined;
}

export function negotiateLocale(request: Request, cookieLocale?: string): Locale {
  if (isLocale(cookieLocale)) return cookieLocale;
  return languageFromHeader(request.headers.get('accept-language')) ?? defaultLocale;
}

export function localeFromAcceptLanguage(header: string | null): Locale | undefined {
  if (!header) return undefined;
  for (const item of header.split(',')) {
    const language = item.trim().split(';')[0]?.toLowerCase().split('-')[0];
    if (isLocale(language)) return language;
  }
  return undefined;
}

export function localizedPath(pathname: string, locale: Locale): string {
  const path = stripLocale(pathname);
  return `/${locale}${path === '/' ? '' : path}`;
}

export function localizedHref(pathname: string, locale: Locale, search = ''): string {
  return `${localizedPath(pathname, locale)}${search}`;
}

export function redirectToLocale(url: URL, locale: Locale): never {
  throw redirect(308, localizedHref(url.pathname, locale, url.search));
}
