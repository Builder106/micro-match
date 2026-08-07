import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({ mocks: { getTasks: vi.fn(), getClaims: vi.fn() } }));
vi.mock('$lib/server/appwrite', () => ({ getTasks: mocks.getTasks, getClaims: mocks.getClaims }));

import { load } from '../../routes/dashboard/+page.server';

function makeEvent(opts: { userRole?: string; userId?: string } = {}) {
  return {
    locals: {
      userRole: opts.userRole ?? 'anonymous',
      session: opts.userId ? { user: { id: opts.userId, email: 'jane@example.com' } } : undefined
    }
  } as any;
}

describe('/dashboard load', () => {
  beforeEach(() => Object.values(mocks).forEach((m) => m.mockReset()));

  it('redirects anonymous visitors to login', async () => {
    try {
      await load(makeEvent());
      throw new Error('expected load() to redirect');
    } catch (err: any) {
      expect(err.status).toBe(303);
      expect(err.location).toBe('/login?next=/dashboard');
    }
  });

  it('builds NGO stats scoped to the org\'s own tasks and claims', async () => {
    mocks.getTasks.mockResolvedValue([
      { id: 't1', orgId: 'org-1', estimatedMinutes: 60 },
      { id: 't2', orgId: 'org-2', estimatedMinutes: 30 }
    ]);
    mocks.getClaims.mockResolvedValue([
      { id: 'c1', taskId: 't1', status: 'pending' },
      { id: 'c2', taskId: 't1', status: 'approved' },
      { id: 'c3', taskId: 't2', status: 'approved' } // belongs to a different org's task
    ]);

    const result: any = await load(makeEvent({ userRole: 'ngo', userId: 'org-1' }));

    expect(result.signedIn).toBe(true);
    expect(result.userData.totalTasks).toBe(1);
    expect(result.userData.pendingReviewsCount).toBe(1);
    expect(result.userData.approvedClaimsCount).toBe(1);
    expect(result.userData.totalHours).toBe(1); // 60 minutes / 60
    expect(result.userData.myClaims.every((c: any) => c.task?.id === 't1' || c.taskId === 't1')).toBe(true);
  });

  it('builds volunteer stats with recommendations excluding already-claimed tasks', async () => {
    mocks.getTasks.mockResolvedValue([
      { id: 't1', estimatedMinutes: 10 },
      { id: 't2', estimatedMinutes: 5 },
      { id: 't3', estimatedMinutes: 20 }
    ]);
    mocks.getClaims.mockResolvedValue([
      { id: 'c1', taskId: 't1', userId: 'user-1', status: 'approved' }
    ]);

    const result: any = await load(makeEvent({ userRole: 'volunteer', userId: 'user-1' }));

    expect(result.signedIn).toBe(true);
    expect(result.userData.approvedClaimsCount).toBe(1);
    expect(result.userData.totalHours).toBe(0.2); // Math.round((10/60) * 10) / 10
    const recTaskIds = result.userData.recommendations.map((t: any) => t.id);
    expect(recTaskIds).not.toContain('t1');
    // sorted by estimatedMinutes ascending
    expect(recTaskIds).toEqual(['t2', 't3']);
  });

  it('defaults estimatedMinutes to 30 when computing hours for a claim missing it', async () => {
    mocks.getTasks.mockResolvedValue([{ id: 't1', orgId: 'org-1' }]);
    mocks.getClaims.mockResolvedValue([{ id: 'c1', taskId: 't1', status: 'approved' }]);

    const result: any = await load(makeEvent({ userRole: 'ngo', userId: 'org-1' }));
    expect(result.userData.totalHours).toBe(0.5);
  });
});
