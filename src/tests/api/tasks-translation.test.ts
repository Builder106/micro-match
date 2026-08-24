import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    getTaskById: vi.fn(),
    translateTexts: vi.fn()
  }
}));

vi.mock('$lib/server/appwrite', () => ({ getTaskById: mocks.getTaskById }));
vi.mock('$lib/server/libretranslate', () => ({ translateTexts: mocks.translateTexts }));

import { GET } from '../../routes/api/tasks/[id]/translation/+server';

function makeEvent(search = '?lang=es', taskId = 'task-1'): Parameters<typeof GET>[0] {
  return {
    params: { id: taskId },
    url: new URL(`http://test/api/tasks/${taskId}/translation${search}`)
  } as Parameters<typeof GET>[0];
}

describe('GET /api/tasks/[id]/translation', () => {
  beforeEach(() => Object.values(mocks).forEach((mock) => mock.mockReset()));

  it('rejects a missing or unsupported target language', async () => {
    await expect(GET(makeEvent(''))).resolves.toMatchObject({ status: 400 });
    await expect(GET(makeEvent('?lang=zh-Hans'))).resolves.toMatchObject({ status: 400 });
    expect(mocks.getTaskById).not.toHaveBeenCalled();
  });

  it('returns 404 when the task is missing', async () => {
    mocks.getTaskById.mockResolvedValue(undefined);
    await expect(GET(makeEvent())).resolves.toMatchObject({ status: 404 });
  });

  it('translates task display fields in one server-side request', async () => {
    const task = {
      id: 'task-1', title: 'Tag photos', shortDescription: 'Add tags', description: 'Tag each photo.', tags: ['data', 'history']
    };
    mocks.getTaskById.mockResolvedValue(task);
    mocks.translateTexts.mockResolvedValue(['Etiquetar fotos', 'Añade etiquetas', 'Etiqueta cada foto.', 'datos', 'historia']);

    const response = await GET(makeEvent());

    expect(mocks.translateTexts).toHaveBeenCalledWith({
      texts: ['Tag photos', 'Add tags', 'Tag each photo.', 'data', 'history'],
      to: 'es'
    });
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=900');
    await expect(response.json()).resolves.toEqual({
      task: { ...task, title: 'Etiquetar fotos', shortDescription: 'Añade etiquetas', description: 'Etiqueta cada foto.', tags: ['datos', 'historia'], language: 'Auto-translated' }
    });

    // When task has no description
    const noDescTask = {
      id: 'task-2', title: 'Task 2', shortDescription: 'Short 2', tags: ['t']
    };
    mocks.getTaskById.mockResolvedValue(noDescTask);
    mocks.translateTexts.mockResolvedValue(['T2', 'S2', '', 't-es']);
    const res2 = await GET(makeEvent('?lang=es', 'task-2'));
    expect(res2.status).toBe(200);
  });
});
