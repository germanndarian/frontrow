import { test, expect } from "@playwright/test";
import { dashboardAsGuest, openSettings } from "./helpers";

/* What you follow, in Settings, on the demo lineup: four leagues — two of them
   football's — four teams and four players. */

test.describe("what you follow", () => {
  test.beforeEach(async ({ page }) => {
    await dashboardAsGuest(page);
    await openSettings(page);
  });

  test("previews three teams and three players, and lists the rest", async ({ page }) => {
    await expect(page.getByText("4 leagues · 4 teams · 4 players")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Unfollow / })).toHaveCount(6);

    await page.getByRole("button", { name: /^View all 8/ }).click();
    const list = page.getByRole("dialog");
    await expect(list.getByRole("heading", { name: "What you follow" })).toBeVisible();
    await expect(list.getByRole("region", { name: "Teams" }).getByRole("button", { name: /^Unfollow / })).toHaveCount(4);
    await expect(list.getByRole("region", { name: "Players" }).getByRole("button", { name: /^Unfollow / })).toHaveCount(4);
  });

  test("drops a follow from the preview", async ({ page }) => {
    await page.getByRole("button", { name: "Unfollow New York Yankees" }).click();
    await expect(page.getByText("4 leagues · 3 teams · 4 players")).toBeVisible();
  });

  test("edits everything behind one button, with Leagues only while football is followed", async ({ page }) => {
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    const editor = page.getByRole("dialog");
    const tabs = editor.getByRole("tablist", { name: "What to edit" });
    await expect(tabs.getByRole("tab")).toHaveText(["Sports", "Leagues", "Teams", "Players"]);

    // Leagues is open when football goes, and the editor lands back on Sports.
    await tabs.getByRole("tab", { name: "Leagues" }).click();
    await tabs.getByRole("tab", { name: "Sports" }).click();
    await editor.getByRole("button", { name: /^Football/ }).click();
    await expect(tabs.getByRole("tab")).toHaveText(["Sports", "Teams", "Players"]);

    // Adding it back follows both its leagues along with it.
    await editor.getByRole("button", { name: /^Football/ }).click();
    await tabs.getByRole("tab", { name: "Leagues" }).click();
    await expect(editor.getByRole("button", { name: /National Football League/, pressed: true })).toBeVisible();
    await expect(editor.getByRole("button", { name: /College Football/, pressed: true })).toBeVisible();
  });
});
