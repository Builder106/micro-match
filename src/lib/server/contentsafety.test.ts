import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const { envState } = vi.hoisted(() => ({ envState: {} as Record<string, string | undefined> }));
vi.mock('$env/dynamic/private', () => ({
  env: new Proxy(envState, { get: (_, key: string) => envState[key] })
}));

import { moderateText } from './contentsafety';

describe('moderateText', () => {
  beforeEach(() => {
    for (const key of Object.keys(envState)) delete envState[key];
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('treats empty or whitespace-only text as safe without calling the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    expect(await moderateText('')).toEqual({ blocked: false, reasons: [] });
    expect(await moderateText('   ')).toEqual({ blocked: false, reasons: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails open (not blocked) when Content Safety env vars are unset', async () => {
    const result = await moderateText('some text');
    expect(result).toEqual({ blocked: false, reasons: [] });
  });

  it('calls the endpoint and reports blocked=true when a category hits medium+ severity', async () => {
    envState.AZURE_CONTENT_SAFETY_ENDPOINT = 'https://safety.example.com';
    envState.AZURE_CONTENT_SAFETY_KEY = 'fake-key';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        categoriesAnalysis: [
          { category: 'Hate', severity: 6 },
          { category: 'Violence', severity: 0 }
        ]
      })
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await moderateText('nasty text');

    expect(result.blocked).toBe(true);
    expect(result.reasons).toEqual([
      { category: 'Hate', severity: 6 },
      { category: 'Violence', severity: 0 }
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/contentsafety/text:analyze?api-version='),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Ocp-Apim-Subscription-Key': 'fake-key' })
      })
    );
  });

  it('reports blocked=false when every category is below the severity threshold', async () => {
    envState.AZURE_CONTENT_SAFETY_ENDPOINT = 'https://safety.example.com';
    envState.AZURE_CONTENT_SAFETY_KEY = 'fake-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ categoriesAnalysis: [{ category: 'Hate', severity: 1 }] })
    }));

    const result = await moderateText('mild text');
    expect(result.blocked).toBe(false);
  });

  it('strips a trailing slash from the endpoint before building the URL', async () => {
    envState.AZURE_CONTENT_SAFETY_ENDPOINT = 'https://safety.example.com/';
    envState.AZURE_CONTENT_SAFETY_KEY = 'fake-key';

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ categoriesAnalysis: [] }) });
    vi.stubGlobal('fetch', fetchMock);

    await moderateText('text');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://safety.example.com/contentsafety/text:analyze?api-version=2024-09-01',
      expect.anything()
    );
  });

  it('fails open on a non-ok response', async () => {
    envState.AZURE_CONTENT_SAFETY_ENDPOINT = 'https://safety.example.com';
    envState.AZURE_CONTENT_SAFETY_KEY = 'fake-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    expect(await moderateText('text')).toEqual({ blocked: false, reasons: [] });
  });

  it('fails open when fetch throws', async () => {
    envState.AZURE_CONTENT_SAFETY_ENDPOINT = 'https://safety.example.com';
    envState.AZURE_CONTENT_SAFETY_KEY = 'fake-key';

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    expect(await moderateText('text')).toEqual({ blocked: false, reasons: [] });
  });

  it('filters out malformed category entries with a NaN severity', async () => {
    envState.AZURE_CONTENT_SAFETY_ENDPOINT = 'https://safety.example.com';
    envState.AZURE_CONTENT_SAFETY_KEY = 'fake-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ categoriesAnalysis: [{ category: 'Hate', severity: 'not-a-number' }] })
    }));

    const result = await moderateText('text');
    expect(result.reasons).toEqual([]);
    expect(result.blocked).toBe(false);
  });

  it('fails open when the success response cannot be parsed', async () => {
    envState.AZURE_CONTENT_SAFETY_ENDPOINT = 'https://safety.example.com';
    envState.AZURE_CONTENT_SAFETY_KEY = 'fake-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => { throw new Error('invalid json'); }
    }));

    expect(await moderateText('text')).toEqual({ blocked: false, reasons: [] });
  });

  it('uses an empty list when neither supported response field is present', async () => {
    envState.AZURE_CONTENT_SAFETY_ENDPOINT = 'https://safety.example.com';
    envState.AZURE_CONTENT_SAFETY_KEY = 'fake-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));

    await expect(moderateText('text')).resolves.toMatchObject({ blocked: false, reasons: [] });
  });

  it('normalizes missing category fields and a null response body', async () => {
    envState.AZURE_CONTENT_SAFETY_ENDPOINT = 'https://safety.example.com';
    envState.AZURE_CONTENT_SAFETY_KEY = 'fake-key';

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ categoriesAnalysis: [{}] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => null });
    vi.stubGlobal('fetch', fetchMock);

    await expect(moderateText('text')).resolves.toMatchObject({
      blocked: false,
      reasons: [{ category: '', severity: 0 }]
    });
    await expect(moderateText('text')).resolves.toMatchObject({ blocked: false, reasons: [] });
  });

  it('supports responses that return categories array instead of categoriesAnalysis', async () => {
    envState.AZURE_CONTENT_SAFETY_ENDPOINT = 'https://safety.example.com';
    envState.AZURE_CONTENT_SAFETY_KEY = 'fake-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ categories: [{ category: 'Sexual', severity: 5 }] })
    }));

    const result = await moderateText('text');
    expect(result.blocked).toBe(true);
    expect(result.reasons).toEqual([{ category: 'Sexual', severity: 5 }]);
  });
});
