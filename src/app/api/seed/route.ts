import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";

export async function POST() {
  try {
    // Check if data already exists
    const existingOrg = await prisma.organization.findFirst();
    if (existingOrg) {
      return NextResponse.json(
        { message: "Database already seeded" },
        { status: 200 }
      );
    }

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name: "Acme Trucking Co.",
        slug: "acme-trucking",
        email: "contact@acmetrucking.com",
        phone: "(555) 123-4567",
        address: "123 Fleet Street, Chicago, IL 60601",
        subscription: "professional",
        status: "active",
      },
    });

    // Create SaaS Admin
    const adminPassword = await hash("admin123", 12);
    await prisma.user.create({
      data: {
        email: "admin@fleettrack.com",
        password: adminPassword,
        firstName: "System",
        lastName: "Admin",
        role: "saas_admin",
        status: "active",
      },
    });

    // Create Company Admin
    const companyAdminPassword = await hash("company123", 12);
    await prisma.user.create({
      data: {
        email: "admin@acmetrucking.com",
        password: companyAdminPassword,
        firstName: "Mike",
        lastName: "Johnson",
        role: "company_admin",
        status: "active",
        organizationId: organization.id,
      },
    });

    // Create Fleet Manager
    const fleetManagerPassword = await hash("fleet123", 12);
    await prisma.user.create({
      data: {
        email: "fleet@acmetrucking.com",
        password: fleetManagerPassword,
        firstName: "Sarah",
        lastName: "Williams",
        role: "fleet_manager",
        status: "active",
        organizationId: organization.id,
      },
    });

    // Create drivers
    const driverPassword = await hash("driver123", 12);
    const driversData = [
      { firstName: "John", lastName: "Smith", email: "john.smith@acmetrucking.com", license: "CDL-A123456", state: "IL" },
      { firstName: "Emily", lastName: "Davis", email: "emily.davis@acmetrucking.com", license: "CDL-B789012", state: "IL" },
      { firstName: "Robert", lastName: "Brown", email: "robert.brown@acmetrucking.com", license: "CDL-C345678", state: "IN" },
      { firstName: "Maria", lastName: "Garcia", email: "maria.garcia@acmetrucking.com", license: "CDL-D901234", state: "WI" },
      { firstName: "James", lastName: "Wilson", email: "james.wilson@acmetrucking.com", license: "CDL-E567890", state: "MI" },
    ];

    const drivers = [];
    for (const driverData of driversData) {
      const user = await prisma.user.create({
        data: {
          email: driverData.email,
          password: driverPassword,
          firstName: driverData.firstName,
          lastName: driverData.lastName,
          role: "driver",
          status: "active",
          organizationId: organization.id,
        },
      });

      const driver = await prisma.driver.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          licenseNumber: driverData.license,
          licenseState: driverData.state,
          licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          dotMedicalExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          safetyScore: 85 + Math.random() * 15,
          totalMiles: Math.floor(Math.random() * 50000) + 10000,
          totalTrips: Math.floor(Math.random() * 500) + 100,
        },
      });

      drivers.push(driver);
    }

    // Create vehicles
    const vehiclesData = [
      { vin: "1FUJA6CK77PY35417", plate: "TRK-001", make: "Freightliner", model: "Cascadia", year: 2022, type: "truck" },
      { vin: "1XKAD40X96J235986", plate: "TRK-002", make: "Kenworth", model: "T680", year: 2021, type: "truck" },
      { vin: "3AKJH5A8XT5T65432", plate: "TRK-003", make: "Peterbilt", model: "579", year: 2023, type: "truck" },
      { vin: "2HKYF18555H523987", plate: "VAN-001", make: "Ford", model: "Transit", year: 2022, type: "van" },
      { vin: "5TDZA23C66S567432", plate: "VAN-002", make: "Mercedes", model: "Sprinter", year: 2021, type: "van" },
      { vin: "1GCEC14Z37Z168432", plate: "TRK-004", make: "Volvo", model: "VNL", year: 2020, type: "truck" },
      { vin: "2G1WF52E949123456", plate: "CAR-001", make: "Chevrolet", model: "Impala", year: 2022, type: "car" },
      { vin: "3FAHP0HA9CR321987", plate: "CAR-002", make: "Ford", model: "Fusion", year: 2021, type: "car" },
    ];

    const vehicles = [];
    for (let i = 0; i < vehiclesData.length; i++) {
      const v = vehiclesData[i];
      const vehicle = await prisma.vehicle.create({
        data: {
          vin: v.vin,
          licensePlate: v.plate,
          make: v.make,
          model: v.model,
          year: v.year,
          type: v.type,
          fuelType: v.type === "car" ? "gasoline" : "diesel",
          status: i < 5 ? "active" : "inactive",
          odometer: Math.floor(Math.random() * 100000) + 20000,
          engineHours: Math.floor(Math.random() * 5000) + 1000,
          organizationId: organization.id,
        },
      });

      // Create IoT device for active vehicles
      if (i < 5) {
        await prisma.iOTDevice.create({
          data: {
            vehicleId: vehicle.id,
            serialNumber: `IOT-${Date.now()}-${i}`,
            type: "gps_tracker",
            status: "online",
            firmware: "v2.1.0",
            lastPing: new Date(),
          },
        });

        // Assign driver to vehicle
        if (i < drivers.length) {
          await prisma.driver.update({
            where: { id: drivers[i].id },
            data: { currentVehicleId: vehicle.id },
          });
        }
      }

      vehicles.push(vehicle);
    }

    // Create sample GPS locations for active vehicles
    for (let i = 0; i < 5; i++) {
      const baseLat = 41.8781 + (Math.random() - 0.5) * 0.5; // Chicago area
      const baseLng = -87.6298 + (Math.random() - 0.5) * 0.5;

      for (let j = 0; j < 10; j++) {
        await prisma.vehicleLocation.create({
          data: {
            vehicleId: vehicles[i].id,
            latitude: baseLat + (Math.random() - 0.5) * 0.1,
            longitude: baseLng + (Math.random() - 0.5) * 0.1,
            speed: Math.random() * 65,
            heading: Math.random() * 360,
            timestamp: new Date(Date.now() - j * 5 * 60 * 1000),
          },
        });
      }
    }

    // Create sample ELD logs
    const eldStatuses = ["off_duty", "sleeper_berth", "driving", "on_duty_not_driving"];
    for (const driver of drivers) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let currentTime = new Date(today);
      for (let i = 0; i < 5; i++) {
        const status = eldStatuses[Math.floor(Math.random() * eldStatuses.length)];
        const duration = Math.floor(Math.random() * 180) + 30; // 30-210 minutes

        await prisma.eLDLog.create({
          data: {
            driverId: driver.id,
            date: today,
            status,
            startTime: new Date(currentTime),
            endTime: new Date(currentTime.getTime() + duration * 60 * 1000),
            duration,
            location: "Chicago, IL",
            certified: Math.random() > 0.3,
          },
        });

        currentTime = new Date(currentTime.getTime() + duration * 60 * 1000);
      }
    }

    // Create sample trips
    const locations = [
      { name: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
      { name: "Milwaukee, WI", lat: 43.0389, lng: -87.9065 },
      { name: "Indianapolis, IN", lat: 39.7684, lng: -86.1581 },
      { name: "Detroit, MI", lat: 42.3314, lng: -83.0458 },
      { name: "St. Louis, MO", lat: 38.627, lng: -90.1994 },
    ];

    for (let i = 0; i < 10; i++) {
      const startLoc = locations[Math.floor(Math.random() * locations.length)];
      const endLoc = locations[Math.floor(Math.random() * locations.length)];
      const vehicleIdx = i % 5;
      const driverIdx = i % drivers.length;

      await prisma.trip.create({
        data: {
          vehicleId: vehicles[vehicleIdx].id,
          driverId: drivers[driverIdx].id,
          startTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          endTime: i < 3 ? null : new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
          startLocation: startLoc.name,
          startLat: startLoc.lat,
          startLng: startLoc.lng,
          endLocation: endLoc.name,
          endLat: endLoc.lat,
          endLng: endLoc.lng,
          distance: Math.random() * 300 + 50,
          duration: Math.floor(Math.random() * 300) + 60,
          fuelUsed: Math.random() * 50 + 10,
          avgSpeed: Math.random() * 30 + 45,
          maxSpeed: Math.random() * 20 + 65,
          status: i < 3 ? "in_progress" : "completed",
        },
      });
    }

    // Create sample incidents
    const incidentTypes = ["accident", "breakdown", "theft", "vandalism", "traffic_violation"];
    const severities = ["minor", "moderate", "major"];

    for (let i = 0; i < 5; i++) {
      const loc = locations[Math.floor(Math.random() * locations.length)];

      await prisma.incident.create({
        data: {
          organizationId: organization.id,
          vehicleId: vehicles[i % vehicles.length].id,
          driverId: i < drivers.length ? drivers[i].id : null,
          type: incidentTypes[Math.floor(Math.random() * incidentTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          description: `Sample incident ${i + 1} - routine report for documentation`,
          latitude: loc.lat + (Math.random() - 0.5) * 0.1,
          longitude: loc.lng + (Math.random() - 0.5) * 0.1,
          location: loc.name,
          status: i < 2 ? "open" : i < 4 ? "investigating" : "resolved",
        },
      });
    }

    // Create sample safety events
    const safetyEventTypes = ["harsh_braking", "harsh_acceleration", "speeding", "distraction", "fatigue"];
    for (const driver of drivers) {
      for (let i = 0; i < 3; i++) {
        const loc = locations[Math.floor(Math.random() * locations.length)];

        await prisma.safetyEvent.create({
          data: {
            driverId: driver.id,
            type: safetyEventTypes[Math.floor(Math.random() * safetyEventTypes.length)],
            severity: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
            latitude: loc.lat + (Math.random() - 0.5) * 0.1,
            longitude: loc.lng + (Math.random() - 0.5) * 0.1,
            speed: Math.random() * 75 + 25,
            timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    // Create sample geofences
    await prisma.geofence.create({
      data: {
        organizationId: organization.id,
        name: "Headquarters",
        description: "Main company headquarters and dispatch center",
        type: "circle",
        coordinates: JSON.stringify({ lat: 41.8781, lng: -87.6298, radius: 500 }),
        color: "#3B82F6",
        alertOnEntry: true,
        alertOnExit: true,
      },
    });

    await prisma.geofence.create({
      data: {
        organizationId: organization.id,
        name: "Warehouse District",
        description: "Primary warehouse and loading zone",
        type: "circle",
        coordinates: JSON.stringify({ lat: 41.8900, lng: -87.6500, radius: 1000 }),
        color: "#10B981",
        alertOnEntry: true,
        alertOnExit: true,
      },
    });

    await prisma.geofence.create({
      data: {
        organizationId: organization.id,
        name: "Restricted Zone",
        description: "No-go zone for vehicles",
        type: "circle",
        coordinates: JSON.stringify({ lat: 41.8600, lng: -87.6100, radius: 750 }),
        color: "#EF4444",
        alertOnEntry: true,
        alertOnExit: false,
      },
    });

    // Create sample alerts
    const alertTypes = ["geofence", "speeding", "maintenance", "eld_violation", "safety"];
    for (let i = 0; i < 10; i++) {
      await prisma.alert.create({
        data: {
          organizationId: organization.id,
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          severity: ["info", "warning", "critical"][Math.floor(Math.random() * 3)],
          title: `Alert ${i + 1}`,
          message: `Sample alert message for testing purposes #${i + 1}`,
          read: i > 5,
          acknowledged: i > 7,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      data: {
        organization: organization.name,
        users: 3 + driversData.length,
        vehicles: vehiclesData.length,
        drivers: driversData.length,
      },
    });
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { error: "Failed to seed database", details: String(error) },
      { status: 500 }
    );
  }
}
