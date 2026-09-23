import React from "react";
import { InboxIcon } from "./icons";
import { Card } from "./card";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  variant?: "card" | "plain" | "dashed";
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  variant = "card",
  className = "",
}: EmptyStateProps) {
  const defaultIcon = (
    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-50 border border-gray-200/90 text-gray-400">
      <InboxIcon size={22} />
    </div>
  );

  const content = (
    <div
      className={`flex flex-col items-center justify-center text-center py-10 sm:py-14 px-4 sm:px-6 ${
        variant === "plain" ? className : ""
      }`}
      role="status"
    >
      {/* Icon slot */}
      <div className="mb-3.5">
        {icon || defaultIcon}
      </div>

      {/* Title */}
      <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {/* Action buttons slot */}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );

  if (variant === "card") {
    return (
      <Card className={`w-full bg-white border border-gray-200/90 shadow-2xs ${className}`}>
        {content}
      </Card>
    );
  }

  if (variant === "dashed") {
    return (
      <div
        className={`w-full rounded-xl border-2 border-dashed border-gray-200/90 bg-gray-50/40 ${className}`}
      >
        {content}
      </div>
    );
  }

  return content;
}
