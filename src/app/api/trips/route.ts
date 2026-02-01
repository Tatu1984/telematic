import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const tripSchema = z.object({
  vehicleId: z.string(),
  driverId: z.string(),
  routeId: z.string().optional(),
  startLocation: z.string(),
  startLat: z.number(),
  startLng: z.number(),
  endLocation: z.string().optional(),
  endLat: z.number().optional(),
  endLng: z.number().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const vehicleId = searchParams.get("vehicleId");
    const driverId = searchParams.get("driverId");
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: Record<string, unknown> = {};

    if (session.user.organizationId) {
      where.vehicle = {
        organizationId: session.user.organizationId,
      };
    }

    if (status && status !== "all") {
      where.status = status;
    }
    if (vehicleId) {
      where.vehicleId = vehicleId;
    }
    if (driverId) {
      where.driverId = driverId;
    }

    const trips = await prisma.trip.findMany({
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
        route: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { startTime: "desc" },
      take: limit,
    });

    return NextResponse.json(trips);
  } catch (error) {
    console.error("Error fetching trips:", error);
    return NextResponse.json(
      { error: "Failed to fetch trips" },
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

    const body = await request.json();
    const validatedData = tripSchema.parse(body);

    // Verify vehicle belongs to organization
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: validatedData.vehicleId },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    if (
      session.user.organizationId &&
      vehicle.organizationId !== session.user.organizationId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create trip and update driver status in a transaction
    const trip = await prisma.$transaction(async (tx) => {
      // Create the trip
      const newTrip = await tx.trip.create({
        data: {
          ...validatedData,
          startTime: new Date(),
          status: "in_progress",
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

      // Update driver status
      await tx.driver.update({
        where: { id: validatedData.driverId },
        data: { status: "driving" },
      });

      return newTrip;
    });

    return NextResponse.json(trip, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating trip:", error);
    return NextResponse.json(
      { error: "Failed to create trip" },
      { status: 500 }
    );
  }
}
