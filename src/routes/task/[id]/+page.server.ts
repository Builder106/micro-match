import type { PageServerLoad } from './$types';
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY } from '$app/env/private';
import { getTaskById } from '#lib/server/appwrite.js';
import { getPatchDesignForTask } from '#lib/server/quilt.js';
import { getVerificationByUserId } from '#lib/server/verifications.js';
import { isSupportedTranslationCode } from '#lib/translation.js';
import { error } from '@sveltejs/kit';

async function lookupOrgName(orgId: string | undefined): Promise<string | null> {
  if (!orgId) return null;
  if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) return null;
  try {
    const { Client, Users } = await import('node-appwrite');
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID)
      .setKey(APPWRITE_API_KEY);
    const users = new Users(client);
    const u = await users.get<import('#lib/types.js').UserPreferences>({ userId: orgId });
    const prefs = u?.prefs ?? {};
    const orgName =
      typeof prefs.orgName === 'string' && prefs.orgName.trim() ? prefs.orgName.trim() : null;
    return orgName ?? u?.name ?? null;
  } catch {
    return null;
  }
}

/** The registered name from an approved verification first, then the account's own name. */
async function nonprofitName(orgId: string | undefined): Promise<string | null> {
  if (orgId) {
    try {
      const verification = await getVerificationByUserId(orgId);
      if (verification?.status === 'approved' && verification.orgName) return verification.orgName;
    } catch {
      // No verification to read: fall back to the account's name.
    }
  }
  return lookupOrgName(orgId);
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const { id } = params;
  const task = await getTaskById(id);
  if (!task) throw error(404, 'Task not found');

  const session = locals.session;
  const currentUserId = session?.user?.id;
  const isOwner = !!currentUserId && currentUserId === task.orgId;

  const [orgName, patch] = await Promise.all([
    nonprofitName(task.orgId),
    getPatchDesignForTask(task),
  ]);

  // The page renders its original task immediately. The client fetches the
  // optional translation after navigation, so slow provider responses never
  // block task detail rendering.
  const to = url.searchParams.get('lang');
  if (to && isSupportedTranslationCode(to)) {
    return {
      task,
      isOwner,
      orgName,
      patch,
      translatedTo: to,
    };
  }

  return { task, isOwner, orgName, patch, translatedTo: null };
};
