import { webcrypto } from "node:crypto";

// jsdom can expose a partial `crypto` (random bytes but no SubtleCrypto), which
// the auth layer needs for password hashing. Ensure a full WebCrypto is present.
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
}

// Node 25+ has a `localStorage` of its own, left undefined unless Node starts
// with --localstorage-file, and it hides jsdom's. Give the tests a working one
// either way; CI's Node 22 has jsdom's and never reaches this.
if (typeof globalThis.localStorage === "undefined") {
  const items = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => {
      items.delete(key);
    },
    setItem: (key, value) => {
      items.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
}
