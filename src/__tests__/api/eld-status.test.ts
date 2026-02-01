import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/eld/status/route";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    driver: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    eLDLog: {
      updateMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("ELD Status API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/eld/status", () => {
    const validStatusData = {
      driverId: "driver-1",
      status: "driving",
    };

    it("should return 401 when not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request("http://localhost/api/eld/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validStatusData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
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

      const request = new Request("http://localhost/api/eld/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validStatusData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Driver not found");
    });

    it("should return 403 when driver tries to update another driver's status", async () => {
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

      // First call for validating driver exists
      vi.mocked(prisma.driver.findUnique)
        .mockResolvedValueOnce({
          id: "driver-1",
          organizationId: "org-1",
        } as never)
        // Second call for getting user's driver record
        .mockResolvedValueOnce({
          id: "driver-2", // Different driver ID
          userId: "user-driver",
        } as never);

      const request = new Request("http://localhost/api/eld/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validStatusData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should return 403 when user from different organization", async () => {
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
      } as never);

      const request = new Request("http://localhost/api/eld/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validStatusData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should update status and create new ELD log successfully", async () => {
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
      } as never);

      vi.mocked(prisma.eLDLog.updateMany).mockResolvedValue({ count: 1 });

      vi.mocked(prisma.driver.update).mockResolvedValue({
        id: "driver-1",
        status: "driving",
      } as never);

      vi.mocked(prisma.eLDLog.create).mockResolvedValue({
        id: "log-1",
        driverId: "driver-1",
        status: "driving",
      } as never);

      const request = new Request("http://localhost/api/eld/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validStatusData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.driver.status).toBe("driving");
      expect(data.log).toBeDefined();
    });

    it("should validate status enum", async () => {
      const { auth } = await import("@/lib/auth");

      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@test.com",
          role: "company_admin",
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      const request = new Request("http://localhost/api/eld/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: "driver-1", status: "invalid_status" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid data");
    });
  });
});
