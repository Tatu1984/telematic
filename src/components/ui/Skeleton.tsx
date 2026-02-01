"use client";

import { memo } from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

export const Skeleton = memo(function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
  animation = "pulse",
}: SkeletonProps) {
  const baseClasses = "bg-gray-200 dark:bg-gray-700";

  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "",
    rounded: "rounded-lg",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-shimmer",
    none: "",
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
});

// Card skeleton for dashboard cards
export const CardSkeleton = memo(function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="text" width={120} height={20} animation="none" />
        <Skeleton variant="circular" width={40} height={40} animation="none" />
      </div>
      <Skeleton variant="text" width={80} height={32} animation="none" className="mb-2" />
      <Skeleton variant="text" width={100} height={16} animation="none" />
    </div>
  );
});

// Table skeleton for data tables
export const TableSkeleton = memo(function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden animate-pulse">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Skeleton variant="text" width={200} height={24} animation="none" />
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <Skeleton variant="circular" width={40} height={40} animation="none" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="60%" height={16} animation="none" />
              <Skeleton variant="text" width="40%" height={14} animation="none" />
            </div>
            <Skeleton variant="rounded" width={80} height={28} animation="none" />
          </div>
        ))}
      </div>
    </div>
  );
});

// Chart skeleton for analytics
// Pre-computed heights for deterministic rendering
const chartBarHeights = [65, 80, 45, 70, 55, 90, 60, 75, 50, 85, 40, 95];

export const ChartSkeleton = memo(function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
      <Skeleton variant="text" width={150} height={24} animation="none" className="mb-4" />
      <div className="h-64 flex items-end gap-2">
        {chartBarHeights.map((height, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            width="100%"
            height={`${height}%`}
            animation="none"
            className="flex-1"
          />
        ))}
      </div>
    </div>
  );
});

// Map skeleton
export const MapSkeleton = memo(function MapSkeleton() {
  return (
    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-[600px] animate-pulse flex items-center justify-center">
      <div className="text-center">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">Loading map...</p>
      </div>
    </div>
  );
});

// Stats grid skeleton for dashboard
export const StatsGridSkeleton = memo(function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
});

export default Skeleton;
