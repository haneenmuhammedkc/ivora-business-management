import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  animate?: boolean;
  className?: string;
}

export function Skeleton({
  animate = true,
  className = "",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={`rounded-md bg-gray-200/75 motion-reduce:animate-none ${
        animate ? "animate-pulse" : ""
      } ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}
