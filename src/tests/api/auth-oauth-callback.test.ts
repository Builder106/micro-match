import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    createSession: vi.fn(() => ({ id: 'sess-1' })),
    accountCreateSession: vi.fn(),
    usersGet: vi.fn(),
    isUserInTeam: vi.fn()
  }
}));

vi.mock('$env/dynamic/private', () => ({
  env: { APPWRITE_ENDPOINT: 'https://fake.appwrite.io/v1', APPWRITE_PROJECT_ID: 'proj', APPWRITE_API_KEY: 'key' }
}));
vi.mock('$lib/server/session', () => ({
  createSession: mocks.createSession,
  SESSION_TTL_SECONDS: 1209600
}));
vi.mock('node-appwrite', () => ({
  Client: class {
    setEndpoint() { return this; } setProject() { return this; } setKey() { return this; }
  },
  Account: class { createSession = mocks.accountCreateSession; },
  Users: class { get = mocks.usersGet; }
}));
vi.mock('$lib/server/teams', () => ({
  NGO_TEAM_ID: 'ngo-team',
  VOLUNTEER_TEAM_ID: 'volunteer-team',
  isUserInTeam: mocks.isUserInTeam
}));

import { GET } from '../../routes/api/auth/oauth/callback/+server';

type MockEvent = Parameters<typeof GET>[0] & {
  setCalls: Array<{ name: string; value: string }>;
};

function makeEvent(search: string): MockEvent {
  const setCalls: Array<{ name: string; value: string }> = [];
  return {
    url: new URL(`https://test/api/auth/oauth/callback${search}`),
    cookies: { set: (name: string, value: string) => setCalls.push({ name, value }) },
    setCalls
  } as unknown as MockEvent;
}

async function expectRedirect(promise: unknown, status: number, location: string) {
  try {
    await promise;
    throw new Error('expected a redirect to be thrown');
  } catch (err: unknown) {
    const e = err as { status?: number; location?: string };
    expect(e.status).toBe(status);
    expect(e.location).toBe(location);
  }
}

describe('GET /api/auth/oauth/callback', () => {
  beforeEach(() => Object.values(mocks).forEach((m) => m.mockReset()));

  it('redirects to /login?error=oauth_token when userId/secret are missing', async () => {
    await expectRedirect(GET(makeEvent('')), 303, '/login?error=oauth_token');
  });

  it('redirects to /login?error=oauth_invalid when the token exchange fails', async () => {
    mocks.accountCreateSession.mockRejectedValue(new Error('bad token'));
    await expectRedirect(GET(makeEvent('?userId=u1&secret=s1')), 303, '/login?error=oauth_invalid');
  });

  it('redirects to /login?error=oauth_user when the admin user lookup fails', async () => {
    mocks.accountCreateSession.mockResolvedValue({});
    mocks.usersGet.mockRejectedValue(new Error('not found'));
    await expectRedirect(GET(makeEvent('?userId=u1&secret=s1')), 303, '/login?error=oauth_user');
  });

  it('redirects to /login?error=oauth_email when the user has no email', async () => {
    mocks.accountCreateSession.mockResolvedValue({});
    mocks.usersGet.mockResolvedValue({ email: '' });
    await expectRedirect(GET(makeEvent('?userId=u1&secret=s1')), 303, '/login?error=oauth_email');
  });

  it('mints a session and redirects to /profile when the user has no chosen role', async () => {
    mocks.accountCreateSession.mockResolvedValue({});
    mocks.usersGet.mockResolvedValue({ email: 'jane@example.com', prefs: {} });
    mocks.isUserInTeam.mockResolvedValue(false);

    const event = makeEvent('?userId=u1&secret=s1');
    await expectRedirect(GET(event), 303, '/profile');

    expect(mocks.createSession).toHaveBeenCalledWith({ userId: 'u1', email: 'jane@example.com', role: 'user' });
    expect(event.setCalls.map((c: { name: string }) => c.name)).toEqual(['mm_session', 'mm_role']);
  });

  it('redirects to /dashboard when prefs.role is already set', async () => {
    mocks.accountCreateSession.mockResolvedValue({});
    mocks.usersGet.mockResolvedValue({ email: 'jane@example.com', prefs: { role: 'ngo' } });
    mocks.isUserInTeam.mockResolvedValue(false);

    await expectRedirect(GET(makeEvent('?userId=u1&secret=s1')), 303, '/dashboard');
  });

  it('team membership can override prefs to grant ngo/volunteer role', async () => {
    mocks.accountCreateSession.mockResolvedValue({});
    mocks.usersGet.mockResolvedValue({ email: 'jane@example.com', prefs: {} });
    mocks.isUserInTeam.mockImplementation(async (_id: string, teamId: string) => teamId === 'volunteer-team');

    await expectRedirect(GET(makeEvent('?userId=u1&secret=s1')), 303, '/profile');
    expect(mocks.createSession).toHaveBeenCalledWith({ userId: 'u1', email: 'jane@example.com', role: 'volunteer' });
  });
});
