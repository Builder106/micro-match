import { describe, it, expect, beforeEach, vi } from 'vitest';

const { envState, mocks } = vi.hoisted(() => ({
  envState: {} as Record<string, string | undefined>,
  mocks: {
    getSession: vi.fn(),
    getUserRole: vi.fn()
  }
}));

vi.mock('$env/dynamic/private', () => ({
  env: new Proxy(envState, { get: (_, key: string) => envState[key] })
}));
vi.mock('$lib/server/session', () => ({ getSession: mocks.getSession }));
vi.mock('$lib/server/auth', () => ({ getUserRole: mocks.getUserRole }));

import { handle } from '../hooks.server';

function makeEvent(cookies: Record<string, string>) {
  return {
    locals: {},
    cookies: { get: (name: string) => cookies[name] },
    request: new Request('http://test/')
  } as unknown as import("@sveltejs/kit").RequestEvent;
}

const resolve = vi.fn(async () => new Response('ok'));

describe('hooks.server handle — role authorization', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
    resolve.mockClear();
    mocks.getUserRole.mockResolvedValue('anonymous');
  });

  it('derives userRole and session from a valid mm_session cookie', async () => {
    mocks.getSession.mockReturnValue({
      id: 'sess-1',
      userId: 'user-1',
      email: 'jane@example.com',
      role: 'ngo',
      expiresAt: Date.now() + 60_000
    });

    const event = makeEvent({ mm_session: 'sess-1' });
    await handle({ event, resolve });

    expect(event.locals.userRole).toBe('ngo');
    expect(event.locals.session).toEqual({ user: { id: 'user-1', email: 'jane@example.com' } });
    expect(mocks.getUserRole).not.toHaveBeenCalled();
  });

  it('does not grant a role from a forged mm_role cookie when there is no session cookie', async () => {
    const event = makeEvent({ mm_role: 'ngo' });
    await handle({ event, resolve });

    // Must fall through to the validated getUserRole() path, not adopt the
    // client-writable hint directly.
    expect(mocks.getUserRole).toHaveBeenCalledWith(event);
    expect(event.locals.userRole).toBe('anonymous');
  });

  it('does not fall back to mm_role when mm_session is present but invalid/expired', async () => {
    mocks.getSession.mockReturnValue(null);

    const event = makeEvent({ mm_session: 'stale-sess', mm_role: 'ngo' });
    await handle({ event, resolve });

    expect(mocks.getUserRole).toHaveBeenCalledWith(event);
    expect(event.locals.userRole).toBe('anonymous');
    expect(event.locals.session).toBeUndefined();
  });

  it('never lets a forged mm_role cookie produce a privileged role even if getUserRole also falls through to anonymous', async () => {
    mocks.getUserRole.mockResolvedValue('anonymous');
    const event = makeEvent({ mm_role: 'ngo' });
    await handle({ event, resolve });

    expect(event.locals.userRole).not.toBe('ngo');
    expect(event.locals.userRole).toBe('anonymous');
  });
});
