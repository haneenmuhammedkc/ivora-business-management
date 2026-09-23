import React from "react";
import { Card } from "../card";
import { Skeleton } from "../skeleton";

export interface CardGridSkeletonProps {
  count?: number;
  className?: string;
  cardClassName?: string;
  animate?: boolean;
}

export function CardGridSkeleton({
  count = 6,
  className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5",
  cardClassName = "",
  animate = true,
}: CardGridSkeletonProps) {
  const cards = Array.from({ length: count });

  return (
    <div className={className} aria-busy="true" aria-label="Loading cards">
      {cards.map((_, idx) => (
        <Card
          key={idx}
          className={`p-5 space-y-4 bg-white border border-gray-200/90 shadow-2xs ${cardClassName}`}
        >
          {/* Card Header: Title + Badge */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton animate={animate} className="h-4 w-32" />
              <Skeleton animate={animate} className="h-3 w-44" />
            </div>
            <Skeleton animate={animate} className="h-5 w-16 rounded" />
          </div>

          {/* Card Metrics */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
            <div className="space-y-1">
              <Skeleton animate={animate} className="h-2.5 w-16" />
              <Skeleton animate={animate} className="h-4 w-20" />
            </div>
            <div className="space-y-1">
              <Skeleton animate={animate} className="h-2.5 w-16" />
              <Skeleton animate={animate} className="h-4 w-20" />
            </div>
          </div>

          {/* Card Footer */}
          <div className="pt-2 flex items-center justify-between">
            <Skeleton animate={animate} className="h-3 w-24" />
            <Skeleton animate={animate} className="h-3 w-16" />
          </div>
        </Card>
      ))}
    </div>
  );
}
