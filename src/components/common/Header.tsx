"use client";

import { Bell, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="lg:ml-0 ml-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-10"
              />
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <NotificationItem
                    type="warning"
                    title="Speeding Alert"
                    message="Vehicle TRK-001 exceeded speed limit"
                    time="2 min ago"
                  />
                  <NotificationItem
                    type="info"
                    title="ELD Update"
                    message="Driver John Smith started driving"
                    time="15 min ago"
                  />
                  <NotificationItem
                    type="danger"
                    title="Geofence Alert"
                    message="Vehicle TRK-003 left warehouse zone"
                    time="1 hour ago"
                  />
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 text-center">
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

interface NotificationItemProps {
  type: "info" | "warning" | "danger" | "success";
  title: string;
  message: string;
  time: string;
}

function NotificationItem({ type, title, message, time }: NotificationItemProps) {
  const colors = {
    info: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    warning: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
    danger: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    success: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  };

  return (
    <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 mt-2 rounded-full ${colors[type]}`}></div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {title}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {message}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{time}</p>
        </div>
      </div>
    </div>
  );
}
