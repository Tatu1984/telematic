"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  toast,
} from "@/components/ui";
import {
  ArrowLeft,
  Clock,
  Truck,
  Coffee,
  Moon,
  Navigation,
  Clipboard,
  CheckCircle,
  AlertTriangle,
  Edit,
  Printer,
  Download,
  MapPin,
} from "lucide-react";

interface ELDLog {
  id: string;
  date: Date;
  status: string;
  startTime: Date;
  endTime?: Date | null;
  duration?: number | null;
  location?: string | null;
  notes?: string | null;
  certified: boolean;
  edited: boolean;
}

interface Driver {
  id: string;
  status: string;
  licenseNumber: string;
  licenseState: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  currentVehicle?: {
    id: string;
    licensePlate: string;
    make: string;
    model: string;
  } | null;
  organization?: {
    name: string;
  } | null;
}

interface DriverELDLogProps {
  driver: Driver;
  eldLogs: ELDLog[];
  weeklyLogs: ELDLog[];
  selectedDate: string;
}

// DOT HOS Rules
const HOS_RULES = {
  maxDriving: 11 * 60, // 11 hours in minutes
  maxOnDuty: 14 * 60, // 14 hours in minutes
  requiredBreak: 30, // 30-minute break required after 8 hours
  maxCycle: 70 * 60, // 70 hours in 8 days
};

export function DriverELDLog({ driver, eldLogs, weeklyLogs, selectedDate }: DriverELDLogProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(selectedDate.split("T")[0]);

  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
    router.push(`/eld/driver/${driver.id}?date=${newDate}`);
  };

  const handleCertifyLog = async () => {
    try {
      const response = await fetch(`/api/eld/certify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: driver.id, date: currentDate }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to certify log");
      }

      toast.success("Log certified successfully!");
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDuration = (minutes: number | null | undefined) => {
    if (!minutes) return "0h 0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Calculate HOS summary for the day
  const calculateDailyHOS = (logs: ELDLog[]) => {
    let drivingMinutes = 0;
    let onDutyMinutes = 0;
    let offDutyMinutes = 0;
    let sleeperMinutes = 0;

    logs.forEach((log) => {
      const duration = log.duration || 0;
      switch (log.status) {
        case "driving":
          drivingMinutes += duration;
          onDutyMinutes += duration;
          break;
        case "on_duty_not_driving":
          onDutyMinutes += duration;
          break;
        case "off_duty":
          offDutyMinutes += duration;
          break;
        case "sleeper_berth":
          sleeperMinutes += duration;
          break;
      }
    });

    return {
      drivingMinutes,
      onDutyMinutes,
      offDutyMinutes,
      sleeperMinutes,
      remainingDriving: Math.max(0, HOS_RULES.maxDriving - drivingMinutes),
      remainingOnDuty: Math.max(0, HOS_RULES.maxOnDuty - onDutyMinutes),
      violations: drivingMinutes > HOS_RULES.maxDriving || onDutyMinutes > HOS_RULES.maxOnDuty,
    };
  };

  // Calculate 7-day/70-hour cycle
  const calculateWeeklyCycle = (logs: ELDLog[]) => {
    let totalOnDuty = 0;
    logs.forEach((log) => {
      if (log.status === "driving" || log.status === "on_duty_not_driving") {
        totalOnDuty += log.duration || 0;
      }
    });
    return {
      used: totalOnDuty,
      remaining: Math.max(0, HOS_RULES.maxCycle - totalOnDuty),
      percentage: (totalOnDuty / HOS_RULES.maxCycle) * 100,
    };
  };

  const dailyHOS = calculateDailyHOS(eldLogs);
  const weeklyCycle = calculateWeeklyCycle(weeklyLogs);
  const isCertified = eldLogs.every((log) => log.certified);
  const hasEdits = eldLogs.some((log) => log.edited);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Generate CSV content
    const headers = ["Date", "Status", "Start Time", "End Time", "Duration", "Location", "Certified"];
    const rows = eldLogs.map((log) => [
      new Date(log.date).toLocaleDateString(),
      statusLabels[log.status as keyof typeof statusLabels] || log.status,
      formatTime(log.startTime),
      log.endTime ? formatTime(log.endTime) : "N/A",
      formatDuration(log.duration),
      log.location || "N/A",
      log.certified ? "Yes" : "No",
    ]);

    const csvContent = [
      // Header info
      `Driver: ${driver.user.firstName} ${driver.user.lastName}`,
      `License: ${driver.licenseNumber} (${driver.licenseState})`,
      `Date: ${currentDate}`,
      `Organization: ${driver.organization?.name || "N/A"}`,
      "",
      headers.join(","),
      ...rows.map((row) => row.join(",")),
      "",
      "HOS Summary",
      `Driving: ${formatDuration(dailyHOS.drivingMinutes)}`,
      `On Duty: ${formatDuration(dailyHOS.onDutyMinutes)}`,
      `Off Duty: ${formatDuration(dailyHOS.offDutyMinutes)}`,
      `Sleeper: ${formatDuration(dailyHOS.sleeperMinutes)}`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ELD_Log_${driver.user.lastName}_${currentDate}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("ELD log exported successfully!");
  };

  const statusIcons = {
    off_duty: Coffee,
    sleeper_berth: Moon,
    driving: Navigation,
    on_duty_not_driving: Clipboard,
  };

  const statusColors = {
    off_duty: "default",
    sleeper_berth: "info",
    driving: "success",
    on_duty_not_driving: "warning",
  } as const;

  const statusLabels = {
    off_duty: "Off Duty",
    sleeper_berth: "Sleeper Berth",
    driving: "Driving",
    on_duty_not_driving: "On Duty (Not Driving)",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/eld")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to ELD
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {driver.user.firstName} {driver.user.lastName}
            </h1>
            <p className="text-sm text-gray-500">
              {driver.organization?.name} | License: {driver.licenseNumber} ({driver.licenseState})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={currentDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
          <Button variant="outline" size="sm" onClick={handlePrint} title="Print ELD Log">
            <Printer className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} title="Export to CSV">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Driver & Vehicle Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Driver Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{driver.user.email}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Current Status</dt>
                <dd>
                  <Badge variant={statusColors[driver.status as keyof typeof statusColors] || "default"}>
                    {driver.status.replace(/_/g, " ")}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">License Number</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{driver.licenseNumber}</dd>
              </div>
              <div>
                <dt className="text-gray-500">License State</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{driver.licenseState}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {driver.currentVehicle ? (
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">License Plate</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {driver.currentVehicle.licensePlate}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Vehicle</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {driver.currentVehicle.make} {driver.currentVehicle.model}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-gray-500 text-sm">No vehicle currently assigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* HOS Summary */}
      <Card variant="bordered">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Hours of Service Summary</CardTitle>
            <div className="flex items-center gap-2">
              {isCertified ? (
                <Badge variant="success">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Certified
                </Badge>
              ) : (
                <Badge variant="warning">Pending Certification</Badge>
              )}
              {hasEdits && <Badge variant="info">Edited</Badge>}
              {dailyHOS.violations && (
                <Badge variant="danger">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  HOS Violation
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Driving Time</p>
              <p className="text-2xl font-bold text-green-600">{formatDuration(dailyHOS.drivingMinutes)}</p>
              <p className="text-xs text-gray-400">{formatDuration(dailyHOS.remainingDriving)} remaining</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">On-Duty Time</p>
              <p className="text-2xl font-bold text-blue-600">{formatDuration(dailyHOS.onDutyMinutes)}</p>
              <p className="text-xs text-gray-400">{formatDuration(dailyHOS.remainingOnDuty)} remaining</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Off-Duty Time</p>
              <p className="text-2xl font-bold text-gray-600">{formatDuration(dailyHOS.offDutyMinutes)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Sleeper Berth</p>
              <p className="text-2xl font-bold text-purple-600">{formatDuration(dailyHOS.sleeperMinutes)}</p>
            </div>
          </div>

          {/* 70-Hour Cycle */}
          <div className="mt-6 pt-6 border-t dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                70-Hour / 8-Day Cycle
              </p>
              <p className="text-sm text-gray-500">
                {formatDuration(weeklyCycle.used)} used / {formatDuration(weeklyCycle.remaining)} remaining
              </p>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  weeklyCycle.percentage > 100
                    ? "bg-red-500"
                    : weeklyCycle.percentage > 80
                    ? "bg-yellow-500"
                    : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(100, weeklyCycle.percentage)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graph Visualization */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="text-base">Daily Log Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Time headers */}
            <div className="flex">
              <div className="w-32" />
              <div className="flex-1 flex justify-between text-xs text-gray-400">
                {Array.from({ length: 25 }).map((_, i) => (
                  <span key={i} className="w-0">
                    {i % 2 === 0 ? i : ""}
                  </span>
                ))}
              </div>
            </div>

            {/* Status rows */}
            {(["off_duty", "sleeper_berth", "driving", "on_duty_not_driving"] as const).map((status) => {
              const StatusIcon = statusIcons[status];
              return (
                <div key={status} className="flex items-center">
                  <div className="w-32 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <StatusIcon className="w-4 h-4" />
                    <span className="truncate">{statusLabels[status]}</span>
                  </div>
                  <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-800 rounded relative">
                    {eldLogs
                      .filter((log) => log.status === status)
                      .map((log) => {
                        const startHour = new Date(log.startTime).getHours() + new Date(log.startTime).getMinutes() / 60;
                        const endTime = log.endTime ? new Date(log.endTime) : new Date();
                        const endHour = endTime.getHours() + endTime.getMinutes() / 60;
                        const width = ((endHour - startHour) / 24) * 100;
                        const left = (startHour / 24) * 100;

                        const colorMap = {
                          off_duty: "bg-gray-400",
                          sleeper_berth: "bg-blue-400",
                          driving: "bg-green-400",
                          on_duty_not_driving: "bg-yellow-400",
                        };

                        return (
                          <div
                            key={log.id}
                            className={`absolute top-1 bottom-1 ${colorMap[status]} rounded`}
                            style={{ left: `${left}%`, width: `${Math.max(1, width)}%` }}
                            title={`${formatTime(log.startTime)} - ${log.endTime ? formatTime(log.endTime) : "ongoing"}`}
                          />
                        );
                      })}
                  </div>
                </div>
              );
            })}

            {/* Time markers */}
            <div className="flex">
              <div className="w-32" />
              <div className="flex-1 relative h-4">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 w-px h-2 bg-gray-300 dark:bg-gray-600"
                    style={{ left: `${(i / 24) * 100}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Log Table */}
      <Card variant="bordered" className="overflow-hidden p-0">
        <CardHeader>
          <CardTitle className="text-base">Detailed Log Entries</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Certified</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eldLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No log entries for this date</p>
                </TableCell>
              </TableRow>
            ) : (
              eldLogs.map((log) => {
                const StatusIcon = statusIcons[log.status as keyof typeof statusIcons] || Clock;
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusIcon className="w-4 h-4" />
                        <Badge variant={statusColors[log.status as keyof typeof statusColors] || "default"} size="sm">
                          {log.status.replace(/_/g, " ")}
                        </Badge>
                        {log.edited && (
                          <span title="This entry was edited">
                            <Edit className="w-3 h-3 text-blue-500" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatTime(log.startTime)}</TableCell>
                    <TableCell>{log.endTime ? formatTime(log.endTime) : "Ongoing"}</TableCell>
                    <TableCell>{formatDuration(log.duration)}</TableCell>
                    <TableCell>
                      {log.location ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {log.location}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{log.notes || "-"}</TableCell>
                    <TableCell>
                      {log.certified ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Certification */}
      {!isCertified && eldLogs.length > 0 && (
        <Card variant="bordered">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Certify Daily Log</p>
                <p className="text-sm text-gray-500">
                  By certifying, you confirm that all entries are true and accurate.
                </p>
              </div>
              <Button onClick={handleCertifyLog}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Certify Log
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
