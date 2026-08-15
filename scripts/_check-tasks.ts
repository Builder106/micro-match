import 'dotenv/config';
import { Client, TablesDB, Query } from 'node-appwrite';

async function main() {
  const c = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);
  const t = new TablesDB(c);
  const dbId = process.env.APPWRITE_DB_ID ?? 'micromatch';
  const tasksTable = process.env.APPWRITE_TASKS_TABLE_ID ?? 'tasks';
  interface TaskRowItem {
    $id: string;
    status?: string;
    orgID?: string;
    isVerified?: boolean;
    title?: string;
  }
  const res = await t.listRows(dbId, tasksTable, [Query.limit(20)]);
  const rows = (res.rows ?? []) as unknown as TaskRowItem[];
  console.log(`total=${res.total}, rows=${rows.length}`);
  for (const r of rows.slice(0, 10)) {
    console.log('-', r.$id, '| status=', r.status, '| orgID=', r.orgID, '| isVerified=', r.isVerified, '|', r.title);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
