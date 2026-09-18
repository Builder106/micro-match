import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({ mocks: { getTasks: vi.fn(), translateTasks: vi.fn() } }));
vi.mock('$lib/server/appwrite', () => ({ getTasks: mocks.getTasks }));
vi.mock('$lib/server/taskTranslation', () => ({ translateTasks: mocks.translateTasks }));

import { load } from '../../routes/+page.server';
import { createServerLoadEventFor, requireLoadResult } from '../helpers/createLoadEvent';

describe('/ (home feed) load', () => {
  beforeEach(() => mocks.getTasks.mockReset());
  beforeEach(() => mocks.translateTasks.mockReset());

  it('passes only the first 3 tasks and the selected locale to translation', async () => {
    const tasks = [
      { id: '1', title: 'One', shortDescription: 'First task', tags: ['first'], language: 'English' },
      { id: '2', title: 'Two', shortDescription: 'Second task', tags: ['second'], language: 'English' },
      { id: '3', title: 'Three', shortDescription: 'Third task', tags: ['third'], language: 'English' },
      { id: '4', title: 'Four', shortDescription: 'Fourth task', tags: ['fourth'], language: 'English' },
      { id: '5', title: 'Five', shortDescription: 'Fifth task', tags: ['fifth'], language: 'English' }
    ];
    const translatedTasks = tasks.slice(0, 3).map((task) => ({
      ...task,
      title: `Translated ${task.title}`,
      shortDescription: `Translated ${task.shortDescription}`,
      tags: [`translated-${task.tags[0]}`]
    }));
    mocks.getTasks.mockResolvedValue(tasks);
    mocks.translateTasks.mockResolvedValue(translatedTasks);

    const result = requireLoadResult(await load(createServerLoadEventFor<typeof load>({ locals: { locale: 'es' } })));

    expect(mocks.translateTasks).toHaveBeenCalledWith(tasks.slice(0, 3), 'es');
    expect(result.tasks).toEqual(translatedTasks);
    expect(result.tasks[0]).toMatchObject({
      title: 'Translated One',
      shortDescription: 'Translated First task',
      tags: ['translated-first'],
      language: 'English'
    });
  });

  it('defaults to English and preserves the helper result', async () => {
    mocks.getTasks.mockResolvedValue([
      { id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }
    ]);
    const originalTasks = [{ id: '1' }, { id: '2' }, { id: '3' }];
    mocks.translateTasks.mockResolvedValue(originalTasks);

    const result = requireLoadResult(await load(createServerLoadEventFor<typeof load>()));

    expect(mocks.translateTasks).toHaveBeenCalledWith([{ id: '1' }, { id: '2' }, { id: '3' }], 'en');
    expect(result.tasks).toEqual(originalTasks);
  });

  it('returns an empty array when there are no tasks', async () => {
    mocks.getTasks.mockResolvedValue([]);
    mocks.translateTasks.mockResolvedValue([]);
    const result = requireLoadResult(await load(createServerLoadEventFor<typeof load>({ locals: { locale: 'fr' } })));
    expect(result.tasks).toEqual([]);
    expect(mocks.translateTasks).toHaveBeenCalledWith([], 'fr');
  });

  it('returns original task content when translation falls back', async () => {
    const originalTasks = [{ id: '1', title: 'Original', language: 'English' }];
    mocks.getTasks.mockResolvedValue(originalTasks);
    mocks.translateTasks.mockResolvedValue(originalTasks);

    const result = requireLoadResult(await load(createServerLoadEventFor<typeof load>({ locals: { locale: 'es' } })));

    expect(result.tasks).toEqual(originalTasks);
  });
});
