import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { withRateLimit } from "@/lib/rateLimit";
import { createLogger } from "@/lib/logger";

const log = createLogger("simulator");

// Simulate IoT device data generation
export async function POST(request: Request) {
  try {
    // Require authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and fleet managers can run simulations
    const allowedRoles = ["saas_admin", "company_admin", "fleet_manager"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Apply rate limiting
    const rateLimitResponse = await withRateLimit("sensitive")(request, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    // Get all active vehicles with IoT devices
    const vehicles = await prisma.vehicle.findMany({
      where: {
        status: "active",
        iotDevice: {
          status: "online",
        },
      },
      include: {
        iotDevice: true,
        locations: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });

    // FIX N+1: Fetch all drivers with their current vehicles in a single query
    const driversWithVehicles = await prisma.driver.findMany({
      where: {
        currentVehicleId: {
          in: vehicles.map(v => v.id),
        },
      },
      select: {
        id: true,
        currentVehicleId: true,
        safetyScore: true,
      },
    });

    // Create a map for O(1) driver lookup by vehicle ID
    const driversByVehicleId = new Map(
      driversWithVehicles.map(d => [d.currentVehicleId, d])
    );

    const updates: Array<{ vehicleId: string; licensePlate: string; location: { lat: number; lng: number }; speed: number }> = [];

    // Batch operations for better performance - with proper types
    const locationCreates: Array<{
      vehicleId: string;
      latitude: number;
      longitude: number;
      altitude: number;
      heading: number;
      speed: number;
      accuracy: number;
    }> = [];
    const telemetryCreates: Array<{
      vehicleId: string;
      engineRpm: number;
      fuelLevel: number;
      coolantTemp: number;
      oilPressure: number;
      batteryVoltage: number;
      throttlePosition: number;
      engineLoad: number;
    }> = [];
    const iotUpdates: Array<{ where: { id: string }; data: { lastPing: Date } }> = [];
    const vehicleUpdates: Array<{
      where: { id: string };
      data: { odometer: { increment: number }; engineHours: { increment: number } };
    }> = [];
    const safetyEventCreates: Array<{
      driverId: string;
      type: string;
      severity: string;
      latitude: number;
      longitude: number;
      speed: number;
    }> = [];
    const driverScoreUpdates: Array<{
      where: { id: string };
      data: { safetyScore: { decrement: number } };
    }> = [];

    for (const vehicle of vehicles) {
      // Get last known position or use default (Chicago)
      const lastLocation = vehicle.locations[0] || {
        latitude: 41.8781 + (Math.random() - 0.5) * 0.2,
        longitude: -87.6298 + (Math.random() - 0.5) * 0.2,
        heading: Math.random() * 360,
        speed: 0,
      };

      // Simulate movement
      const isMoving = Math.random() > 0.3;
      const speed = isMoving ? Math.random() * 65 + 5 : 0;
      const headingChange = (Math.random() - 0.5) * 30;
      const heading = (lastLocation.heading || 0) + headingChange;

      // Calculate new position based on speed and heading
      const distance = (speed / 3600) * (5 / 60); // Distance in degrees (5 min interval)
      const radHeading = (heading * Math.PI) / 180;

      const newLat = lastLocation.latitude + distance * Math.cos(radHeading);
      const newLng = lastLocation.longitude + distance * Math.sin(radHeading);

      // Prepare location record
      locationCreates.push({
        vehicleId: vehicle.id,
        latitude: newLat,
        longitude: newLng,
        altitude: 200 + Math.random() * 50,
        heading: heading % 360,
        speed: speed,
        accuracy: 5 + Math.random() * 10,
      });

      // Prepare telemetry data
      telemetryCreates.push({
        vehicleId: vehicle.id,
        engineRpm: isMoving ? 1200 + Math.random() * 2000 : 700 + Math.random() * 200,
        fuelLevel: 30 + Math.random() * 60,
        coolantTemp: 85 + Math.random() * 20,
        oilPressure: 40 + Math.random() * 20,
        batteryVoltage: 12 + Math.random() * 2,
        throttlePosition: isMoving ? Math.random() * 100 : 0,
        engineLoad: isMoving ? 20 + Math.random() * 60 : 5 + Math.random() * 10,
      });

      // Prepare IoT device update
      if (vehicle.iotDevice) {
        iotUpdates.push({
          where: { id: vehicle.iotDevice.id },
          data: { lastPing: new Date() },
        });
      }

      // Prepare vehicle update
      vehicleUpdates.push({
        where: { id: vehicle.id },
        data: {
          odometer: { increment: distance * 69 }, // Approximate miles
          engineHours: { increment: 5 / 60 }, // 5 minutes in hours
        },
      });

      // Randomly generate safety events (10% chance) - use pre-fetched driver map
      if (Math.random() < 0.1) {
        const driver = driversByVehicleId.get(vehicle.id);

        if (driver) {
          const eventTypes = [
            "harsh_braking",
            "harsh_acceleration",
            "speeding",
            "lane_departure",
          ];
          const severities = ["low", "medium", "high"];

          safetyEventCreates.push({
            driverId: driver.id,
            type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
            severity: severities[Math.floor(Math.random() * severities.length)],
            latitude: newLat,
            longitude: newLng,
            speed: speed,
          });

          driverScoreUpdates.push({
            where: { id: driver.id },
            data: { safetyScore: { decrement: 0.5 } },
          });
        }
      }

      updates.push({
        vehicleId: vehicle.id,
        licensePlate: vehicle.licensePlate,
        location: { lat: newLat, lng: newLng },
        speed,
      });
    }

    // Execute all operations in a transaction for consistency
    await prisma.$transaction(async (tx) => {
      // Batch create locations
      if (locationCreates.length > 0) {
        await tx.vehicleLocation.createMany({ data: locationCreates });
      }

      // Batch create telemetry
      if (telemetryCreates.length > 0) {
        await tx.vehicleTelemetry.createMany({ data: telemetryCreates });
      }

      // Update IoT devices
      for (const update of iotUpdates) {
        await tx.iOTDevice.update(update);
      }

      // Update vehicles
      for (const update of vehicleUpdates) {
        await tx.vehicle.update(update);
      }

      // Create safety events
      if (safetyEventCreates.length > 0) {
        await tx.safetyEvent.createMany({ data: safetyEventCreates });
      }

      // Update driver scores
      for (const update of driverScoreUpdates) {
        await tx.driver.update(update);
      }
    });

    log.info(
      { vehicleCount: updates.length, userId: session.user.id },
      "Simulation completed successfully"
    );

    return NextResponse.json({
      success: true,
      message: `Simulated data for ${updates.length} vehicles`,
      vehicles: updates,
    });
  } catch (error) {
    log.error({ error }, "Simulator error");
    return NextResponse.json(
      { error: "Simulation failed" },
      { status: 500 }
    );
  }
}

// Get simulator status
export async function GET() {
  try {
    // Require authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and fleet managers can view simulator status
    const allowedRoles = ["saas_admin", "company_admin", "fleet_manager"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [onlineDevices, activeVehicles, recentLocations] = await Promise.all([
      prisma.iOTDevice.count({ where: { status: "online" } }),
      prisma.vehicle.count({ where: { status: "active" } }),
      prisma.vehicleLocation.count({
        where: {
          timestamp: { gte: new Date(Date.now() - 5 * 60 * 1000) },
        },
      }),
    ]);

    return NextResponse.json({
      onlineDevices,
      activeVehicles,
      recentLocations,
      lastCheck: new Date().toISOString(),
    });
  } catch (error) {
    log.error({ error }, "Error getting simulator status");
    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 }
    );
  }
}
