import { describe, expect, it } from 'vitest';
import { openTable } from './rowStore';

type Row = { id: string; owner: string; n: number };

describe('openTable without Appwrite credentials', () => {
  it('creates, filters newest first, limits and updates rows in memory', async () => {
    const table = openTable<Row>('anything');
    const a = await table.create({ owner: 'x', n: 1 });
    const b = await table.create({ owner: 'x', n: 2 });
    await table.create({ owner: 'y', n: 3 });
    expect(a.id).not.toBe(b.id);

    expect((await table.list({ owner: 'x' })).map((r) => r.n)).toEqual([2, 1]);
    expect(await table.list({ owner: 'x' }, 1)).toHaveLength(1);
    expect(await table.list()).toHaveLength(3);
    expect(await table.update(a.id, { n: 9 })).toEqual({ ...a, n: 9 });
    expect((await table.list({ n: 9 }))[0]?.id).toBe(a.id);
  });

  it('returns undefined when updating a missing row', async () => {
    expect(await openTable<Row>('t').update('missing', { n: 1 })).toBeUndefined();
  });

  it('keeps separate tables apart', async () => {
    const one = openTable<Row>('one');
    const two = openTable<Row>('two');
    await one.create({ owner: 'x', n: 1 });
    expect(await two.list()).toEqual([]);
  });
});
