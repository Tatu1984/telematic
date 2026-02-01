"use client";

import React from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardErrorBoundary } from "@/components/DashboardErrorBoundary";
import type { SessionUser } from "@/types";

interface AdminLayoutProps {
  children: React.ReactNode;
  user: SessionUser;
}

export function AdminLayout({ children, user }: AdminLayoutProps) {
  // Admin layout uses the same structure as dashboard
  // but could be customized with admin-specific features
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar user={user} />
      <div className="lg:pl-72">
        <main className="min-h-screen">
          <DashboardErrorBoundary>
            {children}
          </DashboardErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
