import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const driverSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  licenseNumber: z.string().min(1),
  licenseState: z.string().length(2),
  licenseExpiry: z.string(),
  dotMedicalExpiry: z.string().optional(),
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

    const drivers = await prisma.driver.findMany({
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
    });

    return NextResponse.json(drivers);
  } catch (error) {
    console.error("Error fetching drivers:", error);
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

    // Create user first if not provided
    const { hash } = await import("bcryptjs");
    const defaultPassword = await hash("driver123", 12);

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: defaultPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        role: "driver",
        status: "active",
        organizationId: session.user.organizationId,
      },
    });

    const driver = await prisma.driver.create({
      data: {
        userId: user.id,
        organizationId: session.user.organizationId,
        licenseNumber: validatedData.licenseNumber,
        licenseState: validatedData.licenseState,
        licenseExpiry: new Date(validatedData.licenseExpiry),
        dotMedicalExpiry: validatedData.dotMedicalExpiry
          ? new Date(validatedData.dotMedicalExpiry)
          : null,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(driver, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating driver:", error);
    return NextResponse.json(
      { error: "Failed to create driver" },
      { status: 500 }
    );
  }
}
