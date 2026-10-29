import type { RequestHandler } from './$types';
import {
  deleteTask,
  getTaskById,
  updateTaskStatus,
  updateTaskLastActivity,
} from '#lib/server/appwrite.js';
import { getUserRole } from '#lib/server/auth.js';

export const PATCH: RequestHandler = async (event) => {
  const { params, request } = event;
  const id = params.id;
  if (!id) {
    return Response.json({ error: 'Missing task id' }, { status: 400 });
  }

  const role = await getUserRole(event);
  if (role !== 'ngo') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const session = event.locals.session;
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const task = await getTaskById(id);
  if (!task) {
    return Response.json({ error: 'Task not found' }, { status: 404 });
  }

  if (task.orgId !== userId) {
    return Response.json({ error: 'Forbidden: You do not own this task' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { status } = body;

    // Update task status if provided
    if (status) {
      const updated = await updateTaskStatus(id, status);
      if (!updated) {
        return Response.json({ error: 'Failed to update task status' }, { status: 500 });
      }
    }

    // Update last activity timestamp
    await updateTaskLastActivity(id);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Task update error:', error);
    return Response.json({ error: 'Failed to update task' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async (event) => {
  const { params } = event;
  const id = params.id;
  if (!id) {
    return Response.json({ error: 'Missing task id' }, { status: 400 });
  }

  const role = await getUserRole(event);
  if (role !== 'ngo') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const session = event.locals.session;
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const task = await getTaskById(id);
  if (!task) {
    return Response.json({ error: 'Task not found' }, { status: 404 });
  }

  if (task.orgId !== userId) {
    return Response.json({ error: 'Forbidden: You do not own this task' }, { status: 403 });
  }

  await deleteTask(id);

  return Response.json({ success: true });
};
