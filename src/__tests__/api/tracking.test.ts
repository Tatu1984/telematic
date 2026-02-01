import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/tracking/route";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    vehicle: {
      findMany: vi.fn(),
    },
    geofence: {
      findMany: vi.fn(),
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

describe("Tracking API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/tracking", () => {
    it("should return 401 when not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request("http://localhost/api/tracking");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return tracking data for authenticated user", async () => {
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
          make: "Ford",
          model: "Transit",
          status: "active",
          currentDriver: {
            status: "driving",
            user: { firstName: "John", lastName: "Doe" },
          },
          iotDevice: { status: "online", lastPing: new Date() },
          locations: [
            { latitude: 41.8781, longitude: -87.6298, speed: 55, heading: 90 },
          ],
          telemetry: [
            { engineRpm: 2000, fuelLevel: 75, coolantTemp: 90, batteryVoltage: 12.5 },
          ],
        },
      ];

      const mockGeofences = [
        {
          id: "geofence-1",
          name: "Headquarters",
          type: "circle",
          coordinates: '{"lat": 41.8781, "lng": -87.6298, "radius": 500}',
          color: "#3B82F6",
          alertOnEntry: true,
          alertOnExit: true,
        },
      ];

      vi.mocked(prisma.vehicle.findMany).mockResolvedValue(mockVehicles as never);
      vi.mocked(prisma.geofence.findMany).mockResolvedValue(mockGeofences as never);

      const request = new Request("http://localhost/api/tracking");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.vehicles).toHaveLength(1);
      expect(data.geofences).toHaveLength(1);
      expect(data.timestamp).toBeDefined();
    });

    it("should filter vehicles by organization and active status", async () => {
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

      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([]);
      vi.mocked(prisma.geofence.findMany).mockResolvedValue([]);

      const request = new Request("http://localhost/api/tracking");
      await GET(request);

      expect(prisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: "org-specific", status: "active" },
        })
      );
    });

    it("should transform vehicle data correctly", async () => {
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
          make: "Ford",
          model: "Transit",
          status: "active",
          currentDriver: {
            status: "driving",
            user: { firstName: "John", lastName: "Doe" },
          },
          iotDevice: { status: "online", lastPing: new Date() },
          locations: [
            { latitude: 41.8781, longitude: -87.6298, speed: 55, heading: 90 },
          ],
          telemetry: [
            { engineRpm: 2000, fuelLevel: 75, coolantTemp: 90, batteryVoltage: 12.5 },
          ],
        },
      ];

      vi.mocked(prisma.vehicle.findMany).mockResolvedValue(mockVehicles as never);
      vi.mocked(prisma.geofence.findMany).mockResolvedValue([]);

      const request = new Request("http://localhost/api/tracking");
      const response = await GET(request);
      const data = await response.json();

      expect(data.vehicles[0].driver).toBe("John Doe");
      expect(data.vehicles[0].lat).toBe(41.8781);
      expect(data.vehicles[0].lng).toBe(-87.6298);
      expect(data.vehicles[0].speed).toBe(55);
      expect(data.vehicles[0].telemetry.fuelLevel).toBe(75);
    });

    it("should exclude vehicles without locations", async () => {
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
          make: "Ford",
          model: "Transit",
          status: "active",
          currentDriver: null,
          iotDevice: { status: "offline", lastPing: null },
          locations: [], // No locations
          telemetry: [],
        },
      ];

      vi.mocked(prisma.vehicle.findMany).mockResolvedValue(mockVehicles as never);
      vi.mocked(prisma.geofence.findMany).mockResolvedValue([]);

      const request = new Request("http://localhost/api/tracking");
      const response = await GET(request);
      const data = await response.json();

      expect(data.vehicles).toHaveLength(0);
    });

    it("should handle geofences with invalid coordinates", async () => {
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
      vi.mocked(prisma.geofence.findMany).mockResolvedValue([
        {
          id: "geofence-1",
          name: "Invalid",
          type: "circle",
          coordinates: "invalid-json",
          color: "#3B82F6",
          alertOnEntry: true,
          alertOnExit: true,
        },
      ] as never);

      const request = new Request("http://localhost/api/tracking");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.geofences).toHaveLength(0); // Invalid geofences filtered out
    });
  });
});
