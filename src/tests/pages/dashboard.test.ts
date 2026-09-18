/* global App */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({ mocks: { getTasks: vi.fn(), getClaims: vi.fn() } }));
vi.mock('$lib/server/appwrite', () => ({ getTasks: mocks.getTasks, getClaims: mocks.getClaims }));

import { load } from '../../routes/dashboard/+page.server';
import { createServerLoadEventFor, requireLoadResult } from '../helpers/createLoadEvent';
import { isHttpError } from '../helpers/httpError';

function makeEvent(opts: { userRole?: App.Locals['userRole']; userId?: string } = {}) {
  return createServerLoadEventFor<typeof load>({
    userRole: opts.userRole,
    userId: opts.userId
  });
}

describe('/dashboard load', () => {
  beforeEach(() => Object.values(mocks).forEach((m) => m.mockReset()));

  it('redirects anonymous visitors to login', async () => {
    try {
      await load(makeEvent());
      throw new Error('expected load() to redirect');
    } catch (err: unknown) {
      expect(isHttpError(err)).toBe(true);
      if (isHttpError(err)) {
        expect(err.status).toBe(303);
        expect(err.location).toBe('/login?next=/dashboard');
      }
    }

    try {
      await load(makeEvent());
      throw new Error('expected load() to redirect');
    } catch (err: unknown) {
      expect(isHttpError(err)).toBe(true);
      if (isHttpError(err)) expect(err.status).toBe(303);
    }

    const omittedRoleEvent = makeEvent({ userRole: 'volunteer', userId: 'user-1' });
    omittedRoleEvent.locals.userRole = undefined;
    try {
      await load(omittedRoleEvent);
      throw new Error('expected load() to redirect');
    } catch (err: unknown) {
      expect(isHttpError(err)).toBe(true);
      if (isHttpError(err)) {
        expect(err.status).toBe(303);
        expect(err.location).toBe('/login?next=/dashboard');
      }
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

    const result = requireLoadResult(await load(makeEvent({ userRole: 'ngo', userId: 'org-1' })));

    expect(result.signedIn).toBe(true);
    expect(result.userData.totalTasks).toBe(1);
    expect(result.userData.pendingReviewsCount).toBe(1);
    expect(result.userData.approvedClaimsCount).toBe(1);
    expect(result.userData.totalHours).toBe(1); // 60 minutes / 60
    expect(result.userData.myClaims.every((c: { task?: { id?: string }; taskId?: string }) => c.task?.id === 't1' || c.taskId === 't1')).toBe(true);
  });

  it('builds volunteer stats with recommendations excluding already-claimed tasks', async () => {
    mocks.getTasks.mockResolvedValue([
      { id: 't1', estimatedMinutes: 10 },
      { id: 't2', estimatedMinutes: 5 },
      { id: 't3', estimatedMinutes: 20 },
      { id: 't4' }, // undefined estimatedMinutes
      { id: 't5' }  // second undefined estimatedMinutes
    ]);
    mocks.getClaims.mockResolvedValue([
      { id: 'c1', taskId: 't1', userId: 'user-1', status: 'approved' }
    ]);

    const result = requireLoadResult(await load(makeEvent({ userRole: 'volunteer', userId: 'user-1' })));

    expect(result.signedIn).toBe(true);
    expect(result.userData.approvedClaimsCount).toBe(1);
    expect(result.userData.totalHours).toBe(0.2); // Math.round((10/60) * 10) / 10
    const recTaskIds = result.userData.recommendations.map((t: { id: string }) => t.id);
    expect(recTaskIds).not.toContain('t1');
    // sorted by estimatedMinutes ascending
    expect(recTaskIds).toEqual(['t2', 't3', 't4']);

    // Test volunteer user without email
    const resultNoEmail = requireLoadResult(await load(makeEvent({ userRole: 'volunteer', userId: 'user-1' })));
    expect(resultNoEmail.userData).toBeDefined();
  });

  it('preserves an authenticated session user without an email', async () => {
    mocks.getTasks.mockResolvedValue([]);
    mocks.getClaims.mockResolvedValue([]);

    const result = requireLoadResult(await load(createServerLoadEventFor<typeof load>({
      userRole: 'volunteer',
      session: { user: { id: 'user-without-email' } }
    })));

    expect(result.user).toEqual({ id: 'user-without-email', email: undefined });
    expect(result.userData).toEqual({
      myClaims: [],
      approvedClaimsCount: 0,
      totalHours: 0,
      recommendations: []
    });
  });



  it('defaults estimatedMinutes to 30 when computing hours for a claim missing it', async () => {
    mocks.getTasks.mockResolvedValue([{ id: 't1', orgId: 'org-1' }]);
    mocks.getClaims.mockResolvedValue([{ id: 'c1', taskId: 't1', status: 'approved' }]);

    const result = requireLoadResult(await load(makeEvent({ userRole: 'ngo', userId: 'org-1' })));
    expect(result.userData.totalHours).toBe(0.5);

    // Also volunteer with missing task in enrichClaims
    mocks.getTasks.mockResolvedValue([]);
    mocks.getClaims.mockResolvedValue([{ id: 'c2', taskId: 'nonexistent', userId: 'user-1', status: 'approved' }]);
    const volResult = requireLoadResult(await load(makeEvent({ userRole: 'volunteer', userId: 'user-1' })));
    expect(volResult.userData.totalHours).toBe(0.5);
  });

  it('returns signedIn:false for non-NGO, non-volunteer roles when authenticated', async () => {
    const result = requireLoadResult(await load(makeEvent({ userRole: 'user', userId: 'admin-1' })));
    expect(result).toEqual({
      signedIn: false,
      userRole: 'user',
      user: null,
      userData: null
    });
  });
});
