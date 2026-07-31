import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    listRows: vi.fn(),
    getRow: vi.fn(),
    createRow: vi.fn(),
    deleteRow: vi.fn()
  }
}));

vi.mock('$env/dynamic/private', () => ({
  env: {
    APPWRITE_ENDPOINT: 'https://fake.appwrite.io/v1',
    APPWRITE_PROJECT_ID: 'proj',
    APPWRITE_API_KEY: 'key',
    APPWRITE_DB_ID: 'db',
    APPWRITE_BADGE_DEFS_TABLE_ID: 'badge-defs'
  }
}));
vi.mock('node-appwrite', () => ({
  Client: class { setEndpoint() { return this; } setProject() { return this; } setKey() { return this; } },
  TablesDB: class {
    listRows = mocks.listRows;
    getRow = mocks.getRow;
    createRow = mocks.createRow;
    deleteRow = mocks.deleteRow;
  },
  ID: { unique: () => 'new-id' },
  Query: {
    equal: (k: string, v: unknown) => `equal(${k},${v})`,
    limit: (n: number) => `limit(${n})`,
    orderDesc: (k: string) => `orderDesc(${k})`
  }
}));

import { createBadgeDefinition, listBadgeDefinitions, deleteBadgeDefinition, getBadgeDefinition } from './badgeDefs';

const row = {
  $id: 'def-1', orgID: 'org-1', label: 'Helper', color: '#FF6B6B', icon: 'hugeicons:trophy-01',
  criteria: 'task-completion', taskID: undefined, description: 'desc', $createdAt: '2026-01-01T00:00:00.000Z'
};

describe('badgeDefs (Appwrite-backed mode)', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
  });

  it('listBadgeDefinitions maps rows and returns [] on error', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: [row] });
    const defs = await listBadgeDefinitions('org-1');
    expect(defs).toEqual([expect.objectContaining({ id: 'def-1', orgId: 'org-1', label: 'Helper' })]);

    mocks.listRows.mockRejectedValueOnce(new Error('down'));
    expect(await listBadgeDefinitions('org-1')).toEqual([]);
  });

  it('createBadgeDefinition maps orgId to orgID and maps the response back', async () => {
    mocks.createRow.mockResolvedValue(row);

    const created = await createBadgeDefinition({
      orgId: 'org-1', label: 'Helper', color: '#FF6B6B', criteria: 'task-completion'
    });

    expect(mocks.createRow).toHaveBeenCalledWith('db', 'badge-defs', 'new-id', expect.objectContaining({ orgID: 'org-1' }));
    expect(created).toEqual(expect.objectContaining({ id: 'def-1', orgId: 'org-1' }));
  });

  it('deleteBadgeDefinition confirms ownership before deleting', async () => {
    mocks.getRow.mockResolvedValueOnce(row);
    mocks.deleteRow.mockResolvedValueOnce(undefined);

    expect(await deleteBadgeDefinition('def-1', 'org-1')).toBe(true);
    expect(mocks.deleteRow).toHaveBeenCalledWith('db', 'badge-defs', 'def-1');
  });

  it('deleteBadgeDefinition returns false when the orgId does not match the row owner', async () => {
    mocks.getRow.mockResolvedValueOnce(row);
    expect(await deleteBadgeDefinition('def-1', 'org-2')).toBe(false);
    expect(mocks.deleteRow).not.toHaveBeenCalled();
  });

  it('deleteBadgeDefinition returns false when the row lookup throws', async () => {
    mocks.getRow.mockRejectedValueOnce(new Error('not found'));
    expect(await deleteBadgeDefinition('ghost', 'org-1')).toBe(false);
  });

  it('getBadgeDefinition maps the row and returns undefined on error', async () => {
    mocks.getRow.mockResolvedValueOnce(row);
    expect(await getBadgeDefinition('def-1')).toEqual(expect.objectContaining({ id: 'def-1' }));

    mocks.getRow.mockRejectedValueOnce(new Error('not found'));
    expect(await getBadgeDefinition('ghost')).toBeUndefined();
  });
});
