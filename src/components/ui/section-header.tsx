import React from "react";
import { Badge } from "./badge";

export interface SectionHeaderProps {
  title: string;
  badge?: string | React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  badge,
  subtitle,
  actions,
  className = "",
}: SectionHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mb-3.5 ${className}`}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider">
            {title}
          </h2>
          {badge && typeof badge === "string" ? (
            <Badge variant="count">{badge}</Badge>
          ) : (
            badge
          )}
        </div>
        {subtitle && (
          <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
