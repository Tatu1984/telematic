import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { createLogger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rateLimit";

const log = createLogger("incidents");

// Query parameter validation schema
const querySchema = z.object({
  status: z.enum(["open", "investigating", "resolved", "closed", "all"]).optional(),
  type: z.enum(["accident", "breakdown", "theft", "vandalism", "traffic_violation", "all"]).optional(),
  severity: z.enum(["minor", "moderate", "major", "critical", "all"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const incidentSchema = z.object({
  type: z.enum(["accident", "breakdown", "theft", "vandalism", "traffic_violation"]),
  severity: z.enum(["minor", "moderate", "major", "critical"]),
  description: z.string().min(1).max(2000),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  location: z.string().nullable().optional(),
  vehicleId: z.string().cuid().nullable().optional(),
  driverId: z.string().cuid().nullable().optional(),
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
      type: searchParams.get("type") || undefined,
      severity: searchParams.get("severity") || undefined,
      limit: searchParams.get("limit") || 50,
      offset: searchParams.get("offset") || 0,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { status, type, severity, limit, offset } = queryResult.data;

    const where: Record<string, unknown> = session.user.organizationId
      ? { organizationId: session.user.organizationId }
      : {};

    if (status && status !== "all") {
      where.status = status;
    }
    if (type && type !== "all") {
      where.type = type;
    }
    if (severity && severity !== "all") {
      where.severity = severity;
    }

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        include: {
          vehicle: {
            select: {
              id: true,
              licensePlate: true,
              make: true,
              model: true,
            },
          },
          driver: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          videos: {
            select: {
              id: true,
              filename: true,
              status: true,
              thumbnailUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.incident.count({ where }),
    ]);

    return NextResponse.json({
      data: incidents,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + incidents.length < total,
      },
    });
  } catch (error) {
    log.error({ error }, "Error fetching incidents");
    return NextResponse.json(
      { error: "Failed to fetch incidents" },
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

    if (!session.user.organizationId) {
      return NextResponse.json(
        { error: "Organization required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = incidentSchema.parse(body);

    // Verify vehicle belongs to organization if provided
    if (validatedData.vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: validatedData.vehicleId,
          organizationId: session.user.organizationId,
        },
      });
      if (!vehicle) {
        return NextResponse.json(
          { error: "Vehicle not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Verify driver belongs to organization if provided
    if (validatedData.driverId) {
      const driver = await prisma.driver.findFirst({
        where: {
          id: validatedData.driverId,
          organizationId: session.user.organizationId,
        },
      });
      if (!driver) {
        return NextResponse.json(
          { error: "Driver not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Create incident and alert in a transaction
    const incident = await prisma.$transaction(async (tx) => {
      // Create the incident
      const newIncident = await tx.incident.create({
        data: {
          type: validatedData.type,
          severity: validatedData.severity,
          description: validatedData.description,
          latitude: validatedData.latitude,
          longitude: validatedData.longitude,
          location: validatedData.location || null,
          vehicleId: validatedData.vehicleId || null,
          driverId: validatedData.driverId || null,
          organizationId: session.user.organizationId!,
          status: "open",
        },
        include: {
          vehicle: true,
          driver: {
            include: {
              user: true,
            },
          },
        },
      });

      // Create alert for the incident
      await tx.alert.create({
        data: {
          organizationId: session.user.organizationId!,
          type: "safety",
          severity: validatedData.severity === "critical" || validatedData.severity === "major" ? "critical" : "warning",
          title: `New ${validatedData.type.replace(/_/g, " ")} Incident`,
          message: validatedData.description.substring(0, 200),
        },
      });

      return newIncident;
    });

    log.info(
      { userId: session.user.id, incidentId: incident.id, type: incident.type },
      "Incident created"
    );

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    log.error({ error }, "Error creating incident");
    return NextResponse.json(
      { error: "Failed to create incident" },
      { status: 500 }
    );
  }
}
