import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { deleteTask, getTaskById, updateTaskStatus, updateTaskLastActivity } from '$lib/server/appwrite';
import { getUserRole } from '$lib/server/auth';

export const PATCH: RequestHandler = async (event) => {
  const { params, request } = event;
  const id = params.id;
  if (!id) {
    return json({ error: 'Missing task id' }, { status: 400 });
  }

  const role = await getUserRole(event);
  if (role !== 'ngo') {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  const session = (event.locals as any)?.session as { user?: { id?: string } } | undefined;
  const userId = session?.user?.id;
  if (!userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const task = await getTaskById(id);
  if (!task) {
    return json({ error: 'Task not found' }, { status: 404 });
  }

  if (task.orgId !== userId) {
    return json({ error: 'Forbidden: You do not own this task' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { status } = body;

    // Update task status if provided
    if (status) {
      const updated = await updateTaskStatus(id, status);
      if (!updated) {
        return json({ error: 'Failed to update task status' }, { status: 500 });
      }
    }

    // Update last activity timestamp
    await updateTaskLastActivity(id);

    return json({ success: true });
  } catch (error) {
    console.error('Task update error:', error);
    return json({ error: 'Failed to update task' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async (event) => {
	const { params } = event;
	const id = params.id;
	if (!id) {
		return json({ error: 'Missing task id' }, { status: 400 });
	}

	const role = await getUserRole(event);
	if (role !== 'ngo') {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const session = (event.locals as any)?.session as { user?: { id?: string } } | undefined;
	const userId = session?.user?.id;
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const task = await getTaskById(id);
	if (!task) {
		return json({ error: 'Task not found' }, { status: 404 });
	}

	if (task.orgId !== userId) {
		return json({ error: 'Forbidden: You do not own this task' }, { status: 403 });
	}

	await deleteTask(id);

	return json({ success: true });
};
