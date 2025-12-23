import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const certifySchema = z.object({
  driverId: z.string(),
  date: z.string(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = certifySchema.parse(body);

    const selectedDate = new Date(validatedData.date);
    selectedDate.setHours(0, 0, 0, 0);

    const endDate = new Date(selectedDate);
    endDate.setHours(23, 59, 59, 999);

    // Get all logs for the specified date
    const logs = await prisma.eLDLog.findMany({
      where: {
        driverId: validatedData.driverId,
        date: {
          gte: selectedDate,
          lte: endDate,
        },
      },
    });

    if (logs.length === 0) {
      return NextResponse.json(
        { error: "No logs found for this date" },
        { status: 404 }
      );
    }

    // Certify all logs for the date
    await prisma.eLDLog.updateMany({
      where: {
        driverId: validatedData.driverId,
        date: {
          gte: selectedDate,
          lte: endDate,
        },
      },
      data: {
        certified: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Logs certified successfully",
      count: logs.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error certifying ELD logs:", error);
    return NextResponse.json(
      { error: "Failed to certify logs" },
      { status: 500 }
    );
  }
}
