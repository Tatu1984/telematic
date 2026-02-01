import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/eld/route";

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
      create: vi.fn(),
    },
  },
}));

describe("ELD API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/eld", () => {
    it("should return 401 when not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request("http://localhost/api/eld");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return ELD logs for authenticated user", async () => {
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

      const mockLogs = [
        {
          id: "log-1",
          driverId: "driver-1",
          date: new Date(),
          status: "driving",
          startTime: new Date(),
          driver: {
            user: {
              firstName: "John",
              lastName: "Doe",
            },
          },
        },
      ];

      vi.mocked(prisma.eLDLog.findMany).mockResolvedValue(mockLogs as never);

      const request = new Request("http://localhost/api/eld");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
    });

    it("should filter by driver ID for non-driver users", async () => {
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

      vi.mocked(prisma.eLDLog.findMany).mockResolvedValue([]);

      const request = new Request("http://localhost/api/eld?driverId=driver-1");
      await GET(request);

      expect(prisma.eLDLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ driverId: "driver-1" }),
        })
      );
    });

    it("should restrict drivers to their own logs", async () => {
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
        userId: "user-driver",
      } as never);

      vi.mocked(prisma.eLDLog.findMany).mockResolvedValue([]);

      const request = new Request("http://localhost/api/eld");
      await GET(request);

      expect(prisma.driver.findUnique).toHaveBeenCalledWith({
        where: { userId: "user-driver" },
      });
      expect(prisma.eLDLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ driverId: "driver-1" }),
        })
      );
    });
  });

  describe("POST /api/eld", () => {
    const validLogData = {
      driverId: "driver-1",
      date: "2024-01-15",
      status: "driving",
      startTime: "2024-01-15T08:00:00Z",
      endTime: "2024-01-15T12:00:00Z",
      location: "Chicago, IL",
    };

    it("should return 401 when not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request("http://localhost/api/eld", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validLogData),
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

      const request = new Request("http://localhost/api/eld", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validLogData),
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
      } as never);

      const request = new Request("http://localhost/api/eld", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validLogData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should create ELD log successfully", async () => {
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

      const mockLog = {
        id: "log-1",
        ...validLogData,
        driver: {
          user: { firstName: "John", lastName: "Doe" },
        },
      };

      vi.mocked(prisma.eLDLog.create).mockResolvedValue(mockLog as never);

      const request = new Request("http://localhost/api/eld", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validLogData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe("log-1");
    });

    it("should validate input data", async () => {
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

      const request = new Request("http://localhost/api/eld", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "invalid_status" }), // Missing required fields
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid data");
    });
  });
});
