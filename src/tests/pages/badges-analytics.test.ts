/* global App */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({ mocks: { getTasks: vi.fn(), getBadgeAnalytics: vi.fn() } }));
vi.mock('$lib/server/appwrite', () => ({ getTasks: mocks.getTasks, getBadgeAnalytics: mocks.getBadgeAnalytics }));

import { load } from '../../routes/badges/analytics/+page.server';
import { createServerLoadEventFor, requireLoadResult } from '../helpers/createLoadEvent';

function makeEvent(opts: { userRole?: App.Locals['userRole']; userId?: string } = {}) {
  return createServerLoadEventFor<typeof load>({
    userRole: opts.userRole,
    userId: opts.userId
  });
}

describe('/badges/analytics load', () => {
  beforeEach(() => Object.values(mocks).forEach((m) => m.mockReset()));

  it('throws for non-NGO roles', async () => {
    await expect(load(makeEvent({ userRole: 'volunteer' }))).rejects.toThrow(/NGO access required/);
  });

  it('returns tasks + analytics for an NGO user', async () => {
    mocks.getTasks.mockResolvedValue([{ id: 't1' }]);
    mocks.getBadgeAnalytics.mockResolvedValue({ totalBadgesAwarded: 5 });

    const result = requireLoadResult(await load(makeEvent({ userRole: 'ngo', userId: 'org-1' })));

    expect(result.userRole).toBe('ngo');
    expect(result.user).toEqual({ id: 'org-1', email: 'jane@example.com' });
    expect(result.tasks).toEqual([{ id: 't1' }]);
    expect(result.analytics).toEqual({ totalBadgesAwarded: 5 });

    // Test with user without email
    const result2 = requireLoadResult(await load(createServerLoadEventFor<typeof load>({
      userRole: 'ngo',
      session: { user: { id: 'org-2' } }
    })));
    expect(result2.user).toEqual({ id: 'org-2', email: undefined });
  });

  it('handles locals with default anonymous role', async () => {
    await expect(load(makeEvent())).rejects.toThrow(/NGO access required/);

    const event = makeEvent({ userRole: 'ngo', userId: 'org-1' });
    event.locals.userRole = undefined;
    await expect(load(event)).rejects.toThrow(/NGO access required/);
  });
});
