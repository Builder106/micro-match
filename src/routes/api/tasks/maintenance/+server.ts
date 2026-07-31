import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { expireTasks, autoArchiveTasks } from '$lib/server/appwrite';
import { isUserAdmin } from '$lib/server/teams';

// Sweeps and mutates tasks across every org, so it's gated to platform
// admins rather than any NGO — an NGO role only proves ownership of its
// own tasks, not the right to expire/archive everyone else's.
async function requireAdmin(event: Parameters<RequestHandler>[0]): Promise<boolean> {
  const userId = (event.locals as any)?.session?.user?.id as string | undefined;
  return Boolean(userId) && (await isUserAdmin(userId));
}

export const GET: RequestHandler = async (event) => {
  if (!(await requireAdmin(event))) return json({ error: 'Forbidden' }, { status: 403 });

  try {
    // Run both maintenance operations
    const [expiredCount, archivedCount] = await Promise.all([
      expireTasks(),
      autoArchiveTasks()
    ]);

    return json({
      success: true,
      expiredCount,
      archivedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Task maintenance error:', error);
    return json({ error: 'Failed to perform maintenance' }, { status: 500 });
  }
};

export const POST: RequestHandler = async (event) => {
  if (!(await requireAdmin(event))) return json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await event.request.json();
    const { action } = body;

    let result: { expiredCount?: number; archivedCount?: number };

    switch (action) {
      case 'expire': {
        const expiredCount = await expireTasks();
        result = { expiredCount };
        break;
      }
      case 'archive': {
        const archivedCount = await autoArchiveTasks();
        result = { archivedCount };
        break;
      }
      case 'both': {
        const [expired, archived] = await Promise.all([
          expireTasks(),
          autoArchiveTasks()
        ]);
        result = { expiredCount: expired, archivedCount: archived };
        break;
      }
      default:
        return json({ error: 'Invalid action. Use "expire", "archive", or "both"' }, { status: 400 });
    }

    return json({ success: true, ...result });
  } catch (error) {
    console.error('Task maintenance error:', error);
    return json({ error: 'Failed to perform maintenance' }, { status: 500 });
  }
};
