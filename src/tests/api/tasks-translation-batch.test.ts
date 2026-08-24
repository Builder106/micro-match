import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: { getTaskById: vi.fn(), translateTasks: vi.fn() }
}));

vi.mock('$lib/server/appwrite', () => ({ getTaskById: mocks.getTaskById }));
vi.mock('$lib/server/taskTranslation', () => ({
  MAX_TASK_TRANSLATION_BATCH_SIZE: 50,
  isSupportedTaskLocale: (value: unknown) => ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ar'].includes(value as string),
  translateTasks: mocks.translateTasks
}));

import { POST } from '../../routes/api/tasks/translation/+server';

function event(body: unknown): Parameters<typeof POST>[0] {
  return { request: new Request('http://test/api/tasks/translation', { method: 'POST', body: JSON.stringify(body) }) } as Parameters<typeof POST>[0];
}

describe('POST /api/tasks/translation', () => {
  beforeEach(() => Object.values(mocks).forEach((mock) => mock.mockReset()));

  it('translates existing tasks and omits missing IDs', async () => {
    const task = { id: 'task-1', title: 'Title', shortDescription: 'Short', tags: [] };
    mocks.getTaskById.mockResolvedValueOnce(task).mockResolvedValueOnce(undefined);
    mocks.translateTasks.mockResolvedValue([{ ...task, translation: { locale: 'es', status: 'translated' } }]);
    const response = await POST(event({ taskIds: ['task-1', 'missing'], locale: 'es' }));
    expect(mocks.translateTasks).toHaveBeenCalledWith([task], 'es');
    await expect(response.json()).resolves.toEqual({
      tasks: [{ id: 'task-1', title: 'Title', shortDescription: 'Short', tags: [], translation: { locale: 'es', status: 'translated' } }]
    });
  });

  it.each([
    { body: {}, label: 'missing fields' },
    { body: { taskIds: ['task-1'], locale: 'xx' }, label: 'invalid locale' },
    { body: { taskIds: [], locale: 'es' }, label: 'empty IDs' },
    { body: { taskIds: Array.from({ length: 51 }, (_, i) => `task-${i}`), locale: 'es' }, label: 'oversized batch' }
  ])('rejects $label', async ({ body }) => {
    await expect(POST(event(body))).resolves.toMatchObject({ status: 400 });
    expect(mocks.getTaskById).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON', async () => {
    const request = new Request('http://test/api/tasks/translation', { method: 'POST', body: '{' });
    await expect(POST({ request } as Parameters<typeof POST>[0])).resolves.toMatchObject({ status: 400 });
  });
});
