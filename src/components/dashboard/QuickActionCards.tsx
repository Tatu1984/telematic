"use client";

import Link from "next/link";
import { Card } from "@/components/ui";
import { MapPin, Clock, AlertTriangle, Route } from "lucide-react";

const quickActions = [
  {
    href: "/tracking",
    icon: MapPin,
    title: "Live Tracking",
    description: "Track vehicles in real-time",
    color: "blue" as const,
  },
  {
    href: "/eld",
    icon: Clock,
    title: "ELD Logs",
    description: "Hours of service compliance",
    color: "green" as const,
  },
  {
    href: "/incidents",
    icon: AlertTriangle,
    title: "Incidents",
    description: "Manage safety incidents",
    color: "yellow" as const,
  },
  {
    href: "/analytics",
    icon: Route,
    title: "Analytics",
    description: "Fleet performance insights",
    color: "purple" as const,
  },
];

const colors = {
  blue: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600",
  green:
    "bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-600",
  yellow:
    "bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 text-yellow-600",
  purple:
    "bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-600",
  red: "bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600",
};

export function QuickActionCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {quickActions.map((action) => {
        const Icon = action.icon;
        return (
          <Link key={action.href} href={action.href}>
            <Card
              variant="bordered"
              className={`${colors[action.color]} border-transparent transition-colors cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-8 h-8" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {action.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {action.description}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
