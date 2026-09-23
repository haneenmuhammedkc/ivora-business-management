import React from "react";
import { Card } from "../card";
import { Skeleton } from "../skeleton";

export interface StatCardSkeletonProps {
  variant?: "default" | "highlight";
  className?: string;
  animate?: boolean;
}

export function StatCardSkeleton({
  variant = "default",
  className = "",
  animate = true,
}: StatCardSkeletonProps) {
  return (
    <Card
      variant={variant}
      className={`p-4 sm:p-5 flex flex-col justify-between h-full min-h-[142px] ${
        variant === "highlight"
          ? "bg-[#edf3f8] border-[#d4e2ed] shadow-2xs"
          : "bg-white border-gray-200/90 shadow-2xs"
      } ${className}`}
    >
      <div>
        {/* Label placeholder: 2-line badge style */}
        <div className="min-h-[28px] space-y-1.5">
          <Skeleton animate={animate} className="h-2.5 w-20" />
          <Skeleton animate={animate} className="h-2.5 w-14" />
        </div>

        {/* Unit & Value */}
        <div className="flex flex-col mt-2.5 space-y-1.5">
          <Skeleton animate={animate} className="h-3 w-8" />
          <Skeleton animate={animate} className="h-7 sm:h-8 w-28" />
        </div>
      </div>

      {/* Description */}
      <div className="mt-3">
        <Skeleton animate={animate} className="h-2.5 w-36" />
      </div>
    </Card>
  );
}
