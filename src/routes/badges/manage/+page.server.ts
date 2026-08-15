import type { PageServerLoad } from './$types';
import { getTasks } from '$lib/server/appwrite';
import { listBadgeDefinitions } from '$lib/server/badgeDefs';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const userRole = locals.userRole ?? 'anonymous';
  const session = locals.session;
  const user = session?.user?.id ? { id: session.user.id, email: session.user.email ?? undefined } : null;

  if (userRole !== 'ngo' || !user?.id) {
    throw error(403, 'NGO access required');
  }

  // Tasks owned by this NGO (used by the "specific task" criterion picker).
  const tasks = await getTasks({ orgId: user.id, includeInactive: true });

  // Badge definitions this NGO has created.
  const badges = await listBadgeDefinitions(user.id);

  return { userRole, user, tasks, badges };
};
