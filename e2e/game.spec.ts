import { test, expect } from "@playwright/test";
import { dashboardAsGuest } from "./helpers";

/* The game sheet, on the demo evening: two of your games are live — the
   Yankees against the Red Sox and the Oilers against the Panthers — and the
   Yankees play the Red Sox again tomorrow. Scores tick in demo mode, so these
   match a card by who's playing, never by the score. */

test.describe("game sheet", () => {
  test.beforeEach(async ({ page }) => {
    await dashboardAsGuest(page);
  });

  test("opens from a game's card, with the line score", async ({ page }) => {
    await page.getByRole("button", { name: /^Red Sox \d+, Yankees \d+/ }).click();

    const sheet = page.getByRole("dialog");
    await expect(sheet.getByRole("heading", { name: "MLB" })).toBeVisible();
    const lineScore = sheet.getByRole("table", { name: "Line score" });
    await expect(lineScore.getByRole("columnheader", { name: "R" })).toBeVisible();
    await expect(lineScore.getByRole("rowheader", { name: "NYY" })).toBeVisible();
    await expect(sheet.getByText("Yankee Stadium")).toBeVisible();
  });

  test("counts down to a game that hasn't started", async ({ page }) => {
    await page.getByRole("button", { name: /Red Sox at .*Yankees/ }).click();

    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("Starts in")).toBeVisible();
    await expect(sheet.getByRole("timer")).toHaveText(/^\d{2}:\d{2}:\d{2}$/);
  });

  test("the LIVE pill lists the live games, and opens the one you pick", async ({ page }) => {
    await page.getByRole("button", { name: /^2 live$/i }).click();

    const list = page.getByRole("dialog");
    await expect(list.getByRole("heading", { name: "Live now" })).toBeVisible();
    await list.getByRole("button", { name: /^Panthers \d+, Oilers \d+/ }).click();

    await expect(page.getByRole("dialog").getByRole("heading", { name: "NHL" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Live now" })).toHaveCount(0);
  });

  test("puts the open game in the address bar, and takes it out on close", async ({ page }) => {
    await page.getByRole("button", { name: /^Red Sox \d+, Yankees \d+/ }).click();
    await expect(page).toHaveURL(/[?&]game=mlb-1/);

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page).not.toHaveURL(/game=/);
  });

  test("a link to a game opens its sheet", async ({ page }) => {
    // A reload signs a guest out, so arrive at the link the way the app would.
    await page.evaluate(() => window.history.pushState(null, "", "/dashboard?game=nhl-1"));
    await expect(page.getByRole("dialog").getByRole("heading", { name: "NHL" })).toBeVisible();
  });
});
