import { describe, it, expect } from 'vitest';
import { isSupportedTranslationCode, taskLang } from './translation';

describe('translation utilities', () => {
  describe('isSupportedTranslationCode', () => {
    it('returns true for supported language codes', () => {
      expect(isSupportedTranslationCode('es')).toBe(true);
      expect(isSupportedTranslationCode('fr')).toBe(true);
      expect(isSupportedTranslationCode('de')).toBe(true);
      expect(isSupportedTranslationCode('pt')).toBe(true);
      expect(isSupportedTranslationCode('zh')).toBe(true);
      expect(isSupportedTranslationCode('ar')).toBe(true);
      expect(isSupportedTranslationCode('en')).toBe(false);
    });

    it('returns false for unsupported or empty language codes', () => {
      expect(isSupportedTranslationCode('')).toBe(false);
      expect(isSupportedTranslationCode('ja')).toBe(false);
      expect(isSupportedTranslationCode('invalid')).toBe(false);
    });
  });

  describe('taskLang', () => {
    it('marks untranslated task text with the language it was written in', () => {
      expect(taskLang('Spanish')).toBe('es');
      expect(taskLang('Arabic', false)).toBe('ar');
    });
    it('leaves translated, unknown or missing languages alone', () => {
      expect(taskLang('Spanish', true)).toBeUndefined();
      expect(taskLang('Klingon')).toBeUndefined();
      expect(taskLang(undefined)).toBeUndefined();
    });
  });
});
