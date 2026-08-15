import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { BadgeDefinition, Task } from '$lib/types';

const { mockGetTaskById, mockListBadgeDefinitions } = vi.hoisted(() => ({
  mockGetTaskById: vi.fn<(id: string) => Promise<Task | undefined>>(),
  mockListBadgeDefinitions: vi.fn<(orgId: string) => Promise<BadgeDefinition[]>>()
}));

vi.mock('./appwrite', () => ({ getTaskById: mockGetTaskById }));
vi.mock('./badgeDefs', () => ({ listBadgeDefinitions: mockListBadgeDefinitions }));

import { evaluateBadgeCriteria, checkMilestoneCriteria } from './badgeCriteria';

const baseTask: Task = {
  id: 'task-1',
  orgId: 'org-A',
  title: 'Translate flyer',
  shortDescription: 'do the thing',
  tags: ['translation', 'spanish'],
  estimatedMinutes: 15
};

function def(overrides: Partial<BadgeDefinition>): BadgeDefinition {
  return {
    id: overrides.id ?? `def-${Math.random()}`,
    orgId: overrides.orgId ?? 'org-A',
    label: overrides.label ?? 'A Badge',
    color: overrides.color ?? '#FF6B6B',
    criteria: overrides.criteria ?? 'task-completion',
    taskId: overrides.taskId,
    icon: overrides.icon,
    description: overrides.description,
    createdAt: overrides.createdAt
  };
}

describe('evaluateBadgeCriteria', () => {
  beforeEach(() => {
    mockGetTaskById.mockReset();
    mockListBadgeDefinitions.mockReset();
  });

  it('returns [] for non-completion actions without hitting the DB', async () => {
    const result = await evaluateBadgeCriteria('user-1', { type: 'task-claimed', taskId: 'task-1' });
    expect(result).toEqual([]);
    expect(mockGetTaskById).not.toHaveBeenCalled();
    expect(mockListBadgeDefinitions).not.toHaveBeenCalled();
  });

  it('returns [] when the action is missing taskId', async () => {
    const result = await evaluateBadgeCriteria('user-1', { type: 'task-completed' });
    expect(result).toEqual([]);
    expect(mockGetTaskById).not.toHaveBeenCalled();
  });

  it('returns [] when the task lookup fails or has no orgId', async () => {
    mockGetTaskById.mockResolvedValue(undefined);
    const a = await evaluateBadgeCriteria('user-1', { type: 'task-completed', taskId: 'task-1' });
    expect(a).toEqual([]);

    mockGetTaskById.mockResolvedValue({ ...baseTask, orgId: undefined });
    const b = await evaluateBadgeCriteria('user-1', { type: 'task-completed', taskId: 'task-1' });
    expect(b).toEqual([]);
  });

  it('matches every task-completion definition for the task’s org', async () => {
    mockGetTaskById.mockResolvedValue(baseTask);
    const defs = [
      def({ id: 'd1', criteria: 'task-completion' }),
      def({ id: 'd2', criteria: 'task-completion' })
    ];
    mockListBadgeDefinitions.mockResolvedValue(defs);

    const result = await evaluateBadgeCriteria('user-1', { type: 'task-completed', taskId: 'task-1' });

    expect(result).toHaveLength(2);
    expect(result.map((d) => d.id).sort()).toEqual(['d1', 'd2']);
    expect(mockListBadgeDefinitions).toHaveBeenCalledWith('org-A');
  });

  it('matches a task-specific definition only when taskId equals def.taskId', async () => {
    mockGetTaskById.mockResolvedValue(baseTask);
    mockListBadgeDefinitions.mockResolvedValue([
      def({ id: 'matches', criteria: 'task-specific', taskId: 'task-1' }),
      def({ id: 'misses', criteria: 'task-specific', taskId: 'task-9' }),
      def({ id: 'no-task-id', criteria: 'task-specific' /* taskId omitted */ })
    ]);

    const result = await evaluateBadgeCriteria('user-1', { type: 'task-completed', taskId: 'task-1' });

    expect(result.map((d) => d.id)).toEqual(['matches']);
  });

  it('ignores criteria types the engine cannot evaluate yet (time-based, milestone, custom)', async () => {
    mockGetTaskById.mockResolvedValue(baseTask);
    mockListBadgeDefinitions.mockResolvedValue([
      def({ id: 'time', criteria: 'time-based' }),
      def({ id: 'milestone', criteria: 'milestone' }),
      def({ id: 'custom', criteria: 'custom' }),
      def({ id: 'completion', criteria: 'task-completion' })
    ]);

    const result = await evaluateBadgeCriteria('user-1', { type: 'task-completed', taskId: 'task-1' });

    expect(result.map((d) => d.id)).toEqual(['completion']);
  });

  it('scopes definition lookup to the task’s org (no cross-org bleed)', async () => {
    mockGetTaskById.mockResolvedValue({ ...baseTask, orgId: 'org-B' });
    mockListBadgeDefinitions.mockResolvedValue([]);

    await evaluateBadgeCriteria('user-1', { type: 'task-completed', taskId: 'task-1' });

    expect(mockListBadgeDefinitions).toHaveBeenCalledExactlyOnceWith('org-B');
  });
});

describe('checkMilestoneCriteria', () => {
  it('returns [] until milestone aggregation is implemented', async () => {
    const result = await checkMilestoneCriteria('user-1');
    expect(result).toEqual([]);
  });
});
