import type { RequestHandler } from './$types';
import { getTaskById } from '#lib/server/appwrite.js';
import { isSupportedTaskLocale, translateTask } from '#lib/server/taskTranslation.js';

export const GET: RequestHandler = async ({ params, url }) => {
  const to = url.searchParams.get('lang');
  if (!isSupportedTaskLocale(to)) {
    return Response.json({ error: 'Unsupported translation language' }, { status: 400 });
  }

  const task = await getTaskById(params.id);
  if (!task) return Response.json({ error: 'Task not found' }, { status: 404 });

  const translated = await translateTask(task, to);

  return Response.json(
    { task: translated },
    { headers: { 'Cache-Control': 'private, max-age=900' } },
  );
};
