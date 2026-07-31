import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { isUserAdmin } from '$lib/server/teams';

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;
  const userId = session?.user?.id;
  if (!userId) throw redirect(303, '/login?next=/admin/verifications');
  if (!(await isUserAdmin(userId))) throw error(403, 'Admins only');
  return {};
};
