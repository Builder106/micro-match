import { describe, it, expect, beforeEach, vi } from 'vitest';

const { envState, mocks } = vi.hoisted(() => ({
  envState: {} as Record<string, string | undefined>,
  mocks: {
    accountGet: vi.fn(),
    usersUpdateName: vi.fn(),
    usersGet: vi.fn(),
    usersUpdatePrefs: vi.fn()
  }
}));

vi.mock('$env/dynamic/private', () => ({
  env: new Proxy(envState, { get: (_, key: string) => envState[key] })
}));
vi.mock('node-appwrite', () => ({
  Client: class {
    setEndpoint() { return this; } setProject() { return this; } setKey() { return this; } setJWT() { return this; }
  },
  Account: class { get = mocks.accountGet; },
  Users: class {
    updateName = mocks.usersUpdateName;
    get = mocks.usersGet;
    updatePrefs = mocks.usersUpdatePrefs;
  }
}));

import { POST } from '../../routes/api/profile/update/+server';

function makeEvent(opts: { userId?: string | null; authorization?: string; body?: unknown } = {}) {
  return {
    locals: opts.userId ? { session: { user: { id: opts.userId } } } : {},
    request: {
      headers: new Headers(opts.authorization ? { authorization: opts.authorization } : {}),
      json: async () => {
        if (opts.body === undefined) throw new Error('bad json');
        return opts.body;
      }
    }
  } as unknown as import("@sveltejs/kit").RequestEvent;
}

describe('POST /api/profile/update', () => {
  beforeEach(() => {
    for (const key of Object.keys(envState)) delete envState[key];
    Object.values(mocks).forEach((m) => m.mockReset());
    mocks.usersGet.mockResolvedValue({ prefs: { role: 'ngo' } });
  });

  it('returns 401 when there is no session and no bearer JWT', async () => {
    const res = await POST(makeEvent({ body: {} }));
    expect(res.status).toBe(401);
  });

  it('resolves userId from a bearer JWT when there is no session', async () => {
    mocks.accountGet.mockResolvedValue({ $id: 'user-1' });
    const res = await POST(makeEvent({ authorization: 'Bearer good-jwt', body: { displayName: 'Jane' } }));
    expect(res.status).toBe(200);
    expect(mocks.usersUpdateName).toHaveBeenCalledWith('user-1', 'Jane');

    mocks.accountGet.mockResolvedValue({});
    const resNoId = await POST(makeEvent({ authorization: 'Bearer good-jwt', body: { displayName: 'Jane' } }));
    expect(resNoId.status).toBe(401);

    // When account.get throws
    mocks.accountGet.mockRejectedValue(new Error('jwt invalid'));
    const resErr = await POST(makeEvent({ authorization: 'Bearer good-jwt', body: { displayName: 'Jane' } }));
    expect(resErr.status).toBe(401);
  });



  it('returns 400 on invalid JSON', async () => {
    const res = await POST(makeEvent({ userId: 'user-1' }));
    expect(res.status).toBe(400);
  });

  it('updates the display name via users.updateName', async () => {
    const res = await POST(makeEvent({ userId: 'user-1', body: { displayName: '  Jane Doe  ' } }));
    expect(mocks.usersUpdateName).toHaveBeenCalledWith('user-1', 'Jane Doe');
    expect(res.status).toBe(200);
  });

  it('ignores a whitespace-only display name', async () => {
    const res = await POST(makeEvent({ userId: 'user-1', body: { displayName: '   ' } }));

    expect(res.status).toBe(200);
    expect(mocks.usersUpdateName).not.toHaveBeenCalled();
  });

  it('returns 500 when updateName fails', async () => {
    mocks.usersUpdateName.mockRejectedValue(new Error('down'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    const res = await POST(makeEvent({ userId: 'user-1', body: { displayName: 'Jane' } }));
    expect(res.status).toBe(500);
    errSpy.mockRestore();
  });

  it('does not log an updateName failure in production', async () => {
    envState.NODE_ENV = 'production';
    mocks.usersUpdateName.mockRejectedValue(new Error('down'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await POST(makeEvent({ userId: 'user-1', body: { displayName: 'Jane' } }));

    expect(res.status).toBe(500);
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('merges bio/orgName/avatarFileId into existing prefs without clobbering unrelated keys', async () => {
    mocks.usersGet.mockResolvedValue({ prefs: { role: 'ngo', verificationStatus: 'approved' } });

    const res = await POST(makeEvent({ userId: 'user-1', body: { bio: 'Hello', orgName: 'Acme', avatarFileId: 'file-1' } }));

    expect(mocks.usersUpdatePrefs).toHaveBeenCalledWith('user-1', {
      role: 'ngo', verificationStatus: 'approved', bio: 'Hello', orgName: 'Acme', avatarFileId: 'file-1'
    });
    expect(res.status).toBe(200);
  });

  it('creates preferences when none exist and updates only supplied fields', async () => {
    mocks.usersGet.mockResolvedValue({});

    const res = await POST(makeEvent({ userId: 'user-1', body: { bio: 'Hello' } }));

    expect(res.status).toBe(200);
    expect(mocks.usersUpdatePrefs).toHaveBeenCalledWith('user-1', { bio: 'Hello' });
  });

  it('updates orgName without adding an omitted bio', async () => {
    const res = await POST(makeEvent({ userId: 'user-1', body: { orgName: 'Acme' } }));

    expect(res.status).toBe(200);
    expect(mocks.usersUpdatePrefs).toHaveBeenCalledWith('user-1', {
      role: 'ngo',
      orgName: 'Acme'
    });
  });

  it('returns 500 when updatePrefs fails', async () => {
    mocks.usersUpdatePrefs.mockRejectedValue(new Error('down'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    const res = await POST(makeEvent({ userId: 'user-1', body: { bio: 'Hello' } }));
    expect(res.status).toBe(500);
    errSpy.mockRestore();
  });

  it('does not log an updatePrefs failure in production', async () => {
    envState.NODE_ENV = 'production';
    mocks.usersUpdatePrefs.mockRejectedValue(new Error('down'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await POST(makeEvent({ userId: 'user-1', body: { bio: 'Hello' } }));

    expect(res.status).toBe(500);
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('is a no-op success when the body has nothing to update', async () => {
    const res = await POST(makeEvent({ userId: 'user-1', body: {} }));
    expect(res.status).toBe(200);
    expect(mocks.usersUpdateName).not.toHaveBeenCalled();
    expect(mocks.usersUpdatePrefs).not.toHaveBeenCalled();
  });
});
