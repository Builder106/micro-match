import { describe, it, expect, beforeEach, vi } from 'vitest';

const { envState, mocks, teamState } = vi.hoisted(() => ({
  envState: {} as Record<string, string | undefined>,
  teamState: { adminTeamId: 'admins-team' },
  mocks: {
    accountGet: vi.fn(),
    createFile: vi.fn()
  }
}));

vi.mock('$env/dynamic/private', () => ({
  env: new Proxy(envState, { get: (_, key: string) => envState[key] })
}));
vi.mock('$lib/server/teams', () => ({
  get ADMIN_TEAM_ID() { return teamState.adminTeamId; }
}));
vi.mock('node-appwrite', () => ({
  Client: class {
    setEndpoint() { return this; } setProject() { return this; } setKey() { return this; } setJWT() { return this; }
  },
  Account: class { get = mocks.accountGet; },
  Storage: class { createFile = mocks.createFile; },
  ID: { unique: () => 'file-id' },
  Permission: { read: (r: string) => `read:${r}`, update: (r: string) => `update:${r}`, delete: (r: string) => `delete:${r}` },
  Role: { user: (id: string) => `user:${id}`, team: (id: string) => `team:${id}` }
}));

import { POST } from '../../routes/api/verifications/upload/+server';

function makeEvent(opts: {
  userId?: string | null; authorization?: string; file?: File | null | 'missing';
} = {}) {
  const form = new FormData();
  if (opts.file !== 'missing') {
    form.set('file', opts.file ?? new File(['x'], 'doc.pdf', { type: 'application/pdf' }));
  }
  return {
    locals: opts.userId ? { session: { user: { id: opts.userId } } } : {},
    request: {
      headers: new Headers(opts.authorization ? { authorization: opts.authorization } : {}),
      formData: async () => form
    }
  } as unknown as import("@sveltejs/kit").RequestEvent;
}

describe('POST /api/verifications/upload', () => {
  beforeEach(() => {
    for (const key of Object.keys(envState)) delete envState[key];
    teamState.adminTeamId = 'admins-team';
    Object.values(mocks).forEach((m) => m.mockReset());
    envState.APPWRITE_VERIFICATIONS_BUCKET_ID = 'verif-bucket';
    mocks.createFile.mockResolvedValue({ $id: 'file-1' });
  });

  it('returns 401 when there is no session and no bearer JWT', async () => {
    const res = await POST(makeEvent());
    expect(res.status).toBe(401);
  });

  it('authenticates via JWT bearer header when session is missing', async () => {
    mocks.accountGet.mockResolvedValue({ $id: 'jwt-user-99' });
    const res = await POST(makeEvent({ authorization: 'Bearer jwt-token' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fileId).toBe('file-1');

    mocks.accountGet.mockResolvedValue({});
    const resNoId = await POST(makeEvent({ authorization: 'Bearer jwt-token' }));
    expect(resNoId.status).toBe(401);

    // account.get() throwing error
    mocks.accountGet.mockRejectedValue(new Error('jwt bad'));
    const resErr = await POST(makeEvent({ authorization: 'Bearer jwt-token' }));
    expect(resErr.status).toBe(401);
  });




  it('returns 500 when the verifications bucket is not configured', async () => {
    delete envState.APPWRITE_VERIFICATIONS_BUCKET_ID;
    const res = await POST(makeEvent({ userId: 'user-1' }));
    expect(res.status).toBe(500);
  });

  it('returns 400 when no file is present', async () => {
    const res = await POST(makeEvent({ userId: 'user-1', file: 'missing' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when the file exceeds the 10MB cap', async () => {
    const bigFile = new File(
      [new Uint8Array(10 * 1024 * 1024 + 1)],
      'large.pdf',
      { type: 'application/pdf' }
    );
    const res = await POST(makeEvent({ userId: 'user-1', file: bigFile }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for an unsupported file type', async () => {
    const badFile = new File(['x'], 'doc.txt', { type: 'text/plain' });
    const res = await POST(makeEvent({ userId: 'user-1', file: badFile }));
    expect(res.status).toBe(400);
  });

  it('uploads the file with owner + admin-team read permissions', async () => {
    const res = await POST(makeEvent({ userId: 'user-1' }));
    const body = await res.json();

    expect(mocks.createFile).toHaveBeenCalledWith(
      'verif-bucket', 'file-id', expect.anything(),
      expect.arrayContaining(['read:team:admins-team'])
    );
    expect(body).toEqual({ fileId: 'file-1' });
  });

  it('uploads with owner permissions only when no admin team is configured', async () => {
    teamState.adminTeamId = '';

    const res = await POST(makeEvent({ userId: 'user-1' }));

    expect(res.status).toBe(200);
    expect(mocks.createFile).toHaveBeenCalledWith(
      'verif-bucket',
      'file-id',
      expect.anything(),
      ['read:user:user-1', 'update:user:user-1', 'delete:user:user-1']
    );
  });

  it('returns 500 when the upload throws', async () => {
    mocks.createFile.mockRejectedValue(new Error('down'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    const res = await POST(makeEvent({ userId: 'user-1' }));
    expect(res.status).toBe(500);
    errSpy.mockRestore();
  });
});
