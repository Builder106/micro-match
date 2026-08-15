import type { PageServerLoad } from './$types';
import { getTasks, getBadgeAnalytics } from '$lib/server/appwrite';

export const load: PageServerLoad = async ({ locals }) => {
  const userRole = locals.userRole ?? 'anonymous';
  const session = locals.session;
  const user = session?.user?.id ? { id: session.user.id, email: session.user.email ?? undefined } : null;

  if (userRole !== 'ngo') {
    throw new Error('Access denied: NGO access required');
  }

  // Get tasks for analytics context
  const tasks = await getTasks();

  // Get real analytics data from database
  const analytics = await getBadgeAnalytics();

  return {
    userRole,
    user,
    tasks,
    analytics
  };
};
