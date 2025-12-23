import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateGeofenceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  alertOnEntry: z.boolean().optional(),
  alertOnExit: z.boolean().optional(),
  color: z.string().optional(),
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

    const geofence = await prisma.geofence.findUnique({
      where: { id },
      include: {
        alerts: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!geofence) {
      return NextResponse.json({ error: "Geofence not found" }, { status: 404 });
    }

    if (
      session.user.organizationId &&
      geofence.organizationId !== session.user.organizationId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(geofence);
  } catch (error) {
    console.error("Error fetching geofence:", error);
    return NextResponse.json(
      { error: "Failed to fetch geofence" },
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
    const validatedData = updateGeofenceSchema.parse(body);

    const geofence = await prisma.geofence.findUnique({
      where: { id },
    });

    if (!geofence) {
      return NextResponse.json({ error: "Geofence not found" }, { status: 404 });
    }

    if (
      session.user.organizationId &&
      geofence.organizationId !== session.user.organizationId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedGeofence = await prisma.geofence.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(updatedGeofence);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating geofence:", error);
    return NextResponse.json(
      { error: "Failed to update geofence" },
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

    const allowedRoles = ["saas_admin", "company_admin", "fleet_manager"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const geofence = await prisma.geofence.findUnique({
      where: { id },
    });

    if (!geofence) {
      return NextResponse.json({ error: "Geofence not found" }, { status: 404 });
    }

    if (
      session.user.organizationId &&
      geofence.organizationId !== session.user.organizationId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete associated alerts first
    await prisma.alert.deleteMany({
      where: { geofenceId: id },
    });

    await prisma.geofence.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting geofence:", error);
    return NextResponse.json(
      { error: "Failed to delete geofence" },
      { status: 500 }
    );
  }
}
