import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { getTaskById } from '$lib/server/appwrite';
import { translateText } from '$lib/server/azure';
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
    const u = await users.get(orgId);
    const prefs = (u?.prefs ?? {}) as Record<string, unknown>;
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
  if (to) {
    const [title, description] = await Promise.all([
      translateText({ text: task.title, to }),
      translateText({ text: task.description ?? '', to })
    ]);
    return {
      task: { ...task, title, description, language: 'Auto-translated' },
      isOwner,
      orgName,
      translatedTo: to
    };
  }

  return { task, isOwner, orgName, translatedTo: null };
};
