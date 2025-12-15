"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent, toast } from "@/components/ui";
import { X } from "lucide-react";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSaaSAdmin: boolean;
  organizations?: { id: string; name: string }[];
}

const ROLES = [
  { value: "company_admin", label: "Company Admin" },
  { value: "fleet_manager", label: "Fleet Manager" },
  { value: "driver", label: "Driver" },
  { value: "company_support", label: "Support" },
];

const SAAS_ROLES = [
  { value: "saas_admin", label: "SaaS Admin" },
  { value: "saas_subscriber_manager", label: "Subscriber Manager" },
  { value: "saas_support", label: "SaaS Support" },
  { value: "saas_developer", label: "Developer" },
];

export function AddUserModal({ isOpen, onClose, isSaaSAdmin, organizations = [] }: AddUserModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "fleet_manager",
    organizationId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add user");
      }

      toast.success("User added successfully! Default password: user123");
      router.refresh();
      onClose();
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "fleet_manager",
        organizationId: "",
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

  const availableRoles = isSaaSAdmin ? [...SAAS_ROLES, ...ROLES] : ROLES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <Card variant="elevated" className="relative w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Add New User</CardTitle>
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
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                placeholder="John"
                required
              />

              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                placeholder="Doe"
                required
              />
            </div>

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="john.doe@example.com"
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

            <Select
              label="Role"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              options={availableRoles}
            />

            {isSaaSAdmin && organizations.length > 0 && (
              <Select
                label="Organization"
                value={formData.organizationId}
                onChange={(e) =>
                  setFormData({ ...formData, organizationId: e.target.value })
                }
                options={[
                  { value: "", label: "Select Organization" },
                  ...organizations.map((org) => ({
                    value: org.id,
                    label: org.name,
                  })),
                ]}
              />
            )}

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Default password will be set to: <strong>user123</strong>
              </p>
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
                Add User
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
