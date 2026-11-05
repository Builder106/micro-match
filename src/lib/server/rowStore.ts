// A small table interface with two backends, so feature code is written once. Without
// Appwrite credentials (local work, tests, the a11y harness) rows live in a Map.
import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  APPWRITE_DB_ID,
} from '$app/env/private';

export type Doc = { id: string };
type Cell = string | number | boolean | string[] | undefined;
type Fields<T extends Doc> = Omit<T, 'id'>;

export interface Table<T extends Doc> {
  create(data: Fields<T>): Promise<T>;
  /** Rows whose fields equal every given value, newest first. */
  list(where?: Partial<Fields<T>>, limit?: number): Promise<T[]>;
  update(id: string, patch: Partial<Fields<T>>): Promise<T | undefined>;
}

let counter = 0;

function memoryTable<T extends Doc>(): Table<T> {
  const rows = new Map<string, T>();
  return {
    async create(data) {
      const row = { ...data, id: `mem-${Date.now()}-${++counter}` } as T;
      rows.set(row.id, row);
      return row;
    },
    async list(where = {}, limit = 100) {
      const entries = Object.entries(where);
      return [...rows.values()]
        .filter((row) =>
          entries.every(([key, value]) => (row as Record<string, Cell>)[key] === value),
        )
        .reverse()
        .slice(0, limit);
    },
    async update(id, patch) {
      const row = rows.get(id);
      if (!row) return undefined;
      const next = { ...row, ...patch };
      rows.set(id, next);
      return next;
    },
  };
}

type AppwriteRow = import('node-appwrite').Models.Row;

/** Appwrite's `$id` becomes `id`; its `$`-prefixed metadata and null columns are dropped. */
function fromRow<T extends Doc>(row: AppwriteRow): T {
  const out: Record<string, Cell> = { id: row.$id };
  for (const [key, value] of Object.entries(row)) {
    if (!key.startsWith('$') && value !== null) out[key] = value;
  }
  return out as T;
}

async function connect() {
  const { Client, TablesDB, ID, Query } = await import('node-appwrite');
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);
  return { tables: new TablesDB(client), ID, Query };
}

function appwriteTable<T extends Doc>(tableId: string): Table<T> {
  const databaseId = APPWRITE_DB_ID;
  return {
    async create(data) {
      const { tables, ID } = await connect();
      const row = await tables.createRow({ databaseId, tableId, rowId: ID.unique(), data });
      return fromRow<T>(row);
    },
    async list(where = {}, limit = 100) {
      const { tables, Query } = await connect();
      const res = await tables.listRows({
        databaseId,
        tableId,
        queries: [
          ...Object.entries(where).map(([key, value]) => Query.equal(key, value as string)),
          Query.orderDesc('$createdAt'),
          Query.limit(limit),
        ],
      });
      return res.rows.map((row) => fromRow<T>(row));
    },
    async update(id, patch) {
      const { tables } = await connect();
      try {
        return fromRow<T>(await tables.updateRow({ databaseId, tableId, rowId: id, data: patch }));
      } catch {
        return undefined;
      }
    },
  };
}

/** The Appwrite table when credentials and a table id are set, otherwise a Map. */
export function openTable<T extends Doc>(tableId: string): Table<T> {
  const live =
    process.env.PLAYWRIGHT_A11Y_HARNESS !== '1' &&
    !!APPWRITE_ENDPOINT &&
    !!APPWRITE_PROJECT_ID &&
    !!APPWRITE_API_KEY &&
    !!APPWRITE_DB_ID &&
    !!tableId;
  return live ? appwriteTable<T>(tableId) : memoryTable<T>();
}
