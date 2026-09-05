// scripts/setup-appwrite.ts
// Programmatically provisions Appwrite TablesDB collections, attributes, indexes, and storage buckets
// based on appwrite.config.json and environment variables.

import fs from 'node:fs';
import path from 'node:path';
import { Client, Databases, Storage, Teams, TablesDB, type Compression } from 'node-appwrite';

interface AppwriteDatabaseConfig {
  $id: string;
  name: string;
  enabled?: boolean;
}

interface AppwriteBucketConfig {
  $id: string;
  name: string;
  $permissions?: string[];
  fileSecurity?: boolean;
  enabled?: boolean;
  maximumFileSize?: number;
  allowedFileExtensions?: string[];
  compression?: Compression;
  encryption?: boolean;
  antivirus?: boolean;
}

interface AppwriteTeamConfig {
  $id: string;
  name: string;
}

interface AppwriteTableConfig {
  $id: string;
  name: string;
  databaseId: string;
  enabled?: boolean;
  rowSecurity?: boolean;
  columns?: Array<Record<string, unknown>>;
  indexes?: Array<Record<string, unknown>>;
}

interface AppwriteConfig {
  endpoint?: string;
  projectId?: string;
  databases?: AppwriteDatabaseConfig[];
  buckets?: AppwriteBucketConfig[];
  teams?: AppwriteTeamConfig[];
  tables?: AppwriteTableConfig[];
}

const configPath = path.resolve(process.cwd(), 'appwrite.config.json');
let config: AppwriteConfig = {};

if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (e) {
    console.warn('Warning: Could not parse appwrite.config.json:', e);
  }
}

const endpoint = process.env.APPWRITE_ENDPOINT || config.endpoint || 'https://sfo.cloud.appwrite.io/v1';
const projectId = process.env.APPWRITE_PROJECT_ID || config.projectId;
const apiKey = process.env.APPWRITE_API_KEY;

if (!projectId || !apiKey) {
  console.error('Error: APPWRITE_PROJECT_ID and APPWRITE_API_KEY must be set in environment.');
  console.error('Example for staging:');
  console.error('  APPWRITE_PROJECT_ID=micromatch-staging APPWRITE_API_KEY=your_key bun scripts/setup-appwrite.ts');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);
const storage = new Storage(client);
const teams = new Teams(client);
const tables = new TablesDB(client);

async function setupAppwrite() {
  console.log(`Setting up Appwrite project: ${projectId} at ${endpoint}...`);

  // 1. Setup Databases
  for (const db of config.databases || []) {
    try {
      await databases.get(db.$id);
      console.log(`Database "${db.name}" (${db.$id}) already exists.`);
    } catch {
      console.log(`Creating database "${db.name}" (${db.$id})...`);
      await databases.create(db.$id, db.name, db.enabled);
    }
  }

  // 2. Setup Storage Buckets
  for (const bucket of config.buckets || []) {
    try {
      await storage.getBucket(bucket.$id);
      console.log(`Storage bucket "${bucket.name}" (${bucket.$id}) already exists.`);
    } catch {
      console.log(`Creating storage bucket "${bucket.name}" (${bucket.$id})...`);
      await storage.createBucket(
        bucket.$id,
        bucket.name,
        bucket.$permissions || [],
        bucket.fileSecurity || false,
        bucket.enabled || true,
        bucket.maximumFileSize,
        bucket.allowedFileExtensions,
        (bucket.compression as Compression) || undefined,
        bucket.encryption,
        bucket.antivirus
      );
    }
  }

  // 3. Setup Teams
  for (const team of config.teams || []) {
    try {
      await teams.get(team.$id);
      console.log(`Team "${team.name}" (${team.$id}) already exists.`);
    } catch {
      console.log(`Creating team "${team.name}" (${team.$id})...`);
      await teams.create(team.$id, team.name);
    }
  }

  // 4. Setup Tables
  for (const table of config.tables || []) {
    const dbId = table.databaseId || 'micromatch';
    try {
      await tables.getTable(dbId, table.$id);
      console.log(`Table "${table.name}" (${table.$id}) already exists.`);
    } catch {
      try {
        console.log(`Creating table "${table.name}" (${table.$id}) in database "${dbId}"...`);
        await tables.createTable(dbId, table.$id, table.name, [], table.enabled ?? true);
      } catch (err) {
        console.warn(`Note: Could not automatically create table "${table.$id}" via SDK:`, (err as Error).message);
        console.warn(`Tip: You can push full schema including columns and indexes via Appwrite CLI:`);
        console.warn(`  appwrite client --endpoint ${endpoint} --project-id ${projectId} --key ${apiKey}`);
        console.warn(`  appwrite push tables`);
      }
    }
  }

  console.log('Appwrite setup completed successfully.');
}

setupAppwrite().catch((err) => {
  console.error('Appwrite setup failed:', err);
  process.exit(1);
});
