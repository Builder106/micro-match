import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    getTasks: vi.fn(),
    getClaims: vi.fn(),
    getBadges: vi.fn()
  }
}));

vi.mock('$lib/server/appwrite', () => ({
  getTasks: mocks.getTasks,
  getClaims: mocks.getClaims,
  getBadges: mocks.getBadges
}));

import { load } from '../../routes/impact/+page.server';

describe('/impact load', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
  });

  it('computes impact statistics from approved claims, tasks, and badges', async () => {
    mocks.getTasks.mockResolvedValue([
      { id: 't1', orgId: 'org-1', estimatedMinutes: 15, tags: ['#Spanish', 'health'] },
      { id: 't2', orgId: 'org-2', estimatedMinutes: 20, tags: ['data'] },
      { id: 't3', orgId: 'org-1', estimatedMinutes: 30, tags: ['#Spanish'] },
      { id: 't4', orgId: 'org-3', estimatedMinutes: 45, tags: [] }
    ]);

    mocks.getClaims.mockResolvedValue([
      { id: 'c1', taskId: 't1', userId: 'u1', status: 'approved' },
      { id: 'c2', taskId: 't2', userId: 'u2', status: 'approved' },
      { id: 'c3', taskId: 't3', userId: 'u1', status: 'approved' },
      { id: 'c4', taskId: 't4', userId: 'u3', status: 'approved' },
      { id: 'c5', taskId: 't1', userId: 'u4', status: 'pending' } // Pending claim should be ignored
    ]);

    mocks.getBadges.mockResolvedValue([
      { id: 'b1', userId: 'u1' },
      { id: 'b2', userId: 'u2' }
    ]);

    const result = (await load({} as unknown as Parameters<typeof load>[0])) as {
      stats: {
        tasksCompleted: number;
        activeVolunteers: number;
        ngosOnboarded: number;
        badgesAwarded: number;
        totalMinutesContributed: number;
        hoursContributed: string;
        avgTaskMinutes: number;
        durationCounts: Record<string, number>;
        causeBreakdown: Array<{ name: string; count: number; percentage: number; bg: string; color: string }>;
      };
    };

    expect(result.stats.tasksCompleted).toBe(4);
    expect(result.stats.activeVolunteers).toBe(3); // u1, u2, u3
    expect(result.stats.ngosOnboarded).toBe(3); // org-1, org-2, org-3
    expect(result.stats.badgesAwarded).toBe(2);
    expect(result.stats.totalMinutesContributed).toBe(110); // 15 + 20 + 30 + 45
    expect(result.stats.hoursContributed).toBe('1.8'); // 110 / 60
    expect(result.stats.avgTaskMinutes).toBe(28); // 110 / 4

    expect(result.stats.durationCounts).toEqual({
      '15m': 1,
      '20m': 1,
      '30m': 1,
      'other': 1
    });

    expect(result.stats.causeBreakdown.length).toBeGreaterThan(0);
    const spanish = result.stats.causeBreakdown.find((c) => c.name === 'Spanish');
    expect(spanish).toBeDefined();
    expect(spanish?.count).toBe(2);
  });

  it('handles claims referencing tasks that no longer exist', async () => {
    mocks.getTasks.mockResolvedValue([]);
    mocks.getClaims.mockResolvedValue([
      { id: 'c1', taskId: 'deleted-task', userId: 'u1', status: 'approved' }
    ]);
    mocks.getBadges.mockResolvedValue([]);

    const result = (await load({} as unknown as Parameters<typeof load>[0])) as {
      stats: {
        tasksCompleted: number;
        totalMinutesContributed: number;
        durationCounts: Record<string, number>;
      };
    };

    expect(result.stats.tasksCompleted).toBe(1);
    expect(result.stats.totalMinutesContributed).toBe(15); // fallback 15 mins
    expect(result.stats.durationCounts['15m']).toBe(1);
  });


  it('handles empty database records safely', async () => {
    mocks.getTasks.mockResolvedValue([]);
    mocks.getClaims.mockResolvedValue([]);
    mocks.getBadges.mockResolvedValue([]);

    const result = (await load({} as unknown as Parameters<typeof load>[0])) as {
      stats: {
        tasksCompleted: number;
        activeVolunteers: number;
        ngosOnboarded: number;
        badgesAwarded: number;
        totalMinutesContributed: number;
        hoursContributed: string;
        avgTaskMinutes: number;
        durationCounts: Record<string, number>;
        causeBreakdown: Array<unknown>;
      };
    };

    expect(result.stats.tasksCompleted).toBe(0);
    expect(result.stats.activeVolunteers).toBe(0);
    expect(result.stats.ngosOnboarded).toBe(0);
    expect(result.stats.badgesAwarded).toBe(0);
    expect(result.stats.totalMinutesContributed).toBe(0);
    expect(result.stats.hoursContributed).toBe('0.0');
    expect(result.stats.avgTaskMinutes).toBe(0);
    expect(result.stats.causeBreakdown).toEqual([]);
  });
});
