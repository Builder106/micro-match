// Vitest setup: runs once per worker and installs a localStorage shim.
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

  if (typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
}
if (typeof globalThis !== 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageShim,
    writable: true,
    configurable: true,
  });
}
