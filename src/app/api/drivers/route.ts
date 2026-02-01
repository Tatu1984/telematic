import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { createLogger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rateLimit";

const log = createLogger("drivers");

// Query parameter validation schema
const querySchema = z.object({
  status: z.enum(["available", "driving", "off_duty", "sleeper_berth", "all"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const driverSchema = z.object({
  userId: z.string().cuid().optional(),
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phone: z.string().optional(),
  licenseNumber: z.string().min(1, "License number is required").max(50),
  licenseState: z.string().length(2, "License state must be 2 characters"),
  licenseExpiry: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  dotMedicalExpiry: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date").optional(),
});

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResponse = await withRateLimit("api")(request, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const queryResult = querySchema.safeParse({
      status: searchParams.get("status") || undefined,
      limit: searchParams.get("limit") || 50,
      offset: searchParams.get("offset") || 0,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { status, limit, offset } = queryResult.data;

    const where: Record<string, unknown> = session.user.organizationId
      ? { organizationId: session.user.organizationId }
      : {};

    if (status && status !== "all") {
      where.status = status;
    }

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              avatar: true,
              status: true,
            },
          },
          currentVehicle: {
            select: {
              id: true,
              licensePlate: true,
              make: true,
              model: true,
            },
          },
          _count: {
            select: {
              trips: true,
              incidents: true,
              safetyEvents: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.driver.count({ where }),
    ]);

    return NextResponse.json({
      data: drivers,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + drivers.length < total,
      },
    });
  } catch (error) {
    log.error({ error }, "Error fetching drivers");
    return NextResponse.json(
      { error: "Failed to fetch drivers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResponse = await withRateLimit("api")(request, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const allowedRoles = ["saas_admin", "company_admin", "fleet_manager"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!session.user.organizationId) {
      return NextResponse.json(
        { error: "Organization required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = driverSchema.parse(body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Create user and driver in a transaction to ensure atomicity
    const { hash } = await import("bcryptjs");
    const defaultPassword = await hash("driver123", 12);

    const driver = await prisma.$transaction(async (tx) => {
      // Create user first
      const user = await tx.user.create({
        data: {
          email: validatedData.email.toLowerCase(),
          password: defaultPassword,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone,
          role: "driver",
          status: "active",
          organizationId: session.user.organizationId,
        },
      });

      // Create driver linked to user
      const newDriver = await tx.driver.create({
        data: {
          userId: user.id,
          organizationId: session.user.organizationId!,
          licenseNumber: validatedData.licenseNumber,
          licenseState: validatedData.licenseState.toUpperCase(),
          licenseExpiry: new Date(validatedData.licenseExpiry),
          dotMedicalExpiry: validatedData.dotMedicalExpiry
            ? new Date(validatedData.dotMedicalExpiry)
            : null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              status: true,
            },
          },
        },
      });

      return newDriver;
    });

    log.info(
      { userId: session.user.id, driverId: driver.id },
      "Driver created"
    );

    return NextResponse.json(driver, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    log.error({ error }, "Error creating driver");
    return NextResponse.json(
      { error: "Failed to create driver" },
      { status: 500 }
    );
  }
}
