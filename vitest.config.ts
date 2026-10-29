import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Stands in for SvelteKit's $app/env/* modules: one named export per variable declared in
// src/env.ts, read from process.env, so unmocked tests can import them.
const envModules = new Map<string, boolean>([
  ['$app/env/private', false],
  ['$app/env/public', true],
]);
const appEnv = {
  name: 'app-env-stub',
  resolveId: (id: string) => (envModules.has(id) ? `\0${id}` : undefined),
  load(id: string) {
    const scoped = envModules.get(id.slice(1));
    if (scoped === undefined) return undefined;
    const source = readFileSync(new URL('./src/env.ts', import.meta.url), 'utf8');
    const names = [...source.matchAll(/^\s+(\w+): \{(.*)\},?$/gm)]
      .filter(([, , options]) => options.includes('public: true') === scoped)
      .map(([, name]) => name);
    return names.map((name) => `export const ${name} = process.env.${name} ?? '';`).join('\n');
  },
};

export default defineConfig({
  plugins: [appEnv],
  resolve: {
    alias: {
      $engine: fileURLToPath(new URL('./src/engine', import.meta.url)),
    },
  },
  test: {
    fileParallelism: false,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,js}'],
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.ts', 'src/routes/**/*.server.ts', 'src/routes/**/+server.ts'],
      exclude: [
        'src/lib/**/*.d.ts',
        'src/lib/types.ts',
        'src/lib/**/index.ts',
        'src/routes/**/*.d.ts',
        'src/lib/paraglide/**',
      ],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
});
