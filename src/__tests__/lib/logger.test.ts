import { describe, it, expect, vi, beforeEach } from "vitest";
import { createLogger, createRequestLogger, logPerformance, logError } from "@/lib/logger";

describe("Logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createLogger", () => {
    it("should create a child logger with context", () => {
      const log = createLogger("test-context");
      expect(log).toBeDefined();
      expect(typeof log.info).toBe("function");
      expect(typeof log.error).toBe("function");
      expect(typeof log.warn).toBe("function");
    });

    it("should create a child logger with additional metadata", () => {
      const log = createLogger("test-context", { userId: "123" });
      expect(log).toBeDefined();
    });
  });

  describe("createRequestLogger", () => {
    it("should create a logger with request context", () => {
      const log = createRequestLogger({
        requestId: "req-123",
        method: "GET",
        path: "/api/test",
        userId: "user-456",
        organizationId: "org-789",
      });
      expect(log).toBeDefined();
    });

    it("should work without optional fields", () => {
      const log = createRequestLogger({
        requestId: "req-123",
        method: "POST",
        path: "/api/vehicles",
      });
      expect(log).toBeDefined();
    });
  });

  describe("logPerformance", () => {
    it("should log performance metrics and return duration", () => {
      const log = createLogger("perf-test");
      const startTime = Date.now() - 100; // Simulate 100ms operation
      const duration = logPerformance(log, "test-operation", startTime);
      expect(duration).toBeGreaterThanOrEqual(100);
    });
  });

  describe("logError", () => {
    it("should log Error objects with stack trace", () => {
      const log = createLogger("error-test");
      const error = new Error("Test error");
      expect(() => logError(log, error)).not.toThrow();
    });

    it("should log non-Error objects", () => {
      const log = createLogger("error-test");
      expect(() => logError(log, "string error")).not.toThrow();
    });

    it("should include additional context", () => {
      const log = createLogger("error-test");
      const error = new Error("Test error");
      expect(() =>
        logError(log, error, { userId: "123", action: "create" })
      ).not.toThrow();
    });
  });
});
