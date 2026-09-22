import React from "react";
import { Card } from "./card";

export * from "./stat-card-grid";

export interface StatCardProps {
  label?: string;
  title?: string;
  value: string | number;
  currency?: string;
  unit?: string;
  description?: string;
  variant?: "default" | "highlight";
  className?: string;
}

export function StatCard({
  label,
  title,
  value,
  currency,
  unit,
  description,
  variant = "default",
  className = "",
}: StatCardProps) {
  const displayLabel = title || label || "";
  const displayUnit = unit || currency;

  // Split multi-word labels for clean 2-line layout unless single entity or specific exceptions
  const words = displayLabel.split(" ");
  const isMultiWord = words.length > 1 && displayLabel !== "NET PROFIT";

  return (
    <Card
      variant={variant}
      className={`p-4 sm:p-5 flex flex-col justify-between h-full min-h-[142px] transition-all ${
        variant === "highlight"
          ? "bg-[#edf3f8] border-[#d4e2ed] shadow-2xs"
          : "bg-white border-gray-200/90 shadow-2xs"
      } ${className}`}
    >
      <div>
        <div className="min-h-[28px] flex flex-col justify-start">
          {isMultiWord ? (
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-[1.25]">
              {words[0]}
              <br />
              {words.slice(1).join(" ")}
            </p>
          ) : (
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-[1.25]">
              {displayLabel}
            </p>
          )}
        </div>

        <div className="flex flex-col mt-2.5">
          {displayUnit && (
            <span className="text-xs font-bold text-gray-900 tracking-wide uppercase leading-tight">
              {displayUnit}
            </span>
          )}
          <span className="text-2xl sm:text-[26px] font-extrabold text-gray-900 tracking-tight leading-none mt-1">
            {value}
          </span>
        </div>
      </div>

      {description && (
        <p className="text-[11px] text-gray-500 mt-3 leading-snug font-normal">
          {description}
        </p>
      )}
    </Card>
  );
}
