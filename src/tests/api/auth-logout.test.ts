import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockCookies, createRequestEvent } from '../helpers/createLoadEvent';
import type { CookieSerializeOptions } from '../helpers/createLoadEvent';

const { mocks } = vi.hoisted(() => {
  const env: { NODE_ENV: string | undefined } = { NODE_ENV: undefined };
  return { mocks: { deleteSession: vi.fn(), env } };
});
vi.mock('$lib/server/session', () => ({ deleteSession: mocks.deleteSession }));
vi.mock('$env/dynamic/private', () => ({ env: mocks.env }));

import { POST } from '../../routes/api/auth/logout/+server';

type MockEvent = Parameters<typeof POST>[0] & {
  setCalls: Array<{ name: string; value: string; opts: CookieSerializeOptions }>;
};

function makeEvent(opts: { sessionCookie?: string; protocol?: string } = {}): MockEvent {
  const cookies = createMockCookies(opts.sessionCookie ? { mm_session: opts.sessionCookie } : {});
  const event = createRequestEvent({
    url: `${opts.protocol ?? 'https:'}//test/api/auth/logout`,
    cookies
  });
  const setCalls: MockEvent['setCalls'] = [];
  cookies.set.mockImplementation((name, value, opts) => {
    setCalls.push({ name, value, opts });
  });
  return Object.assign(event, { setCalls });
}

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    mocks.deleteSession.mockReset();
    mocks.env.NODE_ENV = undefined;
  });

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
    expect(event.setCalls.every((c) => c.value === '' && c.opts.maxAge === 0)).toBe(true);
  });

  it('handles logout over http in development', async () => {
    const event = makeEvent({ sessionCookie: 'sess-1', protocol: 'http:' });
    const res = await POST(event);
    expect(await res.json()).toEqual({ ok: true });
    expect(event.setCalls[0].opts.secure).toBe(false);
  });

  it('keeps cookies secure over http in production', async () => {
    mocks.env.NODE_ENV = 'production';
    const event = makeEvent({ sessionCookie: 'sess-1', protocol: 'http:' });

    await POST(event);

    expect(event.setCalls.every((call) => call.opts.secure === true)).toBe(true);
  });

  it('returns { ok: true }', async () => {
    const res = await POST(makeEvent());
    expect(await res.json()).toEqual({ ok: true });
  });
});
