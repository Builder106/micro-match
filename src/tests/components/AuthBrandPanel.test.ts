import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import AuthBrandPanel from '$lib/components/AuthBrandPanel.svelte';

describe('AuthBrandPanel', () => {
  it('renders the MicroMatch logo lockup', () => {
    render(AuthBrandPanel, {});
    expect(screen.getByText('MicroMatch')).toBeInTheDocument();
  });

  it('shows the marketing copy by default', () => {
    render(AuthBrandPanel, {});
    expect(screen.getByText(/Step into a thriving civic world/i)).toBeInTheDocument();
  });

  it('keeps the illustration glow separate from the unboxed copy', () => {
    const { container } = render(AuthBrandPanel, { animation: '/animations/collaboration.json' });
    const scene = container.querySelector('.scene-wrap');
    const copy = container.querySelector('.copy');

    expect(scene?.querySelectorAll('.auth-brand-animation')).toHaveLength(1);
    expect(scene?.querySelectorAll('.glow')).toHaveLength(2);
    expect(copy).not.toBeNull();
    expect(scene?.contains(copy)).toBe(false);
    expect(container.querySelector('.shade, .grain')).toBeNull();
  });
});
