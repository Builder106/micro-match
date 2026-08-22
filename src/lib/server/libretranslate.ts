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

const TRANSLATION_TIMEOUT_MS = 10_000;
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

export async function translateText({ text, to }: TranslateParams): Promise<string> {
  if (!text || !isSupportedTranslationCode(to)) return text;

  const endpoint = env.LIBRETRANSLATE_ENDPOINT?.replace(/\/+$/, '');
  const apiKey = env.LIBRETRANSLATE_API_KEY;
  if (!endpoint || !apiKey) return text;

  const cacheKey = `${endpoint}::${to}::${text}`;
  const cached = readCachedTranslation(cacheKey);
  if (cached !== undefined) return cached;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TRANSLATION_TIMEOUT_MS);

  try {
    const response = await fetch(`${endpoint}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'auto',
        target: to,
        format: 'text',
        api_key: apiKey
      }),
      signal: controller.signal
    });

    if (!response.ok) return text;

    const data: unknown = await response.json();
    const translated =
      typeof data === 'object' && data !== null && 'translatedText' in data
        ? data.translatedText
        : undefined;

    if (typeof translated !== 'string' || !translated.trim()) return text;

    cacheTranslation(cacheKey, translated);
    return translated;
  } catch {
    return text;
  } finally {
    clearTimeout(timeout);
  }
}
