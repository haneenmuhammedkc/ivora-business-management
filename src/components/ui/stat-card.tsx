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
  // Split 2-word labels into distinct lines if appropriate for clean alignment (e.g. "TOTAL INVESTMENT" -> "TOTAL" \n "INVESTMENT")
  const words = label.split(" ");
  const isMultiWord = words.length > 1 && label !== "NET PROFIT";

  return (
    <Card
      variant={variant}
      className={`p-4 sm:p-5 flex flex-col justify-between min-h-[142px] transition-all ${
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
              {label}
            </p>
          )}
        </div>

        <div className="flex flex-col mt-2.5">
          {currency && (
            <span className="text-xs font-bold text-gray-900 tracking-wide uppercase leading-tight">
              {currency}
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
