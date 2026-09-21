import { test, expect } from "@playwright/test";
import { dashboardAsGuest } from "./helpers";

/* Pins, on the demo evening. In the MLB view tomorrow's Yankees game leads the
   upcoming row, because it's yours — until tonight's Cubs game is pinned. */

async function pinTheCubsGame(page: import("@playwright/test").Page) {
  await page.getByRole("tab", { name: "MLB" }).click();
  await page.getByRole("region", { name: "Upcoming" }).getByRole("button", { name: /^Cubs at Brewers/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Pin to top" }).click();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Unpin" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

test.describe("pins", () => {
  test.beforeEach(async ({ page }) => {
    await dashboardAsGuest(page);
  });

  test("lifts a game to the front of its row in its league, and nowhere else", async ({ page }) => {
    await page.getByRole("tab", { name: "MLB" }).click();
    const upcoming = page.getByRole("region", { name: "Upcoming" });
    await expect(upcoming.getByRole("button").first()).toHaveAccessibleName(/^Red Sox at Yankees/);

    await pinTheCubsGame(page);
    await expect(upcoming.getByRole("button").first()).toHaveAccessibleName(/^Cubs at Brewers/);
    await expect(upcoming.getByLabel("Pinned")).toHaveCount(1);

    // Under All the list is already yours: a pin neither marks nor moves.
    await page.getByRole("tab", { name: "All" }).click();
    await expect(page.getByLabel("Pinned")).toHaveCount(0);
  });

  test("keeps a pin in the browser across a reload", async ({ page }) => {
    await pinTheCubsGame(page);

    // A reload signs a guest out; back in, the pin is still there.
    await page.reload();
    await dashboardAsGuest(page);
    await page.getByRole("tab", { name: "MLB" }).click();
    await expect(
      page.getByRole("region", { name: "Upcoming" }).getByRole("button").first(),
    ).toHaveAccessibleName(/^Cubs at Brewers/);
  });
});
