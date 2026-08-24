import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    createSession: vi.fn(() => ({ id: 'sess-1' })),
    accountCreateSession: vi.fn(),
    usersGet: vi.fn(),
    isUserInTeam: vi.fn(),
    env: {
      APPWRITE_ENDPOINT: 'https://fake.appwrite.io/v1',
      APPWRITE_PROJECT_ID: 'proj',
      APPWRITE_API_KEY: 'key',
      NODE_ENV: 'test'
    },
    ngoTeamId: 'ngo-team',
    volunteerTeamId: 'volunteer-team'
  }
}));

vi.mock('$env/dynamic/private', () => ({
  env: mocks.env
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
  get NGO_TEAM_ID() { return mocks.ngoTeamId; },
  get VOLUNTEER_TEAM_ID() { return mocks.volunteerTeamId; },
  isUserInTeam: mocks.isUserInTeam
}));

import { GET } from '../../routes/api/auth/oauth/callback/+server';

type MockEvent = Parameters<typeof GET>[0] & {
  setCalls: Array<{ name: string; value: string; opts: Record<string, unknown> }>;
};

function makeEvent(search: string, protocol = 'https:'): MockEvent {
  const setCalls: Array<{ name: string; value: string; opts: Record<string, unknown> }> = [];
  return {
    url: new URL(`${protocol}//test/api/auth/oauth/callback${search}`),
    cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => setCalls.push({ name, value, opts }) },
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
  beforeEach(() => {
    mocks.createSession.mockReset();
    mocks.createSession.mockReturnValue({ id: 'sess-1' });
    mocks.accountCreateSession.mockReset();
    mocks.usersGet.mockReset();
    mocks.isUserInTeam.mockReset();
    mocks.env.APPWRITE_API_KEY = 'key';
    mocks.env.NODE_ENV = 'test';
    mocks.ngoTeamId = 'ngo-team';
    mocks.volunteerTeamId = 'volunteer-team';
  });

  it('redirects to /login?error=oauth_token when both OAuth credentials are missing', async () => {
    await expectRedirect(GET(makeEvent('')), 303, '/login?error=oauth_token');
  });

  it('redirects to /login?error=oauth_token when either OAuth credential is missing', async () => {
    await expectRedirect(GET(makeEvent('?userId=u1')), 303, '/login?error=oauth_token');
    await expectRedirect(GET(makeEvent('?secret=s1')), 303, '/login?error=oauth_token');
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

  it('redirects to /login?error=oauth_email when the user record or its email is absent', async () => {
    mocks.accountCreateSession.mockResolvedValue({});
    mocks.usersGet.mockResolvedValue({ email: '' });
    await expectRedirect(GET(makeEvent('?userId=u1&secret=s1')), 303, '/login?error=oauth_email');

    mocks.usersGet.mockResolvedValue(undefined);
    await expectRedirect(GET(makeEvent('?userId=u1&secret=s1')), 303, '/login?error=oauth_email');
  });

  it('mints a session and redirects to /profile when the user has no chosen role', async () => {
    mocks.accountCreateSession.mockResolvedValue({});
    mocks.usersGet.mockResolvedValue({ email: 'jane@example.com', prefs: undefined });
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

    mocks.usersGet.mockResolvedValue({ email: 'jane@example.com', prefs: { role: 'volunteer' } });
    await expectRedirect(GET(makeEvent('?userId=u1&secret=s1')), 303, '/dashboard');
  });

  it('skips team checks when an API key is unavailable', async () => {
    mocks.env.APPWRITE_API_KEY = '';
    mocks.accountCreateSession.mockResolvedValue({});
    mocks.usersGet.mockResolvedValue({ email: 'jane@example.com', prefs: { role: 'ngo' } });

    await expectRedirect(GET(makeEvent('?userId=u1&secret=s1')), 303, '/dashboard');

    expect(mocks.isUserInTeam).not.toHaveBeenCalled();
    expect(mocks.createSession).toHaveBeenCalledWith({ userId: 'u1', email: 'jane@example.com', role: 'ngo' });
  });

  it('keeps the default role when team identifiers are unavailable', async () => {
    mocks.ngoTeamId = '';
    mocks.volunteerTeamId = '';
    mocks.accountCreateSession.mockResolvedValue({});
    mocks.usersGet.mockResolvedValue({ email: 'jane@example.com', prefs: {} });

    await expectRedirect(GET(makeEvent('?userId=u1&secret=s1')), 303, '/profile');

    expect(mocks.isUserInTeam).not.toHaveBeenCalled();
  });

  it('team membership can override prefs to grant ngo/volunteer role', async () => {
    mocks.accountCreateSession.mockResolvedValue({});
    mocks.usersGet.mockResolvedValue({ email: 'jane@example.com', prefs: {} });
    mocks.isUserInTeam.mockImplementation(async (_id: string, teamId: string) => teamId === 'volunteer-team');

    await expectRedirect(GET(makeEvent('?userId=u1&secret=s1')), 303, '/profile');
    expect(mocks.createSession).toHaveBeenCalledWith({ userId: 'u1', email: 'jane@example.com', role: 'volunteer' });

    // NGO team
    mocks.isUserInTeam.mockImplementation(async (_id: string, teamId: string) => teamId === 'ngo-team');
    await expectRedirect(GET(makeEvent('?userId=u1&secret=s1')), 303, '/profile');
    expect(mocks.createSession).toHaveBeenCalledWith({ userId: 'u1', email: 'jane@example.com', role: 'ngo' });

    // Team check throwing
    mocks.isUserInTeam.mockRejectedValue(new Error('team error'));
    await expectRedirect(GET(makeEvent('?userId=u1&secret=s1')), 303, '/profile');
    expect(mocks.createSession).toHaveBeenLastCalledWith({ userId: 'u1', email: 'jane@example.com', role: 'user' });
  });

  it('handles OAuth failures without development diagnostics in production', async () => {
    mocks.env.NODE_ENV = 'production';

    mocks.accountCreateSession.mockRejectedValue(new Error('bad token'));
    await expectRedirect(GET(makeEvent('?userId=u1&secret=s1')), 303, '/login?error=oauth_invalid');

    mocks.accountCreateSession.mockResolvedValue({});
    mocks.usersGet.mockRejectedValue(new Error('not found'));
    await expectRedirect(GET(makeEvent('?userId=u1&secret=s1')), 303, '/login?error=oauth_user');

    mocks.usersGet.mockResolvedValue({ email: 'jane@example.com', prefs: {} });
    mocks.isUserInTeam.mockRejectedValue(new Error('teams down'));
    await expectRedirect(GET(makeEvent('?userId=u1&secret=s1')), 303, '/profile');
  });

  it('sets secure cookies for HTTPS and production HTTP callbacks only', async () => {
    mocks.accountCreateSession.mockResolvedValue({});
    mocks.usersGet.mockResolvedValue({ email: 'jane@example.com', prefs: {} });
    mocks.isUserInTeam.mockResolvedValue(false);

    const httpEvent = makeEvent('?userId=u1&secret=s1', 'http:');
    await expectRedirect(GET(httpEvent), 303, '/profile');
    expect(httpEvent.setCalls).toEqual([
      expect.objectContaining({ name: 'mm_session', opts: expect.objectContaining({ secure: false }) }),
      expect.objectContaining({ name: 'mm_role', opts: expect.objectContaining({ secure: false }) })
    ]);

    mocks.env.NODE_ENV = 'production';
    const productionEvent = makeEvent('?userId=u1&secret=s1', 'http:');
    await expectRedirect(GET(productionEvent), 303, '/profile');
    expect(productionEvent.setCalls).toEqual([
      expect.objectContaining({ name: 'mm_session', opts: expect.objectContaining({ secure: true }) }),
      expect.objectContaining({ name: 'mm_role', opts: expect.objectContaining({ secure: true }) })
    ]);
  });
});
