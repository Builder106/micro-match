import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Task } from '$lib/types';

// This module reads env once at import time to compute `useAppwrite`, so the
// Appwrite-backed branch needs its own file with truthy env set inside
// vi.hoisted (which runs before the hoisted vi.mock/import below it).
const { mocks, envState } = vi.hoisted(() => ({
  mocks: {
    listRows: vi.fn(),
    getRow: vi.fn(),
    createRow: vi.fn(),
    updateRow: vi.fn(),
    deleteRow: vi.fn()
  },
  envState: {
    APPWRITE_ENDPOINT: 'https://fake.appwrite.io/v1',
    APPWRITE_PROJECT_ID: 'proj',
    APPWRITE_API_KEY: 'key',
    APPWRITE_DB_ID: 'db',
    APPWRITE_TASKS_TABLE_ID: 'tasks',
    APPWRITE_CLAIMS_TABLE_ID: 'claims',
    APPWRITE_BADGES_TABLE_ID: 'badges'
  } as Record<string, string | undefined>
}));

vi.mock('$env/dynamic/private', () => ({
  env: new Proxy(envState, { get: (_, key: string) => envState[key] })
}));
vi.mock('node-appwrite', () => ({
  Client: class {
    setEndpoint() { return this; }
    setProject() { return this; }
    setKey() { return this; }
  },
  TablesDB: class {
    listRows = mocks.listRows;
    getRow = mocks.getRow;
    createRow = mocks.createRow;
    updateRow = mocks.updateRow;
    deleteRow = mocks.deleteRow;
  },
  ID: { unique: () => 'new-id' },
  Query: {
    equal: (k: string, v: unknown) => `equal(${k},${v})`,
    limit: (n: number) => `limit(${n})`,
    orderDesc: (k: string) => `orderDesc(${k})`,
    lessThanEqual: (k: string, v: unknown) => `lte(${k},${v})`,
    lessThan: (k: string, v: unknown) => `lt(${k},${v})`
  }
}));

import {
  getTasks,
  getTaskById,
  createTask,
  createClaim,
  getClaims,
  getClaimById,
  updateClaimStatus,
  listBadgesByUser,
  getBadges,
  awardBadge,
  getBadgeAnalytics,
  updateTaskStatus,
  updateTaskLastActivity,
  expireTasks,
  autoArchiveTasks,
  setTasksVerifiedForOrg,
  deleteTask
} from './appwrite';

const taskRow = {
  $id: 'row-1',
  orgID: 'org-1',
  title: 'Translate flyer',
  shortDescription: 'short',
  description: 'long',
  language: 'en',
  tags: ['i18n'],
  estimatedMinutes: 30,
  $createdAt: '2026-01-01T00:00:00.000Z',
  status: 'active',
  maxVolunteers: undefined,
  deadline: undefined,
  isVerified: true,
  lastActivityAt: '2026-01-01T00:00:00.000Z'
};

describe('appwrite (Appwrite-backed mode) — tasks', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
  });

  it('getTasks maps rows from tables.listRows into Task objects', async () => {
    mocks.listRows.mockResolvedValue({ rows: [taskRow] });

    const tasks = await getTasks({ includeInactive: true });

    expect(tasks).toEqual([
      expect.objectContaining({ id: 'row-1', orgId: 'org-1', title: 'Translate flyer' })
    ]);
  });

  it('getTasks applies the active-status query when not including inactive tasks', async () => {
    mocks.listRows.mockResolvedValue({ rows: [] });
    await getTasks();
    expect(mocks.listRows).toHaveBeenCalledWith({ databaseId: 'db', tableId: 'tasks', queries: expect.arrayContaining(['equal(status,active)']) });
  });

  it('getTasks scopes the Appwrite query to an NGO when requested', async () => {
    mocks.listRows.mockResolvedValue({ rows: [taskRow] });

    await getTasks({ orgId: 'org-1', includeInactive: true });

    expect(mocks.listRows).toHaveBeenCalledWith({ databaseId: 'db', tableId: 'tasks', queries: expect.arrayContaining(['equal(orgID,org-1)']) });
  });

  it('keeps active tasks without a volunteer limit in the feed', async () => {
    mocks.listRows.mockResolvedValue({ rows: [{ ...taskRow, lastActivityAt: new Date().toISOString() }] });

    await expect(getTasks()).resolves.toEqual([expect.objectContaining({ id: 'row-1' })]);
    expect(mocks.listRows).toHaveBeenCalledTimes(1);
  });

  it('keeps stale evergreen tasks in the feed and drops stale ordinary ones', async () => {
    mocks.listRows.mockResolvedValue({
      rows: [
        { ...taskRow, $id: 'curated', evergreen: true },
        { ...taskRow, $id: 'dead' }
      ]
    });

    const tasks = await getTasks();
    expect(tasks.map((t) => t.id)).toEqual(['curated']);
    expect(tasks[0].evergreen).toBe(true);
  });

  it('getTasks filters out tasks that reached volunteer limit', async () => {
    const taskWithLimit = {
      ...taskRow,
      $id: 't-limit',
      maxVolunteers: 5,
      lastActivityAt: new Date().toISOString()
    };
    mocks.listRows.mockImplementation(async ({ tableId: table }: { tableId: string }) => {
      if (table === 'tasks') return { rows: [taskWithLimit] };
      if (table === 'claims') return { total: 1000, rows: [] }; // reached limit
      return { rows: [] };
    });

    const tasks = await getTasks();
    expect(tasks).toHaveLength(0); // filtered out
  });

  it('keeps a limited task visible when the claim-limit lookup fails', async () => {
    mocks.listRows.mockImplementation(async ({ tableId: table }: { tableId: string }) => {
      if (table === 'tasks') {
        return { rows: [{ ...taskRow, $id: 't-limit-error', maxVolunteers: 1, lastActivityAt: new Date().toISOString() }] };
      }
      throw new Error('claims unavailable');
    });

    await expect(getTasks()).resolves.toEqual([expect.objectContaining({ id: 't-limit-error' })]);
  });

  it('excludes tasks explicitly marked as unverified', async () => {
    mocks.listRows.mockResolvedValueOnce({
      rows: [{ ...taskRow, $id: 'unverified', isVerified: false, lastActivityAt: new Date().toISOString() }]
    });

    await expect(getTasks()).resolves.toEqual([]);
  });


  it('getTaskById maps a single row and returns undefined on error', async () => {
    mocks.getRow.mockResolvedValueOnce(taskRow);
    expect(await getTaskById('row-1')).toEqual(expect.objectContaining({ id: 'row-1' }));

    mocks.getRow.mockRejectedValueOnce(new Error('not found'));
    expect(await getTaskById('ghost')).toBeUndefined();
  });

  it('createTask sends orgID (not orgId) to the table and maps the response back', async () => {
    mocks.createRow.mockResolvedValue(taskRow);

    const created = await createTask({ title: 'x', shortDescription: 's', tags: [], orgId: 'org-1' });

    expect(mocks.createRow).toHaveBeenCalledWith({ databaseId: 'db', tableId: 'tasks', rowId: 'new-id', data: expect.objectContaining({ orgID: 'org-1' }) });
    expect(created.orgId).toBe('org-1');
  });

  it('normalizes a malformed runtime tags value before creating a task', async () => {
    mocks.createRow.mockResolvedValueOnce(taskRow);

    await createTask({ title: 'x', shortDescription: 's', tags: 'not-an-array' as never });

    expect(mocks.createRow).toHaveBeenCalledWith({ databaseId: 'db', tableId: 'tasks', rowId: 'new-id', data: expect.objectContaining({ tags: [] }) });
  });

  it('updateTaskStatus maps the updated row and returns undefined on error', async () => {
    mocks.updateRow.mockResolvedValueOnce({ ...taskRow, status: 'completed' });
    const updated = await updateTaskStatus('row-1', 'completed');
    expect(updated?.status).toBe('completed');

    mocks.updateRow.mockRejectedValueOnce(new Error('nope'));
    expect(await updateTaskStatus('row-1', 'completed')).toBeUndefined();
  });

  it('normalizes an incomplete update response and an invalid status to safe defaults', async () => {
    mocks.updateRow.mockResolvedValueOnce({
      $id: 'row-defaults',
      title: 'Fallback task',
      shortDescription: 'short',
      tags: undefined,
      estimatedMinutes: null,
      status: '',
      maxVolunteers: null,
      deadline: null,
      isVerified: null,
      $createdAt: '2026-01-01T00:00:00.000Z'
    });

    const updated = await updateTaskStatus('row-defaults', '' as never);

    expect(mocks.updateRow).toHaveBeenCalledWith({ databaseId: 'db', tableId: 'tasks', rowId: 'row-defaults', data: expect.objectContaining({ status: 'active' }) });
    expect(updated).toEqual(expect.objectContaining({
      tags: [],
      estimatedMinutes: undefined,
      status: 'active',
      maxVolunteers: undefined,
      deadline: undefined,
      isVerified: true
    }));
  });

  it('reads serialized tag values from an update response', async () => {
    mocks.updateRow.mockResolvedValueOnce({ ...taskRow, tags: { values: ['serialized'] } });

    await expect(updateTaskStatus('row-1', 'active')).resolves.toEqual(
      expect.objectContaining({ tags: ['serialized'] })
    );
  });

  it.each([
    {
      name: 'getTasks',
      read: async (row: Record<string, unknown>): Promise<Task | undefined> => {
        mocks.listRows.mockResolvedValue({ rows: [row] });
        return (await getTasks({ includeInactive: true }))[0];
      }
    },
    {
      name: 'getTaskById',
      read: async (row: Record<string, unknown>): Promise<Task | undefined> => {
        mocks.getRow.mockResolvedValue(row);
        return getTaskById('row-1');
      }
    },
    {
      name: 'createTask',
      read: async (row: Record<string, unknown>): Promise<Task | undefined> => {
        mocks.createRow.mockResolvedValue(row);
        return createTask({ title: 'Fallback task', shortDescription: 'short', tags: [] });
      }
    },
    {
      name: 'updateTaskStatus',
      read: async (row: Record<string, unknown>): Promise<Task | undefined> => {
        mocks.updateRow.mockResolvedValue(row);
        return updateTaskStatus('row-1', 'active');
      }
    }
  ])('$name normalizes JSON tags and missing task metadata', async ({ read }) => {
    const serialized = await read({
      ...taskRow,
      tags: { values: ['serialized'] },
      estimatedMinutes: null,
      status: '',
      isVerified: undefined
    });
    expect(serialized).toEqual(expect.objectContaining({
      tags: ['serialized'],
      estimatedMinutes: undefined,
      status: 'active',
      isVerified: true
    }));

    const missingTags = await read({ ...taskRow, tags: undefined });
    expect(missingTags?.tags).toEqual([]);
  });

  it('updateTaskLastActivity calls updateRow and swallows errors', async () => {
    mocks.updateRow.mockResolvedValueOnce({});
    await expect(updateTaskLastActivity('row-1')).resolves.toBeUndefined();

    mocks.updateRow.mockRejectedValueOnce(new Error('nope'));
    await expect(updateTaskLastActivity('row-1')).resolves.toBeUndefined();
  });

  it('expireTasks updates each row past its deadline and counts successes, tolerating per-row failures', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: [{ $id: 'a' }, { $id: 'b' }] });
    mocks.updateRow.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('row b failed'));

    const count = await expireTasks();
    expect(count).toBe(1);
  });

  it('expireTasks returns 0 when the query itself fails', async () => {
    mocks.listRows.mockRejectedValueOnce(new Error('down'));
    expect(await expireTasks()).toBe(0);
  });

  it('autoArchiveTasks updates each stale row and counts successes', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: [{ $id: 'a' }] });
    mocks.updateRow.mockResolvedValueOnce({});

    expect(await autoArchiveTasks()).toBe(1);
  });

  it('autoArchiveTasks leaves evergreen rows active', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: [{ $id: 'curated', evergreen: true }, { $id: 'dead' }] });
    mocks.updateRow.mockResolvedValueOnce({});

    expect(await autoArchiveTasks()).toBe(1);
    expect(mocks.updateRow).toHaveBeenCalledTimes(1);
    expect(mocks.updateRow).toHaveBeenCalledWith(expect.objectContaining({ rowId: 'dead' }));
  });

  it('autoArchiveTasks returns 0 when the query itself fails', async () => {
    mocks.listRows.mockRejectedValueOnce(new Error('down'));
    expect(await autoArchiveTasks()).toBe(0);
  });

  it('setTasksVerifiedForOrg updates every row for the org and counts successes', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: [{ $id: 'a' }, { $id: 'b' }] });
    mocks.updateRow.mockResolvedValue({});

    const count = await setTasksVerifiedForOrg('org-1', false);

    expect(count).toBe(2);
    expect(mocks.updateRow).toHaveBeenCalledWith({ databaseId: 'db', tableId: 'tasks', rowId: 'a', data: { isVerified: false } });
  });

  it('setTasksVerifiedForOrg returns 0 when the query itself fails', async () => {
    mocks.listRows.mockRejectedValueOnce(new Error('down'));
    expect(await setTasksVerifiedForOrg('org-1', true)).toBe(0);
  });

  it('deleteTask calls tables.deleteRow', async () => {
    mocks.deleteRow.mockResolvedValue(undefined);
    await deleteTask('row-1');
    expect(mocks.deleteRow).toHaveBeenCalledWith({ databaseId: 'db', tableId: 'tasks', rowId: 'row-1' });
  });
});

describe('appwrite (Appwrite-backed mode) — claims', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
  });

  const claimRow = {
    $id: 'claim-1',
    taskID: 'task-1',
    userID: 'user-1',
    notes: 'done',
    proofURL: 'https://proof',
    status: 'pending',
    reviewedBy: undefined,
    reviewedAt: undefined,
    $createdAt: '2026-01-01T00:00:00.000Z'
  };

  it('createClaim maps taskId/userId/proofUrl to the database column names', async () => {
    mocks.createRow.mockResolvedValue(claimRow);

    const claim = await createClaim({ taskId: 'task-1', userId: 'user-1', notes: 'done', proofUrl: 'https://proof' });

    expect(mocks.createRow).toHaveBeenCalledWith({
      databaseId: 'db',
      tableId: 'claims',
      rowId: 'new-id',
      data: expect.objectContaining({
      taskID: 'task-1', userID: 'user-1', notes: 'done', proofURL: 'https://proof'
    })
    });
    expect(claim).toEqual(expect.objectContaining({ id: 'claim-1', taskId: 'task-1', userId: 'user-1' }));
  });

  it('getClaims maps rows and applies the userID filter', async () => {
    mocks.listRows.mockResolvedValue({ rows: [claimRow] });
    const claims = await getClaims({ userId: 'user-1' });

    expect(mocks.listRows).toHaveBeenCalledWith({ databaseId: 'db', tableId: 'claims', queries: expect.arrayContaining(['equal(userID,user-1)']) });
    expect(claims[0]).toEqual(expect.objectContaining({ id: 'claim-1', taskId: 'task-1' }));
  });

  it('getClaims lists all claims without adding a user filter', async () => {
    mocks.listRows.mockResolvedValue({ rows: [claimRow] });

    await expect(getClaims()).resolves.toEqual([expect.objectContaining({ id: 'claim-1' })]);
    expect(mocks.listRows).toHaveBeenCalledWith({ databaseId: 'db', tableId: 'claims', queries: ['limit(100)'] });
  });

  it('getClaimById maps a row and returns undefined on error', async () => {
    mocks.getRow.mockResolvedValueOnce(claimRow);
    expect(await getClaimById('claim-1')).toEqual(expect.objectContaining({ id: 'claim-1' }));

    mocks.getRow.mockRejectedValueOnce(new Error('nope'));
    expect(await getClaimById('ghost')).toBeUndefined();
  });

  it('updateClaimStatus maps the updated row and returns undefined on error', async () => {
    mocks.updateRow.mockResolvedValueOnce({ ...claimRow, status: 'approved', reviewedBy: 'reviewer-1' });
    const updated = await updateClaimStatus('claim-1', 'approved', 'reviewer-1');
    expect(updated?.status).toBe('approved');
    expect(updated?.reviewedBy).toBe('reviewer-1');

    mocks.updateRow.mockRejectedValueOnce(new Error('nope'));
    expect(await updateClaimStatus('claim-1', 'approved')).toBeUndefined();
  });

  it('omits empty optional claim inputs and normalizes absent optional output fields', async () => {
    const sparseClaimRow = {
      $id: 'claim-sparse',
      taskID: 'task-1',
      status: 'pending',
      userID: null,
      notes: null,
      proofURL: null,
      reviewedBy: null,
      reviewedAt: null,
      $createdAt: '2026-01-01T00:00:00.000Z'
    };

    mocks.createRow.mockResolvedValueOnce(sparseClaimRow);
    await expect(createClaim({ taskId: 'task-1' })).resolves.toEqual(expect.objectContaining({
      userId: undefined,
      notes: undefined,
      proofUrl: undefined,
      reviewedBy: undefined,
      reviewedAt: undefined
    }));
    expect(mocks.createRow).toHaveBeenCalledWith({
      databaseId: 'db',
      tableId: 'claims',
      rowId: 'new-id',
      data: expect.not.objectContaining({
      userID: expect.anything(), notes: expect.anything(), proofURL: expect.anything()
    })
    });

    mocks.listRows.mockResolvedValueOnce({ rows: [sparseClaimRow] });
    await expect(getClaims()).resolves.toEqual([expect.objectContaining({ userId: undefined, notes: undefined, proofUrl: undefined })]);

    mocks.getRow.mockResolvedValueOnce(sparseClaimRow);
    await expect(getClaimById('claim-sparse')).resolves.toEqual(expect.objectContaining({ reviewedBy: undefined, reviewedAt: undefined }));

    mocks.updateRow.mockResolvedValueOnce(sparseClaimRow);
    await expect(updateClaimStatus('claim-sparse', 'pending')).resolves.toEqual(expect.objectContaining({
      userId: undefined,
      notes: undefined,
      proofUrl: undefined,
      reviewedBy: undefined,
      reviewedAt: undefined
    }));
    expect(mocks.updateRow).toHaveBeenCalledWith({ databaseId: 'db', tableId: 'claims', rowId: 'claim-sparse', data: expect.objectContaining({ reviewedBy: null }) });
  });
});

describe('appwrite (Appwrite-backed mode) — badges', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
  });

  const badgeRow = {
    $id: 'badge-1', userID: 'user-1', taskID: 'task-1', label: 'Helper', color: '#FF6B6B',
    awardedAt: '2026-01-01T00:00:00.000Z', $createdAt: '2026-01-01T00:00:00.000Z'
  };

  it('awardBadge maps userId to userID and maps the response back', async () => {
    mocks.createRow.mockResolvedValue(badgeRow);
    const badge = await awardBadge({ userId: 'user-1', label: 'Helper', taskId: 'task-1', color: '#FF6B6B' });

    expect(mocks.createRow).toHaveBeenCalledWith({ databaseId: 'db', tableId: 'badges', rowId: 'new-id', data: expect.objectContaining({ userID: 'user-1' }) });
    expect(badge).toEqual(expect.objectContaining({ id: 'badge-1', userId: 'user-1' }));
  });

  it('listBadgesByUser maps rows and returns [] when the query fails', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: [badgeRow] });
    expect(await listBadgesByUser('user-1')).toEqual([expect.objectContaining({ id: 'badge-1' })]);

    mocks.listRows.mockRejectedValueOnce(new Error('schema missing userID'));
    expect(await listBadgesByUser('user-1')).toEqual([]);
  });

  it('getBadges maps rows and returns [] when the query fails', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: [badgeRow] });
    expect(await getBadges()).toEqual([expect.objectContaining({ id: 'badge-1' })]);

    mocks.listRows.mockRejectedValueOnce(new Error('down'));
    expect(await getBadges()).toEqual([]);
  });

  it('getBadgeAnalytics returns the empty shape when there are no badges', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: [] });
    const analytics = await getBadgeAnalytics();
    expect(analytics.totalBadgesAwarded).toBe(0);
  });

  it('getBadgeAnalytics aggregates totals, top badge types, and recent awards with monthly trend', async () => {
    const recent = new Date().toISOString();
    const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const fourMonthsAgo = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString();

    mocks.listRows.mockResolvedValueOnce({
      rows: [
        { ...badgeRow, $id: 'b1', userID: 'user-1', label: 'Helper', awardedAt: recent },
        { ...badgeRow, $id: 'b2', userID: 'user-1', label: 'Helper', awardedAt: twoMonthsAgo },
        { ...badgeRow, $id: 'b3', userID: 'user-2', label: 'Speedy', awardedAt: fourMonthsAgo },
        { ...badgeRow, $id: 'b4', userID: 'user-2', label: 'Speedy', awardedAt: fourMonthsAgo },
        { ...badgeRow, $id: 'b5', userID: 'user-3', label: 'Legacy', awardedAt: '2000-01-01T00:00:00.000Z' }
      ]
    });

    const analytics = await getBadgeAnalytics();

    expect(analytics.totalBadgesAwarded).toBe(5);
    expect(analytics.totalVolunteersEngaged).toBe(3);
    expect(analytics.topBadgeTypes[0]).toEqual(expect.objectContaining({ type: 'Helper', count: 2 }));
    expect(analytics.engagementTrend.length).toBeGreaterThanOrEqual(1);
    expect(analytics.engagementTrend.find((entry) => entry.badges === 2)?.volunteers).toBe(1);
    expect(analytics.recentAwards).toHaveLength(5);
  });

  it('getBadgeAnalytics fails safe (empty shape) when the query throws', async () => {
    mocks.listRows.mockRejectedValueOnce(new Error('down'));
    const analytics = await getBadgeAnalytics();
    expect(analytics.totalBadgesAwarded).toBe(0);
  });

  it('maps optional badge values and analytics display fallbacks', async () => {
    mocks.createRow.mockResolvedValueOnce({
      ...badgeRow,
      taskID: null,
      color: null,
      awardedAt: undefined
    });
    await awardBadge({ userId: 'user-1', label: 'Helper' });
    expect(mocks.createRow).toHaveBeenCalledWith({
      databaseId: 'db',
      tableId: 'badges',
      rowId: 'new-id',
      data: {
      userID: 'user-1',
      label: 'Helper',
      awardedAt: expect.any(String)
    }
    });

    mocks.listRows.mockResolvedValueOnce({
      rows: [{ ...badgeRow, userID: '', taskID: null, label: '', awardedAt: undefined }]
    });
    const analytics = await getBadgeAnalytics();
    expect(analytics.topBadgeTypes).toEqual([{ type: 'Unnamed Badge', count: 1, percentage: 100 }]);
    expect(analytics.recentAwards).toEqual([
      expect.objectContaining({ volunteer: 'Unknown Volunteer', badge: 'Unnamed Badge', task: 'General Task' })
    ]);
  });

  it('normalizes a missing badge color in analytics rows', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: [{ ...badgeRow, color: null }] });

    await expect(getBadgeAnalytics()).resolves.toEqual(expect.objectContaining({ totalBadgesAwarded: 1 }));
  });

  it('normalizes nullable badge fields across badge read paths', async () => {
    const sparseBadgeRow = {
      ...badgeRow,
      taskID: null,
      color: null,
      awardedAt: undefined
    };

    mocks.createRow.mockResolvedValueOnce(sparseBadgeRow);
    await expect(awardBadge({ userId: 'user-1', label: 'Helper' })).resolves.toEqual(expect.objectContaining({
      taskId: undefined,
      color: undefined,
      awardedAt: sparseBadgeRow.$createdAt
    }));

    mocks.listRows.mockResolvedValueOnce({ rows: [sparseBadgeRow] });
    await expect(listBadgesByUser('user-1')).resolves.toEqual([expect.objectContaining({
      taskId: undefined,
      color: undefined,
      awardedAt: sparseBadgeRow.$createdAt
    })]);

    mocks.listRows.mockResolvedValueOnce({ rows: [sparseBadgeRow] });
    await expect(getBadges()).resolves.toEqual([expect.objectContaining({
      taskId: undefined,
      color: undefined,
      awardedAt: sparseBadgeRow.$createdAt
    })]);
  });

  it('uses now for undated badges and excludes old badges from the trend', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-23T12:00:00.000Z'));
    try {
      mocks.listRows.mockResolvedValueOnce({
        rows: [
          { ...badgeRow, $id: 'undated', awardedAt: undefined, $createdAt: undefined },
          { ...badgeRow, $id: 'old', awardedAt: '2000-01-01T00:00:00.000Z' }
        ]
      });

      const analytics = await getBadgeAnalytics();

      expect(analytics.totalBadgesAwarded).toBe(2);
      expect(analytics.engagementTrend).toEqual([expect.objectContaining({ badges: 1 })]);
      expect(analytics.recentAwards).toEqual(expect.arrayContaining([
        expect.objectContaining({ date: '2026-08-23' })
      ]));
    } finally {
      vi.useRealTimers();
    }
  });

});
