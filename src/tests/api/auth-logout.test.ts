import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({ mocks: { deleteSession: vi.fn() } }));
vi.mock('$lib/server/session', () => ({ deleteSession: mocks.deleteSession }));
vi.mock('$env/dynamic/private', () => ({ env: {} }));

import { POST } from '../../routes/api/auth/logout/+server';

type MockEvent = Parameters<typeof POST>[0] & {
  setCalls: Array<{ name: string; value: string; opts: Record<string, unknown> }>;
};

function makeEvent(opts: { sessionCookie?: string; protocol?: string } = {}): MockEvent {
  const cookies = new Map<string, string>();
  if (opts.sessionCookie) cookies.set('mm_session', opts.sessionCookie);
  const setCalls: Array<{ name: string; value: string; opts: Record<string, unknown> }> = [];
  return {
    cookies: {
      get: (name: string) => cookies.get(name),
      set: (name: string, value: string, opts: Record<string, unknown>) => setCalls.push({ name, value, opts })
    },
    url: new URL(`${opts.protocol ?? 'https:'}//test/api/auth/logout`),
    setCalls
  } as unknown as MockEvent;
}

describe('POST /api/auth/logout', () => {
  beforeEach(() => mocks.deleteSession.mockReset());

  it('deletes the session referenced by the mm_session cookie', async () => {
    const event = makeEvent({ sessionCookie: 'sess-1' });
    await POST(event);
    expect(mocks.deleteSession).toHaveBeenCalledWith('sess-1');
  });

  it('is a no-op on deleteSession when there is no session cookie', async () => {
    const event = makeEvent();
    await POST(event);
    expect(mocks.deleteSession).not.toHaveBeenCalled();
  });

  it('clears both mm_session and mm_role cookies', async () => {
    const event = makeEvent({ sessionCookie: 'sess-1' });
    await POST(event);

    const names = event.setCalls.map((c: { name: string }) => c.name);
    expect(names).toEqual(['mm_session', 'mm_role']);
    expect(event.setCalls.every((c: { value: string; opts: Record<string, unknown> }) => c.value === '' && c.opts.maxAge === 0)).toBe(true);
  });

  it('handles logout over http in development', async () => {
    const event = makeEvent({ sessionCookie: 'sess-1', protocol: 'http:' });
    const res = await POST(event);
    expect(await res.json()).toEqual({ ok: true });
    expect(event.setCalls[0].opts.secure).toBe(false);
  });

  it('returns { ok: true }', async () => {
    const res = await POST(makeEvent());
    expect(await res.json()).toEqual({ ok: true });
  });
});
