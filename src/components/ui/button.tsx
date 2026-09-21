import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "pill-dark";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon,
      iconPosition = "left",
      className = "",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none";

    const variantStyles: Record<string, string> = {
      primary:
        "bg-[#0c0d12] text-white hover:bg-[#1e222d] focus-visible:ring-gray-900 shadow-xs",
      secondary:
        "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-gray-400 shadow-xs",
      outline:
        "bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400",
      ghost:
        "bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-300",
      danger:
        "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
      "pill-dark":
        "bg-[#0c0d12] text-white hover:bg-[#1e222d] rounded-full focus-visible:ring-gray-900 shadow-xs",
    };

    const sizeStyles: Record<string, string> = {
      sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
      md: "h-9 px-4 text-xs font-semibold gap-2 rounded-md",
      lg: "h-11 px-5 text-sm font-semibold gap-2.5 rounded-md",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${
          sizeStyles[size] || sizeStyles.md
        } ${className}`}
        {...props}
      >
        {icon && iconPosition === "left" && <span className="inline-flex shrink-0">{icon}</span>}
        {children}
        {icon && iconPosition === "right" && <span className="inline-flex shrink-0">{icon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
