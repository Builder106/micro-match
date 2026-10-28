// scripts/verify-staging.ts
// Verifies the Appwrite resources configured for Vercel Preview.

import { Client, Query, Storage, Teams, TablesDB } from 'node-appwrite';

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
const verificationsBucket = process.env.APPWRITE_VERIFICATIONS_BUCKET_ID ?? avatarsBucket;
const ngoTeam = process.env.APPWRITE_NGO_TEAM_ID ?? 'ngo';
const volunteerTeam = process.env.APPWRITE_VOLUNTEER_TEAM_ID ?? 'volunteer';
const adminTeam = process.env.APPWRITE_ADMIN_TEAM_ID ?? 'admin';

async function verifyStaging() {
  console.log('--- MicroMatch Staging Verification ---');
  console.log(`Endpoint:   ${endpoint}`);
  console.log(`Project ID: ${projectId ?? '(not set)'}`);

  if (!projectId || !apiKey) {
    console.error('FAIL: APPWRITE_PROJECT_ID and APPWRITE_API_KEY must be set in environment.');
    console.error('Set Preview credentials in the environment before running this check.');
    process.exit(1);
  }

  const expectedQaResources = new Map([
    ['APPWRITE_TASKS_TABLE_ID', 'tasks_qa'],
    ['APPWRITE_CLAIMS_TABLE_ID', 'claims_qa'],
    ['APPWRITE_BADGES_TABLE_ID', 'badges_qa'],
    ['APPWRITE_VERIFICATIONS_TABLE_ID', 'ngoVerifications_qa'],
    ['APPWRITE_BADGE_DEFS_TABLE_ID', 'badgeDefinitions_qa'],
    ['APPWRITE_NGO_TEAM_ID', 'ngo_qa'],
    ['APPWRITE_VOLUNTEER_TEAM_ID', 'volunteer_qa'],
    ['APPWRITE_ADMIN_TEAM_ID', 'admins_qa'],
  ]);
  for (const [name, expected] of expectedQaResources) {
    if (process.env[name] !== expected) {
      console.error(`FAIL: ${name} must be ${expected} for Preview.`);
      process.exit(1);
    }
  }
  if (projectId !== 'micromatch-prod') {
    console.error('FAIL: Preview must use the existing micromatch-prod Appwrite project.');
    process.exit(1);
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

  const tables = new TablesDB(client);
  const storage = new Storage(client);
  const teams = new Teams(client);

  let hasError = false;

  // Row reads prove that the database and tables exist without schema scopes.
  const requiredTables = [tasksTable, claimsTable, badgesTable, verificationsTable, badgeDefsTable];
  for (const tableId of requiredTables) {
    try {
      const queries =
        tableId === tasksTable ? [Query.select(['evergreen']), Query.limit(1)] : [Query.limit(1)];
      const rows = await tables.listRows({ databaseId: dbId, tableId, queries });
      console.log(`✓ Table "${tableId}" is accessible (${rows.total} rows).`);
    } catch (err) {
      console.error(
        `✗ Failed to read table "${tableId}"${tableId === tasksTable ? ' with its evergreen column' : ''}:`,
        err instanceof Error ? err.message : err,
      );
      hasError = true;
    }
  }

  // The verification bucket may also hold avatars when file permissions are private.
  for (const bucketId of new Set([avatarsBucket, verificationsBucket])) {
    try {
      const files = await storage.listFiles({ bucketId, queries: [Query.limit(1)] });
      console.log(`✓ Storage bucket "${bucketId}" is accessible (${files.total} files).`);
    } catch (err) {
      console.error(
        `✗ Failed to access bucket "${bucketId}":`,
        err instanceof Error ? err.message : err,
      );
      hasError = true;
    }
  }
  console.log(
    'Check in Appwrite Console: verification bucket file security is enabled and bucket-wide read permissions are empty.',
  );

  // Verify Teams
  const requiredTeams = [ngoTeam, volunteerTeam, adminTeam];
  for (const teamId of requiredTeams) {
    try {
      const team = await teams.get({ teamId });
      console.log(`✓ Team "${team.name}" (${team.$id}) is accessible.`);
    } catch (err) {
      console.error(
        `✗ Failed to access team "${teamId}":`,
        err instanceof Error ? err.message : err,
      );
      hasError = true;
    }
  }

  if (hasError) {
    console.error('\nFAIL: Staging environment has missing or inaccessible resources.');
    process.exit(1);
  }

  console.log('\nSUCCESS: Configured Preview Appwrite resources are accessible.');
  console.log(
    'Preview uses the dedicated QA table and team IDs. Auth users and storage remain shared.',
  );
}

verifyStaging().catch((err) => {
  console.error('Unexpected error verifying staging:', err);
  process.exit(1);
});
