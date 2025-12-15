import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Simulate IoT device data generation
export async function POST() {
  try {
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

    const updates = [];

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

      // Create new location record
      const location = await prisma.vehicleLocation.create({
        data: {
          vehicleId: vehicle.id,
          latitude: newLat,
          longitude: newLng,
          altitude: 200 + Math.random() * 50,
          heading: heading % 360,
          speed: speed,
          accuracy: 5 + Math.random() * 10,
        },
      });

      // Create telemetry data
      const telemetry = await prisma.vehicleTelemetry.create({
        data: {
          vehicleId: vehicle.id,
          engineRpm: isMoving ? 1200 + Math.random() * 2000 : 700 + Math.random() * 200,
          fuelLevel: 30 + Math.random() * 60,
          coolantTemp: 85 + Math.random() * 20,
          oilPressure: 40 + Math.random() * 20,
          batteryVoltage: 12 + Math.random() * 2,
          throttlePosition: isMoving ? Math.random() * 100 : 0,
          engineLoad: isMoving ? 20 + Math.random() * 60 : 5 + Math.random() * 10,
        },
      });

      // Update IoT device last ping
      await prisma.iOTDevice.update({
        where: { id: vehicle.iotDevice!.id },
        data: { lastPing: new Date() },
      });

      // Update vehicle odometer
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
          odometer: { increment: distance * 69 }, // Approximate miles
          engineHours: { increment: 5 / 60 }, // 5 minutes in hours
        },
      });

      // Randomly generate safety events (10% chance)
      if (Math.random() < 0.1) {
        const driver = await prisma.driver.findFirst({
          where: { currentVehicleId: vehicle.id },
        });

        if (driver) {
          const eventTypes = [
            "harsh_braking",
            "harsh_acceleration",
            "speeding",
            "lane_departure",
          ];
          const severities = ["low", "medium", "high"];

          await prisma.safetyEvent.create({
            data: {
              driverId: driver.id,
              type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
              severity: severities[Math.floor(Math.random() * severities.length)],
              latitude: newLat,
              longitude: newLng,
              speed: speed,
            },
          });

          // Update driver safety score (decrease slightly)
          await prisma.driver.update({
            where: { id: driver.id },
            data: {
              safetyScore: { decrement: 0.5 },
            },
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

    return NextResponse.json({
      success: true,
      message: `Simulated data for ${updates.length} vehicles`,
      vehicles: updates,
    });
  } catch (error) {
    console.error("Simulator error:", error);
    return NextResponse.json(
      { error: "Simulation failed", details: String(error) },
      { status: 500 }
    );
  }
}

// Get simulator status
export async function GET() {
  try {
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
    console.error("Error getting simulator status:", error);
    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 }
    );
  }
}
