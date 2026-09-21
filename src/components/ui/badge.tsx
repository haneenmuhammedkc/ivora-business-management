import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "active"
    | "completed"
    | "cleared"
    | "pending"
    | "in-progress"
    | "draft"
    | "outline"
    | "neutral"
    | "count"
    | "tag";
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = "neutral",
  className = "",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold uppercase tracking-wider text-[10px] select-none";

  const variantStyles: Record<string, string> = {
    active: "bg-[#0c0d12] text-white px-2 py-0.5 rounded",
    completed: "bg-[#0c0d12] text-white px-2 py-0.5 rounded",
    cleared: "bg-white border border-gray-900 text-gray-900 px-2 py-0.5 rounded font-bold",
    "in-progress": "bg-gray-100 border border-gray-300 text-gray-700 px-2 py-0.5 rounded",
    pending: "bg-gray-100 border border-gray-300 text-gray-700 px-2 py-0.5 rounded",
    draft: "bg-transparent border border-dashed border-gray-400 text-gray-500 px-2 py-0.5 rounded",
    outline: "bg-transparent border border-gray-300 text-gray-700 px-2 py-0.5 rounded",
    neutral: "bg-gray-100 text-gray-700 px-2 py-0.5 rounded",
    count: "bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded normal-case font-normal text-xs",
    tag: "bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded text-[9px] font-bold",
  };

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.neutral} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
