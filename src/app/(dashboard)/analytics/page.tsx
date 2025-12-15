import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/dashboard/Header";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { redirect } from "next/navigation";

async function getAnalyticsData(organizationId?: string) {
  const where = organizationId ? { organizationId } : {};
  const vehicleWhere = organizationId ? { vehicle: { organizationId } } : {};

  const [
    tripStats,
    safetyEvents,
    fuelRecords,
    maintenanceRecords,
    driverStats,
    vehicleCount,
  ] = await Promise.all([
    // Trip statistics
    prisma.trip.aggregate({
      where: vehicleWhere,
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
      where: { driver: where },
      _count: true,
    }),

    // Fuel records for efficiency
    prisma.fuelRecord.findMany({
      where: { vehicle: where },
      orderBy: { date: "desc" },
      take: 30,
    }),

    // Maintenance costs
    prisma.maintenanceRecord.aggregate({
      where: { vehicle: where },
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
          select: { firstName: true, lastName: true },
        },
        _count: {
          select: { safetyEvents: true },
        },
      },
      orderBy: { safetyScore: "desc" },
      take: 10,
    }),

    // Vehicle count
    prisma.vehicle.count({ where }),
  ]);

  // Trip trends (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const tripTrends = await prisma.trip.groupBy({
    by: ["status"],
    where: {
      ...vehicleWhere,
      startTime: { gte: sevenDaysAgo },
    },
    _count: true,
  });

  return {
    tripStats,
    safetyEvents,
    fuelRecords,
    maintenanceRecords,
    driverStats,
    vehicleCount,
    tripTrends,
  };
}

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const allowedRoles = ["saas_admin", "saas_subscriber_manager", "company_admin", "fleet_manager"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  const data = await getAnalyticsData(session.user.organizationId);

  return (
    <>
      <Header
        title="Analytics"
        subtitle="Fleet performance insights and reporting"
      />
      <div className="p-6">
        <AnalyticsDashboard data={data} />
      </div>
    </>
  );
}
