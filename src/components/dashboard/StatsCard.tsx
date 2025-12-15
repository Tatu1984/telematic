"use client";

import { Card } from "@/components/ui";
import {
  Truck,
  Users,
  MapPin,
  AlertTriangle,
  Route,
  Fuel,
  Clock,
  DollarSign,
  Shield,
  TrendingUp,
  BarChart3,
  Bell,
  Circle,
  Building2,
  UserCheck,
  CheckCircle,
  AlertCircle,
  User,
} from "lucide-react";

const iconMap = {
  truck: Truck,
  users: Users,
  mapPin: MapPin,
  alertTriangle: AlertTriangle,
  route: Route,
  fuel: Fuel,
  clock: Clock,
  dollarSign: DollarSign,
  shield: Shield,
  trendingUp: TrendingUp,
  barChart3: BarChart3,
  bell: Bell,
  circle: Circle,
  building2: Building2,
  userCheck: UserCheck,
  checkCircle: CheckCircle,
  alertCircle: AlertCircle,
  user: User,
} as const;

export type IconName = keyof typeof iconMap;

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
  icon: IconName;
  iconColor?: string;
  iconBgColor?: string;
}

export function StatsCard({
  title,
  value,
  change,
  icon,
  iconColor = "text-blue-600",
  iconBgColor = "bg-blue-100 dark:bg-blue-900/30",
}: StatsCardProps) {
  const Icon = iconMap[icon];

  return (
    <Card variant="bordered">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {change && (
            <p
              className={`mt-2 text-sm font-medium ${
                change.type === "increase"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {change.type === "increase" ? "+" : "-"}
              {Math.abs(change.value)}%
              <span className="text-gray-500 dark:text-gray-400 ml-1">
                vs last week
              </span>
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBgColor}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </Card>
  );
}
