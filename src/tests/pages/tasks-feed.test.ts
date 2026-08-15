import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({ mocks: { getTasks: vi.fn() } }));
vi.mock('$lib/server/appwrite', () => ({ getTasks: mocks.getTasks }));

import { load } from '../../routes/tasks/+page.server';

describe('/tasks load', () => {
  beforeEach(() => mocks.getTasks.mockReset());

  it('returns every task from getTasks unsliced', async () => {
    const tasks = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }];
    mocks.getTasks.mockResolvedValue(tasks);

    interface FeedResult {
      tasks: unknown[];
    }
    const result = (await load({} as unknown as Parameters<typeof load>[0])) as unknown as FeedResult;

    expect(result.tasks).toEqual(tasks);
  });
});
