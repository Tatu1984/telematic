"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent, toast } from "@/components/ui";
import { X } from "lucide-react";

interface Driver {
  id: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: Date;
  status: string;
  safetyScore: number;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  };
}

interface EditDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver | null;
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export function EditDriverModal({ isOpen, onClose, driver }: EditDriverModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    status: "available",
    licenseNumber: "",
    licenseState: "TX",
    licenseExpiry: "",
  });

  useEffect(() => {
    if (driver) {
      setFormData({
        status: driver.status,
        licenseNumber: driver.licenseNumber,
        licenseState: driver.licenseState,
        licenseExpiry: new Date(driver.licenseExpiry).toISOString().split("T")[0],
      });
    }
  }, [driver]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driver) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/drivers/${driver.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update driver");
      }

      toast.success("Driver updated successfully!");
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

  if (!isOpen || !driver) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <Card variant="elevated" className="relative w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Edit Driver</CardTitle>
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
              <p className="text-sm text-gray-500">Driver</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {driver.user.firstName} {driver.user.lastName}
              </p>
              <p className="text-sm text-gray-500">{driver.user.email}</p>
            </div>

            <Select
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              options={[
                { value: "available", label: "Available" },
                { value: "driving", label: "Driving" },
                { value: "off_duty", label: "Off Duty" },
                { value: "sleeper_berth", label: "Sleeper Berth" },
              ]}
            />

            <Input
              label="License Number"
              value={formData.licenseNumber}
              onChange={(e) =>
                setFormData({ ...formData, licenseNumber: e.target.value.toUpperCase() })
              }
              placeholder="DL123456789"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="License State"
                value={formData.licenseState}
                onChange={(e) =>
                  setFormData({ ...formData, licenseState: e.target.value })
                }
                options={US_STATES.map((state) => ({
                  value: state,
                  label: state,
                }))}
              />

              <Input
                label="License Expiry"
                type="date"
                value={formData.licenseExpiry}
                onChange={(e) =>
                  setFormData({ ...formData, licenseExpiry: e.target.value })
                }
                required
              />
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
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
