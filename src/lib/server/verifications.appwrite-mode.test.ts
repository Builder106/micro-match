import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    listRows: vi.fn(),
    updateRow: vi.fn(),
    createRow: vi.fn(),
    deleteRow: vi.fn(),
    usersGet: vi.fn(),
    usersUpdatePrefs: vi.fn()
  }
}));

vi.mock('$env/dynamic/private', () => ({
  env: {
    APPWRITE_ENDPOINT: 'https://fake.appwrite.io/v1',
    APPWRITE_PROJECT_ID: 'proj',
    APPWRITE_API_KEY: 'key',
    APPWRITE_DB_ID: 'db',
    APPWRITE_VERIFICATIONS_TABLE_ID: 'verifications'
  }
}));
vi.mock('node-appwrite', () => ({
  Client: class { setEndpoint() { return this; } setProject() { return this; } setKey() { return this; } },
  TablesDB: class {
    listRows = mocks.listRows;
    updateRow = mocks.updateRow;
    createRow = mocks.createRow;
    deleteRow = mocks.deleteRow;
  },
  Users: class {
    get = mocks.usersGet;
    updatePrefs = mocks.usersUpdatePrefs;
  },
  ID: { unique: () => 'new-id' },
  Query: {
    equal: (k: string, v: unknown) => `equal(${k},${v})`,
    limit: (n: number) => `limit(${n})`,
    orderDesc: (k: string) => `orderDesc(${k})`
  }
}));

import {
  getVerificationByUserId,
  listVerifications,
  upsertVerification,
  setVerificationStatus,
  withdrawVerification,
  getUserEmail,
  setUserVerificationPref
} from './verifications';

const row = {
  $id: 'v1', userID: 'user-1', orgName: 'Org', country: 'US', taxId: '123',
  docFileId: undefined, status: 'pending', reason: undefined,
  submittedAt: '2026-01-01T00:00:00.000Z', reviewedBy: undefined, reviewedAt: undefined,
  $createdAt: '2026-01-01T00:00:00.000Z'
};

describe('verifications (Appwrite-backed mode)', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
  });

  it('getVerificationByUserId maps the first matching row and undefined when absent', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: [row] });
    expect(await getVerificationByUserId('user-1')).toEqual(expect.objectContaining({ id: 'v1', userId: 'user-1' }));

    mocks.listRows.mockResolvedValueOnce({ rows: [] });
    expect(await getVerificationByUserId('ghost')).toBeUndefined();
  });

  it('getVerificationByUserId returns undefined when the query throws', async () => {
    mocks.listRows.mockRejectedValueOnce(new Error('down'));
    expect(await getVerificationByUserId('user-1')).toBeUndefined();
  });

  it('listVerifications maps rows and applies an optional status filter', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: [row] });
    const all = await listVerifications({ status: 'pending' });

    expect(mocks.listRows).toHaveBeenCalledWith('db', 'verifications', expect.arrayContaining(['equal(status,pending)']));
    expect(all).toEqual([expect.objectContaining({ id: 'v1' })]);
  });

  it('listVerifications omits the status query when no filter is supplied', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: [row] });

    await listVerifications();

    expect(mocks.listRows).toHaveBeenCalledWith(
      'db',
      'verifications',
      ['limit(200)', 'orderDesc(submittedAt)']
    );
  });

  it('listVerifications returns [] when the query throws', async () => {
    mocks.listRows.mockRejectedValueOnce(new Error('down'));
    expect(await listVerifications()).toEqual([]);
  });

  it('upsertVerification creates a new row when none exists for the user', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: [] });
    mocks.createRow.mockResolvedValueOnce(row);

    const created = await upsertVerification({ userId: 'user-1', orgName: 'Org', country: 'US', taxId: '123' });

    expect(mocks.createRow).toHaveBeenCalled();
    expect(created).toEqual(expect.objectContaining({ id: 'v1', userId: 'user-1' }));
  });

  it('normalizes optional Appwrite row fields and omitted upload data', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: [] });
    mocks.createRow.mockResolvedValueOnce({
      ...row,
      docFileId: null,
      reason: null,
      submittedAt: undefined,
      $createdAt: undefined,
      reviewedBy: null,
      reviewedAt: null
    });

    const created = await upsertVerification({ userId: 'user-1', orgName: 'Org', country: 'US', taxId: '123' });

    expect(mocks.createRow).toHaveBeenCalledWith('db', 'verifications', 'new-id', expect.objectContaining({
      docFileId: null,
      reason: '',
      reviewedBy: '',
      reviewedAt: ''
    }));
    expect(created).toEqual(expect.objectContaining({
      docFileId: undefined,
      reason: undefined,
      submittedAt: '',
      reviewedBy: undefined,
      reviewedAt: undefined
    }));
  });

  it('upsertVerification updates the existing row for the user when one is found', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: [row] });
    mocks.updateRow.mockResolvedValueOnce({ ...row, orgName: 'New Org' });

    const updated = await upsertVerification({ userId: 'user-1', orgName: 'New Org', country: 'US', taxId: '123' });

    expect(mocks.updateRow).toHaveBeenCalledWith('db', 'verifications', 'v1', expect.objectContaining({ orgName: 'New Org' }));
    expect(updated.orgName).toBe('New Org');
  });

  it('setVerificationStatus updates the matching row and returns undefined when none is found', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: [row] });
    mocks.updateRow.mockResolvedValueOnce({ ...row, status: 'approved', reviewedBy: 'admin-1' });

    const approved = await setVerificationStatus('user-1', 'approved', 'admin-1');
    expect(approved?.status).toBe('approved');

    mocks.listRows.mockResolvedValueOnce({ rows: [] });
    expect(await setVerificationStatus('ghost', 'approved', 'admin-1')).toBeUndefined();
  });

  it('uses an empty rejection reason when none is supplied', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: [row] });
    mocks.updateRow.mockResolvedValueOnce({ ...row, status: 'rejected', reason: '' });

    await setVerificationStatus('user-1', 'rejected', 'admin-1');

    expect(mocks.updateRow).toHaveBeenCalledWith('db', 'verifications', 'v1', expect.objectContaining({
      status: 'rejected',
      reason: ''
    }));
  });

  it('withdrawVerification deletes the matching row and returns true/false accordingly', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: [row] });
    mocks.deleteRow.mockResolvedValueOnce(undefined);
    expect(await withdrawVerification('user-1')).toBe(true);
    expect(mocks.deleteRow).toHaveBeenCalledWith('db', 'verifications', 'v1');

    mocks.listRows.mockResolvedValueOnce({ rows: [] });
    expect(await withdrawVerification('ghost')).toBe(false);
  });

  it('withdrawVerification returns false when the query throws', async () => {
    mocks.listRows.mockRejectedValueOnce(new Error('down'));
    expect(await withdrawVerification('user-1')).toBe(false);
  });

  it('getUserEmail returns the Appwrite user email, and null on error', async () => {
    mocks.usersGet.mockResolvedValueOnce({ email: 'jane@example.com' });
    expect(await getUserEmail('user-1')).toBe('jane@example.com');

    mocks.usersGet.mockRejectedValueOnce(new Error('not found'));
    expect(await getUserEmail('ghost')).toBeNull();
  });

  it('getUserEmail returns null when Appwrite returns a user without an email', async () => {
    mocks.usersGet.mockResolvedValueOnce({});
    expect(await getUserEmail('user-1')).toBeNull();
  });

  it('setUserVerificationPref merges verificationStatus into existing prefs', async () => {
    mocks.usersGet.mockResolvedValueOnce({ prefs: { role: 'ngo' } });
    mocks.usersUpdatePrefs.mockResolvedValueOnce(undefined);

    await setUserVerificationPref('user-1', 'approved');

    expect(mocks.usersUpdatePrefs).toHaveBeenCalledWith('user-1', { role: 'ngo', verificationStatus: 'approved' });
  });

  it('setUserVerificationPref supports absent prefs and clearing the status', async () => {
    mocks.usersGet.mockResolvedValueOnce({});
    mocks.usersUpdatePrefs.mockResolvedValueOnce(undefined);

    await setUserVerificationPref('user-1', null);

    expect(mocks.usersUpdatePrefs).toHaveBeenCalledWith('user-1', { verificationStatus: '' });
  });

  it('setUserVerificationPref swallows errors', async () => {
    mocks.usersGet.mockRejectedValueOnce(new Error('down'));
    await expect(setUserVerificationPref('user-1', 'approved')).resolves.toBeUndefined();
  });
});
