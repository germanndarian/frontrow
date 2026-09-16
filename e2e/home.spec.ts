import { test, expect } from "@playwright/test";

/* The marketing homepage — the one surface a signed-out stranger sees. */

test.describe("homepage", () => {
  test("leads with the pitch and the leagues it covers", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Front row seat");
    // Soccer was deliberately dropped; the covered leagues are the five here.
    await expect(page.getByText(/NFL/).first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/Premier League|EPL/i);
  });

  test("both calls to action reach the right side of the login page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Get started free" }).first().click();
    await page.waitForURL(/\/login/);
    // "Get started" means sign-up, which the login page opens on via ?mode=signup.
    await expect(page.getByRole("button", { name: "Create account" }).first()).toBeVisible();

    await page.goto("/");
    await page.getByRole("link", { name: "Log in", exact: true }).click();
    await page.waitForURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("never offers a way into the dashboard", async ({ page }) => {
    await page.goto("/");
    // Deliberate: the nav link was removed so the homepage can't hand a shared
    // screen to someone else's account (see PROJECT_GUIDE §5).
    const nav = page.locator("header").first();
    await expect(nav.getByRole("link", { name: /dashboard/i })).toHaveCount(0);
  });

  test("renders with no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/", { waitUntil: "networkidle" });
    expect(errors).toEqual([]);
  });
});
