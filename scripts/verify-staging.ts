// scripts/verify-staging.ts
// Verifies connectivity, schema tables, buckets, and teams against an isolated
// MicroMatch staging Appwrite project (micromatch-staging).

import { Client, Databases, Storage, Teams, TablesDB } from 'node-appwrite';

const endpoint = process.env.APPWRITE_ENDPOINT ?? 'https://sfo.cloud.appwrite.io/v1';
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

const dbId = process.env.APPWRITE_DB_ID ?? 'micromatch';
const tasksTable = process.env.APPWRITE_TASKS_TABLE_ID ?? 'tasks';
const claimsTable = process.env.APPWRITE_CLAIMS_TABLE_ID ?? 'claims';
const badgesTable = process.env.APPWRITE_BADGES_TABLE_ID ?? 'badges';
const verificationsTable = process.env.APPWRITE_VERIFICATIONS_TABLE_ID ?? 'ngoVerifications';
const badgeDefsTable = process.env.APPWRITE_BADGE_DEFS_TABLE_ID ?? 'badgeDefinitions';
const avatarsBucket = process.env.APPWRITE_AVATARS_BUCKET_ID ?? 'avatars';
const verificationsBucket = process.env.APPWRITE_VERIFICATIONS_BUCKET_ID ?? 'verifications';
const ngoTeam = process.env.APPWRITE_NGO_TEAM_ID ?? 'ngo';
const volunteerTeam = process.env.APPWRITE_VOLUNTEER_TEAM_ID ?? 'volunteer';
const adminTeam = process.env.APPWRITE_ADMIN_TEAM_ID ?? 'admin';

async function verifyStaging() {
  console.log('--- MicroMatch Staging Verification ---');
  console.log(`Endpoint:   ${endpoint}`);
  console.log(`Project ID: ${projectId ?? '(not set)'}`);

  if (!projectId || !apiKey) {
    console.error('FAIL: APPWRITE_PROJECT_ID and APPWRITE_API_KEY must be set in environment.');
    console.error('To test staging: source .env.staging or set variables in CI/CLI.');
    process.exit(1);
  }

  if (projectId === 'micromatch-prod') {
    console.warn('WARNING: APPWRITE_PROJECT_ID is pointing to micromatch-prod. Staging verification should target micromatch-staging.');
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const databases = new Databases(client);
  const tables = new TablesDB(client);
  const storage = new Storage(client);
  const teams = new Teams(client);

  let hasError = false;

  // 1. Verify Database
  try {
    const db = await databases.get(dbId);
    console.log(`✓ Database "${db.name}" (${db.$id}) is accessible.`);
  } catch (err: unknown) {
    console.error(`✗ Failed to access database "${dbId}":`, err instanceof Error ? err.message : err);
    hasError = true;
  }

  // 2. Verify Tables
  const requiredTables = [tasksTable, claimsTable, badgesTable, verificationsTable, badgeDefsTable];
  for (const tableId of requiredTables) {
    try {
      const table = await tables.getTable(dbId, tableId);
      console.log(`✓ Table "${table.name}" (${table.$id}) is accessible.`);
    } catch {
      // Fallback: try querying rows if getTable is not directly supported in the API version
      try {
        const rows = await tables.listRows(dbId, tableId);
        console.log(`✓ Table "${tableId}" is accessible (${rows.total} rows).`);
      } catch (err: unknown) {
        console.error(`✗ Failed to access table "${tableId}":`, err instanceof Error ? err.message : err);
        hasError = true;
      }
    }
  }

  // 3. Verify Storage Buckets
  for (const bucketId of [avatarsBucket, verificationsBucket]) {
    try {
      const bucket = await storage.getBucket(bucketId);
      console.log(`✓ Storage bucket "${bucket.name}" (${bucket.$id}) is accessible.`);
    } catch (err: unknown) {
      console.error(`✗ Failed to access bucket "${bucketId}":`, err instanceof Error ? err.message : err);
      hasError = true;
    }
  }

  // 4. Verify Teams
  const requiredTeams = [ngoTeam, volunteerTeam, adminTeam];
  for (const teamId of requiredTeams) {
    try {
      const team = await teams.get(teamId);
      console.log(`✓ Team "${team.name}" (${team.$id}) is accessible.`);
    } catch (err: unknown) {
      console.error(`✗ Failed to access team "${teamId}":`, err instanceof Error ? err.message : err);
      hasError = true;
    }
  }

  if (hasError) {
    console.error('\nFAIL: Staging environment has missing or inaccessible resources.');
    process.exit(1);
  }

  console.log('\nSUCCESS: Staging Appwrite project is fully configured and ready.');
}

verifyStaging().catch((err) => {
  console.error('Unexpected error verifying staging:', err);
  process.exit(1);
});
