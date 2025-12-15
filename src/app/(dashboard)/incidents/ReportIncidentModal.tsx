"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent, toast } from "@/components/ui";
import { X } from "lucide-react";

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles?: { id: string; licensePlate: string }[];
  drivers?: { id: string; name: string }[];
}

const INCIDENT_TYPES = [
  { value: "accident", label: "Accident" },
  { value: "breakdown", label: "Breakdown" },
  { value: "theft", label: "Theft" },
  { value: "vandalism", label: "Vandalism" },
  { value: "traffic_violation", label: "Traffic Violation" },
];

const SEVERITIES = [
  { value: "minor", label: "Minor" },
  { value: "moderate", label: "Moderate" },
  { value: "major", label: "Major" },
  { value: "critical", label: "Critical" },
];

export function ReportIncidentModal({ isOpen, onClose, vehicles = [], drivers = [] }: ReportIncidentModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    type: "accident",
    severity: "moderate",
    description: "",
    location: "",
    latitude: "",
    longitude: "",
    vehicleId: "",
    driverId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          severity: formData.severity,
          description: formData.description,
          location: formData.location || null,
          latitude: formData.latitude ? parseFloat(formData.latitude) : 32.7767,
          longitude: formData.longitude ? parseFloat(formData.longitude) : -96.7970,
          vehicleId: formData.vehicleId || null,
          driverId: formData.driverId || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to report incident");
      }

      toast.success("Incident reported successfully!");
      router.refresh();
      onClose();
      setFormData({
        type: "accident",
        severity: "moderate",
        description: "",
        location: "",
        latitude: "",
        longitude: "",
        vehicleId: "",
        driverId: "",
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
          <CardTitle>Report Incident</CardTitle>
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

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Incident Type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                options={INCIDENT_TYPES}
              />

              <Select
                label="Severity"
                value={formData.severity}
                onChange={(e) =>
                  setFormData({ ...formData, severity: e.target.value })
                }
                options={SEVERITIES}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the incident..."
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Input
              label="Location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="e.g., I-35 near Exit 442"
            />

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
              />
            </div>

            {vehicles.length > 0 && (
              <Select
                label="Vehicle (Optional)"
                value={formData.vehicleId}
                onChange={(e) =>
                  setFormData({ ...formData, vehicleId: e.target.value })
                }
                options={[
                  { value: "", label: "Select Vehicle" },
                  ...vehicles.map((v) => ({
                    value: v.id,
                    label: v.licensePlate,
                  })),
                ]}
              />
            )}

            {drivers.length > 0 && (
              <Select
                label="Driver (Optional)"
                value={formData.driverId}
                onChange={(e) =>
                  setFormData({ ...formData, driverId: e.target.value })
                }
                options={[
                  { value: "", label: "Select Driver" },
                  ...drivers.map((d) => ({
                    value: d.id,
                    label: d.name,
                  })),
                ]}
              />
            )}

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
                Report Incident
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
