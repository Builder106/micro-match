import { env } from '$env/dynamic/private';
import { isSupportedTranslationCode } from '$lib/translation';

type TranslateParams = {
  text: string;
  to: string;
};

type CacheEntry = {
  value: string;
  expiresAt: number;
};

const TRANSLATION_TIMEOUT_MS = 30_000;
const TRANSLATION_CACHE_TTL_MS = 15 * 60 * 1000;
const TRANSLATION_CACHE_MAX_ENTRIES = 500;
const cache = new Map<string, CacheEntry>();

function readCachedTranslation(key: string): string | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }

  cache.delete(key);
  cache.set(key, entry);
  return entry.value;
}

function cacheTranslation(key: string, value: string): void {
  if (cache.has(key)) cache.delete(key);
  while (cache.size >= TRANSLATION_CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) break;
    cache.delete(oldestKey);
  }
  cache.set(key, { value, expiresAt: Date.now() + TRANSLATION_CACHE_TTL_MS });
}

export async function translateTexts({ texts, to }: { texts: string[]; to: string }): Promise<string[]> {
  if (!texts.length || !isSupportedTranslationCode(to)) return texts;

  const endpoint = env.LIBRETRANSLATE_ENDPOINT?.replace(/\/+$/, '');
  const apiKey = env.LIBRETRANSLATE_API_KEY;
  if (!endpoint || !apiKey) return texts;

  const translations = [...texts];
  const missingIndexes: number[] = [];

  for (const [index, text] of texts.entries()) {
    if (!text) continue;
    const cached = readCachedTranslation(`${endpoint}::${to}::${text}`);
    if (cached === undefined) missingIndexes.push(index);
    else translations[index] = cached;
  }

  if (!missingIndexes.length) return translations;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TRANSLATION_TIMEOUT_MS);

  try {
    const response = await fetch(`${endpoint}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: missingIndexes.map((index) => texts[index]),
        source: 'auto',
        target: to,
        format: 'text',
        api_key: apiKey
      }),
      signal: controller.signal
    });

    if (!response.ok) return translations;

    const data: unknown = await response.json();
    const translated =
      typeof data === 'object' && data !== null && 'translatedText' in data
        ? data.translatedText
        : undefined;

    if (
      !Array.isArray(translated) ||
      translated.length !== missingIndexes.length ||
      translated.some((value) => typeof value !== 'string' || !value.trim())
    ) {
      return translations;
    }

    for (const [position, index] of missingIndexes.entries()) {
      const value = translated[position] as string;
      translations[index] = value;
      cacheTranslation(`${endpoint}::${to}::${texts[index]}`, value);
    }

    return translations;
  } catch {
    return translations;
  } finally {
    clearTimeout(timeout);
  }
}

export async function translateText({ text, to }: TranslateParams): Promise<string> {
  const [translated] = await translateTexts({ texts: [text], to });
  return translated;
}
