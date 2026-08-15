import { env } from '$env/dynamic/private';
import type { BadgeDefinition } from '$lib/types';

const useAppwrite =
  !!env.APPWRITE_ENDPOINT &&
  !!env.APPWRITE_PROJECT_ID &&
  !!env.APPWRITE_API_KEY &&
  !!env.APPWRITE_DB_ID &&
  !!env.APPWRITE_BADGE_DEFS_TABLE_ID;

const inMemory = new Map<string, BadgeDefinition>();
let inMemoryCounter = 0;
const newMemId = () => `mem-${Date.now()}-${++inMemoryCounter}`;

async function withAppwrite<T>(fn: (ctx: {
  tables: import('node-appwrite').TablesDB;
  dbId: string;
  table: string;
  ID: typeof import('node-appwrite').ID;
  Query: typeof import('node-appwrite').Query;
}) => Promise<T>): Promise<T> {
  const { Client, TablesDB, ID, Query } = await import('node-appwrite');
  const client = new Client()
    .setEndpoint(env.APPWRITE_ENDPOINT!)
    .setProject(env.APPWRITE_PROJECT_ID!)
    .setKey(env.APPWRITE_API_KEY!);
  return fn({
    tables: new TablesDB(client),
    dbId: env.APPWRITE_DB_ID!,
    table: env.APPWRITE_BADGE_DEFS_TABLE_ID!,
    ID,
    Query
  });
}

type DbBadgeDefRow = import('node-appwrite').Models.Row & {
  orgID: string;
  label: string;
  color: string;
  icon?: string | null;
  criteria: BadgeDefinition['criteria'];
  taskID?: string | null;
  description?: string | null;
};

function fromRow(row: DbBadgeDefRow): BadgeDefinition {
  return {
    id: row.$id,
    orgId: row.orgID,
    label: row.label,
    color: row.color,
    icon: row.icon ?? undefined,
    criteria: row.criteria,
    taskId: row.taskID ?? undefined,
    description: row.description ?? undefined,
    createdAt: row.$createdAt
  };
}

export async function listBadgeDefinitions(orgId: string): Promise<BadgeDefinition[]> {
  if (!useAppwrite) return Array.from(inMemory.values()).filter((b) => b.orgId === orgId);
  return withAppwrite(async ({ tables, dbId, table, Query }) => {
    try {
      const res = await tables.listRows<DbBadgeDefRow>(dbId, table, [
        Query.equal('orgID', orgId),
        Query.orderDesc('$createdAt'),
        Query.limit(200)
      ]);
      return res.rows.map(fromRow);
    } catch {
      return [];
    }
  });
}

export async function createBadgeDefinition(input: {
  orgId: string;
  label: string;
  color: string;
  icon?: string;
  criteria: BadgeDefinition['criteria'];
  taskId?: string;
  description?: string;
}): Promise<BadgeDefinition> {
  if (!useAppwrite) {
    const id = newMemId();
    const created: BadgeDefinition = { id, createdAt: new Date().toISOString(), ...input };
    inMemory.set(id, created);
    return created;
  }
  return withAppwrite(async ({ tables, dbId, table, ID }) => {
    const payload: Omit<DbBadgeDefRow, keyof import('node-appwrite').Models.Row> = {
      orgID: input.orgId,
      label: input.label,
      color: input.color,
      icon: input.icon ?? '',
      criteria: input.criteria,
      taskID: input.taskId ?? '',
      description: input.description ?? ''
    };
    const created = await tables.createRow<DbBadgeDefRow>(dbId, table, ID.unique(), payload);
    return fromRow(created);
  });
}

export async function deleteBadgeDefinition(id: string, orgId: string): Promise<boolean> {
  if (!useAppwrite) {
    const existing = inMemory.get(id);
    if (!existing || existing.orgId !== orgId) return false;
    inMemory.delete(id);
    return true;
  }
  return withAppwrite(async ({ tables, dbId, table }) => {
    try {
      // Confirm ownership before delete to prevent cross-org tampering.
      const row = await tables.getRow<DbBadgeDefRow>(dbId, table, id);
      if (row?.orgID !== orgId) return false;
      await tables.deleteRow(dbId, table, id);
      return true;
    } catch {
      return false;
    }
  });
}

export async function getBadgeDefinition(id: string): Promise<BadgeDefinition | undefined> {
  if (!useAppwrite) return inMemory.get(id);
  return withAppwrite(async ({ tables, dbId, table }) => {
    try {
      const row = await tables.getRow<DbBadgeDefRow>(dbId, table, id);
      return fromRow(row);
    } catch {
      return undefined;
    }
  });
}
