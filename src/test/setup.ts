import { webcrypto } from "node:crypto";

// jsdom can expose a partial `crypto` (random bytes but no SubtleCrypto), which
// the auth layer needs for password hashing. Ensure a full WebCrypto is present.
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
}
