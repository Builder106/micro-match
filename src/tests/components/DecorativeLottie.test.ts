import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import DecorativeLottie from '$lib/components/DecorativeLottie.svelte';

describe('DecorativeLottie', () => {
  it('keeps a static, decorative fallback when reduced motion is preferred', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true })
    );

    const { container } = render(DecorativeLottie, {
      src: '/animations/example.lottie',
      scene: 'example-scene',
      aspectRatio: '3 / 2'
    });
    const scene = container.querySelector('[data-motion-scene="example-scene"]');

    expect(scene).toHaveAttribute('aria-hidden', 'true');
    expect(scene).toHaveStyle({ '--motion-aspect-ratio': '3 / 2' });
    expect(scene?.querySelector('svg.static-fallback')).toBeInTheDocument();
    expect(scene?.querySelector('dotlottie-player')).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
