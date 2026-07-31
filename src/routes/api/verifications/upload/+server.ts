import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { ADMIN_TEAM_ID } from '$lib/server/teams';

/**
 * POST /api/verifications/upload
 *   Multipart: file=<File>
 *   Stores a verification doc in Appwrite Storage (verifications bucket) with
 *   permissions readable only by the uploader and the admin team.
 *   Returns { fileId } — the caller then submits the verification record.
 */
export const POST: RequestHandler = async (event) => {
  try {
    const session = event.locals.session;
    let userId = session?.user?.id ?? null;

    if (!userId) {
      try {
        const authHeader = event.request.headers.get('authorization') ?? '';
        const jwt = authHeader.toLowerCase().startsWith('bearer ')
          ? authHeader.slice(7).trim()
          : '';
        if (jwt) {
          const { Client, Account } = await import('node-appwrite');
          const c = new Client()
            .setEndpoint(env.APPWRITE_ENDPOINT || '')
            .setProject(env.APPWRITE_PROJECT_ID || '')
            .setJWT(jwt);
          const account = new Account(c);
          const me = await account.get();
          userId = me?.$id ?? null;
        }
      } catch {}
    }
    if (!userId) return json({ error: 'Not signed in' }, { status: 401 });

    const bucketId = env.APPWRITE_VERIFICATIONS_BUCKET_ID;
    if (!bucketId) return json({ error: 'Verification bucket not configured (set APPWRITE_VERIFICATIONS_BUCKET_ID)' }, { status: 500 });

    const form = await event.request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return json({ error: 'Missing file' }, { status: 400 });

    // Reasonable cap: 10 MB per doc
    if (file.size > 10 * 1024 * 1024) return json({ error: 'File too large (max 10 MB)' }, { status: 400 });

    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      return json({ error: 'Unsupported file type. Use PDF, PNG, JPG, or WebP.' }, { status: 400 });
    }

    const { Client, Storage, ID, Permission, Role } = await import('node-appwrite');
    const client = new Client()
      .setEndpoint(env.APPWRITE_ENDPOINT || '')
      .setProject(env.APPWRITE_PROJECT_ID || '')
      .setKey(env.APPWRITE_API_KEY || '');
    const storage = new Storage(client);

    const permissions = [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId))
    ];
    if (ADMIN_TEAM_ID) {
      permissions.push(Permission.read(Role.team(ADMIN_TEAM_ID)));
    }

    const created = await storage.createFile(bucketId, ID.unique(), file, permissions);
    return json({ fileId: created?.$id });
  } catch (err) {
    console.error('Verification doc upload error', err);
    return json({ error: 'Upload failed' }, { status: 500 });
  }
};
