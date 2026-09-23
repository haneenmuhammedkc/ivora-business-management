import React from "react";
import { Skeleton } from "../skeleton";

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  showPagination?: boolean;
  className?: string;
  animate?: boolean;
}

export function TableSkeleton({
  rows = 5,
  columns = 6,
  showHeader = true,
  showPagination = true,
  className = "",
  animate = true,
}: TableSkeletonProps) {
  const colArray = Array.from({ length: columns });
  const rowArray = Array.from({ length: rows });

  return (
    <div
      className={`w-full overflow-hidden rounded-lg border border-gray-200/90 bg-white ${className}`}
      aria-busy="true"
      aria-label="Loading table data"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-900">
          {showHeader && (
            <thead className="bg-[#f8fafc] border-b border-gray-200">
              <tr>
                {colArray.map((_, colIdx) => (
                  <th key={colIdx} className="px-4 py-3">
                    <Skeleton
                      animate={animate}
                      className={`h-3 ${
                        colIdx === 0
                          ? "w-24"
                          : colIdx === columns - 1
                          ? "w-16 ml-auto"
                          : "w-20"
                      }`}
                    />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-gray-100 bg-white">
            {rowArray.map((_, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50/50">
                {colArray.map((_, colIdx) => (
                  <td key={colIdx} className="px-4 py-3.5">
                    <Skeleton
                      animate={animate}
                      className={`h-3.5 ${
                        colIdx === 0
                          ? "w-28"
                          : colIdx === 1
                          ? "w-20"
                          : colIdx === columns - 1
                          ? "w-14 ml-auto"
                          : "w-16"
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Skeleton animate={animate} className="h-3 w-36" />
            <span className="text-gray-300">•</span>
            <Skeleton animate={animate} className="h-3 w-24" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton animate={animate} className="h-6 w-14 rounded" />
            <Skeleton animate={animate} className="h-6 w-6 rounded" />
            <Skeleton animate={animate} className="h-6 w-14 rounded" />
          </div>
        </div>
      )}
    </div>
  );
}
