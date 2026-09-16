import { defineConfig, devices } from "@playwright/test";

/* Browser tests.

   Two suites, and the split is the point.

   `app` drives the real app in a real browser against the bundled demo
   dataset (`NEXT_PUBLIC_USE_MOCK=true`), so it never touches ESPN or
   Supabase. That makes it deterministic enough to block a merge: a red run
   means our code broke, not that a sports API had a bad afternoon.

   `upstream` is the opposite trade — it calls ESPN for real, to catch the
   day their API changes under us. It is deliberately NOT part of the merge
   gate, because a third party's outage must not stop a release. It runs on a
   schedule instead (.github/workflows/upstream.yml), where a failure is a
   warning that the contract moved.

   The mock build is a separate `distDir` so running these never clobbers the
   production build sitting in `.next`. */

const PORT = Number(process.env.E2E_PORT ?? 3100);
const HOST = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // A failing assertion should read as one broken thing, not a cascade.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  // The app polls only while a game is live, and the demo dataset has live
  // games — so give assertions room without making a hung page take minutes.
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: HOST,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "app",
      testIgnore: [/upstream\.spec\.ts/, /mobile\.spec\.ts/],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // The phone surfaces (/app, the tab bar, the sheets) only lay out below
      // the mobile breakpoint, so they get a phone-sized project of their own.
      name: "mobile",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["iPhone 15"] },
    },
    {
      name: "upstream",
      testMatch: /upstream\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run e2e:server",
    url: HOST,
    reuseExistingServer: !process.env.CI,
    // A cold Next build is the slow part, and CI has no warm cache.
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
