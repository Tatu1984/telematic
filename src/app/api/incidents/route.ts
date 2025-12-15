import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const incidentSchema = z.object({
  type: z.enum(["accident", "breakdown", "theft", "vandalism", "traffic_violation"]),
  severity: z.enum(["minor", "moderate", "major", "critical"]),
  description: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  location: z.string().nullable().optional(),
  vehicleId: z.string().nullable().optional(),
  driverId: z.string().nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = session.user.organizationId
      ? { organizationId: session.user.organizationId }
      : {};

    if (status && status !== "all") {
      where.status = status;
    }
    if (type && type !== "all") {
      where.type = type;
    }

    const incidents = await prisma.incident.findMany({
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
    });

    return NextResponse.json(incidents);
  } catch (error) {
    console.error("Error fetching incidents:", error);
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

    if (!session.user.organizationId) {
      return NextResponse.json(
        { error: "Organization required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = incidentSchema.parse(body);

    const incident = await prisma.incident.create({
      data: {
        type: validatedData.type,
        severity: validatedData.severity,
        description: validatedData.description,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        location: validatedData.location || null,
        vehicleId: validatedData.vehicleId || null,
        driverId: validatedData.driverId || null,
        organizationId: session.user.organizationId,
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
    await prisma.alert.create({
      data: {
        organizationId: session.user.organizationId,
        type: "safety",
        severity: validatedData.severity === "critical" || validatedData.severity === "major" ? "critical" : "warning",
        title: `New ${validatedData.type.replace(/_/g, " ")} Incident`,
        message: validatedData.description.substring(0, 200),
      },
    });

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating incident:", error);
    return NextResponse.json(
      { error: "Failed to create incident" },
      { status: 500 }
    );
  }
}
