import { describe, it, expect, beforeEach, vi } from 'vitest';

const { envState, mocks, AppwriteCtors } = vi.hoisted(() => {
  const userPrefs: Record<string, string> = { role: '' };
  return {
    envState: {} as Record<string, string | undefined>,
    mocks: {
      addUserToTeam: vi.fn(),
      removeUserFromTeam: vi.fn(),
      withdrawVerification: vi.fn(),
      setUserVerificationPref: vi.fn(),
      setTasksVerifiedForOrg: vi.fn(),
      // Spy on what the endpoint persists to user prefs.
      usersGet: vi.fn().mockImplementation(async () => ({ prefs: { ...userPrefs } })),
      usersUpdatePrefs: vi.fn().mockImplementation(async (_id: string, p: Record<string, unknown>) => {
        Object.keys(userPrefs).forEach((k) => delete userPrefs[k]);
        Object.assign(userPrefs, p);
      })
    },
    AppwriteCtors: { userPrefs }
  };
});

vi.mock('$env/dynamic/private', () => ({
  env: new Proxy(envState, { get: (_, key: string) => envState[key] })
}));

vi.mock('node-appwrite', () => ({
  Client: class {
    setEndpoint() { return this; }
    setProject() { return this; }
    setKey() { return this; }
    setJWT() { return this; }
  },
  Account: class { get = vi.fn(async () => ({ $id: 'jwt-user' })); },
  Users: class { get = mocks.usersGet; updatePrefs = mocks.usersUpdatePrefs; }
}));

vi.mock('$lib/server/teams', () => ({
  NGO_TEAM_ID: 'team-ngo',
  VOLUNTEER_TEAM_ID: 'team-vol',
  addUserToTeam: mocks.addUserToTeam,
  removeUserFromTeam: mocks.removeUserFromTeam
}));
vi.mock('$lib/server/verifications', () => ({
  withdrawVerification: mocks.withdrawVerification,
  setUserVerificationPref: mocks.setUserVerificationPref
}));
vi.mock('$lib/server/appwrite', () => ({ setTasksVerifiedForOrg: mocks.setTasksVerifiedForOrg }));

import { POST } from '../../routes/api/profile/role/+server';

function makeEvent(opts: { userId?: string | null; jwt?: string; body?: unknown }) {
  const headers = new Map<string, string>();
  if (opts.jwt) headers.set('authorization', `Bearer ${opts.jwt}`);
  return {
    locals: { session: opts.userId ? { user: { id: opts.userId } } : null },
    request: {
      json: async () => {
        if (opts.body === undefined) throw new Error('no body');
        return opts.body;
      },
      headers: { get: (k: string) => headers.get(k.toLowerCase()) ?? null }
    }
  } as unknown as import("@sveltejs/kit").RequestEvent;
}

describe('POST /api/profile/role', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset?.() ?? m.mockClear?.());
    // Reset the simulated user prefs.
    Object.keys(AppwriteCtors.userPrefs).forEach((k) => delete AppwriteCtors.userPrefs[k]);
    mocks.usersGet.mockImplementation(async () => ({ prefs: { ...AppwriteCtors.userPrefs } }));
    mocks.usersUpdatePrefs.mockImplementation(async (_id: string, p: Record<string, unknown>) => {
      Object.keys(AppwriteCtors.userPrefs).forEach((k) => delete AppwriteCtors.userPrefs[k]);
      Object.assign(AppwriteCtors.userPrefs, p);
    });
  });

  it('returns 401 with neither session nor JWT', async () => {
    const res = await POST(makeEvent({ body: { newRole: 'ngo' } }));
    expect(res.status).toBe(401);
    expect(mocks.usersUpdatePrefs).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid newRole', async () => {
    const res = await POST(makeEvent({ userId: 'u1', body: { newRole: 'staff' } }));
    expect(res.status).toBe(400);
    expect(mocks.usersUpdatePrefs).not.toHaveBeenCalled();
  });

  it('returns 400 for missing body', async () => {
    const res = await POST(makeEvent({ userId: 'u1' }));
    expect(res.status).toBe(400);
  });

  it('volunteer → ngo: swaps teams and updates prefs without firing cleanup', async () => {
    AppwriteCtors.userPrefs.role = 'volunteer';

    const res = await POST(makeEvent({ userId: 'u1', body: { newRole: 'ngo' } }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.role).toBe('ngo');
    expect(body.downgraded).toBe(false);
    expect(body.tasksUpdated).toBe(0);
    expect(mocks.removeUserFromTeam).toHaveBeenCalledWith('u1', 'team-vol');
    expect(mocks.addUserToTeam).toHaveBeenCalledWith('u1', 'team-ngo', ['ngo']);
    // No verification cleanup runs on upgrade.
    expect(mocks.withdrawVerification).not.toHaveBeenCalled();
    expect(mocks.setTasksVerifiedForOrg).not.toHaveBeenCalled();
    // Prefs reflect new role.
    expect(AppwriteCtors.userPrefs.role).toBe('ngo');
  });

  it('ngo → volunteer: triggers full cleanup transaction', async () => {
    AppwriteCtors.userPrefs.role = 'ngo';
    AppwriteCtors.userPrefs.verificationStatus = 'approved';
    mocks.setTasksVerifiedForOrg.mockResolvedValue(5);
    mocks.withdrawVerification.mockResolvedValue(true);

    const res = await POST(makeEvent({ userId: 'u1', body: { newRole: 'volunteer' } }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.downgraded).toBe(true);
    expect(body.tasksUpdated).toBe(5);

    expect(mocks.withdrawVerification).toHaveBeenCalledWith('u1');
    expect(mocks.setTasksVerifiedForOrg).toHaveBeenCalledWith('u1', false);
    expect(mocks.setUserVerificationPref).toHaveBeenCalledWith('u1', null);

    expect(mocks.removeUserFromTeam).toHaveBeenCalledWith('u1', 'team-ngo');
    expect(mocks.addUserToTeam).toHaveBeenCalledWith('u1', 'team-vol', ['volunteer']);

    // Prefs role flipped and verificationStatus blanked.
    expect(AppwriteCtors.userPrefs.role).toBe('volunteer');
    expect(AppwriteCtors.userPrefs.verificationStatus).toBe('');
  });

  it('idempotent: same-role call still reconciles teams without cleanup', async () => {
    AppwriteCtors.userPrefs.role = 'volunteer';

    const res = await POST(makeEvent({ userId: 'u1', body: { newRole: 'volunteer' } }));

    expect(res.status).toBe(200);
    expect(mocks.withdrawVerification).not.toHaveBeenCalled();
    // Team reconciliation still runs (so the user can recover from a stale state).
    expect(mocks.addUserToTeam).toHaveBeenCalledWith('u1', 'team-vol', ['volunteer']);
  });

  it('returns 200 even when team reconciliation throws (prefs already saved)', async () => {
    AppwriteCtors.userPrefs.role = 'volunteer';
    mocks.addUserToTeam.mockRejectedValue(new Error('teams API down'));

    const res = await POST(makeEvent({ userId: 'u1', body: { newRole: 'ngo' } }));

    expect(res.status).toBe(200);
    // Prefs persisted before the team call failed.
    expect(AppwriteCtors.userPrefs.role).toBe('ngo');
  });

  it('returns 500 when prefs update fails', async () => {
    AppwriteCtors.userPrefs.role = 'volunteer';
    mocks.usersUpdatePrefs.mockRejectedValue(new Error('write blocked'));

    const res = await POST(makeEvent({ userId: 'u1', body: { newRole: 'ngo' } }));
    expect(res.status).toBe(500);
  });

  it('returns 404 when target user is not found', async () => {
    mocks.usersGet.mockRejectedValue(new Error('not found'));
    const res = await POST(makeEvent({ userId: 'ghost', body: { newRole: 'ngo' } }));
    expect(res.status).toBe(404);
  });
});
