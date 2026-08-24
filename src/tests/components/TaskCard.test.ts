import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TaskCard from '$lib/components/TaskCard.svelte';

describe('TaskCard', () => {
  it('renders title, description, and estimated time', () => {
    render(TaskCard, {
      id: 't1', title: 'Translate flyer', shortDescription: 'Short desc', estimatedMinutes: 20
    });

    expect(screen.getByText('Translate flyer')).toBeInTheDocument();
    expect(screen.getByText('Short desc')).toBeInTheDocument();
    expect(screen.getByText(/20 min/)).toBeInTheDocument();
  });

  it('links to /task/{id} by default', () => {
    render(TaskCard, { id: 'abc123', title: 'T', shortDescription: 'S' });
    const link = screen.getByRole('link', { name: /View T/i });
    expect(link).toHaveAttribute('href', '/task/abc123');
  });

  it('renders each tag with a leading #', () => {
    render(TaskCard, { id: 't1', title: 'T', shortDescription: 'S', tags: ['spanish', 'health'] });
    expect(screen.getByText('#spanish')).toBeInTheDocument();
    expect(screen.getByText('#health')).toBeInTheDocument();
  });

  it('shows a status flag for a non-active status', () => {
    render(TaskCard, { id: 't1', title: 'T', shortDescription: 'S', status: 'completed' });
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('does not show a status flag for an active task', () => {
    render(TaskCard, { id: 't1', title: 'T', shortDescription: 'S', status: 'active' });
    expect(screen.queryByText('Completed')).toBeNull();
  });

  it('shows an Unverified flag when isVerified is false', () => {
    render(TaskCard, { id: 't1', title: 'T', shortDescription: 'S', isVerified: false });
    expect(screen.getByText('Unverified')).toBeInTheDocument();
  });

  it('does not show an Unverified flag when isVerified is true or undefined', () => {
    render(TaskCard, { id: 't1', title: 'T', shortDescription: 'S', isVerified: true });
    expect(screen.queryByText('Unverified')).toBeNull();
  });

  it('shows a "Due today" deadline tag', () => {
    render(TaskCard, { id: 't1', title: 'T', shortDescription: 'S', deadline: new Date().toISOString() });
    expect(screen.getByText('Due today')).toBeInTheDocument();
  });

  it('shows an "Expired" deadline tag for a past deadline', () => {
    render(TaskCard, {
      id: 't1', title: 'T', shortDescription: 'S',
      deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    });
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('shows status flags for expired and moderated statuses', () => {
    render(TaskCard, { id: 't1', title: 'T', shortDescription: 'S', status: 'expired' });
    expect(screen.getByText('Expired')).toBeInTheDocument();

    render(TaskCard, { id: 't2', title: 'T2', shortDescription: 'S2', status: 'moderated' });
    expect(screen.getByText('Under review')).toBeInTheDocument();
  });

  it('renders the language indicator when provided', () => {
    render(TaskCard, { id: 't1', title: 'T', shortDescription: 'S', language: 'French' });
    expect(screen.getByText('French')).toBeInTheDocument();
  });

  it('formats various deadline windows (tomorrow, in N days, future)', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    render(TaskCard, { id: 't1', title: 'T', shortDescription: 'S', deadline: tomorrow });
    expect(screen.getByText('Due tomorrow')).toBeInTheDocument();

    const inFourDays = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();
    render(TaskCard, { id: 't2', title: 'T', shortDescription: 'S', deadline: inFourDays });
    expect(screen.getByText(/Due in \d+ days/)).toBeInTheDocument();

    const inTwentyDays = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString();
    render(TaskCard, { id: 't3', title: 'T', shortDescription: 'S', deadline: inTwentyDays });
    expect(screen.getByText(/Due \d+/)).toBeInTheDocument();
  });

  it('shows a max-volunteers tag when maxVolunteers is set', () => {
    render(TaskCard, { id: 't1', title: 'T', shortDescription: 'S', maxVolunteers: 5 });
    expect(screen.getByText(/Max 5/)).toBeInTheDocument();
  });
});

