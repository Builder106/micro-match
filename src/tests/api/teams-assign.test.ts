import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    getUserRole: vi.fn(),
    addUserToTeam: vi.fn(),
    removeUserFromTeam: vi.fn()
  }
}));

vi.mock('$lib/server/auth', () => ({ getUserRole: mocks.getUserRole }));
vi.mock('$lib/server/teams', () => ({
  NGO_TEAM_ID: 'ngo-team',
  VOLUNTEER_TEAM_ID: 'volunteer-team',
  addUserToTeam: mocks.addUserToTeam,
  removeUserFromTeam: mocks.removeUserFromTeam
}));
vi.mock('$env/dynamic/private', () => ({ env: {} }));

import { POST } from '../../routes/api/teams/assign/+server';

function makeEvent(opts: { userId?: string | null; authorization?: string } = {}) {
  return {
    locals: opts.userId ? { session: { user: { id: opts.userId } } } : {},
    request: { headers: new Headers(opts.authorization ? { authorization: opts.authorization } : {}) }
  } as unknown as import("@sveltejs/kit").RequestEvent;
}

describe('POST /api/teams/assign', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
  });

  it('is a silent no-op (200 ok) for roles other than ngo/volunteer', async () => {
    mocks.getUserRole.mockResolvedValue('anonymous');
    const res = await POST(makeEvent());
    expect(res.status).toBe(200);
    expect(mocks.addUserToTeam).not.toHaveBeenCalled();
  });

  it('returns 401 when the role qualifies but there is no resolvable userId', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    const res = await POST(makeEvent());
    expect(res.status).toBe(401);
  });

  it('moves the user into the NGO team and out of the volunteer team', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    mocks.removeUserFromTeam.mockResolvedValue(undefined);
    mocks.addUserToTeam.mockResolvedValue(undefined);

    const res = await POST(makeEvent({ userId: 'user-1' }));

    expect(res.status).toBe(200);
    expect(mocks.removeUserFromTeam).toHaveBeenCalledWith('user-1', 'volunteer-team');
    expect(mocks.addUserToTeam).toHaveBeenCalledWith('user-1', 'ngo-team', ['ngo']);
  });

  it('moves the user into the volunteer team and out of the NGO team', async () => {
    mocks.getUserRole.mockResolvedValue('volunteer');
    const res = await POST(makeEvent({ userId: 'user-1' }));

    expect(res.status).toBe(200);
    expect(mocks.removeUserFromTeam).toHaveBeenCalledWith('user-1', 'ngo-team');
    expect(mocks.addUserToTeam).toHaveBeenCalledWith('user-1', 'volunteer-team', ['volunteer']);
  });

  it('extracts userId via JWT authorization header if session is missing', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    mocks.removeUserFromTeam.mockResolvedValue(undefined);
    mocks.addUserToTeam.mockResolvedValue(undefined);

    vi.doMock('node-appwrite', () => ({
      Client: class {
        setEndpoint() { return this; }
        setProject() { return this; }
        setJWT() { return this; }
      },
      Account: class {
        get = vi.fn().mockResolvedValue({ $id: 'jwt-user-1' });
      }
    }));

    const res = await POST(makeEvent({ authorization: 'Bearer valid-jwt-token' }));
    expect(res.status).toBe(200);

    // Account.get returning no id
    vi.doMock('node-appwrite', () => ({
      Client: class {
        setEndpoint() { return this; } setProject() { return this; } setJWT() { return this; }
      },
      Account: class { get = vi.fn().mockResolvedValue({}); }
    }));
    const resNoId = await POST(makeEvent({ authorization: 'Bearer valid-jwt-token' }));
    expect(resNoId.status).toBe(401);

    // Account.get throwing error
    vi.doMock('node-appwrite', () => ({
      Client: class {
        setEndpoint() { return this; } setProject() { return this; } setJWT() { return this; }
      },
      Account: class { get = vi.fn().mockRejectedValue(new Error('jwt bad')); }
    }));
    const resThrow = await POST(makeEvent({ authorization: 'Bearer valid-jwt-token' }));
    expect(resThrow.status).toBe(401);

    // Non-bearer auth header
    const resNonBearer = await POST(makeEvent({ authorization: 'Basic abc' }));
    expect(resNonBearer.status).toBe(401);
  });



  it('returns 500 when the team API throws', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    mocks.removeUserFromTeam.mockRejectedValue(new Error('down'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    const res = await POST(makeEvent({ userId: 'user-1' }));

    expect(res.status).toBe(500);
    errSpy.mockRestore();
  });
});
