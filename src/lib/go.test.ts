import { describe, it, expect, vi } from 'vitest';

const { goto } = vi.hoisted(() => ({ goto: vi.fn() }));
vi.mock('$app/navigation', () => ({ goto }));

import { go } from './go';

describe('go', () => {
  it('navigates with the locale prefix', async () => {
    await go('/dashboard?pinned=1', 'en', { invalidateAll: true });
    expect(goto).toHaveBeenCalledWith('/en/dashboard?pinned=1', { invalidateAll: true });
    await go('/tasks');
    expect(goto).toHaveBeenLastCalledWith('/en/tasks', undefined);
  });
});
