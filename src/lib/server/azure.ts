// LibreTranslate helper with in-memory cache and safe fallbacks.
// Replaces Azure Translator — uses self-hosted LibreTranslate on Oracle VM via Cloudflare Tunnel.

import { env } from '$env/dynamic/private';

type TranslateParams = {
  text: string;
  to: string; // target locale, e.g., 'es'
};

const cache = new Map<string, string>();

export async function translateText({ text, to }: TranslateParams): Promise<string> {
  const key = `${to}::${text}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const endpoint = env.LIBRETRANSLATE_ENDPOINT; // e.g., https://charge-positions-spice-creature.trycloudflare.com

  if (!endpoint) {
    // Fallback: return original text when not configured
    cache.set(key, text);
    return text;
  }

  try {
    // LibreTranslate API format
    const res = await fetch(`${endpoint}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: 'auto', // auto-detect source language
        target: to,
        format: 'text'
      })
    });

    if (!res.ok) throw new Error(`Translate failed: ${res.status}`);
    const data = await res.json();
    const translated = data?.translatedText ?? text;
    cache.set(key, translated);
    return translated;
  } catch {
    // Graceful fallback
    cache.set(key, text);
    return text;
  }
}