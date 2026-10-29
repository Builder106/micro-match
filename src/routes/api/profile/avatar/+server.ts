import type { RequestHandler } from '@sveltejs/kit';

import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_AVATARS_BUCKET_ID,
  APPWRITE_API_KEY,
} from '$app/env/private';

export const POST: RequestHandler = async (event) => {
  try {
    const session = event.locals.session;
    let userId = session?.user?.id ?? null;

    // Fallback: derive userId from Appwrite JWT if provided
    if (!userId) {
      try {
        const authHeader = event.request.headers.get('authorization') ?? '';
        const jwt = authHeader.toLowerCase().startsWith('bearer ')
          ? authHeader.slice(7).trim()
          : '';
        if (jwt) {
          const { Client, Account } = await import('node-appwrite');
          const c = new Client()
            .setEndpoint(APPWRITE_ENDPOINT || '')
            .setProject(APPWRITE_PROJECT_ID || '')
            .setJWT(jwt);
          const account = new Account(c);
          const me = await account.get();
          userId = me?.$id ?? null;
        }
      } catch {}
    }
    if (!userId) return Response.json({ error: 'Not signed in' }, { status: 401 });

    const bucketId = APPWRITE_AVATARS_BUCKET_ID;

    if (!bucketId)
      return Response.json(
        {
          error: 'Avatar bucket not configured (set APPWRITE_AVATARS_BUCKET_ID)',
        },
        { status: 500 },
      );

    const form = await event.request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return Response.json({ error: 'Missing file' }, { status: 400 });

    const { Client, Storage, ID, Permission, Role } = await import('node-appwrite');
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT || '')
      .setProject(APPWRITE_PROJECT_ID || '')
      .setKey(APPWRITE_API_KEY || '');
    const storage = new Storage(client);

    const created = await storage.createFile({
      bucketId,
      fileId: ID.unique(),
      file,
      permissions: [
        Permission.read(Role.any()),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ],
    });

    const fileId: string = created?.$id;
    const url = String(storage.getFilePreview({ bucketId, fileId, width: 128, height: 128 }));
    return Response.json({ fileId, url });
  } catch (err) {
    console.error('Avatar upload error', err);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
};
