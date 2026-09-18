/* global App */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({ mocks: { getTasks: vi.fn(), listBadgeDefinitions: vi.fn() } }));
vi.mock('$lib/server/appwrite', () => ({ getTasks: mocks.getTasks }));
vi.mock('$lib/server/badgeDefs', () => ({ listBadgeDefinitions: mocks.listBadgeDefinitions }));

import { load } from '../../routes/badges/manage/+page.server';
import { createServerLoadEventFor, requireLoadResult } from '../helpers/createLoadEvent';

function makeEvent(opts: { userRole?: App.Locals['userRole']; userId?: string } = {}) {
  return createServerLoadEventFor<typeof load>({
    userRole: opts.userRole,
    userId: opts.userId
  });
}

describe('/badges/manage load', () => {
  beforeEach(() => Object.values(mocks).forEach((m) => m.mockReset()));

  it('403s for non-NGO roles', async () => {
    await expect(load(makeEvent({ userRole: 'volunteer' }))).rejects.toMatchObject({ status: 403 });
  });

  it('403s for an NGO role with no resolvable user id', async () => {
    await expect(load(makeEvent({ userRole: 'ngo' }))).rejects.toMatchObject({ status: 403 });
    await expect(load(makeEvent())).rejects.toMatchObject({ status: 403 });

    const event = makeEvent({ userRole: 'ngo', userId: 'org-1' });
    event.locals.userRole = undefined;
    await expect(load(event)).rejects.toMatchObject({ status: 403 });
  });


  it('scopes tasks and badge definitions to the NGO\'s own org', async () => {
    mocks.getTasks.mockResolvedValue([{ id: 't1', orgId: 'org-1' }]);
    mocks.listBadgeDefinitions.mockResolvedValue([{ id: 'b1', orgId: 'org-1' }]);

    const result = requireLoadResult(await load(makeEvent({ userRole: 'ngo', userId: 'org-1' })));

    expect(mocks.getTasks).toHaveBeenCalledWith({ orgId: 'org-1', includeInactive: true });
    expect(mocks.listBadgeDefinitions).toHaveBeenCalledWith('org-1');
    expect(result.tasks).toEqual([{ id: 't1', orgId: 'org-1' }]);
    expect(result.badges).toEqual([{ id: 'b1', orgId: 'org-1' }]);

    // Test NGO user without email
    const result2 = requireLoadResult(await load(createServerLoadEventFor<typeof load>({
      userRole: 'ngo',
      session: { user: { id: 'org-2' } }
    })));
    expect(result2.user?.email).toBeUndefined();
  });
});
