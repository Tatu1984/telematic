import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";

const log = createLogger("health-check");

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: {
      status: "up" | "down";
      latencyMs?: number;
      error?: string;
    };
    memory: {
      status: "ok" | "warning" | "critical";
      heapUsed: number;
      heapTotal: number;
      percentUsed: number;
    };
  };
}

// Track server start time for uptime calculation
const startTime = Date.now();

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const timestamp = new Date().toISOString();

  // Check database connectivity
  let dbStatus: HealthStatus["checks"]["database"];
  const dbStart = Date.now();

  try {
    // Simple query to check database connection
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = {
      status: "up",
      latencyMs: Date.now() - dbStart,
    };
  } catch (error) {
    log.error({ error }, "Database health check failed");
    dbStatus = {
      status: "down",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const percentUsed = Math.round(
    (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
  );
  const memoryStatus: HealthStatus["checks"]["memory"] = {
    status: percentUsed > 90 ? "critical" : percentUsed > 75 ? "warning" : "ok",
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
    percentUsed,
  };

  // Determine overall status
  let overallStatus: HealthStatus["status"] = "healthy";
  if (dbStatus.status === "down") {
    overallStatus = "unhealthy";
  } else if (memoryStatus.status === "critical") {
    overallStatus = "unhealthy";
  } else if (memoryStatus.status === "warning") {
    overallStatus = "degraded";
  }

  const healthResponse: HealthStatus = {
    status: overallStatus,
    timestamp,
    version: process.env.npm_package_version || "0.1.0",
    uptime: Math.round((Date.now() - startTime) / 1000), // seconds
    checks: {
      database: dbStatus,
      memory: memoryStatus,
    },
  };

  // Log health check results
  log.info(
    {
      status: overallStatus,
      dbLatency: dbStatus.latencyMs,
      memoryPercent: percentUsed,
    },
    "Health check completed"
  );

  // Return appropriate status code based on health
  const statusCode = overallStatus === "unhealthy" ? 503 : 200;

  return NextResponse.json(healthResponse, { status: statusCode });
}
