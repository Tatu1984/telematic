import { test as setup, expect } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  // Go to login page
  await page.goto("/login");

  // Wait for the page to load
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();

  // Fill in login credentials (using demo credentials)
  await page.getByLabel(/email/i).fill("admin@acmetrucking.com");
  await page.getByLabel(/password/i).fill("FleetTrack2024!");

  // Click sign in button
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for navigation to dashboard
  await page.waitForURL("/dashboard", { timeout: 30000 });

  // Verify we're logged in
  await expect(page.getByText(/dashboard/i)).toBeVisible();

  // Save storage state
  await page.context().storageState({ path: authFile });
});
