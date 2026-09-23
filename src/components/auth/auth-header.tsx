import React from "react";

export interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  className?: string;
}

export function AuthHeader({
  title,
  subtitle,
  badge,
  className = "",
}: AuthHeaderProps) {
  return (
    <div className={`text-left mb-8 ${className}`}>
      {badge && <div className="mb-3">{badge}</div>}
      <h1 className="text-3xl font-extrabold tracking-tight text-[#0c0d12]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
