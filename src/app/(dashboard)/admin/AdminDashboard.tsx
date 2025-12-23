"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  DropdownMenu,
  ConfirmDialog,
  toast,
} from "@/components/ui";
import { StatsCard } from "@/components/dashboard/StatsCard";
import {
  Building2,
  Users,
  Truck,
  UserCheck,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  UserX,
  UserCog,
} from "lucide-react";
import { AddUserModal } from "./AddUserModal";
import { AddOrganizationModal } from "./AddOrganizationModal";
import { EditOrganizationModal } from "./EditOrganizationModal";
import { EditUserModal } from "./EditUserModal";

interface Organization {
  id: string;
  name: string;
  slug: string;
  email?: string | null;
  subscription: string;
  status: string;
  createdAt: Date;
  _count: {
    users: number;
    vehicles: number;
    drivers: number;
  };
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  lastLogin?: Date | null;
  createdAt: Date;
  organization?: {
    name: string;
  } | null;
}

interface AdminDashboardProps {
  organizations: Organization[];
  users: User[];
  systemStats: {
    totalOrganizations: number;
    totalUsers: number;
    totalVehicles: number;
    totalDrivers: number;
  };
  isSaaSAdmin: boolean;
  userRole: string;
}

export function AdminDashboard({
  organizations,
  users,
  systemStats,
  isSaaSAdmin,
}: AdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(isSaaSAdmin ? "organizations" : "users");
  const [search, setSearch] = useState("");
  const [showUserModal, setShowUserModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleDeleteOrg = async () => {
    if (!deletingOrg) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/admin/organizations/${deletingOrg.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete organization");
      }

      toast.success("Organization deleted successfully!");
      router.refresh();
      setDeletingOrg(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete user");
      }

      toast.success("User deleted successfully!");
      router.refresh();
      setDeletingUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      const newStatus = user.status === "active" ? "inactive" : "active";
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user");
      }

      toast.success(`User ${newStatus === "active" ? "activated" : "deactivated"} successfully!`);
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    }
  };

  const tabs = isSaaSAdmin
    ? [
        { id: "organizations", label: "Organizations", icon: Building2 },
        { id: "users", label: "Users", icon: Users },
      ]
    : [{ id: "users", label: "Users", icon: Users }];

  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName.toLowerCase().includes(search.toLowerCase())
  );

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

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isSaaSAdmin && (
          <StatsCard
            title="Organizations"
            value={systemStats.totalOrganizations}
            icon="building2"
          />
        )}
        <StatsCard
          title="Total Users"
          value={systemStats.totalUsers}
          icon="users"
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatsCard
          title="Total Vehicles"
          value={systemStats.totalVehicles}
          icon="truck"
          iconColor="text-green-600"
          iconBgColor="bg-green-100 dark:bg-green-900/30"
        />
        <StatsCard
          title="Total Drivers"
          value={systemStats.totalDrivers}
          icon="userCheck"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100 dark:bg-purple-900/30"
        />
      </div>

      {/* Tabs */}
      <Card variant="bordered">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => activeTab === "organizations" ? setShowOrgModal(true) : setShowUserModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add {activeTab === "organizations" ? "Organization" : "User"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Organizations Table */}
      {activeTab === "organizations" && isSaaSAdmin && (
        <Card variant="bordered" className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Vehicles</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrganizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No organizations found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrganizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {org.name}
                          </p>
                          <p className="text-sm text-gray-500">{org.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          subscriptionColors[org.subscription as keyof typeof subscriptionColors] ||
                          "default"
                        }
                      >
                        {org.subscription}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusColors[org.status as keyof typeof statusColors] || "default"}
                      >
                        {org.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{org._count.users}</TableCell>
                    <TableCell>{org._count.vehicles}</TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu
                        items={[
                          {
                            label: "View Details",
                            icon: <Eye className="w-4 h-4" />,
                            onClick: () => toast.info(`Viewing ${org.name}`),
                          },
                          {
                            label: "Edit Organization",
                            icon: <Edit className="w-4 h-4" />,
                            onClick: () => setEditingOrg(org),
                          },
                          {
                            label: "Delete Organization",
                            icon: <Trash2 className="w-4 h-4" />,
                            onClick: () => setDeletingOrg(org),
                            variant: "danger" as const,
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Users Table */}
      {activeTab === "users" && (
        <Card variant="bordered" className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                {isSaaSAdmin && <TableHead>Organization</TableHead>}
                <TableHead>Last Login</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSaaSAdmin ? 7 : 6} className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No users found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-600">
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={roleColors[user.role as keyof typeof roleColors] || "default"}
                        size="sm"
                      >
                        {user.role.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusColors[user.status as keyof typeof statusColors] || "default"}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    {isSaaSAdmin && (
                      <TableCell className="text-gray-500">
                        {user.organization?.name || "N/A"}
                      </TableCell>
                    )}
                    <TableCell className="text-gray-500">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu
                        items={[
                          {
                            label: "View Profile",
                            icon: <Eye className="w-4 h-4" />,
                            onClick: () => toast.info(`Viewing ${user.firstName} ${user.lastName}`),
                          },
                          {
                            label: "Edit User",
                            icon: <UserCog className="w-4 h-4" />,
                            onClick: () => setEditingUser(user),
                          },
                          {
                            label: user.status === "active" ? "Deactivate User" : "Activate User",
                            icon: <UserX className="w-4 h-4" />,
                            onClick: () => handleToggleUserStatus(user),
                          },
                          {
                            label: "Delete User",
                            icon: <Trash2 className="w-4 h-4" />,
                            onClick: () => setDeletingUser(user),
                            variant: "danger" as const,
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        isSaaSAdmin={isSaaSAdmin}
        organizations={organizations.map((org) => ({ id: org.id, name: org.name }))}
      />

      {/* Add Organization Modal */}
      {isSaaSAdmin && (
        <AddOrganizationModal
          isOpen={showOrgModal}
          onClose={() => setShowOrgModal(false)}
        />
      )}

      {/* Delete Organization Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingOrg}
        onClose={() => setDeletingOrg(null)}
        onConfirm={handleDeleteOrg}
        title="Delete Organization"
        message={`Are you sure you want to delete ${deletingOrg?.name}? This will remove all associated users, vehicles, and data. This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleteLoading}
      />

      {/* Delete User Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete ${deletingUser?.firstName} ${deletingUser?.lastName}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleteLoading}
      />

      {/* Edit Organization Modal */}
      {isSaaSAdmin && (
        <EditOrganizationModal
          isOpen={!!editingOrg}
          onClose={() => setEditingOrg(null)}
          organization={editingOrg}
        />
      )}

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        isSaaSAdmin={isSaaSAdmin}
      />
    </div>
  );
}
