import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTaskById } from '$lib/server/appwrite';
import { isSupportedTranslationCode } from '$lib/translation';
import { translateTexts } from '$lib/server/libretranslate';

export const GET: RequestHandler = async ({ params, url }) => {
  const to = url.searchParams.get('lang');
  if (!to || !isSupportedTranslationCode(to)) {
    return json({ error: 'Unsupported translation language' }, { status: 400 });
  }

  const task = await getTaskById(params.id);
  if (!task) return json({ error: 'Task not found' }, { status: 404 });

  const [title, shortDescription, description, ...tags] = await translateTexts({
    texts: [task.title, task.shortDescription, task.description ?? '', ...task.tags],
    to
  });

  return json(
    { task: { ...task, title, shortDescription, description, tags, language: 'Auto-translated' } },
    { headers: { 'Cache-Control': 'private, max-age=900' } }
  );
};
