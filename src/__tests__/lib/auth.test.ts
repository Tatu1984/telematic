import { describe, it, expect, vi } from "vitest";
import type { UserRole } from "@/types";

// Mock NextAuth before importing auth module
vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn(() => ({})),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Import after mocks are set up
import {
  isSaaSUser,
  isCompanyUser,
  canManageUsers,
  canManageFleet,
  canViewAnalytics,
} from "@/lib/auth";

describe("Auth Helpers", () => {
  describe("isSaaSUser", () => {
    it("should return true for SaaS roles", () => {
      expect(isSaaSUser("saas_admin")).toBe(true);
      expect(isSaaSUser("saas_subscriber_manager")).toBe(true);
      expect(isSaaSUser("saas_support")).toBe(true);
      expect(isSaaSUser("saas_developer")).toBe(true);
    });

    it("should return false for company roles", () => {
      expect(isSaaSUser("company_admin")).toBe(false);
      expect(isSaaSUser("fleet_manager")).toBe(false);
      expect(isSaaSUser("driver")).toBe(false);
      expect(isSaaSUser("company_support")).toBe(false);
    });
  });

  describe("isCompanyUser", () => {
    it("should return true for company roles", () => {
      expect(isCompanyUser("company_admin")).toBe(true);
      expect(isCompanyUser("fleet_manager")).toBe(true);
      expect(isCompanyUser("driver")).toBe(true);
      expect(isCompanyUser("company_support")).toBe(true);
    });

    it("should return false for SaaS roles", () => {
      expect(isCompanyUser("saas_admin")).toBe(false);
      expect(isCompanyUser("saas_subscriber_manager")).toBe(false);
      expect(isCompanyUser("saas_support")).toBe(false);
      expect(isCompanyUser("saas_developer")).toBe(false);
    });
  });

  describe("canManageUsers", () => {
    const rolesWithPermission: UserRole[] = [
      "saas_admin",
      "saas_subscriber_manager",
      "company_admin",
    ];

    const rolesWithoutPermission: UserRole[] = [
      "saas_support",
      "saas_developer",
      "fleet_manager",
      "driver",
      "company_support",
    ];

    it("should return true for roles with user management permission", () => {
      rolesWithPermission.forEach((role) => {
        expect(canManageUsers(role)).toBe(true);
      });
    });

    it("should return false for roles without user management permission", () => {
      rolesWithoutPermission.forEach((role) => {
        expect(canManageUsers(role)).toBe(false);
      });
    });
  });

  describe("canManageFleet", () => {
    const rolesWithPermission: UserRole[] = [
      "saas_admin",
      "company_admin",
      "fleet_manager",
    ];

    const rolesWithoutPermission: UserRole[] = [
      "saas_subscriber_manager",
      "saas_support",
      "saas_developer",
      "driver",
      "company_support",
    ];

    it("should return true for roles with fleet management permission", () => {
      rolesWithPermission.forEach((role) => {
        expect(canManageFleet(role)).toBe(true);
      });
    });

    it("should return false for roles without fleet management permission", () => {
      rolesWithoutPermission.forEach((role) => {
        expect(canManageFleet(role)).toBe(false);
      });
    });
  });

  describe("canViewAnalytics", () => {
    const rolesWithPermission: UserRole[] = [
      "saas_admin",
      "saas_subscriber_manager",
      "company_admin",
      "fleet_manager",
    ];

    const rolesWithoutPermission: UserRole[] = [
      "saas_support",
      "saas_developer",
      "driver",
      "company_support",
    ];

    it("should return true for roles with analytics permission", () => {
      rolesWithPermission.forEach((role) => {
        expect(canViewAnalytics(role)).toBe(true);
      });
    });

    it("should return false for roles without analytics permission", () => {
      rolesWithoutPermission.forEach((role) => {
        expect(canViewAnalytics(role)).toBe(false);
      });
    });
  });
});
