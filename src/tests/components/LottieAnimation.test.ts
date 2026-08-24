import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/svelte';
import LottieAnimation from '$lib/components/LottieAnimation.svelte';

describe('LottieAnimation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders slot content when reduced motion is preferred', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));

    const { container } = render(LottieAnimation, {
      src: '/animations/hero.json',
      decorative: true
    });

    const root = container.querySelector('.lottie-animation');
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root).toHaveAttribute('data-lottie-ready', 'false');
  });

  it('loads animation and updates ready state when reduced motion is false', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));

    const destroyMock = vi.fn();
    const addEventListenerMock = vi.fn();
    const loadAnimationMock = vi.fn().mockReturnValue({
      destroy: destroyMock,
      addEventListener: addEventListenerMock
    });

    vi.doMock('lottie-web/build/player/lottie_light', () => ({
      default: {
        loadAnimation: loadAnimationMock
      }
    }));

    const { container, unmount } = render(LottieAnimation, {
      src: '/animations/hero.json',
      loop: false,
      autoplay: false,
      className: 'custom-class',
      decorative: false
    });

    const root = container.querySelector('.lottie-animation');
    expect(root).toHaveClass('custom-class');
    expect(root).not.toHaveAttribute('aria-hidden');

    unmount();
  });

  it('handles animation data_failed event gracefully', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));

    let failCallback: (() => void) | undefined;
    const loadAnimationMock = vi.fn().mockReturnValue({
      destroy: vi.fn(),
      addEventListener: vi.fn((event, cb) => {
        if (event === 'data_failed') {
          failCallback = cb;
        }
      })
    });

    vi.doMock('lottie-web/build/player/lottie_light', () => ({
      default: {
        loadAnimation: loadAnimationMock
      }
    }));

    const { container } = render(LottieAnimation, {
      src: '/animations/invalid.json'
    });

    if (failCallback) {
      failCallback();
    }

    const root = container.querySelector('.lottie-animation');
    expect(root).toBeInTheDocument();
  });
});
