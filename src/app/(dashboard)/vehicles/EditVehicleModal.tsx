"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent, toast } from "@/components/ui";
import { X } from "lucide-react";

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
}

interface EditVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
}

export function EditVehicleModal({ isOpen, onClose, vehicle }: EditVehicleModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    licensePlate: "",
    status: "active",
    odometer: 0,
  });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        licensePlate: vehicle.licensePlate,
        status: vehicle.status,
        odometer: vehicle.odometer,
      });
    }
  }, [vehicle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update vehicle");
      }

      toast.success("Vehicle updated successfully!");
      router.refresh();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !vehicle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <Card variant="elevated" className="relative w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Edit Vehicle</CardTitle>
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

            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500">VIN</p>
              <p className="font-mono text-gray-900 dark:text-white">{vehicle.vin}</p>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500">Vehicle</p>
              <p className="text-gray-900 dark:text-white">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
            </div>

            <Input
              label="License Plate"
              value={formData.licensePlate}
              onChange={(e) =>
                setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })
              }
              placeholder="e.g., ABC-1234"
              required
            />

            <Select
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "maintenance", label: "Maintenance" },
                { value: "out_of_service", label: "Out of Service" },
              ]}
            />

            <Input
              label="Odometer (miles)"
              type="number"
              value={formData.odometer.toString()}
              onChange={(e) =>
                setFormData({ ...formData, odometer: parseInt(e.target.value) || 0 })
              }
              min={0}
            />

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
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
