import { describe, it, expect } from 'vitest';
import {
  directionForLocale,
  isLocale,
  localeFromPath,
  stripLocale,
  localeFromAcceptLanguage,
  negotiateLocale,
  localizedPath,
  localizedHref,
  redirectToLocale
} from './locale';

type RedirectError = {
  status: number;
  location: string;
};

function isRedirectError(error: unknown): error is RedirectError {
  if (typeof error !== 'object' || error === null) return false;
  return 'status' in error && typeof error.status === 'number' && 'location' in error && typeof error.location === 'string';
}

describe('locale utilities', () => {
  describe('directionForLocale', () => {
    it('returns rtl for arabic', () => {
      expect(directionForLocale('ar')).toBe('rtl');
    });
    it('returns ltr for english', () => {
      expect(directionForLocale('en')).toBe('ltr');
    });
  });

  describe('isLocale', () => {
    it('returns true for valid locales', () => {
      expect(isLocale('en')).toBe(true);
      expect(isLocale('es')).toBe(true);
    });
    it('returns false for invalid locales', () => {
      expect(isLocale('xx')).toBe(false);
      expect(isLocale(null)).toBe(false);
      expect(isLocale(undefined)).toBe(false);
    });
  });

  describe('localeFromPath', () => {
    it('extracts locale from path', () => {
      expect(localeFromPath('/en/foo')).toBe('en');
    });
    it('returns undefined if not locale', () => {
      expect(localeFromPath('/foo/bar')).toBe(undefined);
      expect(localeFromPath('/')).toBe(undefined);
    });
  });

  describe('stripLocale', () => {
    it('strips locale and keeps leading slash', () => {
      expect(stripLocale('/en/foo')).toBe('/foo');
      expect(stripLocale('/es')).toBe('/');
    });
    it('returns pathname if no locale', () => {
      expect(stripLocale('/foo')).toBe('/foo');
      expect(stripLocale('')).toBe('/');
    });
    it('returns remainder when does not start with slash', () => {
      expect(stripLocale('/en')).toBe('/');
    });
  });

  describe('localeFromAcceptLanguage', () => {
    it('returns undefined for empty header', () => {
      expect(localeFromAcceptLanguage(null)).toBe(undefined);
    });
    it('extracts primary language', () => {
      expect(localeFromAcceptLanguage('fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5')).toBe('fr');
      expect(localeFromAcceptLanguage('en-US,en;q=0.9')).toBe('en');
    });
    it('returns undefined if no matching language', () => {
      expect(localeFromAcceptLanguage('xx-YY,xx;q=0.9')).toBe(undefined);
    });
    it('returns language if perfect match', () => {
      expect(localeFromAcceptLanguage('en,es;q=0.9')).toBe('en');
    });
  });

  describe('negotiateLocale', () => {
    it('uses cookie locale if valid', () => {
      expect(negotiateLocale(new Request('http://localhost'), 'es')).toBe('es');
    });
    it('falls back to accept-language header', () => {
      expect(negotiateLocale(new Request('http://localhost', { headers: { 'accept-language': 'fr' } }))).toBe('fr');
    });
    it('falls back to default if everything else fails', () => {
      expect(negotiateLocale(new Request('http://localhost'))).toBe('en');
    });
  });

  describe('localizedPath', () => {
    it('adds locale to path', () => {
      expect(localizedPath('/foo', 'es')).toBe('/es/foo');
      expect(localizedPath('/', 'es')).toBe('/es');
    });
  });

  describe('localizedHref', () => {
    it('adds locale and search string', () => {
      expect(localizedHref('/foo', 'es', '?bar=1')).toBe('/es/foo?bar=1');
      expect(localizedHref('/', 'es')).toBe('/es');
    });
  });

  describe('redirectToLocale', () => {
    it('throws redirect', () => {
      let error: unknown;
      try {
        const url = new URL('http://localhost/foo?bar=1');
        redirectToLocale(url, 'es');
      } catch (e) {
        error = e;
      }
      if (!isRedirectError(error)) throw new Error('Expected redirectToLocale to throw a redirect.');
      expect(error.status).toBe(308);
      expect(error.location).toBe('/es/foo?bar=1');
    });
  });
});
