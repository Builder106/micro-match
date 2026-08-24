import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({ mocks: { getTaskById: vi.fn() } }));
vi.mock('$lib/server/appwrite', () => ({ getTaskById: mocks.getTaskById }));

import { load } from '../../routes/task/[id]/claim/+page.server';

function makeEvent(opts: { userRole?: string; taskId?: string } = {}) {
  return {
    params: { id: opts.taskId ?? 'task-1' },
    locals: { userRole: opts.userRole ?? 'anonymous' }
  } as unknown as Parameters<typeof load>[0];
}

describe('/task/[id]/claim load', () => {
  beforeEach(() => mocks.getTaskById.mockReset());

  it('redirects anonymous users to login with a next= back to the claim page', async () => {
    try {
      await load(makeEvent({ taskId: 'task-1' }));
      throw new Error('expected redirect');
    } catch (err: unknown) {
      const e = err as { status?: number; location?: string; body?: { message?: string } };
      expect(e.status).toBe(303);
      expect(e.location).toBe('/login?next=/task/task-1/claim');
    }
    expect(mocks.getTaskById).not.toHaveBeenCalled();

    // Also test when locals.userRole is undefined
    try {
      await load({ params: { id: 'task-1' }, locals: {} } as unknown as Parameters<typeof load>[0]);
      throw new Error('expected redirect');
    } catch (err: unknown) {
      const e = err as { status?: number; location?: string };
      expect(e.status).toBe(303);
    }
  });


  it('404s when the task does not exist', async () => {
    mocks.getTaskById.mockResolvedValue(undefined);
    try {
      await load(makeEvent({ userRole: 'volunteer' }));
      throw new Error('expected 404');
    } catch (err: unknown) {
      const e = err as { status?: number; body?: { message?: string } };
      expect(e.status).toBe(404);
    }
  });

  it('returns a trimmed-down task projection for a signed-in role', async () => {
    mocks.getTaskById.mockResolvedValue({
      id: 'task-1', orgId: 'org-1', title: 'T', shortDescription: 'S', description: 'long',
      estimatedMinutes: 20, tags: ['a'], isVerified: true
    });

    const result = (await load(makeEvent({ userRole: 'volunteer' }))) as Exclude<Awaited<ReturnType<typeof load>>, void>;

    expect(result.task).toEqual({
      id: 'task-1', title: 'T', shortDescription: 'S', estimatedMinutes: 20, tags: ['a'], isVerified: true
    });
    expect(result.task.orgId).toBeUndefined();
    expect(result.task.description).toBeUndefined();
  });
});
