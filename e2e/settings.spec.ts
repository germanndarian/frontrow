import { test, expect } from "@playwright/test";
import { appearance, dashboardAsGuest, openAccountMenu, openSettings } from "./helpers";

/* Settings, and the theming system it drives.

   Almost the whole look of this app is semantic OKLCH tokens, and
   `applySettings()` switches them by writing `data-*` onto <html>. That
   attribute is therefore the honest thing to assert: if it flips, every
   surface flipped with it. Asserting a rendered colour instead would pin one
   component's class list and tell you nothing about the rest. */

test.describe("account menu", () => {
  test.beforeEach(async ({ page }) => {
    await dashboardAsGuest(page);
  });

  test("says who you are, and for a guest that you are one", async ({ page }) => {
    await openAccountMenu(page);
    const menu = page.getByRole("menu");
    await expect(menu.getByText("Guest", { exact: true })).toBeVisible();
    await expect(menu.getByText("Browsing without an account")).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Create an account" })).toBeVisible();
  });

  test("closes on Escape", async ({ page }) => {
    await openAccountMenu(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
  });

  test("closes on a click outside it", async ({ page }) => {
    await openAccountMenu(page);
    await page.locator("body").click({ position: { x: 5, y: 400 } });
    await expect(page.getByRole("menu")).toHaveCount(0);
  });
});

test.describe("settings", () => {
  test.beforeEach(async ({ page }) => {
    await dashboardAsGuest(page);
    await openSettings(page);
  });

  test("opens without signing the guest out", async ({ page }) => {
    // The trap this guards: reaching settings with a page load instead of the
    // in-app link drops the in-memory guest session and bounces to /login.
    await expect(page).toHaveURL(/\/settings/);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("switches the whole app between light and dark", async ({ page }) => {
    expect(await appearance(page)).toBe("light");

    await page.getByRole("button", { name: /^Dark$/ }).first().click();
    await expect.poll(() => appearance(page)).toBe("dark");

    await page.getByRole("button", { name: /^Light$/ }).first().click();
    await expect.poll(() => appearance(page)).toBe("light");
  });

  test("keeps the theme when you go back to the dashboard", async ({ page }) => {
    await page.getByRole("button", { name: /^Dark$/ }).first().click();
    await expect.poll(() => appearance(page)).toBe("dark");

    await page.goBack();
    await page.waitForURL(/\/dashboard/);
    // Settings live in the same in-memory store the dashboard reads.
    await expect.poll(() => appearance(page)).toBe("dark");
  });

  test("renders with no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.getByRole("button", { name: /^Dark$/ }).first().click();
    expect(errors).toEqual([]);
  });
});
