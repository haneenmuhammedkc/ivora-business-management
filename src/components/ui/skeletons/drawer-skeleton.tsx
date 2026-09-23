import React from "react";
import { Skeleton } from "../skeleton";

export interface DrawerSkeletonProps {
  className?: string;
  animate?: boolean;
}

export function DrawerSkeleton({
  className = "",
  animate = true,
}: DrawerSkeletonProps) {
  return (
    <div
      className={`w-full rounded-xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-6 ${className}`}
      aria-busy="true"
      aria-label="Loading details panel"
    >
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-gray-100">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton animate={animate} className="h-5 w-40" />
            <Skeleton animate={animate} className="h-5 w-16 rounded" />
          </div>
          <Skeleton animate={animate} className="h-2.5 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton animate={animate} className="h-6 w-6 rounded" />
          <Skeleton animate={animate} className="h-6 w-6 rounded" />
        </div>
      </div>

      {/* Section 1: Top Metrics Grid */}
      <div className="space-y-3">
        <Skeleton animate={animate} className="h-2.5 w-36" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-gray-50 border border-gray-200/80 space-y-2"
            >
              <Skeleton animate={animate} className="h-2 w-20" />
              <Skeleton animate={animate} className="h-4 w-24" />
              <Skeleton animate={animate} className="h-2 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Financial Breakdown Box */}
      <div className="space-y-3">
        <Skeleton animate={animate} className="h-2.5 w-44" />
        <div className="p-4 rounded-lg bg-[#edf3f8] border border-[#d4e2ed] space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton animate={animate} className="h-3 w-32" />
            <Skeleton animate={animate} className="h-4 w-20" />
          </div>
          <div className="space-y-1.5 pt-2 border-t border-[#d4e2ed]/60">
            <div className="flex items-center justify-between">
              <Skeleton animate={animate} className="h-2.5 w-24" />
              <Skeleton animate={animate} className="h-2.5 w-16" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton animate={animate} className="h-2.5 w-28" />
              <Skeleton animate={animate} className="h-2.5 w-16" />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Audit Trail / Line items */}
      <div className="space-y-3">
        <Skeleton animate={animate} className="h-2.5 w-32" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-gray-100 flex items-center justify-between"
            >
              <div className="space-y-1">
                <Skeleton animate={animate} className="h-3 w-32" />
                <Skeleton animate={animate} className="h-2.5 w-20" />
              </div>
              <Skeleton animate={animate} className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
