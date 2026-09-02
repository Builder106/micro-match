import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/svelte';

const { pageState } = vi.hoisted(() => ({
  pageState: { url: new URL('http://test/en/'), data: { userRole: 'anonymous', locale: 'en' } }
}));

vi.mock('$app/state', () => ({ page: pageState }));
vi.mock('$app/paths', () => ({ resolve: (pathname: string) => `/en${pathname}` }));
vi.mock('svelte/transition', () => ({
  fade: () => ({ duration: 0 }),
  fly: () => ({ duration: 0 })
}));

import HomePage from '../../routes/+page.svelte';

describe('home featured task cards', () => {
  it('exposes one keyboard-reachable link for each task destination', () => {
    vi.stubGlobal('IntersectionObserver', class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    });

    const { container } = render(HomePage, {
      data: {
        locale: 'en',
        origin: 'http://test',
        userRole: 'anonymous',
        isAdmin: false,
        tasks: [{
          id: 'task-1',
          title: 'Translate flyer',
          shortDescription: 'Make a health resource available in another language.',
          tags: ['translation'],
          estimatedMinutes: 15,
          language: 'English'
        }]
      }
    });

    const card = container.querySelector('article.task-card');
    const taskLinks = card?.querySelectorAll<HTMLAnchorElement>('a[href="/en/task/task-1"]');

    expect(taskLinks).toHaveLength(1);
    expect(taskLinks?.[0]).toHaveTextContent('Translate flyer');
    expect(taskLinks?.[0]?.tabIndex).toBe(0);
    expect(card?.querySelector('a[aria-label*="View task"]')).toBeNull();
  });
});
