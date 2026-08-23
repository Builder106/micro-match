import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import MissionPlanner from '$lib/components/MissionPlanner.svelte';

describe('MissionPlanner', () => {
  it('turns the default backlog into an exact four-day release schedule', () => {
    render(MissionPlanner);

    expect(screen.getByRole('heading', { name: 'missions to prepare' })).toBeInTheDocument();
    expect(screen.getByText('48', { exact: true })).toBeInTheDocument();
    expect(screen.getAllByText('12', { exact: true })).toHaveLength(4);
    expect(screen.getByText('2 hr 24 min to review', { exact: true })).toBeInTheDocument();
  });

  it('shows the true daily distribution for a schedule with a remainder', async () => {
    render(MissionPlanner);

    await fireEvent.input(screen.getByRole('spinbutton', { name: 'Backlog hours' }), { target: { value: 3 } });
    await fireEvent.blur(screen.getByRole('spinbutton', { name: 'Backlog hours' }));
    await fireEvent.click(screen.getByRole('radio', { name: /^5 minutes/i }));
    await fireEvent.click(screen.getByRole('radio', { name: '7 days' }));

    expect(screen.getByText('6 on your busiest day', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('Day 7', { exact: true })).toBeInTheDocument();
    expect(screen.getAllByText('5', { exact: true })).toHaveLength(6);
  });
});
