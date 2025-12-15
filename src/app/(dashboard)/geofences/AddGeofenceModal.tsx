"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent, toast } from "@/components/ui";
import { X } from "lucide-react";

interface AddGeofenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = [
  { value: "#3B82F6", label: "Blue" },
  { value: "#10B981", label: "Green" },
  { value: "#F59E0B", label: "Yellow" },
  { value: "#EF4444", label: "Red" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#EC4899", label: "Pink" },
];

export function AddGeofenceModal({ isOpen, onClose }: AddGeofenceModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "circle",
    latitude: "",
    longitude: "",
    radius: "500",
    color: "#3B82F6",
    alertOnEntry: true,
    alertOnExit: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Build coordinates based on type
      let coordinates;
      if (formData.type === "circle") {
        coordinates = {
          center: [parseFloat(formData.latitude), parseFloat(formData.longitude)],
          radius: parseFloat(formData.radius),
        };
      } else {
        // For polygon, create a simple square around the center point
        const lat = parseFloat(formData.latitude);
        const lng = parseFloat(formData.longitude);
        const offset = 0.005; // approximately 500m
        coordinates = [
          [lat + offset, lng - offset],
          [lat + offset, lng + offset],
          [lat - offset, lng + offset],
          [lat - offset, lng - offset],
        ];
      }

      const response = await fetch("/api/geofences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          type: formData.type,
          coordinates: JSON.stringify(coordinates),
          color: formData.color,
          alertOnEntry: formData.alertOnEntry,
          alertOnExit: formData.alertOnExit,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create geofence");
      }

      toast.success("Geofence created successfully!");
      router.refresh();
      onClose();
      setFormData({
        name: "",
        description: "",
        type: "circle",
        latitude: "",
        longitude: "",
        radius: "500",
        color: "#3B82F6",
        alertOnEntry: true,
        alertOnExit: true,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <Card variant="elevated" className="relative w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Create New Geofence</CardTitle>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <Input
              label="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Dallas Depot"
              required
            />

            <Input
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Optional description"
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                options={[
                  { value: "circle", label: "Circle" },
                  { value: "polygon", label: "Polygon" },
                ]}
              />

              <Select
                label="Color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                options={COLORS}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) =>
                  setFormData({ ...formData, latitude: e.target.value })
                }
                placeholder="32.7767"
                required
              />

              <Input
                label="Longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) =>
                  setFormData({ ...formData, longitude: e.target.value })
                }
                placeholder="-96.7970"
                required
              />
            </div>

            {formData.type === "circle" && (
              <Input
                label="Radius (meters)"
                type="number"
                value={formData.radius}
                onChange={(e) =>
                  setFormData({ ...formData, radius: e.target.value })
                }
                placeholder="500"
                required
              />
            )}

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Alert Settings
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.alertOnEntry}
                    onChange={(e) =>
                      setFormData({ ...formData, alertOnEntry: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Alert on Entry</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.alertOnExit}
                    onChange={(e) =>
                      setFormData({ ...formData, alertOnExit: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Alert on Exit</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" loading={loading}>
                Create Geofence
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
