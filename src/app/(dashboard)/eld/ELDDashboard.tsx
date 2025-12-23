"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Select,
  toast,
} from "@/components/ui";
import { StatsCard } from "@/components/dashboard/StatsCard";
import {
  Clock,
  Truck,
  AlertTriangle,
  CheckCircle,
  User,
  Calendar,
  Coffee,
  Moon,
  Navigation,
  Clipboard,
} from "lucide-react";

interface ELDLog {
  id: string;
  date: Date;
  status: string;
  startTime: Date;
  endTime?: Date | null;
  duration?: number | null;
  location?: string | null;
  certified: boolean;
  driver?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

interface Driver {
  id: string;
  status: string;
  user: {
    firstName: string;
    lastName: string;
  };
  currentVehicle?: {
    licensePlate: string;
  } | null;
  eldLogs: ELDLog[];
}

interface ELDDashboardProps {
  drivers: Driver[];
  todayLogs: ELDLog[];
  userRole: string;
}

// DOT HOS Rules (simplified)
const HOS_RULES = {
  maxDriving: 11 * 60, // 11 hours in minutes
  maxOnDuty: 14 * 60, // 14 hours in minutes
  requiredBreak: 30, // 30-minute break required after 8 hours
  maxCycle: 70 * 60, // 70 hours in 8 days
};

export function ELDDashboard({ drivers, todayLogs, userRole }: ELDDashboardProps) {
  const router = useRouter();
  const [selectedDriver, setSelectedDriver] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleUpdateDriverStatus = async (driverId: string, newStatus: string) => {
    setUpdatingStatus(driverId);
    try {
      const response = await fetch(`/api/eld/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status");
      }

      toast.success(`Status updated to ${newStatus.replace(/_/g, " ")}!`);
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleViewFullLog = (driverId: string) => {
    router.push(`/eld/driver/${driverId}?date=${selectedDate}`);
  };

  // Calculate HOS for each driver
  const calculateHOS = (logs: ELDLog[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = logs.filter(
      (log) => new Date(log.date).getTime() === today.getTime()
    );

    let drivingMinutes = 0;
    let onDutyMinutes = 0;

    todayLogs.forEach((log) => {
      const duration = log.duration || 0;
      if (log.status === "driving") {
        drivingMinutes += duration;
        onDutyMinutes += duration;
      } else if (log.status === "on_duty_not_driving") {
        onDutyMinutes += duration;
      }
    });

    return {
      drivingMinutes,
      onDutyMinutes,
      remainingDriving: Math.max(0, HOS_RULES.maxDriving - drivingMinutes),
      remainingOnDuty: Math.max(0, HOS_RULES.maxOnDuty - onDutyMinutes),
      violations:
        drivingMinutes > HOS_RULES.maxDriving ||
        onDutyMinutes > HOS_RULES.maxOnDuty,
    };
  };

  // Calculate summary stats
  const totalDrivers = drivers.length;
  const driversInCompliance = drivers.filter((d) => {
    const hos = calculateHOS(d.eldLogs);
    return !hos.violations;
  }).length;
  const driversViolating = totalDrivers - driversInCompliance;
  const uncertifiedLogs = todayLogs.filter((log) => !log.certified).length;

  const filteredDrivers =
    selectedDriver === "all"
      ? drivers
      : drivers.filter((d) => d.id === selectedDriver);

  const statusIcons = {
    off_duty: Coffee,
    sleeper_berth: Moon,
    driving: Navigation,
    on_duty_not_driving: Clipboard,
  };

  const statusColors = {
    off_duty: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    sleeper_berth: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    driving: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    on_duty_not_driving: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const isFleetView = userRole !== "driver";

  return (
    <div className="space-y-6">
      {/* Stats */}
      {isFleetView && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Drivers"
            value={totalDrivers}
            icon="user"
          />
          <StatsCard
            title="In Compliance"
            value={driversInCompliance}
            icon="checkCircle"
            iconColor="text-green-600"
            iconBgColor="bg-green-100 dark:bg-green-900/30"
          />
          <StatsCard
            title="HOS Violations"
            value={driversViolating}
            icon="alertTriangle"
            iconColor="text-red-600"
            iconBgColor="bg-red-100 dark:bg-red-900/30"
          />
          <StatsCard
            title="Uncertified Logs"
            value={uncertifiedLogs}
            icon="clock"
            iconColor="text-yellow-600"
            iconBgColor="bg-yellow-100 dark:bg-yellow-900/30"
          />
        </div>
      )}

      {/* Filters */}
      {isFleetView && (
        <Card variant="bordered">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <Select
              label="Driver"
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              options={[
                { value: "all", label: "All Drivers" },
                ...drivers.map((d) => ({
                  value: d.id,
                  label: `${d.user.firstName} ${d.user.lastName}`,
                })),
              ]}
            />
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Driver HOS Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDrivers.map((driver) => {
          const hos = calculateHOS(driver.eldLogs);
          const StatusIcon = statusIcons[driver.status as keyof typeof statusIcons] || Clock;

          return (
            <Card key={driver.id} variant="bordered">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-purple-600">
                        {driver.user.firstName[0]}
                        {driver.user.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {driver.user.firstName} {driver.user.lastName}
                      </CardTitle>
                      {driver.currentVehicle && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {driver.currentVehicle.licensePlate}
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                      statusColors[driver.status as keyof typeof statusColors] || statusColors.off_duty
                    }`}
                  >
                    <StatusIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {driver.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* HOS Visualization */}
                <div className="space-y-4">
                  {/* Driving Time */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Driving Time</span>
                      <span className="font-medium">
                        {formatTime(hos.drivingMinutes)} / {formatTime(HOS_RULES.maxDriving)}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          hos.drivingMinutes > HOS_RULES.maxDriving
                            ? "bg-red-500"
                            : hos.drivingMinutes > HOS_RULES.maxDriving * 0.8
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min(100, (hos.drivingMinutes / HOS_RULES.maxDriving) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(hos.remainingDriving)} remaining
                    </p>
                  </div>

                  {/* On Duty Time */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">On-Duty Time</span>
                      <span className="font-medium">
                        {formatTime(hos.onDutyMinutes)} / {formatTime(HOS_RULES.maxOnDuty)}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          hos.onDutyMinutes > HOS_RULES.maxOnDuty
                            ? "bg-red-500"
                            : hos.onDutyMinutes > HOS_RULES.maxOnDuty * 0.8
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                        }`}
                        style={{
                          width: `${Math.min(100, (hos.onDutyMinutes / HOS_RULES.maxOnDuty) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(hos.remainingOnDuty)} remaining
                    </p>
                  </div>

                  {/* Status Timeline */}
                  <div className="pt-4 border-t dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Today&apos;s Log
                    </p>
                    <div className="flex gap-1 h-8">
                      {Array.from({ length: 24 }).map((_, hour) => {
                        const hourLogs = driver.eldLogs.filter((log) => {
                          const logDate = new Date(log.date);
                          const today = new Date();
                          if (
                            logDate.toDateString() !== today.toDateString()
                          )
                            return false;
                          const startHour = new Date(log.startTime).getHours();
                          const endHour = log.endTime
                            ? new Date(log.endTime).getHours()
                            : startHour;
                          return hour >= startHour && hour <= endHour;
                        });

                        const status = hourLogs[0]?.status || "off_duty";
                        const colorMap = {
                          off_duty: "bg-gray-200 dark:bg-gray-700",
                          sleeper_berth: "bg-blue-400",
                          driving: "bg-green-400",
                          on_duty_not_driving: "bg-yellow-400",
                        };

                        return (
                          <div
                            key={hour}
                            className={`flex-1 rounded-sm ${
                              colorMap[status as keyof typeof colorMap]
                            }`}
                            title={`${hour}:00 - ${status.replace(/_/g, " ")}`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>12 AM</span>
                      <span>6 AM</span>
                      <span>12 PM</span>
                      <span>6 PM</span>
                      <span>12 AM</span>
                    </div>
                  </div>

                  {/* Violation Warning */}
                  {hos.violations && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span className="text-sm text-red-600 dark:text-red-400">
                        HOS violation detected - exceeded daily limits
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t dark:border-gray-700">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewFullLog(driver.id)}
                  >
                    View Full Log
                  </Button>
                  {userRole === "driver" && (
                    <select
                      value={driver.status}
                      onChange={(e) => handleUpdateDriverStatus(driver.id, e.target.value)}
                      disabled={updatingStatus === driver.id}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                    >
                      <option value="off_duty">Off Duty</option>
                      <option value="sleeper_berth">Sleeper Berth</option>
                      <option value="driving">Driving</option>
                      <option value="on_duty_not_driving">On Duty (Not Driving)</option>
                    </select>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <Card variant="bordered">
        <CardContent>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Status Legend
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Off Duty</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Sleeper Berth</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Driving</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">On Duty (Not Driving)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
