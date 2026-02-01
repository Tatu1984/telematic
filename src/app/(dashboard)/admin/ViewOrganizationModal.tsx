"use client";

import { Button, Badge } from "@/components/ui";
import { X, Building2, Mail, Phone, MapPin, Calendar, Users, Truck, UserCheck } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  subscription: string;
  status: string;
  createdAt: Date;
  _count: {
    users: number;
    vehicles: number;
    drivers: number;
  };
}

interface ViewOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
  onEdit?: () => void;
}

export function ViewOrganizationModal({
  isOpen,
  onClose,
  organization,
  onEdit,
}: ViewOrganizationModalProps) {
  if (!isOpen || !organization) return null;

  const subscriptionColors = {
    trial: "warning",
    basic: "default",
    professional: "info",
    enterprise: "success",
  } as const;

  const statusColors = {
    active: "success",
    inactive: "default",
    suspended: "danger",
  } as const;

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
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {organization.name}
                </h2>
                <p className="text-sm text-gray-500">{organization.slug}</p>
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
            {/* Status & Subscription */}
            <div className="flex gap-3">
              <Badge
                variant={subscriptionColors[organization.subscription as keyof typeof subscriptionColors] || "default"}
                size="md"
              >
                {organization.subscription.charAt(0).toUpperCase() + organization.subscription.slice(1)} Plan
              </Badge>
              <Badge
                variant={statusColors[organization.status as keyof typeof statusColors] || "default"}
                size="md"
              >
                {organization.status.charAt(0).toUpperCase() + organization.status.slice(1)}
              </Badge>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <Users className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {organization._count.users}
                </p>
                <p className="text-sm text-gray-500">Users</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <Truck className="w-5 h-5 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {organization._count.vehicles}
                </p>
                <p className="text-sm text-gray-500">Vehicles</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <UserCheck className="w-5 h-5 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {organization._count.drivers}
                </p>
                <p className="text-sm text-gray-500">Drivers</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Contact Information
              </h3>
              {organization.email && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>{organization.email}</span>
                </div>
              )}
              {organization.phone && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span>{organization.phone}</span>
                </div>
              )}
              {organization.address && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{organization.address}</span>
                </div>
              )}
              {!organization.email && !organization.phone && !organization.address && (
                <p className="text-gray-400 italic">No contact information available</p>
              )}
            </div>

            {/* Created Date */}
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <Calendar className="w-4 h-4" />
              <span>Created on {new Date(organization.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            {onEdit && (
              <Button onClick={onEdit}>
                Edit Organization
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
