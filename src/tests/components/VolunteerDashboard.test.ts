import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';

const { mocks } = vi.hoisted(() => ({
  mocks: { accountGet: vi.fn(), fireConfettiBurst: vi.fn() }
}));
vi.mock('$lib/appwrite.client', () => ({ account: { get: mocks.accountGet } }));
vi.mock('$lib/utils/confetti', () => ({ fireConfettiBurst: mocks.fireConfettiBurst }));

import VolunteerDashboard from '$lib/components/VolunteerDashboard.svelte';

const baseData = {
  signedIn: true,
  user: { id: 'user-1', email: 'jane@example.com' },
  userData: {
    approvedClaimsCount: 0,
    totalHours: 0,
    myClaims: [],
    recommendations: []
  }
};

function stubBadgesFetch(badges: Partial<import('$lib/types').Badge>[] = []) {
  return vi.fn(async (url: string) => {
    if (String(url).includes('/api/badges')) {
      return new Response(JSON.stringify(badges), { status: 200 });
    }
    return new Response('{}', { status: 200 });
  });
}

describe('VolunteerDashboard', () => {
  beforeEach(() => {
    mocks.accountGet.mockReset().mockResolvedValue({ name: 'Jane Doe' });
    mocks.fireConfettiBurst.mockReset();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('greets first-time volunteers with the zero-tasks copy', async () => {
    vi.stubGlobal('fetch', stubBadgesFetch());
    render(VolunteerDashboard, { data: baseData });

    expect(await screen.findByText(/Let's land your first task/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Pick up a task/i })).toBeInTheDocument();
  });

  it('shows level progress copy once the volunteer has completed tasks', async () => {
    vi.stubGlobal('fetch', stubBadgesFetch());
    const data = { ...baseData, userData: { ...baseData.userData, approvedClaimsCount: 4, totalHours: 2.5 } };
    render(VolunteerDashboard, { data });

    expect(await screen.findByText(/Level 2 volunteer/i)).toBeInTheDocument();
    expect(screen.getByText(/4 tasks done/)).toBeInTheDocument();
  });

  it('resolves the first name from the account and greets by it', async () => {
    vi.stubGlobal('fetch', stubBadgesFetch());
    mocks.accountGet.mockResolvedValue({ name: 'Jane Doe' });
    render(VolunteerDashboard, { data: baseData });

    expect(await screen.findByText('Jane')).toBeInTheDocument();
  });

  it('shows the "all caught up" empty state when there are no recommendations', async () => {
    vi.stubGlobal('fetch', stubBadgesFetch());
    render(VolunteerDashboard, { data: baseData });
    expect(await screen.findByText("You're all caught up.")).toBeInTheDocument();
  });

  it('renders today\'s mission card from the first recommendation', async () => {
    vi.stubGlobal('fetch', stubBadgesFetch());
    const data = {
      ...baseData,
      userData: {
        ...baseData.userData,
        recommendations: [{ id: 't1', title: 'Translate flyer', shortDescription: 'Short', estimatedMinutes: 15 }]
      }
    };
    render(VolunteerDashboard, { data });

    expect(await screen.findByText('Translate flyer')).toBeInTheDocument();
    expect(screen.getByText(/15 min/)).toBeInTheDocument();
  });

  it('shows locked badges when the volunteer has none yet', async () => {
    vi.stubGlobal('fetch', stubBadgesFetch([]));
    render(VolunteerDashboard, { data: baseData });
    expect(await screen.findByText('First Mission')).toBeInTheDocument();
  });

  it('shows earned badges fetched from /api/badges', async () => {
    vi.stubGlobal('fetch', stubBadgesFetch([{ label: 'Helper', color: '#FF6B6B' }]));
    render(VolunteerDashboard, { data: baseData });

    await waitFor(async () => {
      expect(await screen.findByText('Helper')).toBeInTheDocument();
    });
  });

  it('shows the empty recent-activity state when there are no claims', async () => {
    vi.stubGlobal('fetch', stubBadgesFetch());
    render(VolunteerDashboard, { data: baseData });
    expect(await screen.findByText(/Complete your first task to start filling this feed/i)).toBeInTheDocument();
  });

  it('renders recent activity rows with a status label', async () => {
    vi.stubGlobal('fetch', stubBadgesFetch());
    const data = {
      ...baseData,
      userData: {
        ...baseData.userData,
        myClaims: [{ id: 'c1', status: 'approved', task: { title: 'Translate flyer' } }]
      }
    };
    render(VolunteerDashboard, { data });

    expect(await screen.findByText('Approved')).toBeInTheDocument();
  });

  it('fires confetti on mount when celebrate=1 is stored in localStorage', async () => {
    vi.stubGlobal('fetch', stubBadgesFetch());
    localStorage.setItem('celebrate', '1');
    render(VolunteerDashboard, { data: baseData });

    await waitFor(() => expect(mocks.fireConfettiBurst).toHaveBeenCalled());
    expect(localStorage.getItem('celebrate')).toBeNull();
  });
});
