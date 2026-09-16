import { expect, type Page } from "@playwright/test";

/* Shared moves for the browser tests.

   Everything goes through the UI the way a person would. Nothing reaches into
   a store or seeds localStorage: a test that builds its own state by hand
   stops telling you whether the real path still works.

   Two things about this app shape every test here.

   Guest mode is in-memory by design — `continueAsGuest` sets status on a
   Zustand store and there is nowhere to persist it. A full page load therefore
   signs you back out, so once past the gate a test must navigate the way the
   app does, by clicking, and never with `page.goto`. A `goto` to /settings
   lands on /login, which looks like a broken test and is really the app
   working as documented.

   The onboarding pager keeps all four steps mounted so it can slide between
   them, so a bare `getByRole("button", { name: "Continue" })` can match a
   control on a step nobody is looking at. `visible: true` is what keeps a
   click on the step actually on screen. */

/** Past the auth gate as a guest. Lands on /setup — a fresh guest follows nothing. */
export async function enterAsGuest(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as guest" }).click();
  await page.waitForURL(/\/setup/);
}

/** The whole gate in one move: guest, then the demo lineup, landing on a
    dashboard with teams, players and live games on it. Used by every test whose
    subject is something *after* onboarding. */
export async function dashboardAsGuest(page: Page) {
  await enterAsGuest(page);
  await page.getByRole("button", { name: "Use a sample lineup" }).click();
  await page.waitForURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Live & Upcoming" })).toBeVisible();
}

/** The footer's primary action on the step currently on screen. */
export function continueButton(page: Page) {
  return page.getByRole("button", { name: "Continue", exact: true }).filter({ visible: true });
}

/** The avatar button at the top right. It carries an explicit aria-label, so
    this is a real accessibility assertion as much as a way in. */
export async function openAccountMenu(page: Page) {
  await page.getByRole("button", { name: "Account menu" }).click();
  await expect(page.getByRole("menu")).toBeVisible();
}

/** Settings, reached the only way that keeps a guest signed in: the in-app
    link. A `goto` here would reload the page and sign the guest out. */
export async function openSettings(page: Page) {
  await openAccountMenu(page);
  await page.getByRole("menuitem", { name: "Settings" }).click();
  await page.waitForURL(/\/settings/);
}

/** What `applySettings()` wrote onto <html>. The whole theming system funnels
    through these attributes, so they are what a theme assertion should read. */
export function appearance(page: Page) {
  return page.locator("html").getAttribute("data-appearance");
}
