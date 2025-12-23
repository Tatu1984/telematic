"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Button,
  Badge,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  DropdownMenu,
  ConfirmDialog,
  toast,
} from "@/components/ui";
import { Plus, Search, User, Truck, Shield, AlertTriangle, Edit, Trash2, Eye } from "lucide-react";
import { AddDriverModal } from "./AddDriverModal";
import { EditDriverModal } from "./EditDriverModal";

interface Driver {
  id: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: Date;
  status: string;
  safetyScore: number;
  totalMiles: number;
  totalTrips: number;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  };
  currentVehicle?: {
    licensePlate: string;
    make: string;
    model: string;
  } | null;
  _count: {
    trips: number;
    incidents: number;
    safetyEvents: number;
  };
}

interface DriversListProps {
  drivers: Driver[];
  userRole: string;
}

export function DriversList({ drivers, userRole }: DriversListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [deletingDriver, setDeletingDriver] = useState<Driver | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteDriver = async () => {
    if (!deletingDriver) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/drivers/${deletingDriver.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete driver");
      }

      toast.success("Driver deleted successfully!");
      router.refresh();
      setDeletingDriver(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const canEditDriver = ["saas_admin", "company_admin", "fleet_manager"].includes(userRole);
  const canDeleteDriver = ["saas_admin", "company_admin"].includes(userRole);

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      driver.user.lastName.toLowerCase().includes(search.toLowerCase()) ||
      driver.user.email.toLowerCase().includes(search.toLowerCase()) ||
      driver.licenseNumber.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || driver.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    available: "success",
    driving: "info",
    off_duty: "default",
    sleeper_berth: "warning",
  } as const;

  const getSafetyScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const canAddDriver = ["saas_admin", "company_admin", "fleet_manager"].includes(userRole);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card variant="bordered">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search drivers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              {["all", "available", "driving", "off_duty", "sleeper_berth"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      statusFilter === status
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {status === "all"
                      ? "All"
                      : status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </button>
                )
              )}
            </div>
          </div>

          {canAddDriver && (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Driver
            </Button>
          )}
        </div>
      </Card>

      {/* Drivers Table */}
      <Card variant="bordered" className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Safety Score</TableHead>
              <TableHead>Stats</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDrivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No drivers found
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredDrivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-600">
                          {driver.user.firstName[0]}
                          {driver.user.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {driver.user.firstName} {driver.user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {driver.user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        statusColors[driver.status as keyof typeof statusColors] ||
                        "default"
                      }
                    >
                      {driver.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-gray-900 dark:text-white">
                        {driver.licenseNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        {driver.licenseState}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {driver.currentVehicle ? (
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">
                          {driver.currentVehicle.licensePlate}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield
                        className={`w-4 h-4 ${getSafetyScoreColor(driver.safetyScore)}`}
                      />
                      <span
                        className={`font-medium ${getSafetyScoreColor(driver.safetyScore)}`}
                      >
                        {driver.safetyScore.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-gray-500">
                        {driver.totalTrips} trips
                      </div>
                      <div className="text-gray-500">
                        {driver.totalMiles.toLocaleString()} mi
                      </div>
                      {driver._count.safetyEvents > 0 && (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <AlertTriangle className="w-4 h-4" />
                          {driver._count.safetyEvents}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu
                      items={[
                        {
                          label: "View Details",
                          icon: <Eye className="w-4 h-4" />,
                          onClick: () => setEditingDriver(driver),
                        },
                        ...(canEditDriver
                          ? [
                              {
                                label: "Edit Driver",
                                icon: <Edit className="w-4 h-4" />,
                                onClick: () => setEditingDriver(driver),
                              },
                            ]
                          : []),
                        ...(canDeleteDriver
                          ? [
                              {
                                label: "Delete Driver",
                                icon: <Trash2 className="w-4 h-4" />,
                                onClick: () => setDeletingDriver(driver),
                                variant: "danger" as const,
                              },
                            ]
                          : []),
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add Driver Modal */}
      <AddDriverModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {/* Edit Driver Modal */}
      <EditDriverModal
        isOpen={!!editingDriver}
        onClose={() => setEditingDriver(null)}
        driver={editingDriver}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingDriver}
        onClose={() => setDeletingDriver(null)}
        onConfirm={handleDeleteDriver}
        title="Delete Driver"
        message={`Are you sure you want to delete ${deletingDriver?.user.firstName} ${deletingDriver?.user.lastName}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
