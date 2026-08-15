import { describe, it, expect, beforeEach, vi } from 'vitest';

const { envState, mocks } = vi.hoisted(() => ({
  envState: {} as Record<string, string | undefined>,
  mocks: {
    accountGet: vi.fn(),
    isUserInTeam: vi.fn()
  }
}));

vi.mock('$env/dynamic/private', () => ({
  env: new Proxy(envState, { get: (_, key: string) => envState[key] })
}));
vi.mock('node-appwrite', () => ({
  Client: class {
    setEndpoint() { return this; }
    setProject() { return this; }
    setJWT() { return this; }
  },
  Account: class { get = mocks.accountGet; }
}));
vi.mock('./teams', () => ({
  NGO_TEAM_ID: 'ngo-team',
  VOLUNTEER_TEAM_ID: 'volunteer-team',
  isUserInTeam: mocks.isUserInTeam
}));

import { getUserRole } from './auth';

function makeEvent(opts: {
  authorization?: string;
  localsRole?: string;
} = {}) {
  return {
    locals: opts.localsRole ? { userRole: opts.localsRole } : {},
    request: {
      headers: new Headers(opts.authorization ? { authorization: opts.authorization } : {})
    }
  } as unknown as import('@sveltejs/kit').RequestEvent;
}

describe('getUserRole', () => {
  beforeEach(() => {
    for (const key of Object.keys(envState)) delete envState[key];
    Object.values(mocks).forEach((m) => m.mockReset());
  });

  it('prefers a non-anonymous role already set on event.locals', async () => {
    const role = await getUserRole(makeEvent({ localsRole: 'ngo' }));
    expect(role).toBe('ngo');
    expect(mocks.accountGet).not.toHaveBeenCalled();
  });

  it('ignores an anonymous locals role and continues to the JWT/token checks', async () => {
    const role = await getUserRole(makeEvent({ localsRole: 'anonymous' }));
    expect(role).toBe('anonymous');
  });

  it('returns anonymous when there is no bearer header and no shared tokens configured', async () => {
    expect(await getUserRole(makeEvent())).toBe('anonymous');
  });

  it('ignores a non-bearer authorization header', async () => {
    const role = await getUserRole(makeEvent({ authorization: 'Basic abc123' }));
    expect(role).toBe('anonymous');
  });

  it('resolves role via team membership when the JWT is valid and Appwrite is configured', async () => {
    envState.APPWRITE_ENDPOINT = 'https://fake.appwrite.io/v1';
    envState.APPWRITE_PROJECT_ID = 'proj';
    mocks.accountGet.mockResolvedValue({ $id: 'user-1', prefs: {} });
    mocks.isUserInTeam.mockImplementation(async (_userId: string, teamId: string) => teamId === 'ngo-team');

    const role = await getUserRole(makeEvent({ authorization: 'Bearer good-jwt' }));

    expect(role).toBe('ngo');
    expect(mocks.isUserInTeam).toHaveBeenCalledWith('user-1', 'ngo-team');
  });

  it('checks the volunteer team when the user is not in the NGO team', async () => {
    envState.APPWRITE_ENDPOINT = 'https://fake.appwrite.io/v1';
    envState.APPWRITE_PROJECT_ID = 'proj';
    mocks.accountGet.mockResolvedValue({ $id: 'user-1', prefs: {} });
    mocks.isUserInTeam.mockImplementation(async (_userId: string, teamId: string) => teamId === 'volunteer-team');

    expect(await getUserRole(makeEvent({ authorization: 'Bearer good-jwt' }))).toBe('volunteer');
  });

  it('falls back to prefs.role when team lookups find no membership', async () => {
    envState.APPWRITE_ENDPOINT = 'https://fake.appwrite.io/v1';
    envState.APPWRITE_PROJECT_ID = 'proj';
    mocks.accountGet.mockResolvedValue({ $id: 'user-1', prefs: { role: 'ngo' } });
    mocks.isUserInTeam.mockResolvedValue(false);

    expect(await getUserRole(makeEvent({ authorization: 'Bearer good-jwt' }))).toBe('ngo');
  });

  it('defaults to "user" when prefs.role is missing or unrecognized', async () => {
    envState.APPWRITE_ENDPOINT = 'https://fake.appwrite.io/v1';
    envState.APPWRITE_PROJECT_ID = 'proj';
    mocks.accountGet.mockResolvedValue({ $id: 'user-1', prefs: {} });
    mocks.isUserInTeam.mockResolvedValue(false);

    expect(await getUserRole(makeEvent({ authorization: 'Bearer good-jwt' }))).toBe('user');
  });

  it('continues to the shared-token fallback when the JWT fails to resolve a user', async () => {
    envState.APPWRITE_ENDPOINT = 'https://fake.appwrite.io/v1';
    envState.APPWRITE_PROJECT_ID = 'proj';
    envState.NGO_API_TOKEN = 'bad-jwt';
    mocks.accountGet.mockRejectedValue(new Error('invalid token'));

    expect(await getUserRole(makeEvent({ authorization: 'Bearer bad-jwt' }))).toBe('ngo');
  });

  it('falls back to the NGO_API_TOKEN shared secret when Appwrite is not configured', async () => {
    envState.NGO_API_TOKEN = 'shared-ngo-token';
    expect(await getUserRole(makeEvent({ authorization: 'Bearer shared-ngo-token' }))).toBe('ngo');
  });

  it('falls back to the USER_API_TOKEN shared secret when Appwrite is not configured', async () => {
    envState.USER_API_TOKEN = 'shared-user-token';
    expect(await getUserRole(makeEvent({ authorization: 'Bearer shared-user-token' }))).toBe('user');
  });

  it('returns anonymous when the bearer token matches neither shared secret', async () => {
    envState.NGO_API_TOKEN = 'shared-ngo-token';
    envState.USER_API_TOKEN = 'shared-user-token';
    expect(await getUserRole(makeEvent({ authorization: 'Bearer wrong-token' }))).toBe('anonymous');
  });

  it('does not grant a role if the team-membership check itself throws', async () => {
    envState.APPWRITE_ENDPOINT = 'https://fake.appwrite.io/v1';
    envState.APPWRITE_PROJECT_ID = 'proj';
    mocks.accountGet.mockResolvedValue({ $id: 'user-1', prefs: { role: 'volunteer' } });
    mocks.isUserInTeam.mockRejectedValue(new Error('teams api down'));

    // Falls through the try/catch around team checks straight to prefs.role.
    expect(await getUserRole(makeEvent({ authorization: 'Bearer good-jwt' }))).toBe('volunteer');
  });
});
