import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("should display main dashboard with stats", async ({ page }) => {
    await page.goto("/dashboard");

    // Check for main heading
    await expect(page.getByRole("heading", { name: /fleet overview/i })).toBeVisible();

    // Check for stat cards
    await expect(page.getByText(/total vehicles/i)).toBeVisible();
    await expect(page.getByText(/active drivers/i)).toBeVisible();
  });

  test("should navigate to vehicles page", async ({ page }) => {
    await page.goto("/dashboard");

    // Click on vehicles in sidebar
    await page.getByRole("link", { name: /vehicles/i }).click();

    // Check we're on vehicles page
    await expect(page).toHaveURL(/\/vehicles/);
    await expect(page.getByRole("heading", { name: /vehicles/i })).toBeVisible();
  });

  test("should navigate to drivers page", async ({ page }) => {
    await page.goto("/dashboard");

    // Click on drivers in sidebar
    await page.getByRole("link", { name: /drivers/i }).click();

    // Check we're on drivers page
    await expect(page).toHaveURL(/\/drivers/);
    await expect(page.getByRole("heading", { name: /drivers/i })).toBeVisible();
  });

  test("should navigate to tracking page", async ({ page }) => {
    await page.goto("/dashboard");

    // Click on tracking in sidebar
    await page.getByRole("link", { name: /tracking/i }).click();

    // Check we're on tracking page
    await expect(page).toHaveURL(/\/tracking/);
  });
});
