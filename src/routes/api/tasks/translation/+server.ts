import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTaskById } from '$lib/server/appwrite';
import {
  isSupportedTaskLocale,
  MAX_TASK_TRANSLATION_BATCH_SIZE,
  translateTasks
} from '$lib/server/taskTranslation';

export const POST: RequestHandler = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return json({ error: 'taskIds and locale are required' }, { status: 400 });
  }
  const { taskIds, locale } = body as { taskIds?: unknown; locale?: unknown };
  if (!isSupportedTaskLocale(locale)) {
    return json({ error: 'Unsupported translation language' }, { status: 400 });
  }
  if (
    !Array.isArray(taskIds) ||
    taskIds.length === 0 ||
    taskIds.length > MAX_TASK_TRANSLATION_BATCH_SIZE ||
    taskIds.some((id) => typeof id !== 'string' || !id.trim())
  ) {
    return json({ error: `taskIds must contain 1-${MAX_TASK_TRANSLATION_BATCH_SIZE} task IDs` }, { status: 400 });
  }

  const tasks = (await Promise.all((taskIds as string[]).map((id) => getTaskById(id)))).filter(
    (task): task is NonNullable<typeof task> => task !== undefined
  );
  const translated = await translateTasks(tasks, locale);
  const displayTasks = translated.map(({ id, title, shortDescription, description, tags, language, translation }) => ({
    id,
    title,
    shortDescription,
    description,
    tags,
    language,
    translation
  }));
  return json({ tasks: displayTasks }, { headers: { 'Cache-Control': 'private, max-age=900' } });
};
