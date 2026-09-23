import React from "react";
import { Skeleton } from "../skeleton";

export interface StatementSkeletonProps {
  twoColumn?: boolean;
  sectionsCount?: number;
  rowsPerSection?: number;
  className?: string;
  animate?: boolean;
}

export function StatementSkeleton({
  twoColumn = false,
  sectionsCount = 3,
  rowsPerSection = 3,
  className = "",
  animate = true,
}: StatementSkeletonProps) {
  const renderColumn = (keyPrefix = "col") => (
    <div
      key={keyPrefix}
      className="w-full rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <Skeleton animate={animate} className="h-4 w-4 rounded" />
          <Skeleton animate={animate} className="h-4 w-48" />
        </div>
        <Skeleton animate={animate} className="h-3 w-32" />
      </div>

      {/* Content Sections */}
      <div className="p-5 space-y-5 text-xs">
        {Array.from({ length: sectionsCount }).map((_, sIdx) => (
          <div
            key={sIdx}
            className={`space-y-3 ${
              sIdx > 0 ? "pt-3 border-t border-gray-100" : ""
            }`}
          >
            {/* Section label */}
            <Skeleton animate={animate} className="h-3 w-36" />

            {/* Line items */}
            <div className="space-y-2 pl-2">
              {Array.from({ length: rowsPerSection }).map((_, rIdx) => (
                <div key={rIdx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton
                      animate={animate}
                      className="h-2 w-2 rounded-full"
                    />
                    <Skeleton animate={animate} className="h-3 w-40" />
                  </div>
                  <Skeleton animate={animate} className="h-3 w-20" />
                </div>
              ))}
            </div>

            {/* Subtotal Box */}
            <div className="h-9 px-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
              <Skeleton animate={animate} className="h-3 w-28" />
              <Skeleton animate={animate} className="h-3.5 w-24" />
            </div>
          </div>
        ))}

        {/* Highlighted bottom total banner */}
        <div className="p-4 rounded-lg bg-[#edf3f8] border border-[#d4e2ed] flex items-center justify-between mt-4">
          <Skeleton animate={animate} className="h-3.5 w-32" />
          <Skeleton animate={animate} className="h-5 w-28" />
        </div>
      </div>
    </div>
  );

  if (twoColumn) {
    return (
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}
        aria-busy="true"
        aria-label="Loading financial statement"
      >
        {renderColumn("col-1")}
        {renderColumn("col-2")}
      </div>
    );
  }

  return (
    <div
      className={className}
      aria-busy="true"
      aria-label="Loading financial statement"
    >
      {renderColumn("col-single")}
    </div>
  );
}
