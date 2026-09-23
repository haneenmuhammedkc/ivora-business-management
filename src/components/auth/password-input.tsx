"use client";

import React, { useState } from "react";
import { LockIcon, EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";

export interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "id"> {
  id: string;
  label?: string;
  labelRight?: React.ReactNode;
  error?: string;
  helperText?: string;
  className?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      id,
      label = "PASSWORD",
      labelRight,
      error,
      helperText,
      className = "",
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="space-y-1.5">
        {(label || labelRight) && (
          <div className="flex items-center justify-between">
            {label && (
              <label
                htmlFor={id}
                className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider"
              >
                {label}
              </label>
            )}
            {labelRight}
          </div>
        )}

        <div className="relative">
          <Input
            ref={ref}
            id={id}
            type={showPassword ? "text" : "password"}
            icon={<LockIcon size={16} />}
            iconPosition="left"
            className={`bg-white py-2.5 pr-10 ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""} ${className}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer select-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
          </button>
        </div>

        {error ? (
          <p className="text-[11px] font-medium text-red-600 mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-gray-500 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
