import React from "react";
import { StaggerContainer } from "./motion";

export interface StatCardGridProps {
  children: React.ReactNode;
  className?: string;
  staggerInterval?: number;
  delayChildren?: number;
}

export function StatCardGrid({
  children,
  className = "",
  staggerInterval = 0.04,
  delayChildren = 0.06,
}: StatCardGridProps) {
  return (
    <StaggerContainer
      staggerInterval={staggerInterval}
      delayChildren={delayChildren}
      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 ${className}`}
    >
      {children}
    </StaggerContainer>
  );
}
