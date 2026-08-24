import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    accountGet: vi.fn(),
    createSession: vi.fn(),
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
vi.mock('node-appwrite', () => ({
  Client: class { setEndpoint() { return this; } setProject() { return this; } setJWT() { return this; } },
  Account: class { get = mocks.accountGet; }
}));
vi.mock('$lib/server/session', () => ({
  createSession: mocks.createSession,
  SESSION_TTL_SECONDS: 1209600
}));
vi.mock('$lib/server/teams', () => ({
  get NGO_TEAM_ID() { return mocks.ngoTeamId; },
  get VOLUNTEER_TEAM_ID() { return mocks.volunteerTeamId; },
  isUserInTeam: mocks.isUserInTeam
}));

import { POST } from '../../routes/api/auth/session/+server';

type MockEvent = Parameters<typeof POST>[0] & {
  setCalls: Array<{ name: string; value: string; opts: Record<string, unknown> }>;
};

function makeEvent(body: unknown, protocol = 'https:'): MockEvent {
  const setCalls: Array<{ name: string; value: string; opts: Record<string, unknown> }> = [];
  return {
    request: {
      json: async () => {
        if (body === undefined) throw new Error('bad json');
        return body;
      }
    },
    cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => setCalls.push({ name, value, opts }) },
    url: new URL(`${protocol}//test/api/auth/session`),
    setCalls
  } as unknown as MockEvent;
}

describe('POST /api/auth/session', () => {
  beforeEach(() => {
    mocks.accountGet.mockReset();
    mocks.createSession.mockReset();
    mocks.isUserInTeam.mockReset();
    mocks.createSession.mockImplementation((input: Record<string, unknown>) => ({ id: 'sess-1', ...input, expiresAt: Date.now() + 1000 }));
    mocks.env.APPWRITE_API_KEY = 'key';
    mocks.env.NODE_ENV = 'test';
    mocks.ngoTeamId = 'ngo-team';
    mocks.volunteerTeamId = 'volunteer-team';
  });

  it('returns 400 when the body has no jwt', async () => {
    const res = await POST(makeEvent({}));
    expect(res.status).toBe(400);
  });

  it('returns 400 when the JWT is null or blank', async () => {
    expect((await POST(makeEvent(null))).status).toBe(400);
    expect((await POST(makeEvent({ jwt: '  ' }))).status).toBe(400);
  });

  it('returns 400 on invalid JSON', async () => {
    const res = await POST(makeEvent(undefined));
    expect(res.status).toBe(400);
  });

  it('returns 401 when the JWT does not resolve to an Appwrite user', async () => {
    mocks.accountGet.mockRejectedValue(new Error('invalid'));
    const res = await POST(makeEvent({ jwt: 'bad-jwt' }));
    expect(res.status).toBe(401);
  });

  it('returns 401 when the resolved user has no email/id', async () => {
    mocks.accountGet.mockResolvedValue({});
    const res = await POST(makeEvent({ jwt: 'jwt' }));
    expect(res.status).toBe(401);

    mocks.accountGet.mockResolvedValue({ email: 'jane@example.com' });
    expect((await POST(makeEvent({ jwt: 'jwt' }))).status).toBe(401);
  });

  it('creates a session with role="user" by default and sets both cookies', async () => {
    mocks.accountGet.mockResolvedValue({ $id: 'user-1', email: 'jane@example.com', prefs: {} });

    const event = makeEvent({ jwt: 'good-jwt' });
    const res = await POST(event);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true, role: 'user', email: 'jane@example.com', roleSource: 'default' });
    expect(mocks.createSession).toHaveBeenCalledWith({ userId: 'user-1', email: 'jane@example.com', role: 'user' });
    expect(event.setCalls.map((c: { name: string }) => c.name)).toEqual(['mm_session', 'mm_role']);
  });

  it('derives role="ngo" from prefs when set', async () => {
    mocks.accountGet.mockResolvedValue({ $id: 'user-1', email: 'jane@example.com', prefs: { role: 'ngo' } });
    const res = await POST(makeEvent({ jwt: 'good-jwt' }));
    const body = await res.json();
    expect(body.role).toBe('ngo');
    expect(body.roleSource).toBe('preferences');
  });

  it('derives role="volunteer" from prefs when set', async () => {
    mocks.accountGet.mockResolvedValue({ $id: 'user-1', email: 'jane@example.com', prefs: { role: 'volunteer' } });

    const res = await POST(makeEvent({ jwt: 'good-jwt' }));

    expect(await res.json()).toMatchObject({ role: 'volunteer', roleSource: 'preferences' });
  });

  it('uses an empty preference object and skips teams when no API key is configured', async () => {
    mocks.env.APPWRITE_API_KEY = '';
    mocks.accountGet.mockResolvedValue({ $id: 'user-1', email: 'jane@example.com', prefs: undefined });

    const res = await POST(makeEvent({ jwt: 'good-jwt' }));

    expect(await res.json()).toMatchObject({ role: 'user', roleSource: 'default' });
    expect(mocks.isUserInTeam).not.toHaveBeenCalled();
  });

  it('skips team membership checks when the team identifiers are unavailable', async () => {
    mocks.ngoTeamId = '';
    mocks.volunteerTeamId = '';
    mocks.accountGet.mockResolvedValue({ $id: 'user-1', email: 'jane@example.com', prefs: {} });

    const res = await POST(makeEvent({ jwt: 'good-jwt' }));

    expect(await res.json()).toMatchObject({ role: 'user', roleSource: 'default' });
    expect(mocks.isUserInTeam).not.toHaveBeenCalled();
  });

  it('team membership overrides prefs when an API key is configured', async () => {
    mocks.accountGet.mockResolvedValue({ $id: 'user-1', email: 'jane@example.com', prefs: { role: 'volunteer' } });
    mocks.isUserInTeam.mockImplementation(async (_id: string, teamId: string) => teamId === 'ngo-team');

    const res = await POST(makeEvent({ jwt: 'good-jwt' }));
    const body = await res.json();

    expect(body.role).toBe('ngo');
    expect(body.roleSource).toBe('team_membership');
  });

  it('sets role="volunteer" via team membership', async () => {
    mocks.accountGet.mockResolvedValue({ $id: 'user-1', email: 'jane@example.com', prefs: {} });
    mocks.isUserInTeam.mockImplementation(async (_id: string, teamId: string) => teamId === 'volunteer-team');

    const res = await POST(makeEvent({ jwt: 'good-jwt' }, 'http:'));
    const body = await res.json();

    expect(body.role).toBe('volunteer');
    expect(body.roleSource).toBe('team_membership');
    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it('falls back to role=user if the team check throws', async () => {
    mocks.accountGet.mockResolvedValue({ $id: 'user-1', email: 'jane@example.com', prefs: {} });
    mocks.isUserInTeam.mockRejectedValue(new Error('teams down'));

    const res = await POST(makeEvent({ jwt: 'good-jwt' }));
    expect(res.status).toBe(200);
    expect((await res.json()).role).toBe('user');
  });

  it('handles role determination error gracefully', async () => {
    const brokenUser = {
      $id: 'user-1',
      email: 'jane@example.com',
      get prefs() {
        throw new Error('prefs property getter crashed');
      }
    };
    mocks.accountGet.mockResolvedValue(brokenUser);

    const res = await POST(makeEvent({ jwt: 'good-jwt' }));
    expect(res.status).toBe(200);
    expect((await res.json()).role).toBe('user');
  });

  it('returns 400 when session creation fails', async () => {
    mocks.accountGet.mockResolvedValue({ $id: 'user-1', email: 'jane@example.com', prefs: {} });
    mocks.createSession.mockImplementation(() => {
      throw new Error('session creation error');
    });

    const res = await POST(makeEvent({ jwt: 'good-jwt' }));
    expect(res.status).toBe(400);
  });

  it('handles role and session failures without development diagnostics in production', async () => {
    mocks.env.NODE_ENV = 'production';

    mocks.accountGet.mockResolvedValue({
      $id: 'user-1',
      email: 'jane@example.com',
      get prefs() {
        throw new Error('prefs property getter crashed');
      }
    });
    expect((await POST(makeEvent({ jwt: 'good-jwt' }))).status).toBe(200);

    mocks.accountGet.mockResolvedValue({ $id: 'user-1', email: 'jane@example.com', prefs: {} });
    mocks.isUserInTeam.mockRejectedValue(new Error('teams down'));
    expect((await POST(makeEvent({ jwt: 'good-jwt' }))).status).toBe(200);

    mocks.isUserInTeam.mockResolvedValue(false);
    mocks.createSession.mockImplementation(() => {
      throw new Error('session creation error');
    });
    expect((await POST(makeEvent({ jwt: 'good-jwt' }))).status).toBe(400);
  });

  it('sets secure cookies for HTTPS and production HTTP requests only', async () => {
    mocks.accountGet.mockResolvedValue({ $id: 'user-1', email: 'jane@example.com', prefs: {} });
    mocks.isUserInTeam.mockResolvedValue(false);

    const httpEvent = makeEvent({ jwt: 'good-jwt' }, 'http:');
    await POST(httpEvent);
    expect(httpEvent.setCalls).toEqual([
      expect.objectContaining({ name: 'mm_session', opts: expect.objectContaining({ secure: false }) }),
      expect.objectContaining({ name: 'mm_role', opts: expect.objectContaining({ secure: false }) })
    ]);

    mocks.env.NODE_ENV = 'production';
    const productionEvent = makeEvent({ jwt: 'good-jwt' }, 'http:');
    await POST(productionEvent);
    expect(productionEvent.setCalls).toEqual([
      expect.objectContaining({ name: 'mm_session', opts: expect.objectContaining({ secure: true }) }),
      expect.objectContaining({ name: 'mm_role', opts: expect.objectContaining({ secure: true }) })
    ]);
  });

});
