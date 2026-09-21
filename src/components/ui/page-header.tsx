import React from "react";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  withBorder?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  withBorder = false,
  className = "",
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
        withBorder ? "pb-6 border-b border-gray-100" : ""
      } ${className}`}
    >
      <div>
        <h1 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs font-semibold text-gray-500 mt-1 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
