import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/dashboard/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { QuickActionCards } from "@/components/dashboard/QuickActionCards";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import {
  AlertTriangle,
  Route,
  MapPin,
} from "lucide-react";
import Link from "next/link";

async function getFleetStats(organizationId?: string) {
  const where = organizationId ? { organizationId } : {};

  const [
    totalVehicles,
    activeVehicles,
    totalDrivers,
    activeAlerts,
    recentIncidents,
    recentTrips,
  ] = await Promise.all([
    prisma.vehicle.count({ where }),
    prisma.vehicle.count({ where: { ...where, status: "active" } }),
    prisma.driver.count({ where }),
    prisma.alert.count({
      where: { ...where, acknowledged: false },
    }),
    prisma.incident.findMany({
      where: { ...where, status: { in: ["open", "investigating"] } },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { vehicle: true, driver: { include: { user: true } } },
    }),
    prisma.trip.findMany({
      where: organizationId
        ? { vehicle: { organizationId } }
        : {},
      take: 5,
      orderBy: { startTime: "desc" },
      include: { vehicle: true, driver: { include: { user: true } } },
    }),
  ]);

  return {
    totalVehicles,
    activeVehicles,
    totalDrivers,
    activeAlerts,
    recentIncidents,
    recentTrips,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const stats = await getFleetStats(session?.user?.organizationId);

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={`Welcome back, ${session?.user?.firstName}`}
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Vehicles"
            value={stats.totalVehicles}
            icon="truck"
            change={{ value: 12, type: "increase" }}
          />
          <StatsCard
            title="Active Vehicles"
            value={stats.activeVehicles}
            icon="mapPin"
            iconColor="text-green-600"
            iconBgColor="bg-green-100 dark:bg-green-900/30"
          />
          <StatsCard
            title="Total Drivers"
            value={stats.totalDrivers}
            icon="users"
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100 dark:bg-purple-900/30"
          />
          <StatsCard
            title="Active Alerts"
            value={stats.activeAlerts}
            icon="alertTriangle"
            iconColor="text-red-600"
            iconBgColor="bg-red-100 dark:bg-red-900/30"
          />
        </div>

        {/* Quick Actions */}
        <QuickActionCards />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Incidents */}
          <Card variant="bordered">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Recent Incidents
              </CardTitle>
              <Link
                href="/incidents"
                className="text-sm text-blue-600 hover:underline"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {stats.recentIncidents.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  No recent incidents
                </p>
              ) : (
                <div className="space-y-4">
                  {stats.recentIncidents.map((incident) => (
                    <IncidentItem key={incident.id} incident={incident} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Trips */}
          <Card variant="bordered">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5 text-blue-500" />
                Recent Trips
              </CardTitle>
              <Link
                href="/vehicles"
                className="text-sm text-blue-600 hover:underline"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {stats.recentTrips.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  No recent trips
                </p>
              ) : (
                <div className="space-y-4">
                  {stats.recentTrips.map((trip) => (
                    <TripItem key={trip.id} trip={trip} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Fleet Overview Map Placeholder */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              Fleet Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Live map view will appear here
                </p>
                <Link
                  href="/tracking"
                  className="mt-4 inline-block text-blue-600 hover:underline"
                >
                  Open Live Tracking
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

interface IncidentItemProps {
  incident: {
    id: string;
    type: string;
    severity: string;
    description: string;
    status: string;
    createdAt: Date;
    vehicle?: { licensePlate: string } | null;
    driver?: { user: { firstName: string; lastName: string } } | null;
  };
}

function IncidentItem({ incident }: IncidentItemProps) {
  const severityColors = {
    minor: "success",
    moderate: "warning",
    major: "danger",
    critical: "danger",
  } as const;

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {incident.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </p>
          <Badge
            variant={severityColors[incident.severity as keyof typeof severityColors] || "default"}
            size="sm"
          >
            {incident.severity}
          </Badge>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {incident.description}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
          {incident.vehicle && <span>{incident.vehicle.licensePlate}</span>}
          {incident.driver && (
            <span>
              {incident.driver.user.firstName} {incident.driver.user.lastName}
            </span>
          )}
        </div>
      </div>
      <Badge variant={incident.status === "open" ? "danger" : "warning"} size="sm">
        {incident.status}
      </Badge>
    </div>
  );
}

interface TripItemProps {
  trip: {
    id: string;
    startLocation: string;
    endLocation?: string | null;
    status: string;
    distance?: number | null;
    startTime: Date;
    vehicle: { licensePlate: string };
    driver: { user: { firstName: string; lastName: string } };
  };
}

function TripItem({ trip }: TripItemProps) {
  const statusColors = {
    scheduled: "info",
    in_progress: "warning",
    completed: "success",
    cancelled: "danger",
  } as const;

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {trip.startLocation}
          {trip.endLocation && ` → ${trip.endLocation}`}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
          <span>{trip.vehicle.licensePlate}</span>
          <span>•</span>
          <span>
            {trip.driver.user.firstName} {trip.driver.user.lastName}
          </span>
          {trip.distance && (
            <>
              <span>•</span>
              <span>{trip.distance.toFixed(1)} miles</span>
            </>
          )}
        </div>
      </div>
      <Badge
        variant={statusColors[trip.status as keyof typeof statusColors] || "default"}
        size="sm"
      >
        {trip.status.replace(/_/g, " ")}
      </Badge>
    </div>
  );
}
