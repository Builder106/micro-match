import { afterEach, describe, expect, it, vi } from 'vitest';

describe('reducedMotion', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('reports the media preference and responds to changes', async () => {
    let listener: ((event: MediaQueryListEvent) => void) | undefined;
    const removeEventListener = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: (_type: string, callback: (event: MediaQueryListEvent) => void) => { listener = callback; },
        removeEventListener,
        dispatchEvent: () => false,
      }),
    });

    const { createReducedMotion } = await import('$lib/utils/reducedMotion');
    const reducedMotion = createReducedMotion();
    const values: boolean[] = [];
    const unsubscribe = reducedMotion.subscribe((value) => values.push(value));

    expect(values).toEqual([true]);
    listener?.({ matches: false } as MediaQueryListEvent);
    expect(values).toEqual([true, false]);

    unsubscribe();
    expect(removeEventListener).toHaveBeenCalledOnce();
  });

  it('falls back to false when matchMedia is unavailable', async () => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: undefined });

    const { reducedMotion } = await import('$lib/utils/reducedMotion');
    const values: boolean[] = [];
    const unsubscribe = reducedMotion.subscribe((value) => values.push(value));

    expect(values).toEqual([false]);
    unsubscribe();
  });
});
