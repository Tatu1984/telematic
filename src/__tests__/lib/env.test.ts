import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Environment Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should validate required DATABASE_URL", async () => {
    process.env.DATABASE_URL = "file:./test.db";
    process.env.AUTH_SECRET = "test-secret-key-that-is-at-least-32-characters";
    process.env.NODE_ENV = "test";

    const { getEnv } = await import("@/lib/env");
    const env = getEnv();

    expect(env.DATABASE_URL).toBe("file:./test.db");
  });

  it("should validate AUTH_SECRET minimum length", async () => {
    process.env.DATABASE_URL = "file:./test.db";
    process.env.AUTH_SECRET = "short"; // Too short
    process.env.NODE_ENV = "test";

    // Re-import to get fresh validation
    vi.resetModules();
    const { getEnv } = await import("@/lib/env");

    expect(() => getEnv()).toThrow("Invalid environment configuration");
  });

  it("should use default values for optional fields", async () => {
    process.env.DATABASE_URL = "file:./test.db";
    process.env.AUTH_SECRET = "test-secret-key-that-is-at-least-32-characters";
    process.env.NODE_ENV = "development";

    vi.resetModules();
    const { getEnv } = await import("@/lib/env");
    const env = getEnv();

    expect(env.RATE_LIMIT_MAX).toBe(100);
    expect(env.RATE_LIMIT_WINDOW_MS).toBe(60000);
    expect(env.LOG_LEVEL).toBe("info");
  });

  it("should validate NODE_ENV enum values", async () => {
    process.env.DATABASE_URL = "file:./test.db";
    process.env.AUTH_SECRET = "test-secret-key-that-is-at-least-32-characters";
    process.env.NODE_ENV = "production";

    vi.resetModules();
    const { isProduction, isDevelopment, isTest } = await import("@/lib/env");

    expect(isProduction()).toBe(true);
    expect(isDevelopment()).toBe(false);
    expect(isTest()).toBe(false);
  });
});
