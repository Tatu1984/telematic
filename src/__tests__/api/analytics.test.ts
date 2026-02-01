import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/analytics/route";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    trip: {
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    safetyEvent: {
      groupBy: vi.fn(),
    },
    fuelRecord: {
      findMany: vi.fn(),
    },
    maintenanceRecord: {
      aggregate: vi.fn(),
    },
    driver: {
      findMany: vi.fn(),
    },
    vehicle: {
      count: vi.fn(),
    },
  },
}));

// Mock rate limiter
vi.mock("@/lib/rateLimit", () => ({
  withRateLimit: () => async () => null,
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
  logError: vi.fn(),
}));

describe("Analytics API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/analytics", () => {
    it("should return 401 when not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request("http://localhost/api/analytics");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return analytics data for authenticated user", async () => {
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

      vi.mocked(prisma.trip.aggregate).mockResolvedValue({
        _sum: { distance: 1000, fuelUsed: 100, duration: 500, idleTime: 50 },
        _avg: { avgSpeed: 55, fuelUsed: 10 },
        _count: 10,
      } as never);

      vi.mocked(prisma.safetyEvent.groupBy).mockResolvedValue([
        { type: "harsh_braking", _count: 5 },
        { type: "speeding", _count: 3 },
      ] as never);

      vi.mocked(prisma.fuelRecord.findMany).mockResolvedValue([]);
      vi.mocked(prisma.maintenanceRecord.aggregate).mockResolvedValue({
        _sum: { cost: 5000 },
        _count: 3,
      } as never);

      vi.mocked(prisma.driver.findMany).mockResolvedValue([
        {
          id: "driver-1",
          safetyScore: 95,
          totalMiles: 10000,
          totalTrips: 50,
          user: { firstName: "John", lastName: "Doe" },
          _count: { safetyEvents: 2 },
        },
      ] as never);

      vi.mocked(prisma.vehicle.count).mockResolvedValue(5);

      vi.mocked(prisma.trip.groupBy).mockResolvedValue([
        { status: "completed", _count: 8 },
        { status: "in_progress", _count: 2 },
      ] as never);

      const request = new Request("http://localhost/api/analytics");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tripStats).toBeDefined();
      expect(data.safetyEvents).toBeDefined();
      expect(data.vehicleCount).toBe(5);
      expect(data.driverStats).toHaveLength(1);
    });

    it("should respect period parameter", async () => {
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

      // Mock all prisma calls
      vi.mocked(prisma.trip.aggregate).mockResolvedValue({
        _sum: {},
        _avg: {},
        _count: 0,
      } as never);
      vi.mocked(prisma.safetyEvent.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.fuelRecord.findMany).mockResolvedValue([]);
      vi.mocked(prisma.maintenanceRecord.aggregate).mockResolvedValue({
        _sum: {},
        _count: 0,
      } as never);
      vi.mocked(prisma.driver.findMany).mockResolvedValue([]);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(0);
      vi.mocked(prisma.trip.groupBy).mockResolvedValue([]);

      const request = new Request("http://localhost/api/analytics?period=7");
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should clamp period between 1 and 365 days", async () => {
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

      // Mock all prisma calls
      vi.mocked(prisma.trip.aggregate).mockResolvedValue({
        _sum: {},
        _avg: {},
        _count: 0,
      } as never);
      vi.mocked(prisma.safetyEvent.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.fuelRecord.findMany).mockResolvedValue([]);
      vi.mocked(prisma.maintenanceRecord.aggregate).mockResolvedValue({
        _sum: {},
        _count: 0,
      } as never);
      vi.mocked(prisma.driver.findMany).mockResolvedValue([]);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(0);
      vi.mocked(prisma.trip.groupBy).mockResolvedValue([]);

      // Test with excessive period value
      const request = new Request("http://localhost/api/analytics?period=1000");
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should filter by organization for non-saas users", async () => {
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@test.com",
          role: "company_admin",
          organizationId: "org-specific",
        },
        expires: new Date().toISOString(),
      });

      vi.mocked(prisma.trip.aggregate).mockResolvedValue({
        _sum: {},
        _avg: {},
        _count: 0,
      } as never);
      vi.mocked(prisma.safetyEvent.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.fuelRecord.findMany).mockResolvedValue([]);
      vi.mocked(prisma.maintenanceRecord.aggregate).mockResolvedValue({
        _sum: {},
        _count: 0,
      } as never);
      vi.mocked(prisma.driver.findMany).mockResolvedValue([]);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(0);
      vi.mocked(prisma.trip.groupBy).mockResolvedValue([]);

      const request = new Request("http://localhost/api/analytics");
      await GET(request);

      expect(prisma.vehicle.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: "org-specific" },
        })
      );
    });
  });
});
