import { describe, it, expect, beforeEach, vi } from 'vitest';

// Force in-memory mode by mocking env to empty. With APPWRITE_* unset, the
// module's `useAppwrite` flag is false and all CRUD goes through its Maps.
const { envState } = vi.hoisted(() => ({ envState: {} as Record<string, string | undefined> }));
vi.mock('$env/dynamic/private', () => ({
  env: new Proxy(envState, { get: (_, key: string) => envState[key] })
}));
vi.mock('node-appwrite', () => ({
  Client: class { setEndpoint() { return this; } setProject() { return this; } setKey() { return this; } },
  TablesDB: class {},
  ID: { unique: () => 'unique' },
  Query: { equal: () => '', limit: () => '', orderDesc: () => '', lessThanEqual: () => '', lessThan: () => '' }
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

async function wipeTasks() {
  const tasks = await getTasks({ includeInactive: true });
  for (const t of tasks) await deleteTask(t.id);
}

describe('appwrite (in-memory mode) — tasks', () => {
  beforeEach(async () => {
    await wipeTasks();
  });

  it('createTask defaults status to active and isVerified to true', async () => {
    const task = await createTask({ title: 'T1', shortDescription: 'short', tags: [] });
    expect(task.id).toBeTruthy();
    expect(task.status).toBe('active');
    expect(task.isVerified).toBe(true);
    expect(task.createdAt).toBeTruthy();
  });

  it('normalizes empty task statuses to active on create and update', async () => {
    const task = await createTask({ title: 'Empty status', shortDescription: 'short', tags: [], status: '' as never });
    expect(task.status).toBe('active');

    await expect(updateTaskStatus(task.id, '' as never)).resolves.toEqual(expect.objectContaining({ status: 'active' }));
  });

  it('getTaskById returns the created task and undefined for unknown ids', async () => {
    const created = await createTask({ title: 'T2', shortDescription: 'short', tags: [] });
    expect(await getTaskById(created.id)).toEqual(created);
    expect(await getTaskById('ghost')).toBeUndefined();
  });

  it('getTasks filters by orgId', async () => {
    await createTask({ title: 'A', shortDescription: 's', tags: [], orgId: 'org-1' });
    await createTask({ title: 'B', shortDescription: 's', tags: [], orgId: 'org-2' });

    const orgOne = await getTasks({ orgId: 'org-1', includeInactive: true });
    expect(orgOne.map((t) => t.title)).toEqual(['A']);
  });

  it('getTasks (feed mode) excludes non-active, expired-deadline, unverified, and stale tasks', async () => {
    const active = await createTask({ title: 'Active', shortDescription: 's', tags: [] });
    const inactive = await createTask({ title: 'Inactive', shortDescription: 's', tags: [], status: 'expired' });
    const pastDeadline = await createTask({
      title: 'PastDeadline', shortDescription: 's', tags: [], deadline: new Date(Date.now() - 1000).toISOString()
    });
    const unverified = await createTask({ title: 'Unverified', shortDescription: 's', tags: [], isVerified: false });
    const stale = await createTask({
      title: 'Stale', shortDescription: 's', tags: [],
      lastActivityAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
    });

    const feed = await getTasks();
    const titles = feed.map((t) => t.title);

    expect(titles).toContain('Active');
    expect(titles).not.toContain('Inactive');
    expect(titles).not.toContain('PastDeadline');
    expect(titles).not.toContain('Unverified');
    expect(titles).not.toContain('Stale');
    // sanity: ids referenced so lint doesn't flag unused
    expect([active.id, inactive.id, pastDeadline.id, unverified.id, stale.id]).toHaveLength(5);
  });

  it('getTasks (includeInactive) returns everything regardless of status/deadline/verification', async () => {
    await createTask({ title: 'Inactive', shortDescription: 's', tags: [], status: 'expired' });
    const all = await getTasks({ includeInactive: true });
    expect(all.map((t) => t.title)).toContain('Inactive');
  });

  it('updateTaskStatus updates an existing task and returns undefined for unknown ids', async () => {
    const created = await createTask({ title: 'T3', shortDescription: 's', tags: [] });
    const updated = await updateTaskStatus(created.id, 'completed');
    expect(updated?.status).toBe('completed');
    expect(await updateTaskStatus('ghost', 'completed')).toBeUndefined();
  });

  it('updateTaskLastActivity stamps lastActivityAt on an existing task and no-ops for unknown ids', async () => {
    const created = await createTask({ title: 'T4', shortDescription: 's', tags: [] });
    await updateTaskLastActivity(created.id);
    const after = await getTaskById(created.id);
    expect(after?.lastActivityAt).toBeTruthy();

    await expect(updateTaskLastActivity('ghost')).resolves.toBeUndefined();
  });

  it('expireTasks flips active tasks past their deadline to expired and counts them', async () => {
    const expired = await createTask({
      title: 'Expiring', shortDescription: 's', tags: [], deadline: new Date(Date.now() - 1000).toISOString()
    });
    const notExpired = await createTask({ title: 'Fine', shortDescription: 's', tags: [] });

    const count = await expireTasks();

    expect(count).toBe(1);
    expect((await getTaskById(expired.id))?.status).toBe('expired');
    expect((await getTaskById(notExpired.id))?.status).toBe('active');
  });

  it('autoArchiveTasks flips stale active tasks to expired and counts them', async () => {
    const stale = await createTask({
      title: 'Stale', shortDescription: 's', tags: [],
      lastActivityAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
    });
    const fresh = await createTask({ title: 'Fresh', shortDescription: 's', tags: [], lastActivityAt: new Date().toISOString() });

    const count = await autoArchiveTasks();

    expect(count).toBe(1);
    expect((await getTaskById(stale.id))?.status).toBe('expired');
    expect((await getTaskById(fresh.id))?.status).toBe('active');
  });

  it('setTasksVerifiedForOrg updates isVerified for every task owned by the org', async () => {
    const a = await createTask({ title: 'A', shortDescription: 's', tags: [], orgId: 'org-1' });
    const b = await createTask({ title: 'B', shortDescription: 's', tags: [], orgId: 'org-1' });
    const other = await createTask({ title: 'C', shortDescription: 's', tags: [], orgId: 'org-2' });

    const count = await setTasksVerifiedForOrg('org-1', false);

    expect(count).toBe(2);
    expect((await getTaskById(a.id))?.isVerified).toBe(false);
    expect((await getTaskById(b.id))?.isVerified).toBe(false);
    expect((await getTaskById(other.id))?.isVerified).toBe(true);
  });

  it('deleteTask removes the task', async () => {
    const created = await createTask({ title: 'ToDelete', shortDescription: 's', tags: [] });
    await deleteTask(created.id);
    expect(await getTaskById(created.id)).toBeUndefined();
  });
});

describe('appwrite (in-memory mode) — claims', () => {
  it('createClaim defaults status to pending', async () => {
    const claim = await createClaim({ taskId: 'task-1', userId: 'user-1' });
    expect(claim.status).toBe('pending');
    expect(claim.id).toBeTruthy();
    expect(claim.createdAt).toBeTruthy();
  });

  it('createClaim honors an explicit status', async () => {
    const claim = await createClaim({ taskId: 'task-1', userId: 'user-1', status: 'approved' });
    expect(claim.status).toBe('approved');
  });

  it('getClaimById returns the created claim and undefined for unknown ids', async () => {
    const created = await createClaim({ taskId: 'task-1', userId: 'user-1' });
    expect(await getClaimById(created.id)).toEqual(created);
    expect(await getClaimById('ghost')).toBeUndefined();
  });

  it('getClaims filters by userId', async () => {
    await createClaim({ taskId: 'task-1', userId: 'user-A' });
    await createClaim({ taskId: 'task-2', userId: 'user-B' });

    const forA = await getClaims({ userId: 'user-A' });
    expect(forA.every((c) => c.userId === 'user-A')).toBe(true);
    expect(forA.length).toBeGreaterThan(0);
  });

  it('updateClaimStatus updates status/reviewedBy/reviewedAt and returns undefined for unknown ids', async () => {
    const created = await createClaim({ taskId: 'task-1', userId: 'user-1' });
    const updated = await updateClaimStatus(created.id, 'approved', 'reviewer-1');

    expect(updated?.status).toBe('approved');
    expect(updated?.reviewedBy).toBe('reviewer-1');
    expect(updated?.reviewedAt).toBeTruthy();
    expect(await updateClaimStatus('ghost', 'approved')).toBeUndefined();
  });
});

describe('appwrite (in-memory mode) — badges', () => {
  it('awardBadge stores a badge retrievable by listBadgesByUser and getBadges', async () => {
    const badge = await awardBadge({ userId: 'user-1', label: 'Helper' });
    expect(badge.id).toBeTruthy();
    expect(badge.awardedAt).toBeTruthy();

    const byUser = await listBadgesByUser('user-1');
    expect(byUser.map((b) => b.id)).toContain(badge.id);

    const all = await getBadges();
    expect(all.map((b) => b.id)).toContain(badge.id);
  });

  it('listBadgesByUser only returns badges for the given user', async () => {
    await awardBadge({ userId: 'user-X', label: 'A' });
    await awardBadge({ userId: 'user-Y', label: 'B' });

    const forX = await listBadgesByUser('user-X');
    expect(forX.every((b) => b.userId === 'user-X')).toBe(true);
  });

  it('getBadgeAnalytics returns the empty-analytics shape in in-memory mode', async () => {
    const analytics = await getBadgeAnalytics();
    expect(analytics).toEqual({
      totalBadgesAwarded: 0,
      totalVolunteersEngaged: 0,
      averageTasksPerVolunteer: 0,
      topBadgeTypes: [],
      engagementTrend: [],
      recentAwards: []
    });
  });
});
