import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days
    const days = parseInt(period);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where = session.user.organizationId
      ? { organizationId: session.user.organizationId }
      : {};

    const tripWhere = session.user.organizationId
      ? { vehicle: { organizationId: session.user.organizationId } }
      : {};

    // Get various analytics
    const [
      tripStats,
      safetyEvents,
      fuelRecords,
      maintenanceRecords,
      driverStats,
      vehicleCount,
      tripTrends,
    ] = await Promise.all([
      // Trip statistics
      prisma.trip.aggregate({
        where: {
          ...tripWhere,
          startTime: { gte: startDate },
        },
        _sum: {
          distance: true,
          fuelUsed: true,
          duration: true,
          idleTime: true,
        },
        _avg: {
          avgSpeed: true,
          fuelUsed: true,
        },
        _count: true,
      }),

      // Safety events by type
      prisma.safetyEvent.groupBy({
        by: ["type"],
        where: {
          timestamp: { gte: startDate },
          driver: session.user.organizationId
            ? { organizationId: session.user.organizationId }
            : undefined,
        },
        _count: true,
      }),

      // Recent fuel records
      prisma.fuelRecord.findMany({
        where: {
          date: { gte: startDate },
          vehicle: where,
        },
        orderBy: { date: "desc" },
        take: 20,
      }),

      // Maintenance costs
      prisma.maintenanceRecord.aggregate({
        where: {
          vehicle: where,
          completedDate: { gte: startDate },
        },
        _sum: { cost: true },
        _count: true,
      }),

      // Driver performance
      prisma.driver.findMany({
        where,
        select: {
          id: true,
          safetyScore: true,
          totalMiles: true,
          totalTrips: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              safetyEvents: true,
            },
          },
        },
        orderBy: { safetyScore: "desc" },
        take: 10,
      }),

      // Vehicle count
      prisma.vehicle.count({ where }),

      // Trip status breakdown
      prisma.trip.groupBy({
        by: ["status"],
        where: {
          ...tripWhere,
          startTime: { gte: startDate },
        },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      tripStats,
      safetyEvents,
      fuelRecords,
      maintenanceRecords,
      driverStats,
      vehicleCount,
      tripTrends,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
