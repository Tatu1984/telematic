import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/geofences/route";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    geofence: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("Geofences API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/geofences", () => {
    it("should return 401 when not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return geofences for authenticated user", async () => {
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

      const mockGeofences = [
        {
          id: "geofence-1",
          name: "Headquarters",
          type: "circle",
          coordinates: '{"lat": 41.8781, "lng": -87.6298, "radius": 500}',
          color: "#3B82F6",
          alertOnEntry: true,
          alertOnExit: true,
          _count: { alerts: 5 },
        },
      ];

      vi.mocked(prisma.geofence.findMany).mockResolvedValue(mockGeofences as never);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe("Headquarters");
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

      vi.mocked(prisma.geofence.findMany).mockResolvedValue([]);

      await GET();

      expect(prisma.geofence.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: "org-specific" },
        })
      );
    });
  });

  describe("POST /api/geofences", () => {
    const validGeofenceData = {
      name: "Test Geofence",
      type: "circle",
      coordinates: '{"lat": 41.8781, "lng": -87.6298, "radius": 500}',
      color: "#FF0000",
      alertOnEntry: true,
      alertOnExit: false,
    };

    it("should return 401 when not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request("http://localhost/api/geofences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validGeofenceData),
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

      const request = new Request("http://localhost/api/geofences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validGeofenceData),
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

      const request = new Request("http://localhost/api/geofences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validGeofenceData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Organization required");
    });

    it("should create geofence successfully", async () => {
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

      const mockGeofence = {
        id: "geofence-1",
        ...validGeofenceData,
        organizationId: "org-1",
      };

      vi.mocked(prisma.geofence.create).mockResolvedValue(mockGeofence as never);

      const request = new Request("http://localhost/api/geofences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validGeofenceData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe("Test Geofence");
    });

    it("should use default color if not provided", async () => {
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

      const geofenceWithoutColor = {
        name: "Test Geofence",
        type: "circle",
        coordinates: '{"lat": 41.8781, "lng": -87.6298, "radius": 500}',
      };

      vi.mocked(prisma.geofence.create).mockResolvedValue({
        id: "geofence-1",
        ...geofenceWithoutColor,
        color: "#3B82F6", // Default color
      } as never);

      const request = new Request("http://localhost/api/geofences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geofenceWithoutColor),
      });

      await POST(request);

      expect(prisma.geofence.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ color: "#3B82F6" }),
        })
      );
    });

    it("should validate geofence type", async () => {
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

      const request = new Request("http://localhost/api/geofences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validGeofenceData, type: "invalid_type" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid data");
    });

    it("should validate color format", async () => {
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

      const request = new Request("http://localhost/api/geofences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validGeofenceData, color: "invalid-color" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid data");
    });
  });
});
