import type { LayoutServerLoad } from './$types';
import { isUserAdmin } from '$lib/server/teams';
import { getTasks } from '$lib/server/appwrite';
import { getQuiltPatches } from '$lib/server/quilt';
import { translateTasks } from '$lib/server/taskTranslation';

/** The community block shows the newest four log cabin blocks; /impact shows them all. */
const QUILT_LIMIT = 52;
/** Task swatches pinned on the Tasks block. */
const TASK_PREVIEW = 3;

/** The quilt is on every page, so a failed lookup shows an empty block instead of breaking the site. */
function orEmpty<T>(what: string, pending: Promise<T[]>): Promise<T[]> {
  return pending.catch((error: unknown) => {
    console.error(`Layout could not load ${what}:`, error);
    return [];
  });
}

// The whole site is one quilt that stays on screen across every route, so the layout loads
// what its blocks show: the approved patches and a preview of the open tasks.
export const load: LayoutServerLoad = async ({ locals, url }) => {
  const userRole = locals.userRole ?? 'anonymous';
  const session = locals.session;
  const userId = session?.user?.id;
  const locale = locals.locale ?? 'en';
  const [isAdmin, patches, tasks] = await Promise.all([
    userId ? isUserAdmin(userId) : Promise.resolve(false),
    orEmpty('quilt patches', getQuiltPatches()),
    orEmpty('open tasks', getTasks())
  ]);
  return {
    userRole,
    isAdmin,
    origin: url.origin,
    locale,
    quilt: { patches: patches.slice(-QUILT_LIMIT), total: patches.length },
    openTasks: {
      count: tasks.length,
      upTo: Object.fromEntries(
        [15, 20, 30].map((cap) => [cap, tasks.filter((t) => typeof t.estimatedMinutes === 'number' && t.estimatedMinutes <= cap).length])
      ) as Record<15 | 20 | 30, number>,
      preview: await translateTasks(tasks.slice(0, TASK_PREVIEW), locale).catch(() => tasks.slice(0, TASK_PREVIEW))
    }
  };
};
