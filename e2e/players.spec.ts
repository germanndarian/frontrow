import { test, expect } from "@playwright/test";
import { dashboardAsGuest } from "./helpers";

/* Your Players on the demo lineup: Judge under the Yankees, McDavid under the
   Oilers, Hurts under the Eagles and Manning under Texas. */

test.describe("players", () => {
  test.beforeEach(async ({ page }) => {
    await dashboardAsGuest(page);
  });

  test("sit under their team, and a team's players fold away", async ({ page }) => {
    const yankees = page.getByRole("button", { name: /New York Yankees/, expanded: true });
    await expect(page.getByRole("button", { name: "Open Aaron Judge" })).toBeVisible();

    await yankees.click();
    await expect(page.getByRole("button", { name: "Open Aaron Judge" })).toHaveCount(0);
    // Folded, the rule still says how many are behind it.
    await expect(page.getByRole("button", { name: /New York Yankees/, expanded: false })).toContainText("NYY · 1");
    // The other teams' players stay where they are.
    await expect(page.getByRole("button", { name: "Open Connor McDavid" })).toBeVisible();

    await page.getByRole("button", { name: /New York Yankees/, expanded: false }).click();
    await expect(page.getByRole("button", { name: "Open Aaron Judge" })).toBeVisible();
  });

  test("the whole card opens the player, profile and all", async ({ page }) => {
    await page.getByRole("button", { name: "Open Aaron Judge" }).click();

    const sheet = page.getByRole("dialog");
    await expect(sheet.getByRole("heading", { name: "Aaron Judge" })).toBeVisible();
    await expect(sheet.getByText("Home Runs")).toBeVisible();
    await expect(sheet.getByText("Profile")).toBeVisible();
    await expect(sheet.getByText("Fresno State")).toBeVisible();
    await expect(sheet.getByText("Right/Right")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
