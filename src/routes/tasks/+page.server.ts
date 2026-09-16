import type { PageServerLoad } from './$types';
import { getTasks } from '$lib/server/appwrite';
import { translateTasks } from '$lib/server/taskTranslation';

export const load: PageServerLoad = async ({ locals }) => {
  const tasks = await getTasks();
  const translatedTasks = await translateTasks(tasks, locals.locale ?? 'en');
  return {
    tasks: translatedTasks.map((task, index) => ({
      ...task,
      sourceTags: tasks[index]?.tags ?? task.tags
    }))
  };
};
