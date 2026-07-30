// Vitest setup — runs once per worker. Loads jest-dom matchers and
// registers an after-each DOM cleanup so component tests don't leak
// renders into each other.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// Storage shim for JSDOM / happy-dom environments where localStorage isn't fully wired
const memory = new Map<string, string>();

const localStorageShim: Storage = {
  get length() {
    return memory.size;
  },
  key(i: number) {
    return Array.from(memory.keys())[i] ?? null;
  },
  getItem(k: string) {
    return memory.has(k) ? (memory.get(k) as string) : null;
  },
  setItem(k: string, v: string) {
    memory.set(k, String(v));
  },
  removeItem(k: string) {
    memory.delete(k);
  },
  clear() {
    memory.clear();
  },
};

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageShim,
    writable: true,
    configurable: true,
  });
}
if (typeof globalThis !== 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageShim,
    writable: true,
    configurable: true,
  });
}

// Only attach the DOM cleanup when running against jsdom (component tests).
// On node-environment server tests, document/window don't exist.
if (typeof document !== 'undefined') {
  // Lazy-import so the node project doesn't try to resolve @testing-library/svelte.
  const { cleanup } = await import('@testing-library/svelte');
  afterEach(() => cleanup());
}
