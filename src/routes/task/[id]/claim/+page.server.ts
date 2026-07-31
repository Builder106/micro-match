import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { getTaskById } from '$lib/server/appwrite';

export const load: PageServerLoad = async ({ params, locals }) => {
  const userRole = locals.userRole ?? 'anonymous';
  if (userRole === 'anonymous') {
    throw redirect(303, `/login?next=/task/${params.id}/claim`);
  }
  const task = await getTaskById(params.id);
  if (!task) throw error(404, 'Task not found');
  return {
    task: {
      id: task.id,
      title: task.title,
      shortDescription: task.shortDescription,
      estimatedMinutes: task.estimatedMinutes,
      tags: task.tags,
      isVerified: task.isVerified
    }
  };
};
