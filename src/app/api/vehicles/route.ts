import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { createRequestLogger, logError, logPerformance } from "@/lib/logger";
import { withRateLimit } from "@/lib/rateLimit";
import { v4 as uuidv4 } from "uuid";

const vehicleSchema = z.object({
  vin: z.string().length(17),
  licensePlate: z.string().min(1).max(20),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().min(1990).max(new Date().getFullYear() + 1),
  type: z.enum(["truck", "van", "car", "trailer"]),
  fuelType: z.enum(["diesel", "gasoline", "electric", "hybrid"]),
});

export async function GET(request: Request) {
  const startTime = Date.now();
  const requestId = uuidv4();
  const log = createRequestLogger({
    requestId,
    method: "GET",
    path: "/api/vehicles",
  });

  try {
    // Check rate limit
    const rateLimitCheck = withRateLimit("api");
    const rateLimitResponse = await rateLimitCheck(request);
    if (rateLimitResponse) {
      log.warn("Rate limit exceeded");
      return rateLimitResponse;
    }

    const session = await auth();
    if (!session?.user) {
      log.warn("Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    log.info({ userId: session.user.id }, "Fetching vehicles");

    const where = session.user.organizationId
      ? { organizationId: session.user.organizationId }
      : {};

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        currentDriver: {
          include: { user: true },
        },
        iotDevice: true,
      },
      orderBy: { createdAt: "desc" },
    });

    logPerformance(log, "fetch_vehicles", startTime);
    log.info({ count: vehicles.length }, "Vehicles fetched successfully");

    return NextResponse.json(vehicles);
  } catch (error) {
    logError(log, error, { operation: "fetch_vehicles" });
    return NextResponse.json(
      { error: "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = uuidv4();
  const log = createRequestLogger({
    requestId,
    method: "POST",
    path: "/api/vehicles",
  });

  try {
    // Check rate limit
    const rateLimitCheck = withRateLimit("api");
    const rateLimitResponse = await rateLimitCheck(request);
    if (rateLimitResponse) {
      log.warn("Rate limit exceeded");
      return rateLimitResponse;
    }

    const session = await auth();
    if (!session?.user) {
      log.warn("Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    log.info({ userId: session.user.id }, "Creating vehicle");

    // Check permissions
    const allowedRoles = ["saas_admin", "company_admin", "fleet_manager"];
    if (!allowedRoles.includes(session.user.role)) {
      log.warn({ role: session.user.role }, "Forbidden - insufficient permissions");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = vehicleSchema.parse(body);

    // Check if VIN already exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { vin: validatedData.vin },
    });

    if (existingVehicle) {
      log.warn({ vin: validatedData.vin }, "Duplicate VIN");
      return NextResponse.json(
        { error: "Vehicle with this VIN already exists" },
        { status: 400 }
      );
    }

    // For SaaS admin without org, we need to handle differently
    if (!session.user.organizationId) {
      log.warn("No organization ID for vehicle creation");
      return NextResponse.json(
        { error: "Organization required to add vehicles" },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        ...validatedData,
        organizationId: session.user.organizationId,
      },
    });

    logPerformance(log, "create_vehicle", startTime);
    log.info({ vehicleId: vehicle.id }, "Vehicle created successfully");

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.warn({ issues: error.issues }, "Validation error");
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    logError(log, error, { operation: "create_vehicle" });
    return NextResponse.json(
      { error: "Failed to create vehicle" },
      { status: 500 }
    );
  }
}
