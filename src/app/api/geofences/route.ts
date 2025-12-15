import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const geofenceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  type: z.enum(["circle", "polygon"]),
  coordinates: z.string(), // JSON string of coordinates
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  alertOnEntry: z.boolean().optional(),
  alertOnExit: z.boolean().optional(),
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

    const geofences = await prisma.geofence.findMany({
      where,
      include: {
        _count: {
          select: {
            alerts: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(geofences);
  } catch (error) {
    console.error("Error fetching geofences:", error);
    return NextResponse.json(
      { error: "Failed to fetch geofences" },
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
    const validatedData = geofenceSchema.parse(body);

    const geofence = await prisma.geofence.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        type: validatedData.type,
        coordinates: validatedData.coordinates,
        color: validatedData.color || "#3B82F6",
        alertOnEntry: validatedData.alertOnEntry ?? true,
        alertOnExit: validatedData.alertOnExit ?? true,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json(geofence, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating geofence:", error);
    return NextResponse.json(
      { error: "Failed to create geofence" },
      { status: 500 }
    );
  }
}
