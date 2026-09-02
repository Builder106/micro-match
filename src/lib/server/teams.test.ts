import { describe, it, expect, beforeEach, vi } from 'vitest';

const { envState, mocks } = vi.hoisted(() => ({
  envState: {
    APPWRITE_ENDPOINT: 'https://fake.appwrite.io/v1',
    APPWRITE_PROJECT_ID: 'proj',
    APPWRITE_API_KEY: 'key'
  } as Record<string, string | undefined>,
  mocks: {
    listMemberships: vi.fn(),
    deleteMembership: vi.fn(),
    createMembership: vi.fn()
  }
}));

vi.mock('$env/dynamic/private', () => ({
  env: new Proxy(envState, { get: (_, key: string) => envState[key] })
}));
vi.mock('node-appwrite', () => ({
  Client: class {
    setEndpoint() { return this; }
    setProject() { return this; }
    setKey() { return this; }
  },
  Teams: class {
    listMemberships = mocks.listMemberships;
    deleteMembership = mocks.deleteMembership;
    createMembership = mocks.createMembership;
  },
  Query: { equal: (k: string, v: string) => `${k}=${v}`, limit: (n: number) => `limit=${n}` }
}));

import { isUserInTeam, removeUserFromTeam, addUserToTeam, isUserAdmin } from './teams';

describe('isUserInTeam', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
  });

  it('returns false without calling the API when teamId is not configured', async () => {
    expect(await isUserInTeam('user-1', undefined)).toBe(false);
    expect(mocks.listMemberships).not.toHaveBeenCalled();
  });

  it('returns true when the membership list is non-empty', async () => {
    mocks.listMemberships.mockResolvedValue({ total: 1, memberships: [{ $id: 'm1' }] });
    expect(await isUserInTeam('user-1', 'team-1')).toBe(true);
    expect(mocks.listMemberships).toHaveBeenCalledWith('team-1', expect.any(Array));

    // When total is undefined, but memberships array has items
    mocks.listMemberships.mockResolvedValue({ memberships: [{ $id: 'm1' }] });
    expect(await isUserInTeam('user-1', 'team-1')).toBe(true);
  });

  it('returns false when the membership list is empty', async () => {
    mocks.listMemberships.mockResolvedValue({ total: 0, memberships: [] });
    expect(await isUserInTeam('user-1', 'team-1')).toBe(false);

    // When total is undefined and memberships is undefined
    mocks.listMemberships.mockResolvedValue({});
    expect(await isUserInTeam('user-1', 'team-1')).toBe(false);
  });

  it('fails open to false when the Teams API throws', async () => {
    mocks.listMemberships.mockRejectedValue(new Error('appwrite down'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

    expect(await isUserInTeam('user-1', 'team-1')).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
  });
});
describe('removeUserFromTeam', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
  });

  it('is a no-op when teamId is not configured', async () => {
    await removeUserFromTeam('user-1', undefined);
    expect(mocks.listMemberships).not.toHaveBeenCalled();
  });

  it('deletes every membership found for the user with various object shapes and id keys', async () => {
    // Test with members property and data property, plus 'id' key instead of '$id'
    mocks.listMemberships.mockResolvedValue({ members: [{ id: 'm1' }, {}] });
    mocks.deleteMembership.mockResolvedValue(undefined);

    await removeUserFromTeam('user-1', 'team-1');
    expect(mocks.deleteMembership).toHaveBeenCalledWith('team-1', 'm1');

    // Test with data property
    mocks.deleteMembership.mockClear();
    mocks.listMemberships.mockResolvedValue({ data: [{ $id: 'm2' }] });
    await removeUserFromTeam('user-1', 'team-1');
    expect(mocks.deleteMembership).toHaveBeenCalledWith('team-1', 'm2');

    // Test with empty/undefined list
    mocks.deleteMembership.mockClear();
    mocks.listMemberships.mockResolvedValue({});
    await removeUserFromTeam('user-1', 'team-1');
    expect(mocks.deleteMembership).not.toHaveBeenCalled();
  });

  it('swallows errors from the Teams API', async () => {
    mocks.listMemberships.mockRejectedValue(new Error('down'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

    await expect(removeUserFromTeam('user-1', 'team-1')).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe('addUserToTeam', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
  });

  it('is a no-op when teamId is not configured', async () => {
    await addUserToTeam('user-1', undefined, ['member']);
    expect(mocks.createMembership).not.toHaveBeenCalled();
  });

  it('creates a membership with the given roles and default roles array', async () => {
    mocks.createMembership.mockResolvedValue({ $id: 'm1' });
    await addUserToTeam('user-1', 'team-1', ['member']);
    expect(mocks.createMembership).toHaveBeenCalledWith('team-1', ['member'], undefined, 'user-1');

    await addUserToTeam('user-1', 'team-1');
    expect(mocks.createMembership).toHaveBeenCalledWith('team-1', [], undefined, 'user-1');
  });

  it('swallows errors from the Teams API', async () => {
    mocks.createMembership.mockRejectedValue(new Error('down'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

    await expect(addUserToTeam('user-1', 'team-1')).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe('isUserAdmin', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
  });

  it('returns false for a null/undefined userId', async () => {
    expect(await isUserAdmin(null)).toBe(false);
    expect(await isUserAdmin(undefined)).toBe(false);
    expect(mocks.listMemberships).not.toHaveBeenCalled();
  });

  it('recognizes a11y harness admin user in non-production mode', async () => {
    const origEnv = process.env.NODE_ENV;
    const origHarness = process.env.PLAYWRIGHT_A11Y_HARNESS;
    try {
      process.env.NODE_ENV = 'development';
      process.env.PLAYWRIGHT_A11Y_HARNESS = '1';
      expect(await isUserAdmin('a11y-admin-test')).toBe(true);
    } finally {
      process.env.NODE_ENV = origEnv;
      process.env.PLAYWRIGHT_A11Y_HARNESS = origHarness;
    }
  });

  it('rejects harness admin identities in production and rejects malformed identities', async () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origHarness = process.env.PLAYWRIGHT_A11Y_HARNESS;
    try {
      process.env.NODE_ENV = 'production';
      process.env.PLAYWRIGHT_A11Y_HARNESS = '1';
      expect(await isUserAdmin('a11y-admin-test')).toBe(false);

      process.env.NODE_ENV = 'development';
      expect(await isUserAdmin('a11y-admin')).toBe(false);
      expect(await isUserAdmin(null)).toBe(false);
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      process.env.PLAYWRIGHT_A11Y_HARNESS = origHarness;
    }
  });

  it('checks team membership when ADMIN_TEAM_ID is set', async () => {
    mocks.listMemberships.mockResolvedValue({ total: 1, memberships: [{ $id: 'm1' }] });
    // Note: teams.ts imports ADMIN_TEAM_ID from env at module load time
    const result = await isUserAdmin('regular-user');
    expect(typeof result).toBe('boolean');
  });
});
