"use client";

import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import { StatsCard } from "@/components/dashboard/StatsCard";
import {
  Shield,
  TrendingUp,
  Users,
  BarChart3,
  Fuel,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface AnalyticsData {
  tripStats: {
    _sum: {
      distance: number | null;
      fuelUsed: number | null;
      duration: number | null;
      idleTime: number | null;
    };
    _avg: {
      avgSpeed: number | null;
      fuelUsed: number | null;
    };
    _count: number;
  };
  safetyEvents: {
    type: string;
    _count: number;
  }[];
  fuelRecords: {
    id: string;
    date: Date;
    gallons: number;
    totalCost: number;
    odometer: number;
  }[];
  maintenanceRecords: {
    _sum: { cost: number | null };
    _count: number;
  };
  driverStats: {
    id: string;
    safetyScore: number;
    totalMiles: number;
    totalTrips: number;
    user: { firstName: string; lastName: string };
    _count: { safetyEvents: number };
  }[];
  vehicleCount: number;
  tripTrends: {
    status: string;
    _count: number;
  }[];
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const totalDistance = data.tripStats._sum.distance || 0;
  const totalFuel = data.tripStats._sum.fuelUsed || 0;
  const avgSpeed = data.tripStats._avg.avgSpeed || 0;
  const totalTrips = data.tripStats._count;
  const totalIdleTime = data.tripStats._sum.idleTime || 0;
  const maintenanceCost = data.maintenanceRecords._sum.cost || 0;

  // Calculate fuel efficiency
  const fuelEfficiency = totalDistance > 0 ? totalDistance / totalFuel : 0;

  // Prepare safety events data for pie chart
  const safetyEventsData = data.safetyEvents.map((event) => ({
    name: event.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    value: event._count,
  }));

  // Prepare driver performance data
  const driverPerformanceData = data.driverStats.map((driver) => ({
    name: `${driver.user.firstName} ${driver.user.lastName.charAt(0)}.`,
    score: driver.safetyScore,
    trips: driver.totalTrips,
    events: driver._count.safetyEvents,
  }));

  // Prepare fuel cost trend data
  const fuelTrendData = data.fuelRecords
    .slice(0, 14)
    .reverse()
    .map((record) => ({
      date: new Date(record.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      cost: record.totalCost,
      gallons: record.gallons,
    }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Distance"
          value={`${totalDistance.toLocaleString()} mi`}
          icon="route"
          change={{ value: 8, type: "increase" }}
        />
        <StatsCard
          title="Fuel Efficiency"
          value={`${fuelEfficiency.toFixed(1)} mpg`}
          icon="fuel"
          iconColor="text-green-600"
          iconBgColor="bg-green-100 dark:bg-green-900/30"
          change={{ value: 3, type: "increase" }}
        />
        <StatsCard
          title="Total Trips"
          value={totalTrips}
          icon="truck"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100 dark:bg-purple-900/30"
        />
        <StatsCard
          title="Maintenance Cost"
          value={`$${maintenanceCost.toLocaleString()}`}
          icon="dollarSign"
          iconColor="text-red-600"
          iconBgColor="bg-red-100 dark:bg-red-900/30"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Safety Events Distribution */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Safety Events Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {safetyEventsData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={safetyEventsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {safetyEventsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <p className="text-gray-500">No safety events recorded</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Driver Performance */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              Driver Safety Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {driverPerformanceData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={driverPerformanceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <p className="text-gray-500">No driver data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuel Cost Trend */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="w-5 h-5 text-green-500" />
              Fuel Cost Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fuelTrendData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fuelTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cost"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Cost ($)"
                    />
                    <Line
                      type="monotone"
                      dataKey="gallons"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      name="Gallons"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <p className="text-gray-500">No fuel records available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fleet Utilization */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-yellow-500" />
              Fleet Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Active Vehicles</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {data.vehicleCount} vehicles
                  </span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: "75%" }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Average Speed</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {avgSpeed.toFixed(1)} mph
                  </span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(avgSpeed / 80) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Idle Time</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {Math.floor(totalIdleTime / 60)}h {totalIdleTime % 60}m
                  </span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: "25%" }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Fuel Consumed</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {totalFuel.toFixed(0)} gallons
                  </span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: "60%" }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers Table */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Top Performing Drivers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rank</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Driver</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Safety Score</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Total Trips</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Total Miles</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Safety Events</th>
                </tr>
              </thead>
              <tbody>
                {data.driverStats.map((driver, index) => (
                  <tr key={driver.id} className="border-b dark:border-gray-700">
                    <td className="py-3 px-4">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-700"
                            : index === 1
                            ? "bg-gray-200 text-gray-700"
                            : index === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {index + 1}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                      {driver.user.firstName} {driver.user.lastName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              driver.safetyScore >= 90
                                ? "bg-green-500"
                                : driver.safetyScore >= 75
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${driver.safetyScore}%` }}
                          />
                        </div>
                        <span className="text-sm">{driver.safetyScore.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {driver.totalTrips}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {driver.totalMiles.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {driver._count.safetyEvents > 0 ? (
                        <Badge variant="warning" size="sm">
                          {driver._count.safetyEvents}
                        </Badge>
                      ) : (
                        <Badge variant="success" size="sm">
                          0
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
