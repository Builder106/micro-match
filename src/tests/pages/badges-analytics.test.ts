import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({ mocks: { getTasks: vi.fn(), getBadgeAnalytics: vi.fn() } }));
vi.mock('$lib/server/appwrite', () => ({ getTasks: mocks.getTasks, getBadgeAnalytics: mocks.getBadgeAnalytics }));

import { load } from '../../routes/badges/analytics/+page.server';

function makeEvent(opts: { userRole?: string; userId?: string } = {}) {
  return {
    locals: {
      userRole: opts.userRole ?? 'anonymous',
      session: opts.userId ? { user: { id: opts.userId, email: 'jane@example.com' } } : undefined
    }
  } as unknown as Parameters<typeof load>[0];
}

describe('/badges/analytics load', () => {
  beforeEach(() => Object.values(mocks).forEach((m) => m.mockReset()));

  it('throws for non-NGO roles', async () => {
    await expect(load(makeEvent({ userRole: 'volunteer' }))).rejects.toThrow(/NGO access required/);
  });

  it('returns tasks + analytics for an NGO user', async () => {
    mocks.getTasks.mockResolvedValue([{ id: 't1' }]);
    mocks.getBadgeAnalytics.mockResolvedValue({ totalBadgesAwarded: 5 });

    interface AnalyticsResult {
      userRole: string;
      user: { id: string; email?: string } | null;
      tasks: unknown[];
      analytics: unknown;
    }
    const result = (await load(makeEvent({ userRole: 'ngo', userId: 'org-1' }))) as unknown as AnalyticsResult;

    expect(result.userRole).toBe('ngo');
    expect(result.user).toEqual({ id: 'org-1', email: 'jane@example.com' });
    expect(result.tasks).toEqual([{ id: 't1' }]);
    expect(result.analytics).toEqual({ totalBadgesAwarded: 5 });

    // Test with user without email
    const result2 = (await load({
      locals: {
        userRole: 'ngo',
        session: { user: { id: 'org-2' } }
      }
    } as unknown as Parameters<typeof load>[0])) as unknown as AnalyticsResult;
    expect(result2.user).toEqual({ id: 'org-2', email: undefined });
  });

  it('handles locals with default anonymous role', async () => {
    await expect(load({ locals: {} } as unknown as Parameters<typeof load>[0])).rejects.toThrow(/NGO access required/);
  });
});

