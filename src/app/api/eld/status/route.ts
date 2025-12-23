import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const statusUpdateSchema = z.object({
  driverId: z.string(),
  status: z.enum(["off_duty", "sleeper_berth", "driving", "on_duty_not_driving"]),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = statusUpdateSchema.parse(body);

    // Verify driver exists and belongs to same organization
    const driver = await prisma.driver.findUnique({
      where: { id: validatedData.driverId },
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    // Drivers can only update their own status
    if (session.user.role === "driver") {
      const userDriver = await prisma.driver.findUnique({
        where: { userId: session.user.id },
      });
      if (!userDriver || userDriver.id !== validatedData.driverId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (
      session.user.organizationId &&
      driver.organizationId !== session.user.organizationId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Close any open ELD log entries
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.eLDLog.updateMany({
      where: {
        driverId: validatedData.driverId,
        date: { gte: today },
        endTime: null,
      },
      data: {
        endTime: new Date(),
      },
    });

    // Update driver status
    const updatedDriver = await prisma.driver.update({
      where: { id: validatedData.driverId },
      data: { status: validatedData.status },
    });

    // Create new ELD log entry
    const newLog = await prisma.eLDLog.create({
      data: {
        driverId: validatedData.driverId,
        date: new Date(),
        status: validatedData.status,
        startTime: new Date(),
      },
    });

    return NextResponse.json({
      driver: updatedDriver,
      log: newLog,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating ELD status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
