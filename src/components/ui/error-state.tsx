import React from "react";
import { AlertTriangleIcon, RefreshCwIcon } from "./icons";
import { Button } from "./button";
import { Card } from "./card";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: "card" | "banner" | "plain";
  className?: string;
}

export function ErrorState({
  title = "Unable to load data",
  description = "An unexpected error occurred while processing your request. Please try again.",
  icon,
  action,
  secondaryAction,
  onRetry,
  retryLabel = "Retry",
  variant = "card",
  className = "",
}: ErrorStateProps) {
  const defaultIcon = (
    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 border border-red-200/80 text-red-600">
      <AlertTriangleIcon size={22} />
    </div>
  );

  const defaultRetryAction = onRetry ? (
    <Button
      variant="secondary"
      size="sm"
      icon={<RefreshCwIcon size={14} />}
      onClick={onRetry}
    >
      {retryLabel}
    </Button>
  ) : null;

  // Banner variant for inline warnings / table headers
  if (variant === "banner") {
    return (
      <div
        className={`w-full p-4 rounded-lg bg-red-50/70 border border-red-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}
        role="alert"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-red-100/80 text-red-600 shrink-0">
            <AlertTriangleIcon size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-red-950">{title}</h4>
            {description && (
              <p className="text-[11px] text-red-700 mt-0.5">{description}</p>
            )}
          </div>
        </div>

        {(action || defaultRetryAction || secondaryAction) && (
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {action || defaultRetryAction}
            {secondaryAction}
          </div>
        )}
      </div>
    );
  }

  const content = (
    <div
      className={`flex flex-col items-center justify-center text-center py-10 sm:py-14 px-4 sm:px-6 ${
        variant === "plain" ? className : ""
      }`}
      role="alert"
    >
      {/* Icon */}
      <div className="mb-3.5">
        {icon || defaultIcon}
      </div>

      {/* Title */}
      <h3 className="text-sm sm:text-base font-bold text-gray-950 tracking-tight">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-md leading-relaxed">
          {description}
        </p>
      )}

      {/* Action buttons slot */}
      {(action || defaultRetryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
          {action || defaultRetryAction}
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

  return content;
}
