import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateVehicleSchema = z.object({
  licensePlate: z.string().min(1).max(20).optional(),
  status: z.enum(["active", "inactive", "maintenance", "out_of_service"]).optional(),
  odometer: z.number().optional(),
  engineHours: z.number().optional(),
  lastServiceDate: z.string().optional(),
  nextServiceDue: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        currentDriver: {
          include: {
            user: true,
          },
        },
        iotDevice: true,
        locations: {
          orderBy: { timestamp: "desc" },
          take: 10,
        },
        telemetry: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
        diagnostics: {
          where: { status: "active" },
        },
      },
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

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicle" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["saas_admin", "company_admin", "fleet_manager"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateVehicleSchema.parse(body);

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
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

    const updateData: Record<string, unknown> = { ...validatedData };
    if (validatedData.lastServiceDate) {
      updateData.lastServiceDate = new Date(validatedData.lastServiceDate);
    }
    if (validatedData.nextServiceDue) {
      updateData.nextServiceDue = new Date(validatedData.nextServiceDue);
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: updateData,
      include: {
        currentDriver: {
          include: {
            user: true,
          },
        },
        iotDevice: true,
      },
    });

    return NextResponse.json(updatedVehicle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating vehicle:", error);
    return NextResponse.json(
      { error: "Failed to update vehicle" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["saas_admin", "company_admin"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
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

    // Delete related records first (cascade doesn't work for all relations)
    await prisma.$transaction([
      prisma.vehicleLocation.deleteMany({ where: { vehicleId: id } }),
      prisma.vehicleTelemetry.deleteMany({ where: { vehicleId: id } }),
      prisma.vehicleDiagnostic.deleteMany({ where: { vehicleId: id } }),
      prisma.iOTDevice.deleteMany({ where: { vehicleId: id } }),
      prisma.vehicle.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return NextResponse.json(
      { error: "Failed to delete vehicle" },
      { status: 500 }
    );
  }
}
