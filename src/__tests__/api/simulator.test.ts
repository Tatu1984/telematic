import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/simulator/route";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    vehicle: {
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    vehicleLocation: {
      create: vi.fn(),
      count: vi.fn(),
    },
    vehicleTelemetry: {
      create: vi.fn(),
    },
    iOTDevice: {
      update: vi.fn(),
      count: vi.fn(),
    },
    driver: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    safetyEvent: {
      create: vi.fn(),
    },
  },
}));

// Mock rate limiter
vi.mock("@/lib/rateLimit", () => ({
  withRateLimit: () => async () => null,
}));

describe("Simulator API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/simulator", () => {
    it("should return 401 when not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request("http://localhost/api/simulator");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 for unauthorized roles", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "driver@test.com",
          role: "driver",
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      const request = new Request("http://localhost/api/simulator");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should return simulator status for authorized user", async () => {
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

      vi.mocked(prisma.iOTDevice.count).mockResolvedValue(5);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(10);
      vi.mocked(prisma.vehicleLocation.count).mockResolvedValue(50);

      const request = new Request("http://localhost/api/simulator");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.onlineDevices).toBe(5);
      expect(data.activeVehicles).toBe(10);
      expect(data.recentLocations).toBe(50);
      expect(data.lastCheck).toBeDefined();
    });

    it("should allow fleet_manager role", async () => {
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "fleet@test.com",
          role: "fleet_manager",
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      vi.mocked(prisma.iOTDevice.count).mockResolvedValue(3);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(5);
      vi.mocked(prisma.vehicleLocation.count).mockResolvedValue(20);

      const request = new Request("http://localhost/api/simulator");
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe("POST /api/simulator", () => {
    it("should return 401 when not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request("http://localhost/api/simulator", {
        method: "POST",
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
          email: "driver@test.com",
          role: "driver",
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      const request = new Request("http://localhost/api/simulator", {
        method: "POST",
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should run simulation for authorized user", async () => {
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

      const mockVehicles = [
        {
          id: "vehicle-1",
          licensePlate: "ABC123",
          status: "active",
          iotDevice: { id: "iot-1", status: "online" },
          locations: [
            { latitude: 41.8781, longitude: -87.6298, heading: 90, speed: 50 },
          ],
        },
      ];

      vi.mocked(prisma.vehicle.findMany).mockResolvedValue(mockVehicles as never);
      vi.mocked(prisma.vehicleLocation.create).mockResolvedValue({
        id: "location-1",
      } as never);
      vi.mocked(prisma.vehicleTelemetry.create).mockResolvedValue({
        id: "telemetry-1",
      } as never);
      vi.mocked(prisma.iOTDevice.update).mockResolvedValue({
        id: "iot-1",
      } as never);
      vi.mocked(prisma.vehicle.update).mockResolvedValue({
        id: "vehicle-1",
      } as never);
      vi.mocked(prisma.driver.findFirst).mockResolvedValue(null);

      const request = new Request("http://localhost/api/simulator", {
        method: "POST",
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.vehicles).toHaveLength(1);
    });

    it("should handle no active vehicles", async () => {
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

      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([]);

      const request = new Request("http://localhost/api/simulator", {
        method: "POST",
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.vehicles).toHaveLength(0);
      expect(data.message).toBe("Simulated data for 0 vehicles");
    });

    it("should allow saas_admin role", async () => {
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "superadmin@fleettrack.com",
          role: "saas_admin",
        },
        expires: new Date().toISOString(),
      });

      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([]);

      const request = new Request("http://localhost/api/simulator", {
        method: "POST",
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });
});
