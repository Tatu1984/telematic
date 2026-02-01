import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/eld/certify/route";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    driver: {
      findUnique: vi.fn(),
    },
    eLDLog: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

// Mock rate limiter
vi.mock("@/lib/rateLimit", () => ({
  withRateLimit: () => async () => null,
}));

describe("ELD Certify API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/eld/certify", () => {
    const validCertifyData = {
      driverId: "driver-1",
      date: "2024-01-15",
    };

    it("should return 401 when not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request("http://localhost/api/eld/certify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validCertifyData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 for unauthorized roles", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "viewer@test.com",
          role: "company_support", // Not allowed to certify
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      const request = new Request("http://localhost/api/eld/certify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validCertifyData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should return 404 when driver not found", async () => {
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@test.com",
          role: "company_admin",
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      vi.mocked(prisma.driver.findUnique).mockResolvedValue(null);

      const request = new Request("http://localhost/api/eld/certify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validCertifyData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Driver not found");
    });

    it("should return 403 when driver belongs to different organization", async () => {
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@test.com",
          role: "company_admin",
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      vi.mocked(prisma.driver.findUnique).mockResolvedValue({
        id: "driver-1",
        organizationId: "org-2", // Different org
        userId: "user-other",
        user: {},
      } as never);

      const request = new Request("http://localhost/api/eld/certify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validCertifyData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should return 403 when driver tries to certify another driver's logs", async () => {
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-driver",
          email: "driver@test.com",
          role: "driver",
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      vi.mocked(prisma.driver.findUnique).mockResolvedValue({
        id: "driver-1",
        organizationId: "org-1",
        userId: "user-other", // Different user
        user: {},
      } as never);

      const request = new Request("http://localhost/api/eld/certify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validCertifyData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Drivers can only certify their own logs");
    });

    it("should return 404 when no logs found for the date", async () => {
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@test.com",
          role: "company_admin",
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      vi.mocked(prisma.driver.findUnique).mockResolvedValue({
        id: "driver-1",
        organizationId: "org-1",
        userId: "user-1",
        user: {},
      } as never);

      vi.mocked(prisma.eLDLog.findMany).mockResolvedValue([]);

      const request = new Request("http://localhost/api/eld/certify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validCertifyData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("No logs found for this date");
    });

    it("should certify logs successfully", async () => {
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@test.com",
          role: "company_admin",
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      vi.mocked(prisma.driver.findUnique).mockResolvedValue({
        id: "driver-1",
        organizationId: "org-1",
        userId: "user-1",
        user: {},
      } as never);

      vi.mocked(prisma.eLDLog.findMany).mockResolvedValue([
        { id: "log-1" },
        { id: "log-2" },
      ] as never);

      vi.mocked(prisma.eLDLog.updateMany).mockResolvedValue({ count: 2 });

      const request = new Request("http://localhost/api/eld/certify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validCertifyData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.count).toBe(2);
    });

    it("should allow driver to certify their own logs", async () => {
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-driver",
          email: "driver@test.com",
          role: "driver",
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      vi.mocked(prisma.driver.findUnique).mockResolvedValue({
        id: "driver-1",
        organizationId: "org-1",
        userId: "user-driver", // Same user
        user: {},
      } as never);

      vi.mocked(prisma.eLDLog.findMany).mockResolvedValue([
        { id: "log-1" },
      ] as never);

      vi.mocked(prisma.eLDLog.updateMany).mockResolvedValue({ count: 1 });

      const request = new Request("http://localhost/api/eld/certify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validCertifyData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
