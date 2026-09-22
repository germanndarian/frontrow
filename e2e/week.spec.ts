import { test, expect } from "@playwright/test";
import { dashboardAsGuest } from "./helpers";

/* Live & Upcoming, a week at a time, on the demo evening — Friday 5 June 2026 —
   in a US locale, so the week runs Sunday 31 May to Saturday 6 June. Your teams
   are the Yankees and the Oilers (the football teams are off-season in June):
   both live tonight, the Yankees again tomorrow, and a week of results. */

test.describe("scores by week", () => {
  test.beforeEach(async ({ page }) => {
    await dashboardAsGuest(page);
  });

  test("rows up this week: live, upcoming and results", async ({ page }) => {
    await expect(page.getByText("This week · May 31 – Jun 6")).toBeVisible();
    await expect(page.getByText("LIVE NOW · 2", { exact: true })).toBeVisible();
    await expect(page.getByText("UPCOMING · 1", { exact: true })).toBeVisible();
    await expect(page.getByText("RESULTS · 5", { exact: true })).toBeVisible();
  });

  test("pages to next week and back to last week", async ({ page }) => {
    await page.getByRole("tab", { name: "Next week" }).click();
    await expect(page.getByText("UPCOMING · 1", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Oilers at Panthers/ })).toBeVisible();

    await page.getByRole("tab", { name: "Last week" }).click();
    await expect(page.getByText("RESULTS · 2", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Angels \d+, Yankees \d+/ })).toBeVisible();
  });

  test("says so when your teams have a week off", async ({ page }) => {
    await page.getByRole("tab", { name: "Jun 14" }).click();
    await expect(page.getByText("None of your teams play")).toBeVisible();
  });

  test("shows a league in full once it's picked, your games first and counted", async ({ page }) => {
    // Under All every game is yours, so nothing is marked.
    await expect(page.getByLabel("Your team")).toHaveCount(0);

    await page.getByRole("tab", { name: "MLB" }).click();
    await expect(page.getByText("LIVE NOW · 2 · 1 yours", { exact: true })).toBeVisible();
    await expect(page.getByText("UPCOMING · 2 · 1 yours", { exact: true })).toBeVisible();

    // Tomorrow's Yankees game jumps tonight's Cubs game, because it's yours.
    const upcoming = page.getByRole("region", { name: "Upcoming" });
    await expect(upcoming.getByRole("button").first()).toHaveAccessibleName(/^Red Sox at Yankees/);
    await expect(upcoming.getByLabel("Your team")).toHaveCount(1);
  });
});
