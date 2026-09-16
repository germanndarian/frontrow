import { test, expect } from "@playwright/test";
import { continueButton, enterAsGuest } from "./helpers";

/* The four-step flow — sports → leagues → teams → players — which is the most
   intricate thing in the app and the one that has actually crashed in the past
   (#42, where the step was an array index instead of a type).

   All four steps stay mounted so the pager can slide between them, so every
   locator here is scoped to what is visible. */

test.describe("onboarding", () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test("walks all four steps and lands on a populated dashboard", async ({ page }) => {
    await expect(page.getByText("STEP 1 / 4")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pick your sports" })).toBeVisible();

    await page.getByRole("button", { name: /^Baseball/ }).filter({ visible: true }).click();
    await page.getByRole("button", { name: /^Hockey/ }).filter({ visible: true }).click();
    await continueButton(page).click();

    await expect(page.getByText("STEP 2 / 4")).toBeVisible();
    // Leagues arrive pre-selected from the sports just chosen.
    await continueButton(page).click();

    await expect(page.getByText("STEP 3 / 4")).toBeVisible();
    await expect(page.getByPlaceholder("Search teams…")).toBeVisible();
    await page.getByRole("button", { name: /Yankees/ }).first().click();
    await continueButton(page).click();

    await expect(page.getByText("STEP 4 / 4")).toBeVisible();
    await expect(page.getByPlaceholder("Search players…")).toBeVisible();
    // Players are optional — the footer says so, and the step can be finished empty.
    await expect(page.getByText("Optional", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Finish setup" }).click();

    // The Done screen draws itself before handing over.
    await page.getByRole("button", { name: "Go to my dashboard" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Live & Upcoming" })).toBeVisible();
  });

  test("won't let you past the first step with nothing chosen", async ({ page }) => {
    await expect(page.getByText("Choose at least one")).toBeVisible();
    await expect(continueButton(page)).toBeDisabled();

    await page.getByRole("button", { name: /^Baseball/ }).filter({ visible: true }).click();
    await expect(continueButton(page)).toBeEnabled();
  });

  test("a pick can be taken back", async ({ page }) => {
    const baseball = page.getByRole("button", { name: /^Baseball/ }).filter({ visible: true });
    await baseball.click();
    await expect(continueButton(page)).toBeEnabled();
    await baseball.click();
    await expect(continueButton(page)).toBeDisabled();
  });

  test("goes back a step without losing what was chosen", async ({ page }) => {
    await page.getByRole("button", { name: /^Baseball/ }).filter({ visible: true }).click();
    await continueButton(page).click();
    await expect(page.getByText("STEP 2 / 4")).toBeVisible();

    await page.getByRole("button", { name: "Back" }).filter({ visible: true }).click();
    await expect(page.getByText("STEP 1 / 4")).toBeVisible();
    // Still chosen, so the step is still passable.
    await expect(continueButton(page)).toBeEnabled();
  });

  test("the team search narrows the list", async ({ page }) => {
    await page.getByRole("button", { name: /^Baseball/ }).filter({ visible: true }).click();
    await continueButton(page).click();
    await continueButton(page).click();
    await expect(page.getByText("STEP 3 / 4")).toBeVisible();

    await page.getByPlaceholder("Search teams…").fill("yank");
    await expect(page.getByRole("button", { name: /Yankees/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Dodgers/ })).toHaveCount(0);
  });

  test("the sample lineup skips the whole thing", async ({ page }) => {
    await page.getByRole("button", { name: "Use a sample lineup" }).click();
    await page.waitForURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: /^Your Teams/ })).toBeVisible();
  });
});
