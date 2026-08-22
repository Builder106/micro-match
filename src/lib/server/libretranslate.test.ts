import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const { envState } = vi.hoisted(() => ({ envState: {} as Record<string, string | undefined> }));
vi.mock('$env/dynamic/private', () => ({
  env: new Proxy(envState, { get: (_, key: string) => envState[key] })
}));

import { translateText } from './libretranslate';

describe('translateText', () => {
  beforeEach(() => {
    for (const key of Object.keys(envState)) delete envState[key];
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('returns the original text when the endpoint or API key is unset', async () => {
    envState.LIBRETRANSLATE_ENDPOINT = 'https://translate.example.com';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(translateText({ text: 'Hello world unique-missing-key', to: 'es' })).resolves.toBe(
      'Hello world unique-missing-key'
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls LibreTranslate with the server-side API key', async () => {
    envState.LIBRETRANSLATE_ENDPOINT = 'https://translate.example.com/';
    envState.LIBRETRANSLATE_API_KEY = 'server-only-key';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ translatedText: 'Hola mundo' })
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await translateText({ text: 'Hello world unique-success', to: 'es' });

    expect(result).toBe('Hola mundo');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://translate.example.com/translate',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: 'Hello world unique-success',
          source: 'auto',
          target: 'es',
          format: 'text',
          api_key: 'server-only-key'
        }),
        signal: expect.any(AbortSignal)
      })
    );
  });

  it('caches successful translations by endpoint, locale, and text', async () => {
    envState.LIBRETRANSLATE_ENDPOINT = 'https://translate.example.com';
    envState.LIBRETRANSLATE_API_KEY = 'server-only-key';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ translatedText: 'Bonjour unique-cache' })
    });
    vi.stubGlobal('fetch', fetchMock);

    const first = await translateText({ text: 'Hi unique-cache', to: 'fr' });
    const second = await translateText({ text: 'Hi unique-cache', to: 'fr' });

    expect(first).toBe('Bonjour unique-cache');
    expect(second).toBe('Bonjour unique-cache');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([403, 429, 500])('falls back to the original text for HTTP %s', async (status) => {
    envState.LIBRETRANSLATE_ENDPOINT = 'https://translate.example.com';
    envState.LIBRETRANSLATE_API_KEY = 'server-only-key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }));

    const text = `Fallback HTTP ${status} unique`;
    await expect(translateText({ text, to: 'de' })).resolves.toBe(text);
  });

  it('falls back when the request times out', async () => {
    envState.LIBRETRANSLATE_ENDPOINT = 'https://translate.example.com';
    envState.LIBRETRANSLATE_API_KEY = 'server-only-key';

    const fetchMock = vi.fn().mockImplementation((_url, options: RequestInit) => {
      return new Promise((_, reject) => {
        options.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers();

    const resultPromise = translateText({ text: 'Timeout me unique', to: 'de' });
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(resultPromise).resolves.toBe('Timeout me unique');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    { name: 'malformed response', response: { ok: true, json: async () => ({}) } },
    { name: 'empty response', response: { ok: true, json: async () => ({ translatedText: '  ' }) } }
  ])('falls back for a $name', async ({ response }) => {
    envState.LIBRETRANSLATE_ENDPOINT = 'https://translate.example.com';
    envState.LIBRETRANSLATE_API_KEY = 'server-only-key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

    const text = `Malformed unique ${response.ok}`;
    await expect(translateText({ text, to: 'de' })).resolves.toBe(text);
  });

  it('ignores unsupported target languages without calling the provider', async () => {
    envState.LIBRETRANSLATE_ENDPOINT = 'https://translate.example.com';
    envState.LIBRETRANSLATE_API_KEY = 'server-only-key';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const text = 'Unsupported target unique';
    await expect(translateText({ text, to: 'zh-Hans' })).resolves.toBe(text);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
