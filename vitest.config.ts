import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Lightweight unit-test setup: jsdom for the browser globals the zustand
// stores expect (localStorage), plus the "@/" path alias the app uses.
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
