import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';

type Metadata = { target: string; route: string; locale: string; browser: string; os: string; commit: string; run: string; theme: string; viewport: string; state: string; fixtureVersion: string; artifactPath: string; worker: number; shard: string; fixtureNamespace: string; retry?: number };

async function files(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? files(file) : Promise.resolve(file);
  }))).flat();
}

const input = process.argv[2] ?? 'test-results';
const output = process.argv[3] ?? 'audit-output/audit-manifest.json';
const metadataFiles = (await files(input)).filter((file) => file.endsWith('.metadata.json'));
const records = (await Promise.all(metadataFiles.map(async (file) => JSON.parse(await readFile(file, 'utf8')) as Metadata))).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
const keys = records.map((record) => `${record.run}|${record.browser}|${record.shard}|${record.worker}|${record.locale}|${record.theme}|${record.viewport}|${record.target}|${record.state}|${record.retry ?? 0}`);
if (new Set(keys).size !== keys.length) throw new Error('Duplicate accessibility metadata records detected.');
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(records, null, 2)}\n`);
