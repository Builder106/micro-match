export type TranslationCode = '' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'ar';

const SUPPORTED_TRANSLATION_CODES = ['es', 'fr', 'de', 'pt', 'zh', 'ar'] as const;

const SUPPORTED_TRANSLATION_CODE_SET: ReadonlySet<string> = new Set(SUPPORTED_TRANSLATION_CODES);

export function isSupportedTranslationCode(value: string): value is Exclude<TranslationCode, ''> {
  return SUPPORTED_TRANSLATION_CODE_SET.has(value);
}

const LANGUAGE_CODES: Record<string, string> = {
  English: 'en',
  Spanish: 'es',
  French: 'fr',
  German: 'de',
  Portuguese: 'pt',
  Chinese: 'zh',
  Arabic: 'ar',
};

/**
 * The `lang` for task text a nonprofit wrote, while it is shown untranslated: the code of the
 * language the task says it is written in. Translated text is in the page's language already.
 */
export function taskLang(
  language: string | null | undefined,
  translated = false,
): string | undefined {
  return translated || !language ? undefined : LANGUAGE_CODES[language];
}
