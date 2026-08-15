import { env } from '$env/dynamic/private';
import type { NgoVerification } from '$lib/types';

const useAppwrite =
  !!env.APPWRITE_ENDPOINT &&
  !!env.APPWRITE_PROJECT_ID &&
  !!env.APPWRITE_API_KEY &&
  !!env.APPWRITE_DB_ID &&
  !!env.APPWRITE_VERIFICATIONS_TABLE_ID;

const inMemory = new Map<string, NgoVerification>(); // keyed by row id
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
    table: env.APPWRITE_VERIFICATIONS_TABLE_ID!,
    ID,
    Query
  });
}

type DbVerificationRow = import('node-appwrite').Models.Row & {
  userID: string;
  orgName: string;
  country: string;
  taxId: string;
  docFileId?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string | null;
  submittedAt?: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
};

function fromRow(row: DbVerificationRow): NgoVerification {
  return {
    id: row.$id,
    userId: row.userID,
    orgName: row.orgName,
    country: row.country,
    taxId: row.taxId,
    docFileId: row.docFileId ?? undefined,
    status: row.status,
    reason: row.reason ?? undefined,
    submittedAt: row.submittedAt ?? row.$createdAt ?? '',
    reviewedBy: row.reviewedBy ?? undefined,
    reviewedAt: row.reviewedAt ?? undefined
  };
}

function toRow(v: Partial<NgoVerification>): Omit<DbVerificationRow, keyof import('node-appwrite').Models.Row> {
  return {
    userID: v.userId ?? '',
    orgName: v.orgName ?? '',
    country: v.country ?? '',
    taxId: v.taxId ?? '',
    docFileId: v.docFileId ?? null,
    status: v.status ?? 'pending',
    reason: v.reason ?? null,
    submittedAt: v.submittedAt ?? '',
    reviewedBy: v.reviewedBy ?? null,
    reviewedAt: v.reviewedAt ?? null
  };
}

export async function getVerificationByUserId(userId: string): Promise<NgoVerification | undefined> {
  if (!useAppwrite) return Array.from(inMemory.values()).find((v) => v.userId === userId);
  return withAppwrite(async ({ tables, dbId, table, Query }) => {
    try {
      const res = await tables.listRows<DbVerificationRow>(dbId, table, [Query.equal('userID', userId), Query.limit(1)]);
      const row = res.rows[0];
      return row ? fromRow(row) : undefined;
    } catch {
      return undefined;
    }
  });
}

export async function listVerifications(filter?: { status?: NgoVerification['status'] }): Promise<NgoVerification[]> {
  if (!useAppwrite) {
    let rows = Array.from(inMemory.values());
    if (filter?.status) rows = rows.filter((v) => v.status === filter.status);
    return rows.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
  }
  return withAppwrite(async ({ tables, dbId, table, Query }) => {
    const queries = [Query.limit(200), Query.orderDesc('submittedAt')];
    if (filter?.status) queries.push(Query.equal('status', filter.status));
    try {
      const res = await tables.listRows<DbVerificationRow>(dbId, table, queries);
      return res.rows.map(fromRow);
    } catch {
      return [];
    }
  });
}

export async function upsertVerification(input: {
  userId: string;
  orgName: string;
  country: string;
  taxId: string;
  docFileId?: string;
}): Promise<NgoVerification> {
  const now = new Date().toISOString();

  if (!useAppwrite) {
    const existing = Array.from(inMemory.values()).find((v) => v.userId === input.userId);
    const updated: NgoVerification = {
      id: existing?.id ?? newMemId(),
      userId: input.userId,
      orgName: input.orgName,
      country: input.country,
      taxId: input.taxId,
      docFileId: input.docFileId ?? existing?.docFileId,
      status: 'pending',
      reason: undefined,
      submittedAt: now,
      reviewedBy: undefined,
      reviewedAt: undefined
    };
    inMemory.set(updated.id, updated);
    return updated;
  }

  return withAppwrite(async ({ tables, dbId, table, ID, Query }) => {
    // Find existing row for this user
    const existing = await tables.listRows<DbVerificationRow>(dbId, table, [Query.equal('userID', input.userId), Query.limit(1)]);
    const payload = toRow({
      userId: input.userId,
      orgName: input.orgName,
      country: input.country,
      taxId: input.taxId,
      docFileId: input.docFileId,
      status: 'pending',
      reason: '',
      submittedAt: now,
      reviewedBy: '',
      reviewedAt: ''
    });

    if (existing.rows[0]) {
      const id = existing.rows[0].$id;
      const updated = await tables.updateRow<DbVerificationRow>(dbId, table, id, payload);
      return fromRow(updated);
    }
    const created = await tables.createRow<DbVerificationRow>(dbId, table, ID.unique(), payload);
    return fromRow(created);
  });
}

export async function setVerificationStatus(
  userId: string,
  status: 'approved' | 'rejected',
  reviewerId: string,
  reason?: string
): Promise<NgoVerification | undefined> {
  const now = new Date().toISOString();

  if (!useAppwrite) {
    const existing = Array.from(inMemory.values()).find((v) => v.userId === userId);
    if (!existing) return undefined;
    const updated: NgoVerification = {
      ...existing,
      status,
      reason: status === 'rejected' ? reason : '',
      reviewedBy: reviewerId,
      reviewedAt: now
    };
    inMemory.set(existing.id, updated);
    return updated;
  }

  return withAppwrite(async ({ tables, dbId, table, Query }) => {
    const existing = await tables.listRows<DbVerificationRow>(dbId, table, [Query.equal('userID', userId), Query.limit(1)]);
    const row = existing.rows[0];
    if (!row) return undefined;
    const updated = await tables.updateRow<DbVerificationRow>(dbId, table, row.$id, {
      status,
      reason: status === 'rejected' ? (reason ?? '') : '',
      reviewedBy: reviewerId,
      reviewedAt: now
    });
    return fromRow(updated);
  });
}

export async function withdrawVerification(userId: string): Promise<boolean> {
  if (!useAppwrite) {
    const existing = Array.from(inMemory.values()).find((v) => v.userId === userId);
    if (!existing) return false;
    inMemory.delete(existing.id);
    return true;
  }
  return withAppwrite(async ({ tables, dbId, table, Query }) => {
    try {
      const existing = await tables.listRows<DbVerificationRow>(dbId, table, [Query.equal('userID', userId), Query.limit(1)]);
      const row = existing.rows[0];
      if (!row) return false;
      await tables.deleteRow(dbId, table, row.$id);
      return true;
    } catch {
      return false;
    }
  });
}

/** Lookup the email for a user via the Appwrite Users API. */
export async function getUserEmail(userId: string): Promise<string | null> {
  if (!useAppwrite) return null;
  try {
    const { Client, Users } = await import('node-appwrite');
    const client = new Client()
      .setEndpoint(env.APPWRITE_ENDPOINT!)
      .setProject(env.APPWRITE_PROJECT_ID!)
      .setKey(env.APPWRITE_API_KEY!);
    const users = new Users(client);
    const u = await users.get(userId);
    return u?.email ?? null;
  } catch {
    return null;
  }
}

/** Update user prefs verificationStatus so client-side UI doesn't need a separate fetch. */
export async function setUserVerificationPref(userId: string, status: 'pending' | 'approved' | 'rejected' | null) {
  try {
    const { Client, Users } = await import('node-appwrite');
    const client = new Client()
      .setEndpoint(env.APPWRITE_ENDPOINT!)
      .setProject(env.APPWRITE_PROJECT_ID!)
      .setKey(env.APPWRITE_API_KEY!);
    const users = new Users(client);
    const current = await users.get(userId);
    const prefs = { ...(current?.prefs ?? {}), verificationStatus: status ?? '' };
    await users.updatePrefs(userId, prefs);
  } catch (err) {
    console.warn('Could not update user prefs:', err);
  }
}
