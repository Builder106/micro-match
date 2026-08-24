import { describe, it, expect, beforeEach, vi } from 'vitest';

// Force in-memory mode by mocking env to empty. With APPWRITE_* unset, the
// module's `useAppwrite` flag is false and all CRUD goes through its Map.
const { envState } = vi.hoisted(() => ({ envState: {} as Record<string, string | undefined> }));
vi.mock('$env/dynamic/private', () => ({
  env: new Proxy(envState, { get: (_, key: string) => envState[key] })
}));

// In-memory path doesn't need node-appwrite — but the module imports it lazily
// inside withAppwrite(). Stub setUserVerificationPref's Users.get to be safe.
vi.mock('node-appwrite', () => ({
  Client: class { setEndpoint() { return this; } setProject() { return this; } setKey() { return this; } },
  Users: class { get = vi.fn(); updatePrefs = vi.fn(); }
}));

import {
  upsertVerification,
  getVerificationByUserId,
  listVerifications,
  setVerificationStatus,
  withdrawVerification
} from './verifications';

describe('verifications (in-memory mode)', () => {
  beforeEach(async () => {
    // Wipe any state from previous tests by withdrawing every known userId.
    const all = await listVerifications();
    for (const v of all) await withdrawVerification(v.userId);
  });

  it('creates a new verification with status=pending and a submittedAt timestamp', async () => {
    const before = Date.now();
    const v = await upsertVerification({
      userId: 'user-1',
      orgName: 'Doctors Without Borders',
      country: 'US',
      taxId: '13-3433452'
    });
    const after = Date.now();

    expect(v.userId).toBe('user-1');
    expect(v.orgName).toBe('Doctors Without Borders');
    expect(v.country).toBe('US');
    expect(v.taxId).toBe('13-3433452');
    expect(v.status).toBe('pending');
    expect(v.reason).toBeUndefined();
    expect(v.reviewedBy).toBeUndefined();
    expect(v.reviewedAt).toBeUndefined();
    expect(new Date(v.submittedAt).getTime()).toBeGreaterThanOrEqual(before);
    expect(new Date(v.submittedAt).getTime()).toBeLessThanOrEqual(after);
  });

  it('upsert resubmission replaces the existing row and resets status to pending', async () => {
    await upsertVerification({ userId: 'user-1', orgName: 'Old Org', country: 'US', taxId: '111' });
    await setVerificationStatus('user-1', 'rejected', 'admin-1', 'wrong docs');

    const updated = await upsertVerification({
      userId: 'user-1',
      orgName: 'New Org',
      country: 'CA',
      taxId: '222'
    });

    expect(updated.orgName).toBe('New Org');
    expect(updated.country).toBe('CA');
    expect(updated.taxId).toBe('222');
    expect(updated.status).toBe('pending');
    expect(updated.reason).toBeUndefined();

    const all = await listVerifications();
    expect(all.filter((v) => v.userId === 'user-1')).toHaveLength(1);
  });

  it('preserves the uploaded document when a resubmission omits it', async () => {
    await upsertVerification({
      userId: 'document-user', orgName: 'Org', country: 'US', taxId: '111', docFileId: 'file-1'
    });

    const resubmitted = await upsertVerification({
      userId: 'document-user', orgName: 'Updated Org', country: 'US', taxId: '222'
    });

    expect(resubmitted.docFileId).toBe('file-1');
  });

  it('getVerificationByUserId returns the row when present and undefined otherwise', async () => {
    expect(await getVerificationByUserId('ghost')).toBeUndefined();

    await upsertVerification({ userId: 'user-X', orgName: 'X', country: 'US', taxId: '999' });
    const found = await getVerificationByUserId('user-X');
    expect(found?.orgName).toBe('X');
  });

  it('approval stamps reviewer + reviewedAt and clears any prior rejection reason', async () => {
    await upsertVerification({ userId: 'user-2', orgName: 'Org', country: 'US', taxId: '111' });
    await setVerificationStatus('user-2', 'rejected', 'admin-1', 'docs unclear');
    const approved = await setVerificationStatus('user-2', 'approved', 'admin-2');

    expect(approved?.status).toBe('approved');
    expect(approved?.reviewedBy).toBe('admin-2');
    expect(approved?.reason).toBe('');
    expect(approved?.reviewedAt).toBeTruthy();
  });

  it('rejection stores the reason verbatim', async () => {
    await upsertVerification({ userId: 'user-3', orgName: 'Org', country: 'GB', taxId: 'CC-1234567' });
    const rejected = await setVerificationStatus('user-3', 'rejected', 'admin-1', 'Document does not show tax-exempt status.');

    expect(rejected?.status).toBe('rejected');
    expect(rejected?.reason).toBe('Document does not show tax-exempt status.');
    expect(rejected?.reviewedBy).toBe('admin-1');
  });

  it('stores an undefined rejection reason when the reviewer omits one', async () => {
    await upsertVerification({ userId: 'user-no-reason', orgName: 'Org', country: 'US', taxId: '111' });

    const rejected = await setVerificationStatus('user-no-reason', 'rejected', 'admin-1');

    expect(rejected?.reason).toBeUndefined();
  });

  it('returns undefined when setting status on a non-existent user', async () => {
    const result = await setVerificationStatus('ghost', 'approved', 'admin-1');
    expect(result).toBeUndefined();
  });

  it('withdrawVerification removes the row and returns true; false if it was already gone', async () => {
    await upsertVerification({ userId: 'user-4', orgName: 'Org', country: 'US', taxId: '111' });

    const first = await withdrawVerification('user-4');
    const second = await withdrawVerification('user-4');

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(await getVerificationByUserId('user-4')).toBeUndefined();
  });

  it('listVerifications filters by status when requested', async () => {
    await upsertVerification({ userId: 'a', orgName: 'A', country: 'US', taxId: '1' });
    await upsertVerification({ userId: 'b', orgName: 'B', country: 'US', taxId: '2' });
    await upsertVerification({ userId: 'c', orgName: 'C', country: 'US', taxId: '3' });
    await setVerificationStatus('b', 'approved', 'admin');
    await setVerificationStatus('c', 'rejected', 'admin', 'no');

    const pending = await listVerifications({ status: 'pending' });
    const approved = await listVerifications({ status: 'approved' });
    const rejected = await listVerifications({ status: 'rejected' });

    expect(pending.map((v) => v.userId)).toEqual(['a']);
    expect(approved.map((v) => v.userId)).toEqual(['b']);
    expect(rejected.map((v) => v.userId)).toEqual(['c']);
  });

  it('preserves docFileId across status transitions', async () => {
    await upsertVerification({
      userId: 'doc-user',
      orgName: 'Org',
      country: 'US',
      taxId: '111',
      docFileId: 'storage-file-abc'
    });
    const approved = await setVerificationStatus('doc-user', 'approved', 'admin-1');

    expect(approved?.docFileId).toBe('storage-file-abc');
  });

  it('getUserEmail returns null in in-memory mode', async () => {
    const { getUserEmail } = await import('./verifications');
    expect(await getUserEmail('user-1')).toBeNull();
  });
});
