import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createLogger, logError } from "@/lib/logger";
import { withRateLimit } from "@/lib/rateLimit";

const log = createLogger("tracking");

export async function GET(request: Request) {
  try {
    // Rate limit check
    const rateLimitResponse = await withRateLimit("api")(request);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    log.info({ userId: session.user.id }, "Fetching tracking data");

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

    const parsedGeofences = geofences.map((g) => {
      try {
        return {
          id: g.id,
          name: g.name,
          type: g.type,
          coordinates: JSON.parse(g.coordinates),
          color: g.color,
          alertOnEntry: g.alertOnEntry,
          alertOnExit: g.alertOnExit,
        };
      } catch {
        log.warn({ geofenceId: g.id }, "Failed to parse geofence coordinates");
        return null;
      }
    }).filter(Boolean);

    log.info({ vehicleCount: trackingData.length, geofenceCount: parsedGeofences.length }, "Tracking data fetched");

    return NextResponse.json({
      vehicles: trackingData,
      geofences: parsedGeofences,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError(log, error, { operation: "fetch_tracking" });
    return NextResponse.json(
      { error: "Failed to fetch tracking data" },
      { status: 500 }
    );
  }
}
