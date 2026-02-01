import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/drivers/route";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    driver: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    user: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed-password"),
}));

describe("Drivers API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/drivers", () => {
    it("should return 401 when not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return drivers for authenticated user", async () => {
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

      const mockDrivers = [
        {
          id: "driver-1",
          user: {
            id: "user-driver-1",
            email: "driver@test.com",
            firstName: "John",
            lastName: "Doe",
          },
          currentVehicle: {
            id: "vehicle-1",
            licensePlate: "ABC123",
          },
          _count: { trips: 10, incidents: 0, safetyEvents: 2 },
        },
      ];

      vi.mocked(prisma.driver.findMany).mockResolvedValue(mockDrivers as never);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].user.firstName).toBe("John");
    });

    it("should filter by organization", async () => {
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

      vi.mocked(prisma.driver.findMany).mockResolvedValue([]);

      await GET();

      expect(prisma.driver.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: "org-specific" },
        })
      );
    });
  });

  describe("POST /api/drivers", () => {
    const validDriverData = {
      email: "newdriver@test.com",
      firstName: "New",
      lastName: "Driver",
      licenseNumber: "CDL-123456",
      licenseState: "IL",
      licenseExpiry: "2025-12-31",
    };

    it("should return 401 when not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request("http://localhost/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validDriverData),
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

      const request = new Request("http://localhost/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validDriverData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should return 400 when organization not set", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@test.com",
          role: "saas_admin",
          // No organizationId
        },
        expires: new Date().toISOString(),
      });

      const request = new Request("http://localhost/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validDriverData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Organization required");
    });

    it("should create driver successfully", async () => {
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

      const mockDriver = {
        id: "driver-1",
        userId: "new-user-id",
        organizationId: "org-1",
        licenseNumber: validDriverData.licenseNumber,
        user: {
          email: validDriverData.email,
          firstName: validDriverData.firstName,
          lastName: validDriverData.lastName,
        },
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          user: {
            create: vi.fn().mockResolvedValue({
              id: "new-user-id",
              email: validDriverData.email,
            }),
          },
          driver: {
            create: vi.fn().mockResolvedValue(mockDriver),
          },
        };
        return callback(mockTx as never);
      });

      const request = new Request("http://localhost/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validDriverData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.licenseNumber).toBe(validDriverData.licenseNumber);
    });

    it("should validate license state format", async () => {
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

      const request = new Request("http://localhost/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validDriverData, licenseState: "Illinois" }), // Should be 2 chars
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid data");
    });
  });
});
