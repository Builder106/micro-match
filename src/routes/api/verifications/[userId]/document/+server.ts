import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { isUserAdmin } from '$lib/server/teams';
import { getVerificationByUserId } from '$lib/server/verifications';

/**
 * GET /api/verifications/:userId/document
 *   Admin-only proxy for the proof doc. Streams the bytes from Appwrite Storage
 *   using the server API key, so the storage URL is never exposed to clients.
 */
export const GET: RequestHandler = async (event) => {
  const session = event.locals.session;
  const adminId = session?.user?.id;
  if (!adminId || !(await isUserAdmin(adminId))) throw error(403, 'Forbidden');

  const targetUserId = event.params.userId;
  if (!targetUserId) throw error(400, 'Missing userId');

  const v = await getVerificationByUserId(targetUserId);
  if (!v?.docFileId) throw error(404, 'No document on file');

  const bucketId = env.APPWRITE_VERIFICATIONS_BUCKET_ID;
  if (!bucketId) throw error(500, 'Verification bucket not configured');

  try {
    const { Client, Storage } = await import('node-appwrite');
    const client = new Client()
      .setEndpoint(env.APPWRITE_ENDPOINT!)
      .setProject(env.APPWRITE_PROJECT_ID!)
      .setKey(env.APPWRITE_API_KEY!);
    const storage = new Storage(client);
    const buffer = await storage.getFileDownload(bucketId, v.docFileId);

    // node-appwrite returns either a Buffer or a Uint8Array depending on version.
    const bytes: Uint8Array = buffer instanceof Uint8Array ? buffer : Buffer.from(buffer);
    return new Response(new Blob([new Uint8Array(bytes)]), {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `inline; filename="verification-${targetUserId}"`,
        'Cache-Control': 'private, no-store'
      }
    });
  } catch (err) {
    console.error('Verification doc fetch error', err);
    throw error(500, 'Could not load document');
  }
};
