import { describe, it, expect, beforeEach, vi } from 'vitest';

const { envState, mocks } = vi.hoisted(() => ({
  envState: {} as Record<string, string | undefined>,
  mocks: {
    accountGet: vi.fn(),
    createFile: vi.fn(),
    getFilePreview: vi.fn()
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
  Storage: class {
    createFile = mocks.createFile;
    getFilePreview = mocks.getFilePreview;
  },
  ID: { unique: () => 'file-id' },
  Permission: { read: (r: string) => `read:${r}`, update: (r: string) => `update:${r}`, delete: (r: string) => `delete:${r}` },
  Role: { any: () => 'any', user: (id: string) => `user:${id}` }
}));

import { POST } from '../../routes/api/profile/avatar/+server';

function makeEvent(opts: { userId?: string | null; authorization?: string; file?: File | null } = {}) {
  const form = new FormData();
  if (opts.file !== null) {
    form.set('file', opts.file ?? new File(['x'], 'avatar.png', { type: 'image/png' }));
  }
  return {
    locals: opts.userId ? { session: { user: { id: opts.userId } } } : {},
    request: {
      headers: new Headers(opts.authorization ? { authorization: opts.authorization } : {}),
      formData: async () => form
    }
  } as unknown as import("@sveltejs/kit").RequestEvent;
}

describe('POST /api/profile/avatar', () => {
  beforeEach(() => {
    for (const key of Object.keys(envState)) delete envState[key];
    Object.values(mocks).forEach((m) => m.mockReset());
    envState.APPWRITE_AVATARS_BUCKET_ID = 'avatars';
    mocks.createFile.mockResolvedValue({ $id: 'file-1' });
    mocks.getFilePreview.mockReturnValue('https://cdn/file-1');
  });

  it('returns 401 when there is no session and no bearer JWT', async () => {
    const res = await POST(makeEvent());
    expect(res.status).toBe(401);
  });

  it('resolves userId from a bearer JWT when there is no session', async () => {
    mocks.accountGet.mockResolvedValue({ $id: 'user-1' });
    const res = await POST(makeEvent({ authorization: 'Bearer good-jwt' }));
    expect(res.status).toBe(200);
  });

  it('returns 500 when the avatar bucket is not configured', async () => {
    delete envState.APPWRITE_AVATARS_BUCKET_ID;
    const res = await POST(makeEvent({ userId: 'user-1' }));
    expect(res.status).toBe(500);
  });

  it('returns 400 when no file is present in the form', async () => {
    const res = await POST(makeEvent({ userId: 'user-1', file: null }));
    expect(res.status).toBe(400);
  });

  it('uploads the file and returns fileId + preview url', async () => {
    const res = await POST(makeEvent({ userId: 'user-1' }));
    const body = await res.json();

    expect(mocks.createFile).toHaveBeenCalledWith('avatars', 'file-id', expect.anything(), expect.any(Array));
    expect(body).toEqual({ fileId: 'file-1', url: 'https://cdn/file-1' });
  });

  it('returns 500 when the upload throws', async () => {
    mocks.createFile.mockRejectedValue(new Error('storage down'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await POST(makeEvent({ userId: 'user-1' }));
    expect(res.status).toBe(500);
    errSpy.mockRestore();
  });
});
