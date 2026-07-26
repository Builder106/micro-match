import { describe, it, expect, beforeEach, vi } from 'vitest';

// Force in-memory mode by mocking env to empty, matching appwrite.test.ts.
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
  createTask,
  createClaim,
  updateClaimStatus,
  awardBadge,
  deleteTask,
  getTasks,
  getPublicImpactStats
} from './appwrite';

async function wipeTasks() {
  const tasks = await getTasks({ includeInactive: true });
  for (const t of tasks) await deleteTask(t.id);
}

describe('getPublicImpactStats (in-memory mode)', () => {
  beforeEach(async () => {
    await wipeTasks();
  });

  it('aggregates real counts without fabricating numbers', async () => {
    const taskA = await createTask({ title: 'A', shortDescription: '', tags: [], orgId: 'org-a' });
    const taskB = await createTask({ title: 'B', shortDescription: '', tags: [], orgId: 'org-b' });
    const taskC = await createTask({ title: 'C', shortDescription: '', tags: [], orgId: 'org-a' });
    await createTask({ title: 'D', shortDescription: '', tags: [] }); // no orgId

    const claim1 = await createClaim({ taskId: taskA.id, userId: 'u1' });
    const claim2 = await createClaim({ taskId: taskB.id, userId: 'u2' });
    const claim3 = await createClaim({ taskId: taskC.id, userId: 'u1' });
    const claim4 = await createClaim({ taskId: taskA.id, userId: 'u3' });

    await updateClaimStatus(claim1.id, 'approved');
    await updateClaimStatus(claim2.id, 'approved');
    await updateClaimStatus(claim3.id, 'pending');
    await updateClaimStatus(claim4.id, 'rejected');

    await awardBadge({ userId: 'u1', label: 'First Translation' });
    await awardBadge({ userId: 'u2', label: 'Speed Demon' });
    await awardBadge({ userId: 'u1', label: 'Perfect Week' });

    const stats = await getPublicImpactStats();

    expect(stats).toEqual({
      tasksCompleted: 2, // claim1, claim2 are 'approved'
      activeVolunteers: 2, // distinct userId among approved claims: u1, u2
      ngosOnboarded: 2, // distinct orgId across tasks: org-a, org-b
      badgesAwarded: 3
    });
  });
});
