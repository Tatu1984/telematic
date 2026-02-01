import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/incidents/route";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    incident: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    alert: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("Incidents API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/incidents", () => {
    it("should return 401 when not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request("http://localhost/api/incidents");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return incidents for authenticated user", async () => {
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

      const mockIncidents = [
        {
          id: "incident-1",
          type: "accident",
          severity: "major",
          description: "Test incident",
          vehicle: { id: "v1", licensePlate: "ABC123" },
          driver: { user: { firstName: "John", lastName: "Doe" } },
          videos: [],
        },
      ];

      vi.mocked(prisma.incident.findMany).mockResolvedValue(mockIncidents as never);

      const request = new Request("http://localhost/api/incidents");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].type).toBe("accident");
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

      vi.mocked(prisma.incident.findMany).mockResolvedValue([]);

      const request = new Request("http://localhost/api/incidents?status=open");
      await GET(request);

      expect(prisma.incident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "open" }),
        })
      );
    });

    it("should filter by type", async () => {
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

      vi.mocked(prisma.incident.findMany).mockResolvedValue([]);

      const request = new Request("http://localhost/api/incidents?type=accident");
      await GET(request);

      expect(prisma.incident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: "accident" }),
        })
      );
    });
  });

  describe("POST /api/incidents", () => {
    const validIncidentData = {
      type: "accident",
      severity: "major",
      description: "Vehicle collision at intersection",
      latitude: 41.8781,
      longitude: -87.6298,
      location: "Chicago, IL",
      vehicleId: "vehicle-1",
      driverId: "driver-1",
    };

    it("should return 401 when not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request("http://localhost/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validIncidentData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
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

      const request = new Request("http://localhost/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validIncidentData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Organization required");
    });

    it("should create incident and alert successfully", async () => {
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

      const mockIncident = {
        id: "incident-1",
        ...validIncidentData,
        status: "open",
        vehicle: { id: "vehicle-1" },
        driver: { user: { firstName: "John", lastName: "Doe" } },
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          incident: {
            create: vi.fn().mockResolvedValue(mockIncident),
          },
          alert: {
            create: vi.fn().mockResolvedValue({ id: "alert-1" }),
          },
        };
        return callback(mockTx as never);
      });

      const request = new Request("http://localhost/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validIncidentData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.type).toBe("accident");
    });

    it("should validate incident type", async () => {
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

      const request = new Request("http://localhost/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validIncidentData, type: "invalid_type" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid data");
    });

    it("should validate severity level", async () => {
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

      const request = new Request("http://localhost/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validIncidentData, severity: "extreme" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid data");
    });
  });
});
