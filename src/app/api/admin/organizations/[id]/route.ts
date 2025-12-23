import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateOrgSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  subscription: z.enum(["trial", "basic", "professional", "enterprise"]).optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["saas_admin", "saas_subscriber_manager"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateOrgSchema.parse(body);

    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const updatedOrg = await prisma.organization.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(updatedOrg);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
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

    if (session.user.role !== "saas_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, vehicles: true },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Delete all related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete drivers and their related records
      const drivers = await tx.driver.findMany({
        where: { organizationId: id },
        select: { id: true },
      });
      const driverIds = drivers.map((d) => d.id);

      if (driverIds.length > 0) {
        await tx.eLDLog.deleteMany({ where: { driverId: { in: driverIds } } });
        await tx.safetyEvent.deleteMany({ where: { driverId: { in: driverIds } } });
        await tx.trip.deleteMany({ where: { driverId: { in: driverIds } } });
        await tx.incident.deleteMany({ where: { driverId: { in: driverIds } } });
      }

      // Delete vehicles and their related records
      const vehicles = await tx.vehicle.findMany({
        where: { organizationId: id },
        select: { id: true },
      });
      const vehicleIds = vehicles.map((v) => v.id);

      if (vehicleIds.length > 0) {
        await tx.vehicleLocation.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
        await tx.vehicleTelemetry.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
        await tx.vehicleDiagnostic.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
        await tx.iOTDevice.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
        await tx.fuelRecord.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
        await tx.maintenanceRecord.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
      }

      // Delete remaining org-level records
      await tx.alert.deleteMany({ where: { organizationId: id } });
      await tx.geofence.deleteMany({ where: { organizationId: id } });
      await tx.driver.deleteMany({ where: { organizationId: id } });
      await tx.vehicle.deleteMany({ where: { organizationId: id } });
      await tx.user.deleteMany({ where: { organizationId: id } });
      await tx.organization.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json(
      { error: "Failed to delete organization" },
      { status: 500 }
    );
  }
}
