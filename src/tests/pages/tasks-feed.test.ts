import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({ mocks: { getTasks: vi.fn(), translateTasks: vi.fn() } }));
vi.mock('$lib/server/appwrite', () => ({ getTasks: mocks.getTasks }));
vi.mock('$lib/server/taskTranslation', () => ({ translateTasks: mocks.translateTasks }));

import { load } from '../../routes/tasks/+page.server';

interface FeedResult {
  tasks: unknown[];
}

describe('/tasks load', () => {
  beforeEach(() => mocks.getTasks.mockReset());
  beforeEach(() => mocks.translateTasks.mockReset());

  it('passes every task and the selected locale to the server translation boundary', async () => {
    const tasks = [
      { id: '1', title: 'One', shortDescription: 'First task', tags: ['first'], language: 'English' },
      { id: '2', title: 'Two', shortDescription: 'Second task', tags: ['second'], language: 'English' },
      { id: '3', title: 'Three', shortDescription: 'Third task', tags: ['third'], language: 'English' },
      { id: '4', title: 'Four', shortDescription: 'Fourth task', tags: ['fourth'], language: 'English' }
    ];
    const translatedTasks = tasks.map((task) => ({
      ...task,
      title: `Translated ${task.title}`,
      tags: task.tags.map((tag) => `translated-${tag}`)
    }));
    mocks.getTasks.mockResolvedValue(tasks);
    mocks.translateTasks.mockResolvedValue(translatedTasks);

    const result = (await load({ locals: { locale: 'de' } } as unknown as Parameters<typeof load>[0])) as unknown as FeedResult;

    expect(mocks.translateTasks).toHaveBeenCalledWith(tasks, 'de');
    expect(result.tasks).toEqual(translatedTasks.map((task, index) => ({
      ...task,
      sourceTags: tasks[index]?.tags ?? task.tags
    })));
  });

  it('defaults to English and preserves the helper result', async () => {
    const tasks = [{ id: '1' }, { id: '2' }];
    mocks.getTasks.mockResolvedValue(tasks);
    mocks.translateTasks.mockResolvedValue(tasks);

    const result = (await load({ locals: {} } as unknown as Parameters<typeof load>[0])) as unknown as FeedResult;

    expect(mocks.translateTasks).toHaveBeenCalledWith(tasks, 'en');
    expect(result.tasks).toEqual(tasks.map((task) => ({ ...task, sourceTags: undefined })));
  });

  it('returns the translation helper fallback unchanged', async () => {
    const tasks = [{ id: '1', title: 'Original', language: 'English' }];
    mocks.getTasks.mockResolvedValue(tasks);
    mocks.translateTasks.mockResolvedValue(tasks);

    const result = (await load({ locals: { locale: 'fr' } } as unknown as Parameters<typeof load>[0])) as unknown as FeedResult;

    expect(result.tasks).toEqual(tasks.map((task) => ({ ...task, sourceTags: undefined })));
  });
});
