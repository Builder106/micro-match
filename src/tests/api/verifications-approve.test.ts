import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    isUserAdmin: vi.fn(),
    getVerificationByUserId: vi.fn(),
    getUserEmail: vi.fn(),
    setVerificationStatus: vi.fn(),
    setUserVerificationPref: vi.fn(),
    setTasksVerifiedForOrg: vi.fn(),
    sendVerificationApproved: vi.fn(),
    sendVerificationRejected: vi.fn()
  }
}));

vi.mock('$lib/server/teams', () => ({ isUserAdmin: mocks.isUserAdmin }));
vi.mock('$lib/server/verifications', () => ({
  getVerificationByUserId: mocks.getVerificationByUserId,
  getUserEmail: mocks.getUserEmail,
  setVerificationStatus: mocks.setVerificationStatus,
  setUserVerificationPref: mocks.setUserVerificationPref
}));
vi.mock('$lib/server/appwrite', () => ({ setTasksVerifiedForOrg: mocks.setTasksVerifiedForOrg }));
vi.mock('$lib/server/email', () => ({
  sendVerificationApproved: mocks.sendVerificationApproved,
  sendVerificationRejected: mocks.sendVerificationRejected
}));

import { POST as approve } from '../../routes/api/verifications/[userId]/approve/+server';
import { POST as reject } from '../../routes/api/verifications/[userId]/reject/+server';

function makeEvent(opts: { adminId?: string | null; userId?: string; body?: unknown }) {
  return {
    locals: { session: opts.adminId ? { user: { id: opts.adminId } } : null },
    params: { userId: opts.userId ?? 'target-user' },
    request: {
      json: async () => {
        if (opts.body === undefined) throw new Error('no body');
        return opts.body;
      }
    },
    url: new URL('http://test/api/verifications/x/approve')
  } as unknown as import("@sveltejs/kit").RequestEvent;
}

const happyVerification = {
  id: 'v1', userId: 'target-user', orgName: 'Doctors Without Borders',
  country: 'US', taxId: '13-3433452', status: 'pending' as const, submittedAt: ''
};

describe('POST /api/verifications/[userId]/approve', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
    mocks.isUserAdmin.mockResolvedValue(true);
    mocks.getVerificationByUserId.mockResolvedValue(happyVerification);
    mocks.setVerificationStatus.mockResolvedValue({ ...happyVerification, status: 'approved', reviewedBy: 'admin-1' });
    mocks.setTasksVerifiedForOrg.mockResolvedValue(3);
    mocks.getUserEmail.mockResolvedValue('jane@example.com');
    mocks.sendVerificationApproved.mockResolvedValue({ ok: true, id: 'mailgun-1' });
    mocks.setUserVerificationPref.mockResolvedValue(undefined);
  });

  it('returns 403 when caller is not an admin', async () => {
    mocks.isUserAdmin.mockResolvedValue(false);
    const res = await approve(makeEvent({ adminId: 'random-user', userId: 'target-user' }));
    expect(res.status).toBe(403);
    expect(mocks.setVerificationStatus).not.toHaveBeenCalled();
  });

  it('returns 403 when there is no session', async () => {
    const res = await approve(makeEvent({ adminId: null, userId: 'target-user' }));
    expect(res.status).toBe(403);
  });

  it('returns 400 when userId param is missing', async () => {
    const res = await approve({
      locals: { session: { user: { id: 'admin-1' } } },
      params: {}
    } as unknown as import("@sveltejs/kit").RequestEvent);
    expect(res.status).toBe(400);
  });


  it('returns 404 when no verification exists for the target user', async () => {
    mocks.getVerificationByUserId.mockResolvedValue(undefined);
    const res = await approve(makeEvent({ adminId: 'admin-1', userId: 'ghost' }));
    expect(res.status).toBe(404);
    expect(mocks.setVerificationStatus).not.toHaveBeenCalled();
  });

  it('returns 500 when status update fails', async () => {
    mocks.setVerificationStatus.mockResolvedValue(undefined);
    const res = await approve(makeEvent({ adminId: 'admin-1', userId: 'target-user' }));
    expect(res.status).toBe(500);
  });

  it('runs the full happy path: status update, task backfill, prefs sync, email', async () => {
    const res = await approve(makeEvent({ adminId: 'admin-1', userId: 'target-user' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mocks.setVerificationStatus).toHaveBeenCalledWith('target-user', 'approved', 'admin-1');
    expect(mocks.setTasksVerifiedForOrg).toHaveBeenCalledWith('target-user', true);
    expect(mocks.setUserVerificationPref).toHaveBeenCalledWith('target-user', 'approved');
    expect(mocks.sendVerificationApproved).toHaveBeenCalledWith({
      to: 'jane@example.com',
      orgName: 'Doctors Without Borders'
    });
    expect(body.tasksUpdated).toBe(3);
    expect(body.email.ok).toBe(true);
  });

  it('still returns 200 when email lookup throws (email is best-effort)', async () => {
    mocks.getUserEmail.mockRejectedValue(new Error('users API down'));
    const res = await approve(makeEvent({ adminId: 'admin-1', userId: 'target-user' }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.email.ok).toBe(false);
  });

  it('skips sending the email when no email is on file', async () => {
    mocks.getUserEmail.mockResolvedValue(null);
    const res = await approve(makeEvent({ adminId: 'admin-1', userId: 'target-user' }));
    expect(res.status).toBe(200);
    expect(mocks.sendVerificationApproved).not.toHaveBeenCalled();
  });

  it('still completes when the task backfill throws', async () => {
    mocks.setTasksVerifiedForOrg.mockRejectedValue(new Error('db kaboom'));
    const res = await approve(makeEvent({ adminId: 'admin-1', userId: 'target-user' }));
    expect(res.status).toBe(200);
    // Verification still got approved + email still went out.
    expect(mocks.setVerificationStatus).toHaveBeenCalled();
    expect(mocks.sendVerificationApproved).toHaveBeenCalled();
  });
});

describe('POST /api/verifications/[userId]/reject', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
    mocks.isUserAdmin.mockResolvedValue(true);
    mocks.getVerificationByUserId.mockResolvedValue(happyVerification);
    mocks.setVerificationStatus.mockResolvedValue({ ...happyVerification, status: 'rejected', reason: 'docs unclear' });
    mocks.setTasksVerifiedForOrg.mockResolvedValue(2);
    mocks.getUserEmail.mockResolvedValue('jane@example.com');
    mocks.sendVerificationRejected.mockResolvedValue({ ok: true, id: 'mailgun-2' });
  });

  it('returns 403 for non-admin', async () => {
    mocks.isUserAdmin.mockResolvedValue(false);
    const res = await reject(makeEvent({ adminId: 'u', userId: 'target-user', body: { reason: 'no' } }));
    expect(res.status).toBe(403);
  });

  it('returns 400 when JSON body is invalid in reject', async () => {
    const res = await reject({
      locals: { session: { user: { id: 'admin-1' } } },
      params: { userId: 'target-user' },
      request: { json: async () => { throw new Error('invalid json'); } }
    } as unknown as import("@sveltejs/kit").RequestEvent);
    expect(res.status).toBe(400);
  });

  it('returns 500 when setVerificationStatus fails in reject', async () => {
    mocks.setVerificationStatus.mockResolvedValue(undefined);
    const res = await reject(makeEvent({ adminId: 'admin-1', userId: 'target-user', body: { reason: 'bad docs' } }));
    expect(res.status).toBe(500);
  });

  it('returns 400 when userId param is missing in reject', async () => {
    const res = await reject({
      locals: { session: { user: { id: 'admin-1' } } },
      params: {},
      request: { json: async () => ({ reason: 'some reason' }) }
    } as unknown as import("@sveltejs/kit").RequestEvent);
    expect(res.status).toBe(400);
  });


  it('rejects empty reason with 400', async () => {
    const res = await reject(makeEvent({ adminId: 'admin-1', userId: 'target-user', body: { reason: '   ' } }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/reason/);
  });


  it('rejects reasons longer than 1000 chars with 400', async () => {
    const longReason = 'x'.repeat(1001);
    const res = await reject(makeEvent({ adminId: 'admin-1', userId: 'target-user', body: { reason: longReason } }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when verification missing', async () => {
    mocks.getVerificationByUserId.mockResolvedValue(undefined);
    const res = await reject(makeEvent({ adminId: 'admin-1', userId: 'ghost', body: { reason: 'no' } }));
    expect(res.status).toBe(404);
  });

  it('runs the full happy path: status, unverify-tasks, prefs reset, email with reason', async () => {
    const res = await reject(makeEvent({
      adminId: 'admin-1',
      userId: 'target-user',
      body: { reason: 'Document does not show tax-exempt status.' }
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mocks.setVerificationStatus).toHaveBeenCalledWith(
      'target-user', 'rejected', 'admin-1', 'Document does not show tax-exempt status.'
    );
    expect(mocks.setTasksVerifiedForOrg).toHaveBeenCalledWith('target-user', false);
    expect(mocks.setUserVerificationPref).toHaveBeenCalledWith('target-user', 'rejected');
    expect(mocks.sendVerificationRejected).toHaveBeenCalledWith({
      to: 'jane@example.com',
      orgName: 'Doctors Without Borders',
      reason: 'Document does not show tax-exempt status.'
    });
    expect(body.tasksUpdated).toBe(2);
  });

  it('handles email throwing and returns emailResult with error message', async () => {
    mocks.getUserEmail.mockRejectedValue(new Error('email service down'));
    const res = await reject(makeEvent({
      adminId: 'admin-1',
      userId: 'target-user',
      body: { reason: 'wrong docs' }
    }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.email.ok).toBe(false);
    expect(body.email.error).toBe('email service down');
  });

  it('does not send a rejection email when the user has no email address', async () => {
    mocks.getUserEmail.mockResolvedValue(null);

    const res = await reject(makeEvent({
      adminId: 'admin-1',
      userId: 'target-user',
      body: { reason: 'wrong docs' }
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mocks.sendVerificationRejected).not.toHaveBeenCalled();
    expect(body.email).toEqual({ ok: false });
  });

  it('treats a null rejection payload as a missing reason', async () => {
    const res = await reject(makeEvent({
      adminId: 'admin-1',
      userId: 'target-user',
      body: null
    }));

    expect(res.status).toBe(400);
    expect(mocks.setVerificationStatus).not.toHaveBeenCalled();
  });

  it('trims whitespace around the reason before persisting', async () => {
    await reject(makeEvent({
      adminId: 'admin-1',
      userId: 'target-user',
      body: { reason: '   wrong docs   ' }
    }));

    expect(mocks.setVerificationStatus).toHaveBeenCalledWith(
      'target-user', 'rejected', 'admin-1', 'wrong docs'
    );
  });
});
