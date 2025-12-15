"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent, toast } from "@/components/ui";
import { X } from "lucide-react";

interface AddOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddOrganizationModal({ isOpen, onClose }: AddOrganizationModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subscription: "trial",
    address: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add organization");
      }

      toast.success("Organization created successfully!");
      router.refresh();
      onClose();
      setFormData({
        name: "",
        email: "",
        phone: "",
        subscription: "trial",
        address: "",
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
          <CardTitle>Add New Organization</CardTitle>
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
              label="Organization Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Acme Trucking Co."
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="contact@company.com"
                required
              />

              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <Select
              label="Subscription Plan"
              value={formData.subscription}
              onChange={(e) =>
                setFormData({ ...formData, subscription: e.target.value })
              }
              options={[
                { value: "trial", label: "Trial (14 days)" },
                { value: "basic", label: "Basic" },
                { value: "professional", label: "Professional" },
                { value: "enterprise", label: "Enterprise" },
              ]}
            />

            <Input
              label="Address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="123 Main Street, Dallas, TX 75001"
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
                Create Organization
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
