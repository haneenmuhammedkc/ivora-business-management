import React from "react";
import { Card } from "./card";

export interface StatCardProps {
  label: string;
  value: string | number;
  currency?: string;
  description?: string;
  variant?: "default" | "highlight";
  className?: string;
}

export function StatCard({
  label,
  value,
  currency,
  description,
  variant = "default",
  className = "",
}: StatCardProps) {
  return (
    <Card variant={variant} className={`p-4 sm:p-5 flex flex-col justify-between ${className}`}>
      <div>
        <p className="text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
          {label}
        </p>
        <div className="flex flex-col">
          {currency && (
            <span className="text-[11px] font-bold text-gray-900 tracking-wide uppercase">
              {currency}
            </span>
          )}
          <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-none mt-0.5">
            {value}
          </span>
        </div>
      </div>
      {description && (
        <p className="text-[11px] text-gray-500 mt-3.5 leading-snug">
          {description}
        </p>
      )}
    </Card>
  );
}
