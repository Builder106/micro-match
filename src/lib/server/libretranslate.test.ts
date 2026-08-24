import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const { envState } = vi.hoisted(() => ({ envState: {} as Record<string, string | undefined> }));
vi.mock('$env/dynamic/private', () => ({
  env: new Proxy(envState, { get: (_, key: string) => envState[key] })
}));

import { translateText, translateTexts } from './libretranslate';

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
      json: async () => ({ translatedText: ['Hola mundo'] })
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
          q: ['Hello world unique-success'],
          source: 'auto',
          target: 'es',
          format: 'text',
          api_key: 'server-only-key'
        }),
        signal: expect.any(AbortSignal)
      })
    );
  });

  it('batches uncached task fields into one provider request', async () => {
    envState.LIBRETRANSLATE_ENDPOINT = 'https://translate.example.com';
    envState.LIBRETRANSLATE_API_KEY = 'server-only-key';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ translatedText: ['Título', 'Descripción', 'datos'] })
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      translateTexts({ texts: ['Title unique-batch', 'Description unique-batch', 'data unique-batch'], to: 'es' })
    ).resolves.toEqual(['Título', 'Descripción', 'datos']);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://translate.example.com/translate',
      expect.objectContaining({
        body: JSON.stringify({
          q: ['Title unique-batch', 'Description unique-batch', 'data unique-batch'],
          source: 'auto',
          target: 'es',
          format: 'text',
          api_key: 'server-only-key'
        })
      })
    );
  });

  it('caches successful translations by endpoint, locale, and text', async () => {
    envState.LIBRETRANSLATE_ENDPOINT = 'https://translate.example.com';
    envState.LIBRETRANSLATE_API_KEY = 'server-only-key';

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ translatedText: ['Bonjour unique-cache'] }) });
    vi.stubGlobal('fetch', fetchMock);

    const first = await translateText({ text: 'Hi unique-cache', to: 'fr' });
    const second = await translateText({ text: 'Hi unique-cache', to: 'fr' });

    expect(first).toBe('Bonjour unique-cache');
    expect(second).toBe('Bonjour unique-cache');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps a single cache entry when concurrent requests translate the same text', async () => {
    envState.LIBRETRANSLATE_ENDPOINT = 'https://translate.example.com';
    envState.LIBRETRANSLATE_API_KEY = 'server-only-key';

    let resolveFirst!: () => void;
    let resolveSecond!: () => void;
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => new Promise<Response>((resolve) => {
        resolveFirst = () => resolve({ ok: true, json: async () => ({ translatedText: ['Bonjour'] }) } as Response);
      }))
      .mockImplementationOnce(() => new Promise<Response>((resolve) => {
        resolveSecond = () => resolve({ ok: true, json: async () => ({ translatedText: ['Bonjour'] }) } as Response);
      }));
    vi.stubGlobal('fetch', fetchMock);

    const first = translateText({ text: 'Concurrent cache key', to: 'fr' });
    const second = translateText({ text: 'Concurrent cache key', to: 'fr' });
    resolveFirst();
    resolveSecond();

    await expect(Promise.all([first, second])).resolves.toEqual(['Bonjour', 'Bonjour']);
    await expect(translateText({ text: 'Concurrent cache key', to: 'fr' })).resolves.toBe('Bonjour');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('evicts expired cache entries and expires after TTL', async () => {
    envState.LIBRETRANSLATE_ENDPOINT = 'https://translate.example.com';
    envState.LIBRETRANSLATE_API_KEY = 'server-only-key';

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ translatedText: ['Bonjour expired'] }) });
    vi.stubGlobal('fetch', fetchMock);

    await translateText({ text: 'Hi expired-cache', to: 'fr' });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Fast-forward past TTL (15 minutes + 1 ms)
    const originalNow = Date.now;
    try {
      Date.now = () => originalNow() + 16 * 60 * 1000;
      await translateText({ text: 'Hi expired-cache', to: 'fr' });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      Date.now = originalNow;
    }
  });

  it('handles empty texts array and empty strings in texts', async () => {
    envState.LIBRETRANSLATE_ENDPOINT = 'https://translate.example.com';
    envState.LIBRETRANSLATE_API_KEY = 'server-only-key';

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ translatedText: ['Traducido'] }) });
    vi.stubGlobal('fetch', fetchMock);

    const emptyRes = await translateTexts({ texts: [], to: 'es' });
    expect(emptyRes).toEqual([]);

    const withEmpty = await translateTexts({ texts: ['', 'Hola'], to: 'es' });
    expect(withEmpty).toEqual(['', 'Traducido']);
  });

  it('evicts oldest entries when cache exceeds TRANSLATION_CACHE_MAX_ENTRIES (500)', async () => {
    envState.LIBRETRANSLATE_ENDPOINT = 'https://translate.example.com';
    envState.LIBRETRANSLATE_API_KEY = 'server-only-key';

    const fetchMock = vi.fn().mockImplementation(async (url, opts) => {
      const parsed = JSON.parse(opts.body);
      return {
        ok: true,
        json: async () => ({ translatedText: parsed.q.map((text: string) => `trans-${text}`) })
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    // Insert 505 unique translations to trigger the while loop eviction in cacheTranslation
    const largeBatch = Array.from({ length: 505 }, (_, i) => `item-${i}`);
    const results = await translateTexts({ texts: largeBatch, to: 'es' });
    expect(results).toHaveLength(505);
    expect(fetchMock).toHaveBeenCalled();
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
    await vi.advanceTimersByTimeAsync(30_000);

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
