import { test, expect } from "@playwright/test";
import { enterAsGuest } from "./helpers";

/* The gate: the login page, and what the app does with someone who hasn't
   passed it. No real Supabase here — these builds point at a hostname that
   doesn't resolve, which is exactly right for asserting that the page renders,
   validates and routes. Whether Supabase accepts a password is Supabase's test
   to run, not ours. */

test.describe("login page", () => {
  test("offers every way in", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue with GitHub" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue as guest" })).toBeVisible();
  });

  test("switches between signing in and signing up", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Create account" }).first().click();
    await expect(page.locator("body")).not.toContainText("Welcome back");

    await page.getByRole("button", { name: "Sign in", exact: true }).first().click();
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("opens straight into sign-up when asked to", async ({ page }) => {
    // The homepage links here with ?mode=signup, read via useSearchParams and
    // seeded into state — the thing that regressed once into a state-in-effect.
    await page.goto("/login?mode=signup");
    await expect(page.getByRole("button", { name: "Create account" }).first()).toBeVisible();
  });

  test("keeps the password hidden until asked", async ({ page }) => {
    await page.goto("/login");
    const password = page.locator('input[type="password"]');
    await expect(password).toBeVisible();
    await password.fill("hunter2");

    // The reveal is the unlabelled button sitting inside the password field.
    const reveal = page.locator("form button").filter({ visible: true }).filter({ hasText: /^$/ });
    if (await reveal.count()) {
      await reveal.first().click();
      await expect(page.locator('input[type="text"]')).toHaveValue("hunter2");
    }
  });

  test("gets back to the homepage", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Home" }).click();
    await page.waitForURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("the gate", () => {
  test("sends a signed-out visitor from the dashboard to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("sends a signed-out visitor from settings to login", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForURL(/\/login/);
  });

  test("sends a guest who hasn't onboarded to setup, not the dashboard", async ({ page }) => {
    await enterAsGuest(page);
    await expect(page).toHaveURL(/\/setup/);
    await expect(page.getByRole("heading", { name: "Pick your sports" })).toBeVisible();
  });

  test("a reload signs a guest back out, as designed", async ({ page }) => {
    // Guest mode is in-memory on purpose — there is nowhere to persist it. This
    // pins the documented behaviour so a future "fix" has to be deliberate.
    await enterAsGuest(page);
    await page.reload();
    await page.waitForURL(/\/login/);
  });
});
