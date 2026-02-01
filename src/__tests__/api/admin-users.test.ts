import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/admin/users/route";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock rate limiter
vi.mock("@/lib/rateLimit", () => ({
  withRateLimit: () => async () => null,
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed-password"),
}));

describe("Admin Users API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/admin/users", () => {
    const validUserData = {
      email: "newuser@test.com",
      firstName: "New",
      lastName: "User",
      role: "fleet_manager",
    };

    it("should return 401 when not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request("http://localhost/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validUserData),
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

      const request = new Request("http://localhost/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validUserData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should prevent privilege escalation - company_admin cannot create saas_admin", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@company.com",
          role: "company_admin",
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      const request = new Request("http://localhost/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validUserData, role: "saas_admin" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Cannot create SaaS-level users");
    });

    it("should prevent company_admin from creating users in other organizations", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@company.com",
          role: "company_admin",
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      const request = new Request("http://localhost/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validUserData, organizationId: "org-2" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Cannot create users for other organizations");
    });

    it("should return 400 when email already exists", async () => {
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@company.com",
          role: "company_admin",
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "existing-user",
        email: "newuser@test.com",
      } as never);

      const request = new Request("http://localhost/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validUserData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Email already in use");
    });

    it("should create user successfully for company_admin", async () => {
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@company.com",
          role: "company_admin",
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "new-user",
        email: validUserData.email,
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
      } as never);

      const request = new Request("http://localhost/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validUserData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.email).toBe(validUserData.email);
    });

    it("should allow saas_admin to create any role", async () => {
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

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "new-user",
        email: validUserData.email,
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
      } as never);

      const request = new Request("http://localhost/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validUserData, role: "saas_admin" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe("new-user");
    });

    it("should validate required fields", async () => {
      const { auth } = await import("@/lib/auth");

      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@company.com",
          role: "company_admin",
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      const request = new Request("http://localhost/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@test.com" }), // Missing required fields
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid data");
    });
  });
});
