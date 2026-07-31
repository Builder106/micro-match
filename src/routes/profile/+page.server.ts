import { env } from '$env/dynamic/private';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const userRole = (locals as any)?.userRole ?? 'anonymous';
  const session = (locals as any)?.session as { user?: { id?: string; email?: string } } | undefined;
  const user = session?.user?.id ? { id: session.user.id, email: session.user.email } : null;
  return { userRole, user };
};

export const actions: Actions = {
  default: async ({ request, locals, fetch: _fetch }) => {
    try {
      const session = (locals as any)?.session as { user?: { id?: string; email?: string } } | undefined;
      if (!session?.user?.id) return fail(401, { message: 'Unauthorized' });

      const form = await request.formData();
      const displayName = String(form.get('displayName') ?? '').trim();
      const role = String(form.get('role') ?? '').trim();
      const bio = String(form.get('bio') ?? '').trim();
      const orgName = String(form.get('orgName') ?? '').trim();

      // Update Appwrite Account prefs via client-side SDK JWT session
      // We call a small helper endpoint to update prefs securely if needed later.
      // Use a JSON endpoint to update prefs through browser SDK session via /api/auth/session cookie refresh.
      // For now, we update prefs on the client after navigate; server action just acknowledges.
      return { ok: true, role, displayName, bio, orgName } as any;
    } catch (e) {
      if (env.NODE_ENV !== 'production') console.error('Profile update failed', e);
      return fail(400, { message: 'Failed to update profile' });
    }
  }
};

