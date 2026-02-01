"use client";

import React from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Marketing header could go here */}
      <ErrorBoundary>
        <main>{children}</main>
      </ErrorBoundary>
      {/* Marketing footer could go here */}
    </div>
  );
}

export default MarketingLayout;
