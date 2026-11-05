import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: { createRow: vi.fn(), listRows: vi.fn(), updateRow: vi.fn() },
}));

vi.mock('$app/env/private', () => {
  const env: Record<string, string> = {
    APPWRITE_ENDPOINT: 'https://fake.appwrite.io/v1',
    APPWRITE_PROJECT_ID: 'proj',
    APPWRITE_API_KEY: 'key',
    APPWRITE_DB_ID: 'db',
  };
  return new Proxy(env, { get: (_, key: string) => env[key], has: () => true });
});
vi.mock('node-appwrite', () => ({
  Client: class {
    setEndpoint() {
      return this;
    }
    setProject() {
      return this;
    }
    setKey() {
      return this;
    }
  },
  TablesDB: class {
    createRow = mocks.createRow;
    listRows = mocks.listRows;
    updateRow = mocks.updateRow;
  },
  ID: { unique: () => 'new-id' },
  Query: {
    equal: (key: string, value: unknown) => `equal(${key},${value})`,
    orderDesc: (key: string) => `orderDesc(${key})`,
    limit: (n: number) => `limit(${n})`,
  },
}));

import { openTable } from './rowStore';

type Row = { id: string; owner: string; note?: string };
const raw = { $id: 'r1', $createdAt: 'then', $permissions: [], owner: 'x', note: null };

describe('openTable with Appwrite credentials', () => {
  beforeEach(() => Object.values(mocks).forEach((m) => m.mockReset()));

  it('creates a row and maps $id to id, dropping metadata and null columns', async () => {
    mocks.createRow.mockResolvedValue(raw);
    const row = await openTable<Row>('t1').create({ owner: 'x' });
    expect(row).toEqual({ id: 'r1', owner: 'x' });
    expect(mocks.createRow).toHaveBeenCalledWith({
      databaseId: 'db',
      tableId: 't1',
      rowId: 'new-id',
      data: { owner: 'x' },
    });
  });

  it('lists with equality filters, newest first, and the default or given limit', async () => {
    mocks.listRows.mockResolvedValue({ rows: [raw] });
    const table = openTable<Row>('t1');
    expect(await table.list({ owner: 'x' })).toEqual([{ id: 'r1', owner: 'x' }]);
    expect(mocks.listRows).toHaveBeenLastCalledWith({
      databaseId: 'db',
      tableId: 't1',
      queries: ['equal(owner,x)', 'orderDesc($createdAt)', 'limit(100)'],
    });
    await table.list(undefined, 1);
    expect(mocks.listRows).toHaveBeenLastCalledWith({
      databaseId: 'db',
      tableId: 't1',
      queries: ['orderDesc($createdAt)', 'limit(1)'],
    });
  });

  it('updates a row, and returns undefined when Appwrite refuses', async () => {
    mocks.updateRow.mockResolvedValueOnce({ ...raw, note: 'hi' });
    const table = openTable<Row>('t1');
    expect(await table.update('r1', { note: 'hi' })).toEqual({ id: 'r1', owner: 'x', note: 'hi' });
    mocks.updateRow.mockRejectedValueOnce(new Error('404'));
    expect(await table.update('gone', { note: 'x' })).toBeUndefined();
  });

  it('falls back to memory when no table id is given', async () => {
    const table = openTable<Row>('');
    const row = await table.create({ owner: 'x' });
    expect(row.id).toMatch(/^mem-/);
    expect(mocks.createRow).not.toHaveBeenCalled();
  });
});
