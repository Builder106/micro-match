import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import HandoffTable from '$lib/components/HandoffTable.svelte';
import type { Task } from '$lib/types';

const task = (overrides: Partial<Task> = {}): Task => ({
  id: 't1',
  title: 'Translate a vaccine flyer',
  shortDescription: 'Spanish translation',
  tags: ['#Spanish', 'health'],
  estimatedMinutes: 15,
  isVerified: true,
  ...overrides
});

function reduceMotion(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
}

describe('HandoffTable', () => {
  beforeEach(() => reduceMotion(true));

  it('tells the exchange as a storyboard with the featured task on the ticket', () => {
    const { getByRole, getAllByRole, container } = render(HandoffTable, { tasks: [task()], locale: 'en' });
    expect(getByRole('heading', { level: 1 })).toHaveTextContent('Make a big impact in a few minutes.');
    expect(container.querySelector('.ticket .task-title')).toHaveTextContent('Translate a vaccine flyer');
    expect(container.querySelector('.ticket')).toHaveTextContent('Verified NGO');
    const steps = getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);
    expect(steps).toContain('An NGO posts a task it can describe in a sentence.');
    expect(steps).toContain('Approval mints your badge.');
    expect(container.querySelectorAll('.steps img.still')).toHaveLength(6);
    expect(container.querySelector('.exchange')).not.toHaveClass('motion');
  });

  it('uses the task minutes for the dial still and clock', () => {
    const { container } = render(HandoffTable, { tasks: [task({ estimatedMinutes: 12 })], locale: 'en' });
    expect(container.querySelector('.steps li:nth-child(3) img')).toHaveAttribute('src', '/images/handoff/minute-dial-15.svg');
    expect(container.querySelector('.clock')).toHaveTextContent('12:00 / 12:00');
  });

  it('lists the live tasks with links to each one', () => {
    const { getByRole } = render(HandoffTable, {
      tasks: [task(), task({ id: 't2', title: 'Verify pump data', estimatedMinutes: 20 })],
      locale: 'en'
    });
    expect(getByRole('heading', { name: 'Tasks on the table now' })).toBeInTheDocument();
    expect(getByRole('link', { name: /Verify pump data/ })).toHaveAttribute('href', '/task/t2');
    expect(getByRole('link', { name: 'View All Tasks' })).toHaveAttribute('href', '/tasks');
  });

  it('shows the empty state and a labeled sample task when nothing is posted', () => {
    const { getByRole, container } = render(HandoffTable, { tasks: [], locale: 'en' });
    expect(getByRole('heading', { name: "You're too fast!" })).toBeInTheDocument();
    expect(container.querySelector('.ticket')).toHaveTextContent('Sample task');
    expect(getByRole('link', { name: 'Browse All Tasks' })).toHaveAttribute('href', '/tasks');
  });

  it('drops the verified seal for an unverified organization', () => {
    const { container } = render(HandoffTable, { tasks: [task({ isVerified: false, tags: [] })], locale: 'en' });
    expect(container.querySelector('[data-timeline="verified-seal"]')).toBeNull();
    expect(container.querySelector('.ticket')).not.toHaveTextContent('Verified NGO');
  });

  it.each([
    [null, '/signup', 'Post a Task'],
    ['ngo', '/org', 'Post a Task'],
    ['volunteer', '/dashboard', 'View your impact']
  ])('points the second door to the right place for role %s', (role, href, label) => {
    const { container } = render(HandoffTable, { tasks: [task()], locale: 'en', role });
    const door = container.querySelector('.door.secondary');
    expect(door).toHaveAttribute('href', href);
    expect(door).toHaveTextContent(label);
    expect(container.querySelector('.door.find')).toHaveAttribute('href', '/tasks');
  });

  it('renders translated copy for another locale', () => {
    const { getByRole } = render(HandoffTable, { tasks: [task()], locale: 'es' });
    expect(getByRole('heading', { name: 'La ONG la aprueba.' })).toBeInTheDocument();
  });

  it('mounts the live Glaxnimate players without inline HTML in the markup', () => {
    const { container } = render(HandoffTable, { tasks: [task()], locale: 'en' });
    const players = container.querySelectorAll('[data-timeline]');
    expect(players).toHaveLength(8);
    for (const player of players) expect(player.querySelector('svg')).not.toBeNull();
  });
});
