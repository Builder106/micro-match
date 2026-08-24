import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Badge, BadgeDefinition } from '$lib/types';

const { mockAwardBadge, mockListBadgesByUser, mockEvaluate, mockMilestone } = vi.hoisted(() => ({
  mockAwardBadge: vi.fn<(input: Omit<Badge, 'id' | 'awardedAt'>) => Promise<Badge>>(),
  mockListBadgesByUser: vi.fn<(userId: string) => Promise<Badge[]>>(),
  mockEvaluate: vi.fn<(userId: string, action: { type: string; taskId: string; taskTimeMinutes?: number }) => Promise<BadgeDefinition[]>>(),
  mockMilestone: vi.fn<(userId: string) => Promise<BadgeDefinition[]>>()
}));

vi.mock('./appwrite', () => ({
  awardBadge: mockAwardBadge,
  listBadgesByUser: mockListBadgesByUser
}));
vi.mock('./badgeCriteria', () => ({
  evaluateBadgeCriteria: mockEvaluate,
  checkMilestoneCriteria: mockMilestone
}));

import { processBadgeAwards, onTaskApproved } from './badgeAwarder';

function def(label: string, id = label, taskId?: string): BadgeDefinition {
  return {
    id,
    orgId: 'org-A',
    label,
    color: '#FF6B6B',
    criteria: 'task-completion',
    taskId,
    icon: undefined,
    description: undefined,
    createdAt: undefined
  };
}

function badge(label: string, id = `b-${label}`): Badge {
  return { id, userId: 'user-1', label, color: '#000', awardedAt: new Date().toISOString() };
}

describe('processBadgeAwards', () => {
  beforeEach(() => {
    mockAwardBadge.mockReset();
    mockListBadgesByUser.mockReset();
    mockEvaluate.mockReset();
    mockMilestone.mockReset();
    // Default: user has no existing badges; nothing to award by default.
    mockListBadgesByUser.mockResolvedValue([]);
    mockEvaluate.mockResolvedValue([]);
    mockMilestone.mockResolvedValue([]);
    mockAwardBadge.mockImplementation(async (input) => ({
      id: `awarded-${input.label}`,
      userId: input.userId,
      label: input.label,
      color: input.color,
      awardedAt: new Date().toISOString()
    }));
  });

  it('awards every matched definition that the user does not already hold', async () => {
    mockEvaluate.mockResolvedValue([def('First'), def('Speedy')]);

    const ids = await processBadgeAwards('user-1', { type: 'task-completed', taskId: 'task-1' });

    expect(ids).toEqual(['awarded-First', 'awarded-Speedy']);
    expect(mockAwardBadge).toHaveBeenCalledTimes(2);
  });

  it('skips definitions whose label the user already holds', async () => {
    mockListBadgesByUser.mockResolvedValue([badge('First')]);
    mockEvaluate.mockResolvedValue([def('First'), def('Speedy')]);

    const ids = await processBadgeAwards('user-1', { type: 'task-completed', taskId: 'task-1' });

    expect(ids).toEqual(['awarded-Speedy']);
    expect(mockAwardBadge).toHaveBeenCalledTimes(1);
    expect(mockAwardBadge).toHaveBeenCalledWith(expect.objectContaining({ label: 'Speedy' }));
  });

  it('dedupes within a single batch when evaluate + milestone return the same def id', async () => {
    const shared = def('OnePerUser', 'def-shared');
    mockEvaluate.mockResolvedValue([shared]);
    mockMilestone.mockResolvedValue([shared]);

    const ids = await processBadgeAwards('user-1', { type: 'task-completed', taskId: 'task-1' });

    expect(ids).toEqual(['awarded-OnePerUser']);
    expect(mockAwardBadge).toHaveBeenCalledTimes(1);
  });

  it('does not query milestones for non-completion actions', async () => {
    await processBadgeAwards('user-1', { type: 'task-claimed', taskId: 'task-1' });
    expect(mockMilestone).not.toHaveBeenCalled();
  });

  it('continues awarding the rest of the batch when one award throws', async () => {
    mockEvaluate.mockResolvedValue([def('First'), def('Speedy'), def('Third')]);
    mockAwardBadge.mockImplementationOnce(async () => { throw new Error('appwrite kaboom'); });

    const ids = await processBadgeAwards('user-1', { type: 'task-completed', taskId: 'task-1' });

    expect(ids).toEqual(['awarded-Speedy', 'awarded-Third']);
    expect(mockAwardBadge).toHaveBeenCalledTimes(3);
  });

  it('passes the action.taskId through to awardBadge so the badge is anchored to the task', async () => {
    mockEvaluate.mockResolvedValue([def('First')]);

    await processBadgeAwards('user-1', { type: 'task-completed', taskId: 'task-7' });

    expect(mockAwardBadge).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      taskId: 'task-7',
      label: 'First',
      color: '#FF6B6B'
    }));
  });

  it('returns [] without throwing if the criteria engine errors', async () => {
    mockEvaluate.mockRejectedValue(new Error('db down'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    const ids = await processBadgeAwards('user-1', { type: 'task-completed', taskId: 'task-1' });

    expect(ids).toEqual([]);
    expect(errSpy).toHaveBeenCalled();
  });

  it('onTaskApproved is a thin wrapper that fixes type=task-completed', async () => {
    mockEvaluate.mockResolvedValue([def('First')]);

    await onTaskApproved('user-1', 'task-1', 15);

    expect(mockEvaluate).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ type: 'task-completed', taskId: 'task-1', taskTimeMinutes: 15 })
    );
  });

  it('onTaskCompleted backwards-compatibility wrapper invokes onTaskApproved', async () => {
    const { onTaskCompleted } = await import('./badgeAwarder');
    mockEvaluate.mockResolvedValue([def('First')]);

    await onTaskCompleted('user-1', 'task-1', 20);

    expect(mockEvaluate).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ type: 'task-completed', taskId: 'task-1', taskTimeMinutes: 20 })
    );
  });
});
