"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SessionUser } from "@/types";
import {
  LayoutDashboard,
  Truck,
  Users,
  Map,
  Clock,
  AlertTriangle,
  BarChart3,
  MapPin,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

interface SidebarProps {
  user: SessionUser;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/tracking",
    label: "Live Tracking",
    icon: Map,
  },
  {
    href: "/vehicles",
    label: "Vehicles",
    icon: Truck,
    roles: ["saas_admin", "company_admin", "fleet_manager"],
  },
  {
    href: "/drivers",
    label: "Drivers",
    icon: Users,
    roles: ["saas_admin", "company_admin", "fleet_manager"],
  },
  {
    href: "/eld",
    label: "ELD Compliance",
    icon: Clock,
  },
  {
    href: "/incidents",
    label: "Incidents",
    icon: AlertTriangle,
  },
  {
    href: "/geofences",
    label: "Geofences",
    icon: MapPin,
    roles: ["saas_admin", "company_admin", "fleet_manager"],
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    roles: ["saas_admin", "saas_subscriber_manager", "company_admin", "fleet_manager"],
  },
  {
    href: "/admin",
    label: "Admin Panel",
    icon: Shield,
    roles: ["saas_admin", "saas_subscriber_manager", "company_admin"],
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user.role)
  );

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 px-4 py-6 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <Truck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            FleetTrack Pro
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {user.organizationName || "Platform Admin"}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {user.firstName[0]}
              {user.lastName[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 transform transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex flex-col h-full">
          <NavContent />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
        <NavContent />
      </aside>
    </>
  );
}
