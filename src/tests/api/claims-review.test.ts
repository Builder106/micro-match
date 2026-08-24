import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    getUserRole: vi.fn(),
    getClaimById: vi.fn(),
    getTaskById: vi.fn(),
    updateClaimStatus: vi.fn(),
    onTaskApproved: vi.fn()
  }
}));

vi.mock('$lib/server/auth', () => ({ getUserRole: mocks.getUserRole }));
vi.mock('$lib/server/appwrite', () => ({
  getClaimById: mocks.getClaimById,
  getTaskById: mocks.getTaskById,
  updateClaimStatus: mocks.updateClaimStatus
}));
vi.mock('$lib/server/badgeAwarder', () => ({ onTaskApproved: mocks.onTaskApproved }));

import { POST as approve } from '../../routes/api/claims/[id]/approve/+server';
import { POST as reject } from '../../routes/api/claims/[id]/reject/+server';

function makeEvent(opts: { reviewerId?: string | null; claimId?: string }) {
  return {
    locals: { session: opts.reviewerId ? { user: { id: opts.reviewerId } } : null },
    params: { id: opts.claimId ?? 'claim-1' }
  } as unknown as import("@sveltejs/kit").RequestEvent;
}

const claimOnOwnedTask = {
  id: 'claim-1',
  taskId: 'task-owned',
  userId: 'volunteer-1',
  status: 'pending' as const,
  createdAt: ''
};

const ownedTask = {
  id: 'task-owned',
  orgId: 'ngo-1',
  title: 'Translate flyer',
  shortDescription: 'x',
  description: '',
  language: 'English',
  tags: [],
  createdAt: '',
  status: 'active' as const,
  estimatedMinutes: 15
};

describe('POST /api/claims/[id]/approve', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
    mocks.getUserRole.mockResolvedValue('ngo');
    mocks.getClaimById.mockResolvedValue(claimOnOwnedTask);
    mocks.getTaskById.mockResolvedValue(ownedTask);
    mocks.updateClaimStatus.mockResolvedValue({ ...claimOnOwnedTask, status: 'approved', reviewedBy: 'ngo-1' });
    mocks.onTaskApproved.mockResolvedValue(['badge-1']);
  });

  it('returns 403 for non-NGO role', async () => {
    mocks.getUserRole.mockResolvedValue('volunteer');
    const res = await approve(makeEvent({ reviewerId: 'ngo-1' }));
    expect(res.status).toBe(403);
    expect(mocks.updateClaimStatus).not.toHaveBeenCalled();
  });

  it('returns 401 when there is no session', async () => {
    const res = await approve(makeEvent({ reviewerId: null }));
    expect(res.status).toBe(401);
    expect(mocks.getClaimById).not.toHaveBeenCalled();
  });

  it('returns 400 when claim id param is missing', async () => {
    const res = await approve({
      locals: { session: { user: { id: 'ngo-1' } } },
      params: {}
    } as unknown as import("@sveltejs/kit").RequestEvent);
    expect(res.status).toBe(400);
  });


  it('returns 404 when the claim does not exist', async () => {
    mocks.getClaimById.mockResolvedValue(undefined);
    const res = await approve(makeEvent({ reviewerId: 'ngo-1' }));
    expect(res.status).toBe(404);
  });

  it('returns 404 when the claim has no taskId or referenced task is missing', async () => {
    mocks.getClaimById.mockResolvedValue({ id: 'c1' }); // no taskId
    const res = await approve(makeEvent({ reviewerId: 'ngo-1' }));
    expect(res.status).toBe(404);

    mocks.getClaimById.mockResolvedValue(claimOnOwnedTask);
    mocks.getTaskById.mockResolvedValue(undefined);
    const res2 = await approve(makeEvent({ reviewerId: 'ngo-1' }));
    expect(res2.status).toBe(404);
    expect(mocks.updateClaimStatus).not.toHaveBeenCalled();
  });

  it('handles updated claim without userId/taskId when awarding badges', async () => {
    mocks.updateClaimStatus.mockResolvedValue({ id: 'claim-1', status: 'approved' }); // no userId / taskId
    const res = await approve(makeEvent({ reviewerId: 'ngo-1' }));
    expect(res.status).toBe(200);
    expect(mocks.onTaskApproved).not.toHaveBeenCalled();
  });


  it('returns 403 when the calling NGO does not own the task (cross-org IDOR)', async () => {
    const res = await approve(makeEvent({ reviewerId: 'some-other-ngo' }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/do not own/);
    expect(mocks.updateClaimStatus).not.toHaveBeenCalled();
    expect(mocks.onTaskApproved).not.toHaveBeenCalled();
  });

  it('returns 500 when the status update fails', async () => {
    mocks.updateClaimStatus.mockResolvedValue(undefined);
    const res = await approve(makeEvent({ reviewerId: 'ngo-1' }));
    expect(res.status).toBe(500);
  });

  it('approves, records the real reviewer id, and awards badges on the happy path', async () => {
    const res = await approve(makeEvent({ reviewerId: 'ngo-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mocks.updateClaimStatus).toHaveBeenCalledWith('claim-1', 'approved', 'ngo-1');
    expect(mocks.onTaskApproved).toHaveBeenCalledWith('volunteer-1', 'task-owned', 15);
    expect(body.awardedBadgeIds).toEqual(['badge-1']);
  });

  it('awards badges without an estimate when the task does not provide one', async () => {
    mocks.getTaskById.mockResolvedValue({ ...ownedTask, estimatedMinutes: undefined });

    const res = await approve(makeEvent({ reviewerId: 'ngo-1' }));

    expect(res.status).toBe(200);
    expect(mocks.onTaskApproved).toHaveBeenCalledWith('volunteer-1', 'task-owned', undefined);
  });

  it('still approves when badge awarding throws (best-effort)', async () => {
    mocks.onTaskApproved.mockRejectedValue(new Error('badge service down'));
    const res = await approve(makeEvent({ reviewerId: 'ngo-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.awardedBadgeIds).toEqual([]);
  });
});

describe('POST /api/claims/[id]/reject', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
    mocks.getUserRole.mockResolvedValue('ngo');
    mocks.getClaimById.mockResolvedValue(claimOnOwnedTask);
    mocks.getTaskById.mockResolvedValue(ownedTask);
    mocks.updateClaimStatus.mockResolvedValue({ ...claimOnOwnedTask, status: 'rejected', reviewedBy: 'ngo-1' });
  });

  it('returns 403 for non-NGO role', async () => {
    mocks.getUserRole.mockResolvedValue('volunteer');
    const res = await reject(makeEvent({ reviewerId: 'ngo-1' }));
    expect(res.status).toBe(403);
  });

  it('returns 401 when there is no session', async () => {
    const res = await reject(makeEvent({ reviewerId: null }));
    expect(res.status).toBe(401);
  });

  it('returns 404 when the claim does not exist', async () => {
    mocks.getClaimById.mockResolvedValue(undefined);
    const res = await reject(makeEvent({ reviewerId: 'ngo-1' }));
    expect(res.status).toBe(404);
  });

  it('returns 403 when the calling NGO does not own the task (cross-org IDOR)', async () => {
    const res = await reject(makeEvent({ reviewerId: 'some-other-ngo' }));
    expect(res.status).toBe(403);
    expect(mocks.updateClaimStatus).not.toHaveBeenCalled();
  });

  it('returns 400 when claim id param is missing', async () => {
    const res = await reject({
      locals: { session: { user: { id: 'ngo-1' } } },
      params: {}
    } as unknown as import("@sveltejs/kit").RequestEvent);
    expect(res.status).toBe(400);
  });

  it('returns 404 when the claim has no taskId or referenced task is missing', async () => {
    mocks.getClaimById.mockResolvedValue({ id: 'c1' }); // no taskId
    const res = await reject(makeEvent({ reviewerId: 'ngo-1' }));
    expect(res.status).toBe(404);

    mocks.getClaimById.mockResolvedValue(claimOnOwnedTask);
    mocks.getTaskById.mockResolvedValue(undefined);
    const res2 = await reject(makeEvent({ reviewerId: 'ngo-1' }));
    expect(res2.status).toBe(404);
  });

  it('returns 500 when the status update fails', async () => {
    mocks.updateClaimStatus.mockResolvedValue(undefined);
    const res = await reject(makeEvent({ reviewerId: 'ngo-1' }));
    expect(res.status).toBe(500);
  });

  it('rejects and records the real reviewer id on the happy path', async () => {
    const res = await reject(makeEvent({ reviewerId: 'ngo-1' }));
    expect(res.status).toBe(200);
    expect(mocks.updateClaimStatus).toHaveBeenCalledWith('claim-1', 'rejected', 'ngo-1');
  });
});
