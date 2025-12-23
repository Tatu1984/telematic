"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  ConfirmDialog,
  toast,
} from "@/components/ui";
import { StatsCard } from "@/components/dashboard/StatsCard";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Bell,
  BellOff,
  Circle,
  Pentagon,
  RefreshCw,
} from "lucide-react";
import { AddGeofenceModal } from "./AddGeofenceModal";

const GeofenceMap = dynamic(() => import("./GeofenceMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
        <p className="text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});

interface Geofence {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  coordinates: string;
  color: string;
  alertOnEntry: boolean;
  alertOnExit: boolean;
  status: string;
  createdAt: Date;
  _count: {
    alerts: number;
  };
}

interface GeofenceManagerProps {
  geofences: Geofence[];
}

export function GeofenceManager({ geofences }: GeofenceManagerProps) {
  const router = useRouter();
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingGeofence, setDeletingGeofence] = useState<Geofence | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteGeofence = async () => {
    if (!deletingGeofence) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/geofences/${deletingGeofence.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete geofence");
      }

      toast.success("Geofence deleted successfully!");
      router.refresh();
      setDeletingGeofence(null);
      setSelectedGeofence(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleGeofenceStatus = async (geofence: Geofence) => {
    try {
      const newStatus = geofence.status === "active" ? "inactive" : "active";
      const response = await fetch(`/api/geofences/${geofence.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update geofence");
      }

      toast.success(`Geofence ${newStatus === "active" ? "activated" : "deactivated"} successfully!`);
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    }
  };

  const activeGeofences = geofences.filter((g) => g.status === "active").length;
  const totalAlerts = geofences.reduce((sum, g) => sum + g._count.alerts, 0);
  const circleGeofences = geofences.filter((g) => g.type === "circle").length;
  const polygonGeofences = geofences.filter((g) => g.type === "polygon").length;

  const parsedGeofences = geofences.map((g) => ({
    ...g,
    parsedCoordinates: JSON.parse(g.coordinates),
  }));

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Geofences"
          value={geofences.length}
          icon="mapPin"
        />
        <StatsCard
          title="Active"
          value={activeGeofences}
          icon="bell"
          iconColor="text-green-600"
          iconBgColor="bg-green-100 dark:bg-green-900/30"
        />
        <StatsCard
          title="Circle Zones"
          value={circleGeofences}
          icon="circle"
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatsCard
          title="Triggered Alerts"
          value={totalAlerts}
          icon="bell"
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100 dark:bg-yellow-900/30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Geofence List */}
        <div className="lg:col-span-1 space-y-4">
          <Card variant="bordered">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Geofences</CardTitle>
              <Button size="sm" onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </CardHeader>
            <CardContent className="p-0 max-h-[600px] overflow-y-auto">
              <div className="divide-y dark:divide-gray-700">
                {geofences.length === 0 ? (
                  <div className="p-8 text-center">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No geofences defined</p>
                    <Button className="mt-4" onClick={() => setIsCreating(true)}>
                      Create First Geofence
                    </Button>
                  </div>
                ) : (
                  geofences.map((geofence) => {
                    const isSelected = selectedGeofence?.id === geofence.id;

                    return (
                      <button
                        key={geofence.id}
                        onClick={() =>
                          setSelectedGeofence(isSelected ? null : geofence)
                        }
                        className={`w-full p-4 text-left transition-colors ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-4 h-4 rounded-full mt-1"
                            style={{ backgroundColor: geofence.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {geofence.name}
                              </p>
                              <Badge
                                variant={geofence.status === "active" ? "success" : "default"}
                                size="sm"
                              >
                                {geofence.status}
                              </Badge>
                            </div>
                            {geofence.description && (
                              <p className="text-sm text-gray-500 truncate">
                                {geofence.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                {geofence.type === "circle" ? (
                                  <Circle className="w-3 h-3" />
                                ) : (
                                  <Pentagon className="w-3 h-3" />
                                )}
                                {geofence.type}
                              </span>
                              <span className="flex items-center gap-1">
                                {geofence.alertOnEntry && <Bell className="w-3 h-3" />}
                                {geofence.alertOnExit && <BellOff className="w-3 h-3" />}
                              </span>
                              <span>{geofence._count.alerts} alerts</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <Card variant="bordered" className="overflow-hidden">
            <GeofenceMap
              geofences={parsedGeofences}
              selectedId={selectedGeofence?.id || null}
              onSelect={(id) => {
                const geofence = geofences.find((g) => g.id === id);
                setSelectedGeofence(geofence || null);
              }}
            />
          </Card>

          {/* Selected Geofence Details */}
          {selectedGeofence && (
            <Card variant="bordered" className="mt-4">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedGeofence.color }}
                  />
                  {selectedGeofence.name}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleGeofenceStatus(selectedGeofence)}
                  >
                    {selectedGeofence.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeletingGeofence(selectedGeofence)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">
                      {selectedGeofence.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge variant={selectedGeofence.status === "active" ? "success" : "default"}>
                      {selectedGeofence.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Entry Alert</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedGeofence.alertOnEntry ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Exit Alert</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedGeofence.alertOnExit ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                </div>
                {selectedGeofence.description && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="text-gray-900 dark:text-white">
                      {selectedGeofence.description}
                    </p>
                  </div>
                )}
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedGeofence.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Geofence Modal */}
      <AddGeofenceModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingGeofence}
        onClose={() => setDeletingGeofence(null)}
        onConfirm={handleDeleteGeofence}
        title="Delete Geofence"
        message={`Are you sure you want to delete "${deletingGeofence?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
