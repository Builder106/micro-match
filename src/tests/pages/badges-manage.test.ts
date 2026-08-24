import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({ mocks: { getTasks: vi.fn(), listBadgeDefinitions: vi.fn() } }));
vi.mock('$lib/server/appwrite', () => ({ getTasks: mocks.getTasks }));
vi.mock('$lib/server/badgeDefs', () => ({ listBadgeDefinitions: mocks.listBadgeDefinitions }));

import { load } from '../../routes/badges/manage/+page.server';

function makeEvent(opts: { userRole?: string; userId?: string } = {}) {
  return {
    locals: {
      userRole: opts.userRole ?? 'anonymous',
      session: opts.userId ? { user: { id: opts.userId, email: 'jane@example.com' } } : undefined
    }
  } as unknown as Parameters<typeof load>[0];
}

describe('/badges/manage load', () => {
  beforeEach(() => Object.values(mocks).forEach((m) => m.mockReset()));

  it('403s for non-NGO roles', async () => {
    await expect(load(makeEvent({ userRole: 'volunteer' }))).rejects.toMatchObject({ status: 403 });
  });

  it('403s for an NGO role with no resolvable user id', async () => {
    await expect(load(makeEvent({ userRole: 'ngo' }))).rejects.toMatchObject({ status: 403 });
    await expect(load({ locals: {} } as unknown as Parameters<typeof load>[0])).rejects.toMatchObject({ status: 403 });
  });


  it('scopes tasks and badge definitions to the NGO\'s own org', async () => {
    mocks.getTasks.mockResolvedValue([{ id: 't1', orgId: 'org-1' }]);
    mocks.listBadgeDefinitions.mockResolvedValue([{ id: 'b1', orgId: 'org-1' }]);

    interface ManageResult {
      userRole: string;
      user: { id: string; email?: string } | null;
      tasks: unknown[];
      badges: unknown[];
    }
    const result = (await load(makeEvent({ userRole: 'ngo', userId: 'org-1' }))) as unknown as ManageResult;

    expect(mocks.getTasks).toHaveBeenCalledWith({ orgId: 'org-1', includeInactive: true });
    expect(mocks.listBadgeDefinitions).toHaveBeenCalledWith('org-1');
    expect(result.tasks).toEqual([{ id: 't1', orgId: 'org-1' }]);
    expect(result.badges).toEqual([{ id: 'b1', orgId: 'org-1' }]);

    // Test NGO user without email
    const result2 = (await load({
      locals: {
        userRole: 'ngo',
        session: { user: { id: 'org-2' } }
      }
    } as unknown as Parameters<typeof load>[0])) as unknown as ManageResult;
    expect(result2.user?.email).toBeUndefined();
  });
});

