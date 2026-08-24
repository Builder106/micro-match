import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';

const { pageState } = vi.hoisted(() => ({
  pageState: { url: new URL('http://test/'), data: {} as Record<string, unknown> }
}));
vi.mock('$app/state', () => ({ page: pageState }));
vi.mock('svelte/transition', () => ({
  fade: () => ({ duration: 0 }),
  fly: () => ({ duration: 0 })
}));

import PublicShell from '$lib/components/PublicShell.svelte';


describe('PublicShell', () => {
  beforeEach(() => {
    pageState.url = new URL('http://test/');
    pageState.data = {};
  });

  it('renders brand header, navigation links, and footer in anonymous state', () => {
    pageState.data = { userRole: 'anonymous' };
    const { container } = render(PublicShell, { activeTab: 'how-it-works' });

    expect(container.querySelector('.header-brand span')?.textContent).toBe('MicroMatch');
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    expect(container.querySelector('.header-actions a[href="/en/login"]')).toBeInTheDocument();
    expect(container.querySelector('.header-actions a[href="/en/signup"]')).toBeInTheDocument();
    expect(container.querySelector('footer.site-footer')).toBeInTheDocument();
  });


  it('renders authenticated navigation when user is signed in', () => {
    pageState.data = { userRole: 'volunteer' };
    render(PublicShell, { activeTab: 'tasks' });

    expect(screen.getByRole('link', { name: 'Go to dashboard' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Join Now' })).toBeNull();
  });

  it('opens mobile drawer on menu button click and closes on backdrop click', async () => {
    const { container } = render(PublicShell, {});

    const menuToggle = screen.getByRole('button', { name: 'Open menu' });
    expect(menuToggle).toHaveAttribute('aria-expanded', 'false');

    await fireEvent.click(menuToggle);
    await tick();
    expect(container.querySelector('#mobile-menu')).toBeInTheDocument();
    expect(menuToggle).toHaveAttribute('aria-expanded', 'true');

    const backdrop = container.querySelector('.mobile-menu-backdrop');
    expect(backdrop).toBeInTheDocument();
    if (backdrop) {
      await fireEvent.click(backdrop);
      await tick();
    }
    expect(container.querySelector('#mobile-menu')).toBeNull();
  });

  it('closes mobile drawer on Escape keydown', async () => {
    const { container } = render(PublicShell, {});

    const menuToggle = screen.getByRole('button', { name: 'Open menu' });
    await fireEvent.click(menuToggle);
    await tick();
    expect(container.querySelector('#mobile-menu')).toBeInTheDocument();

    await fireEvent.keyDown(window, { key: 'Escape' });
    await tick();
    expect(container.querySelector('#mobile-menu')).toBeNull();
  });

  it('closes mobile drawer when clicking a link inside the mobile menu', async () => {
    pageState.data = { userRole: 'anonymous' };
    const { container } = render(PublicShell, {});

    const menuToggle = screen.getByRole('button', { name: 'Open menu' });
    await fireEvent.click(menuToggle);
    await tick();

    const mobileNav = container.querySelector('#mobile-menu');
    const howItWorksLink = mobileNav?.querySelector('a[href="/en/how-it-works"]');
    expect(howItWorksLink).toBeInTheDocument();

    if (howItWorksLink) {
      await fireEvent.click(howItWorksLink);
      await tick();
    }
    expect(container.querySelector('#mobile-menu')).toBeNull();
  });
});
