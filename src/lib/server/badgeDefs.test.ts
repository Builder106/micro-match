import { describe, it, expect, beforeEach, vi } from 'vitest';

const { envState } = vi.hoisted(() => ({ envState: {} as Record<string, string | undefined> }));
vi.mock('$env/dynamic/private', () => ({
  env: new Proxy(envState, { get: (_, key: string) => envState[key] })
}));
vi.mock('node-appwrite', () => ({
  Client: class { setEndpoint() { return this; } setProject() { return this; } setKey() { return this; } },
  TablesDB: class {},
  ID: { unique: () => 'unique' },
  Query: { equal: () => '', orderDesc: () => '', limit: () => '' }
}));

import { createBadgeDefinition, listBadgeDefinitions, deleteBadgeDefinition, getBadgeDefinition } from './badgeDefs';

describe('badgeDefs (in-memory mode)', () => {
  beforeEach(async () => {
    // Wipe state across both test orgs.
    for (const orgId of ['org-A', 'org-B']) {
      const defs = await listBadgeDefinitions(orgId);
      for (const d of defs) await deleteBadgeDefinition(d.id, d.orgId);
    }
  });

  it('creates a definition with a unique id and a createdAt stamp', async () => {
    const a = await createBadgeDefinition({
      orgId: 'org-A',
      label: 'Helper',
      color: '#FF6B6B',
      criteria: 'task-completion'
    });
    const b = await createBadgeDefinition({
      orgId: 'org-A',
      label: 'Speedy',
      color: '#3b82f6',
      criteria: 'task-completion'
    });

    expect(a.id).not.toBe(b.id);
    expect(a.createdAt).toBeTruthy();
    expect(b.createdAt).toBeTruthy();
  });

  it('listBadgeDefinitions only returns rows for the requested org', async () => {
    await createBadgeDefinition({ orgId: 'org-A', label: 'A1', color: '#1', criteria: 'task-completion' });
    await createBadgeDefinition({ orgId: 'org-A', label: 'A2', color: '#2', criteria: 'task-completion' });
    await createBadgeDefinition({ orgId: 'org-B', label: 'B1', color: '#3', criteria: 'task-completion' });

    const aDefs = await listBadgeDefinitions('org-A');
    const bDefs = await listBadgeDefinitions('org-B');

    expect(aDefs.map((d) => d.label).sort()).toEqual(['A1', 'A2']);
    expect(bDefs.map((d) => d.label)).toEqual(['B1']);
  });

  it('deleteBadgeDefinition only succeeds when the orgId matches the row owner', async () => {
    const def = await createBadgeDefinition({
      orgId: 'org-A',
      label: 'OnlyA',
      color: '#1',
      criteria: 'task-completion'
    });

    // Wrong org tries to delete → false, row is preserved.
    const wrongOrg = await deleteBadgeDefinition(def.id, 'org-B');
    expect(wrongOrg).toBe(false);
    expect(await getBadgeDefinition(def.id)).toBeDefined();

    // Right org → true, row goes away.
    const ok = await deleteBadgeDefinition(def.id, 'org-A');
    expect(ok).toBe(true);
    expect(await getBadgeDefinition(def.id)).toBeUndefined();
  });

  it('deleteBadgeDefinition returns false for unknown ids', async () => {
    const result = await deleteBadgeDefinition('does-not-exist', 'org-A');
    expect(result).toBe(false);
  });

  it('getBadgeDefinition returns undefined for unknown ids', async () => {
    expect(await getBadgeDefinition('ghost')).toBeUndefined();
  });

  it('preserves taskId, icon, and description on creation', async () => {
    const def = await createBadgeDefinition({
      orgId: 'org-A',
      label: 'Specific',
      color: '#1',
      criteria: 'task-specific',
      taskId: 'task-99',
      icon: 'hugeicons:trophy-01',
      description: 'Awarded for completing task 99'
    });

    expect(def.taskId).toBe('task-99');
    expect(def.icon).toBe('hugeicons:trophy-01');
    expect(def.description).toBe('Awarded for completing task 99');
  });
});
