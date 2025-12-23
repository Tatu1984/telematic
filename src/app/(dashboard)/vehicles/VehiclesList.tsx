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
import { Plus, Search, Truck, MapPin, AlertTriangle, Edit, Trash2, Eye } from "lucide-react";
import { AddVehicleModal } from "./AddVehicleModal";
import { EditVehicleModal } from "./EditVehicleModal";

interface Vehicle {
  id: string;
  vin: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  type: string;
  fuelType: string;
  status: string;
  odometer: number;
  currentDriver?: {
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  iotDevice?: {
    status: string;
    type: string;
  } | null;
  _count: {
    trips: number;
    incidents: number;
  };
}

interface VehiclesListProps {
  vehicles: Vehicle[];
  userRole: string;
}

export function VehiclesList({ vehicles, userRole }: VehiclesListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteVehicle = async () => {
    if (!deletingVehicle) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/vehicles/${deletingVehicle.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete vehicle");
      }

      toast.success("Vehicle deleted successfully!");
      router.refresh();
      setDeletingVehicle(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const canEditVehicle = ["saas_admin", "company_admin", "fleet_manager"].includes(userRole);
  const canDeleteVehicle = ["saas_admin", "company_admin"].includes(userRole);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.vin.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || vehicle.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    active: "success",
    inactive: "default",
    maintenance: "warning",
    out_of_service: "danger",
  } as const;

  const canAddVehicle = ["saas_admin", "company_admin", "fleet_manager"].includes(userRole);

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
                placeholder="Search vehicles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              {["all", "active", "inactive", "maintenance", "out_of_service"].map(
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

          {canAddVehicle && (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          )}
        </div>
      </Card>

      {/* Vehicles Table */}
      <Card variant="bordered" className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Odometer</TableHead>
              <TableHead>IoT Device</TableHead>
              <TableHead>Stats</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No vehicles found
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Truck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {vehicle.licensePlate}
                        </p>
                        <p className="text-sm text-gray-500">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        statusColors[vehicle.status as keyof typeof statusColors] ||
                        "default"
                      }
                    >
                      {vehicle.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {vehicle.currentDriver ? (
                      <span className="text-gray-900 dark:text-white">
                        {vehicle.currentDriver.user.firstName}{" "}
                        {vehicle.currentDriver.user.lastName}
                      </span>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-900 dark:text-white">
                      {vehicle.odometer.toLocaleString()} mi
                    </span>
                  </TableCell>
                  <TableCell>
                    {vehicle.iotDevice ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            vehicle.iotDevice.status === "online"
                              ? "bg-green-500"
                              : "bg-gray-400"
                          }`}
                        />
                        <span className="text-sm text-gray-500">
                          {vehicle.iotDevice.type}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No device</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <MapPin className="w-4 h-4" />
                        {vehicle._count.trips}
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <AlertTriangle className="w-4 h-4" />
                        {vehicle._count.incidents}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu
                      items={[
                        {
                          label: "View Details",
                          icon: <Eye className="w-4 h-4" />,
                          onClick: () => setEditingVehicle(vehicle),
                        },
                        ...(canEditVehicle
                          ? [
                              {
                                label: "Edit Vehicle",
                                icon: <Edit className="w-4 h-4" />,
                                onClick: () => setEditingVehicle(vehicle),
                              },
                            ]
                          : []),
                        ...(canDeleteVehicle
                          ? [
                              {
                                label: "Delete Vehicle",
                                icon: <Trash2 className="w-4 h-4" />,
                                onClick: () => setDeletingVehicle(vehicle),
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

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {/* Edit Vehicle Modal */}
      <EditVehicleModal
        isOpen={!!editingVehicle}
        onClose={() => setEditingVehicle(null)}
        vehicle={editingVehicle}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingVehicle}
        onClose={() => setDeletingVehicle(null)}
        onConfirm={handleDeleteVehicle}
        title="Delete Vehicle"
        message={`Are you sure you want to delete ${deletingVehicle?.licensePlate}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
