// Badge criteria evaluation — reads BadgeDefinitions owned by the task's NGO
// from Appwrite and matches them against an action.
//
// Currently supported criteria types:
//   - task-completion : matches every approved claim for any task owned by the org
//   - task-specific   : matches when the claim's taskId equals definition.taskId
//
// Reserved for future work (definitions exist but auto-award is a no-op):
//   - time-based, milestone, custom — these need additional fields on
//     BadgeDefinition (e.g. maxMinutes, taskCount, customLogic) before the
//     engine can match them. Until then, defs with these criteria are stored
//     but never auto-awarded.

import type { BadgeDefinition } from '$lib/types';
import { getTaskById } from './appwrite';
import { listBadgeDefinitions } from './badgeDefs';

export type BadgeAction = {
  type: 'task-completed' | 'task-claimed' | 'profile-updated';
  taskId?: string;
  taskTimeMinutes?: number;
  completedAt?: string;
};

/**
 * Return BadgeDefinitions whose criteria match the given action. Pulls
 * definitions from the org that owns the task in question (so one NGO's
 * badges don't get awarded for another NGO's tasks).
 */
export async function evaluateBadgeCriteria(
  _userId: string,
  action: BadgeAction,
): Promise<BadgeDefinition[]> {
  if (action.type !== 'task-completed' || !action.taskId) return [];

  const task = await getTaskById(action.taskId);
  if (!task?.orgId) return [];

  const defs = await listBadgeDefinitions(task.orgId);
  const matches: BadgeDefinition[] = [];

  for (const def of defs) {
    if (def.criteria === 'task-completion') {
      // Award for any task completion under this org.
      matches.push(def);
    } else if (def.criteria === 'task-specific') {
      if (def.taskId && def.taskId === action.taskId) matches.push(def);
    }
    // time-based / milestone / custom: unsupported in current schema, skip.
  }

  return matches;
}

/**
 * Milestone checks (e.g. "5 tasks in 30 days") need org-aware aggregate
 * queries. Not implemented yet — returns [] so callers don't break. Wire up
 * once BadgeDefinition gains a milestoneCount field and the awarder fetches
 * the user's approved-claim history.
 */
export async function checkMilestoneCriteria(_userId: string): Promise<BadgeDefinition[]> {
  return [];
}
