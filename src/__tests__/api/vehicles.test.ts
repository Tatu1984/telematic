import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/vehicles/route";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    vehicle: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock rate limiter
vi.mock("@/lib/rateLimit", () => ({
  withRateLimit: () => async () => null, // Always allow in tests
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  createRequestLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
  logError: vi.fn(),
  logPerformance: vi.fn(),
}));

describe("Vehicles API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/vehicles", () => {
    const createRequest = () => new Request("http://localhost/api/vehicles");

    it("should return 401 when not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return vehicles for authenticated user", async () => {
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "test@example.com",
          role: "company_admin",
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      const mockVehicles = [
        {
          id: "v1",
          vin: "1HGBH41JXMN109186",
          make: "Honda",
          model: "Accord",
          year: 2021,
          organizationId: "org-1",
        },
      ];

      vi.mocked(prisma.vehicle.findMany).mockResolvedValue(mockVehicles as never);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockVehicles);
    });

    it("should filter vehicles by organization", async () => {
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "test@example.com",
          role: "fleet_manager",
          organizationId: "org-specific",
        },
        expires: new Date().toISOString(),
      });

      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([]);

      await GET(createRequest());

      expect(prisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: "org-specific" },
        })
      );
    });
  });

  describe("POST /api/vehicles", () => {
    const validVehicleData = {
      vin: "1HGBH41JXMN109186",
      licensePlate: "ABC123",
      make: "Honda",
      model: "Accord",
      year: 2021,
      type: "car",
      fuelType: "gasoline",
    };

    it("should return 401 when not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request("http://localhost/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validVehicleData),
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
          email: "driver@example.com",
          role: "driver", // Drivers can't create vehicles
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      const request = new Request("http://localhost/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validVehicleData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should validate VIN length", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@example.com",
          role: "company_admin",
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      const request = new Request("http://localhost/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validVehicleData, vin: "SHORT" }), // Invalid VIN
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid data");
    });

    it("should reject duplicate VIN", async () => {
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@example.com",
          role: "company_admin",
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      vi.mocked(prisma.vehicle.findUnique).mockResolvedValue({
        id: "existing-vehicle",
        vin: validVehicleData.vin,
      } as never);

      const request = new Request("http://localhost/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validVehicleData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Vehicle with this VIN already exists");
    });

    it("should create vehicle successfully", async () => {
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@example.com",
          role: "company_admin",
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      vi.mocked(prisma.vehicle.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.vehicle.create).mockResolvedValue({
        id: "new-vehicle",
        ...validVehicleData,
        organizationId: "org-1",
      } as never);

      const request = new Request("http://localhost/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validVehicleData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe("new-vehicle");
      expect(data.vin).toBe(validVehicleData.vin);
    });
  });
});
