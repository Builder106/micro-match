import type { LayoutServerLoad } from './$types';
import { isUserAdmin } from '$lib/server/teams';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const userRole = locals.userRole ?? 'anonymous';
  const session = locals.session;
  const userId = session?.user?.id;
  const isAdmin = userId ? await isUserAdmin(userId) : false;
  return { userRole, isAdmin, origin: url.origin, locale: locals.locale ?? 'en' };
};
