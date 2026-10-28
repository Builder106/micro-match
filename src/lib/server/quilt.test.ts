import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: { getClaims: vi.fn(), getTasks: vi.fn(), listBadgeDefinitions: vi.fn() },
}));
vi.mock('./appwrite', () => ({ getClaims: mocks.getClaims, getTasks: mocks.getTasks }));
vi.mock('./badgeDefs', () => ({ listBadgeDefinitions: mocks.listBadgeDefinitions }));

import { getPatchDesignForTask, getQuiltPatches } from './quilt';

const tasks = [
  { id: 't1', orgId: 'org-a', title: 'One', shortDescription: '', tags: [], estimatedMinutes: 15 },
  { id: 't2', orgId: 'org-b', title: 'Two', shortDescription: '', tags: [] },
  { id: 't3', title: 'Orphan', shortDescription: '', tags: [] },
];
const claims = [
  { id: 'c1', taskId: 't1', userId: 'u1', status: 'approved', reviewedAt: '2026-10-03' },
  { id: 'c2', taskId: 't2', userId: 'u2', status: 'approved', reviewedAt: '2026-10-01' },
  { id: 'c3', taskId: 't1', userId: 'u1', status: 'pending', createdAt: '2026-10-04' },
  { id: 'c4', taskId: 't3', userId: 'u2', status: 'approved', reviewedAt: '2026-10-02' },
  { id: 'c5', taskId: 'gone', userId: 'u1', status: 'rejected', reviewedAt: '2026-10-05' },
];

describe('getQuiltPatches', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
    mocks.getClaims.mockResolvedValue(claims);
    mocks.getTasks.mockResolvedValue(tasks);
    mocks.listBadgeDefinitions.mockImplementation(async (orgId: string) =>
      orgId === 'org-a'
        ? [
            {
              id: 'd1',
              orgId,
              label: 'Helper',
              color: '#FF6B6B',
              icon: 'quilt:heart',
              criteria: 'task-completion',
            },
          ]
        : [],
    );
  });

  it('sews only approved claims, oldest first, dressed in their badge', async () => {
    const patches = await getQuiltPatches();
    expect(patches.map((p) => p.id)).toEqual(['c2', 'c4', 'c1']);
    expect(patches[2]).toMatchObject({
      label: 'Helper',
      color: '#FF6B6B',
      icon: 'heart',
      minutes: 15,
    });
    expect(patches[0].label).toBeNull();
    expect(mocks.getTasks).toHaveBeenCalledWith({ includeInactive: true });
    expect(mocks.getClaims).toHaveBeenCalledWith(undefined);
    expect(mocks.listBadgeDefinitions).toHaveBeenCalledTimes(2);
  });

  it("filters to one volunteer's claims in the states asked for", async () => {
    const patches = await getQuiltPatches({
      userId: 'u1',
      statuses: ['approved', 'pending', 'rejected'],
    });
    expect(mocks.getClaims).toHaveBeenCalledWith({ userId: 'u1' });
    expect(patches.map((p) => p.id)).toEqual(['c1', 'c3', 'c5']);
    expect(patches.find((p) => p.id === 'c5')?.taskTitle).toBeNull();
  });

  it("filters to claims on one nonprofit's tasks", async () => {
    expect((await getQuiltPatches({ orgId: 'org-b' })).map((p) => p.id)).toEqual(['c2']);
  });

  it('treats a badge lookup failure as no badge', async () => {
    mocks.listBadgeDefinitions.mockImplementation(async () => {
      throw new Error('down');
    });
    const patches = await getQuiltPatches();
    expect(patches.every((p) => p.label === null)).toBe(true);
  });
});

describe('getPatchDesignForTask', () => {
  beforeEach(() => mocks.listBadgeDefinitions.mockReset());

  it('returns the design of the badge that applies, or null', async () => {
    mocks.listBadgeDefinitions.mockResolvedValue([
      {
        id: 'd',
        orgId: 'o',
        label: 'Leaf',
        color: '#5E7D4F',
        icon: 'quilt:leaf',
        criteria: 'task-specific',
        taskId: 't9',
      },
    ]);
    expect(await getPatchDesignForTask({ id: 't9', orgId: 'o' })).toMatchObject({
      label: 'Leaf',
      icon: 'leaf',
    });
    expect(await getPatchDesignForTask({ id: 't1', orgId: 'o' })).toBeNull();
  });

  it('returns null for a task without an owner', async () => {
    expect(await getPatchDesignForTask({ id: 't1' })).toBeNull();
    expect(mocks.listBadgeDefinitions).not.toHaveBeenCalled();
  });
});
