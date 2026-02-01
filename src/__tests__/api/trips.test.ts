import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/trips/route";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    trip: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    vehicle: {
      findUnique: vi.fn(),
    },
    driver: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("Trips API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/trips", () => {
    it("should return 401 when not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request("http://localhost/api/trips");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return trips for authenticated user", async () => {
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

      const mockTrips = [
        {
          id: "trip-1",
          startLocation: "Chicago, IL",
          endLocation: "Milwaukee, WI",
          status: "completed",
          vehicle: { id: "v1", licensePlate: "ABC123" },
          driver: { user: { firstName: "John", lastName: "Doe" } },
          route: null,
        },
      ];

      vi.mocked(prisma.trip.findMany).mockResolvedValue(mockTrips as never);

      const request = new Request("http://localhost/api/trips");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].startLocation).toBe("Chicago, IL");
    });

    it("should filter by status", async () => {
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

      vi.mocked(prisma.trip.findMany).mockResolvedValue([]);

      const request = new Request("http://localhost/api/trips?status=in_progress");
      await GET(request);

      expect(prisma.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "in_progress" }),
        })
      );
    });

    it("should filter by vehicleId", async () => {
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

      vi.mocked(prisma.trip.findMany).mockResolvedValue([]);

      const request = new Request("http://localhost/api/trips?vehicleId=vehicle-1");
      await GET(request);

      expect(prisma.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ vehicleId: "vehicle-1" }),
        })
      );
    });

    it("should filter by driverId", async () => {
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

      vi.mocked(prisma.trip.findMany).mockResolvedValue([]);

      const request = new Request("http://localhost/api/trips?driverId=driver-1");
      await GET(request);

      expect(prisma.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ driverId: "driver-1" }),
        })
      );
    });
  });

  describe("POST /api/trips", () => {
    const validTripData = {
      vehicleId: "vehicle-1",
      driverId: "driver-1",
      startLocation: "Chicago, IL",
      startLat: 41.8781,
      startLng: -87.6298,
    };

    it("should return 401 when not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request("http://localhost/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validTripData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 404 when vehicle not found", async () => {
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

      vi.mocked(prisma.vehicle.findUnique).mockResolvedValue(null);

      const request = new Request("http://localhost/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validTripData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Vehicle not found");
    });

    it("should return 403 when vehicle belongs to different organization", async () => {
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

      vi.mocked(prisma.vehicle.findUnique).mockResolvedValue({
        id: "vehicle-1",
        organizationId: "org-2", // Different org
      } as never);

      const request = new Request("http://localhost/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validTripData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should create trip and update driver status successfully", async () => {
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

      vi.mocked(prisma.vehicle.findUnique).mockResolvedValue({
        id: "vehicle-1",
        organizationId: "org-1",
      } as never);

      const mockTrip = {
        id: "trip-1",
        ...validTripData,
        status: "in_progress",
        vehicle: { id: "vehicle-1" },
        driver: { user: { firstName: "John", lastName: "Doe" } },
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          trip: {
            create: vi.fn().mockResolvedValue(mockTrip),
          },
          driver: {
            update: vi.fn().mockResolvedValue({ id: "driver-1", status: "driving" }),
          },
        };
        return callback(mockTx as never);
      });

      const request = new Request("http://localhost/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validTripData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.status).toBe("in_progress");
    });

    it("should validate required fields", async () => {
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

      const request = new Request("http://localhost/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId: "vehicle-1" }), // Missing required fields
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid data");
    });
  });
});
