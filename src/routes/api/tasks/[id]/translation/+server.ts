import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTaskById } from '$lib/server/appwrite';
import { isSupportedTaskLocale, translateTask } from '$lib/server/taskTranslation';

export const GET: RequestHandler = async ({ params, url }) => {
  const to = url.searchParams.get('lang');
  if (!isSupportedTaskLocale(to)) {
    return json({ error: 'Unsupported translation language' }, { status: 400 });
  }

  const task = await getTaskById(params.id);
  if (!task) return json({ error: 'Task not found' }, { status: 404 });

  const translated = await translateTask(task, to);

  return json(
    { task: translated },
    { headers: { 'Cache-Control': 'private, max-age=900' } }
  );
};
