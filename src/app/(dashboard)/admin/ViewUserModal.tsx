"use client";

import { Button, Badge } from "@/components/ui";
import { X, Mail, Phone, Building2, Calendar, Clock, Shield } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: string;
  status: string;
  lastLogin?: Date | null;
  createdAt: Date;
  organization?: {
    name: string;
  } | null;
}

interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
  onEdit?: () => void;
}

export function ViewUserModal({
  isOpen,
  onClose,
  user,
  onEdit,
}: ViewUserModalProps) {
  if (!isOpen || !user) return null;

  const roleColors = {
    saas_admin: "danger",
    saas_subscriber_manager: "warning",
    saas_support: "info",
    saas_developer: "default",
    company_admin: "success",
    fleet_manager: "info",
    driver: "default",
    company_support: "default",
  } as const;

  const statusColors = {
    active: "success",
    inactive: "default",
    suspended: "danger",
  } as const;

  const formatRole = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-white">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status & Role */}
            <div className="flex gap-3">
              <Badge
                variant={roleColors[user.role as keyof typeof roleColors] || "default"}
                size="md"
              >
                <Shield className="w-3 h-3 mr-1" />
                {formatRole(user.role)}
              </Badge>
              <Badge
                variant={statusColors[user.status as keyof typeof statusColors] || "default"}
                size="md"
              >
                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
              </Badge>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                User Details
              </h3>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-gray-900 dark:text-white">{user.email}</p>
                  </div>
                </div>

                {user.phone && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm text-gray-900 dark:text-white">{user.phone}</p>
                    </div>
                  </div>
                )}

                {user.organization && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Organization</p>
                      <p className="text-sm text-gray-900 dark:text-white">{user.organization.name}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Last Login</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleString()
                        : "Never logged in"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Account Created</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            {onEdit && (
              <Button onClick={onEdit}>
                Edit User
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
