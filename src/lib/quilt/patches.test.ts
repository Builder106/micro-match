import { describe, it, expect } from 'vitest';
import { badgeForTask, bySewnDate, designFor, patchFromClaim, type QuiltPatch } from './patches';
import { MUSLIN } from './fabrics';
import type { BadgeDefinition, Claim, Task } from '$lib/types';

const def = (over: Partial<BadgeDefinition>): BadgeDefinition => ({ id: 'd', orgId: 'o', label: 'L', color: '#3B4A8C', criteria: 'task-completion', ...over });

describe('badgeForTask', () => {
  it('prefers the badge for that exact task, then the any-task badge', () => {
    const any = def({ id: 'any' });
    const exact = def({ id: 'exact', criteria: 'task-specific', taskId: 't1' });
    expect(badgeForTask('t1', [any, exact])?.id).toBe('exact');
    expect(badgeForTask('t2', [any, exact])?.id).toBe('any');
    expect(badgeForTask('t2', [exact, def({ criteria: 'milestone' })])).toBeUndefined();
  });
});

describe('designFor', () => {
  it('dresses a patch in the badge, or plain muslin', () => {
    expect(designFor(def({ icon: 'quilt:leaf', label: 'Greener' }))).toEqual({ color: '#3B4A8C', thread: '#FDFCF8', icon: 'leaf', label: 'Greener' });
    expect(designFor(null)).toEqual({ color: MUSLIN, thread: '#1C1F3B', icon: null, label: null });
  });
});

describe('patchFromClaim', () => {
  const claim: Claim = { id: 'c1', taskId: 't1', status: 'approved', reviewedAt: '2026-10-02T00:00:00Z', createdAt: '2026-10-01T00:00:00Z' };
  it('takes title, minutes and the review date', () => {
    const task: Task = { id: 't1', title: 'Tag photos', shortDescription: '', tags: [], estimatedMinutes: 5 };
    const p = patchFromClaim(claim, task, [def({})]);
    expect(p).toMatchObject({ id: 'c1', status: 'approved', taskId: 't1', taskTitle: 'Tag photos', minutes: 5, sewnAt: claim.reviewedAt, label: 'L' });
  });
  it('copes with a missing task and an unreviewed claim', () => {
    const p = patchFromClaim({ id: 'c2', taskId: 'gone', status: 'pending', createdAt: '2026-10-01T00:00:00Z' }, undefined, []);
    expect(p).toMatchObject({ taskTitle: null, minutes: null, sewnAt: '2026-10-01T00:00:00Z', color: MUSLIN });
    expect(patchFromClaim({ id: 'c3', taskId: 'x', status: 'pending' }, undefined, []).sewnAt).toBeNull();
  });
});

describe('bySewnDate', () => {
  it('orders oldest first, then by id', () => {
    const p = (id: string, sewnAt: string | null) => ({ id, sewnAt }) as QuiltPatch;
    const sorted = [p('b', '2026-10-02'), p('a', '2026-10-02'), p('c', '2026-10-01'), p('d', null)].sort(bySewnDate);
    expect(sorted.map((x) => x.id)).toEqual(['d', 'c', 'a', 'b']);
  });
});
