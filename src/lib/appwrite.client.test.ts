import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const { mocks, publicEnvState } = vi.hoisted(() => ({
  mocks: {
    createEmailPasswordSession: vi.fn(),
    create: vi.fn(),
    createRecovery: vi.fn(),
    updateRecovery: vi.fn(),
    updatePrefs: vi.fn(),
    createOAuth2Token: vi.fn(),
    deleteSessions: vi.fn(),
    createJWT: vi.fn(),
    getFilePreview: vi.fn()
  },
  publicEnvState: {} as Record<string, string | undefined>
}));

vi.mock('$env/static/public', () => ({
  PUBLIC_APPWRITE_ENDPOINT: 'https://fake.appwrite.io/v1',
  PUBLIC_APPWRITE_PROJECT_ID: 'proj'
}));
vi.mock('$env/dynamic/public', () => ({
  env: new Proxy(publicEnvState, { get: (_, key: string) => publicEnvState[key] })
}));
vi.mock('appwrite', () => ({
  Client: class {
    setEndpoint() { return this; }
    setProject() { return this; }
  },
  Account: class {
    createEmailPasswordSession = mocks.createEmailPasswordSession;
    create = mocks.create;
    createRecovery = mocks.createRecovery;
    updateRecovery = mocks.updateRecovery;
    updatePrefs = mocks.updatePrefs;
    createOAuth2Token = mocks.createOAuth2Token;
    deleteSessions = mocks.deleteSessions;
    createJWT = mocks.createJWT;
  },
  Storage: class {
    getFilePreview = mocks.getFilePreview;
  },
  ID: { unique: () => 'unique-id' },
  OAuthProvider: { Google: 'google' }
}));

import {
  signInEmail,
  signUpEmail,
  createRecovery,
  updateRecovery,
  signInWithGoogle,
  signOut,
  getJWT,
  authHeader,
  refreshSessionCookie,
  assignTeamForCurrentRole,
  uploadAvatar,
  getAvatarUrl
} from './appwrite.client';

describe('appwrite.client', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
    for (const key of Object.keys(publicEnvState)) delete publicEnvState[key];
    vi.unstubAllGlobals();
    vi.stubGlobal('window', { location: { origin: 'https://micromatch.tech' } });
    vi.stubGlobal('localStorage', {
      removeItem: vi.fn(),
      getItem: vi.fn(),
      setItem: vi.fn()
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('signInEmail delegates to account.createEmailPasswordSession', async () => {
    mocks.createEmailPasswordSession.mockResolvedValue({ $id: 'sess-1' });
    const result = await signInEmail('jane@example.com', 'hunter2');
    expect(mocks.createEmailPasswordSession).toHaveBeenCalledWith('jane@example.com', 'hunter2');
    expect(result).toEqual({ $id: 'sess-1' });
  });

  it('signUpEmail creates the account, logs in, then sets the role pref', async () => {
    mocks.create.mockResolvedValue({ $id: 'user-1' });
    mocks.createEmailPasswordSession.mockResolvedValue({ $id: 'sess-1' });
    mocks.updatePrefs.mockResolvedValue(undefined);

    await signUpEmail('jane@example.com', 'hunter2', 'Jane', 'ngo');

    expect(mocks.create).toHaveBeenCalledWith('unique-id', 'jane@example.com', 'hunter2', 'Jane');
    expect(mocks.createEmailPasswordSession).toHaveBeenCalledWith('jane@example.com', 'hunter2');
    expect(mocks.updatePrefs).toHaveBeenCalledWith({ role: 'ngo' });
  });

  it('signUpEmail defaults role to volunteer', async () => {
    mocks.create.mockResolvedValue({ $id: 'user-1' });
    mocks.createEmailPasswordSession.mockResolvedValue({ $id: 'sess-1' });

    await signUpEmail('jane@example.com', 'hunter2');

    expect(mocks.updatePrefs).toHaveBeenCalledWith({ role: 'volunteer' });
  });

  it('createRecovery/updateRecovery delegate to the account SDK', async () => {
    await createRecovery('jane@example.com', 'https://micromatch.tech/reset');
    expect(mocks.createRecovery).toHaveBeenCalledWith('jane@example.com', 'https://micromatch.tech/reset');

    await updateRecovery('user-1', 'secret', 'new-password');
    expect(mocks.updateRecovery).toHaveBeenCalledWith('user-1', 'secret', 'new-password');
  });

  it('signInWithGoogle builds success/failure URLs from window.location.origin', () => {
    signInWithGoogle();
    expect(mocks.createOAuth2Token).toHaveBeenCalledWith(
      'google',
      'https://micromatch.tech/api/auth/oauth/callback',
      'https://micromatch.tech/login?error=oauth'
    );
  });

  it('getJWT returns the jwt string, or null on error', async () => {
    mocks.createJWT.mockResolvedValue({ jwt: 'abc.def.ghi' });
    expect(await getJWT()).toBe('abc.def.ghi');

    mocks.createJWT.mockRejectedValue(new Error('no session'));
    expect(await getJWT()).toBeNull();
  });

  it('authHeader returns an Authorization header when a JWT is available, else {}', async () => {
    mocks.createJWT.mockResolvedValue({ jwt: 'abc.def.ghi' });
    expect(await authHeader()).toEqual({ Authorization: 'Bearer abc.def.ghi' });

    mocks.createJWT.mockRejectedValue(new Error('no session'));
    expect(await authHeader()).toEqual({});
  });

  it('signOut tolerates each step failing independently and still calls all three', async () => {
    mocks.deleteSessions.mockRejectedValue(new Error('no session to delete'));
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(signOut()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({ method: 'POST' }));
  });

  it('signOut clears the browser session after successful server cleanup', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await signOut();

    expect(mocks.deleteSessions).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(localStorage.removeItem).toHaveBeenCalledWith('mm_has_session');
  });

  it('refreshSessionCookie posts the JWT to the session endpoint', async () => {
    mocks.createJWT.mockResolvedValue({ jwt: 'abc.def.ghi' });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await refreshSessionCookie();

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/session', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ jwt: 'abc.def.ghi' })
    }));
  });

  it('refreshSessionCookie is a no-op when there is no JWT', async () => {
    mocks.createJWT.mockRejectedValue(new Error('no session'));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await refreshSessionCookie();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refreshSessionCookie ignores a session-endpoint failure', async () => {
    mocks.createJWT.mockResolvedValue({ jwt: 'abc.def.ghi' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    await expect(refreshSessionCookie()).resolves.toBeUndefined();
  });

  it('assignTeamForCurrentRole posts with the auth header when a JWT is available', async () => {
    mocks.createJWT.mockResolvedValue({ jwt: 'abc.def.ghi' });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await assignTeamForCurrentRole();

    expect(fetchMock).toHaveBeenCalledWith('/api/teams/assign', {
      method: 'POST',
      headers: { Authorization: 'Bearer abc.def.ghi' }
    });
  });

  it('assignTeamForCurrentRole is a no-op when there is no JWT', async () => {
    mocks.createJWT.mockRejectedValue(new Error('no session'));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await assignTeamForCurrentRole();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('assignTeamForCurrentRole ignores a team-assignment failure', async () => {
    mocks.createJWT.mockResolvedValue({ jwt: 'abc.def.ghi' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    await expect(assignTeamForCurrentRole()).resolves.toBeUndefined();
  });

  it('uploadAvatar posts multipart form data and returns fileId/url on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ fileId: 'file-1', url: 'https://cdn/file-1' })
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('FormData', class {
      appended: Record<string, unknown> = {};
      append(k: string, v: unknown) { this.appended[k] = v; }
    });

    const file = { name: 'avatar.png' } as unknown as File;
    const result = await uploadAvatar(file);

    expect(result).toEqual({ fileId: 'file-1', url: 'https://cdn/file-1' });
    expect(fetchMock).toHaveBeenCalledWith('/api/profile/avatar', expect.objectContaining({ method: 'POST' }));
  });

  it('uploadAvatar throws with the server error message on failure', async () => {
    vi.stubGlobal('FormData', class { append() { } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'File too large' })
    }));

    await expect(uploadAvatar({} as File)).rejects.toThrow('File too large');

    // Server returns error with non-JSON or missing error property
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => { throw new Error('bad json'); }
    }));
    await expect(uploadAvatar({} as File)).rejects.toThrow('Upload failed');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: '' })
    }));
    await expect(uploadAvatar({} as File)).rejects.toThrow('Upload failed');
  });

  it('getJWT returns null when jwt property is missing in response', async () => {

    mocks.createJWT.mockResolvedValue({});
    expect(await getJWT()).toBeNull();
  });


  it('getAvatarUrl returns empty string when the bucket id is not configured', () => {
    expect(getAvatarUrl('file-1')).toBe('');
    expect(mocks.getFilePreview).not.toHaveBeenCalled();
  });

  it('getAvatarUrl builds a preview URL when the bucket id is configured', () => {
    publicEnvState.PUBLIC_APPWRITE_AVATARS_BUCKET_ID = 'avatars-bucket';
    mocks.getFilePreview.mockReturnValue('https://cdn/avatars/file-1');

    const url = getAvatarUrl('file-1', 64);

    expect(mocks.getFilePreview).toHaveBeenCalledWith('avatars-bucket', 'file-1', 64, 64);
    expect(url).toBe('https://cdn/avatars/file-1');
  });

  it('getAvatarUrl uses the default square preview size', () => {
    publicEnvState.PUBLIC_APPWRITE_AVATARS_BUCKET_ID = 'avatars-bucket';
    mocks.getFilePreview.mockReturnValue('https://cdn/avatars/file-1');

    expect(getAvatarUrl('file-1')).toBe('https://cdn/avatars/file-1');
    expect(mocks.getFilePreview).toHaveBeenCalledWith('avatars-bucket', 'file-1', 128, 128);
  });

  it('getAvatarUrl returns empty string if getFilePreview throws', () => {
    publicEnvState.PUBLIC_APPWRITE_AVATARS_BUCKET_ID = 'avatars-bucket';
    mocks.getFilePreview.mockImplementation(() => { throw new Error('bad file id'); });

    expect(getAvatarUrl('file-1')).toBe('');
  });
});
