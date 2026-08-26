import { describe, it, expect } from 'vitest';
import {
  directionForLocale,
  isLocale,
  localeFromPath,
  stripLocale,
  negotiateLocale,
  localeFromAcceptLanguage,
  localizedPath,
  localizedHref,
  redirectToLocale,
  defaultLocale
} from '$lib/locale';

describe('locale utilities', () => {
  it('identifies text direction per locale', () => {
    expect(directionForLocale('ar')).toBe('rtl');
    expect(directionForLocale('en')).toBe('ltr');
    expect(directionForLocale('fr')).toBe('ltr');
  });

  it('validates locales', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('es')).toBe(true);
    expect(isLocale('ar')).toBe(true);
    expect(isLocale('invalid')).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it('extracts locale from pathname', () => {
    expect(localeFromPath('/es/tasks')).toBe('es');
    expect(localeFromPath('/ar/tasks/123')).toBe('ar');
    expect(localeFromPath('/tasks')).toBeUndefined();
    expect(localeFromPath('/')).toBeUndefined();
  });

  it('strips locale from pathname', () => {
    expect(stripLocale('/es/tasks')).toBe('/tasks');
    expect(stripLocale('/ar')).toBe('/');
    expect(stripLocale('/tasks')).toBe('/tasks');
    expect(stripLocale('')).toBe('/');
  });

  it('parses locale from accept-language header', () => {
    expect(localeFromAcceptLanguage(null)).toBeUndefined();
    expect(localeFromAcceptLanguage('fr-CH, fr;q=0.9, en;q=0.8')).toBe('fr');
    expect(localeFromAcceptLanguage('de-DE, de;q=0.9')).toBe('de');
    expect(localeFromAcceptLanguage('xx-YY, zz;q=0.9')).toBeUndefined();
  });

  it('negotiates locale from cookie or request header', () => {
    const req = new Request('http://localhost', {
      headers: { 'accept-language': 'pt-BR, pt;q=0.9' }
    });
    expect(negotiateLocale(req, 'es')).toBe('es');
    expect(negotiateLocale(req, 'invalid')).toBe('pt');
    expect(negotiateLocale(new Request('http://localhost'), undefined)).toBe(defaultLocale);
  });

  it('formats localized paths and hrefs', () => {
    expect(localizedPath('/tasks', 'es')).toBe('/es/tasks');
    expect(localizedPath('/es/tasks', 'fr')).toBe('/fr/tasks');
    expect(localizedPath('/', 'ar')).toBe('/ar');
    expect(localizedHref('/tasks', 'de', '?filter=urgent')).toBe('/de/tasks?filter=urgent');
  });

  it('throws a redirect on redirectToLocale', () => {
    const url = new URL('http://localhost/tasks?sort=date');
    expect(() => redirectToLocale(url, 'es')).toThrow();
  });
});
