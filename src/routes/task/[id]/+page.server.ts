import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { getTaskById } from '$lib/server/appwrite';
import { isSupportedTranslationCode } from '$lib/translation';
import { translateTexts } from '$lib/server/libretranslate';
import { error } from '@sveltejs/kit';

async function lookupOrgName(orgId: string | undefined): Promise<string | null> {
  if (!orgId) return null;
  if (!env.APPWRITE_ENDPOINT || !env.APPWRITE_PROJECT_ID || !env.APPWRITE_API_KEY) return null;
  try {
    const { Client, Users } = await import('node-appwrite');
    const client = new Client()
      .setEndpoint(env.APPWRITE_ENDPOINT)
      .setProject(env.APPWRITE_PROJECT_ID)
      .setKey(env.APPWRITE_API_KEY);
    const users = new Users(client);
    const u = await users.get<import('$lib/types').UserPreferences>(orgId);
    const prefs = u?.prefs ?? {};
    const orgName = typeof prefs.orgName === 'string' && prefs.orgName.trim() ? prefs.orgName.trim() : null;
    return orgName ?? u?.name ?? null;
  } catch {
    return null;
  }
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const { id } = params;
  const task = await getTaskById(id);
  if (!task) throw error(404, 'Task not found');

  const session = locals.session;
  const currentUserId = session?.user?.id;
  const isOwner = !!currentUserId && currentUserId === task.orgId;

  const orgName = await lookupOrgName(task.orgId);

  // Optional auto-translation when `?lang=xx` is present.
  const to = url.searchParams.get('lang');
  if (to && isSupportedTranslationCode(to)) {
    const [title, shortDescription, description, ...tags] = await translateTexts({
      texts: [task.title, task.shortDescription, task.description ?? '', ...task.tags],
      to
    });
    return {
      task: { ...task, title, shortDescription, description, tags, language: 'Auto-translated' },
      isOwner,
      orgName,
      translatedTo: to
    };
  }

  return { task, isOwner, orgName, translatedTo: null };
};
