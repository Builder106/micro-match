import { describe, it, expect, beforeEach, vi } from 'vitest';

const { envState, mocks } = vi.hoisted(() => ({
  envState: {} as Record<string, string | undefined>,
  mocks: {
    isUserAdmin: vi.fn(),
    getVerificationByUserId: vi.fn(),
    getFileDownload: vi.fn()
  }
}));

vi.mock('$env/dynamic/private', () => ({
  env: new Proxy(envState, { get: (_, key: string) => envState[key] })
}));
vi.mock('$lib/server/teams', () => ({ isUserAdmin: mocks.isUserAdmin }));
vi.mock('$lib/server/verifications', () => ({ getVerificationByUserId: mocks.getVerificationByUserId }));
vi.mock('node-appwrite', () => ({
  Client: class { setEndpoint() { return this; } setProject() { return this; } setKey() { return this; } },
  Storage: class { getFileDownload = mocks.getFileDownload; }
}));

import { GET } from '../../routes/api/verifications/[userId]/document/+server';

function makeEvent(opts: { adminId?: string | null; targetUserId?: string } = {}) {
  return {
    locals: opts.adminId ? { session: { user: { id: opts.adminId } } } : {},
    params: { userId: opts.targetUserId ?? 'target-1' }
  } as unknown as import("@sveltejs/kit").RequestEvent;
}

async function expectHttpError(promise: unknown, status: number) {
  try {
    await promise;
    throw new Error('expected an error() to be thrown');
  } catch (err: unknown) {
    const e = err as { status?: number };
    expect(e.status).toBe(status);
  }
}

describe('GET /api/verifications/[userId]/document', () => {
  beforeEach(() => {
    for (const key of Object.keys(envState)) delete envState[key];
    Object.values(mocks).forEach((m) => m.mockReset());
    envState.APPWRITE_VERIFICATIONS_BUCKET_ID = 'verif-bucket';
    envState.APPWRITE_ENDPOINT = 'https://fake.appwrite.io/v1';
    envState.APPWRITE_PROJECT_ID = 'proj';
    envState.APPWRITE_API_KEY = 'key';
  });

  it('403s when there is no session', async () => {
    await expectHttpError(GET(makeEvent()), 403);
  });

  it('403s when the caller is not an admin', async () => {
    mocks.isUserAdmin.mockResolvedValue(false);
    await expectHttpError(GET(makeEvent({ adminId: 'user-1' })), 403);
  });

  it('404s when the target user has no verification document on file', async () => {
    mocks.isUserAdmin.mockResolvedValue(true);
    mocks.getVerificationByUserId.mockResolvedValue({ id: 'v1', docFileId: undefined });
    await expectHttpError(GET(makeEvent({ adminId: 'admin-1' })), 404);
  });

  it('500s when the verifications bucket is not configured', async () => {
    delete envState.APPWRITE_VERIFICATIONS_BUCKET_ID;
    mocks.isUserAdmin.mockResolvedValue(true);
    mocks.getVerificationByUserId.mockResolvedValue({ id: 'v1', docFileId: 'file-1' });
    await expectHttpError(GET(makeEvent({ adminId: 'admin-1' })), 500);
  });

  it('streams the document bytes with the expected headers', async () => {
    mocks.isUserAdmin.mockResolvedValue(true);
    mocks.getVerificationByUserId.mockResolvedValue({ id: 'v1', docFileId: 'file-1' });
    mocks.getFileDownload.mockResolvedValue(new Uint8Array([1, 2, 3]));

    const res = await GET(makeEvent({ adminId: 'admin-1', targetUserId: 'target-1' }));

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/octet-stream');
    expect(res.headers.get('Content-Disposition')).toContain('verification-target-1');
  });

  it('500s when the storage fetch throws', async () => {
    mocks.isUserAdmin.mockResolvedValue(true);
    mocks.getVerificationByUserId.mockResolvedValue({ id: 'v1', docFileId: 'file-1' });
    mocks.getFileDownload.mockRejectedValue(new Error('storage down'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expectHttpError(GET(makeEvent({ adminId: 'admin-1' })), 500);
    errSpy.mockRestore();
  });
});
