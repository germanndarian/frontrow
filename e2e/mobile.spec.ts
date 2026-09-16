import { test, expect } from "@playwright/test";

/* /app — the five-tab phone layout, on a phone-sized viewport.

   This is a different shell from /dashboard, with its own welcome screen, its
   own login and its own tab bar, so none of the desktop tests cover it. */

async function guestIntoApp(page: import("@playwright/test").Page) {
  await page.goto("/app");
  await page.getByRole("button", { name: "Look around as a guest" }).click();
  await expect(page.getByText("Pick your sports")).toBeVisible();
  await page.getByRole("button", { name: "Use a sample lineup" }).click();
  await expect(page.getByRole("heading", { name: "Live & Upcoming" })).toBeVisible();
}

test.describe("phone app", () => {
  test("welcomes a first-time visitor with the three ways in", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByRole("button", { name: "Get started free" })).toBeVisible();
    await expect(page.getByRole("button", { name: "I already have an account" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Look around as a guest" })).toBeVisible();
  });

  test("never bounces to the web dashboard", async ({ page }) => {
    // The shell has no Home button and no redirects, so a login lasts until the
    // user ends it — a guest must not end up on /dashboard or /login.
    await guestIntoApp(page);
    await expect(page).toHaveURL(/\/app/);
  });

  test("groups the board into live, upcoming and results", async ({ page }) => {
    await guestIntoApp(page);
    await expect(page.getByText("LIVE NOW", { exact: true })).toBeVisible();
    // "UPCOMING" on its own also matches the "Live & Upcoming" title above it.
    await expect(page.getByText("UPCOMING", { exact: true })).toBeVisible();
  });

  test("moves between all five tabs", async ({ page }) => {
    await guestIntoApp(page);
    // Scoped to the tab bar: the header avatar is also labelled "Settings".
    const tabs = page.getByRole("navigation", { name: "Sections" });
    for (const tab of ["Teams", "Players", "Table", "Settings", "Scores"]) {
      await tabs.getByRole("button", { name: tab, exact: true }).click();
      await expect(tabs.getByRole("button", { name: tab, exact: true })).toBeVisible();
    }
  });

  test("the Settings tab knows it is a guest", async ({ page }) => {
    await guestIntoApp(page);
    const tabs = page.getByRole("navigation", { name: "Sections" });
    await tabs.getByRole("button", { name: "Settings", exact: true }).click();
    await expect(page.getByText("Nothing saves in guest mode")).toBeVisible();
    await expect(page.getByRole("button", { name: "Exit guest mode" })).toBeVisible();
  });

  test("filters the board by league", async ({ page }) => {
    await guestIntoApp(page);
    await page.getByRole("button", { name: "NHL", exact: true }).click();
    await expect(page.getByText("LIVE NOW")).toBeVisible();
    await page.getByRole("button", { name: "All", exact: true }).click();
  });

  test("runs the whole shell with no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await guestIntoApp(page);
    const tabs = page.getByRole("navigation", { name: "Sections" });
    for (const tab of ["Teams", "Players", "Table", "Settings"]) {
      await tabs.getByRole("button", { name: tab, exact: true }).click();
    }
    expect(errors).toEqual([]);
  });
});
