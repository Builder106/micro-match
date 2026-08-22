export const TRANSLATION_OPTIONS = [
  { code: '', label: 'Original' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ar', label: 'Arabic' }
] as const;

export type TranslationCode = (typeof TRANSLATION_OPTIONS)[number]['code'];

const SUPPORTED_TRANSLATION_CODES: ReadonlySet<string> = new Set(
  TRANSLATION_OPTIONS.map(({ code }) => code).filter(Boolean)
);

export function isSupportedTranslationCode(value: string): value is Exclude<TranslationCode, ''> {
  return SUPPORTED_TRANSLATION_CODES.has(value);
}
