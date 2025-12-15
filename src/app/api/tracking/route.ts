import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where = session.user.organizationId
      ? { organizationId: session.user.organizationId, status: "active" }
      : { status: "active" };

    // Get active vehicles with their latest locations
    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        currentDriver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        iotDevice: {
          select: {
            status: true,
            lastPing: true,
          },
        },
        locations: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
        telemetry: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });

    // Get geofences
    const geofences = await prisma.geofence.findMany({
      where: session.user.organizationId
        ? { organizationId: session.user.organizationId, status: "active" }
        : { status: "active" },
    });

    // Transform data for tracking display
    const trackingData = vehicles
      .filter((v) => v.locations.length > 0)
      .map((vehicle) => {
        const location = vehicle.locations[0];
        const telemetry = vehicle.telemetry[0];
        return {
          id: vehicle.id,
          licensePlate: vehicle.licensePlate,
          make: vehicle.make,
          model: vehicle.model,
          status: vehicle.status,
          lat: location.latitude,
          lng: location.longitude,
          speed: location.speed || 0,
          heading: location.heading || 0,
          driver: vehicle.currentDriver
            ? `${vehicle.currentDriver.user.firstName} ${vehicle.currentDriver.user.lastName}`
            : "Unassigned",
          driverStatus: vehicle.currentDriver?.status || "unknown",
          deviceStatus: vehicle.iotDevice?.status || "offline",
          lastPing: vehicle.iotDevice?.lastPing,
          telemetry: telemetry
            ? {
                engineRpm: telemetry.engineRpm,
                fuelLevel: telemetry.fuelLevel,
                coolantTemp: telemetry.coolantTemp,
                batteryVoltage: telemetry.batteryVoltage,
              }
            : null,
        };
      });

    const parsedGeofences = geofences.map((g) => ({
      id: g.id,
      name: g.name,
      type: g.type,
      coordinates: JSON.parse(g.coordinates),
      color: g.color,
      alertOnEntry: g.alertOnEntry,
      alertOnExit: g.alertOnExit,
    }));

    return NextResponse.json({
      vehicles: trackingData,
      geofences: parsedGeofences,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching tracking data:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracking data" },
      { status: 500 }
    );
  }
}
