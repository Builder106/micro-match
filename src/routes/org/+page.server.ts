import type { Actions, PageServerLoad } from './$types';
import { createTask } from '$lib/server/appwrite';
import { getUserRole } from '$lib/server/auth';
import { getVerificationByUserId } from '$lib/server/verifications';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const userRole = locals.userRole ?? 'anonymous';
  const session = locals.session;
  const userId = session?.user?.id;

  if (userRole === 'anonymous') throw redirect(303, '/login?next=/org');
  if (userRole !== 'ngo') throw error(403, 'NGO access required');

  let verificationStatus: 'pending' | 'approved' | 'rejected' | null = null;
  if (userId) {
    const v = await getVerificationByUserId(userId);
    verificationStatus = (v?.status ?? null) as 'pending' | 'approved' | 'rejected' | null;
  }
  return { verificationStatus };
};

export const actions: Actions = {
  default: async (event) => {
    const role = await getUserRole(event);
    if (role !== 'ngo') {
      return { success: false, error: 'Forbidden' };
    }
    const { request, locals } = event;
    const session = locals.session;
    const orgId = session?.user?.id ?? undefined;

    const form = await request.formData();
    const title = String(form.get('title') ?? '');
    const shortDescription = String(form.get('shortDescription') ?? '');
    const description = String(form.get('description') ?? '');
    const language = String(form.get('language') ?? 'English');
    const tagsRaw = String(form.get('tags') ?? '');
    const estimatedMinutesRaw = String(form.get('minutes') ?? '');
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const estimatedMinutes = Number.isFinite(Number(estimatedMinutesRaw)) ? Number(estimatedMinutesRaw) : undefined;

    if (!title || !shortDescription || !description) {
      return { success: false, error: 'Missing required fields' };
    }

    // Soft gate: tasks inherit the NGO's current verification state.
    let isVerified = false;
    if (orgId) {
      const v = await getVerificationByUserId(orgId);
      isVerified = v?.status === 'approved';
    }

    const created = await createTask({
      title,
      shortDescription,
      description,
      language,
      tags,
      estimatedMinutes,
      orgId,
      isVerified
    });
    return { success: true, taskId: created.id };
  }
};

