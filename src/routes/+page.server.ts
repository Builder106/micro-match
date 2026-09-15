import type { PageServerLoad } from './$types';
import { getTasks } from '$lib/server/appwrite';
import { translateTasks } from '$lib/server/taskTranslation';

export const load: PageServerLoad = async ({ locals }) => {
  const allTasks = await getTasks();
  const tasks = allTasks.slice(0, 3);
  return { tasks: await translateTasks(tasks, locals.locale ?? 'en') };
};
