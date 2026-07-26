import type { PageServerLoad } from './$types';
import { getPublicImpactStats } from '$lib/server/appwrite';

export const load: PageServerLoad = async () => {
  const stats = await getPublicImpactStats();
  return { stats };
};
