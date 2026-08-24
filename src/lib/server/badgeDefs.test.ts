import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { envState, mocks } = vi.hoisted(() => ({
  envState: {} as Record<string, string | undefined>,
  mocks: {
    listRows: vi.fn(),
    getRow: vi.fn(),
    createRow: vi.fn(),
    deleteRow: vi.fn(),
    unique: vi.fn(),
    equal: vi.fn(),
    orderDesc: vi.fn(),
    limit: vi.fn()
  }
}));
vi.mock('$env/dynamic/private', () => ({
  env: new Proxy(envState, { get: (_, key: string) => envState[key] })
}));
vi.mock('node-appwrite', () => ({
  Client: class { setEndpoint() { return this; } setProject() { return this; } setKey() { return this; } },
  TablesDB: class {
    listRows = mocks.listRows;
    getRow = mocks.getRow;
    createRow = mocks.createRow;
    deleteRow = mocks.deleteRow;
  },
  ID: { unique: mocks.unique },
  Query: { equal: mocks.equal, orderDesc: mocks.orderDesc, limit: mocks.limit }
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

describe('badgeDefs (Appwrite mode)', () => {
  let originalHarness: string | undefined;

  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.unique.mockReturnValue('new-id');
    mocks.equal.mockImplementation((field, value) => `equal(${field},${value})`);
    mocks.orderDesc.mockImplementation((field) => `orderDesc(${field})`);
    mocks.limit.mockImplementation((value) => `limit(${value})`);

    originalHarness = process.env.PLAYWRIGHT_A11Y_HARNESS;
    delete process.env.PLAYWRIGHT_A11Y_HARNESS;
    Object.assign(envState, {
      APPWRITE_ENDPOINT: 'https://fake.appwrite.io/v1',
      APPWRITE_PROJECT_ID: 'proj',
      APPWRITE_API_KEY: 'key',
      APPWRITE_DB_ID: 'db',
      APPWRITE_BADGE_DEFS_TABLE_ID: 'badge-defs'
    });
    vi.resetModules();
  });

  afterEach(() => {
    for (const key of Object.keys(envState)) delete envState[key];
    if (originalHarness === undefined) delete process.env.PLAYWRIGHT_A11Y_HARNESS;
    else process.env.PLAYWRIGHT_A11Y_HARNESS = originalHarness;
    vi.resetModules();
  });

  it('lists Appwrite rows and normalizes nullable optional values', async () => {
    const { listBadgeDefinitions } = await import('./badgeDefs');
    mocks.listRows.mockResolvedValue({
      rows: [{
        $id: 'def-1',
        $createdAt: '2026-01-01T00:00:00.000Z',
        orgID: 'org-1',
        label: 'Helper',
        color: '#FF6B6B',
        icon: null,
        criteria: 'task-completion',
        taskID: null,
        description: null
      }]
    });

    await expect(listBadgeDefinitions('org-1')).resolves.toEqual([{
      id: 'def-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      orgId: 'org-1',
      label: 'Helper',
      color: '#FF6B6B',
      icon: undefined,
      criteria: 'task-completion',
      taskId: undefined,
      description: undefined
    }]);
    expect(mocks.listRows).toHaveBeenCalledWith('db', 'badge-defs', [
      'equal(orgID,org-1)',
      'orderDesc($createdAt)',
      'limit(200)'
    ]);
  });

  it('returns an empty Appwrite list when row lookup fails', async () => {
    const { listBadgeDefinitions } = await import('./badgeDefs');
    mocks.listRows.mockRejectedValue(new Error('database unavailable'));

    await expect(listBadgeDefinitions('org-1')).resolves.toEqual([]);
  });

  it('creates Appwrite rows with optional defaults and maps populated values back', async () => {
    const { createBadgeDefinition } = await import('./badgeDefs');
    mocks.createRow
      .mockResolvedValueOnce({
        $id: 'def-1', $createdAt: '2026-01-01T00:00:00.000Z', orgID: 'org-1', label: 'Helper', color: '#FF6B6B',
        icon: '', criteria: 'task-completion', taskID: '', description: ''
      })
      .mockResolvedValueOnce({
        $id: 'def-2', $createdAt: '2026-01-02T00:00:00.000Z', orgID: 'org-1', label: 'Specific', color: '#3B82F6',
        icon: 'trophy', criteria: 'task-specific', taskID: 'task-1', description: 'For task 1'
      });

    const defaulted = await createBadgeDefinition({
      orgId: 'org-1', label: 'Helper', color: '#FF6B6B', criteria: 'task-completion'
    });
    expect(mocks.createRow).toHaveBeenCalledWith('db', 'badge-defs', 'new-id', {
      orgID: 'org-1', label: 'Helper', color: '#FF6B6B', icon: '', criteria: 'task-completion', taskID: '', description: ''
    });
    expect(defaulted).toMatchObject({ id: 'def-1', orgId: 'org-1', icon: '', taskId: '', description: '' });

    const populated = await createBadgeDefinition({
      orgId: 'org-1', label: 'Specific', color: '#3B82F6', icon: 'trophy', criteria: 'task-specific',
      taskId: 'task-1', description: 'For task 1'
    });
    expect(populated).toMatchObject({ id: 'def-2', icon: 'trophy', taskId: 'task-1', description: 'For task 1' });
  });

  it('checks Appwrite ownership before deleting and handles lookup failures', async () => {
    const { deleteBadgeDefinition } = await import('./badgeDefs');
    mocks.getRow
      .mockResolvedValueOnce({ orgID: 'org-2' })
      .mockResolvedValueOnce({ orgID: 'org-1' })
      .mockRejectedValueOnce(new Error('not found'));

    await expect(deleteBadgeDefinition('def-1', 'org-1')).resolves.toBe(false);
    await expect(deleteBadgeDefinition('def-1', 'org-1')).resolves.toBe(true);
    await expect(deleteBadgeDefinition('def-1', 'org-1')).resolves.toBe(false);
    expect(mocks.deleteRow).toHaveBeenCalledWith('db', 'badge-defs', 'def-1');
  });

  it('gets an Appwrite row and returns undefined when it cannot be read', async () => {
    const { getBadgeDefinition } = await import('./badgeDefs');
    mocks.getRow
      .mockResolvedValueOnce({
        $id: 'def-1', $createdAt: '2026-01-01T00:00:00.000Z', orgID: 'org-1', label: 'Helper', color: '#FF6B6B',
        icon: 'trophy', criteria: 'task-completion', taskID: 'task-1', description: 'For task 1'
      })
      .mockRejectedValueOnce(new Error('not found'));

    await expect(getBadgeDefinition('def-1')).resolves.toMatchObject({
      id: 'def-1', icon: 'trophy', taskId: 'task-1', description: 'For task 1'
    });
    await expect(getBadgeDefinition('ghost')).resolves.toBeUndefined();
  });
});
