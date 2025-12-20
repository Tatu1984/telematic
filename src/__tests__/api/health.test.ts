import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/health/route";

// Mock Prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

describe("Health Check API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return healthy status when database is up", async () => {
    const { prisma } = await import("@/lib/db");
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ 1: 1 }]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("healthy");
    expect(data.checks.database.status).toBe("up");
    expect(data.checks.database.latencyMs).toBeDefined();
    expect(data.uptime).toBeDefined();
    expect(data.timestamp).toBeDefined();
  });

  it("should return unhealthy status when database is down", async () => {
    const { prisma } = await import("@/lib/db");
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error("Connection failed"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("unhealthy");
    expect(data.checks.database.status).toBe("down");
    expect(data.checks.database.error).toBe("Connection failed");
  });

  it("should include memory usage information", async () => {
    const { prisma } = await import("@/lib/db");
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ 1: 1 }]);

    const response = await GET();
    const data = await response.json();

    expect(data.checks.memory).toBeDefined();
    expect(data.checks.memory.heapUsed).toBeGreaterThan(0);
    expect(data.checks.memory.heapTotal).toBeGreaterThan(0);
    expect(data.checks.memory.percentUsed).toBeGreaterThanOrEqual(0);
    expect(data.checks.memory.percentUsed).toBeLessThanOrEqual(100);
  });

  it("should include version information", async () => {
    const { prisma } = await import("@/lib/db");
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ 1: 1 }]);

    const response = await GET();
    const data = await response.json();

    expect(data.version).toBeDefined();
  });
});
