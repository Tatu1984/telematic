import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
} from "@/lib/rateLimit";

describe("Rate Limiter", () => {
  describe("getClientIdentifier", () => {
    it("should use user ID when authenticated", () => {
      const request = new Request("https://example.com/api/test");
      const identifier = getClientIdentifier(request, "user-123");
      expect(identifier).toBe("user:user-123");
    });

    it("should use IP from x-forwarded-for header", () => {
      const request = new Request("https://example.com/api/test", {
        headers: {
          "x-forwarded-for": "192.168.1.1, 10.0.0.1",
        },
      });
      const identifier = getClientIdentifier(request);
      expect(identifier).toBe("ip:192.168.1.1");
    });

    it("should fall back to anonymous when no IP available", () => {
      const request = new Request("https://example.com/api/test");
      const identifier = getClientIdentifier(request);
      expect(identifier).toBe("ip:anonymous");
    });
  });

  describe("checkRateLimit", () => {
    beforeEach(() => {
      // Reset rate limiters between tests by using unique identifiers
    });

    it("should allow requests within limit", async () => {
      const uniqueId = `test-user-${Date.now()}`;
      const result = await checkRateLimit(uniqueId, "api");
      expect(result.success).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });

    it("should track remaining requests", async () => {
      const uniqueId = `test-user-remaining-${Date.now()}`;

      const result1 = await checkRateLimit(uniqueId, "api");
      const result2 = await checkRateLimit(uniqueId, "api");

      expect(result2.remaining).toBe(result1.remaining - 1);
    });

    it("should use different limits for auth endpoints", async () => {
      const uniqueId = `test-auth-${Date.now()}`;

      const result = await checkRateLimit(uniqueId, "auth");
      expect(result.success).toBe(true);
      // Auth has a smaller limit (10 vs 100)
      expect(result.remaining).toBeLessThan(10);
    });
  });

  describe("createRateLimitHeaders", () => {
    it("should create headers with remaining and reset time", () => {
      const result = {
        success: true,
        remaining: 50,
        resetTime: Date.now() + 60000,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers.get("X-RateLimit-Remaining")).toBe("50");
      expect(headers.get("X-RateLimit-Reset")).toBeTruthy();
    });

    it("should include Retry-After when rate limited", () => {
      const result = {
        success: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 60,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers.get("Retry-After")).toBe("60");
    });
  });
});
