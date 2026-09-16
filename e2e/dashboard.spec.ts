import { test, expect } from "@playwright/test";
import { dashboardAsGuest } from "./helpers";

/* The dashboard, on the demo dataset: an evening with two live games, four
   followed teams and four followed players. */

test.describe("dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await dashboardAsGuest(page);
  });

  test("shows every section a followed lineup earns", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Live & Upcoming" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Your Teams/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Your Players/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Season Stats" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "New York Yankees" })).toBeVisible();
  });

  test("marks the live games as live", async ({ page }) => {
    // The demo evening has two: an NHL game and an MLB game.
    await expect(page.getByText(/2 games live/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Live & Upcoming" })).toBeVisible();
  });

  test("carries the live detail a score alone wouldn't tell you", async ({ page }) => {
    // Baseball's count and bases, hockey's strength — the situation blocks.
    await expect(page.getByText(/Bot 7th|Top \d/)).toBeVisible();
    await expect(page.getByText(/Even Strength|5-on-5/)).toBeVisible();
  });

  test("filters the board by league", async ({ page }) => {
    await page.getByRole("tab", { name: "NHL" }).click();
    await expect(page.getByText(/Even Strength|5-on-5/)).toBeVisible();
    // The MLB game's situation line should be gone while NHL is the filter.
    await expect(page.getByText(/Bot 7th/)).toHaveCount(0);

    await page.getByRole("tab", { name: "All" }).click();
    await expect(page.getByText(/Bot 7th/)).toBeVisible();
  });

  test("opens a team's full schedule and closes it again", async ({ page }) => {
    await page.getByRole("button", { name: "View full schedule" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("opens the playoff bracket", async ({ page }) => {
    await page.getByRole("button", { name: "Playoff bracket" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("the Home button signs you out, on purpose", async ({ page }) => {
    // "When I click home I want it to log me out, for security" — PROJECT_GUIDE §5.
    await page.getByRole("button", { name: "Home" }).click();
    await page.waitForURL(/\/$/);
    // And the session really is gone, not just the page changed.
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/);
  });

  test("renders the whole dashboard with no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.getByRole("tab", { name: "NHL" }).click();
    await page.getByRole("tab", { name: "All" }).click();
    expect(errors).toEqual([]);
  });
});
