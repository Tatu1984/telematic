import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const vehicleSchema = z.object({
  vin: z.string().length(17),
  licensePlate: z.string().min(1).max(20),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().min(1990).max(new Date().getFullYear() + 1),
  type: z.enum(["truck", "van", "car", "trailer"]),
  fuelType: z.enum(["diesel", "gasoline", "electric", "hybrid"]),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicles" },
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

    // Check permissions
    const allowedRoles = ["saas_admin", "company_admin", "fleet_manager"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = vehicleSchema.parse(body);

    // Check if VIN already exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { vin: validatedData.vin },
    });

    if (existingVehicle) {
      return NextResponse.json(
        { error: "Vehicle with this VIN already exists" },
        { status: 400 }
      );
    }

    // For SaaS admin without org, we need to handle differently
    if (!session.user.organizationId) {
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

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating vehicle:", error);
    return NextResponse.json(
      { error: "Failed to create vehicle" },
      { status: 500 }
    );
  }
}
