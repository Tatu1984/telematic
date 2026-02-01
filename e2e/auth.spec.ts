import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // Don't use saved auth state

  test("should show login page for unauthenticated users", async ({ page }) => {
    await page.goto("/dashboard");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill in invalid credentials
    await page.getByLabel(/email/i).fill("invalid@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");

    // Click sign in
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("should login successfully with valid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill in valid credentials
    await page.getByLabel(/email/i).fill("admin@acmetrucking.com");
    await page.getByLabel(/password/i).fill("FleetTrack2024!");

    // Click sign in
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should redirect to dashboard
    await page.waitForURL("/dashboard", { timeout: 30000 });
    await expect(page.getByRole("heading", { name: /fleet overview/i })).toBeVisible();
  });

  test("should require email and password", async ({ page }) => {
    await page.goto("/login");

    // Try to submit empty form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should show validation or stay on login page
    await expect(page).toHaveURL(/\/login/);
  });
});
