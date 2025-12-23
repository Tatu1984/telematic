import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateDriverSchema = z.object({
  status: z.enum(["available", "driving", "off_duty", "sleeper_berth"]).optional(),
  licenseNumber: z.string().min(1).optional(),
  licenseState: z.string().length(2).optional(),
  licenseExpiry: z.string().optional(),
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

    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        user: true,
        currentVehicle: true,
        trips: {
          orderBy: { startTime: "desc" },
          take: 10,
        },
        eldLogs: {
          orderBy: { date: "desc" },
          take: 7,
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    if (
      session.user.organizationId &&
      driver.organizationId !== session.user.organizationId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(driver);
  } catch (error) {
    console.error("Error fetching driver:", error);
    return NextResponse.json(
      { error: "Failed to fetch driver" },
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
    const validatedData = updateDriverSchema.parse(body);

    const driver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    if (
      session.user.organizationId &&
      driver.organizationId !== session.user.organizationId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { ...validatedData };
    if (validatedData.licenseExpiry) {
      updateData.licenseExpiry = new Date(validatedData.licenseExpiry);
    }

    const updatedDriver = await prisma.driver.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        currentVehicle: true,
      },
    });

    return NextResponse.json(updatedDriver);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating driver:", error);
    return NextResponse.json(
      { error: "Failed to update driver" },
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

    const driver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    if (
      session.user.organizationId &&
      driver.organizationId !== session.user.organizationId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete driver and related records
    await prisma.$transaction([
      prisma.eLDLog.deleteMany({ where: { driverId: id } }),
      prisma.safetyEvent.deleteMany({ where: { driverId: id } }),
      prisma.driver.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting driver:", error);
    return NextResponse.json(
      { error: "Failed to delete driver" },
      { status: 500 }
    );
  }
}
