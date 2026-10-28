import { describe, it, expect, vi, afterEach } from 'vitest';
import { callApi, errorMessage } from './api';

afterEach(() => vi.unstubAllGlobals());

describe('errorMessage', () => {
  it('joins moderation reasons onto the error', () => {
    expect(errorMessage({ error: 'Blocked', reasons: ['Hate', 'Violence'] }, 'x')).toBe(
      'Blocked: Hate, Violence',
    );
    expect(errorMessage({ error: 'Nope' }, 'x')).toBe('Nope');
    expect(errorMessage({ reasons: [] }, 'fallback')).toBe('fallback');
    expect(errorMessage(null, 'fallback')).toBe('fallback');
  });
});

describe('callApi', () => {
  it('GETs without a body and POSTs JSON with one', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ ok: 1 }), { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    expect(await callApi('/a')).toEqual({ ok: true, data: { ok: 1 } });
    expect(fetch.mock.calls[0][1]).toMatchObject({
      method: 'GET',
      credentials: 'include',
      body: undefined,
    });
    await callApi('/b', { body: { x: 1 } });
    expect(fetch.mock.calls[1][1]).toMatchObject({
      method: 'POST',
      body: '{"x":1}',
      headers: { 'content-type': 'application/json' },
    });
    await callApi('/c', { method: 'DELETE' });
    expect(fetch.mock.calls[2][1].method).toBe('DELETE');
  });
  it('turns an error response into a message', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })),
    );
    expect(await callApi('/a')).toEqual({ ok: false, status: 403, error: 'Forbidden' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not json', { status: 500 })));
    expect(await callApi('/a', { fallback: 'Try later' })).toEqual({
      ok: false,
      status: 500,
      error: 'Try later',
    });
  });
  it('reports a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    const res = await callApi('/a');
    expect(res.ok).toBe(false);
    expect(res.ok === false && res.status).toBe(0);
  });
});
