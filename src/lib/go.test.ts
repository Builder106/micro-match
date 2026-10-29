import { describe, it, expect, vi } from 'vitest';

const { goto, resolve } = vi.hoisted(() => ({
  goto: vi.fn(),
  resolve: vi.fn((path: string) => path),
}));
vi.mock('$app/navigation', () => ({ goto }));
vi.mock('$app/paths', () => ({ resolve }));

import { go } from './go';

describe('go', () => {
  it('navigates with the locale prefix', async () => {
    await go('/dashboard?pinned=1', 'en', { refreshAll: true });
    expect(resolve).toHaveBeenCalledWith('/en/dashboard?pinned=1');
    expect(goto).toHaveBeenCalledWith('/en/dashboard?pinned=1', { refreshAll: true });
    await go('/tasks');
    expect(goto).toHaveBeenLastCalledWith('/en/tasks', undefined);
  });
});
