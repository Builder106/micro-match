// Automatic badge awarding pipeline.
// Triggered when a claim transitions to "approved" (real task completion).
//
// For each BadgeDefinition whose criteria match the action, awardBadge
// inserts a Badge row keyed to the volunteer. Dedupe on (userId, label)
// so the same template only awards once.

import type { BadgeDefinition } from '$lib/types';
import { awardBadge, listBadgesByUser } from './appwrite';
import { checkMilestoneCriteria, evaluateBadgeCriteria, type BadgeAction } from './badgeCriteria';

export async function processBadgeAwards(userId: string, action: BadgeAction): Promise<string[]> {
  const awardedIds: string[] = [];

  try {
    const existing = await listBadgesByUser(userId);
    const heldLabels = new Set(existing.map((b) => b.label));

    const definitions: BadgeDefinition[] = [];
    definitions.push(...(await evaluateBadgeCriteria(userId, action)));

    if (action.type === 'task-completed') {
      definitions.push(...(await checkMilestoneCriteria(userId)));
    }

    // Dedupe by id within this batch.
    const uniqueDefs = new Map(definitions.map((d) => [d.id, d]));

    for (const def of uniqueDefs.values()) {
      if (heldLabels.has(def.label)) continue; // user already has this badge
      const badgeId = await awardForDefinition(userId, def, action);
      if (badgeId) {
        heldLabels.add(def.label);
        awardedIds.push(badgeId);
      }
    }
  } catch (err) {
    console.error('processBadgeAwards error:', err);
  }

  return awardedIds;
}

async function awardForDefinition(
  userId: string,
  def: BadgeDefinition,
  action: BadgeAction,
): Promise<string | null> {
  try {
    const badge = await awardBadge({
      userId,
      taskId: action.taskId,
      label: def.label,
      color: def.color,
    });
    return badge.id;
  } catch (err) {
    console.error(`Failed to award badge "${def.label}":`, err);
    return null;
  }
}

/** Convenience hook for the claim-approval endpoint. */
export async function onTaskApproved(
  userId: string,
  taskId: string,
  completionTimeMinutes?: number,
): Promise<string[]> {
  return processBadgeAwards(userId, {
    type: 'task-completed',
    taskId,
    taskTimeMinutes: completionTimeMinutes,
    completedAt: new Date().toISOString(),
  });
}

/** Kept for backwards compatibility — old call sites still reference it. */
export async function onTaskCompleted(
  userId: string,
  taskId: string,
  completionTimeMinutes: number,
): Promise<string[]> {
  return onTaskApproved(userId, taskId, completionTimeMinutes);
}
