// A patch is one claim on the quilt. Its cloth and embroidered icon come from the badge the
// task's nonprofit designed: a badge for that exact task first, then the nonprofit's badge
// for any completed task. Without a badge the patch is plain, undyed muslin.
import type { BadgeDefinition, Claim, Task } from '$lib/types';
import { fabricFor, threadFor } from './fabrics';
import { resolvePatchIcon, type PatchIcon } from './icons';

export type PatchDesign = { color: string; thread: string; icon: PatchIcon | null; label: string | null };

export type QuiltPatch = PatchDesign & {
  id: string;
  status: Claim['status'];
  taskId: string;
  taskTitle: string | null;
  minutes: number | null;
  /** When a person approved it, or when it was submitted if it is still pinned. */
  sewnAt: string | null;
};

/** The badge definition that dresses a patch for this task, if the nonprofit made one. */
export function badgeForTask(taskId: string, defs: BadgeDefinition[]): BadgeDefinition | undefined {
  return (
    defs.find((d) => d.criteria === 'task-specific' && d.taskId === taskId) ??
    defs.find((d) => d.criteria === 'task-completion')
  );
}

/** Cloth, thread, icon and label for a badge definition (or plain muslin without one). */
export function designFor(def: Pick<BadgeDefinition, 'color' | 'icon' | 'label'> | undefined | null): PatchDesign {
  return {
    color: fabricFor(def?.color),
    thread: threadFor(def?.color),
    icon: resolvePatchIcon(def?.icon),
    label: def?.label ?? null
  };
}

export function patchFromClaim(claim: Claim, task: Task | undefined, defs: BadgeDefinition[]): QuiltPatch {
  return {
    ...designFor(badgeForTask(claim.taskId, defs)),
    id: claim.id,
    status: claim.status,
    taskId: claim.taskId,
    taskTitle: task?.title ?? null,
    minutes: typeof task?.estimatedMinutes === 'number' ? task.estimatedMinutes : null,
    sewnAt: claim.reviewedAt ?? claim.createdAt ?? null
  };
}

/** Oldest first: the first approval is the center square, the newest is the outermost strip. */
export function bySewnDate(a: QuiltPatch, b: QuiltPatch): number {
  return (a.sewnAt ?? '').localeCompare(b.sewnAt ?? '') || a.id.localeCompare(b.id);
}
