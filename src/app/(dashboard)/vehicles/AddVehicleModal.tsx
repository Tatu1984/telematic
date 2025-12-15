"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent, toast } from "@/components/ui";
import { X } from "lucide-react";

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddVehicleModal({ isOpen, onClose }: AddVehicleModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    vin: "",
    licensePlate: "",
    make: "",
    model: "",
    year: new Date().getFullYear().toString(),
    type: "truck",
    fuelType: "diesel",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          year: parseInt(formData.year),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add vehicle");
      }

      toast.success("Vehicle added successfully!");
      router.refresh();
      onClose();
      setFormData({
        vin: "",
        licensePlate: "",
        make: "",
        model: "",
        year: new Date().getFullYear().toString(),
        type: "truck",
        fuelType: "diesel",
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
          <CardTitle>Add New Vehicle</CardTitle>
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
              label="VIN"
              value={formData.vin}
              onChange={(e) =>
                setFormData({ ...formData, vin: e.target.value.toUpperCase() })
              }
              placeholder="Enter 17-character VIN"
              required
              maxLength={17}
            />

            <Input
              label="License Plate"
              value={formData.licensePlate}
              onChange={(e) =>
                setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })
              }
              placeholder="e.g., ABC-1234"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Make"
                value={formData.make}
                onChange={(e) =>
                  setFormData({ ...formData, make: e.target.value })
                }
                placeholder="e.g., Freightliner"
                required
              />

              <Input
                label="Model"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                placeholder="e.g., Cascadia"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Year"
                type="number"
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: e.target.value })
                }
                min={1990}
                max={new Date().getFullYear() + 1}
                required
              />

              <Select
                label="Vehicle Type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                options={[
                  { value: "truck", label: "Truck" },
                  { value: "van", label: "Van" },
                  { value: "car", label: "Car" },
                  { value: "trailer", label: "Trailer" },
                ]}
              />
            </div>

            <Select
              label="Fuel Type"
              value={formData.fuelType}
              onChange={(e) =>
                setFormData({ ...formData, fuelType: e.target.value })
              }
              options={[
                { value: "diesel", label: "Diesel" },
                { value: "gasoline", label: "Gasoline" },
                { value: "electric", label: "Electric" },
                { value: "hybrid", label: "Hybrid" },
              ]}
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
                Add Vehicle
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
