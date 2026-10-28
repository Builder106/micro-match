// Request pages from the function adapter-vercel packaged, with the dependencies Vercel traced
// into it. `vite preview` runs a different server against the full node_modules, so it can pass
// while the deployed function fails to start.
//
// It also fails when the server imports a package whose ESM entry is a plain .js file in a
// package without "type": "module". Node only loads those as ESM when its syntax detection
// guesses right, and on Vercel it did not: gsap loaded as CommonJS and every page returned 500.
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const FUNC = resolve('.vercel/output/functions/![-]/catchall.func');
const PAGES = [
  ['/en', 200],
  ['/en/tasks', 200],
  ['/en/impact', 200],
  ['/en/privacy', 200],
  ['/en/login', 200],
  ['/en/not-a-block', 404],
];

const config = JSON.parse(await readFile(join(FUNC, '.vc-config.json'), 'utf8'));
const expected = `nodejs${process.versions.node.split('.')[0]}.x`;
if (config.runtime !== expected) {
  console.error(
    `The function targets ${config.runtime} but this check runs on Node ${process.version}.`,
  );
  process.exit(1);
}
await stat(join(FUNC, config.handler));

async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (path.endsWith('.js')) yield path;
  }
}

const imported = new Set();
for await (const file of files(join(FUNC, '.svelte-kit/output/server'))) {
  for (const [, spec] of (await readFile(file, 'utf8')).matchAll(
    /\bfrom\s*["']([^./"'][^"']*)["']/g,
  )) {
    imported.add(spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);
  }
}
const guessed = [];
for (const name of imported) {
  const pkg = JSON.parse(
    await readFile(join(FUNC, 'node_modules', name, 'package.json'), 'utf8').catch(() => 'null'),
  );
  const root = pkg?.exports?.['.'] ?? pkg?.exports;
  const entry = (typeof root === 'object' ? (root.import ?? root.default) : null) ?? pkg?.module;
  if (pkg && pkg.type !== 'module' && typeof entry === 'string' && entry.endsWith('.js'))
    guessed.push(name);
}
if (guessed.length) {
  console.error(
    `The server imports ${guessed.join(', ')} as ESM from .js files Node must guess the format of. Add them to ssr.noExternal.`,
  );
  process.exit(1);
}

const { default: handler } = await import(pathToFileURL(join(FUNC, config.handler)).href);
let failed = false;
for (const [path, status] of PAGES) {
  const res = await handler.fetch(new Request(`http://localhost${path}`));
  const ok = res.status === status;
  failed ||= !ok;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${res.status} ${path}${ok ? '' : ` (expected ${status})`}`);
}
process.exit(failed ? 1 : 0);
