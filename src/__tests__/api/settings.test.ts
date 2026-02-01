import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH as patchProfile } from "@/app/api/settings/profile/route";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}));

describe("Settings API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PATCH /api/settings/profile", () => {
    it("should return 401 when not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request("http://localhost/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: "New" }),
      });

      const response = await patchProfile(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should update profile successfully", async () => {
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "user@test.com",
          role: "driver",
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      vi.mocked(prisma.user.update).mockResolvedValue({
        id: "user-1",
        email: "user@test.com",
        firstName: "NewFirst",
        lastName: "NewLast",
        phone: "555-1234",
      } as never);

      const request = new Request("http://localhost/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "NewFirst",
          lastName: "NewLast",
          phone: "555-1234",
        }),
      });

      const response = await patchProfile(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.firstName).toBe("NewFirst");
      expect(data.lastName).toBe("NewLast");
    });

    it("should update only firstName", async () => {
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "user@test.com",
          role: "driver",
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      vi.mocked(prisma.user.update).mockResolvedValue({
        id: "user-1",
        email: "user@test.com",
        firstName: "Updated",
        lastName: "Existing",
        phone: null,
      } as never);

      const request = new Request("http://localhost/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: "Updated" }),
      });

      const response = await patchProfile(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.firstName).toBe("Updated");
    });

    it("should validate firstName is not empty", async () => {
      const { auth } = await import("@/lib/auth");

      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "user@test.com",
          role: "driver",
          organizationId: "org-1",
        },
        expires: new Date().toISOString(),
      });

      const request = new Request("http://localhost/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: "" }),
      });

      const response = await patchProfile(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid data");
    });
  });
});
