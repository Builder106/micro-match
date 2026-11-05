import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPublicProfile, listPublicBadges } from '#lib/server/vault.js';

export const load: PageServerLoad = async ({ params }) => {
  const profile = await getPublicProfile(params.handle.toLowerCase());
  if (!profile) throw error(404, 'Not found');
  return {
    handle: profile.handle,
    displayName: profile.displayName,
    badges: await listPublicBadges(profile.userId),
  };
};
