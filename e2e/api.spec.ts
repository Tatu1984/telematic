import { test, expect } from "@playwright/test";

test.describe("API Routes", () => {
  test("health check should return OK", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe("healthy");
  });

  test("should require authentication for protected routes", async ({
    request,
  }) => {
    // Try to access protected route without auth
    const response = await request.get("/api/vehicles", {
      headers: {
        // No auth headers
      },
    });

    expect(response.status()).toBe(401);
  });

  test("should return vehicles for authenticated users", async ({ request }) => {
    const response = await request.get("/api/vehicles");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("pagination");
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test("should return drivers for authenticated users", async ({ request }) => {
    const response = await request.get("/api/drivers");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("pagination");
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test("should return alerts for authenticated users", async ({ request }) => {
    const response = await request.get("/api/alerts");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("pagination");
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test("should return incidents for authenticated users", async ({
    request,
  }) => {
    const response = await request.get("/api/incidents");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("pagination");
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test("should validate query parameters", async ({ request }) => {
    // Test with invalid limit parameter
    const response = await request.get("/api/alerts?limit=999");

    // Should return 400 for invalid limit (max is 100)
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  test("should respect pagination", async ({ request }) => {
    const response = await request.get("/api/alerts?limit=5&offset=0");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.pagination.limit).toBe(5);
    expect(data.pagination.offset).toBe(0);
  });
});
