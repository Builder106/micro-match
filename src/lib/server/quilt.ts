// The community quilt, read from real claims. Nothing here invents a patch: every patch is a
// claim, and only claims a person approved count as sewn in.
import type { BadgeDefinition, Claim, Task } from '$lib/types';
import { designFor, badgeForTask, bySewnDate, patchFromClaim, type PatchDesign, type QuiltPatch } from '$lib/quilt/patches';
import { getClaims, getTasks } from './appwrite';
import { listBadgeDefinitions } from './badgeDefs';

export type QuiltFilter = {
  /** Only this volunteer's claims. */
  userId?: string;
  /** Only claims on tasks this nonprofit posted. */
  orgId?: string;
  /** Claim states to include. Defaults to approved only. */
  statuses?: Claim['status'][];
};

/** A nonprofit's badge designs; a failed lookup means no badge, never a broken page. */
const safeDefinitions = (orgId: string): Promise<BadgeDefinition[]> => listBadgeDefinitions(orgId).catch(() => []);

function definitionsLoader() {
  const cache = new Map<string, Promise<BadgeDefinition[]>>();
  return (orgId: string | undefined): Promise<BadgeDefinition[]> => {
    if (!orgId) return Promise.resolve([]);
    let defs = cache.get(orgId);
    if (!defs) {
      defs = safeDefinitions(orgId);
      cache.set(orgId, defs);
    }
    return defs;
  };
}

export async function getQuiltPatches(filter: QuiltFilter = {}): Promise<QuiltPatch[]> {
  const statuses = filter.statuses ?? ['approved'];
  const [claims, tasks] = await Promise.all([
    getClaims(filter.userId ? { userId: filter.userId } : undefined),
    getTasks({ includeInactive: true })
  ]);
  const taskById = new Map<string, Task>(tasks.map((t) => [t.id, t]));
  const definitions = definitionsLoader();

  const wanted = claims.filter((c) => {
    if (!statuses.includes(c.status)) return false;
    if (filter.userId && c.userId !== filter.userId) return false;
    if (filter.orgId && taskById.get(c.taskId)?.orgId !== filter.orgId) return false;
    return true;
  });

  const patches = await Promise.all(
    wanted.map(async (claim) => {
      const task = taskById.get(claim.taskId);
      return patchFromClaim(claim, task, await definitions(task?.orgId));
    })
  );
  return patches.sort(bySewnDate);
}

/** The patch a task becomes once approved, or null when its nonprofit has no badge yet. */
export async function getPatchDesignForTask(task: Pick<Task, 'id' | 'orgId'>): Promise<PatchDesign | null> {
  if (!task.orgId) return null;
  const defs = await safeDefinitions(task.orgId);
  const def = badgeForTask(task.id, defs);
  return def ? designFor(def) : null;
}
