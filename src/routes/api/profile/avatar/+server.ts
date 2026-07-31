import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async (event) => {
  try {
    const session = (event.locals as any)?.session as { user?: { id?: string } } | undefined;
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
            .setEndpoint(env.APPWRITE_ENDPOINT || '')
            .setProject(env.APPWRITE_PROJECT_ID || '')
            .setJWT(jwt);
          const account = new Account(c);
          const me: any = await account.get();
          userId = me?.$id ?? me?.id ?? null;
        }
      } catch {}
    }
    if (!userId) return json({ error: 'Not signed in' }, { status: 401 });

    const bucketId = env.APPWRITE_AVATARS_BUCKET_ID;
    if (!bucketId) return json({ error: 'Avatar bucket not configured (set APPWRITE_AVATARS_BUCKET_ID)' }, { status: 500 });

    const form = await event.request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return json({ error: 'Missing file' }, { status: 400 });

    const { Client, Storage, ID, Permission, Role } = await import('node-appwrite');
    const client = new Client()
      .setEndpoint(env.APPWRITE_ENDPOINT || '')
      .setProject(env.APPWRITE_PROJECT_ID || '')
      .setKey(env.APPWRITE_API_KEY || '');
    const storage = new Storage(client);

    const created: any = await storage.createFile(
      bucketId,
      ID.unique(),
      file,
      [
        Permission.read(Role.any()),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId))
      ]
    );

    const fileId: string = created?.$id;
    const url = String(storage.getFilePreview(bucketId, fileId, 128, 128));
    return json({ fileId, url });
  } catch (err) {
    console.error('Avatar upload error', err);
    return json({ error: 'Upload failed' }, { status: 500 });
  }
};

