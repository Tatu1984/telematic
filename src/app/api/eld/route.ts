import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const eldLogSchema = z.object({
  driverId: z.string(),
  date: z.string(),
  status: z.enum(["off_duty", "sleeper_berth", "driving", "on_duty_not_driving"]),
  startTime: z.string(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driverId");
    const date = searchParams.get("date");

    const where: Record<string, unknown> = {};

    // For drivers, only show their own logs
    if (session.user.role === "driver") {
      const driver = await prisma.driver.findUnique({
        where: { userId: session.user.id },
      });
      if (driver) {
        where.driverId = driver.id;
      }
    } else if (driverId) {
      where.driverId = driverId;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const logs = await prisma.eLDLog.findMany({
      where,
      include: {
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
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching ELD logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch ELD logs" },
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
    const validatedData = eldLogSchema.parse(body);

    // Verify driver belongs to same organization or is the driver
    const driver = await prisma.driver.findUnique({
      where: { id: validatedData.driverId },
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

    const startTime = new Date(validatedData.startTime);
    const endTime = validatedData.endTime ? new Date(validatedData.endTime) : null;
    const duration = endTime
      ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
      : null;

    const log = await prisma.eLDLog.create({
      data: {
        driverId: validatedData.driverId,
        date: new Date(validatedData.date),
        status: validatedData.status,
        startTime,
        endTime,
        duration,
        location: validatedData.location,
        notes: validatedData.notes,
      },
      include: {
        driver: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating ELD log:", error);
    return NextResponse.json(
      { error: "Failed to create ELD log" },
      { status: 500 }
    );
  }
}
