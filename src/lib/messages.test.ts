import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { locales } from './locale';

// Every locale carries every English message, with the same {placeholders} and <tags>, so no
// page falls back to English or loses a link in translation.
const load = (locale: string) =>
  JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')) as Record<string, string>;
const shape = (text: string) => [...text.matchAll(/\{\w+\}|<\/?[a-z]+>/g)].map((m) => m[0]).sort();

describe('message catalogs', () => {
  const en = load('en');
  for (const locale of locales.filter((l) => l !== 'en')) {
    it(`${locale} matches English key for key`, () => {
      const catalog = load(locale);
      expect(Object.keys(catalog).sort()).toEqual(Object.keys(en).sort());
      for (const [key, text] of Object.entries(en)) {
        expect(shape(catalog[key]), key).toEqual(shape(text));
        expect(catalog[key].trim(), key).not.toBe('');
      }
    });
  }
});
